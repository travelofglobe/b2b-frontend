const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/AgencyApplicationPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for highlightedCountryIndex
const stateInjection = `
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [highlightedCountryIndex, setHighlightedCountryIndex] = useState(-1);`;

content = content.replace(/const \[countrySearch, setCountrySearch\] = useState\(''\);\s*const \[showCountryDropdown, setShowCountryDropdown\] = useState\(false\);/, stateInjection);

// 2. Add keyboard event handler
const keyboardHandler = `
    const handleCountryKeyDown = (e) => {
        if (!showCountryDropdown || filteredCountries.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedCountryIndex(prev => (prev < filteredCountries.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedCountryIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedCountryIndex >= 0 && highlightedCountryIndex < filteredCountries.length) {
                const c = filteredCountries[highlightedCountryIndex];
                selectCountry(c.id, c.name?.defaultName);
            }
        } else if (e.key === 'Escape') {
            setShowCountryDropdown(false);
        }
    };
`;

content = content.replace(/const handleInputChange = \(e\) => {/, `${keyboardHandler}\n    const handleInputChange = (e) => {`);

// 3. Reset index on search change and show dropdown
const oldOnChange = `onChange={(e) => {
                                                    setCountrySearch(e.target.value);
                                                    setShowCountryDropdown(true);
                                                }}`;
const newOnChange = `onChange={(e) => {
                                                    setCountrySearch(e.target.value);
                                                    setShowCountryDropdown(true);
                                                    setHighlightedCountryIndex(-1);
                                                }}
                                                onKeyDown={handleCountryKeyDown}`;
content = content.replace(oldOnChange, newOnChange);

// 4. Update the dropdown render to highlight the selected item
const oldDropdownMap = `{filteredCountries.map((c) => (
                                                        <div
                                                            key={c.id}
                                                            onClick={() => selectCountry(c.id, c.name?.defaultName)}
                                                            className="px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer font-semibold transition-colors"
                                                        >
                                                            {c.name?.defaultName}
                                                        </div>
                                                    ))}`;

const newDropdownMap = `{filteredCountries.map((c, index) => (
                                                        <div
                                                            key={c.id}
                                                            onMouseEnter={() => setHighlightedCountryIndex(index)}
                                                            onClick={() => selectCountry(c.id, c.name?.defaultName)}
                                                            className={\`px-4 py-2.5 text-sm cursor-pointer font-semibold transition-colors \${
                                                                highlightedCountryIndex === index
                                                                    ? 'text-white bg-white/10'
                                                                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                                                            }\`}
                                                        >
                                                            {c.name?.defaultName}
                                                        </div>
                                                    ))}`;

content = content.replace(oldDropdownMap, newDropdownMap);

fs.writeFileSync(file, content);
console.log('Keyboard nav added.');
