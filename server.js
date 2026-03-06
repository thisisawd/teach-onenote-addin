/* ============================================================
   server.js — HTTPS dev server with Azure OpenAI proxy
   ============================================================
   Replaces `http-server` so the OneNote webview can reach
   Azure OpenAI via a same-origin /api/chat endpoint (avoids
   CSP / CORS restrictions in the Office Add-in sandbox).
   ============================================================ */

const https = require('https');
const fs    = require('fs');
const path  = require('path');
const express = require('express');

// ── Dev certs (same ones office-addin-dev-certs installs) ───
const HOME = process.env.USERPROFILE || process.env.HOME;
const CERT_DIR = path.join(HOME, '.office-addin-dev-certs');
const certPath = path.join(CERT_DIR, 'localhost.crt');
const keyPath  = path.join(CERT_DIR, 'localhost.key');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('Dev certs not found. Run:  npm run certs');
  process.exit(1);
}

const app = express();

// ── Azure OpenAI config (same values as taskpane.html) ──────
const AOAI_ENDPOINT   = 'https://FHL-2026.cognitiveservices.azure.com';
const AOAI_DEPLOYMENT = 'gpt-4.1-mini';
const AOAI_API_VER    = '2024-05-01-preview';
const AOAI_API_KEY    = '7mwAGJDSbmtIhMB16dDm6pJvpi0ZS0S6FLwUoM9MtKIxsl9DZ9meJQQJ99CCACYeBjFXJ3w3AAABACOG845N';

// ── JSON body parser ────────────────────────────────────────
app.use(express.json({ limit: '256kb' }));

// ── Proxy endpoint: POST /api/chat ──────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, temperature, max_tokens } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const url = `${AOAI_ENDPOINT}/openai/deployments/${AOAI_DEPLOYMENT}/chat/completions?api-version=${AOAI_API_VER}`;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AOAI_API_KEY
      },
      body: JSON.stringify({
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 4000
      })
    });

    const body = await upstream.text();
    res.status(upstream.status).set('Content-Type', 'application/json').send(body);
  } catch (err) {
    console.error('[proxy] Azure OpenAI error:', err);
    res.status(502).json({ error: 'Proxy error: ' + err.message });
  }
});

// ── Static files (everything in this directory) ─────────────
app.use(express.static(__dirname, { extensions: ['html'] }));

// ── Start HTTPS server ──────────────────────────────────────
const PORT = 3000;
const server = https.createServer(
  { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) },
  app
);

server.listen(PORT, () => {
  console.log(`\n  Teach dev server running at  https://localhost:${PORT}/taskpane.html\n`);
});
