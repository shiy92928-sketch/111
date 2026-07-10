const fs = require('fs');
let code = fs.readFileSync('src/components/StaircaseWaterway.tsx', 'utf-8');

code = code.replace(
  `    return () => {
      myP5.remove();
      if (containerRef.current) {
          containerRef.current.innerHTML = ''; // Ensure canvas is removed
      }  const bootSvgUrl`,
  `    return () => {
      myP5.remove();
      if (containerRef.current) {
          containerRef.current.innerHTML = ''; // Ensure canvas is removed
      }
      synth.updateAmbient(0, 0);
      if (synth.ctx) {
         try { synth.ctx.suspend(); } catch (e) {}
      }
    };
  }, []);

  const bootSvgUrl`
);
fs.writeFileSync('src/components/StaircaseWaterway.tsx', code);
