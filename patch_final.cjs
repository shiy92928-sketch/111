const fs = require('fs');
let code = fs.readFileSync('src/components/StaircaseWaterway.tsx', 'utf-8');

code = code.replace(
  `  const [hasStarted, setHasStarted] = useState(false);
  const [showIntroConfig, setShowIntroConfig] = useState(false);
  const [introConfig, setIntroConfig] = useState({
    cardWidth: 448,
    cardHeight: 620,
    cardX: 0,
    cardY: 0,
    titleScale: 1,
    titleX: 0,
    titleY: 0,
    contentScale: 1,
    contentX: 0,
    contentY: 0,
    btnScale: 1,
    btnX: 0,
    btnY: 0,
  });`,
  `  const [hasStarted, setHasStarted] = useState(false);
  const [introConfig, setIntroConfig] = useState({
    cardWidth: 800,
    cardHeight: 542,
    cardX: 0,
    cardY: 0,
    titleScale: 1,
    titleX: 0,
    titleY: 48,
    contentScale: 1,
    contentX: 153,
    contentY: 40,
    btnScale: 0.6,
    btnX: 29,
    btnY: -31,
  });`
);

const panelStart = code.indexOf('{/* Settings Toggle */}');
const panelEnd = code.indexOf('        <motion.div \n          initial={{ opacity: 0, y: 20 }}');
if (panelStart !== -1 && panelEnd !== -1) {
  code = code.substring(0, panelStart) + code.substring(panelEnd);
}

const btnClassOld = 'className="w-full py-4 rounded-xl bg-zinc-900 text-white font-medium text-lg hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"';
const btnClassNew = 'className="w-full py-4 rounded-xl bg-transparent text-zinc-900 font-medium text-lg hover:bg-black/5 hover:scale-[1.02] active:scale-[0.98] transition-all"';

code = code.replace(btnClassOld, btnClassNew);

fs.writeFileSync('src/components/StaircaseWaterway.tsx', code);
console.log("Final patch applied!");
