import assert from 'node:assert/strict';
import { test } from 'node:test';
import { alternarItem, colunasSelecionadas, itensIniciais, moverItem } from './colunas-export.js';

const campos = [
  { chave: 'nome', label: 'Nome' },
  { chave: 'email', label: 'E-mail' },
  { chave: 'status', label: 'Status' },
];

test('começa com as visíveis da tabela, na ordem dela, e o resto desmarcado', () => {
  const itens = itensIniciais(campos, ['status', 'nome', 'responsavel']);

  assert.deepEqual(
    itens.map(({ chave, marcada }) => [chave, marcada]),
    [
      ['status', true],
      ['nome', true],
      ['email', false],
      ['valor', false],
    ],
  );
});

test('mover troca vizinhos e não passa das bordas', () => {
  const itens = itensIniciais(campos, ['nome', 'email']);

  assert.deepEqual(
    moverItem(itens, 1, -1)
      .map((item) => item.chave)
      .slice(0, 2),
    ['email', 'nome'],
  );
  assert.equal(moverItem(itens, 0, -1), itens);
});

test('colunas selecionadas respeitam a ordem escolhida', () => {
  let itens = itensIniciais(campos, ['nome', 'email']);
  itens = alternarItem(itens, 'valor');
  itens = moverItem(itens, 3, -1);

  assert.deepEqual(colunasSelecionadas(itens), ['nome', 'email', 'valor']);
  assert.deepEqual(colunasSelecionadas(alternarItem(itens, 'nome')), ['email', 'valor']);
});

test('com crm.massa, Responsável e Criado em entram e casam com as colunas da tabela', () => {
  const itens = itensIniciais(campos, ['nome', 'responsavel', 'criadoEm'], { comMassa: true });

  assert.deepEqual(
    itens.map(({ chave, marcada }) => [chave, marcada]),
    [
      ['nome', true],
      ['usuarioResponsavelId', true],
      ['createdAt', true],
      ['email', false],
      ['status', false],
      ['valor', false],
    ],
  );
});

test('sem a flag, as colunas novas não aparecem', () => {
  const chaves = itensIniciais(campos, ['responsavel', 'criadoEm']).map((item) => item.chave);

  assert.equal(chaves.includes('usuarioResponsavelId'), false);
  assert.equal(chaves.includes('createdAt'), false);
});
