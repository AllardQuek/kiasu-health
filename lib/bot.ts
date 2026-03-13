// ─── grammy Telegram Bot ──────────────────────────────────────────────────────
// Commands: /start, /join (onboarding), /photo (DM only), /ask (DM only), /reveal (group)
//
// Bot ↔ User flow:
//   Personal (1:1 DM): /join, /photo, /ask
//   Group (social):    /reveal → calls KiasuRefereeAgent, posts standings text + web link

import { Bot } from "grammy";
import { callHealthCoachAgent, callRefereeAgent, streamAgentConversation } from "./agent";
import { getPlayerByTelegramId, upsertPlayer, getLeagueByJoinCode } from "./elastic";
import { MOCK_STANDINGS, MOCK_MENTAIKO_SALMON, MOCK_ASK_RESPONSES } from "./mock";

const MOCK_MODE = process.env.MOCK_RESPONSE === "true";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn("[bot] TELEGRAM_BOT_TOKEN not set — bot will be inoperative");
}

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN ?? "placeholder", {
  client: {
    apiRoot: "https://api.telegram.org",
    // @ts-ignore - grammy 1.x ApiClientOptions timeout property
    timeout: 180000, 
  },
});

// Middleware to prevent concurrent processing for the same chat
// This prevents race conditions where the agent is called multiple times for one user
const chatProcessing = new Set<number>();

bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  if (chatProcessing.has(chatId)) {
    console.log(`[bot] Skipping concurrent update for chat ${chatId}`);
    return;
  }

  chatProcessing.add(chatId);
  try {
    await next();
  } finally {
    chatProcessing.delete(chatId);
  }
});

// ── /start ──────────────────────────────────────────────────────────────
bot.command("start", async (ctx) => {
  await ctx.reply(
    `Eh, welcome to KiasuHealth lah! 🏆\n\n` +
    `Compete with your kakis in weekly health challenges — steps, meals, activity.\n\n` +
    `🔐 *Privacy*: Food photos stay between you and me. Only your *balance score* is shared with the league.\n\n` +
    `To join a league, ask your group admin for the join code, then:\n` +
    `/join <code> — Link your account to a league\n\n` +
    `Once joined:\n` +
    `/photo — Submit a meal photo + get coaching (DM only)\n` +
    `/ask — Query your health data and trends (DM only)\n` +
    `/reveal — Post this week's standings to the group (group chat)\n\n` +
    `Need demo prompts? Type /help!`,
    { parse_mode: "Markdown" }
  );
});

// ── /help (Demo Prompts) ───────────────────────────────────────────────────
bot.command("help", async (ctx) => {
  await ctx.reply(
    `🏆 *KiasuHealth Demo Prompts* 🏆\n\n` +
    `*1. The "Gossip" Check (Private DM only)*\n` +
    `\`/ask how are my kakis doing?\` — See competitive intelligence on your friends.\n\n` +
    `*2. Meal Logging (Private DM only)*\n` +
    `Upload a photo of your meal with caption: \`/photo\` — Get balance scores and coaching.\n\n` +
    `*3. The "Escape Route" (Private DM only)*\n` +
    `\`/ask where can I walk to beat Chris?\` — Personalized trail recommendations to win.\n\n` +
    `*4. High-Stakes Mission (Private DM only)*\n` +
    `\`/ask are there any parks near Marina Bay?\` — Avoid the "Kopi Tax" while you're out.\n\n` +
    `*5. The Sunday Reveal (Group Chat only)*\n` +
    `\`/reveal\` — Announce the weekly winner and the loser who's paying for coffee!`,
    { parse_mode: "Markdown" }
  );
});

// ── /join [code] ─────────────────────────────────────────────────────────
bot.command("join", async (ctx) => {
  const joinCode = ctx.match?.trim().toUpperCase();
  if (!joinCode) {
    await ctx.reply("Usage: /join <code> — e.g. /join KIASU01");
    return;
  }

  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) {
    await ctx.reply("Could not identify your Telegram account. Try again.");
    return;
  }

  try {
    const league = await getLeagueByJoinCode(joinCode);
    if (!league) {
      await ctx.reply(`No league found for code *${joinCode}*. Double-check with your group admin.`, { parse_mode: "Markdown" });
      return;
    }

    // Check if already registered
    const existing = await getPlayerByTelegramId(telegramId);
    if (existing) {
      await ctx.reply(
        `You're already in *${league.name}* lah! 🤝\n\nUse /photo to log a meal or /ask to query your trends.`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    const firstName = ctx.from?.first_name ?? "Player";
    const lastName = ctx.from?.last_name ? ` ${ctx.from.last_name}` : "";
    const playerId = `tg_${telegramId}`;

    await upsertPlayer({
      player_id: playerId,
      name: `${firstName}${lastName}`,
      league_id: league.league_id,
      age: 30,           // default; players can update via profile later
      gender: "M",       // default
      telegram_id: telegramId,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const leagueLink = appUrl ? `\n\n📊 Live leaderboard: ${appUrl}/league/${league.league_id}` : "";

    await ctx.reply(
      `You're in *${league.name}*! 🏆\n\n` +
      `Start logging meals with /photo — I'll score your balance and coach you privately.\n` +
      `Only your score (not your photo or calories) goes to the league.${leagueLink}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("[bot] /join error:", err);
    await ctx.reply("Alamak, something went wrong. Try again in a moment.");
  }
});

// ── /photo (DM only) ─────────────────────────────────────────────────────
// Handle /photo command and also any photo sent with /photo as a caption
const handlePhoto = async (ctx: any) => {
  if (ctx.chat?.type !== "private") {
    await ctx.reply("Eh, send your food photo in a private message to me lah 🤫");
    return;
  }

  const photo = ctx.message?.photo;
  if (!photo || photo.length === 0) {
    await ctx.reply(
      "Send your meal photo with /photo as the caption 📸\n" +
      "_Snap your meal, caption it /photo, and I'll score it and coach you._",
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (MOCK_MODE) {
    await ctx.reply("🔍 Analyzing your meal...");
    const result = MOCK_MENTAIKO_SALMON;
    let reply = result.agent_commentary ?? `~${result.calories} kcal, *${result.balance_score}/10* for balance today.\n${result.tip}`;
    
    // Add detailed nutritional estimates if available
    if (result.estimates) {
      const { protein, carbs, fat, fiber } = result.estimates;
      reply += `\n\n*Nutritional Estimates:*\n` +
               `🥩 Protein: ${protein ?? "-"}\n` +
               `🍚 Carbs: ${carbs ?? "-"}\n` +
               `🥑 Fat: ${fat ?? "-"}\n` +
               `🥬 Fiber: ${fiber ?? "-"}`;
    }

    await ctx.reply(reply, { parse_mode: "Markdown" });
    return;
  }

  const fileId = photo[photo.length - 1].file_id;
  const file = await ctx.api.getFile(fileId);
  // Telegram file URL — safe to pass to Bedrock for analysis; never stored in Elastic
  const photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  const telegramId = ctx.from?.id?.toString() ?? "unknown";
  const leagueId = process.env.DEFAULT_LEAGUE_ID ?? "sg-league-001";

  await ctx.reply("🔍 Analyzing your meal...");

  // HealthCoachAgent: A2A → MealAnalyzerAgent (Bedrock vision) + DataAggregatorAgent (trends)
  // Then writes meal_balance_score to Elastic via write_meal_score tool
  const result = await callHealthCoachAgent({
    photo_url: photoUrl,
    player_id: telegramId,
    league_id: leagueId,
  });

  // Use the agent's full coaching message if present, else build from parts
  const reply =
    result.message ??
    `~${result.calories ?? 780} kcal, *${result.balance_score ?? 3}/10* for balance today.\n${result.tip ?? "Try more vegetables and less fried options."}`;

  await ctx.reply(reply, { parse_mode: "Markdown" });
  // balance_score is written to Elastic by HealthCoachAgent's write_meal_score tool (A2A)
};

bot.command("photo", handlePhoto);
bot.on("message:photo", async (ctx) => {
  if (ctx.message?.caption?.startsWith("/photo")) {
    await handlePhoto(ctx);
  }
});

// ── /ask (DM only) ──────────────────────────────────────────────────────────
bot.command("ask", async (ctx) => {
  if (ctx.chat?.type !== "private") {
    await ctx.reply("Psst — your health data is private. DM me /ask for personalised insights. 🤫");
    return;
  }

  const query = ctx.match?.trim();
  if (!query) {
    await ctx.reply(
      "Eh, what you want to ask? Just type `/ask <your question>` lah!\n\n" +
      "_Example: /ask am I on track for my step goal?_",
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (MOCK_MODE) {
    const lowerQuery = query.toLowerCase();
    let mockResponse = MOCK_ASK_RESPONSES.default;
    
    if (lowerQuery.includes("step")) mockResponse = MOCK_ASK_RESPONSES.steps;
    else if (lowerQuery.includes("active") || lowerQuery.includes("exercise") || lowerQuery.includes("activity")) mockResponse = MOCK_ASK_RESPONSES.activity;
    else if (lowerQuery.includes("weight") || lowerQuery.includes("fat") || lowerQuery.includes("bmi")) mockResponse = MOCK_ASK_RESPONSES.weight;
    else if (lowerQuery.includes("food") || lowerQuery.includes("meal") || lowerQuery.includes("eat") || lowerQuery.includes("nutrient")) mockResponse = MOCK_ASK_RESPONSES.nutrition;
    else if (lowerQuery.includes("kaki") || lowerQuery.includes("friend") || lowerQuery.includes("standing") || lowerQuery.includes("rank") || lowerQuery.includes("leaderboard")) mockResponse = (MOCK_ASK_RESPONSES as any).kakibash;
    else if (lowerQuery.includes("near") || lowerQuery.includes("where") || lowerQuery.includes("place") || lowerQuery.includes("park") || lowerQuery.includes("trail")) mockResponse = (MOCK_ASK_RESPONSES as any).nearby;

    await ctx.reply(mockResponse, { parse_mode: "Markdown" });
    return;
  }

  const telegramId = ctx.from?.id?.toString() ?? "unknown";

  // Use the HealthCoachAgent ID for general health queries (which leverages DataAggregatorAgent)
  const agentId = process.env.HEALTH_COACH_AGENT_ID;

  const msg = await ctx.reply("🧠 Thinking...");
  let lastTextSent = "🧠 Thinking...";

  try {
    let fullText = "";
    // Note: Vercel serverless has a timeout (10-30s).
    // telegram.api.editMessageText allows us to "simulate" streaming by updating the message chunks.
    // However, fast updates can trigger Telegram rate limits.
    // For the hackathon, we'll collect the stream and update in chunks or once at the end if it's fast.

    const stream = streamAgentConversation(agentId, query, `tg_${telegramId}`);
    let chunkCount = 0;
    let lastUpdateAt = Date.now();

    for await (const delta of stream) {
      if (!delta) continue;
      fullText += delta;
      chunkCount++;

      // Update every 20 chunks AND at least once every 4s to satisfy Telegram + Vercel
      const now = Date.now();
      if (chunkCount % 20 === 0 || (now - lastUpdateAt > 4000)) {
        const textToUpdate = fullText.length > 4000 ? fullText.substring(fullText.length - 4000) : fullText;
        if (textToUpdate.trim() && textToUpdate !== lastTextSent) {
          try {
            await ctx.api.editMessageText(ctx.chat.id, msg.message_id, textToUpdate);
            lastUpdateAt = now;
            lastTextSent = textToUpdate;
          } catch (e: any) {
            if (e.description?.includes("message is not modified")) continue;
            if (e.description?.includes("too many requests")) {
              lastUpdateAt = now + 3000;
            }
          }
        }
      }
    }

    if (fullText && fullText !== lastTextSent) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, fullText, { parse_mode: "Markdown" });
    } else if (!fullText && lastTextSent === "🧠 Thinking...") {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, "Alamak, the agent didn't say anything. Try asking again?");
    }
  } catch (err: any) {
    if (err.description?.includes("message is not modified")) return;
    console.error("[bot] /ask error:", err);
    try {
      const errorMsg = "Sorry, I'm having trouble connecting to my health coach brain right now. 🫠";
      if (lastTextSent !== errorMsg) {
        await ctx.api.editMessageText(ctx.chat.id, msg.message_id, errorMsg);
      }
    } catch (e: any) {}
  }
});

// ── /reveal (group) ────────────────────────────────────────────────────────
bot.command("reveal", async (ctx) => {
  const leagueId = process.env.DEFAULT_LEAGUE_ID ?? "sg-league-001";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const msg = await ctx.reply("🔍 Tallying the scores and asking the Referee...");

  if (MOCK_MODE) {
    const webLink = appUrl ? `\n\n👀 *Full reveal*: ${appUrl}/league/${leagueId}/reveal` : "";
    const standingsText = buildRevealFallback(leagueId);
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, standingsText + webLink, { parse_mode: "Markdown" });
    return;
  }

  // Use the Referee Agent for the public reveal
  const agentId = process.env.REFEREE_AGENT_ID;
  const query = `Reveal the standings for league ${leagueId} and give a kiasu commentary.`;

  try {
    let fullText = "";
    const stream = streamAgentConversation(agentId, query, `reveal_${leagueId}_${Date.now()}`);
    let chunkCount = 0;

    for await (const delta of stream) {
      fullText += delta;
      chunkCount++;
      if (chunkCount % 10 === 0) {
        try {
          await ctx.api.editMessageText(ctx.chat.id, msg.message_id, fullText || "Tallying...");
        } catch (_e) { /* ignore rate limits */ }
      }
    }

    const webLink = appUrl ? `\n\n👀 *Full reveal*: ${appUrl}/league/${leagueId}/reveal` : "";

    if (fullText) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, fullText + webLink, { parse_mode: "Markdown" });
    } else {
      // Fallback if agent fails
      const result = await callRefereeAgent({ league_id: leagueId });
      const standingsText = result.standings_text ?? buildRevealFallback(leagueId);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, standingsText + webLink, { parse_mode: "Markdown" });
    }
  } catch (err) {
    console.error("[bot] /reveal error:", err);
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, "Alamak, the Referee is on a lunch break. Try again later!");
  }
});

function getRankEmoji(rank: number): string {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
}

function buildRevealFallback(leagueId: string): string {
  const rows = MOCK_STANDINGS
    .map((s) => `#${s.rank} *${s.name}* — ${s.final_score.toFixed(1)} pts  ${s.badge ?? ""}`.trimEnd())
    .join("\n");
  return `🏆 *Week Reveal — ${leagueId}*\n\n${rows}`;
}
