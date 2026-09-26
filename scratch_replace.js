const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace login button
content = content.replace(
  /<button\s+onClick=\{\(\) => \{ setMode\('login'\); setConfirmationSent\(false\); setIsAuthOpen\(true\) \}\}\s+className="hidden sm:inline-block text-xs font-medium text-neutral-600 hover:text-black px-3.5 py-1.5 transition-colors cursor-pointer"\s*>\s*Sign In\s*<\/button>/,
  '<Link href="/login" className="hidden sm:inline-block text-xs font-medium text-neutral-600 hover:text-black px-3.5 py-1.5 transition-colors cursor-pointer">Sign In</Link>'
);

// Replace signup button
content = content.replace(
  /<button\s+onClick=\{\(\) => \{ setMode\('signup'\); setConfirmationSent\(false\); setIsAuthOpen\(true\) \}\}\s+className="px-5 py-2 sm:py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium shadow-xs hover:shadow-md active:scale-\[0.98\] transition-all cursor-pointer"\s*>\s*Get Started\s*<\/button>/,
  '<Link href="/signup" className="px-5 py-2 sm:py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium shadow-xs hover:shadow-md active:scale-[0.98] transition-all cursor-pointer">Get Started</Link>'
);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
