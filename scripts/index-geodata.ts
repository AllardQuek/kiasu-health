// scripts/index-geojson.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from '@elastic/elasticsearch';
import { KmlToGeojson } from 'kml-to-geojson';

// Load .env.local by default (Next.js convention). Override with DOTENV_CONFIG_PATH.
dotenv.config({ path: path.resolve(process.cwd(), process.env.DOTENV_CONFIG_PATH ?? '.env.local') });

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL ?? process.env.ES_URL;
const ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY ?? process.env.ES_API_KEY;
const INDEX_PREFIX = process.env.ES_INDEX_NAME || 'maps-geojson';

if (!ELASTICSEARCH_URL || !ELASTICSEARCH_API_KEY) {
  console.error('Missing Elastic config: set ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY (or ES_URL / ES_API_KEY)');
  process.exit(1);
}

const client = new Client({
  node: ELASTICSEARCH_URL,
  auth: { apiKey: ELASTICSEARCH_API_KEY },
} as any);

type GeoJSONGeometry = {
  type: string;
  coordinates: any;
};

type GeoJSONFeature = {
  id?: string | number;
  type: 'Feature';
  geometry: GeoJSONGeometry | null;
  properties?: Record<string, any>;
};

type GeoJSONFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
};

function indexNameForFile(filePath: string) {
  const base = path.basename(filePath, path.extname(filePath));
  const safe = base.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/^-+|-+$/g, '');
  return `${INDEX_PREFIX}-${safe}`;
}

async function indexExists(indexName: string): Promise<boolean> {
  try {
    const res = await client.indices.exists({ index: indexName }) as any;
    if (typeof res === 'boolean') return res;
    if (res && typeof res.body === 'boolean') return res.body;
    return !!res;
  } catch (err) {
    return false;
  }
}

async function ensureIndex(indexName: string): Promise<boolean> {
  const exists = await indexExists(indexName);
  if (exists) {
    console.log(`Index already exists: ${indexName}`);
    return false;
  }

  await (client.indices.create as any)({
    index: indexName,
    mappings: {
      properties: {
        geometry: { type: 'geo_shape' }, // use geo_point if you only have Points
        source_file: { type: 'keyword' },
        source_type: { type: 'keyword' },
      },
    },
  });
  console.log(`Created index: ${indexName}`);
  return true;
}

function loadGeoJSON(filePath: string): GeoJSONFeatureCollection {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function loadKmlAsGeoJSON(filePath: string): GeoJSONFeatureCollection {
  const kmlContent = fs.readFileSync(filePath, 'utf8');
  try {
    const parser = new KmlToGeojson();
    const parsed = parser.parse(kmlContent) as any;
    const geojson = parsed?.geojson ?? parsed;
    if (!geojson || !Array.isArray(geojson.features)) throw new Error('KML conversion did not return a FeatureCollection');
    return geojson as GeoJSONFeatureCollection;
  } catch (err) {
    console.error(`Failed to convert KML file ${filePath}:`, err);
    throw err;
  }
}

async function bulkIndexFile(filePath: string) {
  const fileName = path.basename(filePath);
  const indexName = indexNameForFile(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // 1) Parse / convert first — fail fast before touching Elastic
  let fc: GeoJSONFeatureCollection;
  let sourceType = 'geojson';
  try {
    if (ext === '.kml') {
      fc = loadKmlAsGeoJSON(filePath);
      sourceType = 'kml';
    } else {
      fc = loadGeoJSON(filePath);
    }
  } catch (err) {
    console.error(`Skipping ${fileName}: failed to parse/convert:`, err);
    return;
  }

  if (!fc || !Array.isArray(fc.features) || fc.features.length === 0) {
    console.log(`Skipping ${fileName}: no indexable features`);
    return;
  }

  // 2) If index exists, check counts or honor FORCE_REINDEX
  const exists = await indexExists(indexName);
  if (exists) {
    let existingCount = -1;
    try {
      const cnt: any = await client.count({ index: indexName } as any);
      existingCount = typeof cnt?.body?.count === 'number' ? cnt.body.count : (cnt?.count ?? -1);
    } catch (e) {
      // ignore count errors
    }

    if (existingCount === fc.features.length) {
      console.log(`Skipping ${fileName}: index ${indexName} already exists with ${existingCount} docs`);
      return;
    }

    if (process.env.FORCE_REINDEX) {
      console.log(`FORCE_REINDEX set — deleting existing index ${indexName}`);
      try {
        await (client.indices.delete as any)({ index: indexName });
      } catch (err) {
        console.error(`Failed to delete index ${indexName}:`, err);
        throw err;
      }
    } else {
      console.warn(
        `Index ${indexName} exists (${existingCount} docs vs ${fc.features.length}). ` +
          `Set FORCE_REINDEX=1 to force reindexing.`
      );
      return;
    }
  }

  // 3) Create index and bulk-index in batches
  await ensureIndex(indexName);
  const BATCH_DOCS = Number(process.env.BULK_BATCH_DOCS ?? 500);
  let ops: any[] = [];
  let docCount = 0;

  for (let i = 0; i < fc.features.length; i++) {
    const feature = fc.features[i];
    if (!feature.geometry) continue;

    const doc = {
      ...(feature.properties || {}),
      geometry: feature.geometry,
      source_file: fileName,
      source_type: sourceType,
    };

    ops.push({ index: { _index: indexName, _id: feature.id ?? `${fileName}-${i}` } });
    ops.push(doc);
    docCount++;

    if (ops.length >= BATCH_DOCS * 2) {
      const resp = await client.bulk({ operations: ops, refresh: true } as any);
      if (resp?.errors) {
        const failed = (resp.items ?? []).filter((item: any) => {
          const op = item.index || item.create || item.update || item.delete;
          return op && op.error;
        });
        console.error(`File ${fileName}: batch had ${failed.length} failed items`);
      }
      ops = [];
    }
  }

  if (ops.length) {
    const resp = await client.bulk({ operations: ops, refresh: true } as any);
    if (resp?.errors) {
      const failed = (resp.items ?? []).filter((item: any) => {
        const op = item.index || item.create || item.update || item.delete;
        return op && op.error;
      });
      console.error(`File ${fileName}: final batch had ${failed.length} failed items`);
    }
  }

  console.log(`File ${fileName}: indexed ${docCount} features into ${indexName}`);
}

async function run() {
  const dir = path.resolve(process.cwd(), process.env.GEOJSON_DIR ?? 'data/geodata');
  if (!fs.existsSync(dir)) {
    console.error(`GeoJSON directory not found: ${dir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dir)
    .filter((f) =>
      f.toLowerCase().endsWith('.geojson') ||
      f.toLowerCase().endsWith('.json') ||
      f.toLowerCase().endsWith('.kml')
    )
    .map((f) => path.join(dir, f));

  for (const file of files) {
    console.log(`Indexing ${file} ...`);
    await bulkIndexFile(file);
  }

  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
