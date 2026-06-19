const fs = require('fs');
const path = 'dist/index.html';
const html = fs.readFileSync(path, 'utf8');
const patched = html.replace(
  /width=device-width, initial-scale=1[^"]*/,
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
);
fs.writeFileSync(path, patched);
console.log('Patched viewport in dist/index.html');
