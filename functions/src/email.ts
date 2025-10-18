import { google } from "googleapis";
import * as functions from "firebase-functions";
import cors from "cors";

// ----- OAuth2 client from env (.env is auto-loaded by Firebase CLI for v2 deploy) -----
const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_SENDER,
  GMAIL_REDIRECT_URI,
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

// ----- helpers -----
function sanitizeHeader(v: string) {
  return String(v || "").replace(/[\r\n]+/g, " ").slice(0, 200);
}
function base64Url(b: Buffer) {
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}
function buildRawEmail(
  to: string,
  subject: string,
  text: string,
  file?: { name: string; contentBase64: string; mime: string }
) {
  const safeTo = sanitizeHeader(to);
  const safeSub = sanitizeHeader(subject);
  const headersCommon = [
    `From: ${GMAIL_SENDER}`,
    `To: ${safeTo}`,
    `Subject: =?utf-8?B?${Buffer.from(safeSub, "utf8").toString("base64")}?=`,
    `MIME-Version: 1.0`,
  ];

  // no attachment => plain text
  if (!file?.contentBase64) {
    const headers = [
      ...headersCommon,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
    ].join("\r\n");
    const body = `\r\n\r\n${text || ""}\r\n`;
    return base64Url(Buffer.from(headers + body));
  }

  // with attachment => multipart/mixed
  const boundary = "mixed_" + Date.now();
  const headers = [
    ...headersCommon,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].join("\r\n");

  const attName = sanitizeHeader(file.name || "attachment");
  const attMime = sanitizeHeader(file.mime || "application/octet-stream");

  const textPart = `--${boundary}\r
Content-Type: text/plain; charset="UTF-8"\r
Content-Transfer-Encoding: 7bit\r
\r
${text || ""}\r`;

  const attachmentPart = `--${boundary}\r
Content-Type: ${attMime}; name="${attName}"\r
Content-Transfer-Encoding: base64\r
Content-Disposition: attachment; filename="${attName}"\r
\r
${file.contentBase64}\r
--${boundary}--`;

  const mime = `${headers}\r\n\r\n${textPart}\r\n${attachmentPart}\r\n`;
  return base64Url(Buffer.from(mime));
}

// use default import of cors (the previous error was due to namespace import)
const corsHandler = cors({ origin: true });

export const sendEmail = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.status(204).send("");
        return;
      }
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { to, subject, message, attachment } = req.body || {};

      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) {
        res.status(400).json({ ok: false, error: "Invalid recipient email" });
        return;
      }
      if (!subject || !String(subject).trim()) {
        res.status(400).json({ ok: false, error: "Subject required" });
        return;
      }
      if (attachment?.contentBase64) {
        const bytes = Math.floor((attachment.contentBase64.length * 3) / 4);
        if (bytes > 5 * 1024 * 1024) {
          res.status(400).json({ ok: false, error: "Attachment too large (>5MB)" });
          return;
        }
      }

      const raw = buildRawEmail(String(to), String(subject), String(message || ""), attachment);
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
      const resp = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });

      const msgId = resp.data.id;
      console.log("Gmail sent, id:", msgId);

      res.set("Access-Control-Allow-Origin", "*");
      res.json({ ok: true, id: msgId });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ ok: false, error: e?.message || "send failed" });
    }
  });
});
