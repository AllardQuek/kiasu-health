// ─── Elastic Agent Builder Client ────────────────────────────────────────────
// A2A (agent-to-agent) architecture — two orchestrator agents:
//
//   HealthCoachAgent  (env: HEALTH_COACH_AGENT_ID)
//     ├─ A2A → MealAnalyzerAgent   (Amazon Bedrock Claude Haiku — configured in Kibana)
//     └─ A2A → DataAggregatorAgent  (reads Elastic trends via GET /api/trends/{player_id})
//     Tools: write_meal_score → POST /api/meal-score
//     Entry: bot /photo (auto after meal) + /coach (on-demand)
//
//   KiasuRefereeAgent  (env: REFEREE_AGENT_ID)
//     └─ A2A → DataAggregatorAgent  (all-player trends for richer narrative)
//     Tools: get_league_standings → GET /api/standings/{league_id}
//     Entry: POST /api/reveal (web reveal page)
//
// Kibana base URL = ELASTICSEARCH_URL with ".es." → ".kb."
// Invocation path (confirm on Prep Day in Kibana → Agent Builder → API settings):
//   {kibana_url}/api/elastic_agent_builder/agents/{agent_id}/execute
//
// Falls back to mock responses on any error — the demo NEVER crashes.

import type { AgentBuilderRequest, AgentBuilderResponse } from "./types";
import { MOCK_MEAL_RESULT } from "./mock";

// Derive Kibana URL from the Elasticsearch URL (same credentials work for both)
function getKibanaUrl(): string | undefined {
  const esUrl = process.env.ELASTICSEARCH_URL;
  if (!esUrl) return undefined;
  return esUrl.replace(".es.", ".kb.");
}

async function invokeAgent(
  agentId: string | undefined,
  agentLabel: "health_coach" | "referee",
  payload: AgentBuilderRequest
): Promise<AgentBuilderResponse> {
  const kibanaUrl = getKibanaUrl();
  const apiKey = process.env.ELASTICSEARCH_API_KEY;

  if (!kibanaUrl || !apiKey || !agentId) {
    console.warn(`[agent] ${agentLabel}: env var missing (KIBANA_URL=${!!kibanaUrl}, API_KEY=${!!apiKey}, AGENT_ID=${!!agentId}), using mock`);
    return buildMockResponse(agentLabel);
  }

  // ⚠️  Confirm exact invocation path in Kibana → Agent Builder → API settings on Prep Day
  const url = `${kibanaUrl}/api/elastic_agent_builder/agents/${agentId}/execute`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `ApiKey ${apiKey}`,
        "kbn-xsrf": "true",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      throw new Error(`Agent Builder responded ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as AgentBuilderResponse;
  } catch (err) {
    console.error(`[agent] ${agentLabel} invocation failed, using mock:`, err);
    return buildMockResponse(agentLabel);
  }
}

// ── Public entry points ───────────────────────────────────────────────────────

/**
 * Streams the conversation with an agent using the Kibana Conversation API.
 * Uses: POST {kibanaUrl}/api/agent_builder/agents/{agentId}/converse/async
 */
export async function* streamAgentConversation(
  agentId: string | undefined,
  text: string,
  sessionId?: string
): AsyncGenerator<string> {
  const esUrl = process.env.ELASTICSEARCH_URL;
  const apiKey = process.env.ELASTICSEARCH_API_KEY;

  if (!esUrl || !apiKey || !agentId) {
    console.warn(`[agent] Stream skipped: env missing (ELASTICSEARCH_URL=${!!esUrl}, API_KEY=${!!apiKey}, AGENT_ID=${!!agentId})`);
    yield "Alamak, I'm missing some API keys or Agent IDs. Check your .env setup!";
    return;
  }

  const kibanaUrl = esUrl.replace(".es.", ".kb.");
  // Endpoint updated based on user sample: /api/agent_builder/converse/async
  const url = `${kibanaUrl}/api/agent_builder/converse/async`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `ApiKey ${apiKey}`,
        "kbn-xsrf": "true",
      },
      body: JSON.stringify({
        input: text,        // Changed from { input: { text } } to match sample
        agent_id: agentId,  // agent_id is now in the body, not the URL
        conversation_id: sessionId, // Use sessionId as conversation_id
        stream: true,
      }),
    });

    if (!res.ok) throw new Error(`Agent stream failed: ${res.status}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error("ReadableStream not supported");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.trim() || !line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          // Elastic Agent Builder stream format: { delta: "..." } or { text: "..." }
          if (data.delta) yield data.delta;
          else if (data.text) yield data.text;
        } catch (e) {
          // Ignore parse errors for metadata/headers
        }
      }
    }
  } catch (err) {
    console.error("[agent] Stream failed:", err);
    yield "Sorry, my brain is a bit laggy right now. Try again later?";
  }
}

/**
 * HealthCoachAgent — personal meal analysis + coaching.
 * When photo_url is provided: A2A → MealAnalyzerAgent (Bedrock) for vision analysis.
 * Always: A2A → DataAggregatorAgent for trend context.
 * Triggered by: bot /photo (automatic post-meal) and /coach (on-demand).
 */
export async function callHealthCoachAgent(
  payload: AgentBuilderRequest
): Promise<AgentBuilderResponse> {
  return invokeAgent(process.env.HEALTH_COACH_AGENT_ID, "health_coach", payload);
}

/**
 * KiasuRefereeAgent — group-facing weekly judgment.
 * A2A → DataAggregatorAgent for all-player trend context in the reveal narrative.
 * Triggered by: POST /api/reveal (web reveal page).
 */
export async function callRefereeAgent(
  payload: AgentBuilderRequest
): Promise<AgentBuilderResponse> {
  return invokeAgent(process.env.REFEREE_AGENT_ID, "referee", payload);
}

// ── Mock fallbacks ────────────────────────────────────────────────────────────

function buildMockResponse(agentLabel: "health_coach" | "referee"): AgentBuilderResponse {
  if (agentLabel === "health_coach") {
    return {
      ...MOCK_MEAL_RESULT,
      message:
        `~${MOCK_MEAL_RESULT.calories} kcal, *${MOCK_MEAL_RESULT.balance_score}/10* for balance today.\n` +
        MOCK_MEAL_RESULT.tip +
        "\n\n_Your meal scores have been improving this week — keep it up lah!_",
      coaching_focus: "meal",
    } as AgentBuilderResponse;
  }

  return {
    standings_text:
      "🏆 *Week 10 Reveal — League Challenge*\n\n" +
      "#1 Wei Ming       77.4 pts  🏆 Kiasu Champion\n" +
      "#2 Ahmad          74.5 pts  📈 Most Improved\n" +
      "#3 Priya          65.4 pts  🥗 Healthy Kaki\n" +
      "#4 Siti           56.3 pts  🔥 Steady Lah\n\n" +
      "🎁 Wei Ming wins free healthier kopi this week ☕\n\n" +
      "Siti — steps were solid but meal balance dragged you down. Try lower-cal kopitiam options next week.",
    winner_name: "Wei Ming",
    nudge: "Your meal balance was weak this week. Try lower-cal kopitiam options next week.",
    reward: "Free healthier kopi for a week ☕",
  };
}
