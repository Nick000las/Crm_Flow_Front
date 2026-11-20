import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { MENSAGENS } from './form-lead.js';
import {
  MENSAGENS_LISTA,
  adicionarOpcao,
  motivoNaoExclui,
  payloadDaOpcao,
  pedeProbabilidade,
  removerOpcao,
  reordenarLista,
  substituirOpcao,
  validarOpcao,
  valoresDaOpcao,
} from './listas.js';

const opcao = (extra = {}) => ({
  id: 'o1',
  key: 'novo',
  label: 'Novo',
  color: '#2563eb',
  position: 0,
  category: 'aberto',
  ativo: true,
  usos: 0,
  ...extra,
});

describe('form da opção', () => {
  test('status começa em "aberto"; as outras listas, sem categoria', () => {
    assert.deepEqual(valoresDaOpcao('status'), {
      label: '',
      color: '',
      category: 'aberto',
      probabilidadePadrao: '',
    });
    assert.equal(valoresDaOpcao('tag').category, '');
    assert.equal(valoresDaOpcao('tag').probabilidadePadrao, undefined);
    assert.deepEqual(valoresDaOpcao('status', opcao()), {
      label: 'Novo',
      color: '#2563eb',
      category: 'aberto',
      probabilidadePadrao: '',
    });
  });

  test('validação: nome, cor #RRGGBB e categoria só em status', () => {
    assert.deepEqual(validarOpcao('status', { label: ' ', color: '#12', category: '' }), {
      label: MENSAGENS_LISTA.NOME,
      color: MENSAGENS_LISTA.COR,
      category: MENSAGENS_LISTA.CATEGORIA,
    });
    assert.deepEqual(validarOpcao('tag', { label: 'VIP', color: '', category: '' }), {});
  });

  test('probabilidade padrão: só em status aberto, inteiro de 0 a 100', () => {
    const status = (category, probabilidadePadrao) => ({
      label: 'Proposta',
      color: '',
      category,
      probabilidadePadrao,
    });
    assert.equal(pedeProbabilidade('status', status('aberto', '')), true);
    assert.equal(pedeProbabilidade('status', status('ganho', '')), false);
    assert.equal(pedeProbabilidade('tag', status('', '')), false);
    assert.deepEqual(validarOpcao('status', status('aberto', '101')), {
      probabilidadePadrao: MENSAGENS.PROBABILIDADE_INVALIDA,
    });
    assert.deepEqual(validarOpcao('status', status('perdido', '101')), {});
  });
});

describe('corpo do POST e do PUT', () => {
  test('criar status aberto manda a probabilidade só se preenchida', () => {
    const valores = { label: 'Proposta', color: '', category: 'aberto', probabilidadePadrao: '35' };
    assert.deepEqual(payloadDaOpcao('status', valores), {
      label: 'Proposta',
      category: 'aberto',
      probabilidadePadrao: 35,
    });
    assert.equal(
      'probabilidadePadrao' in payloadDaOpcao('status', { ...valores, probabilidadePadrao: '' }),
      false,
    );
    assert.equal(
      'probabilidadePadrao' in payloadDaOpcao('status', { ...valores, category: 'ganho' }),
      false,
    );
  });

  test('editar não manda a probabilidade (ela se edita na coluna)', () => {
    const valores = {
      label: 'Novo',
      color: '#2563eb',
      category: 'aberto',
      probabilidadePadrao: '50',
    };
    assert.equal(payloadDaOpcao('status', valores, opcao()), null);
  });

  test('criar manda nome, cor se houver e categoria só em status', () => {
    assert.deepEqual(payloadDaOpcao('fonte_lead', { label: ' Feira ', color: '', category: '' }), {
      label: 'Feira',
    });
    assert.deepEqual(
      payloadDaOpcao('status', { label: 'Proposta', color: '#aabbcc', category: 'aberto' }),
      {
        label: 'Proposta',
        color: '#aabbcc',
        category: 'aberto',
      },
    );
  });

  test('editar manda só o que mudou; cor apagada vira null', () => {
    const original = opcao();

    assert.equal(payloadDaOpcao('status', valoresDaOpcao('status', original), original), null);
    assert.equal(
      payloadDaOpcao('status', { label: 'Novo', color: '#2563EB', category: 'aberto' }, original),
      null,
    );
    assert.deepEqual(
      payloadDaOpcao('status', { label: 'Novo', color: '', category: 'aberto' }, original),
      {
        color: null,
      },
    );
    assert.deepEqual(
      payloadDaOpcao('status', { label: 'Entrada', color: '#2563eb', category: 'ganho' }, original),
      {
        label: 'Entrada',
        category: 'ganho',
      },
    );
  });
});

test('excluir opção em uso fica bloqueado, com o motivo', () => {
  assert.equal(motivoNaoExclui(opcao()), null);
  assert.equal(
    motivoNaoExclui(opcao({ usos: 1 })),
    'Em uso por 1 lead. Desative em vez de excluir.',
  );
  assert.match(motivoNaoExclui(opcao({ usos: 1200 })), /^Em uso por 1\.200 leads/);
});

test('o cache das listas muda só no tipo tocado', () => {
  const listas = { status: [opcao({ id: 'a' }), opcao({ id: 'b' })], tag: [] };

  assert.equal(
    substituirOpcao(listas, 'status', opcao({ id: 'b', label: 'X' })).status[1].label,
    'X',
  );
  assert.equal(adicionarOpcao(listas, 'tag', opcao({ id: 't' })).tag.length, 1);
  assert.deepEqual(
    removerOpcao(listas, 'status', 'a').status.map((item) => item.id),
    ['b'],
  );
  assert.deepEqual(
    reordenarLista(listas, 'status', ['b', 'a']).status.map((item) => item.id),
    ['b', 'a'],
  );
  assert.equal(reordenarLista(listas, 'status', ['b', 'a']).tag, listas.tag);
});
