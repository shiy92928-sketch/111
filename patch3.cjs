const fs = require('fs');
const lines = fs.readFileSync('src/components/StaircaseWaterway.tsx', 'utf-8').split('\n');

const idx = lines.findIndex(line => line.includes("}  const bootSvgUrl"));
if (idx !== -1) {
    const replacement = `      }
      synth.updateAmbient(0, 0);
      if (synth.ctx) {
         try { synth.ctx.suspend(); } catch (e) {}
      }
    };
  }, []);

  const bootSvgUrl`;
    
    lines[idx] = lines[idx].replace("}  const bootSvgUrl", replacement);
    fs.writeFileSync('src/components/StaircaseWaterway.tsx', lines.join('\n'));
    console.log("Patched!");
} else {
    console.log("Not found!");
}
