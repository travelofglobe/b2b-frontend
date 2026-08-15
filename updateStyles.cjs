const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/AgencyApplicationPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// Store original components that we want to remain dark/white before global replace
// Save the background gradients and images which we want to carefully control
// Also save button backgrounds (primary gradient ones)
content = content.replace(/bg-gradient-to-r from-primary to-blue-500/g, 'bg-gradient-to-r from-primary to-blue-600');
content = content.replace(/bg-gradient-to-r from-emerald-500 to-teal-600/g, 'bg-gradient-to-r from-emerald-600 to-teal-700');

// Main Form Box design
content = content.replace(/bg-white\/\[0\.03\] backdrop-blur-\[40px\] rounded-\[32px\] border border-white\/10 shadow-\[0_32px_96px_-16px_rgba\(0,0,0,0\.5\)\]/g, 'bg-white/95 backdrop-blur-3xl rounded-[32px] border border-slate-200 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)]');
content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-slate-50/50');
content = content.replace(/border-white\/5/g, 'border-slate-200');
content = content.replace(/border border-white\/10/g, 'border border-slate-300 shadow-sm');
content = content.replace(/bg-white\/5/g, 'bg-white');
content = content.replace(/bg-white\/10/g, 'bg-slate-50');
content = content.replace(/bg-slate-900/g, 'bg-white');

// Input Text Colors
content = content.replace(/text-white placeholder:text-slate-400/g, 'text-slate-900 placeholder:text-slate-400');
content = content.replace(/text-slate-300 hover:text-white/g, 'text-slate-600 hover:text-slate-900');

// Focus states for inputs
content = content.replace(/focus:bg-white\/10 focus:border-primary\/50/g, 'focus:bg-white focus:border-primary/60 focus:ring-4 focus:ring-primary/10');
content = content.replace(/focus:bg-slate-800/g, 'focus:bg-slate-50 focus:border-primary/60 focus:ring-4 focus:ring-primary/10');

// Labels and headers
content = content.replace(/text-white/g, 'text-slate-900'); // General text
content = content.replace(/text-white\/90/g, 'text-slate-900'); // Headers
content = content.replace(/text-slate-400 uppercase tracking-widest/g, 'text-slate-600 uppercase tracking-widest font-bold'); // Labels

// Steps numbers
content = content.replace(/bg-slate-800 text-slate-400 border border-slate-200/g, 'bg-slate-100 text-slate-400 border border-slate-200');

// Fix buttons explicitly
content = content.replace(/text-slate-900 shadow-lg/g, 'text-white shadow-lg'); // active step buttons
content = content.replace(/text-slate-900 rounded-2xl font-black uppercase text-xs tracking-wider transition-all/g, 'text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all'); // continue/submit buttons
content = content.replace(/px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl/g, 'px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl'); // back buttons

// Custom checkbox
content = content.replace(/bg-white hover:border-primary/g, 'bg-white border-slate-300 hover:border-primary'); // checkbox unchecked

// Text replacements for subtexts
content = content.replace(/text-slate-400 text-sm mb-6/g, 'text-slate-500 text-sm mb-6'); // subtitle
content = content.replace(/text-slate-400/g, 'text-slate-500'); // General secondary text

// Background gradient
content = content.replace(/bg-slate-900\/40/g, 'bg-white/40');
content = content.replace(/from-transparent via-slate-900\/20 to-slate-900\/90/g, 'from-transparent via-white/50 to-white/95');

// Dropdowns
content = content.replace(/bg-slate-950\/80/g, 'bg-slate-50');

// Radio buttons for Agency Type
content = content.replace(/bg-white text-slate-500 hover:bg-slate-50/g, 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200');
content = content.replace(/bg-primary\/10 text-slate-900/g, 'bg-primary text-white border-primary');

// Specific text-white fixes
content = content.replace(/peer-checked:flex items-center justify-center absolute inset-0 bg-primary rounded-\[3px\] text-slate-900/g, 'peer-checked:flex items-center justify-center absolute inset-0 bg-primary rounded-[3px] text-white');
content = content.replace(/peer-checked:flex items-center justify-center absolute inset-0 bg-emerald-500 rounded-lg text-slate-900/g, 'peer-checked:flex items-center justify-center absolute inset-0 bg-emerald-500 rounded-lg text-white');
content = content.replace(/text-[7px] font-black uppercase text-slate-600/g, 'text-[7px] font-black uppercase text-slate-400'); // Recaptcha tiny text

// Success panel
content = content.replace(/text-slate-900 py-4/g, 'text-white py-4');

// Form Background again (just in case the original regex failed)
content = content.replace(/bg-white\/\[0\.03\] backdrop-blur-\[40px\] rounded-\[32px\] border border-white\/10/g, 'bg-white/95 backdrop-blur-3xl rounded-[32px] border border-slate-200 shadow-2xl');

// Add phone codes import and usage logic update
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
                                                    className="w-24 bg-white border border-slate-300 shadow-sm rounded-2xl py-3 px-3 text-slate-900 focus:outline-none text-sm font-semibold"
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
                                                    className="w-32 bg-white border border-slate-300 shadow-sm rounded-2xl py-3 px-3 text-slate-900 focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-semibold"
                                                >
                                                    <option value="" disabled>{loc.enterManually === 'Elle girin' ? 'Seçiniz' : 'Select'}</option>
                                                    {countryCodes.map((country) => (
                                                        <option key={country.code} value={country.dial_code}>
                                                            {country.emoji} {country.name} ({country.dial_code})
                                                        </option>
                                                    ))}
                                                </select>`;

content = content.replace(/<select[^>]*name="mobilePhoneCountryCode"[\s\S]*?<\/select>/, newPhoneDropdown);

fs.writeFileSync(file, content);
console.log('Script done.');
