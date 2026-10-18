import assert from 'node:assert/strict';
import { test } from 'node:test';
import { destinoDaNotificacao, rotuloDoSino, textoDoContador, totalDePaginasNotificacoes } from './notificacoes.js';

test('CRM: /crm/leads vira a lista com o filtro na URL', () => {
  const destino = destinoDaNotificacao({
    modulo: 'crm',
    dados: { rota: '/crm/leads', filtro: { esfriando: true, usuarioResponsavelId: 'u-1' }, total: 3 },
  });
  const url = new URL(destino, 'http://x');

  assert.equal(url.pathname, '/crm');
  assert.deepEqual(JSON.parse(url.searchParams.get('f')), {
    filtros: [],
    usuarioResponsavelId: 'u-1',
    esfriando: true,
  });
});

test('CRM sem filtro vai para a lista limpa', () => {
  assert.equal(destinoDaNotificacao({ modulo: 'crm', dados: { rota: '/crm/leads' } }), '/crm');
});

test('módulo sem regra usa dados.rota interna; externa ou ausente não navega', () => {
  assert.equal(destinoDaNotificacao({ modulo: 'agenda', dados: { rota: '/agenda' } }), '/agenda');
  assert.equal(destinoDaNotificacao({ modulo: 'agenda', dados: { rota: 'https://mal.example' } }), null);
  assert.equal(destinoDaNotificacao({ modulo: 'agenda', dados: { rota: '//mal.example' } }), null);
  assert.equal(destinoDaNotificacao({ modulo: 'agenda', dados: null }), null);
});

test('contador e rótulo do sino', () => {
  assert.equal(textoDoContador(0), '');
  assert.equal(textoDoContador(3), '3');
  assert.equal(textoDoContador(10), '9+');
  assert.equal(textoDoContador(undefined), '');
  assert.equal(rotuloDoSino(0), 'Notificações');
  assert.equal(rotuloDoSino(1), 'Notificações, 1 não lida');
  assert.equal(rotuloDoSino(4), 'Notificações, 4 não lidas');
});

test('total de páginas nunca é zero', () => {
  assert.equal(totalDePaginasNotificacoes(0), 1);
  assert.equal(totalDePaginasNotificacoes(21, 10), 3);
});

test('CRM sem responsável: o filtro vai inteiro para a URL', () => {
  const destino = destinoDaNotificacao({
    modulo: 'crm',
    dados: { rota: '/crm/leads', filtro: { esfriando: true, semResponsavel: true }, total: 2 },
  });

  assert.deepEqual(JSON.parse(new URL(destino, 'http://x').searchParams.get('f')), {
    filtros: [],
    esfriando: true,
    semResponsavel: true,
  });
});
