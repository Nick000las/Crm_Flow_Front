import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, createApiErrorFromResponse, isAccessError } from './api-error.js';

function resposta403(code) {
  return {
    statusCode: 403,
    error: {
      code,
      message: 'Feature crm.listas not enabled',
      details: { featureKey: 'crm.listas' },
    },
  };
}

test('403 FEATURE_NOT_ENABLED ganha mensagem do front e preserva code e details', () => {
  const erro = createApiErrorFromResponse(resposta403('FEATURE_NOT_ENABLED'), 403);

  assert.equal(erro.code, 'FEATURE_NOT_ENABLED');
  assert.equal(erro.message, 'Esta funcionalidade ainda não está disponível para a sua empresa.');
  assert.deepEqual(erro.details, { featureKey: 'crm.listas' });
});

test('403 MODULE_NOT_ENABLED segue o mesmo tratamento', () => {
  const erro = createApiErrorFromResponse(resposta403('MODULE_NOT_ENABLED'), 403);

  assert.equal(erro.message, 'Este módulo não está ativo para a sua empresa.');
});

test('os demais códigos mantêm a mensagem do back', () => {
  const erro = createApiErrorFromResponse(resposta403('FORBIDDEN'), 403);

  assert.equal(erro.message, 'Feature crm.listas not enabled');
});

test('isAccessError reconhece só os 403 de contratação/rollout', () => {
  assert.equal(
    isAccessError(createApiErrorFromResponse(resposta403('FEATURE_NOT_ENABLED'), 403)),
    true,
  );
  assert.equal(
    isAccessError(createApiErrorFromResponse(resposta403('MODULE_NOT_ENABLED'), 403)),
    true,
  );
  assert.equal(isAccessError(new ApiError('x', { code: 'FORBIDDEN' })), false);
  assert.equal(isAccessError(null), false);
});
