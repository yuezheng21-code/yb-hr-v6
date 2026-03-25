const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('./src/i18n/index.js', 'utf8');
// Remove export keywords and the translate/LANG_OPTIONS exports to isolate I18N object
const cleaned = content
  .replace(/^export\s+const\s+RTL_LANGS[^;]+;/m, '')
  .replace(/^export\s+function\s+translate[\s\S]*?\n\}/m, '')
  .replace(/^export\s+const\s+LANG_OPTIONS[\s\S]*?\];/m, '')
  .replace(/^export\s+/gm, '');

eval(cleaned);

const langs = ['zh', 'en', 'de', 'tr', 'ar', 'hu', 'vi', 'pl'];
for (const lang of langs) {
  if (!I18N[lang]) { console.error(`Missing lang: ${lang}`); continue; }
  fs.writeFileSync(`./src/i18n/${lang}.json`, JSON.stringify(I18N[lang], null, 2), 'utf8');
  console.log(`Written ${lang}.json with ${Object.keys(I18N[lang]).length} keys`);
}
