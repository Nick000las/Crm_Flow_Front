import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ESTADO_LISTA_PADRAO,
  escreverEstadoLista,
  estadoDaVisao,
  lerEstadoLista,
  totalDePaginas,
  visaoDoEstado,
} from './url-state.js';

test('URL vazia dá o estado padrão', () => {
  assert.deepEqual(lerEstadoLista(new URLSearchParams()), ESTADO_LISTA_PADRAO);
});

test('lê busca, página e tamanho', () => {
  const params = new URLSearchParams('q=ana&pagina=3&tamanho=100');

  assert.deepEqual(lerEstadoLista(params), {
    ...ESTADO_LISTA_PADRAO,
    busca: 'ana',
    pagina: 3,
    tamanho: 100,
  });
});

test('valores inválidos caem no padrão', () => {
  const params = new URLSearchParams('pagina=-2&tamanho=7&q=%20%20');

  assert.deepEqual(lerEstadoLista(params), ESTADO_LISTA_PADRAO);
});

test('escrever omite valores padrão', () => {
  const params = escreverEstadoLista(new URLSearchParams('q=ana&pagina=2'), {
    busca: '',
    pagina: 1,
  });

  assert.equal(params.toString(), '');
});

test('escrever preserva parâmetros que não são da lista', () => {
  const params = escreverEstadoLista(new URLSearchParams('job=abc'), { pagina: 2 });

  assert.equal(params.get('job'), 'abc');
  assert.equal(params.get('pagina'), '2');
});

test('totalDePaginas nunca é menor que 1', () => {
  assert.equal(totalDePaginas(0, 50), 1);
  assert.equal(totalDePaginas(101, 50), 3);
});

test('filtro vai e volta pela URL e some quando vazio', () => {
  const filtro = { filtros: [{ chave: 'email', operador: 'vazio' }] };
  const comFiltro = escreverEstadoLista(new URLSearchParams(), { filtro });

  assert.deepEqual(lerEstadoLista(comFiltro).filtro, filtro);
  assert.equal(
    escreverEstadoLista(comFiltro, { filtro: ESTADO_LISTA_PADRAO.filtro }).has('f'),
    false,
  );
});

test('situação vai e volta pela URL, e ativos (o padrão) some', () => {
  const naLixeira = escreverEstadoLista(new URLSearchParams(), { situacao: 'lixeira' });

  assert.equal(naLixeira.toString(), 'situacao=lixeira');
  assert.equal(lerEstadoLista(naLixeira).situacao, 'lixeira');
  assert.equal(escreverEstadoLista(naLixeira, { situacao: 'ativos' }).toString(), '');
  assert.equal(lerEstadoLista(new URLSearchParams('situacao=apagados')).situacao, 'ativos');
});

test('a view grava busca e situação só quando não são o padrão', () => {
  const filtro = { filtros: [{ chave: 'email', operador: 'vazio' }] };

  assert.deepEqual(visaoDoEstado({ ...ESTADO_LISTA_PADRAO, filtro }), filtro);
  assert.deepEqual(visaoDoEstado({ ...ESTADO_LISTA_PADRAO, filtro, busca: 'ana', situacao: 'arquivados' }), {
    ...filtro,
    busca: 'ana',
    situacao: 'arquivados',
  });
});

test('estadoDaVisao lê a view salva e volta para a 1ª página', () => {
  const filtro = { filtros: [{ chave: 'email', operador: 'vazio' }] };

  assert.deepEqual(estadoDaVisao({ ...filtro, busca: 'ana', situacao: 'arquivados' }), {
    busca: 'ana',
    filtro,
    situacao: 'arquivados',
    pagina: 1,
  });
  assert.deepEqual(estadoDaVisao(null), { busca: '', filtro: ESTADO_LISTA_PADRAO.filtro, situacao: 'ativos', pagina: 1 });
});
