const fs = require('fs');
const html = fs.readFileSync('current-db-template.html', 'utf8');

// Find all elements that look like a section header:
// `<td style="background: linear-gradient(...`
// Wait, maybe some section headers are NOT linear-gradient?
// A section header looks like:
// `<!-- ─── ENGINEERING SECTION HEADER ─── -->`
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('SECTION HEADER')) {
    console.log(lines[i].trim());
    // Print the next few lines to see its styling
    for (let j = i + 1; j < i + 5; j++) {
      if (lines[j]) console.log('  ' + lines[j].trim());
    }
    console.log('---');
  }
}
