import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canScrollDragArea, clampDragTransform } from './drag-bounds.js';

const bounds = { left: 100, top: 100, right: 500, bottom: 500 };
const item = { left: 150, top: 200, right: 350, bottom: 250 };

test('arraste é limitado nos quatro lados e preserva escala', () => {
  assert.deepEqual(clampDragTransform({ x: -1000, y: -1000, scaleX: 1, scaleY: 1 }, item, bounds), {
    x: -50,
    y: -100,
    scaleX: 1,
    scaleY: 1,
  });

  assert.deepEqual(clampDragTransform({ x: 1000, y: 1000 }, item, bounds), { x: 150, y: 250 });
});

test('movimento dentro da área continua livre e lista vertical não muda de coluna', () => {
  assert.deepEqual(clampDragTransform({ x: 10, y: 20 }, item, bounds), { x: 10, y: 20 });

  assert.deepEqual(clampDragTransform({ x: 1000, y: 50 }, item, bounds, 'vertical'), {
    x: 0,
    y: 50,
  });
});

test('item maior que a área fica ancorado sem intervalos invertidos', () => {
  const large = { left: 100, top: 100, right: 1000, bottom: 1000 };

  assert.deepEqual(clampDragTransform({ x: 900, y: -900 }, large, bounds), { x: 0, y: 0 });
});

test('autoscroll para quando a lista já está inteira visível, mas permite uma lista longa', () => {
  const outer = {
    contains: () => true,
    getBoundingClientRect: () => bounds,
    scrollHeight: 1000,
    clientHeight: 400,
    scrollWidth: 400,
    clientWidth: 400,
  };
  const short = { getBoundingClientRect: () => ({ left: 110, top: 110, right: 490, bottom: 300 }) };
  const long = { getBoundingClientRect: () => ({ left: 110, top: 110, right: 490, bottom: 900 }) };

  assert.equal(canScrollDragArea(outer, short), false);
  assert.equal(canScrollDragArea(outer, long), true);
  assert.equal(canScrollDragArea(outer, outer), true);
});
