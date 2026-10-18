import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  alternarStatus,
  diasEsfriando,
  errosLocais,
  filtroDaBusca,
  inatividadeParaEnvio,
  statusEsfria,
  textoEsfriando,
  valoresDaInatividade,
} from './inatividade.js';

const AGORA = new Date('2026-10-18T12:00:00.000Z');

const lista = [
  { id: '1', key: 'novo', label: 'Novo', color: null, category: 'aberto', ativo: true, dias: 1 },
  { id: '2', key: 'proposta', label: 'Proposta', color: null, category: 'aberto', ativo: true, dias: null },
  { id: '3', key: 'ganho', label: 'Ganho', color: null, category: 'ganho', ativo: true, dias: null },
];

test('filtroDaBusca: sem a flag, esfriando sai; com a flag, fica', () => {
  const filtro = { filtros: [], esfriando: true, valorMin: 10 };

  assert.deepEqual(filtroDaBusca(filtro, false), { filtros: [], valorMin: 10 });
  assert.equal(filtroDaBusca(filtro, true), filtro);
  const semEsfriando = { filtros: [] };
  assert.equal(filtroDaBusca(semEsfriando, false), semEsfriando);
});

test('diasEsfriando conta dias inteiros para baixo', () => {
  assert.equal(diasEsfriando('2026-10-18T02:00:00.000Z', AGORA), 0);
  assert.equal(diasEsfriando('2026-10-17T06:00:00.000Z', AGORA), 1);
  assert.equal(diasEsfriando('2026-10-08T12:00:00.000Z', AGORA), 10);
  assert.equal(diasEsfriando(null, AGORA), null);
  assert.equal(diasEsfriando('não é data', AGORA), null);
});

test('textoEsfriando', () => {
  assert.equal(textoEsfriando('2026-10-18T02:00:00.000Z', AGORA), 'Esfriando desde hoje');
  assert.equal(textoEsfriando('2026-10-17T06:00:00.000Z', AGORA), 'Esfriando há 1 dia');
  assert.equal(textoEsfriando('2026-10-15T12:00:00.000Z', AGORA), 'Esfriando há 3 dias');
  assert.equal(textoEsfriando(null, AGORA), '');
});

test('só status aberto esfria', () => {
  assert.equal(statusEsfria(lista[0]), true);
  assert.equal(statusEsfria(lista[2]), false);
});

test('valores do form a partir da lista', () => {
  assert.deepEqual(valoresDaInatividade(lista), {
    novo: { ligado: true, dias: '1' },
    proposta: { ligado: false, dias: '' },
    ganho: { ligado: false, dias: '' },
  });
});

test('ligar sem dias sugere o padrão; desligar guarda o digitado', () => {
  assert.deepEqual(alternarStatus({ ligado: false, dias: '' }, true), { ligado: true, dias: '7' });
  assert.deepEqual(alternarStatus({ ligado: false, dias: '12' }, true), { ligado: true, dias: '12' });
  assert.deepEqual(alternarStatus({ ligado: true, dias: '12' }, false), { ligado: false, dias: '12' });
});

test('errosLocais: inteiro de 1 a 365 só nos ligados', () => {
  const erros = errosLocais({
    a: { ligado: true, dias: '0' },
    b: { ligado: true, dias: '366' },
    c: { ligado: true, dias: '2.5' },
    d: { ligado: true, dias: '' },
    e: { ligado: true, dias: ' 30 ' },
    f: { ligado: false, dias: 'x' },
  });

  assert.deepEqual(Object.keys(erros), ['a', 'b', 'c', 'd']);
});

test('inatividadeParaEnvio: só as mudanças, null para desligar', () => {
  const valores = valoresDaInatividade(lista);

  assert.equal(inatividadeParaEnvio(valores, lista), null);
  assert.deepEqual(
    inatividadeParaEnvio(
      { ...valores, novo: { ligado: false, dias: '1' }, proposta: { ligado: true, dias: '7' } },
      lista,
    ),
    { novo: null, proposta: 7 },
  );
});

test('inatividadeParaEnvio nunca manda status fechado', () => {
  const valores = { ...valoresDaInatividade(lista), ganho: { ligado: true, dias: '5' } };

  assert.equal(inatividadeParaEnvio(valores, lista), null);
});
