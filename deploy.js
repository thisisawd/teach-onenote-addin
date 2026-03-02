/**
 * deploy.js – Stamps the manifest with the deployment URL,
 * then prints instructions.
 *
 * Usage:  node deploy.js https://your-site.vercel.app
 */

const fs   = require('fs');
const path = require('path');

const deployUrl = process.argv[2];
if (!deployUrl) {
  console.error('Usage:  node deploy.js <HTTPS_URL>');
  console.error('Example: node deploy.js https://teach-addin.vercel.app');
  process.exit(1);
}

const url = deployUrl.replace(/\/+$/, '');   // trim trailing slash

const manifest = path.join(__dirname, 'manifest.xml');
let xml = fs.readFileSync(manifest, 'utf8');
xml = xml.replace(/https:\/\/DEPLOY_URL/g, url);
fs.writeFileSync(manifest, xml, 'utf8');

console.log(`\n✅  manifest.xml updated with: ${url}`);
console.log(`\nNext step:`);
console.log(`  1. Open OneNote Online`);
console.log(`  2. Insert → Get Add-ins → Upload My Add-in`);
console.log(`  3. Upload:  ${manifest}`);
console.log(`  4. Click the "Teach" button in the ribbon\n`);
