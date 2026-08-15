const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/AgencyApplicationPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// --- 1. Phone code logic imports & state ---
const importStatement = `import { countryCodes } from '../utils/countryCodes';\n`;
if (!content.includes('countryCodes')) {
    content = content.replace(/import { useTranslation } from 'react-i18next';\n/, `import { useTranslation } from 'react-i18next';\n${importStatement}`);
}

content = content.replace(/mobilePhoneCountryCode: '\+90',/, `mobilePhoneCountryCode: '',`);

content = content.replace(
    /if \(!formData\.mobilePhoneNumber\) return currentLang === 'tr' \? 'Cep Telefonu zorunludur' : 'Mobile Phone Number is required';/,
    `if (!formData.mobilePhoneCountryCode) return currentLang === 'tr' ? 'Telefon Kodu seçimi zorunludur' : 'Phone Code is required';\n        if (!formData.mobilePhoneNumber) return currentLang === 'tr' ? 'Cep Telefonu zorunludur' : 'Mobile Phone Number is required';`
);

const newPhoneDropdown = `<select
                                                    name="mobilePhoneCountryCode"
                                                    value={formData.mobilePhoneCountryCode}
                                                    onChange={handleInputChange}
                                                    className="w-28 bg-white/10 border border-white/20 rounded-xl py-2 px-3 text-white focus:outline-none focus:bg-white/15 focus:border-primary/60 transition-all text-[13px] font-semibold"
                                                >
                                                    <option value="" disabled className="text-slate-900">{loc.enterManually === 'Elle girin' ? 'Seçiniz' : 'Select'}</option>
                                                    {countryCodes.map((country) => (
                                                        <option key={country.code} value={country.dial_code} className="text-slate-900">
                                                            {country.emoji} {country.name} ({country.dial_code})
                                                        </option>
                                                    ))}
                                                </select>`;

content = content.replace(/<select[^>]*name="mobilePhoneCountryCode"[\s\S]*?<\/select>/, newPhoneDropdown);

// --- 2. Refine Dark Glass & Readability ---
// Make inputs slightly more readable (brighter background/border/placeholder)
content = content.replace(/bg-white\/5 border border-white\/10/g, 'bg-white/10 border border-white/20');
content = content.replace(/bg-white\/5 border rounded-2xl/g, 'bg-white/10 border rounded-xl');
content = content.replace(/placeholder:text-slate-400/g, 'placeholder:text-slate-300');
content = content.replace(/focus:bg-white\/10/g, 'focus:bg-white/15');

// Labels readability
content = content.replace(/text-slate-400 uppercase tracking-widest/g, 'text-slate-300 uppercase tracking-widest');
content = content.replace(/text-slate-400 text-sm mb-6/g, 'text-slate-300 text-[13px] mb-5');

// Base select dropdown
content = content.replace(/bg-slate-900 border border-white\/10/g, 'bg-white/10 border border-white/20');
content = content.replace(/focus:bg-slate-800/g, 'focus:bg-white/15');
content = content.replace(/<option value=/g, '<option className="text-slate-900" value=');

// --- 3. Make components and fonts smaller ("kaba görünüm olmamalı") ---
// Main container
content = content.replace(/rounded-\[32px\]/g, 'rounded-[24px]');
content = content.replace(/p-8/g, 'p-6');
content = content.replace(/p-12/g, 'p-8');
content = content.replace(/max-w-4xl/g, 'max-w-3xl');

// Inputs sizing
content = content.replace(/py-3 px-4/g, 'py-2.5 px-3');
content = content.replace(/rounded-2xl/g, 'rounded-xl');
content = content.replace(/text-sm font-semibold/g, 'text-[13px] font-semibold');

// Headings
content = content.replace(/text-3xl/g, 'text-2xl');
content = content.replace(/text-lg/g, 'text-base');
content = content.replace(/mb-6/g, 'mb-4');
content = content.replace(/space-y-6/g, 'space-y-5');
content = content.replace(/gap-4/g, 'gap-3');

// Step indicators
content = content.replace(/size-9/g, 'size-8');
content = content.replace(/text-\[10px\]/g, 'text-[9px]');

// Buttons sizing
content = content.replace(/px-6 py-3/g, 'px-5 py-2.5');
content = content.replace(/px-8 py-3\.5/g, 'px-6 py-3');

fs.writeFileSync(file, content);
console.log('Script done.');
