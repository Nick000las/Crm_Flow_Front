import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatarData,
  formatarMoeda,
  formatarNumero,
  paraNumero,
} from './formatadores.js';

// Intl separa "R$" do valor com espaço não separável (U+00A0).
const NBSP = String.fromCharCode(0xa0);
const semNbsp = (texto) => texto.replaceAll(NBSP, ' ');

test('paraNumero converte NUMERIC em string', () => {
  assert.equal(paraNumero('1500.50'), 1500.5);
  assert.equal(paraNumero(3), 3);
  assert.equal(paraNumero(''), null);
  assert.equal(paraNumero(null), null);
  assert.equal(paraNumero('abc'), null);
});

test('formatarData não volta um dia em timestamp à meia-noite UTC', () => {
  assert.equal(formatarData('2026-10-14T00:00:00.000Z'), '14/10/2026');
  assert.equal(formatarData('2026-01-01'), '01/01/2026');
});

test('formatarData ignora valor inválido', () => {
  assert.equal(formatarData(null), null);
  assert.equal(formatarData('ontem'), null);
});

test('formatarNumero e formatarMoeda usam pt-BR', () => {
  assert.equal(formatarNumero('1234.5'), '1.234,5');
  assert.equal(semNbsp(formatarMoeda('1500')), 'R$ 1.500,00');
  assert.equal(formatarMoeda(null), null);
});
