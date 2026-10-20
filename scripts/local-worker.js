import worker from "../src/worker.js";

// Local-only adapter for exercising the legacy channel sender against a test group.
export default {
  fetch: worker.fetch,
  scheduled(event, env, ctx) {
    if (!env.TG_NEWS_BOT || !env.TELEGRAM_GROUP_CHAT_ID) {
      throw new Error("Local setup requires TG_NEWS_BOT and TELEGRAM_GROUP_CHAT_ID in .dev.vars");
    }
    return worker.scheduled(event, {
      ...env,
      TELEGRAM_BOT_TOKEN: env.TG_NEWS_BOT,
      TELEGRAM_CHANNEL_ID: env.TELEGRAM_GROUP_CHAT_ID
    }, ctx);
  }
};
