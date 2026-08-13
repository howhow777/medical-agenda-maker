import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cancerDesignPresetList } from '../dist/logic/cancerDesignPresets.js';
import { colorSchemes } from '../dist/logic/colorSchemes.js';

test('提供六種癌別設計，每種都有三個不置中的 PNG 圖案', () => {
  assert.equal(cancerDesignPresetList.length, 6);

  const ids = new Set();
  const sources = new Set();
  for (const preset of cancerDesignPresetList) {
    assert.ok(colorSchemes[preset.colorScheme], `${preset.id} 缺少配色`);
    assert.equal(preset.motifs.length, 3, `${preset.id} 應有三個圖案`);

    for (const motif of preset.motifs) {
      assert.equal(ids.has(motif.id), false, `${motif.id} 重複`);
      assert.equal(sources.has(motif.src), false, `${motif.src} 重複`);
      assert.ok(motif.xRatio <= 0.2 || motif.xRatio >= 0.78, `${motif.id} 不應放在畫面正中央`);
      assert.ok(existsSync(resolve(motif.src)), `${motif.src} 不存在`);
      ids.add(motif.id);
      sources.add(motif.src);
    }
  }

  assert.equal(ids.size, 18);
  assert.equal(sources.size, 18);
});
