import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseFilename } from './content-disposition.js';

test('lê filename entre aspas', () => {
  assert.equal(parseFilename('attachment; filename="leads.xlsx"'), 'leads.xlsx');
});

test('lê filename sem aspas', () => {
  assert.equal(parseFilename('attachment; filename=leads.xlsx'), 'leads.xlsx');
});

test('prefere filename* e decodifica acentos', () => {
  assert.equal(
    parseFilename('attachment; filename="leads.xlsx"; filename*=UTF-8\'\'relat%C3%B3rio.xlsx'),
    'relatório.xlsx',
  );
});

test('retorna null sem cabeçalho ou sem filename', () => {
  assert.equal(parseFilename(null), null);
  assert.equal(parseFilename('attachment'), null);
});
