import assert from 'node:assert/strict';
import { test } from 'node:test';
import { corValida, luminancia, marcadorPrecisaContorno, razaoDeContraste } from './contraste.js';

test('luminância nos extremos', () => {
  assert.equal(luminancia('#000000'), 0);
  assert.equal(luminancia('#FFFFFF'), 1);
});

test('razão de contraste segue a WCAG e independe da ordem', () => {
  assert.equal(razaoDeContraste('#000000', '#ffffff'), 21);
  assert.equal(razaoDeContraste('#ffffff', '#ffffff'), 1);
  // Cinza #767676 sobre branco é o limite clássico do AA (≈ 4.54).
  assert.ok(Math.abs(razaoDeContraste('#767676', '#ffffff') - 4.54) < 0.01);
  assert.equal(razaoDeContraste('#123456', '#fedcba'), razaoDeContraste('#fedcba', '#123456'));
});

test('marcador claro demais no fundo branco ganha contorno', () => {
  assert.equal(marcadorPrecisaContorno('#fff9c4'), true);
  assert.equal(marcadorPrecisaContorno('#1d4ed8'), false);
  assert.equal(marcadorPrecisaContorno('rosa'), false);
});

test('corValida aceita só #RRGGBB', () => {
  assert.equal(corValida('#A1b2C3'), true);
  assert.equal(corValida('#abc'), false);
  assert.equal(corValida(null), false);
});
