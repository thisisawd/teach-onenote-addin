/**
 * Generate Teach add-in icons matching the notebook + apple gradient design.
 * Uses sharp to render SVG -> PNG at multiple sizes.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG icon: notebook + apple with pink/purple/orange gradient
// Matches the Copilot Teach for Education branding
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <!-- Main gradient: pink-orange for apple -->
    <linearGradient id="appleGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF6B9D"/>
      <stop offset="50%" stop-color="#FF8A65"/>
      <stop offset="100%" stop-color="#FFB74D"/>
    </linearGradient>
    <!-- Notebook gradient: purple to pink -->
    <linearGradient id="bookGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#B44AFF"/>
      <stop offset="40%" stop-color="#9C5AFF"/>
      <stop offset="100%" stop-color="#FF6B9D"/>
    </linearGradient>
    <!-- Leaf gradient -->
    <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF8A65"/>
      <stop offset="100%" stop-color="#FFB74D"/>
    </linearGradient>
    <!-- Spiral ring gradient -->
    <linearGradient id="ringGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9C5AFF"/>
      <stop offset="100%" stop-color="#B44AFF"/>
    </linearGradient>
  </defs>

  <!-- Notebook body -->
  <rect x="12" y="16" width="68" height="96" rx="8" ry="8" fill="url(#bookGrad)"/>

  <!-- Notebook page (lighter inner) -->
  <rect x="24" y="22" width="52" height="84" rx="4" ry="4" fill="rgba(255,255,255,0.15)"/>

  <!-- Spiral rings on left side -->
  <g fill="none" stroke="url(#ringGrad)" stroke-width="3.5" stroke-linecap="round">
    <path d="M16,32 C10,32 10,38 16,38"/>
    <path d="M16,46 C10,46 10,52 16,52"/>
    <path d="M16,60 C10,60 10,66 16,66"/>
    <path d="M16,74 C10,74 10,80 16,80"/>
    <path d="M16,88 C10,88 10,94 16,94"/>
  </g>

  <!-- Notebook lines -->
  <g stroke="rgba(255,255,255,0.25)" stroke-width="1.2">
    <line x1="30" y1="38" x2="70" y2="38"/>
    <line x1="30" y1="48" x2="70" y2="48"/>
    <line x1="30" y1="58" x2="70" y2="58"/>
    <line x1="30" y1="68" x2="65" y2="68"/>
    <line x1="30" y1="78" x2="60" y2="78"/>
  </g>

  <!-- Apple body -->
  <path d="M88,52 C75,52 68,64 68,78 C68,96 78,112 88,112 C92,112 95,108 100,108 C105,108 108,112 112,112 C122,112 132,96 132,78 C132,64 125,52 112,52 C106,52 102,56 100,56 C98,56 94,52 88,52 Z" 
        fill="url(#appleGrad)" transform="translate(-8, -4) scale(0.92)"/>

  <!-- Apple stem -->
  <path d="M88,48 C88,40 92,36 96,34" fill="none" stroke="#A0522D" stroke-width="3" stroke-linecap="round" transform="translate(-4, 0)"/>

  <!-- Apple leaf -->
  <path d="M92,38 Q100,28 108,34 Q100,40 92,38 Z" fill="url(#leafGrad)" transform="translate(-6, -2)"/>

  <!-- Small highlight on apple -->
  <ellipse cx="80" cy="64" rx="6" ry="10" fill="rgba(255,255,255,0.2)" transform="rotate(-15, 80, 64)"/>
</svg>`;

const sizes = [16, 32, 64, 80];
const assetsDir = path.join(__dirname, 'assets');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

async function generate() {
  for (const size of sizes) {
    const outPath = path.join(assetsDir, `icon-${size}.png`);
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outPath);
    const stat = fs.statSync(outPath);
    console.log(`Created ${outPath} (${stat.size} bytes)`);
  }
  console.log('Done!');
}

generate().catch(err => { console.error(err); process.exit(1); });
