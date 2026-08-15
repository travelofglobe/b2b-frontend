const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/AgencyApplicationPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Immersive Background & simplify root
content = content.replace(/<div className="absolute inset-0 z-0">[\s\S]*?<\/div>/, ''); 
content = content.replace(/<div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">/, '<div className="min-h-screen w-full flex items-center justify-center relative overflow-y-auto bg-slate-50 font-sans py-12">');
content = content.replace(/<div className="relative z-20 w-full max-w-3xl mx-auto px-6 py-12">/, '<div className="relative z-20 w-full max-w-3xl mx-auto px-4">');

// 2. Main Form Card
content = content.replace(/bg-slate-50\/95 rounded-\[24px\] border border-slate-200 shadow-\[0_32px_96px_-16px_rgba\(0,0,0,0\.1\)\]/g, 'bg-white rounded-[24px] border border-slate-200 shadow-2xl shadow-slate-200/60');
content = content.replace(/bg-white\/60/g, 'bg-white'); // Fix header header backgrounds

// 3. Typography & Lines
// Header area
content = content.replace(/border-b border-white\/5/g, 'border-b border-slate-100');

// Labels
content = content.replace(/text-slate-600 uppercase tracking-widest/g, 'text-slate-500 font-bold uppercase tracking-widest'); // Make labels a bit crisper

// Input fields styling
// Remove the 'bg-white border-slate-300' if it has 'shadow-sm' and make it solid
// Currently: className="w-full bg-white border border-slate-300 shadow-sm rounded-xl py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-slate-50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-[13px] font-semibold"
content = content.replace(/bg-white border border-slate-300 shadow-sm rounded-xl/g, 'bg-white border border-slate-300 shadow-sm rounded-xl'); // Already good
content = content.replace(/focus:bg-slate-50 focus:border-primary\/50 focus:ring-4 focus:ring-primary\/10/g, 'focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'); // better focus

// Phone Country Dropdown
// Currently: className="w-28 bg-white border border-slate-300 shadow-sm rounded-xl py-2 px-3 text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-[13px] font-semibold"
content = content.replace(/focus:bg-slate-50 focus:border-primary\/50 focus:ring-4 focus:ring-primary\/10/g, 'focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10');

// Country Autocomplete Dropdown list
content = content.replace(/bg-white border border-slate-200 rounded-xl/g, 'bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50');

// Checkboxes and file uploads are already solid white since applySoftLight.cjs
// Just double check border of unselected items
content = content.replace(/border-slate-200 bg-slate-100/g, 'border-slate-200 bg-slate-50'); 

// 4. Stepper adjustments
content = content.replace(/bg-slate-100 text-slate-500 border border-slate-200/g, 'bg-white text-slate-400 border-2 border-slate-200 font-bold');
content = content.replace(/absolute top-4 left-0 right-0 h-1 bg-slate-100 z-0 rounded/g, 'absolute top-4 left-0 right-0 h-1 bg-slate-200 z-0 rounded');

// Fix 'text-slate-900 shadow-lg shadow-primary/20' -> wait, my soft light script made it 'text-white shadow-lg shadow-primary/20'. Let's keep it.

fs.writeFileSync(file, content);
console.log('Script done.');
