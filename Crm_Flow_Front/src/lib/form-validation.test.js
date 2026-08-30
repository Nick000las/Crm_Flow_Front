import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  validateEmail,
  validateExactDigits,
  validateMinLength,
  validatePasswordMatch,
  validateRequired,
} from './form-validation.js';

describe('form-validation', () => {
  it('valida campos obrigatórios', () => {
    assert.equal(validateRequired('   ', 'A senha'), 'A senha é obrigatório.');
    assert.equal(validateRequired('ok', 'A senha'), null);
  });

  it('valida formato de e-mail', () => {
    assert.equal(validateEmail(''), 'Informe seu e-mail.');
    assert.equal(validateEmail('invalido'), 'Informe um endereço de e-mail válido.');
    assert.equal(validateEmail('usuario@empresa.com'), null);
  });

  it('valida comprimento mínimo informando a contagem atual', () => {
    assert.equal(
      validateMinLength('123456', 8, 'A nova senha'),
      'A nova senha deve ter pelo menos 8 caracteres (atual: 6).',
    );

    assert.equal(validateMinLength('12345678', 8, 'A nova senha'), null);
  });

  it('valida códigos numéricos de tamanho exato', () => {
    assert.equal(validateExactDigits('', 6), 'Informe o código.');
    assert.equal(validateExactDigits('12ab56', 6), 'O código deve conter apenas números.');
    assert.equal(validateExactDigits('1234', 6), 'O código deve ter exatamente 6 dígitos.');
    assert.equal(validateExactDigits('123456', 6), null);
  });

  it('valida confirmação de senha', () => {
    assert.equal(validatePasswordMatch('segredo123', ''), 'Confirme a nova senha.');
    assert.equal(validatePasswordMatch('segredo123', 'outro123'), 'As senhas não coincidem.');
    assert.equal(validatePasswordMatch('segredo123', 'segredo123'), null);
  });
});
