import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENSAGENS_DISTRIBUICAO,
  chaveDaConfig,
  descreverCondicoes,
  destinoDoSelect,
  distribuicaoMudou,
  distribuicaoParaEnvio,
  errosDoPut,
  nomeDoDestino,
  novaRegra,
  podeAdicionarRegra,
  validarRegraDistribuicao,
  valoresDaDistribuicao,
} from './distribuicao.js';

const ORIGEM = {
  id: 'f-origem',
  chave: 'fonteLead',
  label: 'Origem',
  tipo: 'selecao',
  camada: 1,
  coluna: 'fonte_lead',
  opcoes: ['site', 'evento'],
  opcoesLista: [
    { key: 'site', label: 'Site', color: null, category: null, ativo: true },
    { key: 'evento', label: 'Evento', color: null, category: null, ativo: true },
  ],
};
const EMPRESA = {
  id: 'f-empresa',
  chave: 'empresa',
  label: 'Empresa',
  tipo: 'texto',
  camada: 2,
  coluna: 'empresa',
};
const CAMPOS = [ORIGEM, EMPRESA];

const CONFIG = {
  ativo: true,
  fallback: 'rodizio_geral',
  configurado: true,
  regras: [
    {
      id: 'r-site',
      nome: 'Site',
      ativo: true,
      condicoes: [{ campoId: 'f-origem', operador: 'igual', valor: 'site' }],
      destino: { tipo: 'grupo', id: 'g-sp' },
    },
    {
      id: 'r-resto',
      nome: 'Resto',
      ativo: false,
      condicoes: [],
      destino: { tipo: 'usuario', id: 'u-ana' },
    },
  ],
  grupos: [{ id: 'g-sp', nome: 'Vendas SP', membros: ['u-ana'] }],
};

test('ida e volta: o PUT leva a config inteira, na ordem, com o id das regras existentes', () => {
  const valores = valoresDaDistribuicao(CONFIG, CAMPOS);
  const { corpo } = /** @type {any} */ (distribuicaoParaEnvio(valores, CAMPOS));

  assert.deepEqual(corpo, {
    ativo: true,
    fallback: 'rodizio_geral',
    regras: [
      {
        id: 'r-site',
        nome: 'Site',
        ativo: true,
        condicoes: [{ campoId: 'f-origem', operador: 'igual', valor: 'site' }],
        destino: { tipo: 'grupo', id: 'g-sp' },
      },
      {
        id: 'r-resto',
        nome: 'Resto',
        ativo: false,
        condicoes: [],
        destino: { tipo: 'usuario', id: 'u-ana' },
      },
    ],
  });
  assert.equal(distribuicaoMudou(valores, CONFIG, CAMPOS), false);
});

test('regra nova vai sem id; reordenar e remover mudam o corpo', () => {
  const valores = valoresDaDistribuicao(CONFIG, CAMPOS);
  const nova = { ...novaRegra('nova-1'), nome: ' Empresas ', destino: 'usuario:u-bia' };
  const proximos = { ...valores, regras: [nova, valores.regras[0]] };
  const { corpo } = /** @type {any} */ (distribuicaoParaEnvio(proximos, CAMPOS));

  assert.deepEqual(corpo.regras[0], {
    nome: 'Empresas',
    ativo: true,
    condicoes: [],
    destino: { tipo: 'usuario', id: 'u-bia' },
  });
  assert.deepEqual(
    corpo.regras.map((regra) => regra.id),
    [undefined, 'r-site'],
  );
  assert.equal(distribuicaoMudou(proximos, CONFIG, CAMPOS), true);
});

test('operador sem valor não manda valor', () => {
  const valores = valoresDaDistribuicao(CONFIG, CAMPOS);
  valores.regras[0].condicoes = [{ campoId: 'f-empresa', operador: 'vazio', valor: null }];
  const { corpo } = /** @type {any} */ (distribuicaoParaEnvio(valores, CAMPOS));

  assert.deepEqual(corpo.regras[0].condicoes, [{ campoId: 'f-empresa', operador: 'vazio' }]);
});

test('validação: nome, destino, condição incompleta e limite de condições', () => {
  const regra = { ...novaRegra('nova-1'), condicoes: [{ campoId: '', operador: '', valor: null }] };
  const erros = validarRegraDistribuicao(regra, CAMPOS);

  assert.equal(erros.nome, MENSAGENS_DISTRIBUICAO.NOME);
  assert.equal(erros.destino, MENSAGENS_DISTRIBUICAO.DESTINO);
  assert.ok(erros['condicoes.0']);

  const muitas = Array.from({ length: 11 }, () => ({
    campoId: 'f-empresa',
    operador: 'nao_vazio',
    valor: null,
  }));
  assert.equal(
    validarRegraDistribuicao(
      { ...regra, nome: 'X', destino: 'usuario:u', condicoes: muitas },
      CAMPOS,
    ).condicoes,
    MENSAGENS_DISTRIBUICAO.MAX_CONDICOES,
  );

  const resultado = /** @type {any} */ (
    distribuicaoParaEnvio({ ativo: true, fallback: 'rodizio_geral', regras: [regra] }, CAMPOS)
  );
  assert.deepEqual(Object.keys(resultado.erros), ['nova-1']);
});

test('limite de 50 regras', () => {
  const regras = Array.from({ length: 50 }, (_, indice) => novaRegra(`n-${indice}`));
  assert.equal(podeAdicionarRegra({ ativo: true, fallback: 'rodizio_geral', regras }), false);
  assert.equal(
    podeAdicionarRegra({ ativo: true, fallback: 'rodizio_geral', regras: regras.slice(1) }),
    true,
  );
});

test('400 do PUT: o índice enviado acha a regra mesmo depois de reordenar', () => {
  const enviadas = ['r-site', 'nova-1', 'r-resto'];
  const { porRegra, outros } = errosDoPut(
    {
      'regras.1.condicoes.0': ['Escolha um campo ativo para a condição'],
      'regras.2.destino': ['Grupo não encontrado'],
      'regras.0': ['Regra inválida'],
      regras: ['Use no máximo 50 regras'],
    },
    enviadas,
  );

  assert.deepEqual(porRegra, {
    'nova-1': { 'condicoes.0': 'Escolha um campo ativo para a condição' },
    'r-resto': { destino: 'Grupo não encontrado' },
    'r-site': { regra: 'Regra inválida' },
  });
  assert.deepEqual(outros, ['Use no máximo 50 regras']);
});

test('frase: condições, "Todos os leads" e o destino', () => {
  const [site, resto] = valoresDaDistribuicao(CONFIG, CAMPOS).regras;
  const nomePorId = new Map([['u-ana', 'Ana']]);

  assert.equal(descreverCondicoes(site, CAMPOS), 'Origem é Site');
  assert.equal(descreverCondicoes(resto, CAMPOS), 'Todos os leads');
  assert.equal(nomeDoDestino(site.destino, nomePorId, CONFIG.grupos), 'Grupo Vendas SP');
  assert.equal(nomeDoDestino(resto.destino, nomePorId, CONFIG.grupos), 'Ana');
  assert.equal(nomeDoDestino('usuario:u-x', nomePorId, CONFIG.grupos), 'Usuário inativo');
  assert.equal(nomeDoDestino('', nomePorId, CONFIG.grupos), 'Sem destino');
});

test('destino do select e chave da config sem os grupos', () => {
  assert.deepEqual(destinoDoSelect('grupo:g-1'), { tipo: 'grupo', id: 'g-1' });
  assert.equal(destinoDoSelect('outro:1'), null);
  assert.equal(destinoDoSelect(''), null);
  assert.equal(chaveDaConfig(CONFIG), chaveDaConfig({ ...CONFIG, grupos: [] }));
});
