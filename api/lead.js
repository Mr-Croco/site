import nodemailer from "nodemailer";

const rateLimitStore = new Map();

function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const record = rateLimitStore.get(ip) || [];
  const recent = record.filter((timestamp) => now - timestamp < hour);
  recent.push(now);
  rateLimitStore.set(ip, recent);
  return recent.length > 10;
}

async function sendTelegram(message) {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });
}

async function sendEmail(message, leadEmailTo) {
  if (!process.env.SMTP_URL || !leadEmailTo) {
    return;
  }

  const transporter = nodemailer.createTransport(process.env.SMTP_URL);
  await transporter.sendMail({
    from: process.env.SMTP_FROM || leadEmailTo,
    to: leadEmailTo,
    subject: "Новая заявка с сайта СибПаллет",
    text: message,
  });
}

function buildMessage(payload) {
  return [
    "Новая заявка СибПаллет",
    `Имя: ${payload.name || "-"}`,
    `Телефон: ${payload.phone}`,
    `Канал: ${payload.channel || "-"}`,
    `Размер: ${payload.size || "-"}`,
    `Количество: ${payload.qty || "-"}`,
    `Город/район: ${payload.location || "-"}`,
    `Комментарий: ${payload.comment || "-"}`,
  ].join("\n");
}

export async function POST({ request }) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ ok: false, error: "rate_limit" }), { status: 429 });
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "bad_json" }), { status: 400 });
  }

  if (payload.website) {
    return new Response(JSON.stringify({ ok: true }));
  }

  const startTime = Number(payload.timestamp || 0);
  if (!Number.isNaN(startTime) && Date.now() - startTime < 3000) {
    return new Response(JSON.stringify({ ok: false, error: "too_fast" }), { status: 400 });
  }

  if (!payload.phone || String(payload.phone).replace(/\D/g, "").length < 10) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_phone" }), { status: 400 });
  }

  const message = buildMessage(payload);
  const leadEmailTo = process.env.LEAD_EMAIL_TO;

  await Promise.all([sendTelegram(message), sendEmail(message, leadEmailTo)]);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
