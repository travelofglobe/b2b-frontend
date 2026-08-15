const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/AgencyApplicationPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// Global changes
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-white/80');
content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-white/40');
content = content.replace(/bg-white\/5/g, 'bg-white');
content = content.replace(/bg-white\/10/g, 'bg-slate-50');
content = content.replace(/text-white\/90/g, 'text-slate-800');
content = content.replace(/text-white/g, 'text-slate-900');
content = content.replace(/text-slate-400/g, 'text-slate-500');
content = content.replace(/text-slate-300/g, 'text-slate-600');
content = content.replace(/border-white\/10/g, 'border-slate-300');
content = content.replace(/border-white\/5/g, 'border-slate-200');
content = content.replace(/bg-slate-900/g, 'bg-white');
content = content.replace(/focus:bg-slate-800/g, 'focus:bg-slate-50');

// Input fields specific changes to add focus rings
content = content.replace(/focus:bg-white\/10/g, 'focus:bg-white focus:ring-2 focus:ring-primary/20');
content = content.replace(/placeholder:text-slate-400/g, 'placeholder:text-slate-400 text-slate-800');

// Labels
content = content.replace(/text-slate-500 uppercase tracking-widest/g, 'text-slate-600 uppercase tracking-widest');

// Fix step buttons (disabled or active)
content = content.replace(/bg-slate-800 text-slate-400 border border-slate-200/g, 'bg-slate-100 text-slate-500 border border-slate-300'); // Note text-slate-400 already changed to 500, border-white/5 to border-slate-200

// Fix active step buttons text color that was incorrectly made slate-900 (it was text-white)
content = content.replace(/text-slate-900 shadow-lg/g, 'text-white shadow-lg');
content = content.replace(/text-slate-900 rounded-2xl/g, 'text-white rounded-2xl');

// Submit/continue button texts should remain white
content = content.replace(/text-slate-900 py-4/g, 'text-white py-4'); // return to login
content = content.replace(/text-slate-900 font-bold/g, 'text-white font-bold'); // active types 

// Fix success text
content = content.replace(/text-slate-900 font-black/g, 'text-slate-800 font-black');

// Dropdowns background
content = content.replace(/bg-slate-950\/80/g, 'bg-slate-50');
content = content.replace(/bg-white\/95/g, 'bg-white/95');

// Make borders around inputs more pronounced
content = content.replace(/border border-slate-300/g, 'border border-slate-300 shadow-sm');

// Form Background
content = content.replace(/bg-white\/80 backdrop-blur-\[40px\] rounded-\[32px\] border border-slate-300/g, 'bg-white/90 backdrop-blur-3xl rounded-[32px] border border-slate-200 shadow-2xl');
content = content.replace(/bg-slate-900\/40/g, 'bg-white/60');
content = content.replace(/from-transparent via-slate-900\/20 to-slate-900\/90/g, 'from-transparent via-white/50 to-white/95');
content = content.replace(/bg-slate-900\/95/g, 'bg-white/95 border-slate-200');

fs.writeFileSync(file, content);
console.log('Styles updated.');
