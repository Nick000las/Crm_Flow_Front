import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  MOTIVOS,
  bloqueios,
  parcialDeVisibilidade,
  parcialDoNome,
  substituirCampo,
} from './configuracoes-campos.js';
import { moverPara, ordenarPorIds } from './ordem.js';

const todasAsTelas = { create_form: true, detail: true, table: true, filter: true };

const campo = (overrides = {}) => ({
  id: 'f1',
  chave: 'empresa',
  systemKey: 'empresa',
  camada: 2,
  label: 'Empresa',
  labelPadrao: 'Empresa',
  tipo: 'texto',
  opcoes: null,
  obrigatorio: false,
  ordem: 1,
  visibilidade: todasAsTelas,
  capacidades: { canHide: true, canMakeOptional: true, canRename: true },
  ...overrides,
});

describe('bloqueios', () => {
  test('campo livre: nada travado', () => {
    const { visibilidade, obrigatorio, renomear } = bloqueios(campo());

    assert.deepEqual(Object.values(visibilidade), [null, null, null, null]);
    assert.equal(obrigatorio, null);
    assert.equal(renomear, null);
  });

  test('sem canHide, os quatro contextos travam', () => {
    const { visibilidade } = bloqueios(
      campo({ capacidades: { canHide: false, canMakeOptional: false, canRename: true } }),
    );

    assert.deepEqual(Object.values(visibilidade), Array(4).fill(MOTIVOS.ESSENCIAL));
  });

  test('obrigatório trava só Criação', () => {
    const { visibilidade } = bloqueios(campo({ obrigatorio: true }));

    assert.equal(visibilidade.create_form, MOTIVOS.OBRIGATORIO_NA_CRIACAO);
    assert.equal(visibilidade.table, null);
  });

  test('obrigatoriedade fixa e Criação desligada travam "Obrigatório"', () => {
    assert.equal(
      bloqueios(
        campo({ capacidades: { canHide: false, canMakeOptional: false, canRename: false } }),
      ).obrigatorio,
      MOTIVOS.OBRIGATORIEDADE_FIXA,
    );
    assert.equal(
      bloqueios(campo({ visibilidade: { ...todasAsTelas, create_form: false } })).obrigatorio,
      MOTIVOS.LIGUE_CRIACAO,
    );
  });

  test('sem canRename, renomear trava', () => {
    assert.equal(
      bloqueios(campo({ capacidades: { canHide: true, canMakeOptional: true, canRename: false } }))
        .renomear,
      MOTIVOS.NAO_RENOMEIA,
    );
  });
});

describe('corpos do PUT', () => {
  test('checkbox da matriz manda só o contexto', () => {
    assert.deepEqual(parcialDeVisibilidade('table', false), { visibilidade: { table: false } });
  });

  test('renomear: igual não envia; o nome padrão restaura; o resto vai aparado', () => {
    const renomeado = campo({ label: 'Companhia' });

    assert.equal(parcialDoNome(renomeado, ' Companhia '), null);
    assert.deepEqual(parcialDoNome(renomeado, 'Empresa'), { label: null });
    assert.deepEqual(parcialDoNome(renomeado, ' Razão social '), { label: 'Razão social' });
    assert.deepEqual(parcialDoNome(campo({ labelPadrao: null, label: 'Renda' }), 'Salário'), {
      label: 'Salário',
    });
  });
});

describe('ordem', () => {
  test('moverPara leva o item ao destino e ignora fora da lista', () => {
    assert.deepEqual(moverPara(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd']);
    assert.deepEqual(moverPara(['a', 'b', 'c'], 2, 0), ['c', 'a', 'b']);

    const itens = ['a', 'b'];
    assert.equal(moverPara(itens, 0, -1), itens);
    assert.equal(moverPara(itens, 1, 1), itens);
  });

  test('ordenarPorIds e substituirCampo montam o estado otimista', () => {
    const lista = [campo({ id: 'a' }), campo({ id: 'b' })];

    assert.deepEqual(
      ordenarPorIds(lista, ['b', 'a']).map((item) => item.id),
      ['b', 'a'],
    );
    assert.equal(substituirCampo(lista, campo({ id: 'b', label: 'Nova' }))[1].label, 'Nova');
  });
});
