const fs = require('fs');
const lines = fs.readFileSync('src/components/StaircaseWaterway.tsx', 'utf-8').split('\n');
let startIndex = lines.findIndex(line => line.includes('{hasStarted && ('));
let introIndex = lines.findIndex(line => line.includes('{/* Intro Screen */}'));

if (startIndex !== -1 && introIndex !== -1) {
    lines.splice(startIndex, introIndex - startIndex);
    fs.writeFileSync('src/components/StaircaseWaterway.tsx', lines.join('\n'));
    console.log('Removed panel');
} else {
    console.log('Could not find indices', startIndex, introIndex);
}
