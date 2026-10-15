import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  MENSAGENS,
  errosDoServidor,
  lerNumeroDigitado,
  montarPayloadCriacao,
  montarPayloadEdicao,
  payloadVazio,
  validarNoCliente,
  valoresIniciais,
} from './form-lead.js';

const campos = [
  { chave: 'nome', coluna: 'nome', label: 'Nome', tipo: 'texto', camada: 1, obrigatorio: true, ordem: 0 },
  { chave: 'email', coluna: 'email', label: 'E-mail', tipo: 'texto', camada: 1, obrigatorio: false, ordem: 1 },
  { chave: 'telefone', coluna: 'telefone', label: 'Telefone', tipo: 'texto', camada: 1, obrigatorio: false, ordem: 2 },
  { chave: 'status', coluna: 'status', label: 'Status', tipo: 'selecao', camada: 1, obrigatorio: false, ordem: 4 },
  { chave: 'tags', coluna: 'tags', label: 'Tags', tipo: 'selecao_multipla', camada: 1, obrigatorio: false, ordem: 5 },
  { chave: 'leadScore', coluna: 'lead_score', label: 'Score', tipo: 'numero', camada: 2, obrigatorio: false, ordem: 8 },
  { chave: 'dataConversao', coluna: 'data_conversao', label: 'Conversão', tipo: 'data', camada: 2, obrigatorio: false, ordem: 9 },
  { chave: 'renda', label: 'Renda', tipo: 'numero', camada: 3, obrigatorio: false, ordem: 10 },
  { chave: 'vip', label: 'VIP', tipo: 'booleano', camada: 3, obrigatorio: false, ordem: 11 },
];

const lead = {
  id: 'l1',
  nome: 'Ana',
  email: 'ana@x.com',
  telefone: '(11) 99999-0000',
  status: 'novo',
  tags: ['quente'],
  lead_score: '80.00',
  data_conversao: '2026-10-14T00:00:00.000Z',
  valor: '1500.00',
  usuario_responsavel_id: 'u1',
  custom_fields: { renda: 3000 },
};

describe('lerNumeroDigitado', () => {
  test('aceita vírgula decimal e milhar com ponto', () => {
    assert.equal(lerNumeroDigitado('1.234,56'), 1234.56);
    assert.equal(lerNumeroDigitado('10,5'), 10.5);
    assert.equal(lerNumeroDigitado('1234.56'), 1234.56);
    assert.equal(lerNumeroDigitado('2.000'), 2000);
    assert.equal(lerNumeroDigitado('1.234.567'), 1234567);
    assert.equal(lerNumeroDigitado('2.5'), 2.5);
  });

  test('vazio é null e texto inválido é NaN', () => {
    assert.equal(lerNumeroDigitado('  '), null);
    assert.ok(Number.isNaN(lerNumeroDigitado('abc')));
  });
});

describe('valoresIniciais', () => {
  test('converte o lead lido para os valores dos controles', () => {
    const valores = valoresIniciais(campos, lead);

    assert.equal(valores.leadScore, '80');
    assert.equal(valores.dataConversao, '2026-10-14');
    assert.equal(valores['custom.renda'], '3000');
    assert.equal(valores['custom.vip'], null);
    assert.deepEqual(valores.tags, ['quente']);
    assert.equal(valores.valor, '1500');
    assert.equal(valores.usuarioResponsavelId, 'u1');
  });

  test('sem lead, tudo vazio', () => {
    const valores = valoresIniciais(campos);

    assert.equal(valores.nome, '');
    assert.deepEqual(valores.tags, []);
    assert.equal(valores.usuarioResponsavelId, '');
  });
});

describe('montarPayloadCriacao', () => {
  test('envia só o preenchido, Camada 3 em customFields', () => {
    const valores = {
      ...valoresIniciais(campos),
      nome: ' Bia ',
      email: 'bia@x.com',
      leadScore: '7,5',
      'custom.renda': '2.000',
      'custom.vip': true,
      valor: '999',
    };

    assert.deepEqual(montarPayloadCriacao(campos, valores), {
      nome: 'Bia',
      email: 'bia@x.com',
      leadScore: 7.5,
      customFields: { renda: 2000, vip: true },
      valor: 999,
    });
  });

  test('inclui responsável escolhido', () => {
    const valores = { ...valoresIniciais(campos), nome: 'Bia', usuarioResponsavelId: 'u2' };

    assert.equal(montarPayloadCriacao(campos, valores).usuarioResponsavelId, 'u2');
  });
});

describe('montarPayloadEdicao (diff)', () => {
  const iniciais = valoresIniciais(campos, lead);

  test('nada alterado gera payload vazio', () => {
    assert.ok(payloadVazio(montarPayloadEdicao(campos, iniciais, { ...iniciais })));
  });

  test('envia só o que mudou', () => {
    const payload = montarPayloadEdicao(campos, iniciais, { ...iniciais, status: 'ganho', valor: '2000' });

    assert.deepEqual(payload, { status: 'ganho', valor: 2000 });
  });

  test('número reescrito com o mesmo valor não conta como mudança', () => {
    const payload = montarPayloadEdicao(campos, iniciais, { ...iniciais, leadScore: '80,0' });

    assert.ok(payloadVazio(payload));
  });

  test('esvaziar envia null', () => {
    const payload = montarPayloadEdicao(campos, iniciais, {
      ...iniciais,
      email: '',
      tags: [],
      usuarioResponsavelId: '',
    });

    assert.deepEqual(payload, { email: null, tags: null, usuarioResponsavelId: null });
  });

  test('esvaziar campo customizado envia customFields: { chave: null }', () => {
    const payload = montarPayloadEdicao(campos, iniciais, { ...iniciais, 'custom.renda': '' });

    assert.deepEqual(payload, { customFields: { renda: null } });
  });

  test('booleano nunca respondido não vira false por abrir o form', () => {
    assert.equal(iniciais['custom.vip'], null);
    assert.ok(payloadVazio(montarPayloadEdicao(campos, iniciais, { ...iniciais })));
  });
});

describe('validarNoCliente', () => {
  test('exige obrigatório e e-mail ou telefone', () => {
    const erros = validarNoCliente(campos, valoresIniciais(campos));

    assert.equal(erros.nome, MENSAGENS.OBRIGATORIO);
    assert.equal(erros.email, MENSAGENS.CONTATO);
  });

  test('barra número inválido, inclusive no valor', () => {
    const valores = { ...valoresIniciais(campos, lead), leadScore: 'muito', valor: 'x' };
    const erros = validarNoCliente(campos, valores);

    assert.equal(erros.leadScore, MENSAGENS.NUMERO_INVALIDO);
    assert.equal(erros.valor, MENSAGENS.NUMERO_INVALIDO);
  });

  test('lead completo não tem erro', () => {
    assert.deepEqual(validarNoCliente(campos, valoresIniciais(campos, lead)), {});
  });
});

describe('errosDoServidor', () => {
  test('mapeia chave do back para o campo e o resto para gerais', () => {
    const { porCampo, gerais } = errosDoServidor(
      {
        email: ['O lead precisa manter e-mail ou telefone'],
        leadScore: ['Informe um número válido'],
        usuarioResponsavelId: ['Escolha um usuário ativo desta conta'],
        customFields: ['"Renda" é obrigatório e não pode ser limpo'],
        funilEstagioId: ['Informe o estágio do funil'],
      },
      campos,
    );

    assert.deepEqual(porCampo, {
      email: 'O lead precisa manter e-mail ou telefone',
      leadScore: 'Informe um número válido',
      usuarioResponsavelId: 'Escolha um usuário ativo desta conta',
    });
    assert.deepEqual(gerais, [
      '"Renda" é obrigatório e não pode ser limpo',
      'Informe o estágio do funil',
    ]);
  });

  test('sem fields, nada', () => {
    assert.deepEqual(errosDoServidor(undefined, campos), { porCampo: {}, gerais: [] });
  });
});
