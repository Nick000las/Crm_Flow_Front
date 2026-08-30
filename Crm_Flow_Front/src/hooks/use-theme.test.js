import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isValidTheme, resolveTheme } from './use-theme.js';

describe('use-theme', () => {
  it('valida apenas light, dark e system', () => {
    assert.equal(isValidTheme('light'), true);
    assert.equal(isValidTheme('dark'), true);
    assert.equal(isValidTheme('system'), true);
    assert.equal(isValidTheme('auto'), false);
    assert.equal(isValidTheme(null), false);
  });

  it('resolve tema explícito e fallback de sistema', () => {
    assert.equal(resolveTheme('light', true), 'light');
    assert.equal(resolveTheme('dark', false), 'dark');
    assert.equal(resolveTheme('system', true), 'dark');
    assert.equal(resolveTheme('system', false), 'light');
  });
});
