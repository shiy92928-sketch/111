import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { motion } from 'motion/react';

class SoundSynthesizer {
  ctx: AudioContext | null = null;
  ambientNoise: AudioBufferSourceNode | null = null;
  ambientGain: GainNode | null = null;
  ambientFilter: BiquadFilterNode | null = null;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    this.startAmbient();
  }

  startAmbient() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Pink noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11;
        b6 = white * 0.115926;
    }

    this.ambientNoise = this.ctx.createBufferSource();
    this.ambientNoise.buffer = buffer;
    this.ambientNoise.loop = true;

    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.value = 400;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0;

    this.ambientNoise.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);
    
    this.ambientNoise.start();
  }

  updateAmbient(density: number, speed: number) {
    if (!this.ctx || !this.ambientGain || !this.ambientFilter) return;
    // density 0-1, speed 0-5
    const targetGain = Math.min(0.2, (density * 0.5 + 0.1) * speed * 0.02);
    const targetFreq = 100 + speed * 150 + density * 300;
    
    this.ambientGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    this.ambientFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  playSplash(intensity: number, yRatio: number) {
    if (!this.ctx) {
      this.init();
      if (!this.ctx) return;
    }
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    // Higher up screen -> higher pitch
    const baseFreq = 300 + (1 - yRatio) * 800 + (Math.random() * 100 - 50);
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(Math.min(0.2, intensity * 0.015), this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

const synth = new SoundSynthesizer();

const StaircaseWaterway: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(isRecording);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [bgColor, setBgColor] = useState('#9aa8b6');
  
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);
  
  // New controls
  const [particleColor, setParticleColor] = useState('#fffaf5');
  const [trailLength, setTrailLength] = useState(11); // 1-100, maps to bg alpha
  const [blurAmount, setBlurAmount] = useState(1.5); // 0-5
  const [fallSpeed, setFallSpeed] = useState(2.2); // 0-5
  const [gravityAcc, setGravityAcc] = useState(1.75); // 0-2
  const [amplitude, setAmplitude] = useState(2.5); // 0-10
  
  // Rainboot controls
  const [bootColor, setBootColor] = useState('#facc15');
  const [bootSize, setBootSize] = useState(55);
  const [splashColor, setSplashColor] = useState('#fedccd');
  const [rippleColor, setRippleColor] = useState('#ffffff');
  const [highlightColor, setHighlightColor] = useState('#ffdfc2');
  const [isFalling, setIsFalling] = useState(true);
  const [isConfigVisible, setIsConfigVisible] = useState(false);
  const [slopeAngle, setSlopeAngle] = useState(1.5); // -5 to 5
  
  const [particleSize, setParticleSize] = useState(3.5); // 1-10
  const [splashSize, setSplashSize] = useState(3.5); // 1-10
  const [splashRange, setSplashRange] = useState(14); // 5-50
  const [particleShape, setParticleShape] = useState('dot'); // 'dot', 'number', 'letter', 'text', 'leaf', 'petal'

  const bgColorRef = useRef(bgColor);
  const particleColorRef = useRef(particleColor);
  const splashColorRef = useRef(splashColor);
  const rippleColorRef = useRef(rippleColor);
  const highlightColorRef = useRef(highlightColor);
  const trailLengthRef = useRef(trailLength);
  const blurAmountRef = useRef(blurAmount);
  const fallSpeedRef = useRef(fallSpeed);
  const gravityAccRef = useRef(gravityAcc);
  const amplitudeRef = useRef(amplitude);
  const isFallingRef = useRef(isFalling);
  const slopeAngleRef = useRef(slopeAngle);
  const particleSizeRef = useRef(particleSize);
  const splashSizeRef = useRef(splashSize);
  const splashRangeRef = useRef(splashRange);
  const particleShapeRef = useRef(particleShape);

  useEffect(() => {
    bgColorRef.current = bgColor;
  }, [bgColor]);

  useEffect(() => { particleColorRef.current = particleColor; }, [particleColor]);
  useEffect(() => { splashColorRef.current = splashColor; }, [splashColor]);
  useEffect(() => { rippleColorRef.current = rippleColor; }, [rippleColor]);
  useEffect(() => { highlightColorRef.current = highlightColor; }, [highlightColor]);
  useEffect(() => { trailLengthRef.current = trailLength; }, [trailLength]);
  useEffect(() => { blurAmountRef.current = blurAmount; }, [blurAmount]);
  useEffect(() => { fallSpeedRef.current = fallSpeed; }, [fallSpeed]);
  useEffect(() => { gravityAccRef.current = gravityAcc; }, [gravityAcc]);
  useEffect(() => { amplitudeRef.current = amplitude; }, [amplitude]);
  useEffect(() => { isFallingRef.current = isFalling; }, [isFalling]);
  useEffect(() => { slopeAngleRef.current = slopeAngle; }, [slopeAngle]);
  useEffect(() => { particleSizeRef.current = particleSize; }, [particleSize]);
  useEffect(() => { splashSizeRef.current = splashSize; }, [splashSize]);
  useEffect(() => { splashRangeRef.current = splashRange; }, [splashRange]);
  useEffect(() => { particleShapeRef.current = particleShape; }, [particleShape]);


  useEffect(() => {
    if (!containerRef.current) return;

    let myP5: p5;

    const sketch = (p: p5) => {
      let particles: any[] = [];
      let activeCircles: any[] = [];
      let activeThrows: any[] = [];
      let time = 0;

      const cstep = 20;
      const rstep = 50;
      const tbounce = 20;
      const rings = 3;
      const rlim = 400;
      
      const addCircle = (x: number, y: number) => {
        for (let i = 0; i < rings; i++) {
          activeCircles.push({
            r: 20 * (i + 1) * (y / p.height),
            pos: [x, y],
            alpha: (1 - y / p.height) * 200 * (i + 1)
          });
        }
      };

      const growCircle = (c: any) => {
        let { r, pos, alpha } = c;
        pos = [pos[0], pos[1]];
        r = r + (rstep / 10) * (pos[1] / p.height) * Math.max(0.5, splashSizeRef.current * 0.25);
        alpha -= (cstep / 10);
        return { r, pos, alpha };
      };

      const bounce = (t: any) => {
        let { bounces, xstep, ystep, pos, b } = t;
        pos = [pos[0] + xstep, pos[1] - ystep];
        b = b + 1;
        ystep = ystep * p.random(0.8, 0.9);
        return { bounces, xstep, ystep, pos, b };
      };

      const getDimensions = () => {
        if (containerRef.current) {
          return { w: containerRef.current.clientWidth, h: containerRef.current.clientHeight };
        }
        return { w: window.innerWidth, h: window.innerHeight };
      };

      const hexToRgb = (hex: string) => {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };

      p.setup = () => {
        const dim = getDimensions();
        p.createCanvas(dim.w, dim.h);
        p.noSmooth();
      };

      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          synth.init();
          
          if (activeThrows.length > 5) return; // limit active throws
          
          let yFactor = Math.max(0.1, p.mouseY / p.height);
          
          synth.playSplash(splashRangeRef.current, p.mouseY / p.height);
          
          activeThrows.push({
            bounces: p.random(3, 12),
            xstep: p.random([-60, -40, -20, 20, 40, 60]) * (yFactor * 2) * (splashRangeRef.current / 20),
            ystep: p.random(80, 100) * (yFactor - 0.02) * (splashRangeRef.current / 20),
            pos: [p.mouseX, p.mouseY],
            b: 0
          });
          addCircle(p.mouseX, p.mouseY);
        }
      };

      p.draw = () => {
        if (!isRecordingRef.current) {
          const dim = getDimensions();
          if (p.width !== dim.w || p.height !== dim.h) {
            p.resizeCanvas(dim.w, dim.h);
            p.noSmooth();
          }
        }

        // Background with slight fading and blur,
        // so trails remain visible and look like flowing water.
        const bgRgb = hexToRgb(bgColorRef.current);
        const trailAlpha = p.map(trailLengthRef.current, 1, 100, 50, 1);
        p.background(bgRgb.r, bgRgb.g, bgRgb.b, trailAlpha);
        
        if (blurAmountRef.current > 0) {
          p.filter(p.BLUR, blurAmountRef.current); 
        }

        // Moved stroke color directly to particle render loop to allow dynamic opacity/color per layer

        const isComplex = particleShapeRef.current !== 'dot';
        const maxParticles = isComplex ? 150 : Math.floor(p.width * 9);
        
        // Trim arrays immediately when switching to complex to free up rendering budget
        if (particles.length > maxParticles) {
          particles.length = maxParticles;
        }

        if (isFallingRef.current) {
          /* ---- particle creation loop ---- */
          let spawnCount = isComplex ? 1 : Math.max(2, Math.floor(p.width / 60));
          
          // Stagger generation frequency for complex shapes
          if (isComplex && p.frameCount % 3 !== 0) {
            spawnCount = 0;
          }

          let i = spawnCount;
          while (i > 0) {
            i--;

            // The particle index depends on time,
            // so older particles get replaced cyclically.
            let index = time % maxParticles;

            // Extend the spawn range so that as they drift, they still cover the canvas
            let maxDrift = (p.height / Math.max(0.1, fallSpeedRef.current)) * Math.abs(slopeAngleRef.current);
            let margin = maxDrift + 50;
            // Spatially spread across wrapped width
            let totalWidth = p.width + margin * 2;
            let px = -margin + ((time * p.random(77, 122)) % totalWidth);

            // depth layer for multi-layered gradient falling
            let layer = p.random(0.3, 1.2);

            // Generate random shape val
            let shapeVal = '';
            if (particleShapeRef.current === 'number') {
              shapeVal = p.floor(p.random(0, 10)).toString();
            } else if (particleShapeRef.current === 'letter') {
              shapeVal = String.fromCharCode(p.floor(p.random(65, 91)));
            } else if (particleShapeRef.current === 'text') {
              const chars = "天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏水雨云雪风霜冰露";
              shapeVal = chars.charAt(p.floor(p.random(chars.length)));
            } else if (particleShapeRef.current === 'leaf') {
              shapeVal = p.random(['🍃', '🍁', '🍂', '🌿']);
            } else if (particleShapeRef.current === 'petal') {
              shapeVal = p.random(['🌸', '🌺', '🌹', '💮']);
            }

            // Each particle starts at the top
            let obj = {
              x: px,
              y: -100,
              g: 0, 
              vx: 0,
              vy: 0,
              s: particleSizeRef.current * layer, // size scaled by depth and config
              layer: layer,
              shapeVal: shapeVal,
              rotation: p.random(p.TWO_PI)
            };

            // Store in particles array
            particles[index] = obj;
            time = time + 1;
          }
        }

        // Spatial hash grid for particle interaction
        const cellSize = 30;
        const gridCols = Math.ceil(p.width / cellSize) + 2;
        const gridRows = Math.ceil(p.height / cellSize) + 2;
        const grid: number[][] = new Array(gridCols * gridRows).fill(0).map(() => []);

        for (let i = 0; i < particles.length; i++) {
          let pt = particles[i];
          if (!pt || pt.s <= 0) continue;
          let col = Math.floor(pt.x / cellSize);
          let row = Math.floor(pt.y / cellSize);
          if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
            grid[row * gridCols + col].push(i);
          }
        }

        /* ---- particle update & render loop ----
         * This is where each particle is instructed how to "flow"
         * down the stairs. Motion is guided by Perlin noise
         * instead of fixed gravity, so the drops sometimes
         * fall straight, sometimes hesitate and slide sideways,
         * mimicking the way water splits and searches for channels.
         */
        for (let idx = 0; idx < particles.length; idx++) {
          let pt = particles[idx];
          if (!pt || pt.s <= 0) continue;

          let layer = pt.layer || 1;
          let layerSpeed = layer * layer; // deeper particles move significantly slower

          // Slowly shrink the droplet as it moves down,
          // like water dispersing into the surface.
          pt.s = pt.s * 0.998;
          p.strokeWeight(pt.s);

          // depth-based gradient visibility
          const pCol = hexToRgb(particleColorRef.current);
          p.stroke(pCol.r, pCol.g, pCol.b, p.map(layer, 0.3, 1.2, 40, 255));

          // Perlin noise is used as a "terrain map"
          // that tells particles when to fall vs. when to slide.
          let Noise = p.noise(pt.x / p.width, pt.y / 9, time / p.width);
          
          // Hover repulsion
          let d = p.dist(p.mouseX, p.mouseY, pt.x, pt.y);
          if (d < 50) {
            let angle = p.atan2(pt.y - p.mouseY, pt.x - p.mouseX);
            pt.x += p.cos(angle) * 3;
            pt.g -= 0.2; // Push upward slightly
          }

          /* --- horizontal motion ---
           * If noise is high, the drop sticks to its vertical path.
           * If noise is lower, we make the drop jitter sideways,
           * producing the staircase-like zig-zag motion.
           */
          if (Noise > 0.4) {
            // Slope drift
            pt.x += slopeAngleRef.current * layerSpeed;
          } else {
            // Random small shift left/right,
            // adding the amplitude plus constant slope
            if (Noise % 0.1 > 0.05) {
              pt.x += slopeAngleRef.current * layerSpeed + (amplitudeRef.current * layerSpeed);
            } else {
              pt.x += slopeAngleRef.current * layerSpeed - (amplitudeRef.current * layerSpeed);
            }
            // Reset gravity when sliding.
            pt.g = 0;
          }

          /* --- vertical motion ---
           * Two modes of falling:
           * - If noise is high: accelerate downward
           *   (like a free fall when no stairs are in the way).
           * - If noise is low: descend slowly,
           *   like water crawling along the stair edge.
           */
          if (Noise > 0.4) {
            pt.g += gravityAccRef.current * layerSpeed; // acceleration
            pt.y += pt.g + (fallSpeedRef.current * layerSpeed); // faster fall
          } else {
            pt.y += fallSpeedRef.current * layerSpeed; // slow descent
          }

          // Physics interactions (collisions/merging)
          let colIdx = Math.floor(pt.x / cellSize);
          let rowIdx = Math.floor(pt.y / cellSize);
          for (let r = Math.max(0, rowIdx - 1); r <= Math.min(gridRows - 1, rowIdx + 1); r++) {
            for (let c = Math.max(0, colIdx - 1); c <= Math.min(gridCols - 1, colIdx + 1); c++) {
              let cell = grid[r * gridCols + c];
              if (!cell) continue;
              for (let i = 0; i < cell.length; i++) {
                let neighborIdx = cell[i];
                if (neighborIdx <= idx) continue; // Check forward only (avoid duplicating interactions)
                let n = particles[neighborIdx];
                if (!n || n.s <= 0) continue;
                
                let dist = p.dist(pt.x, pt.y, n.x, n.y);
                let minDist = (pt.s + n.s) * 0.4;
                
                if (dist < minDist && dist > 0.1) { // 0.1 to avoid division by zero
                  // Random choice to merge or bounce representing fluid surface tension
                  if (p.random() > 0.4 && pt.s < 20) {
                     // Merge n into pt
                     pt.s += n.s * 0.3;
                     pt.vx += n.vx * 0.5;
                     pt.vy += n.vy * 0.5;
                     n.s = 0; // kill n
                  } else {
                     // Bounce repelling force
                     let angle = p.atan2(n.y - pt.y, n.x - pt.x);
                     let force = (minDist - dist) * 0.05;
                     pt.vx -= p.cos(angle) * force;
                     pt.vy -= p.sin(angle) * force;
                     n.vx += p.cos(angle) * force;
                     n.vy += p.sin(angle) * force;
                  }
                }
              }
            }
          }
          
          // Apply horizontal and vertical forces smoothly
          pt.vx *= 0.92;
          pt.vy *= 0.92;
          pt.x += (pt.vx || 0);
          pt.y += (pt.vy || 0);

          // Finally, draw the particle at its position.
          const highlightColP = hexToRgb(highlightColorRef.current);
          if (!isComplex) {
            p.push();
            let drawX = Math.floor(pt.x / 4) * 4;
            let drawY = Math.floor(pt.y / 4) * 4;
            let drawS = Math.max(4, Math.floor(pt.s * 2.5 / 4) * 4);
            let coreS = Math.max(4, Math.floor(pt.s / 4) * 4);
            
            p.rectMode(p.CENTER);
            p.noStroke();
            // Highlight glow
            p.fill(highlightColP.r, highlightColP.g, highlightColP.b, p.map(layer, 0.3, 1.2, 0, 50));
            p.rect(drawX, drawY, drawS, drawS);
            // Core
            p.fill(pCol.r, pCol.g, pCol.b, 255 * (1.2 - layer));
            p.rect(drawX, drawY, coreS, coreS);
            p.pop();
          } else {
            p.push();
            p.noStroke();
            let alpha = p.map(layer, 0.3, 1.2, 40, 255);
            p.fill(pCol.r, pCol.g, pCol.b, alpha);
            
            let isSymbol = particleShapeRef.current === 'leaf' || particleShapeRef.current === 'petal';
            let tSize = isSymbol ? pt.s * 6 : p.max(pt.s * 4, 8);
            
            p.textSize(tSize);
            p.textAlign(p.CENTER, p.CENTER);

            let drawX = Math.floor(pt.x / 4) * 4;
            let drawY = Math.floor(pt.y / 4) * 4;
            
            if (isSymbol) {
              p.translate(drawX, drawY);
              pt.rotation += (pt.g + fallSpeedRef.current) * 0.05 * (-1 + 2 * (idx % 2));
              p.rotate(pt.rotation);
              p.text(pt.shapeVal, 0, 0);
            } else {
              // Lightweight rendering for numbers/letters/texts without matrix transforms
              p.text(pt.shapeVal, drawX, drawY);
            }
            p.pop();
          }

          // Wrap horizontally to balance density
          let margin = 50;
          if (pt.x > p.width + margin) {
            pt.x -= (p.width + margin * 2);
          } else if (pt.x < -margin) {
            pt.x += (p.width + margin * 2);
          }
        }

        // --- Ripples update & render loop ---
        let fcm = p.frameCount % tbounce;
        if (fcm === 1) {
          let k = activeThrows.length;
          while(k--) {
            let t = activeThrows.pop();
            t = bounce(t);
            addCircle(t.pos[0], t.pos[1]);
            if (t.b < t.bounces) activeThrows.unshift(t);
          }
        }

        const rippleCol = hexToRgb(rippleColorRef.current);
        const splashCol = hexToRgb(splashColorRef.current);
        const highlightCol = hexToRgb(highlightColorRef.current);

        // draw throws (droplets)
        for (let i = 0; i < activeThrows.length; i++) {
          let t = activeThrows[i];
          // calculate intermediate position based on frame count
          let progress = fcm / tbounce;
          let ix = t.pos[0] + t.xstep * progress;
          let iy = t.pos[1] - t.ystep * Math.sin(progress * Math.PI); // parabolic arc
          
          let drawX = Math.floor(ix / 4) * 4;
          let drawY = Math.floor(iy / 4) * 4;

          p.push();
          p.noStroke();
          p.rectMode(p.CENTER);
          // Drop glow
          p.fill(highlightCol.r, highlightCol.g, highlightCol.b, 100);
          p.ellipse(drawX, drawY, 8, 8);
          // Drop core
          p.fill(splashCol.r, splashCol.g, splashCol.b, 200);
          p.ellipse(drawX, drawY, 4, 4);
          p.pop();
        }

        let n = activeCircles.length;
        const pCol = hexToRgb(particleColorRef.current);
        while(n--) {
          let c = activeCircles.pop();
          
          let drawX = Math.floor(c.pos[0] / 4) * 4;
          let drawY = Math.floor(c.pos[1] / 4) * 4;
          let drawW = Math.floor(c.r / 4) * 4;
          let drawH = Math.floor((c.r / 2 * (c.pos[1] / p.height)) / 4) * 4;

          p.push();
          p.noFill();
          p.rectMode(p.CENTER);
          // Highlight glow
          p.stroke(highlightCol.r, highlightCol.g, highlightCol.b, c.alpha * 0.5);
          p.strokeWeight(4);
          p.ellipse(drawX, drawY, drawW, drawH);
          // Main ripple
          p.stroke(rippleCol.r, rippleCol.g, rippleCol.b, c.alpha);
          p.strokeWeight(2);
          p.ellipse(drawX, drawY, drawW, drawH);
          p.pop();
          
          c = growCircle(c);
          if (c.r < rlim && c.alpha > 0) activeCircles.unshift(c);
        }

        // Update ambient sound based on particle density and fall speed
        if (particles.length > 0) {
          const density = particles.length / (particleShapeRef.current !== 'dot' ? 150 : Math.floor(p.width * 9));
          const actualSpeed = isFallingRef.current ? fallSpeedRef.current : 0.1;
          synth.updateAmbient(density, actualSpeed);
        } else {
          synth.updateAmbient(0, 0);
        }
      };
    };

    myP5 = new p5(sketch, containerRef.current);

    return () => {
      myP5.remove();
      synth.updateAmbient(0, 0);
      if (synth.ctx) {
         try { synth.ctx.suspend(); } catch (e) {}
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setIsConfigVisible(false); // Hide panel first
      setTimeout(() => { // Wait for panel to finish sliding out
        const canvas = containerRef.current?.querySelector('canvas');
        if (!canvas || !('captureStream' in canvas)) {
          alert("Recording is not supported in this browser.");
          return;
        }

        try {
          const stream = (canvas as HTMLCanvasElement).captureStream(60);
          
          // Use a high bitrate for HD quality
          let options: MediaRecorderOptions = { videoBitsPerSecond: 8000000 };
          if (typeof MediaRecorder.isTypeSupported === 'function') {
            if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E"')) {
              options = { mimeType: 'video/mp4; codecs="avc1.42E01E"', videoBitsPerSecond: 8000000 };
            } else if (MediaRecorder.isTypeSupported('video/mp4')) {
              options = { mimeType: 'video/mp4', videoBitsPerSecond: 8000000 };
            } else if (MediaRecorder.isTypeSupported('video/webm; codecs=h264')) {
              options = { mimeType: 'video/webm; codecs=h264', videoBitsPerSecond: 8000000 };
            } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
              options = { mimeType: 'video/webm; codecs=vp9', videoBitsPerSecond: 8000000 };
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
              options = { mimeType: 'video/webm', videoBitsPerSecond: 8000000 };
            }
          }

          const mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorderRef.current = mediaRecorder;
          chunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunksRef.current.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: options.mimeType || 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            a.href = url;
            const extension = (options.mimeType || '').includes('mp4') ? 'mp4' : 'webm';
            a.download = `waterway-recording-${Date.now()}.${extension}`;
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          };

          mediaRecorder.start();
          setIsRecording(true);
        } catch (e) {
          console.error("Recording failed", e);
          alert("Recording failed to start.");
        }
      }, 600); // 500ms for layout transition + 100ms safe margin
    }
  };

  const bootSvgUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${bootSize}" height="${bootSize}" viewBox="0 0 32 32" shape-rendering="crispEdges"><g transform="translate(0, 4)"><path fill="${encodeURIComponent(bootColor)}" d="M9,3 v12 c0,0 -1,2 -1,3 c0,1 1,2 2,2 h8 c1.5,0 2,-1 2,-2 c0,-1 -0.5,-2 -2,-2 h-3.5 l-0.5,-1 v-12 z" /><rect x="8" y="2" width="7" height="3" rx="0" fill="%23ffffff" opacity="0.3" /><path fill="%2327272a" d="M7.5,20 h11.5 v1 h-11.5 v-1 z" /></g><g transform="translate(10, 0)"><path fill="${encodeURIComponent(bootColor)}" d="M9,3 v12 c0,0 -1,2 -1,3 c0,1 1,2 2,2 h8 c1.5,0 2,-1 2,-2 c0,-1 -0.5,-2 -2,-2 h-3.5 l-0.5,-1 v-12 z" /><rect x="8" y="2" width="7" height="3" rx="0" fill="%23ffffff" opacity="0.3" /><path fill="%2327272a" d="M7.5,20 h11.5 v1 h-11.5 v-1 z" /></g></svg>`;

  return (
    <div ref={wrapperRef} className="relative w-full h-screen overflow-hidden bg-zinc-950">
      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="absolute top-0 left-0 h-full overflow-hidden transition-all duration-500 ease-in-out" 
        style={{
          width: isConfigVisible ? 'calc(100% - 340px)' : '100%',
          backgroundColor: bgColor,
          cursor: `url('${bootSvgUrl}') ${Math.round(bootSize / 2)} ${Math.round(bootSize * 0.8)}, auto`
        }}
      />

      {/* Floating Trigger Bar */}
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={wrapperRef}
        dragElastic={0}
        className="fixed z-[100] cursor-grab active:cursor-grabbing flex flex-col items-center justify-center pointer-events-auto"
        initial={{ right: 0, top: '50%', y: '-50%' }}
        style={{ position: 'fixed' }}
      >
        <button
          onClick={() => setIsConfigVisible(!isConfigVisible)}
          className={`bg-white/10 backdrop-blur-md border border-white/20 py-4 px-1.5 shadow-xl text-white hover:bg-white/20 transition-all flex items-center justify-center opacity-100 rounded-l-xl border-r-0`}
          style={{ width: '28px', height: '60px' }}
        >
          {isConfigVisible ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          )}
        </button>
      </motion.div>

      {/* Sliding Control Panel */}
      <div 
        className={`absolute top-0 h-full z-50 w-[340px] bg-zinc-900 border-l border-white/10 shadow-2xl transition-all duration-500 ease-in-out ${
          isConfigVisible ? 'right-0' : '-right-[340px]'
        }`}
      >
        <div className="w-full h-full overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-white font-medium text-lg mb-1">Configuration</h2>
              <p className="text-zinc-400 text-sm">Customize the particle simulation.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsFalling(!isFalling)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isFalling ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'
                }`}
              >
                {isFalling ? 'Stop' : 'Start'}
              </button>
              <button 
                onClick={toggleRecording}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse' 
                    : 'bg-zinc-700/50 text-white hover:bg-zinc-700'
                }`}
              >
                {isRecording ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    结束录制
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
                    开始录制
                  </>
                )}
              </button>
              <button
                onClick={() => setIsConfigVisible(false)}
                className="text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1.5"
                title="Close panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>

            <button
              onClick={() => {
                setBgColor('#9aa8b6'); // 154, 168, 182
                setParticleColor('#fffaf5'); // 255, 250, 245
                setBootColor('#facc15'); // 250, 204, 21
                setSplashColor('#fedccd'); // 254, 220, 205
                setRippleColor('#ffffff'); // 255, 255, 255
                setHighlightColor('#ffdfc2'); // 255, 223, 194
                setBootSize(55);
                setSlopeAngle(1.5);
                setTrailLength(11);
                setBlurAmount(1.5);
                setFallSpeed(2.2);
                setGravityAcc(1.75);
                setAmplitude(2.5);
                setParticleSize(3.5);
                setSplashSize(3.5);
                setSplashRange(14);
              }}
              className="w-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 font-medium py-2.5 px-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              一键数值预设
            </button>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Background Color Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    主背景色
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 border-0 p-0 bg-transparent rounded-lg cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {/* Particle Color Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    粒子颗粒
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={particleColor}
                      onChange={(e) => setParticleColor(e.target.value)}
                      className="w-8 h-8 border-0 p-0 bg-transparent rounded-lg cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {/* Boot Color Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    雨靴颜色
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bootColor}
                      onChange={(e) => setBootColor(e.target.value)}
                      className="w-8 h-8 border-0 p-0 bg-transparent rounded-lg cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {/* Splash Color Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    水花颜色
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={splashColor}
                      onChange={(e) => setSplashColor(e.target.value)}
                      className="w-8 h-8 border-0 p-0 bg-transparent rounded-lg cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {/* Ripple Color Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    水面反光
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={rippleColor}
                      onChange={(e) => setRippleColor(e.target.value)}
                      className="w-8 h-8 border-0 p-0 bg-transparent rounded-lg cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {/* Highlight Color Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    光晕高光
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={highlightColor}
                      onChange={(e) => setHighlightColor(e.target.value)}
                      className="w-8 h-8 border-0 p-0 bg-transparent rounded-lg cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {/* Boot Size Picker */}
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-zinc-300">
                    雨靴大小 ({bootSize}px)
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="range"
                      min="24"
                      max="64"
                      value={bootSize}
                      onChange={(e) => setBootSize(Number(e.target.value))}
                      className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

          <div className="space-y-4">
            {/* Slope Angle Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-300">
                <label>Slope Direction</label>
                <span className="text-xs font-mono text-zinc-500">{slopeAngle}</span>
              </div>
              <input type="range" min="-5" max="5" step="0.5" value={slopeAngle} onChange={e => setSlopeAngle(Number(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Trail Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-300">
                <label>Trail Length</label>
                <span className="text-xs font-mono text-zinc-500">{trailLength}%</span>
              </div>
              <input type="range" min="1" max="100" value={trailLength} onChange={e => setTrailLength(Number(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Blur Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-300">
                <label>Blur Amount</label>
                <span className="text-xs font-mono text-zinc-500">{blurAmount}</span>
              </div>
              <input type="range" min="0" max="5" step="0.5" value={blurAmount} onChange={e => setBlurAmount(Number(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Fall Speed Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-300">
                <label>Base Speed</label>
                <span className="text-xs font-mono text-zinc-500">{fallSpeed}</span>
              </div>
              <input type="range" min="0" max="5" step="0.1" value={fallSpeed} onChange={e => setFallSpeed(Number(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Gravity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-300">
                <label>Gravity</label>
                <span className="text-xs font-mono text-zinc-500">{gravityAcc}</span>
              </div>
              <input type="range" min="0" max="2" step="0.05" value={gravityAcc} onChange={e => setGravityAcc(Number(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Amplitude Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-300">
                <label>Amplitude</label>
                <span className="text-xs font-mono text-zinc-500">{amplitude}</span>
              </div>
              <input type="range" min="0" max="10" step="0.1" value={amplitude} onChange={e => setAmplitude(Number(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Particle Size Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-300">
                <label>Particle Size</label>
                <span className="text-xs font-mono text-zinc-500">{particleSize}</span>
              </div>
              <input type="range" min="1" max="10" step="0.5" value={particleSize} onChange={e => setParticleSize(Number(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Splash Size Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-300">
                <label>Ripple Size</label>
                <span className="text-xs font-mono text-zinc-500">{splashSize}</span>
              </div>
              <input type="range" min="1" max="10" step="0.5" value={splashSize} onChange={e => setSplashSize(Number(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Splash Range Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-300">
                <label>Throw Power</label>
                <span className="text-xs font-mono text-zinc-500">{splashRange}</span>
              </div>
              <input type="range" min="5" max="50" step="1" value={splashRange} onChange={e => setSplashRange(Number(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
          
          {/* Particle Shape Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">
              Particle Shape
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'dot', label: 'Dots' },
                { id: 'number', label: 'Numbers' },
                { id: 'letter', label: 'Letters' },
                { id: 'text', label: 'Characters' },
                { id: 'leaf', label: 'Leaves' },
                { id: 'petal', label: 'Petals' }
              ].map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => setParticleShape(shape.id)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    particleShape === shape.id
                      ? 'bg-white text-black shadow-md scale-100'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 scale-95 hover:scale-100'
                  }`}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default StaircaseWaterway;
