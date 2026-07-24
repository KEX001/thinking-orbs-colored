const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

console.log('Building thinking-orbs-colored with verified color engine...');

const tempDir = path.join(__dirname, 'temp-build');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

execSync('npm init -y && npm install thinking-orbs react react-dom esbuild', { cwd: tempDir, stdio: 'ignore' });

fs.copyFileSync(path.join(__dirname, 'entry.js'), path.join(tempDir, 'entry.js'));

// ── The exact draw function from thinking-orbs v* source ──
const ORIGINAL_DRAW = `function _(e, n, s, r = 0.3) {
  n.sort((t, o) => t.z - o.z);
  for (const t of n) {
    const o = t.a ?? 1;
    if (o < 0.02) continue;
    const c = Math.min(1, Math.max(0, t.white)), a = Math.round((s ? 1 - c : c) * 255);
    e.fillStyle = \`rgba(\${a},\${a},\${a},\${o})\`, e.beginPath(), e.arc(t.x, t.y, Math.max(r, t.r), 0, Math.PI * 2), e.fill();
  }
}`;

// ── Replacement: accept colorProp, render real RGB ──
const PATCHED_DRAW = `
const __parseColorToRGB = (str) => {
  if (!str) return null;
  if (str === 'monochrome' || str === 'grayscale') return null;
  const presets = {
    primary: [79,70,229], purple: [79,70,229], indigo: [79,70,229],
    orange: [245,158,11], amber: [245,158,11],
    green: [16,185,129], emerald: [16,185,129],
    red: [239,68,68], rose: [244,63,94], pink: [244,63,94],
    blue: [59,130,246], cyan: [6,182,212],
    violet: [168,85,247]
  };
  const lower = str.toLowerCase();
  if (presets[lower]) return presets[lower];
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0,2),16);
      const g = parseInt(hex.substring(2,4),16);
      const b = parseInt(hex.substring(4,6),16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r,g,b];
    }
  }
  return null;
};

function _(e, n, s, r = 0.3, colorProp) {
  const rgb = __parseColorToRGB(colorProp);
  n.sort((t, o) => t.z - o.z);
  for (const t of n) {
    const o = t.a ?? 1;
    if (o < 0.02) continue;
    const c = Math.min(1, Math.max(0, t.white));
    if (rgb) {
      // Scale brightness: front particles (c≈1) are bright, back (c≈0) are dark
      const factor = s ? (0.3 + c * 0.7) : (0.25 + c * 0.75);
      const ri = Math.round(rgb[0] * factor);
      const gi = Math.round(rgb[1] * factor);
      const bi = Math.round(rgb[2] * factor);
      e.fillStyle = \`rgba(\${ri},\${gi},\${bi},\${o})\`;
    } else {
      const a = Math.round((s ? 1 - c : c) * 255);
      e.fillStyle = \`rgba(\${a},\${a},\${a},\${o})\`;
    }
    e.beginPath(), e.arc(t.x, t.y, Math.max(r, t.r), 0, Math.PI * 2), e.fill();
  }
}`;

// ── Thread colorProp through Tt component ──
// 1. Add color prop to component destructuring
const ORIGINAL_PROPS = `function Tt({
  state: e = "working",
  size: n = 64,
  theme: s = "auto",
  speed: r = 1,
  paused: t = !1,
  style: o,
  "aria-label": c,
  ...a
})`;

const PATCHED_PROPS = `function Tt({
  state: e = "working",
  size: n = 64,
  theme: s = "auto",
  speed: r = 1,
  paused: t = !1,
  style: o,
  color: __color,
  "aria-label": c,
  ...a
})`;

// 2. Replace P(h, n, S, m, I) → P(h, n, S, m, I, __color)  [the draw call D]
const ORIGINAL_PCALL = 'P(h, n, S, m, I);';
const PATCHED_PCALL  = 'P(h, n, S, m, I, __color);';

// 3. Add __color to useEffect dependency array so color changes trigger re-render
const ORIGINAL_DEPS = '}, [e, n, m, r, t, g])';
const PATCHED_DEPS  = '}, [e, n, m, r, t, g, __color])';

// 4. Replace _(e, X, r, t.rMin) → _(e, X, r, t.rMin, colorProp) at call sites
const ORIGINAL_DRAWCALL = new RegExp('_\\(e, ([a-zA-Z_$]+), r, t\\.rMin\\)', 'g');
const PATCHED_DRAWCALL  = '_(e, $1, r, t.rMin, colorProp)';

// 5. Each bt render function (arrow functions) need colorProp parameter
// They look like: `(e, n, s, r, t) => {`  — patch all bt arrow func signatures
// The signature appears multiple times before each bt function body
const ORIGINAL_ARROWSIG = new RegExp('(, [a-z]{2} = )(\\(e, n, s, r, t\\)) =>', 'g');
const PATCHED_ARROWSIG  = '$1(e, n, s, r, t, colorProp) =>';

// Also handle assignments at start: `rt = (e, n, s, r, t) =>`
const ORIGINAL_ARROWSIG2 = new RegExp('([a-z]{2} = )(\\(e, n, s, r, t\\)) =>', 'g');
const PATCHED_ARROWSIG2  = '$1(e, n, s, r, t, colorProp) =>';

function patchFile(file) {
  if (!fs.existsSync(file)) {
    console.warn('File not found:', file);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');

  // Step 1: Replace draw function (must go first, inserts __parseColorToRGB)
  if (!content.includes(ORIGINAL_DRAW)) {
    console.error('ERROR: Could not find original draw function in:', file);
    console.error('Source may have changed. Aborting patch for this file.');
    return;
  }
  content = content.replace(ORIGINAL_DRAW, PATCHED_DRAW);
  console.log('  ✓ Patched draw function _()');

  // Step 2: Add color prop to Tt component
  content = content.replace(ORIGINAL_PROPS, PATCHED_PROPS);
  console.log('  ✓ Added color prop to Tt component');

  // Step 3: Patch all bt render arrow function signatures to accept colorProp
  // They look like: `, rt = (e, n, s, r, t) =>` or `rt = (e, n, s, r, t) =>`
  let prevLen = content.length;
  content = content.replace(ORIGINAL_ARROWSIG2, PATCHED_ARROWSIG2);
  const sigCount = (content.match(new RegExp('e, n, s, r, t, colorProp', 'g')) || []).length;
  console.log(`  ✓ Added colorProp param to ${sigCount} bt render arrow function(s)`);

  // Step 4: Replace _(e, X, r, t.rMin) → _(e, X, r, t.rMin, colorProp)
  content = content.replace(ORIGINAL_DRAWCALL, PATCHED_DRAWCALL);
  const drawCount = (content.match(new RegExp('t\\.rMin, colorProp', 'g')) || []).length;
  console.log(`  ✓ Patched ${drawCount} _(e,...) draw call(s) to forward colorProp`);

  // Step 5: Patch P(h, n, S, m, I) call in Tt component
  content = content.replace(ORIGINAL_PCALL, PATCHED_PCALL);
  console.log('  ✓ Forwarded __color to P() dispatch call');

  // Step 6: Add __color to useEffect dependency array
  content = content.replace(ORIGINAL_DEPS, PATCHED_DEPS);
  console.log('  ✓ Added __color to useEffect dependency array');

  fs.writeFileSync(file, content, 'utf8');
}

const esFile  = path.join(tempDir, 'node_modules/thinking-orbs/dist/index.es.js');
const cjsFile = path.join(tempDir, 'node_modules/thinking-orbs/dist/index.cjs');

console.log('\nPatching ES module...');
patchFile(esFile);
console.log('\nPatching CJS module...');
patchFile(cjsFile);

fs.copyFileSync(esFile,  path.join(distDir, 'index.es.js'));
fs.copyFileSync(cjsFile, path.join(distDir, 'index.cjs'));

console.log('\nBundling browser build...');
execSync('./node_modules/.bin/esbuild entry.js --bundle --minify --outfile=../dist/thinking-orb-bundle.js --platform=browser', { cwd: tempDir, stdio: 'inherit' });

// Copy to TeleVault backend static
const backendStatic = path.join(__dirname, '../backend/app/static/thinking-orb-bundle.js');
if (fs.existsSync(path.dirname(backendStatic))) {
  fs.copyFileSync(path.join(distDir, 'thinking-orb-bundle.js'), backendStatic);
  console.log('✓ Copied bundle to backend/app/static/');
}

const dtsContent = `import React from 'react';

export type ThinkingOrbState = 'working' | 'searching' | 'solving' | 'listening' | 'composing' | 'shaping';
export type ThinkingOrbSize = 64 | 20;
export type ThinkingOrbTheme = 'auto' | 'dark' | 'light';

export interface ThinkingOrbProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  state?: ThinkingOrbState;
  size?: ThinkingOrbSize;
  color?: string;
  theme?: ThinkingOrbTheme;
  speed?: number;
  paused?: boolean;
}

export const ThinkingOrb: React.FC<ThinkingOrbProps>;

declare global {
  interface Window {
    renderThinkingOrb: (
      containerId: string,
      state?: ThinkingOrbState,
      size?: ThinkingOrbSize,
      theme?: ThinkingOrbTheme,
      color?: string
    ) => void;
  }
}`;
fs.writeFileSync(path.join(distDir, 'index.d.ts'), dtsContent, 'utf8');

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('\n✅ Build completed with verified color switching!\n');
