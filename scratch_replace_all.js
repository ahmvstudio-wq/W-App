const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace all button onClicks for signup and login
content = content.replace(/onClick=\{\(\) => \{ setMode\('signup'\); setConfirmationSent\(false\); setIsAuthOpen\(true\) \}\}/g, "onClick={() => router.push('/signup')}");
content = content.replace(/onClick=\{\(\) => \{ setMode\('login'\); setConfirmationSent\(false\); setIsAuthOpen\(true\) \}\}/g, "onClick={() => router.push('/login')}");

// Also in case of the URL param auth_error, it sets isAuthOpen to true.
// I'll change it to redirect to /login with the error.
content = content.replace(
  /const authErr = params\.get\('auth_error'\)\s*if \(authErr\) \{\s*setError\(authErr\)\s*setIsAuthOpen\(true\)\s*setMode\('login'\)\s*\}/g,
  "const authErr = params.get('auth_error')\n      if (authErr) {\n        router.push(`/login?error=${encodeURIComponent(authErr)}`)\n      }"
);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
