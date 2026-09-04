const fs = require('fs');
const content = fs.readFileSync('src/components/ListingSearch.jsx', 'utf8');

const lines = content.split('\n');

let start = -1;
let end = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* Elegant Guest Selector */}')) {
        start = i;
    }
    if (start !== -1 && lines[i].includes('</div>') && lines[i].includes('// Google Flights Style Footer') === false && i > start + 100) {
        // Wait, line 1027 is `                </div>`
        if (lines[i].match(/^\s{16}<\/div>$/) && i > start + 110) {
            end = i;
            break;
        }
    }
}
if (start !== -1 && end !== -1) {
    const chunk = lines.slice(start, end + 1);
    const before = lines.slice(0, start);
    const after = lines.slice(end + 1);
    
    // We want to insert the chunk AFTER the datepicker.
    // Let's find the end of the Datepicker.
    let datepickerEnd = -1;
    for (let i = 0; i < after.length; i++) {
        if (after[i].includes('</GoogleFlightDatePicker>')) {
            // wait, it is a self closing tag.
        }
        if (after[i].includes('countryCode={holidayCountryCode}')) {
            datepickerEnd = i + 2; // skip /> and </div>
            break;
        }
    }
    
    if (datepickerEnd !== -1) {
        const newLines = [...before, ...after.slice(0, datepickerEnd + 1), ...chunk, ...after.slice(datepickerEnd + 1)];
        fs.writeFileSync('src/components/ListingSearch.jsx', newLines.join('\n'));
        console.log('Moved guest selector to the right.');
    } else {
        console.log('Could not find Datepicker end');
    }
} else {
    console.log('Could not find guest selector', start, end);
}
