import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  FILTRO_VAZIO,
  MENSAGENS_FILTRO,
  RESPONSAVEL_NENHUM,
  chavesComErro,
  chavesForaDosCampos,
  chipsDoFiltro,
  contarFiltros,
  descreverItem,
  filtroDoRascunho,
  filtroSemChaves,
  lerFiltro,
  novaLinha,
  operadoresDoCampo,
  paraCorpoDeBusca,
  rascunhoDoFiltro,
  serializarFiltro,
  tipoBase,
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

describe('tipos do M2', () => {
  const ticket = { chave: 'ticket', label: 'Ticket', tipo: 'monetario', camada: 3 };
  const notas = { chave: 'notas', label: 'Notas', tipo: 'texto_longo', camada: 3 };

  test('tipoBase agrupa os tipos novos na família de input', () => {
    assert.equal(tipoBase('monetario'), 'numero');
    assert.equal(tipoBase('telefone'), 'texto');
    assert.equal(tipoBase('url'), 'texto');
    assert.equal(tipoBase('data'), 'data');
  });

  test('operadores vêm do tipo real', () => {
    assert.deepEqual(operadoresDoCampo(notas), ['contem', 'vazio', 'nao_vazio']);
    assert.deepEqual(operadoresDoCampo(ticket), ['igual', 'entre', 'vazio', 'nao_vazio']);
  });

  test('monetário é lido como número e descrito em BRL', () => {
    const { filtro } = filtroDoRascunho(
      {
        linhas: [{ id: 'a', chave: 'ticket', operador: 'entre', valor: { de: '1.500,50', ate: '' } }],
        fixos: { usuarioResponsavelId: '', valorMin: '', valorMax: '', criadoDe: '', criadoAte: '' },
      },
      [ticket],
    );

    assert.deepEqual(filtro.filtros, [{ chave: 'ticket', operador: 'entre', valor: { de: 1500.5 } }]);
    assert.match(descreverItem(filtro.filtros[0], ticket), /^Ticket a partir de R\$\s1\.500,50$/);
  });
});

describe('esfriando (crm.inatividade)', () => {
  test('lerFiltro aceita só esfriando: true', () => {
    assert.equal(lerFiltro({ filtros: [], esfriando: true }).esfriando, true);
    assert.equal('esfriando' in lerFiltro({ filtros: [], esfriando: false }), false);
    assert.equal('esfriando' in lerFiltro({ filtros: [], esfriando: 'sim' }), false);
  });

  test('conta, vai para a URL e para o corpo da busca', () => {
    const filtro = lerFiltro({ filtros: [], esfriando: true });

    assert.equal(contarFiltros(filtro), 1);
    assert.deepEqual(lerFiltro(serializarFiltro(filtro)), filtro);
    assert.equal(paraCorpoDeBusca(filtro).esfriando, true);
  });

  test('vira chip removível', () => {
    const filtro = lerFiltro({ filtros: [], esfriando: true, valorMin: 5 });
    const chip = chipsDoFiltro(filtro, campos, new Map()).find((item) => item.id === 'esfriando');

    assert.equal(chip.texto, 'Esfriando');
    assert.deepEqual(chip.remover(), { filtros: [], valorMin: 5 });
  });

  test('atravessa o rascunho: Aplicar no construtor não perde o esfriando', () => {
    const filtro = lerFiltro({ filtros: [], esfriando: true });
    const { filtro: aplicado } = filtroDoRascunho(rascunhoDoFiltro(filtro, campos), campos);

    assert.equal(aplicado.esfriando, true);
  });
});

describe('semResponsavel', () => {
  test('lerFiltro aceita só true, e nunca junto com usuarioResponsavelId', () => {
    assert.equal(lerFiltro({ filtros: [], semResponsavel: true }).semResponsavel, true);
    assert.equal('semResponsavel' in lerFiltro({ filtros: [], semResponsavel: 'sim' }), false);

    const ambos = lerFiltro({ filtros: [], semResponsavel: true, usuarioResponsavelId: 'u1' });
    assert.equal(ambos.usuarioResponsavelId, 'u1');
    assert.equal('semResponsavel' in ambos, false);
  });

  test('conta como o filtro de responsável e vira chip removível', () => {
    const filtro = lerFiltro({ filtros: [], esfriando: true, semResponsavel: true });
    const chip = chipsDoFiltro(filtro, campos, new Map()).find((item) => item.id === 'sem-responsavel');

    assert.equal(contarFiltros(filtro), 2);
    assert.equal(paraCorpoDeBusca(filtro).semResponsavel, true);
    assert.equal(chip.texto, 'Sem responsável');
    assert.deepEqual(chip.remover(), { filtros: [], esfriando: true });
  });

  test('no rascunho é uma opção do select Responsável', () => {
    const filtro = lerFiltro({ filtros: [], semResponsavel: true });
    const rascunho = rascunhoDoFiltro(filtro, campos);

    assert.equal(rascunho.fixos.usuarioResponsavelId, RESPONSAVEL_NENHUM);
    assert.deepEqual(filtroDoRascunho(rascunho, campos).filtro, filtro);

    const trocado = { ...rascunho, fixos: { ...rascunho.fixos, usuarioResponsavelId: 'u1' } };
    assert.deepEqual(filtroDoRascunho(trocado, campos).filtro, { filtros: [], usuarioResponsavelId: 'u1' });
  });
});

describe('tipos do M11 no filtro', () => {
  const cnpj = { chave: 'cnpj', label: 'CNPJ', tipo: 'cnpj', camada: 2 };
  const dono = { chave: 'dono', label: 'Dono', tipo: 'usuario', camada: 3 };
  const viagem = { chave: 'viagem', label: 'Viagem', tipo: 'intervalo_datas', camada: 3 };

  test('operadores do back', () => {
    assert.deepEqual(operadoresDoCampo(dono), ['igual', 'e_um_dos', 'vazio', 'nao_vazio']);
    assert.deepEqual(operadoresDoCampo(viagem), ['entre', 'vazio', 'nao_vazio']);
    assert.equal(tipoBase('intervalo_datas'), 'data');
    assert.equal(tipoBase('cnpj'), 'texto');
  });

  test('chips: documento mascarado, usuário pelo nome, período em datas', () => {
    const nomes = new Map([['u1', 'Bia']]);

    assert.equal(
      descreverItem({ chave: 'cnpj', operador: 'igual', valor: '12345678000190' }, cnpj),
      'CNPJ é 12.345.678/0001-90',
    );
    assert.equal(descreverItem({ chave: 'dono', operador: 'e_um_dos', valor: ['u1'] }, dono, nomes), 'Dono é um de Bia');
    assert.equal(
      descreverItem({ chave: 'viagem', operador: 'entre', valor: { de: '2026-02-01', ate: '2026-02-10' } }, viagem),
      'Viagem de 01/02/2026 a 10/02/2026',
    );
  });
});

test('filtro por campo oculto: acha a chave e tira do filtro e do rascunho', () => {
  const campos = [{ chave: 'status', label: 'Status', tipo: 'texto', camada: 1 }];
  const fields = { 'filtros.renda': ['"renda" não é um campo ativo para filtro'], 'filtros.status': ['x'] };
  const filtro = {
    filtros: [
      { chave: 'status', operador: 'contem', valor: 'a' },
      { chave: 'renda', operador: 'vazio' },
    ],
  };

  assert.deepEqual(chavesForaDosCampos(fields, campos), ['renda']);
  assert.deepEqual(filtroSemChaves(filtro, ['renda']).filtros, [{ chave: 'status', operador: 'contem', valor: 'a' }]);
  assert.deepEqual(
    rascunhoDoFiltro(filtro, campos).linhas.map((linha) => linha.chave),
    ['status'],
  );
});

describe('faixaScore (crm.score)', () => {
  test('lerFiltro aceita a chave da faixa; conta, vira chip e atravessa o rascunho', () => {
    const filtro = lerFiltro({ filtros: [], faixaScore: 'quente' });
    assert.equal(filtro.faixaScore, 'quente');
    assert.equal(lerFiltro({ filtros: [], faixaScore: '' }).faixaScore, undefined);
    assert.equal(lerFiltro({ filtros: [], faixaScore: 3 }).faixaScore, undefined);
    assert.equal(contarFiltros(filtro), 1);

    const [chip] = chipsDoFiltro(filtro, [], new Map(), [{ chave: 'quente', rotulo: 'Quente' }]);
    assert.equal(chip.texto, 'Score: Quente');
    assert.equal(chip.remover().faixaScore, undefined);
    assert.equal(chipsDoFiltro(filtro, [], new Map())[0].texto, 'Score: quente');

    assert.deepEqual(filtroDoRascunho(rascunhoDoFiltro(filtro, []), []).filtro, filtro);
  });
});

test('faixa de score apagada (filtros.faixaScore): destaca o chip, não vira "campo oculto"', () => {
  const fields = { 'filtros.faixaScore': ['"x" não é uma faixa de score'] };
  const [chip] = chipsDoFiltro({ filtros: [], faixaScore: 'x' }, [], new Map());

  assert.equal(chavesComErro(fields).has(chip.chave), true);
  assert.deepEqual(chavesForaDosCampos(fields, []), []);
});
