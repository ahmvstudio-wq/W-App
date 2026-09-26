const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

content = content.replace(
  /onOpenAuth=\{\(authMode\) => \{\s*setMode\(authMode\)\s*setConfirmationSent\(false\)\s*setIsAuthOpen\(true\)\s*\}\}/,
  "onOpenAuth={(authMode) => { router.push(`/${authMode}`); setIsMenuOpen(false); }}"
);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
