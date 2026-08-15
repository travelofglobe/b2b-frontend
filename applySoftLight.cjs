const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/AgencyApplicationPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// Container
content = content.replace(/bg-white\/\[0\.03\] backdrop-blur-\[40px\] rounded-\[24px\] border border-white\/10 shadow-\[0_32px_96px_-16px_rgba\(0,0,0,0\.5\)\]/g, 'bg-slate-50/95 rounded-[24px] border border-slate-200 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)]');
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-slate-50/95'); // Fallback if any
content = content.replace(/backdrop-blur-\[40px\]/g, 'backdrop-blur-xl'); // Replace remaining blur
content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-white/60'); // inside cards

// General Text
// Be careful with replacing 'text-white' everywhere, some buttons like submit button should keep it.
// I'll replace it generally, then fix the buttons that need 'text-white'.
content = content.replace(/text-white/g, 'text-slate-900'); 
content = content.replace(/text-white\/90/g, 'text-slate-800'); 

// Labels & Subtitles
content = content.replace(/text-slate-300/g, 'text-slate-600');
content = content.replace(/text-slate-400/g, 'text-slate-500');

// Inputs
content = content.replace(/bg-white\/10 border border-white\/20/g, 'bg-white border border-slate-300 shadow-sm');
content = content.replace(/bg-white\/10 border rounded-xl/g, 'bg-white border shadow-sm rounded-xl');
content = content.replace(/focus:bg-white\/15/g, 'focus:bg-slate-50 focus:ring-4 focus:ring-primary/10');
content = content.replace(/focus:border-primary\/60/g, 'focus:border-primary/50');
content = content.replace(/border-white\/20/g, 'border-slate-300'); // specific borders

// Background Overlay
content = content.replace(/bg-slate-900\/40/g, 'bg-slate-100/60');
content = content.replace(/from-transparent via-slate-900\/20 to-slate-900\/90/g, 'from-transparent via-slate-100/40 to-slate-100/90');

// Dropdowns (selects and autocomplete lists)
content = content.replace(/bg-slate-900\/95/g, 'bg-white'); // the country autocomplete container
content = content.replace(/border-white\/10/g, 'border-slate-200'); 
content = content.replace(/hover:bg-white\/10/g, 'hover:bg-slate-100');
content = content.replace(/bg-white\/10/g, 'bg-slate-100'); // for highlighted item

// Custom Checkbox
content = content.replace(/bg-white\/5 hover:border-primary/g, 'bg-white hover:bg-slate-50 hover:border-primary border border-slate-300 shadow-sm');
content = content.replace(/border-white\/20 bg-white\/5 hover:border-emerald-500/g, 'border-slate-300 bg-white hover:bg-slate-50 hover:border-emerald-500 shadow-sm');
content = content.replace(/peer-checked:flex items-center justify-center absolute inset-0 bg-primary rounded-\[3px\] text-slate-900/g, 'peer-checked:flex items-center justify-center absolute inset-0 bg-primary rounded-[3px] text-white');
content = content.replace(/peer-checked:flex items-center justify-center absolute inset-0 bg-emerald-500 rounded-lg text-slate-900/g, 'peer-checked:flex items-center justify-center absolute inset-0 bg-emerald-500 rounded-lg text-white');

// Buttons & Indicators
// Step indicator circles
content = content.replace(/bg-slate-800 text-slate-500 border border-white\/5/g, 'bg-slate-100 text-slate-500 border border-slate-200');
content = content.replace(/text-slate-900 shadow-lg shadow-primary\/20/g, 'text-white shadow-lg shadow-primary/20'); // Fix active step text

// Market buttons
content = content.replace(/bg-white\/5 text-slate-600 border-slate-200 hover:bg-slate-100/g, 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 shadow-sm');
content = content.replace(/bg-gradient-to-r from-primary to-blue-500 text-slate-900/g, 'bg-gradient-to-r from-primary to-blue-500 text-white');

// Agency type cards
content = content.replace(/border-slate-200 bg-white\/5 text-slate-600 hover:bg-slate-100/g, 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 shadow-sm');
content = content.replace(/border-primary bg-primary\/10 text-slate-900/g, 'border-primary bg-primary/10 text-primary');

// Continue / Submit buttons
content = content.replace(/bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary\/25 text-slate-900/g, 'bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/25 text-white');
content = content.replace(/bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500\/25 text-slate-900/g, 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/25 text-white');

// Back Buttons
content = content.replace(/bg-white\/5 hover:bg-slate-100 text-slate-900/g, 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm');

// Return to Login
content = content.replace(/bg-white\/10 hover:bg-white\/15 text-slate-900/g, 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm');

// Error messages
content = content.replace(/text-slate-900 py-4/g, 'text-white py-4');

// File inputs
content = content.replace(/file:bg-white\/10 file:text-slate-900/g, 'file:bg-slate-100 file:text-slate-700 file:border-slate-300');

fs.writeFileSync(file, content);
console.log('Script done.');
