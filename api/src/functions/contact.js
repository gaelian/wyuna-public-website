const { EmailClient } = require("@azure/communication-email");
const { app } = require("@azure/functions");

const MIN_SUBMIT_TIME_MS = 2500;
const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const attempts = new Map();

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isRateLimited(ipAddress) {
  if (!ipAddress) {
    return false;
  }

  const now = Date.now();
  const current = attempts.get(ipAddress) || [];
  const recent = current.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  attempts.set(ipAddress, recent);

  return recent.length > RATE_LIMIT_MAX;
}

async function verifyTurnstile(token, ipAddress) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  const params = new URLSearchParams();
  params.append("secret", secret);
  params.append("response", token);

  if (ipAddress) {
    params.append("remoteip", ipAddress);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: params
  });

  const result = await response.json();
  return Boolean(result.success);
}

async function sendEmail(fields) {
  const connectionString = process.env.ACS_EMAIL_CONNECTION_STRING;
  const sender = process.env.CONTACT_EMAIL_FROM;
  const recipient = process.env.CONTACT_EMAIL_TO;

  if (!connectionString || !sender || !recipient) {
    throw new Error("Email delivery is not configured.");
  }

  const client = new EmailClient(connectionString);
  const poller = await client.beginSend({
    senderAddress: sender,
    recipients: {
      to: [{ address: recipient }]
    },
    content: {
      subject: `Wyuna website contact: ${fields.subject}`,
      plainText: [
        `Name: ${fields.name}`,
        `Email: ${fields.email}`,
        `Subject: ${fields.subject}`,
        "",
        fields.message
      ].join("\n")
    },
    replyTo: [{ address: fields.email }]
  });

  await poller.pollUntilDone();
}

app.http("contact", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    let body;

    try {
      body = await request.json();
    } catch {
      return {
        status: 400,
        jsonBody: { message: "Please submit the form again." }
      };
    }

    const startedAt = Number(body.startedAt);
    const elapsed = Date.now() - startedAt;
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    if (isRateLimited(ipAddress)) {
      return {
        status: 429,
        jsonBody: { message: "Please wait before sending another message." }
      };
    }

    if (body.website || !startedAt || elapsed < MIN_SUBMIT_TIME_MS) {
      context.log("Rejected likely automated contact submission.");
      return {
        status: 202,
        jsonBody: { message: "Thanks. Your message has been sent." }
      };
    }

    const fields = {
      name: cleanText(body.name, 120),
      email: cleanText(body.email, 180),
      subject: cleanText(body.subject, 160),
      message: String(body.message || "").trim().slice(0, MAX_MESSAGE_LENGTH)
    };

    if (!fields.name || !isEmail(fields.email) || !fields.subject || fields.message.length < 10) {
      return {
        status: 400,
        jsonBody: { message: "Please complete all fields with a valid email address." }
      };
    }

    const captchaOk = await verifyTurnstile(body.turnstileToken, ipAddress);

    if (!captchaOk) {
      return {
        status: 400,
        jsonBody: { message: "Please refresh the page and try again." }
      };
    }

    try {
      await sendEmail(fields);
    } catch (error) {
      context.error(error);
      return {
        status: 500,
        jsonBody: { message: "Your message could not be sent right now." }
      };
    }

    return {
      status: 200,
      jsonBody: { message: "Thanks. Your message has been sent." }
    };
  }
});

app.http("contact-config", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => ({
    status: 200,
    jsonBody: {
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || ""
    }
  })
});
