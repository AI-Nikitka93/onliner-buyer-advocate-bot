import { ChannelPost, Product } from "../types";

type TelegramApiEnvelope<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name?: string;
  username?: string;
};

type TelegramChat = {
  id: number | string;
  type: string;
  title?: string;
  username?: string;
};

type TelegramChatMember = {
  status: string;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
};

type TelegramWebhookInfo = {
  url?: string;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
};

export function getTelegramStatus() {
  const isConfigured = (value: string | undefined, placeholders: string[]) => {
    if (!value?.trim()) return false;
    return !placeholders.some((marker) => value.includes(marker));
  };

  return {
    tokenConfigured: isConfigured(process.env.TELEGRAM_BOT_TOKEN, ["PASTE_", "MY_"]),
    channelConfigured: isConfigured(process.env.TELEGRAM_CHANNEL_ID, ["@your_", "your_"]),
    deliveryEnabled: process.env.ENABLE_TELEGRAM_DELIVERY === "true",
    webhookSecretConfigured: isConfigured(process.env.TELEGRAM_WEBHOOK_SECRET, ["change_me"]),
  };
}

function telegramApiUrl(method: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return `https://api.telegram.org/bot${token}/${method}`;
}

function clampTelegramText(text: string) {
  return text.length > 3900 ? `${text.slice(0, 3890)}\n...` : text;
}

async function callTelegramApi<T>(method: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(telegramApiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });

  const data = await response.json() as TelegramApiEnvelope<T>;
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed: ${JSON.stringify(data)}`);
  }

  return data.result as T;
}

export async function runTelegramDoctor(expectedWebhookUrl?: string) {
  const status = getTelegramStatus();
  const checks: Record<string, any> = {
    token: {
      ok: status.tokenConfigured,
      reason: status.tokenConfigured ? "TELEGRAM_BOT_TOKEN is configured." : "TELEGRAM_BOT_TOKEN is not configured.",
    },
    channel: {
      ok: status.channelConfigured,
      reason: status.channelConfigured ? "TELEGRAM_CHANNEL_ID is configured." : "TELEGRAM_CHANNEL_ID is not configured.",
    },
    delivery: {
      ok: status.deliveryEnabled,
      reason: status.deliveryEnabled ? "ENABLE_TELEGRAM_DELIVERY=true." : "Delivery is disabled; safe dry-run mode is active.",
    },
  };
  const recommendations: string[] = [];

  if (!status.tokenConfigured) {
    recommendations.push("Set TELEGRAM_BOT_TOKEN from BotFather before live checks.");
    if (!status.channelConfigured) recommendations.push("Set TELEGRAM_CHANNEL_ID to @channel_username or -100... id.");
    return {
      ok: false,
      readyForLiveDelivery: false,
      status,
      checks,
      recommendations,
    };
  }

  let bot: TelegramUser | null = null;
  try {
    bot = await callTelegramApi<TelegramUser>("getMe");
    checks.bot = {
      ok: true,
      id: bot.id,
      username: bot.username,
      firstName: bot.first_name,
      isBot: bot.is_bot,
    };
  } catch (error: any) {
    checks.bot = { ok: false, reason: error.message };
    recommendations.push("Verify TELEGRAM_BOT_TOKEN; Telegram getMe failed.");
  }

  if (status.channelConfigured) {
    try {
      const chat = await callTelegramApi<TelegramChat>("getChat", {
        chat_id: process.env.TELEGRAM_CHANNEL_ID,
      });
      checks.channel = {
        ok: true,
        id: chat.id,
        type: chat.type,
        title: chat.title,
        username: chat.username,
      };
    } catch (error: any) {
      checks.channel = { ok: false, reason: error.message };
      recommendations.push("Verify TELEGRAM_CHANNEL_ID and make sure the bot can access the channel.");
    }

    if (bot && checks.channel?.ok) {
      try {
        const member = await callTelegramApi<TelegramChatMember>("getChatMember", {
          chat_id: process.env.TELEGRAM_CHANNEL_ID,
          user_id: bot.id,
        });
        const canPost = member.status === "creator"
          || (member.status === "administrator" && member.can_post_messages !== false);
        checks.channelAdmin = {
          ok: canPost,
          status: member.status,
          canPostMessages: member.status === "creator" ? true : Boolean(member.can_post_messages),
          canEditMessages: Boolean(member.can_edit_messages),
        };
        if (!canPost) {
          recommendations.push("Add the bot as channel admin with permission to post messages.");
        }
      } catch (error: any) {
        checks.channelAdmin = { ok: false, reason: error.message };
        recommendations.push("Add the bot as channel admin; getChatMember failed.");
      }
    }
  } else {
    recommendations.push("Set TELEGRAM_CHANNEL_ID before checking channel permissions.");
  }

  try {
    const webhook = await callTelegramApi<TelegramWebhookInfo>("getWebhookInfo");
    const webhookMatches = expectedWebhookUrl ? webhook.url === expectedWebhookUrl : Boolean(webhook.url);
    checks.webhook = {
      ok: expectedWebhookUrl ? webhookMatches : true,
      configured: Boolean(webhook.url),
      url: webhook.url || "",
      expectedUrl: expectedWebhookUrl || undefined,
      pendingUpdateCount: webhook.pending_update_count || 0,
      lastErrorDate: webhook.last_error_date,
      lastErrorMessage: webhook.last_error_message,
      allowedUpdates: webhook.allowed_updates,
    };
    if (expectedWebhookUrl && !webhookMatches) {
      recommendations.push("Register the expected webhook URL through /api/telegram/set-webhook.");
    }
  } catch (error: any) {
    checks.webhook = { ok: false, reason: error.message };
    recommendations.push("Telegram getWebhookInfo failed; verify token and network access.");
  }

  const readyForLiveDelivery = Boolean(
    checks.bot?.ok
      && checks.channel?.ok
      && checks.channelAdmin?.ok
      && checks.delivery?.ok,
  );

  if (!status.deliveryEnabled) {
    recommendations.push("Keep ENABLE_TELEGRAM_DELIVERY=false until token, channel, admin rights, and webhook are verified.");
  }

  return {
    ok: Boolean(checks.bot?.ok && checks.channel?.ok && checks.channelAdmin?.ok),
    readyForLiveDelivery,
    status,
    checks,
    recommendations,
  };
}

export async function sendTelegramMessage(chatId: string | number, text: string) {
  const status = getTelegramStatus();
  if (!status.tokenConfigured || process.env.ENABLE_TELEGRAM_DELIVERY !== "true") {
    return {
      ok: false,
      dryRun: true,
      reason: status.tokenConfigured
        ? "ENABLE_TELEGRAM_DELIVERY is not true; message was not sent."
        : "TELEGRAM_BOT_TOKEN is not configured; message was not sent.",
      preview: clampTelegramText(text),
    };
  }

  const response = await fetch(telegramApiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: clampTelegramText(text),
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram sendMessage failed: ${JSON.stringify(data)}`);
  }

  return { ok: true, dryRun: false, result: data.result };
}

export async function setTelegramWebhook(webhookUrl: string) {
  const status = getTelegramStatus();
  if (!status.tokenConfigured) {
    return { ok: false, dryRun: true, reason: "TELEGRAM_BOT_TOKEN is not configured." };
  }

  const response = await fetch(telegramApiUrl("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
      allowed_updates: ["message"],
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram setWebhook failed: ${JSON.stringify(data)}`);
  }

  return { ok: true, result: data.result, description: data.description };
}

export function formatProductTelegramAnswer(product: Product) {
  const fakeLine = product.isFakeDiscount
    ? "Осторожно: заявленная скидка выглядит нечестной или слабой относительно медианного сигнала."
    : "Цена выглядит лучше медианного сигнала, но решение все равно зависит от реальной необходимости.";

  const evidence = product.priceEvidence?.medianWindowLabel || "демо-оценка";
  const reviewEvidence = product.reviewEvidence;
  const reviewLine = reviewEvidence
    ? `Отзывы: обработано ${reviewEvidence.processedCount} из ${reviewEvidence.totalCount || reviewEvidence.processedCount}`
    : "Отзывы: детальная выборка не сохранена";
  const consSource = reviewEvidence?.topCons?.length
    ? reviewEvidence.topCons.map((item) => item.count > 1 ? `${item.label} (${item.count} упом.)` : item.label)
    : product.cons;
  const prosSource = reviewEvidence?.topPros?.length
    ? reviewEvidence.topPros.map((item) => item.count > 1 ? `${item.label} (${item.count} упом.)` : item.label)
    : product.pros;
  const cons = consSource.slice(0, 3).map((item) => `- ${item}`).join("\n");
  const pros = prosSource.slice(0, 3).map((item) => `- ${item}`).join("\n");

  return [
    `🛡️ Цифровой адвокат покупателя`,
    ``,
    `Товар: ${product.title}`,
    `Цена сейчас: ${product.currentPrice} BYN`,
    `Медианный ориентир: ${product.medianPrice90Days} BYN`,
    `Честное отклонение: ${product.honestDiscountPercent}%`,
    reviewLine,
    `Вердикт: ${fakeLine}`,
    ``,
    `Повторяющиеся минусы:`,
    cons || "- Недостатки пока не подтверждены отзывами.",
    ``,
    `Что чаще хвалят:`,
    pros || "- Плюсы пока не подтверждены отзывами.",
    ``,
    `Источник: ${product.url}`,
    `Данные: ${evidence}`,
  ].join("\n");
}

export function formatChannelPost(post: ChannelPost) {
  return [
    `📢 ${post.honestyVerdict}`,
    ``,
    `🛒 ${post.title}`,
    `💰 Цена: ${post.currentPrice} BYN`,
    `Рекламная скидка: -${post.advertisedDiscount}%`,
    `Честная выгода от медианы: ${post.realDiscount}%`,
    `Индекс честности: ${post.honestyScore}/100`,
    ``,
    `✅ Плюсы: ${post.pros}`,
    `⚠️ Минусы: ${post.cons}`,
    ``,
    post.buyerAdvocateVerdict,
  ].join("\n");
}

export async function publishChannelPost(post: ChannelPost) {
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!chatId) {
    return {
      ok: false,
      dryRun: true,
      reason: "TELEGRAM_CHANNEL_ID is not configured; channel post was not sent.",
      preview: formatChannelPost(post),
    };
  }

  return sendTelegramMessage(chatId, formatChannelPost(post));
}
