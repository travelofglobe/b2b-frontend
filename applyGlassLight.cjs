const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/AgencyApplicationPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Phone code logic imports
const importStatement = `import { countryCodes } from '../utils/countryCodes';\n`;
if (!content.includes('countryCodes')) {
    content = content.replace(/import { useTranslation } from 'react-i18next';\n/, `import { useTranslation } from 'react-i18next';\n${importStatement}`);
}

// Default phone country code to ''
content = content.replace(/mobilePhoneCountryCode: '\+90',/, `mobilePhoneCountryCode: '',`);

// Step 2 validation update
content = content.replace(
    /if \(!formData\.mobilePhoneNumber\) return currentLang === 'tr' \? 'Cep Telefonu zorunludur' : 'Mobile Phone Number is required';/,
    `if (!formData.mobilePhoneCountryCode) return currentLang === 'tr' ? 'Telefon Kodu seçimi zorunludur' : 'Phone Code is required';\n        if (!formData.mobilePhoneNumber) return currentLang === 'tr' ? 'Cep Telefonu zorunludur' : 'Mobile Phone Number is required';`
);

// Mobile Phone Dropdown
const oldPhoneDropdown = `<select
                                                    name="mobilePhoneCountryCode"
                                                    value={formData.mobilePhoneCountryCode}
                                                    onChange={handleInputChange}
                                                    className="w-24 bg-slate-900 border border-white/10 rounded-2xl py-3 px-3 text-white focus:outline-none text-sm font-semibold"
                                                >
                                                    <option value="+90">+90 (TR)</option>
                                                    <option value="+1">+1 (US)</option>
                                                    <option value="+44">+44 (UK)</option>
                                                    <option value="+49">+49 (DE)</option>
                                                    <option value="+33">+33 (FR)</option>
                                                    <option value="+7">+7 (RU)</option>
                                                    <option value="+971">+971 (AE)</option>
                                                </select>`;
const newPhoneDropdown = `<select
                                                    name="mobilePhoneCountryCode"
                                                    value={formData.mobilePhoneCountryCode}
                                                    onChange={handleInputChange}
                                                    className="w-32 bg-white/60 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl py-3 px-3 text-slate-900 focus:outline-none focus:bg-white/80 transition-all text-sm font-semibold"
                                                >
                                                    <option value="" disabled>{loc.enterManually === 'Elle girin' ? 'Seçiniz' : 'Select'}</option>
                                                    {countryCodes.map((country) => (
                                                        <option key={country.code} value={country.dial_code}>
                                                            {country.emoji} {country.name} ({country.dial_code})
                                                        </option>
                                                    ))}
                                                </select>`;

content = content.replace(/<select[^>]*name="mobilePhoneCountryCode"[\s\S]*?<\/select>/, newPhoneDropdown);

// 2. Styling Replacements
// We want light glassmorphism.
// Main Form Box:
content = content.replace(/bg-white\/\[0\.03\] backdrop-blur-\[40px\] rounded-\[32px\] border border-white\/10 shadow-\[0_32px_96px_-16px_rgba\(0,0,0,0\.5\)\]/g, 'bg-white/85 backdrop-blur-[40px] rounded-[32px] border border-white/60 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)]');
content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-white/40');

// Text Colors
// General text
content = content.replace(/text-white/g, 'text-slate-900'); 
content = content.replace(/text-white\/90/g, 'text-slate-900'); 

// Replace specific button text that got overwritten
content = content.replace(/text-slate-900 font-bold/g, 'text-white font-bold'); // Only inside the success dispatch logic but actually active buttons are better handled differently. Wait, let's fix it after.

// Labels and headers
content = content.replace(/text-slate-400 uppercase tracking-widest/g, 'text-slate-600 uppercase tracking-widest font-bold');
content = content.replace(/text-slate-400 text-sm mb-6/g, 'text-slate-600 text-sm mb-6'); 
content = content.replace(/text-slate-400/g, 'text-slate-600'); 

// Input Fields
content = content.replace(/bg-white\/5 border border-white\/10 rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:bg-white\/10 focus:border-primary\/50/g, 'bg-white/50 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white/80 focus:border-primary/50');
content = content.replace(/bg-white\/5 border rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:bg-white\/10/g, 'bg-white/50 backdrop-blur-md border shadow-sm rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white/80');

// Input border default for error handling (e.g. taxError)
content = content.replace(/border-white\/10 focus:border-primary\/50/g, 'border-white/60 focus:border-primary/50');

// Dropdowns (selects)
content = content.replace(/bg-slate-900 border border-white\/10/g, 'bg-white/60 backdrop-blur-md border border-white/60 shadow-sm');
content = content.replace(/focus:bg-slate-800/g, 'focus:bg-white/80');

// Custom Checkbox
content = content.replace(/bg-white\/5 hover:border-primary/g, 'bg-white/50 hover:bg-white/80 hover:border-primary border border-white/60');
content = content.replace(/border-white\/20 bg-white\/5 hover:border-emerald-500/g, 'border-white/60 bg-white/50 hover:bg-white/80 hover:border-emerald-500');

// Text replacement for some missing spots
content = content.replace(/text-slate-300 hover:text-slate-900/g, 'text-slate-600 hover:text-slate-900');
content = content.replace(/bg-slate-950\/80/g, 'bg-white/60 backdrop-blur-md');
content = content.replace(/bg-slate-900\/95/g, 'bg-white/95 border border-white/60'); // Autocomplete dropdown

// Checkbox inner
content = content.replace(/peer-checked:flex items-center justify-center absolute inset-0 bg-primary rounded-\[3px\] text-slate-900/g, 'peer-checked:flex items-center justify-center absolute inset-0 bg-primary rounded-[3px] text-white');
content = content.replace(/peer-checked:flex items-center justify-center absolute inset-0 bg-emerald-500 rounded-lg text-slate-900/g, 'peer-checked:flex items-center justify-center absolute inset-0 bg-emerald-500 rounded-lg text-white');

// Background Overlay (making it brighter)
content = content.replace(/bg-slate-900\/40/g, 'bg-slate-100/50');
content = content.replace(/from-transparent via-slate-900\/20 to-slate-900\/90/g, 'from-transparent via-slate-100/40 to-slate-100/90');

// Fix Buttons
// Step indicator circles
content = content.replace(/bg-slate-800 text-slate-600 border border-white\/5/g, 'bg-white/60 text-slate-500 border border-white/80 shadow-sm');
content = content.replace(/text-slate-900 shadow-lg shadow-primary\/20/g, 'text-white shadow-lg shadow-primary/20');

// Market buttons (unselected)
content = content.replace(/bg-white\/5 text-slate-600 border-white\/10 hover:bg-white\/10/g, 'bg-white/60 text-slate-600 border-white/60 hover:bg-white/80 shadow-sm');
// Market buttons (selected) - already handled if it uses gradient? 
content = content.replace(/bg-gradient-to-r from-primary to-blue-500 text-slate-900/g, 'bg-gradient-to-r from-primary to-blue-500 text-white');

// Agency type cards
content = content.replace(/border-white\/10 bg-white\/5 text-slate-600 hover:bg-white\/10/g, 'border-white/60 bg-white/50 text-slate-600 hover:bg-white/80 shadow-sm');
content = content.replace(/border-primary bg-primary\/10 text-slate-900/g, 'border-primary bg-primary/10 text-primary'); // Highlight selected text with primary color instead of dark slate for better pop

// Continue / Submit buttons
content = content.replace(/bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary\/25 text-slate-900/g, 'bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/25 text-white');
content = content.replace(/bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500\/25 text-slate-900/g, 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/25 text-white');

// Back Buttons
content = content.replace(/px-6 py-3 bg-white\/5 hover:bg-white\/10 text-slate-900 rounded-2xl/g, 'px-6 py-3 bg-white/60 hover:bg-white/80 border border-white/80 shadow-sm text-slate-700 rounded-2xl');

// Return to Login
content = content.replace(/bg-white\/10 hover:bg-white\/15 text-slate-900/g, 'bg-white/60 hover:bg-white/80 border border-white/80 shadow-sm text-slate-700');

// Error messages
content = content.replace(/text-slate-900 py-4/g, 'text-white py-4');

// File inputs
content = content.replace(/file:bg-white\/10 file:text-slate-900/g, 'file:bg-white/80 file:text-slate-700 file:border-white/60 file:shadow-sm');

// Fix border colors
content = content.replace(/border-white\/5/g, 'border-white/50');
content = content.replace(/border-white\/10/g, 'border-white/60');
content = content.replace(/border-white\/20/g, 'border-white/70');
content = content.replace(/bg-white\/5/g, 'bg-white/50');

fs.writeFileSync(file, content);
console.log('Script done.');
