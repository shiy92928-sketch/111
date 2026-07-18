const fs = require('fs');
let code = fs.readFileSync('src/components/StaircaseWaterway.tsx', 'utf-8');

code = code.replace(
  `  const [introConfig, setIntroConfig] = useState({
    cardWidth: 448,
    cardHeight: 620,
    cardX: 0,
    cardY: 0,
    textScale: 1,
    textX: 0,
    textY: 0,
    btnScale: 1,
    btnX: 0,
    btnY: 0,
  });`,
  `  const [introConfig, setIntroConfig] = useState({
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
  });`
);

const oldControls = `            <h3 className="font-bold text-sm mt-4">Text Config</h3>
            <div>
              <label>Scale ({introConfig.textScale})</label>
              <input type="range" min="0.5" max="2" step="0.1" value={introConfig.textScale} onChange={(e) => setIntroConfig({...introConfig, textScale: +e.target.value})} className="w-full" />
            </div>
            <div>
              <label>X Offset ({introConfig.textX}px)</label>
              <input type="range" min="-200" max="200" value={introConfig.textX} onChange={(e) => setIntroConfig({...introConfig, textX: +e.target.value})} className="w-full" />
            </div>
            <div>
              <label>Y Offset ({introConfig.textY}px)</label>
              <input type="range" min="-200" max="200" value={introConfig.textY} onChange={(e) => setIntroConfig({...introConfig, textY: +e.target.value})} className="w-full" />
            </div>`;

const newControls = `            <h3 className="font-bold text-sm mt-4">Title Config</h3>
            <div>
              <label>Scale ({introConfig.titleScale})</label>
              <input type="range" min="0.5" max="2" step="0.1" value={introConfig.titleScale} onChange={(e) => setIntroConfig({...introConfig, titleScale: +e.target.value})} className="w-full" />
            </div>
            <div>
              <label>X Offset ({introConfig.titleX}px)</label>
              <input type="range" min="-200" max="200" value={introConfig.titleX} onChange={(e) => setIntroConfig({...introConfig, titleX: +e.target.value})} className="w-full" />
            </div>
            <div>
              <label>Y Offset ({introConfig.titleY}px)</label>
              <input type="range" min="-200" max="200" value={introConfig.titleY} onChange={(e) => setIntroConfig({...introConfig, titleY: +e.target.value})} className="w-full" />
            </div>

            <h3 className="font-bold text-sm mt-4">Content Config</h3>
            <div>
              <label>Scale ({introConfig.contentScale})</label>
              <input type="range" min="0.5" max="2" step="0.1" value={introConfig.contentScale} onChange={(e) => setIntroConfig({...introConfig, contentScale: +e.target.value})} className="w-full" />
            </div>
            <div>
              <label>X Offset ({introConfig.contentX}px)</label>
              <input type="range" min="-200" max="200" value={introConfig.contentX} onChange={(e) => setIntroConfig({...introConfig, contentX: +e.target.value})} className="w-full" />
            </div>
            <div>
              <label>Y Offset ({introConfig.contentY}px)</label>
              <input type="range" min="-200" max="200" value={introConfig.contentY} onChange={(e) => setIntroConfig({...introConfig, contentY: +e.target.value})} className="w-full" />
            </div>`;

code = code.replace(oldControls, newControls);

const oldDOM = `          <div 
             className="flex-1 flex flex-col relative"
             style={{
               transform: \`translate(\${introConfig.textX}px, \${introConfig.textY}px) scale(\${introConfig.textScale})\`,
               transformOrigin: 'top center'
             }}
          >
            <h1 className="text-3xl md:text-4xl font-serif text-zinc-900 mb-3 tracking-tight">Rain Memory</h1>
            <p className="text-zinc-600 text-lg mb-8 font-light italic">The rain remembers every touch.</p>
            
            <div className="space-y-6 text-left flex-1">
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-1">💧</span>
                <div>
                  <h3 className="text-zinc-900 font-medium mb-1">Click the screen</h3>
                  <p className="text-zinc-600 text-sm">Let raindrops fall and create ripples.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-1">🥾</span>
                <div>
                  <h3 className="text-zinc-900 font-medium mb-1">Move your cursor</h3>
                  <p className="text-zinc-600 text-sm">Your cursor becomes a rain boot, leaving traces on the water.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-1">🌊</span>
                <div>
                  <h3 className="text-zinc-900 font-medium mb-1">Touch the surface</h3>
                  <p className="text-zinc-600 text-sm">Watch memories spread like waves.</p>
                </div>
              </div>
            </div>
          </div>`;

const newDOM = `          <div className="flex-1 flex flex-col relative w-full">
            <div 
               style={{
                 transform: \`translate(\${introConfig.titleX}px, \${introConfig.titleY}px) scale(\${introConfig.titleScale})\`,
                 transformOrigin: 'top center'
               }}
            >
              <h1 className="text-3xl md:text-4xl font-serif text-zinc-900 mb-3 tracking-tight">Rain Memory</h1>
              <p className="text-zinc-600 text-lg mb-8 font-light italic">The rain remembers every touch.</p>
            </div>
            
            <div 
               className="space-y-6 text-left flex-1"
               style={{
                 transform: \`translate(\${introConfig.contentX}px, \${introConfig.contentY}px) scale(\${introConfig.contentScale})\`,
                 transformOrigin: 'center'
               }}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-1">💧</span>
                <div>
                  <h3 className="text-zinc-900 font-medium mb-1">Click the screen</h3>
                  <p className="text-zinc-600 text-sm">Let raindrops fall and create ripples.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-1">🥾</span>
                <div>
                  <h3 className="text-zinc-900 font-medium mb-1">Move your cursor</h3>
                  <p className="text-zinc-600 text-sm">Your cursor becomes a rain boot, leaving traces on the water.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-1">🌊</span>
                <div>
                  <h3 className="text-zinc-900 font-medium mb-1">Touch the surface</h3>
                  <p className="text-zinc-600 text-sm">Watch memories spread like waves.</p>
                </div>
              </div>
            </div>
          </div>`;

code = code.replace(oldDOM, newDOM);

fs.writeFileSync('src/components/StaircaseWaterway.tsx', code);
console.log("Patched!");
