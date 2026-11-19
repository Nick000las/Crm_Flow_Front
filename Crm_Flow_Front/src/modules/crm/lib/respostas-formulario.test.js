import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENSAGEM_RESPOSTAS_APAGADAS,
  podeUsarValor,
  precisaRevisar,
  respostasApagadas,
  resumoDaEscrita,
  rotuloDeQuemPreencheu,
  textoDaEscrita,
} from './respostas-formulario.js';

test('textoDaEscrita segue a tabela do handoff', () => {
  assert.equal(textoDaEscrita({ resultado: 'gravado', motivo: null }), 'Atualizado na ficha');
  assert.equal(
    textoDaEscrita({ resultado: 'ignorado', motivo: 'igual' }),
    'Igual ao que já estava',
  );
  assert.equal(textoDaEscrita({ resultado: 'ignorado', motivo: 'sem_resposta' }), 'Não respondido');
  assert.match(textoDaEscrita({ resultado: 'revisao', motivo: 'valor_diferente' }), /diferente/);
  assert.match(textoDaEscrita({ resultado: 'revisao', motivo: 'regra_do_crm' }), /regra/);
  assert.equal(textoDaEscrita({ resultado: 'revisao', motivo: 'novo_motivo' }), 'Para revisar');
  assert.equal(textoDaEscrita(null), null);
});

test('podeUsarValor só no campo com valor diferente e à vista', () => {
  const diferente = { resultado: 'revisao', motivo: 'valor_diferente' };

  assert.equal(podeUsarValor({ campoId: 'c', valor: 'x', escrita: diferente }), true);
  assert.equal(podeUsarValor({ campoId: 'c', oculto: true, escrita: diferente }), false);
  assert.equal(
    podeUsarValor({
      campoId: 'c',
      valor: 'x',
      escrita: { resultado: 'revisao', motivo: 'regra_do_crm' },
    }),
    false,
  );
  assert.equal(podeUsarValor({ pergunta: { id: 'p' }, valor: 'x' }), false);
});

test('precisaRevisar e o resumo da escrita', () => {
  assert.equal(precisaRevisar({ escrita: { gravados: 1, ignorados: 0, revisao: 1 } }), true);
  assert.equal(precisaRevisar({ escrita: { gravados: 1, ignorados: 0, revisao: 0 } }), false);
  assert.equal(
    resumoDaEscrita({ gravados: 2, ignorados: 1, revisao: 1 }),
    '2 atualizados · 1 sem mudança · 1 para revisar',
  );
  assert.equal(resumoDaEscrita({ gravados: 0, ignorados: 0, revisao: 0 }), null);
});

test('rotuloDeQuemPreencheu nomeia o responsável', () => {
  assert.equal(
    rotuloDeQuemPreencheu({ preenchidoPor: 'titular', nomeResponsavel: null }),
    'A própria pessoa',
  );
  assert.equal(
    rotuloDeQuemPreencheu({ preenchidoPor: 'responsavel', nomeResponsavel: 'Joana' }),
    'Responsável: Joana',
  );
});

test('pessoa anonimizada: respostas sem valor e nada para usar', () => {
  const diferente = { resultado: 'revisao', motivo: 'valor_diferente' };

  assert.equal(respostasApagadas({ anonimizado_em: '2026-11-15T10:00:00Z' }), true);
  assert.equal(respostasApagadas({ anonimizado_em: null }), false);
  assert.equal(respostasApagadas(undefined), false);
  assert.match(MENSAGEM_RESPOSTAS_APAGADAS, /LGPD/);
  assert.equal(podeUsarValor({ campoId: 'c', valor: null, escrita: diferente }), false);
});
