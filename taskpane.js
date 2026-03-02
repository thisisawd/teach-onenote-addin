/* ============================================================
   Teach – M365 Copilot OneNote Add-in  (EDU)
   taskpane.js
   ============================================================ */

const TEACH_URL = 'https://copilot.cloud.microsoft/teach';
const TEACH_FALLBACK = 'https://copilot.microsoft.com/?fromEducation=true';

let currentUser = null;
let officeReady  = false;

// ── Bootstrap ──────────────────────────────────────────────
Office.onReady(async (info) => {
  officeReady = true;
  console.log('[Teach] Office ready – host:', info.host);
  trySSO();
  wireButtons();
});

// ── SSO: try to pass through the signed-in user ───────────
async function trySSO() {
  try {
    // Office SSO – returns an Azure AD access token if available
    const token = await Office.auth.getAccessTokenAsync({
      allowSignInPrompt: false,
      allowConsentPrompt: false,
      forMSGraphAccess: true
    });

    if (token && typeof token === 'string' && token.length > 10) {
      // Decode JWT payload to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUser = {
        name:  payload.name  || payload.preferred_username || 'Educator',
        email: payload.preferred_username || payload.upn || ''
      };
      console.log('[Teach] SSO success:', currentUser.email);
      loginSuccess(currentUser);
      return;
    }
  } catch (err) {
    console.warn('[Teach] SSO unavailable, showing login:', err.message || err);
  }

  // SSO didn't work – show the manual login overlay
  showLoginOverlay();
}

// ── Manual login overlay ──────────────────────────────────
function showLoginOverlay() {
  document.getElementById('loginOverlay').classList.remove('hidden');
}

function hideLoginOverlay() {
  document.getElementById('loginOverlay').classList.add('hidden');
}

// ── Login success → load Teach ────────────────────────────
function loginSuccess(user) {
  currentUser = user;
  hideLoginOverlay();

  // Build the Teach URL with login_hint so the user doesn't have to sign in again
  let url = TEACH_URL;
  if (user.email) {
    const hint = encodeURIComponent(user.email);
    url += (url.includes('?') ? '&' : '?') + `login_hint=${hint}`;
  }

  loadTeach(url);
}

// ── Load Copilot Teach in the iframe ──────────────────────
function loadTeach(url) {
  const frame = document.getElementById('teachFrame');
  frame.src = url || TEACH_URL;

  // If primary URL fails (X-Frame-Options), fall back
  frame.onerror = () => {
    console.warn('[Teach] Primary URL blocked, trying fallback');
    frame.src = TEACH_FALLBACK;
  };
}

// ── Wire up buttons ───────────────────────────────────────
function wireButtons() {
  // SSO button
  document.getElementById('ssoBtn').addEventListener('click', async () => {
    try {
      const token = await Office.auth.getAccessTokenAsync({
        allowSignInPrompt: true,
        allowConsentPrompt: true,
        forMSGraphAccess: true
      });
      const payload = JSON.parse(atob(token.split('.')[1]));
      loginSuccess({
        name:  payload.name || payload.preferred_username,
        email: payload.preferred_username || payload.upn || ''
      });
    } catch (err) {
      toast('SSO not available — please enter your EDU email below.', 'error');
    }
  });

  // Email login
  document.getElementById('emailBtn').addEventListener('click', () => {
    const email = document.getElementById('emailInput').value.trim();
    if (!email || !email.includes('@')) {
      toast('Enter a valid EDU email address.', 'error');
      return;
    }
    loginSuccess({ name: email.split('@')[0], email });
  });

  // Insert to Page
  document.getElementById('insertBtn').addEventListener('click', insertToPage);

  // oEmbed
  document.getElementById('embedBtn').addEventListener('click', embedToPage);

  // Refresh
  document.getElementById('refreshBtn').addEventListener('click', () => {
    const frame = document.getElementById('teachFrame');
    if (frame.src && frame.src !== 'about:blank') {
      frame.src = frame.src;          // reload
      toast('Reloaded Copilot Teach.', 'success');
    }
  });
}

// ── Insert content into OneNote page ──────────────────────
async function insertToPage() {
  if (!officeReady) { toast('OneNote is not ready.', 'error'); return; }

  // Try to read content from the iframe (may be blocked by CORS)
  let html = extractFrameContent();

  try {
    await OneNote.run(async (ctx) => {
      const page    = ctx.application.getActivePage();
      const outline = page.addOutline(40, 40, html);
      await ctx.sync();
    });
    toast('Content inserted into page!', 'success');
  } catch (err) {
    console.error('[Teach] Insert error:', err);
    toast('Could not insert — ' + (err.message || err), 'error');
  }
}

// ── Embed via oEmbed card ─────────────────────────────────
async function embedToPage() {
  if (!officeReady) { toast('OneNote is not ready.', 'error'); return; }

  const frame = document.getElementById('teachFrame');
  const embedUrl = frame.src || TEACH_URL;

  // Build an oEmbed-style HTML snippet
  const oembedHtml = buildOEmbedCard(embedUrl);

  try {
    await OneNote.run(async (ctx) => {
      const page    = ctx.application.getActivePage();
      const outline = page.addOutline(40, 40, oembedHtml);
      await ctx.sync();
    });
    toast('Embedded content added to page!', 'success');
  } catch (err) {
    console.error('[Teach] Embed error:', err);
    toast('Could not embed — ' + (err.message || err), 'error');
  }
}

// ── Build an oEmbed-style rich card ───────────────────────
function buildOEmbedCard(url) {
  const ts   = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const user = currentUser ? currentUser.name : 'Teacher';
  return `
<div style="border:1px solid #d1d1d1; border-radius:8px; padding:16px; max-width:560px; font-family:'Segoe UI',sans-serif;">
  <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
    <div style="width:32px;height:32px;border-radius:4px;background:#6264a7;display:flex;align-items:center;justify-content:center;">
      <span style="color:#fff;font-weight:700;font-size:14px;">T</span>
    </div>
    <div>
      <div style="font-weight:600;font-size:14px;">M365 Copilot Teach</div>
      <div style="font-size:11px;color:#616161;">Created by ${user} · ${ts}</div>
    </div>
  </div>
  <div style="background:#f5f5f5;border-radius:4px;padding:12px;margin-bottom:12px;">
    <div style="font-weight:600;margin-bottom:4px;">📚 Teaching Content</div>
    <div style="font-size:13px;color:#424242;">
      This content was generated with M365 Copilot Teach for Education.
      Open the link below to view or edit in Copilot.
    </div>
  </div>
  <a href="${url}" style="color:#6264a7;font-size:13px;font-weight:600;text-decoration:none;">
    🔗 Open in Copilot Teach →
  </a>
</div>`;
}

// ── Try to read iframe content ────────────────────────────
function extractFrameContent() {
  try {
    const frame = document.getElementById('teachFrame');
    if (frame && frame.contentDocument && frame.contentDocument.body) {
      const sel = frame.contentWindow.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        // User selected text inside the iframe
        const range = sel.getRangeAt(0);
        const div   = document.createElement('div');
        div.appendChild(range.cloneContents());
        return div.innerHTML;
      }
      // Otherwise grab entire body
      return frame.contentDocument.body.innerHTML;
    }
  } catch (e) {
    // Cross-origin – expected
  }

  // Fallback: rich HTML template
  const user = currentUser ? currentUser.name : 'Teacher';
  const ts   = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  return `
<div style="font-family:'Segoe UI',sans-serif; max-width:600px;">
  <h2 style="color:#6264a7; margin-bottom:4px;">🎓 Lesson Plan – Copilot Teach</h2>
  <p style="font-size:12px; color:#888;">Created by ${user} on ${ts}</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:12px 0;"/>
  <h3>Subject &amp; Topic</h3>
  <p><em>[Edit this section in OneNote]</em></p>
  <h3>Learning Objectives</h3>
  <ul>
    <li>Students will be able to…</li>
    <li>Students will understand…</li>
    <li>Students will demonstrate…</li>
  </ul>
  <h3>Lesson Flow</h3>
  <ol>
    <li><strong>Hook</strong> (5 min) – Engage curiosity</li>
    <li><strong>Instruction</strong> (15 min) – Deliver content</li>
    <li><strong>Practice</strong> (15 min) – Guided &amp; independent</li>
    <li><strong>Closure</strong> (5 min) – Reflect &amp; assess</li>
  </ol>
  <h3>Assessment</h3>
  <p>Formative: <em>[method]</em> · Summative: <em>[method]</em></p>
  <h3>Differentiation</h3>
  <table style="border-collapse:collapse;width:100%;font-size:13px;">
    <tr style="background:#f5f5f5;">
      <th style="text-align:left;padding:6px;border:1px solid #e0e0e0;">Learner Group</th>
      <th style="text-align:left;padding:6px;border:1px solid #e0e0e0;">Strategy</th>
    </tr>
    <tr>
      <td style="padding:6px;border:1px solid #e0e0e0;">Advanced</td>
      <td style="padding:6px;border:1px solid #e0e0e0;"><em>[enrichment]</em></td>
    </tr>
    <tr>
      <td style="padding:6px;border:1px solid #e0e0e0;">Struggling</td>
      <td style="padding:6px;border:1px solid #e0e0e0;"><em>[scaffolding]</em></td>
    </tr>
    <tr>
      <td style="padding:6px;border:1px solid #e0e0e0;">ELL</td>
      <td style="padding:6px;border:1px solid #e0e0e0;"><em>[language support]</em></td>
    </tr>
  </table>
</div>`;
}

// ── Toast helper ──────────────────────────────────────────
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast ' + type + ' show';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 4000);
}
