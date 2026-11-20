import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  camposDaPessoaNova,
  colunasDeDestino,
  pedeOutrosCampos,
  porNoTopo,
  camposDoMover,
  separarObrigatorios,
  somaDoResumo,
  textoDoCard,
  tirarDasPaginas,
} from './quadro.js';

const card = (entidadeId) => ({ entidadeId, atualizadoEm: '2026-11-06T12:00:00.000Z' });
const pagina = (...ids) => ({ itens: ids.map(card), proximoCursor: null });
const dados = (...pages) => ({ pages, pageParams: pages.map(() => undefined) });
const ids = (paginas) => paginas.pages.map((atual) => atual.itens.map((item) => item.entidadeId));

test('tirarDasPaginas acha o card em qualquer página', () => {
  assert.deepEqual(ids(tirarDasPaginas(dados(pagina('a'), pagina('b', 'c')), 'b')), [['a'], ['c']]);
  assert.equal(tirarDasPaginas(undefined, 'a'), undefined);
});

test('porNoTopo põe o card no início da primeira página', () => {
  assert.deepEqual(ids(porNoTopo(dados(pagina('a'), pagina('b')), card('z'))), [['z', 'a'], ['b']]);
});

test('coluna ainda sem dados fica como está', () => {
  assert.equal(porNoTopo(undefined, card('z')), undefined);
  assert.deepEqual(ids(porNoTopo(dados(), card('z'))), []);
});

test('colunasDeDestino tira a atual e os status desativados', () => {
  const colunas = [
    { ref: 'novo', ativa: true },
    { ref: 'velho', ativa: false },
    { ref: 'proposta', ativa: true },
  ];

  assert.deepEqual(
    colunasDeDestino(colunas, 'novo').map((coluna) => coluna.ref),
    ['proposta'],
  );
});

test('somaDoResumo não inventa R$ 0,00 para quem não vê Valor', () => {
  assert.equal(somaDoResumo({ total: 3, soma: null }), null);
  assert.equal(somaDoResumo(undefined), null);
  assert.match(somaDoResumo({ total: 0, soma: 0 }), /^R\$\s0,00$/);
  assert.match(somaDoResumo({ total: 1, soma: 1500 }), /^R\$\s1\.500,00$/);
});

test('textoDoCard usa o nome que o back manda no status', () => {
  const item = { ref: 'a', chave: 'status', label: 'Status', tipo: 'selecao', valor: 'Proposta' };

  assert.equal(textoDoCard(item, [], new Map()), 'Proposta');
  assert.equal(textoDoCard({ ...item, valor: null }, [], new Map()), null);
});

test('textoDoCard resolve opção e valor como o resto do CRM', () => {
  const opcoesLista = [{ key: 'site', label: 'Site', color: null, ativo: true }];
  const origem = { chave: 'fonteLead', tipo: 'selecao', opcoes: ['site'], opcoesLista };
  const comOrigem = {
    ref: 'a',
    chave: 'fonteLead',
    label: 'Origem',
    tipo: 'selecao',
    valor: 'site',
  };
  const valor = {
    ref: 'lead.valor',
    chave: 'valor',
    label: 'Valor',
    tipo: 'monetario',
    valor: 1500,
  };

  assert.equal(textoDoCard(comOrigem, [origem], new Map()), 'Site');
  assert.match(textoDoCard(valor, [], new Map()), /^R\$\s1\.500,00$/);
  assert.equal(textoDoCard({ ...valor, valor: null }, [], new Map()), null);
});

test('pessoa nova não escolhe status nem conversão; personalizado de mesmo nome fica', () => {
  const campos = [
    { chave: 'nome', camada: 1 },
    { chave: 'status', camada: 1 },
    { chave: 'dataConversao', camada: 2 },
    { chave: 'status', camada: 3 },
  ];

  assert.deepEqual(camposDaPessoaNova(campos), [campos[0], campos[3]]);
});

const CAMPOS = [
  { chave: 'status', camada: 1 },
  { chave: 'motivoPerda', camada: 2, tipo: 'selecao' },
  { chave: 'valor', camada: 2 },
  { chave: 'probabilidadeFechamento', camada: 2, tipo: 'numero' },
  { chave: 'dataPrevistaFechamento', camada: 2 },
  { chave: 'empresa', camada: 2 },
  { chave: 'contrato', camada: 3 },
];
const campo = (chave) => CAMPOS.find((atual) => atual.chave === chave);

test('motivo e probabilidade vão com o status; o resto do comercial, pela oportunidade', () => {
  const resultado = separarObrigatorios(
    {
      motivoPerda: ['Informe o motivo'],
      valor: ['Informe o valor'],
      probabilidadeFechamento: ['Informe a probabilidade'],
      dataPrevistaFechamento: ['Informe a data'],
    },
    CAMPOS,
  );

  assert.deepEqual(resultado.noMover, [campo('motivoPerda'), campo('probabilidadeFechamento')]);
  assert.deepEqual(resultado.daOportunidade, [campo('valor'), campo('dataPrevistaFechamento')]);
  assert.deepEqual(resultado.doLead, []);
  assert.deepEqual(resultado.bloqueados, []);
});

test('dado de contato e personalizado vão pelo lead', () => {
  const resultado = separarObrigatorios(
    { empresa: ['Informe a empresa'], contrato: ['Informe o contrato'] },
    CAMPOS,
  );

  assert.deepEqual(resultado.doLead, [campo('empresa'), campo('contrato')]);
  assert.deepEqual(resultado.daOportunidade, []);
});

const PERSONALIZADO = { chave: 'contrato', label: 'Contrato', camada: 3 };

test('personalizado chega em customFields e vai pelo lead, achado pelo nome', () => {
  const fields = { customFields: ['"Contrato" é obrigatório a partir de Proposta'] };
  const campos = [...CAMPOS.filter(({ chave }) => chave !== 'contrato'), PERSONALIZADO];

  assert.deepEqual(separarObrigatorios(fields, campos).doLead, [PERSONALIZADO]);
});

test('personalizado que o papel não vê trava, com a mensagem do back', () => {
  const mensagem = '"Oculto" é obrigatório a partir de Proposta';
  const resultado = separarObrigatorios({ customFields: [mensagem] }, [PERSONALIZADO]);

  assert.deepEqual(resultado.bloqueados, [mensagem]);
  assert.deepEqual(resultado.doLead, []);
});

test('campo de sistema com o nome do personalizado não confunde', () => {
  const sistema = { chave: 'contrato', label: 'Contrato', camada: 2 };
  const resultado = separarObrigatorios({ customFields: ['"Contrato" é obrigatório'] }, [sistema]);

  assert.deepEqual(resultado.doLead, []);
  assert.equal(resultado.bloqueados.length, 1);
});

test('responsável não está em /fields e vai pelo lead', () => {
  const { doLead, bloqueados } = separarObrigatorios(
    { usuarioResponsavelId: ['Informe o responsável'] },
    CAMPOS,
  );

  assert.deepEqual(
    doLead.map(({ chave, tipo }) => [chave, tipo]),
    [['usuarioResponsavelId', 'usuario']],
  );
  assert.deepEqual(bloqueados, []);
});

test('o que o papel não preenche trava, com a mensagem do back', () => {
  const soVer = CAMPOS.map((atual) => ({ ...atual, acesso: 'view' }));

  assert.deepEqual(separarObrigatorios({ valor: ['Informe o valor'] }, soVer).bloqueados, [
    'Informe o valor',
  ]);
  assert.deepEqual(separarObrigatorios({ oculto: ['Informe o campo'] }, CAMPOS).bloqueados, [
    'Informe o campo',
  ]);
});

test('status recusado não vira campo do form', () => {
  const resultado = separarObrigatorios({ status: ['Status inválido'] }, CAMPOS);

  assert.deepEqual(resultado.bloqueados, ['Status inválido']);
  assert.deepEqual(resultado.doLead, []);
});

test('sem fields, nada a preencher', () => {
  assert.deepEqual(separarObrigatorios(undefined, CAMPOS), {
    noMover: [],
    daOportunidade: [],
    doLead: [],
    bloqueados: [],
  });
});

test('camposDoMover converte os valores do form para a API', () => {
  const noMover = [campo('motivoPerda'), campo('probabilidadeFechamento')];

  assert.deepEqual(
    camposDoMover(noMover, { motivoPerda: 'preco', probabilidadeFechamento: '35' }),
    {
      motivoPerda: 'preco',
      probabilidadeFechamento: 35,
    },
  );
  assert.equal(camposDoMover([], {}), undefined);
});

test('pedeOutrosCampos só com chave fora do form', () => {
  const chaves = new Set(['motivoPerda']);

  assert.equal(pedeOutrosCampos({ motivoPerda: ['x'] }, chaves), false);
  assert.equal(pedeOutrosCampos({ motivoPerda: ['x'], empresa: ['y'] }, chaves), true);
  assert.equal(pedeOutrosCampos(undefined, chaves), false);
});
