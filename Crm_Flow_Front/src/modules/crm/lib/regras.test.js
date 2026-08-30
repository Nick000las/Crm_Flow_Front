import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import {
  MENSAGENS_REGRA,
  avaliarNoForm,
  avaliarRegras,
  camposComRegras,
  categoriaDoStatus,
  descreverRegra,
  leadParaAvaliar,
  payloadDaRegra,
  validarRegra,
  valoresDaRegra,
} from './regras.js';

// Cópia de `Back/src/modules/nucleo/crm/testing/regras.casos.json`: front e
// back rodam os mesmos casos (checklist do M8). Mudou lá, copie de novo.
const { casos } = JSON.parse(
  readFileSync(new URL('./regras.casos.json', import.meta.url), 'utf-8'),
);

describe('casos compartilhados com o back (regras.casos.json)', () => {
  for (const caso of casos) {
    test(caso.nome, () => {
      assert.deepEqual(avaliarRegras(caso.regras, caso.lead, caso.contexto), caso.esperado);
    });
  }
});

const STATUS = {
  id: 'f-status',
  chave: 'status',
  label: 'Status',
  tipo: 'selecao',
  camada: 1,
  coluna: 'status',
  opcoes: ['novo', 'proposta', 'perdido'],
  opcoesLista: [
    { key: 'novo', label: 'Novo', color: null, category: 'aberto', ativo: true },
    { key: 'proposta', label: 'Proposta', color: null, category: 'aberto', ativo: true },
    { key: 'perdido', label: 'Perdido', color: null, category: 'perdido', ativo: true },
  ],
};
const ORIGEM = {
  id: 'f-origem',
  chave: 'fonteLead',
  label: 'Origem',
  tipo: 'selecao',
  camada: 1,
  coluna: 'fonte_lead',
  opcoes: ['evento'],
  opcoesLista: [{ key: 'evento', label: 'Evento', color: null, category: null, ativo: true }],
};
const EMPRESA = {
  id: 'f-empresa',
  chave: 'empresa',
  label: 'Empresa',
  tipo: 'texto',
  camada: 2,
  coluna: 'empresa',
};
const PORTE = { id: 'f-porte', chave: 'porte', label: 'Porte', tipo: 'numero', camada: 3 };
const TAGS = {
  id: 'f-tags',
  chave: 'tags',
  label: 'Tags',
  tipo: 'selecao_multipla',
  camada: 1,
  coluna: 'tags',
  opcoes: null,
  opcoesLista: [{ key: 'vip', label: 'VIP', color: null, category: null, ativo: true }],
};
const CAMPOS = [STATUS, ORIGEM, EMPRESA, PORTE, TAGS];

test('categoriaDoStatus pela opcoesLista do Status', () => {
  assert.equal(categoriaDoStatus(CAMPOS, 'perdido'), 'perdido');
  assert.equal(categoriaDoStatus(CAMPOS, 'proposta'), 'aberto');
  assert.equal(categoriaDoStatus(CAMPOS, 'sumiu'), null);
  assert.equal(categoriaDoStatus(CAMPOS, null), null);
});

test('leadParaAvaliar: o atual coberto pelo form, no formato da API', () => {
  const atual = {
    status: 'novo',
    fonte_lead: 'evento',
    empresa: 'ACME',
    custom_fields: { porte: 10 },
  };
  // O form (contexto de criação/ficha) só tem Status, Porte e Tags.
  const lead = leadParaAvaliar(CAMPOS, atual, [STATUS, PORTE, TAGS], {
    status: 'perdido',
    'custom.porte': '',
    tags: ['vip', 'nova'],
  });

  assert.deepEqual(lead, {
    status: 'perdido',
    fonteLead: 'evento',
    empresa: 'ACME',
    tags: ['vip', 'nova'],
    customFields: { porte: null },
  });
  assert.deepEqual(leadParaAvaliar(CAMPOS, undefined, [EMPRESA], { empresa: ' X ' }), {
    empresa: 'X',
    customFields: {},
  });
});

const POR_STATUS = {
  id: 'r1',
  kind: 'required_from_status',
  ativo: true,
  sistema: true,
  alvo: {
    id: 'f-motivo',
    chave: 'motivoPerda',
    label: 'Motivo da perda',
    tipo: 'selecao',
    camada: 2,
  },
  condicao: { status: ['proposta'], categorias: ['perdido'] },
  efeito: { obrigatorio: true },
};
const CONDICIONAL = {
  id: 'r2',
  kind: 'conditional',
  ativo: true,
  sistema: false,
  alvo: { id: 'f-empresa', chave: 'empresa', label: 'Empresa', tipo: 'texto', camada: 2 },
  condicao: {
    campo: { id: 'f-origem', chave: 'fonteLead', label: 'Origem', tipo: 'selecao', camada: 1 },
    operador: 'igual',
    valor: 'evento',
  },
  efeito: { obrigatorio: true, visivel: true },
};

test('descreverRegra', () => {
  assert.equal(
    descreverRegra(POR_STATUS, CAMPOS),
    'Obrigatório quando o status é Proposta ou um status perdido',
  );
  assert.equal(
    descreverRegra(CONDICIONAL, CAMPOS),
    'Obrigatório e só aparece quando Origem é Evento',
  );
  assert.equal(
    descreverRegra({ ...CONDICIONAL, efeito: { visivel: true } }, CAMPOS),
    'Só aparece quando Origem é Evento',
  );
});

test('form da regra por status: validar e montar', () => {
  const nova = valoresDaRegra(null, CAMPOS);

  assert.deepEqual(validarRegra(nova, CAMPOS), {
    campoId: MENSAGENS_REGRA.CAMPO,
    condicao: MENSAGENS_REGRA.STATUS,
  });
  assert.deepEqual(
    payloadDaRegra({ ...nova, campoId: 'f-empresa', categorias: ['perdido'] }, CAMPOS),
    {
      kind: 'required_from_status',
      campoId: 'f-empresa',
      condicao: { categorias: ['perdido'] },
    },
  );
});

test('form da regra condicional: valor no formato do filtro e efeito obrigatório', () => {
  const valores = {
    ...valoresDaRegra(null, CAMPOS, 'conditional'),
    campoId: 'f-empresa',
    condicao: { campoId: 'f-porte', operador: 'entre', valor: { de: '10', ate: '' } },
    obrigatorio: false,
    visivel: false,
  };

  assert.deepEqual(validarRegra(valores, CAMPOS), { efeito: MENSAGENS_REGRA.EFEITO });
  assert.deepEqual(
    validarRegra({ ...valores, condicao: { ...valores.condicao, campoId: 'f-empresa' } }, CAMPOS),
    {
      'condicao.campoId': MENSAGENS_REGRA.MESMO_CAMPO,
      efeito: MENSAGENS_REGRA.EFEITO,
    },
  );
  assert.deepEqual(payloadDaRegra({ ...valores, visivel: true }, CAMPOS), {
    kind: 'conditional',
    campoId: 'f-empresa',
    condicao: { campoId: 'f-porte', operador: 'entre', valor: { de: 10 } },
    efeito: { obrigatorio: false, visivel: true },
  });
});

test('edição: volta da regra e manda só o que mudou', () => {
  const valores = valoresDaRegra(CONDICIONAL, CAMPOS);

  assert.deepEqual(valores.condicao, { campoId: 'f-origem', operador: 'igual', valor: 'evento' });
  assert.equal(payloadDaRegra(valores, CAMPOS, CONDICIONAL), null);
  assert.deepEqual(payloadDaRegra({ ...valores, visivel: false }, CAMPOS, CONDICIONAL), {
    efeito: { obrigatorio: true, visivel: false },
  });
});

test('avaliarNoForm usa o status do form para a categoria', () => {
  const avaliacao = avaliarNoForm([POR_STATUS, CONDICIONAL], CAMPOS, undefined, [STATUS, ORIGEM], {
    status: 'perdido',
    fonteLead: '',
  });

  assert.deepEqual(avaliacao, { obrigatorios: ['motivoPerda'], ocultos: ['empresa'] });
});

test('camposComRegras esconde os ocultos e marca os obrigatórios', () => {
  const campos = camposComRegras([STATUS, EMPRESA, PORTE], {
    obrigatorios: ['porte'],
    ocultos: ['empresa'],
  });

  assert.deepEqual(
    campos.map((campo) => [campo.chave, Boolean(campo.obrigatorio)]),
    [
      ['status', false],
      ['porte', true],
    ],
  );
});
