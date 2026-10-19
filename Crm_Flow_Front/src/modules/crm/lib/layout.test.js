import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  MENSAGENS_LAYOUT,
  SEM_NOME,
  colunaDoItem,
  errosPorParte,
  idsDasColunas,
  identificadorPermitido,
  layoutDoEditor,
  opcoesDoEditor,
  parcialDoMeu,
  placeholderDaBusca,
  PLACEHOLDER_BUSCA,
  subtituloDoLead,
  textoDoValor,
  tituloDoLead,
  validarLayout,
} from './layout.js';

// M11: o CNPJ nativo vem com o tipo `cnpj` (gravado sem máscara).
const cnpj = { ref: 'f-cnpj', chave: 'cnpj', label: 'CNPJ', tipo: 'cnpj', camada: 2, coluna: 'cnpj' };
const empresa = { ref: 'f-emp', chave: 'empresa', label: 'Empresa', tipo: 'texto', camada: 2, coluna: 'empresa' };
const cidade = { ref: 'f-cid', chave: 'cidade', label: 'Cidade', tipo: 'texto', camada: 2, coluna: 'cidade' };
const valor = { ref: 'lead.valor', chave: 'valor', label: 'Valor', tipo: 'monetario', coluna: 'valor' };
const responsavel = { ref: 'lead.responsavel', chave: 'usuarioResponsavelId', label: 'Responsável', tipo: 'usuario', coluna: 'usuario_responsavel_id' };
const criadoEm = { ref: 'lead.criadoEm', chave: 'createdAt', label: 'Criado em', tipo: 'data', coluna: 'created_at' };

const lead = {
  id: 'l1',
  nome: 'Ana',
  cnpj: '12345678000190',
  empresa: 'Acme',
  cidade: 'Joinville',
  valor: '1500.00',
  usuario_responsavel_id: 'u1',
};

describe('título e subtítulo', () => {
  test('identificador formatado; vazio cai no Nome; sem Nome, "Lead sem nome"', () => {
    assert.equal(tituloDoLead(lead, cnpj), '12.345.678/0001-90');
    assert.equal(tituloDoLead({ ...lead, cnpj: null }, cnpj), 'Ana');
    assert.equal(tituloDoLead({ ...lead, cnpj: '', nome: '  ' }, cnpj), SEM_NOME);
    assert.equal(tituloDoLead(lead, null), 'Ana');
  });

  test('subtítulo junta os preenchidos com " · "', () => {
    assert.equal(subtituloDoLead(lead, [empresa, cidade]), 'Acme · Joinville');
    assert.equal(subtituloDoLead({ ...lead, empresa: null }, [empresa, cidade]), 'Joinville');
    assert.equal(subtituloDoLead({ id: 'x' }, [empresa]), '');
  });

  test('responsável sai pelo nome do usuário', () => {
    assert.equal(textoDoValor(responsavel, 'u1', new Map([['u1', 'Bia']])), 'Bia');
    assert.match(textoDoValor(valor, '1500.00'), /^R\$\s1\.500,00$/);
  });
});

describe('colunas', () => {
  test('referências fixas viram as colunas que a tabela já tem', () => {
    assert.deepEqual(idsDasColunas([empresa, valor, responsavel, criadoEm]), ['empresa', 'valor', 'responsavel', 'criadoEm']);
    assert.equal(colunaDoItem(criadoEm).tipo, 'instante');
    assert.equal(colunaDoItem(empresa).campo, empresa);
  });
});

describe('editor', () => {
  test('identificador: Nome, Empresa, CNPJ, CPF, E-mail ou personalizado de texto', () => {
    assert.equal(identificadorPermitido({ chave: 'cnpj', tipo: 'texto', camada: 2 }), true);
    assert.equal(identificadorPermitido({ chave: 'cidade', tipo: 'texto', camada: 2 }), false);
    assert.equal(identificadorPermitido({ chave: 'codigo', tipo: 'texto', camada: 3 }), true);
    assert.equal(identificadorPermitido({ chave: 'renda', tipo: 'numero', camada: 3 }), false);
  });

  test('opções do editor: campos pelo id, mais as fixas', () => {
    const opcoes = opcoesDoEditor([{ id: 'f-emp', chave: 'empresa', label: 'Empresa', tipo: 'texto', camada: 2 }]);

    assert.equal(opcoes[0].ref, 'f-emp');
    assert.ok(opcoes.some((opcao) => opcao.ref === 'lead.valor'));
  });

  test('do efetivo ao editor: refs, sem a seção automática', () => {
    const efetivo = {
      identificador: cnpj,
      subtitulo: [empresa],
      destaques: [valor],
      secoes: [
        { nome: 'Endereço', automatica: false, campos: [cidade] },
        { nome: 'Outros campos', automatica: true, campos: [empresa] },
      ],
      colunas: [empresa, criadoEm],
    };

    assert.deepEqual(layoutDoEditor(efetivo), {
      identificador: 'f-cnpj',
      subtitulo: ['f-emp'],
      destaques: ['lead.valor'],
      secoes: [{ nome: 'Endereço', campos: ['f-cid'] }],
      colunas: ['f-emp', 'lead.criadoEm'],
    });
  });

  test('override manda só as partes que mudaram', () => {
    const base = { identificador: 'n', subtitulo: ['a'], destaques: [], secoes: [], colunas: ['a', 'b'] };

    assert.deepEqual(parcialDoMeu(base, { ...base, colunas: ['b', 'a'] }), { colunas: ['b', 'a'] });
    assert.deepEqual(parcialDoMeu(base, base), {});
  });

  test('validação espelha o 400 do back', () => {
    const base = { identificador: 'n', subtitulo: [], destaques: [], secoes: [], colunas: ['a'] };

    assert.deepEqual(validarLayout(base), {});
    assert.equal(validarLayout({ ...base, subtitulo: ['a', 'b', 'c'] }).subtitulo, MENSAGENS_LAYOUT.SUBTITULO);
    assert.equal(validarLayout({ ...base, colunas: [] }).colunas, MENSAGENS_LAYOUT.COLUNAS);
    assert.equal(
      validarLayout({ ...base, secoes: [{ nome: 'A', campos: ['x'] }, { nome: ' a ', campos: [] }] }).secoes,
      MENSAGENS_LAYOUT.SECAO_REPETIDA,
    );
    assert.equal(
      validarLayout({ ...base, secoes: [{ nome: 'A', campos: ['x'] }, { nome: 'B', campos: ['x'] }] }).secoes,
      MENSAGENS_LAYOUT.CAMPO_EM_DUAS_SECOES,
    );
    assert.equal(validarLayout({ ...base, secoes: [{ nome: '', campos: [] }] }).secoes, MENSAGENS_LAYOUT.NOME_SECAO);
  });
});

test('a busca diz quando procura pelo identificador', () => {
  assert.equal(placeholderDaBusca(cnpj), 'Buscar por CNPJ, nome, e-mail ou telefone');
  assert.equal(placeholderDaBusca({ chave: 'nome', label: 'Nome' }), PLACEHOLDER_BUSCA);
  assert.equal(placeholderDaBusca(null), PLACEHOLDER_BUSCA);
});

test('400 do back cai na parte certa do editor', () => {
  assert.deepEqual(
    errosPorParte({ 'secoes.1.nome': ['Nome repetido'], subtitulo: ['No máximo 2'], outro: ['x'] }),
    { porParte: { secoes: 'Nome repetido', subtitulo: 'No máximo 2' }, geral: ['x'] },
  );
  assert.deepEqual(errosPorParte(undefined), { porParte: {}, geral: [] });
});
