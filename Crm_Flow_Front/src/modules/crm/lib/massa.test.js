import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RESPONSAVEL_NENHUM } from './filtro.js';
import {
  FORM_MASSA_VAZIO,
  MENSAGENS_MASSA,
  alteracoesDoForm,
  avisoDoResultado,
  falhasDoResultado,
  resumoDoResultado,
} from './massa.js';

const comForm = (mudancas) => ({ ...FORM_MASSA_VAZIO, ...mudancas });

test('nada marcado: erro geral', () => {
  assert.deepEqual(alteracoesDoForm(FORM_MASSA_VAZIO), {
    erros: { geral: MENSAGENS_MASSA.NENHUMA },
  });
});

test('só o que está marcado vai, e marcado sem valor é erro da linha', () => {
  assert.deepEqual(
    alteracoesDoForm(
      comForm({
        status: { ativa: true, valor: 'ganho' },
        fonteLead: { ativa: false, valor: 'site' },
      }),
    ),
    { alteracoes: { status: 'ganho' } },
  );
  assert.deepEqual(alteracoesDoForm(comForm({ fonteLead: { ativa: true, valor: '' } })), {
    erros: { fonteLead: MENSAGENS_MASSA.SEM_VALOR },
  });
});

test('responsável: id, ou null para tirar', () => {
  assert.deepEqual(alteracoesDoForm(comForm({ responsavel: { ativa: true, valor: 'u1' } })), {
    alteracoes: { usuarioResponsavelId: 'u1' },
  });
  assert.deepEqual(
    alteracoesDoForm(comForm({ responsavel: { ativa: true, valor: RESPONSAVEL_NENHUM } })),
    {
      alteracoes: { usuarioResponsavelId: null },
    },
  );
});

test('tags: só as listas preenchidas; nenhuma é erro', () => {
  assert.deepEqual(
    alteracoesDoForm(comForm({ tags: { ativa: true, adicionar: ['vip'], remover: [] } })),
    {
      alteracoes: { tags: { adicionar: ['vip'] } },
    },
  );
  assert.deepEqual(
    alteracoesDoForm(comForm({ tags: { ativa: true, adicionar: [], remover: [] } })),
    {
      erros: { tags: MENSAGENS_MASSA.SEM_TAGS },
    },
  );
});

test('resumo e aviso', () => {
  assert.equal(
    resumoDoResultado({ atualizados: 12, inalterados: 3, falhas: 2 }),
    '12 atualizados · 3 sem mudança · 2 com erro',
  );
  assert.equal(resumoDoResultado({ atualizados: 1, inalterados: 0, falhas: 0 }), '1 atualizado');
  assert.equal(
    resumoDoResultado({ atualizados: 0, inalterados: 0, falhas: 0 }),
    'Nenhum lead alterado',
  );
  assert.equal(avisoDoResultado({ atualizados: 1 }), '1 lead atualizado.');
  assert.equal(avisoDoResultado({ atualizados: 0 }), null);
});

test('falhas: campo com rótulo, mensagem do erro, id curto sem título', () => {
  const resultados = [
    { id: 'a', ok: true },
    {
      id: 'b',
      ok: false,
      erro: {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Revise',
        fields: { motivoPerda: ['é obrigatório'] },
      },
    },
    {
      id: 'c1234567890',
      ok: false,
      erro: { statusCode: 404, code: 'NOT_FOUND', message: 'Lead não encontrado' },
    },
  ];

  assert.deepEqual(
    falhasDoResultado(
      resultados,
      new Map([['b', 'Ana']]),
      new Map([['motivoPerda', 'Motivo da perda']]),
    ),
    [
      { id: 'b', titulo: 'Ana', mensagem: 'Motivo da perda: é obrigatório' },
      { id: 'c1234567890', titulo: 'c1234567', mensagem: 'Lead não encontrado' },
    ],
  );
});
