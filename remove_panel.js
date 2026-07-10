const fs = require('fs');
const lines = fs.readFileSync('src/components/StaircaseWaterway.tsx', 'utf-8').split('\n');
// We want to find the line with "{hasStarted && ("
let startIndex = lines.findIndex(line => line.includes('{hasStarted && ('));
let endIndex = lines.findIndex((line, i) => i > startIndex && line.includes('</>'));
// endIndex is at line 1228, followed by ")}" on 1229. We'll search for "{/* Intro Screen */}" instead.
let introIndex = lines.findIndex(line => line.includes('{/* Intro Screen */}'));

if (startIndex !== -1 && introIndex !== -1) {
    // Remove lines from startIndex to introIndex - 1
    lines.splice(startIndex, introIndex - startIndex);
    fs.writeFileSync('src/components/StaircaseWaterway.tsx', lines.join('\n'));
    console.log('Removed panel');
} else {
    console.log('Could not find indices', startIndex, introIndex);
}
