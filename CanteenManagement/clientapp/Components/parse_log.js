const fs = require('fs');

const logPath = 'C:\\Users\\Shivam Rai\\.gemini\\antigravity\\brain\\9445d04c-d61a-4380-ae4d-d9cd67914ae3\\.system_generated\\logs\\overview.txt';

try {
    const content = fs.readFileSync(logPath, 'utf8');
    
    // Find all occurrences of USER_INPUT containing "dataFetch"
    const lines = content.split('\n');
    let matchedLine = null;
    for (let line of lines) {
        if (line.includes('"USER_INPUT"') && line.includes('dataFetch')) {
            matchedLine = line;
            break;
        }
    }
    
    if (matchedLine) {
        console.log("Found line of length:", matchedLine.length);
        const logObj = JSON.parse(matchedLine);
        const userRequest = logObj.content;
        
        // Find JSON part
        const start = userRequest.indexOf('{');
        const end = userRequest.lastIndexOf('}') + 1;
        if (start !== -1 && end !== -1) {
            const jsonStr = userRequest.substring(start, end);
            const apiData = JSON.parse(jsonStr);
            const table = apiData.dataFetch.table;
            console.log("Table length:", table.length);
            
            // Search if any row has CONT, NAPS, or any other etype
            const contRows = table.filter(r => JSON.stringify(r).toUpperCase().includes('CONT'));
            console.log("Rows containing CONT:", contRows.length);
            if (contRows.length > 0) {
                console.log("Sample row containing CONT:", contRows[0]);
            }
            
            const napsRows = table.filter(r => JSON.stringify(r).toUpperCase().includes('NAPS'));
            console.log("Rows containing NAPS:", napsRows.length);
            if (napsRows.length > 0) {
                console.log("Sample row containing NAPS:", napsRows[0]);
            }
            
            // Let's print unique keys
            const keys = new Set();
            table.forEach(r => Object.keys(r).forEach(k => keys.add(k)));
            console.log("All keys in table:", Array.from(keys));
            
            // Print first 5 rows
            console.log("First 5 rows:", table.slice(0, 5));
        } else {
            console.log("Could not find start/end of JSON in userRequest");
        }
    } else {
        console.log("Could not find line with USER_INPUT and dataFetch");
    }
} catch (err) {
    console.error("Error:", err);
}
