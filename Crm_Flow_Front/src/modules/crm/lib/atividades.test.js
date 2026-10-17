import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENSAGENS_ATIVIDADE,
  deInputLocal,
  estaAtrasada,
  opcaoDoTipo,
  opcoesDeTipo,
  paraInputLocal,
  payloadDaAtividade,
  separarAtividades,
  validarAtividade,
  valoresDaAtividade,
} from './atividades.js';

const LISTA = [
  { key: 'ligacao', label: 'Ligação', color: null, category: null, ativo: true },
  { key: 'visita', label: 'Visita', color: '#ff0000', category: null, ativo: false },
];

const atividade = (extra = {}) => ({
  id: 'a1',
  leadId: 'l1',
  tipo: 'ligacao',
  titulo: 'Ligar',
  notas: null,
  agendadaPara: null,
  concluidaEm: null,
  autor: null,
  criadoEm: '2026-10-16T10:00:00.000Z',
  atualizadoEm: '2026-10-16T10:00:00.000Z',
  ...extra,
});

const VALORES = { tipo: 'ligacao', titulo: 'Ligar', notas: '', agendadaPara: '', jaAconteceu: false };

test('datetime-local vai e volta no fuso local', () => {
  const iso = deInputLocal('2026-10-20T14:30');

  assert.equal(paraInputLocal(iso), '2026-10-20T14:30');
  assert.equal(deInputLocal(''), null);
  assert.equal(deInputLocal('lixo'), null);
  assert.equal(paraInputLocal(null), '');
});

test('valoresDaAtividade parte vazio ou da atividade', () => {
  assert.deepEqual(valoresDaAtividade(), { tipo: '', titulo: '', notas: '', agendadaPara: '', jaAconteceu: false });
  assert.equal(valoresDaAtividade(atividade({ notas: 'oi' })).notas, 'oi');
});

test('validarAtividade', () => {
  assert.deepEqual(validarAtividade(VALORES), {});
  assert.deepEqual(validarAtividade({ ...VALORES, tipo: '', titulo: '  ' }), {
    tipo: MENSAGENS_ATIVIDADE.TIPO,
    titulo: MENSAGENS_ATIVIDADE.TITULO,
  });
  assert.equal(validarAtividade({ ...VALORES, titulo: 'x'.repeat(201) }).titulo, MENSAGENS_ATIVIDADE.TITULO_LONGO);
  assert.equal(validarAtividade({ ...VALORES, notas: 'x'.repeat(5001) }).notas, MENSAGENS_ATIVIDADE.NOTAS_LONGAS);
  assert.equal(validarAtividade({ ...VALORES, agendadaPara: 'lixo' }).agendadaPara, MENSAGENS_ATIVIDADE.DATA);
  // Com "já aconteceu" a data some do form: não valida.
  assert.deepEqual(validarAtividade({ ...VALORES, agendadaPara: 'lixo', jaAconteceu: true }), {});
});

test('criação manda só o preenchido', () => {
  assert.deepEqual(payloadDaAtividade({ ...VALORES, titulo: ' Ligar ' }), { tipo: 'ligacao', titulo: 'Ligar' });
  assert.deepEqual(payloadDaAtividade({ ...VALORES, notas: 'n', agendadaPara: '2026-10-20T14:30' }), {
    tipo: 'ligacao',
    titulo: 'Ligar',
    notas: 'n',
    agendadaPara: deInputLocal('2026-10-20T14:30'),
  });
});

test('"já aconteceu" cria concluída e sem agenda', () => {
  assert.deepEqual(payloadDaAtividade({ ...VALORES, agendadaPara: '2026-10-20T14:30', jaAconteceu: true }), {
    tipo: 'ligacao',
    titulo: 'Ligar',
    concluida: true,
  });
});

test('edição manda só o que mudou, e vazio limpa', () => {
  const original = atividade({ notas: 'antes', agendadaPara: deInputLocal('2026-10-20T14:30') });
  const valores = valoresDaAtividade(original);

  assert.equal(payloadDaAtividade(valores, original), null);
  assert.deepEqual(payloadDaAtividade({ ...valores, titulo: 'Novo' }, original), { titulo: 'Novo' });
  assert.deepEqual(payloadDaAtividade({ ...valores, notas: '', agendadaPara: '' }, original), {
    notas: null,
    agendadaPara: null,
  });
});

test('estaAtrasada só para aberta com agenda no passado', () => {
  const agora = new Date('2026-10-16T12:00:00.000Z');
  const passado = '2026-10-16T11:00:00.000Z';

  assert.equal(estaAtrasada(atividade({ agendadaPara: passado }), agora), true);
  assert.equal(estaAtrasada(atividade({ agendadaPara: '2026-10-16T13:00:00.000Z' }), agora), false);
  assert.equal(estaAtrasada(atividade(), agora), false);
  assert.equal(estaAtrasada(atividade({ agendadaPara: passado, concluidaEm: passado }), agora), false);
});

test('separarAtividades mantém a ordem do back em cada grupo', () => {
  const lista = [atividade({ id: '1' }), atividade({ id: '2', concluidaEm: 'x' }), atividade({ id: '3' })];
  const { abertas, concluidas } = separarAtividades(lista);

  assert.deepEqual(abertas.map((item) => item.id), ['1', '3']);
  assert.deepEqual(concluidas.map((item) => item.id), ['2']);
});

test('opcoesDeTipo: ativas, mais a inativa atual', () => {
  assert.deepEqual(opcoesDeTipo(LISTA), [{ valor: 'ligacao', rotulo: 'Ligação' }]);
  assert.deepEqual(opcoesDeTipo(LISTA, 'visita'), [
    { valor: 'ligacao', rotulo: 'Ligação' },
    { valor: 'visita', rotulo: 'Visita (inativa)' },
  ]);
});

test('opcaoDoTipo usa a lista e cai em texto legível sem ela', () => {
  assert.equal(opcaoDoTipo(LISTA, 'visita').ativo, false);
  assert.equal(opcaoDoTipo(undefined, 'email_enviado').label, 'Email enviado');
});
