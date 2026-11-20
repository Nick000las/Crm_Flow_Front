import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError } from '../../../services/api-error.js';
import { FORECAST } from '../constants.js';
import {
  CONSULTA_PADRAO,
  MENSAGENS_PERIODO,
  chaveDaSelecao,
  erroDoForecast,
  escreverConsulta,
  lerConsulta,
  listaDeAbertas,
  mesesEntre,
  opcoesDeAgrupar,
  paramsDaLista,
  paramsDoForecast,
  pipelinesDoForecast,
  podeAtualizarData,
  resumoDaAcao,
  tipoDoMes,
  tiposDaLista,
  validarPeriodo,
  veCampoStatus,
} from './forecast.js';

const url = (texto) => new URLSearchParams(texto);

const DATA_EDITAVEL = { chave: 'dataPrevistaFechamento', camada: 2 };
const DATA_SO_VER = { chave: 'dataPrevistaFechamento', camada: 2, acesso: 'view' };

test('URL vazia dá a consulta padrão', () => {
  assert.deepEqual(lerConsulta(url('')), CONSULTA_PADRAO);
  assert.equal(escreverConsulta(url(''), {}).toString(), '');
});

test('ida e volta pela URL mantém a consulta', () => {
  const consulta = {
    de: '2026-08',
    ate: '2027-02',
    pipelineId: 'p1',
    responsavelId: 'u1',
    agrupar: 'status',
    lista: { mes: '2026-11', tipo: 'aberto' },
    pagina: 3,
    tamanho: 100,
  };
  const escrita = escreverConsulta(url(''), consulta);
  assert.deepEqual(lerConsulta(escrita), consulta);
  assert.equal(escrita.get('pipeline'), 'p1');
  assert.equal(escrita.get('responsavel'), 'u1');

  const comBloco = escreverConsulta(url(''), { lista: { bloco: 'semPrevisao' } });
  assert.equal(comBloco.toString(), 'bloco=semPrevisao');
  assert.deepEqual(lerConsulta(comBloco).lista, { bloco: 'semPrevisao' });
});

test('omite agrupar total, página 1 e o tamanho padrão', () => {
  const escrita = escreverConsulta(url(''), {
    agrupar: 'total',
    pagina: 1,
    tamanho: FORECAST.TAMANHO_PADRAO,
  });
  assert.equal(escrita.toString(), '');
});

test('mantém params que não são do forecast', () => {
  const escrita = escreverConsulta(url('aba=x&de=2026-01'), { ate: '2026-03' });
  assert.equal(escrita.get('aba'), 'x');
  assert.equal(escrita.get('de'), '2026-01');
  assert.equal(escrita.get('ate'), '2026-03');
});

test('valores inválidos caem fora', () => {
  const consulta = lerConsulta(
    url('de=2026-13&ate=26-01&agrupar=semana&pagina=0&tamanho=30&mes=2026-11&tipo=talvez'),
  );
  assert.equal(consulta.de, null);
  assert.equal(consulta.ate, null);
  assert.equal(consulta.agrupar, 'total');
  assert.equal(consulta.pagina, 1);
  assert.equal(consulta.tamanho, FORECAST.TAMANHO_PADRAO);
  assert.equal(consulta.lista, null);

  assert.equal(lerConsulta(url('pagina=-2')).pagina, 1);
  assert.equal(lerConsulta(url('pagina=abc')).pagina, 1);
  assert.equal(lerConsulta(url('mes=2026-11')).lista, null);
  assert.equal(lerConsulta(url('bloco=sem_previsao')).lista, null);
  assert.equal(lerConsulta(url('mes=2026-11&tipo=aberto&bloco=atrasadas')).lista, null);
  assert.equal(lerConsulta(url('tamanho=25')).tamanho, 25);
});

test('agrupar=status sem pipeline vira total', () => {
  assert.equal(lerConsulta(url('agrupar=status')).agrupar, 'total');
  assert.equal(lerConsulta(url('agrupar=status&pipeline=p1')).agrupar, 'status');
  assert.equal(lerConsulta(url('agrupar=responsavel')).agrupar, 'responsavel');

  const semPipeline = escreverConsulta(url('agrupar=status&pipeline=p1'), { pipelineId: null });
  assert.equal(semPipeline.has('agrupar'), false);
  assert.equal(semPipeline.has('pipeline'), false);
});

test('mudar um filtro fecha a lista e volta à página 1', () => {
  const aberta = url('mes=2026-11&tipo=aberto&pagina=3');
  for (const mudanca of [
    { de: '2026-01' },
    { ate: '2026-12' },
    { pipelineId: 'p2' },
    { responsavelId: 'u2' },
    { agrupar: 'responsavel' },
  ]) {
    const consulta = lerConsulta(escreverConsulta(aberta, mudanca));
    assert.equal(consulta.lista, null, JSON.stringify(mudanca));
    assert.equal(consulta.pagina, 1);
  }

  // O mesmo valor de antes não é mudança.
  const igual = lerConsulta(escreverConsulta(url('de=2026-01&bloco=atrasadas'), { de: '2026-01' }));
  assert.deepEqual(igual.lista, { bloco: 'atrasadas' });
});

test('trocar a lista volta à página 1; a página sozinha não mexe na lista', () => {
  const aberta = url('bloco=atrasadas&pagina=4');
  const outra = lerConsulta(escreverConsulta(aberta, { lista: { bloco: 'semPrevisao' } }));
  assert.equal(outra.pagina, 1);

  const pagina = lerConsulta(escreverConsulta(aberta, { pagina: 5 }));
  assert.deepEqual(pagina.lista, { bloco: 'atrasadas' });
  assert.equal(pagina.pagina, 5);

  const tamanho = lerConsulta(escreverConsulta(aberta, { tamanho: 100 }));
  assert.equal(tamanho.pagina, 1);
});

test('paramsDoForecast omite o vazio e o agrupar total', () => {
  assert.deepEqual(paramsDoForecast(CONSULTA_PADRAO), {});
  assert.deepEqual(
    paramsDoForecast({ ...CONSULTA_PADRAO, de: '2026-01', pipelineId: 'p1', agrupar: 'status' }),
    { de: '2026-01', pipelineId: 'p1', agrupar: 'status' },
  );
});

test('paramsDaLista usa o período da URL ou o da resposta', () => {
  assert.equal(paramsDaLista(CONSULTA_PADRAO, { de: '2026-08', ate: '2027-02' }), null);

  const mes = { ...CONSULTA_PADRAO, lista: { mes: '2026-11', tipo: 'realizado' } };
  assert.deepEqual(paramsDaLista(mes, { de: '2026-08', ate: '2027-02' }), {
    mes: '2026-11',
    tipo: 'realizado',
    de: '2026-08',
    ate: '2027-02',
    pagina: 1,
    tamanho: FORECAST.TAMANHO_PADRAO,
  });

  const daUrl = { ...mes, de: '2026-01', ate: '2026-06', pipelineId: 'p1', responsavelId: 'u1' };
  assert.deepEqual(paramsDaLista(daUrl, { de: '2026-08', ate: '2027-02' }), {
    mes: '2026-11',
    tipo: 'realizado',
    de: '2026-01',
    ate: '2026-06',
    pipelineId: 'p1',
    responsavelId: 'u1',
    pagina: 1,
    tamanho: FORECAST.TAMANHO_PADRAO,
  });

  // Sem período em lugar nenhum: o back aplica o padrão.
  assert.equal('de' in paramsDaLista(mes, undefined), false);
});

test('o bloco vai para a rota em snake_case', () => {
  const casos = {
    atrasadas: 'atrasadas',
    antesDoPeriodo: 'antes_do_periodo',
    semPrevisao: 'sem_previsao',
    alemDoHorizonte: 'alem_do_horizonte',
    semValor: 'sem_valor',
  };
  for (const [bloco, naRota] of Object.entries(casos)) {
    const params = paramsDaLista({ ...CONSULTA_PADRAO, lista: { bloco } });
    assert.equal(params.bloco, naRota);
    assert.equal('mes' in params, false);
  }
});

test('chaveDaSelecao ignora página e tamanho, mas não a lista nem os filtros', () => {
  const periodo = { de: '2026-08', ate: '2027-02' };
  const base = { ...CONSULTA_PADRAO, lista: { bloco: 'atrasadas' } };
  const chave = chaveDaSelecao(base, periodo);
  assert.equal(chaveDaSelecao({ ...base, pagina: 3, tamanho: 100 }, periodo), chave);
  assert.notEqual(chaveDaSelecao({ ...base, lista: { bloco: 'semPrevisao' } }, periodo), chave);
  assert.notEqual(chaveDaSelecao({ ...base, pipelineId: 'p1' }, periodo), chave);
  assert.equal(typeof chaveDaSelecao(CONSULTA_PADRAO, periodo), 'string');
});

test('mesesEntre conta inclusive, atravessando o ano', () => {
  assert.equal(mesesEntre('2026-11', '2026-11'), 1);
  assert.equal(mesesEntre('2026-11', '2027-02'), 4);
  assert.equal(mesesEntre('2026-01', '2027-12'), 24);
  assert.equal(mesesEntre('2026-13', '2027-01'), null);
});

test('validarPeriodo: 24 meses passa, 25 não; invertido e formato', () => {
  assert.deepEqual(validarPeriodo('2026-01', '2027-12'), {});
  assert.deepEqual(validarPeriodo('2026-01', '2028-01'), { ate: MENSAGENS_PERIODO.longo });
  assert.equal(MENSAGENS_PERIODO.longo, 'Escolha um período de até 24 meses');
  assert.deepEqual(validarPeriodo('2026-05', '2026-04'), {
    de: 'O mês inicial precisa vir antes do final',
  });
  assert.deepEqual(validarPeriodo('2026-5', '2026-04'), { de: 'Use o formato AAAA-MM' });
  assert.deepEqual(validarPeriodo('2026-05', '2026-00'), { ate: 'Use o formato AAAA-MM' });
  assert.deepEqual(validarPeriodo(null, null), {});
  assert.deepEqual(validarPeriodo('2026-05', null), {});
});

test('tipoDoMes compara com o hoje da resposta, na virada do ano', () => {
  assert.equal(tipoDoMes('2026-12', '2027-01-01'), 'passado');
  assert.equal(tipoDoMes('2027-01', '2027-01-01'), 'atual');
  assert.equal(tipoDoMes('2027-02', '2027-01-31'), 'futuro');
  assert.equal(tipoDoMes('2027-01', '2026-12-31'), 'futuro');
});

test('tiposDaLista: passado realizado, futuro aberto, atual os dois', () => {
  assert.deepEqual(tiposDaLista('2026-10', '2026-11-19'), ['realizado']);
  assert.deepEqual(tiposDaLista('2026-12', '2026-11-19'), ['aberto']);
  assert.deepEqual(tiposDaLista('2026-11', '2026-11-19'), ['realizado', 'aberto']);
});

test('opcoesDeAgrupar: Por status só com pipeline e vendo Status', () => {
  const valores = (contexto) => opcoesDeAgrupar(contexto).map((opcao) => opcao.valor);
  assert.deepEqual(valores({ pipelineId: null, veStatus: true }), ['total', 'responsavel']);
  assert.deepEqual(valores({ pipelineId: 'p1', veStatus: false }), ['total', 'responsavel']);
  assert.deepEqual(valores({ pipelineId: 'p1', veStatus: true }), [
    'total',
    'responsavel',
    'status',
  ]);
  assert.equal(opcoesDeAgrupar({ pipelineId: 'p1', veStatus: true })[2].rotulo, 'Por status');
});

test('veCampoStatus: só o Status do sistema', () => {
  assert.equal(veCampoStatus([{ chave: 'status', camada: 1 }]), true);
  assert.equal(veCampoStatus([{ chave: 'status', camada: 3 }]), false);
  assert.equal(veCampoStatus([]), false);
  assert.equal(veCampoStatus(undefined), false);
});

test('pipelinesDoForecast: só vendas ativos; oculto sai só para o operador', () => {
  const pipelines = [
    { id: 'a', nome: 'Vendas', tipo: 'sales', ativo: true, visivelOperador: true },
    { id: 'b', nome: 'Suporte', tipo: 'service', ativo: true, visivelOperador: true },
    { id: 'c', nome: 'Antigo', tipo: 'sales', ativo: false, visivelOperador: true },
    { id: 'd', nome: 'Oculto', tipo: 'sales', ativo: true, visivelOperador: false },
  ];
  assert.deepEqual(pipelinesDoForecast(pipelines, 'DONO'), [
    { valor: 'a', rotulo: 'Vendas' },
    { valor: 'd', rotulo: 'Oculto' },
  ]);
  assert.deepEqual(pipelinesDoForecast(pipelines, 'OPERADOR'), [{ valor: 'a', rotulo: 'Vendas' }]);
  assert.deepEqual(pipelinesDoForecast(undefined, 'DONO'), []);
});

test('listaDeAbertas: blocos e mês em aberto', () => {
  assert.equal(listaDeAbertas(null), false);
  assert.equal(listaDeAbertas({ bloco: 'semValor' }), true);
  assert.equal(listaDeAbertas({ mes: '2026-11', tipo: 'aberto' }), true);
  assert.equal(listaDeAbertas({ mes: '2026-11', tipo: 'realizado' }), false);
});

test('podeAtualizarData: lista de abertas e data editável, senão esconde', () => {
  const atrasadas = { bloco: 'atrasadas' };
  assert.equal(podeAtualizarData([DATA_EDITAVEL], atrasadas), true);
  assert.equal(podeAtualizarData([DATA_EDITAVEL], { mes: '2026-11', tipo: 'realizado' }), false);
  assert.equal(podeAtualizarData([DATA_SO_VER], atrasadas), false);
  assert.equal(podeAtualizarData([], atrasadas), false);
  assert.equal(podeAtualizarData(undefined, atrasadas), false);
  assert.equal(podeAtualizarData([DATA_EDITAVEL], null), false);
});

test('resumoDaAcao: texto do motivo, nunca o código; nome com fallback', () => {
  const selecionados = [
    { id: 'o1', pessoa: 'Ana' },
    { id: 'o2', pessoa: 'Bruno' },
    { id: 'o3', pessoa: '' },
  ];
  const resumo = resumoDaAcao(
    {
      atualizadas: 1,
      ignoradas: [
        { id: 'o2', motivo: 'NAO_ABERTA' },
        { id: 'o3', motivo: 'VALIDATION_ERROR' },
        { id: 'o9', motivo: 'NAO_ENCONTRADA' },
      ],
    },
    selecionados,
  );
  assert.equal(resumo.atualizadas, 1);
  assert.equal(resumo.texto, '1 atualizada');
  assert.deepEqual(resumo.ignoradas, [
    { id: 'o2', nome: 'Bruno', motivo: 'Já foi encerrada.' },
    { id: 'o3', nome: 'Oportunidade', motivo: 'Não foi possível atualizar.' },
    { id: 'o9', nome: 'Oportunidade', motivo: 'Oportunidade não encontrada.' },
  ]);

  assert.deepEqual(resumoDaAcao({ atualizadas: 2, ignoradas: [] }, selecionados).ignoradas, []);
});

test('erroDoForecast: pipeline 404, filtro 400, o resto null', () => {
  const pipeline = new ApiError('x', { status: 404, code: 'RESOURCE_NOT_FOUND' });
  assert.deepEqual(erroDoForecast(pipeline), {
    tipo: 'pipeline',
    mensagem: 'Pipeline não encontrado',
  });

  const filtro = new ApiError('x', {
    status: 400,
    code: 'VALIDATION_ERROR',
    fields: { agrupar: ['Escolha um pipeline para agrupar por status'] },
  });
  assert.deepEqual(erroDoForecast(filtro), {
    tipo: 'filtro',
    campo: 'agrupar',
    mensagem: 'Escolha um pipeline para agrupar por status',
  });

  const outroCampo = new ApiError('x', { status: 400, fields: { mes: ['m'] } });
  assert.equal(erroDoForecast(outroCampo), null);
  assert.equal(erroDoForecast(new ApiError('x', { status: 500 })), null);
  assert.equal(erroDoForecast(new ApiError('x', { status: 403, code: 'FORBIDDEN' })), null);
  assert.equal(erroDoForecast(null), null);
});
