import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  FILTRO_VAZIO,
  MENSAGENS_FILTRO,
  chavesComErro,
  chipsDoFiltro,
  contarFiltros,
  descreverItem,
  filtroDoRascunho,
  lerFiltro,
  novaLinha,
  paraCorpoDeBusca,
  rascunhoDoFiltro,
  serializarFiltro,
  trocarCampo,
  trocarOperador,
} from './filtro.js';

const campos = [
  { chave: 'email', label: 'E-mail', tipo: 'texto', camada: 1 },
  { chave: 'status', label: 'Status', tipo: 'selecao', camada: 1, opcoes: ['novo', 'ganho'] },
  { chave: 'renda', label: 'Renda', tipo: 'numero', camada: 3 },
  { chave: 'aniversario', label: 'Aniversário', tipo: 'data', camada: 3 },
  { chave: 'vip', label: 'VIP', tipo: 'booleano', camada: 3 },
];
const porChave = (chave) => campos.find((campo) => campo.chave === chave);

describe('URL e contagem', () => {
  test('filtro vazio não vai para a URL', () => {
    assert.equal(serializarFiltro(FILTRO_VAZIO), null);
  });

  test('ida e volta pela URL preserva o filtro', () => {
    const filtro = {
      filtros: [{ chave: 'status', operador: 'e_um_dos', valor: ['novo'] }],
      valorMin: 10,
      criadoAte: '2026-10-14',
    };

    assert.deepEqual(lerFiltro(serializarFiltro(filtro)), filtro);
  });

  test('lerFiltro descarta lixo', () => {
    assert.deepEqual(lerFiltro('{quebrado'), FILTRO_VAZIO);
    assert.deepEqual(
      lerFiltro({
        filtros: [{ chave: 'x', operador: 'hackear' }, { chave: 'email', operador: 'vazio', valor: 1 }],
        valorMin: 'muito',
        criadoDe: 'ontem',
      }),
      { filtros: [{ chave: 'email', operador: 'vazio' }] },
    );
  });

  test('contarFiltros agrupa faixas fixas', () => {
    assert.equal(
      contarFiltros({
        filtros: [{ chave: 'email', operador: 'vazio' }],
        valorMin: 1,
        valorMax: 2,
        criadoDe: '2026-01-01',
        usuarioResponsavelId: 'u1',
      }),
      4,
    );
  });

  test('criadoAte cobre o dia inteiro na busca', () => {
    assert.equal(
      paraCorpoDeBusca({ filtros: [], criadoAte: '2026-10-14' }).criadoAte,
      '2026-10-14T23:59:59.999',
    );
  });
});

describe('linhas do construtor', () => {
  test('nova linha usa o primeiro operador do tipo', () => {
    const linha = novaLinha(porChave('renda'));

    assert.equal(linha.operador, 'igual');
    assert.equal(linha.valor, '');
  });

  test('trocar para "entre" muda o formato do valor', () => {
    const linha = { ...novaLinha(porChave('renda')), valor: '10' };

    assert.deepEqual(trocarOperador(linha, 'entre', porChave('renda')).valor, { de: '', ate: '' });
  });

  test('trocar entre operadores de mesmo formato mantém o valor', () => {
    const linha = { ...novaLinha(porChave('email')), valor: 'ana' };

    assert.equal(trocarOperador(linha, 'contem', porChave('email')).valor, 'ana');
  });

  test('trocar o campo reinicia a linha mantendo o id', () => {
    const linha = novaLinha(porChave('email'));
    const trocada = trocarCampo(linha, porChave('vip'));

    assert.equal(trocada.id, linha.id);
    assert.equal(trocada.chave, 'vip');
    assert.equal(trocada.valor, 'true');
  });
});

describe('filtroDoRascunho', () => {
  const rascunho = (linhas, fixos = {}) => ({
    linhas,
    fixos: { usuarioResponsavelId: '', valorMin: '', valorMax: '', criadoDe: '', criadoAte: '', ...fixos },
  });

  test('converte cada tipo para o contrato do back', () => {
    const { filtro } = filtroDoRascunho(
      rascunho(
        [
          { id: 'a', chave: 'renda', operador: 'entre', valor: { de: '1.000', ate: '' } },
          { id: 'b', chave: 'vip', operador: 'igual', valor: 'false' },
          { id: 'c', chave: 'status', operador: 'e_um_dos', valor: ['novo'] },
          { id: 'd', chave: 'email', operador: 'nao_vazio', valor: null },
          { id: 'e', chave: 'email', operador: 'contem', valor: ' @x ' },
        ],
        { valorMax: '5000,5', usuarioResponsavelId: 'u1' },
      ),
      campos,
    );

    assert.deepEqual(filtro, {
      filtros: [
        { chave: 'renda', operador: 'entre', valor: { de: 1000 } },
        { chave: 'vip', operador: 'igual', valor: false },
        { chave: 'status', operador: 'e_um_dos', valor: ['novo'] },
        { chave: 'email', operador: 'nao_vazio' },
        { chave: 'email', operador: 'contem', valor: '@x' },
      ],
      usuarioResponsavelId: 'u1',
      valorMax: 5000.5,
    });
  });

  test('aponta o erro de cada linha e não aplica nada', () => {
    const { erros, filtro } = filtroDoRascunho(
      rascunho(
        [
          { id: 'a', chave: 'renda', operador: 'entre', valor: { de: '', ate: '' } },
          { id: 'b', chave: 'status', operador: 'e_um_dos', valor: [] },
          { id: 'c', chave: 'renda', operador: 'igual', valor: 'abc' },
          { id: 'd', chave: 'email', operador: 'igual', valor: '  ' },
        ],
        { valorMin: 'x' },
      ),
      campos,
    );

    assert.equal(filtro, undefined);
    assert.deepEqual(erros, {
      a: MENSAGENS_FILTRO.LIMITE,
      b: MENSAGENS_FILTRO.LISTA,
      c: MENSAGENS_FILTRO.NUMERO,
      d: MENSAGENS_FILTRO.VALOR,
      valorMin: MENSAGENS_FILTRO.NUMERO,
    });
  });

  test('linha de campo que deixou de existir é descartada', () => {
    const { filtro } = filtroDoRascunho(
      rascunho([{ id: 'a', chave: 'sumiu', operador: 'vazio', valor: null }]),
      campos,
    );

    assert.deepEqual(filtro, FILTRO_VAZIO);
  });

  test('rascunho do filtro aplicado volta ao mesmo filtro', () => {
    const aplicado = {
      filtros: [
        { chave: 'renda', operador: 'entre', valor: { de: 1000.5, ate: 2000 } },
        { chave: 'aniversario', operador: 'igual', valor: '2026-01-01' },
      ],
      valorMin: 10,
    };

    assert.deepEqual(filtroDoRascunho(rascunhoDoFiltro(aplicado, campos), campos).filtro, aplicado);
  });
});

describe('chips', () => {
  test('descreve cada operador de forma legível', () => {
    assert.equal(
      descreverItem({ chave: 'status', operador: 'e_um_dos', valor: ['novo', 'ganho'] }, porChave('status')),
      'Status é um de Novo, Ganho',
    );
    assert.equal(
      descreverItem({ chave: 'renda', operador: 'entre', valor: { de: 1000, ate: 5000 } }, porChave('renda')),
      'Renda de 1.000 a 5.000',
    );
    assert.equal(descreverItem({ chave: 'email', operador: 'vazio' }, porChave('email')), 'E-mail está vazio');
    assert.equal(descreverItem({ chave: 'vip', operador: 'igual', valor: true }, porChave('vip')), 'VIP é Sim');
  });

  test('campo desligado ainda vira chip, pela chave', () => {
    assert.equal(descreverItem({ chave: 'sumiu', operador: 'vazio' }, undefined), 'sumiu está vazio');
  });

  test('cada chip remove só a si mesmo', () => {
    const filtro = {
      filtros: [
        { chave: 'email', operador: 'vazio' },
        { chave: 'vip', operador: 'igual', valor: true },
      ],
      valorMin: 1,
      usuarioResponsavelId: 'u1',
    };
    const chips = chipsDoFiltro(filtro, campos, new Map([['u1', 'Ana']]));

    assert.deepEqual(chips.map((chip) => chip.id), ['filtro-0', 'filtro-1', 'responsavel', 'valor']);
    assert.equal(chips[2].texto, 'Responsável é Ana');
    assert.deepEqual(chips[0].remover().filtros, [{ chave: 'vip', operador: 'igual', valor: true }]);
    assert.equal(chips[3].remover().valorMin, undefined);
    assert.equal(chips[3].remover().usuarioResponsavelId, 'u1');
  });

  test('chavesComErro lê fields de filtro do back', () => {
    assert.deepEqual(
      [...chavesComErro({ 'filtros.renda': ['x'], nome: ['y'] })],
      ['renda'],
    );
  });
});
