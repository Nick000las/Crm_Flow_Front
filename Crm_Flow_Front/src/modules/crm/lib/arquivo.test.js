import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AVISOS_LEAD } from '../constants.js';
import {
  avisoDaRestauracao,
  diasAtePurga,
  estaArquivado,
  lerSituacao,
  situacaoDaBusca,
  textoDaPurga,
} from './arquivo.js';

const AGORA = new Date('2026-10-16T12:00:00.000Z');

test('lerSituacao aceita as três e cai em ativos no resto', () => {
  assert.equal(lerSituacao('arquivados'), 'arquivados');
  assert.equal(lerSituacao('lixeira'), 'lixeira');
  assert.equal(lerSituacao('ativos'), 'ativos');
  assert.equal(lerSituacao('LIXEIRA'), 'ativos');
  assert.equal(lerSituacao(undefined), 'ativos');
});

test('situacaoDaBusca sem a flag é sempre ativos', () => {
  assert.equal(situacaoDaBusca('lixeira', false), 'ativos');
  assert.equal(situacaoDaBusca('arquivados', true), 'arquivados');
  assert.equal(situacaoDaBusca('qualquer', true), 'ativos');
});

test('estaArquivado olha archived_at', () => {
  assert.equal(estaArquivado({ archived_at: '2026-10-01T00:00:00Z' }), true);
  assert.equal(estaArquivado({ archived_at: null }), false);
  assert.equal(estaArquivado(undefined), false);
});

test('diasAtePurga arredonda para cima e não fica negativo', () => {
  assert.equal(diasAtePurga('2026-11-15T12:00:00.000Z', AGORA), 30);
  assert.equal(diasAtePurga('2026-10-16T14:00:00.000Z', AGORA), 1);
  assert.equal(diasAtePurga('2026-10-16T11:00:00.000Z', AGORA), 0);
  assert.equal(diasAtePurga('não é data', AGORA), null);
  assert.equal(diasAtePurga(undefined, AGORA), null);
});

test('textoDaPurga', () => {
  assert.equal(textoDaPurga('2026-11-15T12:00:00.000Z', AGORA), 'Exclui em 30 dias');
  assert.equal(textoDaPurga('2026-10-17T00:00:00.000Z', AGORA), 'Exclui em 1 dia');
  assert.equal(textoDaPurga('2026-10-16T11:00:00.000Z', AGORA), 'Exclui hoje');
  assert.equal(textoDaPurga(null, AGORA), '');
});

test('avisoDaRestauracao diz para onde o lead voltou', () => {
  assert.equal(
    avisoDaRestauracao({ archived_at: '2026-10-01T00:00:00Z' }),
    AVISOS_LEAD.RESTAURADO_ARQUIVADO,
  );
  assert.equal(avisoDaRestauracao({ archived_at: null }), AVISOS_LEAD.RESTAURADO);
});
