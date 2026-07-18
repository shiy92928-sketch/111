const fs = require('fs');
let code = fs.readFileSync('src/components/StaircaseWaterway.tsx', 'utf-8');

const btnClassOld = 'className="w-full py-4 rounded-xl bg-transparent text-zinc-900 font-medium text-lg hover:bg-black/5 hover:scale-[1.02] active:scale-[0.98] transition-all"';
const btnClassNew = 'className="w-full py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-zinc-900 font-medium text-lg hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all"';

code = code.replace(btnClassOld, btnClassNew);

fs.writeFileSync('src/components/StaircaseWaterway.tsx', code);
console.log("Button patched!");
