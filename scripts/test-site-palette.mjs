import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const modules = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} }; modules.set(filename, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  new Function('require', 'module', 'exports', outputText)(name => load(`${name.replace('@/', '')}.ts`), module, module.exports);
  return module.exports;
}
const { siteAppearanceBootstrapScript, sitePaletteForLocalTime, isSitePaletteMode } = load('lib/site-palette.ts');
const boundaries = [[0, 'charcoal'], [4, 'charcoal'], [5, 'blue'], [8, 'blue'], [9, 'gold'], [12, 'gold'], [13, 'rose'], [15, 'rose'], [16, 'green'], [18, 'green'], [19, 'violet'], [21, 'violet'], [22, 'charcoal'], [23, 'charcoal']];
for (const [hour, expected] of boundaries) {
  assert.equal(sitePaletteForLocalTime({ getHours: () => hour }), expected);
  for (const mode of ['auto', 'text', 'blue', 'gold', 'rose', 'green', 'violet', 'charcoal', null, 'invalid']) {
    const dataset = {};
    vm.runInNewContext(siteAppearanceBootstrapScript(), {
      Date: class extends Date { getHours() { return hour; } },
      document: { documentElement: { dataset } },
      window: { matchMedia: () => ({ matches: false }) },
      localStorage: { getItem: key => key.includes('palette-mode') ? mode : JSON.stringify({ style: 'off' }) }
    });
    assert.equal(dataset.sitePalette, isSitePaletteMode(mode) && mode !== 'auto' ? mode : expected);
    assert.equal(dataset.siteCharacterOcean, 'off');
    assert.equal(dataset.siteBgCompose, 'palette');
  }
}
for (const mobile of [false, true]) {
  const dataset = {};
  vm.runInNewContext(siteAppearanceBootstrapScript(), {
    document: { documentElement: { dataset } },
    window: { matchMedia: () => ({ matches: mobile }) },
    localStorage: { getItem() { throw new Error('storage blocked'); } }
  });
  assert.equal(dataset.sitePaletteMode, 'auto');
  assert.equal(dataset.siteCharacterOcean, mobile ? 'off' : 'ascii');
}
console.log('site palette: bootstrap/controller time boundaries, saved modes, ocean opt-out, mobile and blocked storage passed');
