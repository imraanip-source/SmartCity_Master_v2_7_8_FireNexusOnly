
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import serveStatic from 'serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import multer from 'multer';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');
const FRONTEND = process.env.FRONTEND_DIR || path.join(ROOT, 'hccp');
const ASSETS = path.join(ROOT, 'assets');

const FIRENEXUS_API_URL = process.env.FIRENEXUS_API_URL || 'http://localhost:9000';
const FIRENEXUS_API_KEY = process.env.FIRENEXUS_API_KEY || '';
const FIRENEXUS_TENANT_ID = process.env.FIRENEXUS_TENANT_ID || 'finyl-image-ai';
const FIRENEXUS_UPLOAD_URL = process.env.FIRENEXUS_UPLOAD_URL || '';
const FIRENEXUS_UPLOAD_AUTH = process.env.FIRENEXUS_UPLOAD_AUTH || '';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'no-reply@example.com';
const FROM_NAME = process.env.FROM_NAME || 'SmartCity';
const TO_EMAIL = process.env.TO_EMAIL || FROM_EMAIL;

const PORT = process.env.PORT || 8088;

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use('/', serveStatic(FRONTEND));
app.use('/assets', serveStatic(ASSETS));

app.get('/assets-manifest.json', async (req, res) => {
  const files = await glob('assets/brands/**/*.{svg,png}', { cwd: ROOT, nodir: true, posix:true });
  res.json({ files, upload_url: FIRENEXUS_UPLOAD_URL ? '/upload' : '' });
});

// Upload proxy (optional)
if (FIRENEXUS_UPLOAD_URL) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) { res.status(400).json({ error: 'missing file' }); return; }
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      const form = new FormData();
      form.append('file', blob, req.file.originalname);
      const headers = FIRENEXUS_UPLOAD_AUTH ? { 'Authorization': FIRENEXUS_UPLOAD_AUTH } : {};
      const r = await fetch(FIRENEXUS_UPLOAD_URL, { method: 'POST', body: form, headers });
      const j = await r.json();
      res.json(j);
    } catch (e) {
      res.status(500).json({ error: 'upload failed' });
    }
  });
}

// Proxy to FIRENEXUS
app.use('/firenexus', createProxyMiddleware({
  target: FIRENEXUS_API_URL,
  changeOrigin: true,
  pathRewrite: { '^/firenexus': '' },
  onProxyReq: (proxyReq) => {
    if (FIRENEXUS_API_KEY) proxyReq.setHeader('Authorization', `Bearer ${FIRENEXUS_API_KEY}`);
    proxyReq.setHeader('x-tenant-id', FIRENEXUS_TENANT_ID);
  }
}));

function getTransport() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

app.post('/email/test', async (req, res) => {
  try {
    const transport = getTransport();
    if (!transport) { res.status(400).json({ ok:false, error:'SMTP not configured' }); return; }
    const to = req.body?.to || TO_EMAIL;
    const info = await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: 'SMTP Test — SmartCity',
      text: 'If you are reading this, SMTP is good.',
    });
    res.json({ ok:true, id: info.messageId });
  } catch (e) {
    res.status(500).json({ ok:false, error: e?.message || 'send failed' });
  }
});

app.post('/contact/send', async (req, res) => {
  const { name='', email='', message='' } = req.body || {};
  if (!name || !email || !message) { res.status(400).json({ ok:false, error:'missing fields' }); return; }
  try {
    const transport = getTransport();
    if (!transport) { res.status(400).json({ ok:false, error:'SMTP not configured' }); return; }
    const info = await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject: `SmartCity Contact — ${name}`,
      text: `From: ${name} <${email}>

${message}`
    });
    res.json({ ok:true, id: info.messageId });
  } catch (e) {
    res.status(500).json({ ok:false, error: e?.message || 'send failed' });
  }
});
// -------------------- EMAIL TEST ROUTE --------------------
const nodemailer = require("nodemailer");

app.get("/email/test", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.SMTP_USER || process.env.FROM_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${process.env.FROM_NAME || "Finyl Image AI"}" <${process.env.FROM_EMAIL}>`,
      to: process.env.TO_EMAIL || process.env.FROM_EMAIL,
      subject: "SmartCity Email Test",
      text: "✅ This is a test email from SmartCity FIREneXus. Everything is working perfectly!",
    });

    console.log("✅ Test email sent successfully");
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Email failed:", error);
    res.status(500).send("Email failed");
  }
});

app.listen(PORT, () => {
  console.log('Dev Suite on :' + PORT);
  console.log('Serving HCCP from ' + FRONTEND);
  console.log('Serving ASSETS from ' + ASSETS);
  console.log('/firenexus -> ' + FIRENEXUS_API_URL + ' (tenant=' + FIRENEXUS_TENANT_ID + ')');
  console.log('Upload Proxy: ' + (FIRENEXUS_UPLOAD_URL ? '/upload -> ' + FIRENEXUS_UPLOAD_URL : 'disabled'));
  console.log('SMTP:', SMTP_HOST ? 'configured' : 'disabled');
});
