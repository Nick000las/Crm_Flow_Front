import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  estadoDoLink,
  linkDoWhatsapp,
  mensagemDoWhatsapp,
  MOTIVOS_LINK,
  motivoSemEnvio,
  primeiroNomeDoLead,
  STATUS_LINK,
  telefoneDoWhatsapp,
  urlAbsoluta,
} from './links-formulario.js';

test('estadoDoLink segue a tabela do handoff', () => {
  assert.deepEqual(estadoDoLink({ status: STATUS_LINK.ATIVO }), {
    rotulo: 'Aguardando resposta',
    acao: 'copiar',
  });

  assert.deepEqual(estadoDoLink({ status: STATUS_LINK.VENCIDO }), {
    rotulo: 'Vencido',
    acao: 'gerar',
  });

  assert.deepEqual(estadoDoLink({ status: STATUS_LINK.CANCELADO }), {
    rotulo: 'Cancelado',
    acao: 'gerar',
  });

  assert.deepEqual(estadoDoLink({ status: STATUS_LINK.RESPONDIDO }), {
    rotulo: 'Respondido',
    acao: null,
  });
});

test('urlAbsoluta mantém a absoluta e resolve o caminho na origem', () => {
  assert.equal(
    urlAbsoluta('https://app.exemplo.com/f/abc', 'http://localhost:5173'),
    'https://app.exemplo.com/f/abc',
  );

  assert.equal(urlAbsoluta('/f/abc', 'http://localhost:5173'), 'http://localhost:5173/f/abc');
});

test('telefoneDoWhatsapp aceita fixo e celular do Brasil', () => {
  assert.equal(telefoneDoWhatsapp('11987654321'), '11987654321');
  assert.equal(telefoneDoWhatsapp('(11) 3456-7890'), '1134567890');
  assert.equal(telefoneDoWhatsapp('123'), null);
  assert.equal(telefoneDoWhatsapp(null), null);
});

test('linkDoWhatsapp põe o 55 e codifica a mensagem', () => {
  assert.equal(
    linkDoWhatsapp('11987654321', 'Olá! Responda: https://x.com/f/a?b=1'),
    'https://wa.me/5511987654321?text=Ol%C3%A1!%20Responda%3A%20https%3A%2F%2Fx.com%2Ff%2Fa%3Fb%3D1',
  );
});

test('mensagemDoWhatsapp cumprimenta pelo nome quando há', () => {
  assert.equal(
    mensagemDoWhatsapp({ primeiroNome: 'Ana', formulario: 'Anamnese', url: 'u' }),
    'Olá, Ana! Responda o formulário Anamnese: u',
  );

  assert.equal(
    mensagemDoWhatsapp({ primeiroNome: null, formulario: 'Anamnese', url: 'u' }),
    'Olá! Responda o formulário Anamnese: u',
  );
});

test('primeiroNomeDoLead usa o do back e cai no Nome', () => {
  assert.equal(primeiroNomeDoLead({ primeiro_nome: 'Aninha', nome: 'Ana Souza' }), 'Aninha');
  assert.equal(primeiroNomeDoLead({ nome: '  Ana  Souza' }), 'Ana');
  assert.equal(primeiroNomeDoLead({ nome: null }), null);
});

test('motivoSemEnvio trava pessoa arquivada ou anonimizada', () => {
  assert.equal(motivoSemEnvio({}), null);
  assert.equal(motivoSemEnvio({ archived_at: '2026-11-07' }), MOTIVOS_LINK.ARQUIVADA);

  assert.equal(
    motivoSemEnvio({ archived_at: '2026-11-07', anonimizado_em: '2026-11-07' }),
    MOTIVOS_LINK.ANONIMIZADA,
  );
});
