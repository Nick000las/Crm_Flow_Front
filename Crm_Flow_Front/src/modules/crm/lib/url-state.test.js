import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ESTADO_LISTA_PADRAO,
  escreverEstadoLista,
  lerEstadoLista,
  totalDePaginas,
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
