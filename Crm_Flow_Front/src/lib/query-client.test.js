import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ApiError } from '../services/api-error.js'
import { shouldRetry } from './query-client.js'

test('não repete erros 4xx', () => {
  assert.equal(shouldRetry(0, new ApiError('x', { status: 400 })), false)
  assert.equal(shouldRetry(0, new ApiError('x', { status: 403 })), false)
})

test('repete 5xx e falha de rede até o limite', () => {
  assert.equal(shouldRetry(0, new ApiError('x', { status: 503 })), true)
  assert.equal(shouldRetry(1, new ApiError('x')), true)
  assert.equal(shouldRetry(2, new ApiError('x', { status: 503 })), false)
})
