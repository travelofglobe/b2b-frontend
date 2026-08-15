const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/AgencyApplicationPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Fix the "Back to Login" button in success screen
// Replace: bg-slate-100 hover:bg-white/15 text-white ... border border-white/5
content = content.replace(/bg-slate-100 hover:bg-white\/15 text-white (.*?) border border-white\/5/g, 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 $1');

// 2. Reduce font weights
// font-black -> font-bold
// font-bold -> font-semibold (but only if it was originally font-bold. Since we can't easily differentiate in a single pass without a function, we'll use a function)

content = content.replace(/font-black/g, 'font-bold');

// The original labels had 'font-bold' from my previous script. Let's make them 'font-semibold'.
content = content.replace(/font-bold/g, 'font-semibold');

// The inputs currently have 'font-semibold'. Let's make them 'font-medium'.
// But wait, the previous replace just turned all 'font-bold' into 'font-semibold', including the ones we just made 'font-bold' from 'font-black'!
// Let's do it right.

// Re-read file to avoid sequential mess
content = fs.readFileSync(file, 'utf8');

// Fix button first
content = content.replace(/bg-slate-100 hover:bg-white\/15 text-white/g, 'bg-white hover:bg-slate-50 text-slate-700');
content = content.replace(/border border-white\/5 transition-all shadow-md active:scale-\[0\.98\]/g, 'border border-slate-300 transition-all shadow-md active:scale-[0.98]');

// Fix font weights correctly
content = content.replace(/font-black/g, '__TMP_BOLD__');
content = content.replace(/font-bold/g, '__TMP_SEMIBOLD__');
content = content.replace(/font-semibold/g, '__TMP_MEDIUM__');

// Restore the tokens
content = content.replace(/__TMP_BOLD__/g, 'font-bold');
content = content.replace(/__TMP_SEMIBOLD__/g, 'font-semibold');
content = content.replace(/__TMP_MEDIUM__/g, 'font-medium');

fs.writeFileSync(file, content);
console.log('Script done.');
