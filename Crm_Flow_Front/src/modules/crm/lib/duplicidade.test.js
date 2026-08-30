import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  acoesParaEnvio,
  candidatosDoErro,
  checaDuplicidade,
  consultaDeDuplicados,
  descreverCandidato,
  ehBloqueio,
  ehErroDeDuplicidade,
  opcoesDeAcaoImport,
  regrasParaEnvio,
  valoresDasRegras,
} from './duplicidade.js';

const CAMPOS = [
  { chave: 'nome', label: 'Nome', tipo: 'texto', camada: 1 },
  { chave: 'email', label: 'E-mail', tipo: 'email', camada: 1 },
  { chave: 'telefone', label: 'Telefone', tipo: 'telefone', camada: 1 },
  { chave: 'cnpj', label: 'CNPJ', tipo: 'texto', camada: 2 },
  { chave: 'cpf', label: 'CPF do sócio', tipo: 'texto', camada: 3 },
];

test('reconhece o 409 de duplicidade e o bloqueio', () => {
  assert.equal(ehErroDeDuplicidade({ code: 'DUPLICATE_WARNING' }), true);
  assert.equal(ehErroDeDuplicidade({ code: 'DUPLICATE_BLOCKED' }), true);
  assert.equal(ehErroDeDuplicidade({ code: 'CONFLICT' }), false);
  assert.equal(ehBloqueio({ code: 'DUPLICATE_BLOCKED' }), true);
  assert.equal(ehBloqueio({ code: 'DUPLICATE_WARNING' }), false);
});

test('candidatosDoErro lê details.duplicados com segurança', () => {
  const candidato = {
    id: 'l1',
    nome: 'Ana',
    campos: [{ campo: 'email', label: 'E-mail' }],
    acao: 'warn',
  };

  assert.deepEqual(candidatosDoErro({ details: { duplicados: [candidato, { nome: 'sem id' }] } }), [
    candidato,
  ]);
  assert.deepEqual(candidatosDoErro({ details: null }), []);
  assert.deepEqual(candidatosDoErro(undefined), []);
});

test('descreverCandidato junta os campos iguais', () => {
  assert.equal(descreverCandidato({ campos: [{ label: 'E-mail' }] }), 'E-mail igual');
  assert.equal(
    descreverCandidato({ campos: [{ label: 'E-mail' }, { label: 'Telefone' }] }),
    'E-mail e Telefone iguais',
  );
  assert.equal(
    descreverCandidato({ campos: [{ label: 'E-mail' }, { label: 'Telefone' }, { label: 'CNPJ' }] }),
    'E-mail, Telefone e CNPJ iguais',
  );
  assert.equal(descreverCandidato({ campos: [] }), 'Parecido');
});

test('consultaDeDuplicados pega só os campos das regras, preenchidos e fora da Camada 3', () => {
  const valores = {
    nome: 'Ana',
    email: ' ana@x.com ',
    telefone: '',
    cnpj: '12.345.678/0001-90',
    'custom.cpf': '123',
  };

  assert.deepEqual(consultaDeDuplicados(CAMPOS, valores), {
    email: 'ana@x.com',
    cnpj: '12.345.678/0001-90',
  });
  assert.deepEqual(consultaDeDuplicados(CAMPOS, { email: 'a@b.c' }, 'l1'), {
    email: 'a@b.c',
    leadId: 'l1',
  });
  assert.equal(consultaDeDuplicados(CAMPOS, { nome: 'Ana' }), null);
});

test('checaDuplicidade', () => {
  assert.deepEqual(
    CAMPOS.filter(checaDuplicidade).map((campo) => campo.chave),
    ['email', 'telefone', 'cnpj'],
  );
});

test('regrasParaEnvio manda só o que mudou', () => {
  const originais = [
    { campo: 'email', label: 'E-mail', acao: 'warn', ativo: true },
    { campo: 'cnpj', label: 'CNPJ', acao: 'warn', ativo: false },
  ];
  const editadas = valoresDasRegras(originais);

  assert.equal(regrasParaEnvio(editadas, originais), null);
  assert.deepEqual(
    regrasParaEnvio({ ...editadas, cnpj: { ativo: true, acao: 'block' } }, originais),
    [{ campo: 'cnpj', ativo: true, acao: 'block' }],
  );
});

test('import: "criar" some na linha bloqueada; ações só das escolhidas', () => {
  assert.deepEqual(
    opcoesDeAcaoImport({ linha: 2, acao: 'warn', leads: [] }).map((opcao) => opcao.valor),
    ['pular', 'atualizar', 'criar'],
  );
  assert.deepEqual(
    opcoesDeAcaoImport({ linha: 2, acao: 'block', leads: [] }).map((opcao) => opcao.valor),
    ['pular', 'atualizar'],
  );
  assert.deepEqual(acoesParaEnvio({ 2: 'pular', 3: '', 5: 'criar' }), { 2: 'pular', 5: 'criar' });
  assert.equal(acoesParaEnvio({ 3: '' }), null);
});
