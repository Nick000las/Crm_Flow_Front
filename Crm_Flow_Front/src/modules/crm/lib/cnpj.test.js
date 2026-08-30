import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  aplicarSugestoes,
  camposCompativeis,
  cnpjCompleto,
  configMudou,
  configParaEnvio,
  dadosParaLeitura,
  itensDaSugestao,
  situacaoDestacada,
  valoresDaConfig,
} from './cnpj.js';

const campos = [
  { chave: 'empresa', coluna: 'empresa', label: 'Empresa', tipo: 'texto', camada: 2 },
  { chave: 'cep', coluna: 'cep', label: 'CEP', tipo: 'cep', camada: 2 },
  { chave: 'sede', label: 'Sede', tipo: 'endereco', camada: 3 },
];

const sugestao = [
  {
    campoReceita: 'razaoSocial',
    chave: 'empresa',
    label: 'Empresa',
    tipo: 'texto',
    camada: 2,
    valor: 'ACME LTDA',
  },
  { campoReceita: 'cep', chave: 'cep', label: 'CEP', tipo: 'cep', camada: 2, valor: '01310100' },
  {
    campoReceita: 'endereco',
    chave: 'sede',
    label: 'Sede',
    tipo: 'endereco',
    camada: 3,
    valor: { cidade: 'São Paulo', uf: 'SP' },
  },
  {
    campoReceita: 'municipio',
    chave: 'cidade',
    label: 'Cidade',
    tipo: 'texto',
    camada: 2,
    valor: 'São Paulo',
  },
  {
    campoReceita: 'dataAbertura',
    chave: 'abertura',
    label: 'Abertura',
    tipo: 'data',
    camada: 3,
    valor: '2001-05-10',
  },
];

test('cnpjCompleto ignora a máscara e aceita o alfanumérico', () => {
  assert.equal(cnpjCompleto('12.345.678/0001-90'), true);
  assert.equal(cnpjCompleto('12.ABC.345/01DE-35'), true);
  assert.equal(cnpjCompleto('12.345'), false);
});

test('marca o vazio e o igual; com outro valor, pede para substituir; fora do form não aplica', () => {
  const valores = { empresa: 'Outra', cep: '01310-100', 'custom.sede': {} };
  const itens = itensDaSugestao(sugestao, campos, valores);
  const porReceita = Object.fromEntries(itens.map((item) => [item.campoReceita, item]));

  assert.equal(porReceita.razaoSocial.marcadaPorPadrao, false);
  assert.equal(porReceita.razaoSocial.substitui, true);
  assert.equal(porReceita.cep.marcadaPorPadrao, true);
  assert.equal(porReceita.cep.texto, '01310-100');
  assert.equal(porReceita.endereco.id, 'custom.sede');
  assert.equal(porReceita.endereco.marcadaPorPadrao, true);
  assert.equal(porReceita.municipio.disponivel, false);
  assert.equal(porReceita.municipio.motivo, 'Campo fora deste formulário');
  // Fora do form, o tipo que vem na sugestão ainda formata o valor.
  assert.equal(porReceita.dataAbertura.texto, '10/05/2001');
});

test('campo só de ver (permissão) aparece, mas não se aplica', () => {
  const soVer = campos.map((campo) =>
    campo.chave === 'empresa' ? { ...campo, acesso: 'view' } : campo,
  );
  const [empresa] = itensDaSugestao(sugestao, soVer, { empresa: '' });

  assert.equal(empresa.disponivel, false);
  assert.equal(empresa.marcadaPorPadrao, false);
  assert.equal(empresa.motivo, 'Sem permissão para editar');
  assert.deepEqual(aplicarSugestoes({ empresa: '' }, [empresa], new Set([empresa.id])), {
    empresa: '',
  });
});

test('aplicar põe só os marcados, no formato do controle (Camada 3 inclusa)', () => {
  const itens = itensDaSugestao(sugestao, campos, { empresa: 'Outra', cep: '' });
  const valores = aplicarSugestoes(
    { empresa: 'Outra', cep: '' },
    itens,
    new Set(['cep', 'custom.sede', 'cidade']),
  );

  assert.equal(valores.empresa, 'Outra');
  assert.equal(valores.cep, '01310-100');
  assert.equal(valores['custom.sede'].cidade, 'São Paulo');
  assert.equal('cidade' in valores, false);
});

test('configuração: compatíveis por tipo, envio sem dado vazio, mudou sem depender da ordem', () => {
  const configurados = [
    { id: 'f1', label: 'Empresa', tipo: 'texto' },
    { id: 'f2', label: 'CEP', tipo: 'cep' },
    { id: 'f3', label: 'Sede', tipo: 'endereco' },
  ];
  assert.deepEqual(
    camposCompativeis({ tipos: ['endereco', 'texto', 'texto_longo'] }, configurados).map(
      (campo) => campo.id,
    ),
    ['f1', 'f3'],
  );

  const config = {
    ativo: true,
    modo: 'manual',
    sobrescrever: false,
    mapeamento: { razaoSocial: 'f1', cep: 'f2' },
  };
  const valores = valoresDaConfig(config);
  assert.equal(configMudou(valores, config), false);
  assert.equal(
    configMudou({ ...valores, mapeamento: { cep: 'f2', razaoSocial: 'f1' } }, config),
    false,
  );
  assert.deepEqual(
    configParaEnvio({ ...valores, mapeamento: { razaoSocial: '', cep: 'f2' } }).mapeamento,
    { cep: 'f2' },
  );
  assert.equal(configMudou({ ...valores, modo: 'automatico' }, config), true);
});

const camposReceita = [
  { chave: 'razaoSocial', label: 'Razão social' },
  { chave: 'situacao', label: 'Situação cadastral' },
  { chave: 'endereco', label: 'Endereço completo' },
  { chave: 'municipio', label: 'Município' },
  { chave: 'cep', label: 'CEP' },
  { chave: 'telefone', label: 'Telefone' },
  { chave: 'dataAbertura', label: 'Data de abertura' },
  { chave: 'email', label: 'E-mail' },
];
const dadosReceita = {
  telefone: '1132145678',
  razaoSocial: 'ACME LTDA',
  logradouro: 'AV PAULISTA',
  numero: '1000',
  municipio: 'SAO PAULO',
  uf: 'SP',
  cep: '01311902',
  situacao: 'ATIVA',
  dataAbertura: '2013-10-03',
};

test('dados só para leitura: ordem e rótulo do back, formatados, endereço numa linha', () => {
  assert.deepEqual(dadosParaLeitura(dadosReceita, camposReceita), [
    { chave: 'razaoSocial', label: 'Razão social', texto: 'ACME LTDA' },
    { chave: 'situacao', label: 'Situação cadastral', texto: 'ATIVA' },
    {
      chave: 'endereco',
      label: 'Endereço completo',
      texto: 'AV PAULISTA, 1000, SAO PAULO/SP, 01311-902',
    },
    { chave: 'telefone', label: 'Telefone', texto: '(11) 3214-5678' },
    { chave: 'dataAbertura', label: 'Data de abertura', texto: '03/10/2013' },
  ]);
  assert.deepEqual(dadosParaLeitura(null, camposReceita), []);
});

test('o que já é sugestão sai da leitura (endereço inteiro, se sugerido)', () => {
  const chaves = dadosParaLeitura(
    dadosReceita,
    camposReceita,
    new Set(['razaoSocial', 'endereco']),
  ).map((dado) => dado.chave);

  assert.deepEqual(chaves, ['situacao', 'telefone', 'dataAbertura']);
});

test('situação: destaque só fora de ATIVA', () => {
  assert.equal(situacaoDestacada({ situacao: 'ATIVA' }), null);
  assert.equal(situacaoDestacada({ situacao: 'Baixada' }), 'BAIXADA');
  assert.equal(situacaoDestacada({}), null);
});
