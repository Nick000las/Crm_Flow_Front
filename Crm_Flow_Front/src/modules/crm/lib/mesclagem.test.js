import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LADO, escolhasParaEnvio, ladoQueFica, linhasDaMesclagem } from './mesclagem.js';

const CAMPOS = [
  { chave: 'nome', label: 'Nome', tipo: 'texto', camada: 1, coluna: 'nome' },
  { chave: 'email', label: 'E-mail', tipo: 'email', camada: 1, coluna: 'email' },
  { chave: 'cidade', label: 'Cidade', tipo: 'texto', camada: 2, coluna: 'cidade' },
  {
    chave: 'tags',
    label: 'Tags',
    tipo: 'selecao_multipla',
    camada: 1,
    coluna: 'tags',
    opcoesLista: [],
  },
  { chave: 'setor', label: 'Setor', tipo: 'texto', camada: 3 },
  { chave: 'status', label: 'Status', tipo: 'selecao', camada: 1, coluna: 'status' },
  {
    chave: 'motivoPerda',
    label: 'Motivo',
    tipo: 'selecao',
    camada: 2,
    coluna: 'motivo_perda',
  },
];
const NOMES = new Map([
  ['u1', 'Ana'],
  ['u2', 'Bia'],
]);

const A = {
  id: 'a',
  nome: 'Ana Souza',
  email: 'ana@x.com',
  cidade: null,
  tags: ['vip'],
  status: 'novo',
  motivo_perda: null,
  valor: '100.00',
  usuario_responsavel_id: 'u1',
  custom_fields: { setor: 'Varejo' },
};
const B = {
  id: 'b',
  nome: 'Ana S.',
  email: 'ana@x.com',
  cidade: 'Recife',
  tags: ['frio'],
  status: 'perdido',
  motivo_perda: 'preco',
  valor: '250',
  usuario_responsavel_id: 'u2',
  custom_fields: {},
};

test('linhasDaMesclagem mostra só o que difere, sem tags nem dados comerciais', () => {
  const linhas = linhasDaMesclagem(CAMPOS, A, B, NOMES);

  assert.deepEqual(
    linhas.map(({ chave, escolhivel }) => [chave, escolhivel]),
    [
      ['nome', true],
      ['cidade', false],
      ['setor', false],
      ['usuarioResponsavelId', true],
    ],
  );
  assert.deepEqual(linhas.at(-1), {
    chave: 'usuarioResponsavelId',
    label: 'Responsável',
    textoA: 'Ana',
    textoB: 'Bia',
    escolhivel: true,
  });
});

test('escolhasParaEnvio manda só o lado secundário', () => {
  assert.deepEqual(escolhasParaEnvio({ nome: LADO.B, usuarioResponsavelId: LADO.A }, LADO.A), {
    nome: 'secundario',
  });
  assert.deepEqual(escolhasParaEnvio({ nome: LADO.B }, LADO.B), undefined);
  assert.equal(escolhasParaEnvio({}, LADO.A), undefined);
});

test('ladoQueFica segue escolha, principal e o preenchido', () => {
  const [nome, cidade, setor] = linhasDaMesclagem(CAMPOS, A, B, NOMES);

  assert.equal(ladoQueFica(nome, undefined, LADO.A), LADO.A);
  assert.equal(ladoQueFica(nome, LADO.B, LADO.A), LADO.B);
  // Principal vazio: vale o do outro lado.
  assert.equal(ladoQueFica(cidade, undefined, LADO.A), LADO.B);
  assert.equal(ladoQueFica(setor, undefined, LADO.B), LADO.A);
});
