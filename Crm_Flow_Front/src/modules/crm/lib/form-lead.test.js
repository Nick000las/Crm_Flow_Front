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
  { chave: 'email', coluna: 'email', label: 'E-mail', tipo: 'email', camada: 1, obrigatorio: false, ordem: 1 },
  { chave: 'telefone', coluna: 'telefone', label: 'Telefone', tipo: 'telefone', camada: 1, obrigatorio: false, ordem: 2 },
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

describe('tipos do M2', () => {
  const novos = [
    { chave: 'nome', coluna: 'nome', label: 'Nome', tipo: 'texto', camada: 1, obrigatorio: true, ordem: 0 },
    { chave: 'email', coluna: 'email', label: 'E-mail', tipo: 'email', camada: 1, obrigatorio: false, ordem: 1 },
    { chave: 'ticket', label: 'Ticket', tipo: 'monetario', camada: 3, obrigatorio: false, ordem: 2 },
    { chave: 'whats', label: 'WhatsApp', tipo: 'telefone', camada: 3, obrigatorio: false, ordem: 3 },
    { chave: 'site', label: 'Site', tipo: 'url', camada: 3, obrigatorio: false, ordem: 4 },
    { chave: 'notas', label: 'Notas', tipo: 'texto_longo', camada: 3, obrigatorio: false, ordem: 5 },
  ];

  test('monetário vai em reais com até 2 casas; telefone e texto como digitados', () => {
    const payload = montarPayloadCriacao(novos, {
      ...valoresIniciais(novos),
      nome: 'Ana',
      email: 'ana@x.com',
      'custom.ticket': '1.234,567',
      'custom.whats': '(11) 92345-6789',
      'custom.site': ' https://acme.com ',
      'custom.notas': 'linha 1\nlinha 2',
    });

    assert.deepEqual(payload.customFields, {
      ticket: 1234.57,
      whats: '(11) 92345-6789',
      site: 'https://acme.com',
      notas: 'linha 1\nlinha 2',
    });
  });

  test('telefone gravado em dígitos abre com máscara e não vira diff sozinho', () => {
    const leadNovo = { id: 'l2', nome: 'Ana', email: 'ana@x.com', custom_fields: { whats: '11923456789', ticket: '99.90' } };
    const iniciais = valoresIniciais(novos, leadNovo);

    assert.equal(iniciais['custom.whats'], '(11) 92345-6789');
    assert.equal(iniciais['custom.ticket'], '99,9');
    assert.ok(payloadVazio(montarPayloadEdicao(novos, iniciais, iniciais)));
  });
});

describe('obrigatoriedade configurada pelo DONO', () => {
  const comStatusETags = campos.map((campo) =>
    ['status', 'tags'].includes(campo.chave) ? { ...campo, obrigatorio: true } : campo,
  );

  test('status e tags obrigatórios barram no cliente, inclusive tags vazio', () => {
    const erros = validarNoCliente(comStatusETags, { ...valoresIniciais(comStatusETags), nome: 'Ana', email: 'a@x.com' });

    assert.equal(erros.status, MENSAGENS.OBRIGATORIO);
    assert.equal(erros.tags, MENSAGENS.OBRIGATORIO);
  });

  test('o 400 de nativo obrigatório cai no próprio campo do form', () => {
    const { porCampo, gerais } = errosDoServidor(
      { status: ['Campo obrigatório'], fonteLead: ['Campo obrigatório'] },
      [...campos, { chave: 'fonteLead', coluna: 'fonte_lead', label: 'Origem', tipo: 'selecao', camada: 1, obrigatorio: true, ordem: 3 }],
    );

    assert.deepEqual(porCampo, { status: 'Campo obrigatório', fonteLead: 'Campo obrigatório' });
    assert.deepEqual(gerais, []);
  });
});

describe('telefone com DDD', () => {
  const base = () => ({ ...valoresIniciais(campos), nome: 'Ana' });

  test('aceita fixo (10) e celular (11) com ou sem máscara', () => {
    assert.equal(validarNoCliente(campos, { ...base(), telefone: '(11) 2345-6789' }).telefone, undefined);
    assert.equal(validarNoCliente(campos, { ...base(), telefone: '11923456789' }).telefone, undefined);
  });

  test('recusa número sem DDD antes de ir ao back', () => {
    assert.equal(validarNoCliente(campos, { ...base(), telefone: '2345-6789' }).telefone, MENSAGENS.TELEFONE_INVALIDO);
  });
});

describe('listas do tenant', () => {
  const comListas = campos.map((campo) => {
    if (campo.chave === 'tags') {
      return {
        ...campo,
        lista: 'tag',
        opcoes: null,
        opcoesLista: [{ key: 'quente', label: 'Lead quente', color: null, category: null, ativo: true }],
      };
    }
    return campo;
  });

  test('tags abrem pelo nome e reabrir sem mexer não gera diff', () => {
    const iniciais = valoresIniciais(comListas, lead);

    assert.deepEqual(iniciais.tags, ['Lead quente']);
    assert.ok(payloadVazio(montarPayloadEdicao(comListas, iniciais, iniciais)));
  });

  test('tag nova vai como texto; o back cria e devolve a key', () => {
    const iniciais = valoresIniciais(comListas, lead);
    const payload = montarPayloadEdicao(comListas, iniciais, { ...iniciais, tags: ['Lead quente', 'Feira 2026'] });

    assert.deepEqual(payload, { tags: ['Lead quente', 'Feira 2026'] });
  });

  test('400 de opção desativada cai no próprio campo', () => {
    const { porCampo } = errosDoServidor({ motivoPerda: ['Opção desativada'] }, [
      ...comListas,
      { chave: 'motivoPerda', coluna: 'motivo_perda', label: 'Motivo', tipo: 'selecao', camada: 2, obrigatorio: false, ordem: 20 },
    ]);

    assert.deepEqual(porCampo, { motivoPerda: 'Opção desativada' });
  });
});

describe('primeiroNome (campo do sistema)', () => {
  const comPrimeiroNome = [
    ...campos,
    { chave: 'primeiroNome', coluna: 'primeiro_nome', label: 'Primeiro nome', tipo: 'texto', camada: 1, obrigatorio: false, ordem: 1 },
  ];
  const iniciais = valoresIniciais(comPrimeiroNome, { ...lead, primeiro_nome: 'Ana' });

  test('lê do lead pela coluna', () => {
    assert.equal(iniciais.primeiroNome, 'Ana');
  });

  test('esvaziar envia null: o back volta ao derivado do Nome', () => {
    const payload = montarPayloadEdicao(comPrimeiroNome, iniciais, { ...iniciais, primeiroNome: '' });

    assert.deepEqual(payload, { primeiroNome: null });
  });
});
