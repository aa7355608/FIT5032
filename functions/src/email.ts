import { onRequest } from "firebase-functions/v2/https";
import * as dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const ALLOWED = ["http://localhost:5173", "https://youth-wellbeing-app.web.app"];

function setCors(res: any, origin?: string) {
  const o = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  res.setHeader("Access-Control-Allow-Origin", o);
  res.setHeader("Vary", "Origin"); 
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function buildRawEmail(
  to: string,
  subject: string,
  text: string,
  att?: { filename: string; contentBase64: string; mime?: string }
) {
  const boundary = "----=_Part_" + Date.now();
  const headers = `MIME-Version: 1.0\r\nTo: ${to}\r\nSubject: ${subject}\r\n`;

  if (!att?.contentBase64) {
    const body = headers + `Content-Type: text/plain; charset="UTF-8"\r\n\r\n${text}`;
    return Buffer.from(body).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  }

  const mime = att.mime || "application/octet-stream";
  const body =
    headers +
    `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n` +
    `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${text}\r\n\r\n` +
    `--${boundary}\r\nContent-Type: ${mime}; name="${att.filename}"\r\n` +
    `Content-Disposition: attachment; filename="${att.filename}"\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n${att.contentBase64}\r\n--${boundary}--`;

  return Buffer.from(body).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

export const sendEmail = onRequest({ region: "us-central1", timeoutSeconds: 60 }, async (req, res) => {
  setCors(res, req.headers.origin as string);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { to, subject, message, attachment } = req.body || {};
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) return res.status(400).json({ ok: false, error: "Invalid email" });
    if (!String(subject || "").trim()) return res.status(400).json({ ok: false, error: "Subject required" });
    if (attachment?.contentBase64) {
      const bytes = Math.floor((attachment.contentBase64.length * 3) / 4);
      if (bytes > 5 * 1024 * 1024) return res.status(400).json({ ok: false, error: "Attachment too large" });
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const raw = buildRawEmail(String(to), String(subject), String(message || ""), attachment);
    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });

    setCors(res, req.headers.origin as string); 
    return res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    setCors(res, req.headers.origin as string);
    return res.status(500).json({ ok: false, error: e?.message || "send failed" });
  }
});
