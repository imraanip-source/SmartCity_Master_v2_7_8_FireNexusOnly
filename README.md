
# SmartCity Master v2.7.8 — FIREneXus‑Only (Email Ready)

**New in 2.7.8**
- Built‑in **SMTP email** via `/contact/send` and `/email/test` (uses Nodemailer).
- Works with cPanel mailbox (e.g., `no-reply@yourdomain.com`) **or** Mailgun/SendGrid.

## 1) Environment variables (Render → Settings → Environment)
```
# FIREneXus
FIRENEXUS_API_URL=https://api.firenexus.yourdomain
FIRENEXUS_API_KEY=YOUR_KEY
FIRENEXUS_TENANT_ID=finyl-image-ai

# Uploads (optional)
FIRENEXUS_UPLOAD_URL=
FIRENEXUS_UPLOAD_AUTH=

# SMTP (required for email)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@yourdomain.com
SMTP_PASS=YOUR_PASSWORD
FROM_EMAIL=no-reply@yourdomain.com
FROM_NAME=Finyl Image AI
TO_EMAIL=owner@yourdomain.com

PORT=10000
```

## 2) DNS (sender authentication)
- SPF/DKIM: cPanel → Email Deliverability → **Repair**.
- DMARC (Zone Editor → TXT `_dmarc`):
  `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; adkim=s; aspf=s`

## 3) Run locally
```bash
cd utils/dev-suite
npm i
PORT=8088 FIRENEXUS_API_URL=http://localhost:9000 FIRENEXUS_API_KEY=DEMO FIRENEXUS_TENANT_ID=finyl-image-ai SMTP_HOST=mail.yourdomain.com SMTP_PORT=587 SMTP_SECURE=false SMTP_USER=no-reply@yourdomain.com SMTP_PASS=pass FROM_EMAIL=no-reply@yourdomain.com FROM_NAME="Finyl Image AI" TO_EMAIL=owner@yourdomain.com node server.js
# open http://localhost:8088/hccp/hccp-demo.html
```

## 4) API routes
- `POST /contact/send` → JSON `{ name, email, message }`
- `POST /email/test` → JSON `{ to }`

> Build: 2025-10-27T13:08:19.072045Z
