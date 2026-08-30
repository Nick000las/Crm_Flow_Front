import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  ehListaLivre,
  humanizar,
  opcaoDoCampo,
  opcoesDoFiltro,
  opcoesDoSeletor,
  rotuloOpcao,
  sugestoesDoCampo,
} from './opcoes.js';

const opcao = (key, label, extra = {}) => ({
  key,
  label,
  color: null,
  category: null,
  ativo: true,
  ...extra,
});

const status = {
  chave: 'status',
  camada: 1,
  lista: 'status',
  opcoes: ['novo', 'ganho'],
  opcoesLista: [
    opcao('novo', 'Novo', { category: 'aberto', color: '#2563eb' }),
    opcao('ganho', 'Fechado', { category: 'ganho' }),
    opcao('frio', 'Frio', { ativo: false }),
  ],
};

const tags = {
  chave: 'tags',
  camada: 1,
  lista: 'tag',
  opcoes: null,
  opcoesLista: [opcao('cliente_vip', 'Cliente VIP'), opcao('antiga', 'Antiga', { ativo: false })],
};

describe('opcaoDoCampo e rotuloOpcao', () => {
  test('usa o label e a cor da lista do tenant', () => {
    assert.equal(rotuloOpcao('ganho', status), 'Fechado');
    assert.equal(opcaoDoCampo(status, 'novo').color, '#2563eb');
    assert.equal(opcaoDoCampo(status, 'frio').ativo, false);
  });

  test('valor fora da lista continua legível', () => {
    assert.deepEqual(opcaoDoCampo(status, 'em_contato'), opcao('em_contato', 'Em contato'));
    assert.equal(rotuloOpcao('valor_novo'), 'Valor novo');
    assert.equal(humanizar('x'), 'X');
  });

  test('Camada 3 volta como o usuário escreveu', () => {
    assert.equal(rotuloOpcao('em_contato', { camada: 3 }), 'em_contato');
  });

  test('vazio não vira opção', () => {
    assert.equal(opcaoDoCampo(status, null), null);
    assert.equal(rotuloOpcao(''), '');
  });
});

describe('seletor e filtro', () => {
  test('o seletor oferece só as ativas', () => {
    assert.deepEqual(opcoesDoSeletor(status, ''), [
      { valor: 'novo', rotulo: 'Novo' },
      { valor: 'ganho', rotulo: 'Fechado' },
    ]);
  });

  test('a inativa que o lead já tem continua no seletor, marcada', () => {
    assert.deepEqual(opcoesDoSeletor(status, 'frio').at(-1), {
      valor: 'frio',
      rotulo: 'Frio (inativa)',
    });
    assert.equal(opcoesDoSeletor(status, 'novo').length, 2);
  });

  test('o filtro lista todas, inclusive inativas, e tags por key', () => {
    assert.deepEqual(
      opcoesDoFiltro(status).map((item) => item.rotulo),
      ['Novo', 'Fechado', 'Frio (inativa)'],
    );
    assert.deepEqual(opcoesDoFiltro(tags)[0], { valor: 'cliente_vip', rotulo: 'Cliente VIP' });
    assert.deepEqual(opcoesDoFiltro({ camada: 3, opcoes: ['A'] }), [{ valor: 'A', rotulo: 'A' }]);
  });
});

describe('tags (entrada livre)', () => {
  test('tags é lista livre; status não', () => {
    assert.equal(ehListaLivre(tags), true);
    assert.equal(ehListaLivre(status), false);
    assert.equal(ehListaLivre({ opcoes: null }), false);
  });

  test('sugestões são os nomes das ativas', () => {
    assert.deepEqual(sugestoesDoCampo(tags), ['Cliente VIP']);
  });
});
