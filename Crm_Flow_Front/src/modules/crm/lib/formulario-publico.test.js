import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENSAGENS_PUBLICAS,
  QUEM_PREENCHE,
  campoDoItem,
  corpoDoEnvio,
  errosDoEnvio,
  mensagemDoErroPublico,
  temErros,
  validarEnvio,
  valoresIniciais,
} from './formulario-publico.js';

const VERSAO = {
  introducao: null,
  termo: 'Aceito',
  secoes: [
    {
      titulo: 'Dados',
      itens: [
        {
          campoId: 'c-nome',
          obrigatorio: true,
          campo: { label: 'Nome', tipo: 'texto', opcoes: null },
          valor: 'Maria Souza',
        },
        {
          campoId: 'c-tel',
          obrigatorio: false,
          campo: { label: 'Telefone', tipo: 'telefone', opcoes: null },
          valor: null,
        },
        {
          campoId: 'c-origem',
          obrigatorio: false,
          campo: {
            label: 'Origem',
            tipo: 'selecao',
            opcoes: ['indicacao'],
            opcoesLista: [{ key: 'indicacao', label: 'Indicação' }],
          },
          valor: null,
        },
        {
          pergunta: {
            id: 'p-fuma',
            rotulo: 'Fuma?',
            ajuda: 'Cigarro',
            tipo: 'booleano',
            opcoes: null,
          },
          obrigatorio: true,
        },
        {
          pergunta: { id: 'p-dor', rotulo: 'Dor', ajuda: null, tipo: 'selecao', opcoes: ['Leve'] },
          obrigatorio: false,
        },
      ],
    },
  ],
};
const TITULAR = { aceite: true, preenchidoPor: QUEM_PREENCHE.TITULAR, nomeResponsavel: '' };

test('campoDoItem adapta campo e pergunta ao Campo do CRM', () => {
  const [nome, , origem, fuma, dor] = VERSAO.secoes[0].itens.map(campoDoItem);

  assert.equal(nome.chave, 'c-nome');
  assert.equal(nome.obrigatorio, true);
  assert.equal(fuma.chave, 'p-fuma');
  assert.equal(fuma.ajuda, 'Cigarro');
  // Com lista, a opção tem rótulo; sem, o texto já é o rótulo (Camada 3).
  assert.equal(origem.camada, 2);
  assert.equal(dor.camada, 3);
});

test('valoresIniciais traz o pré-preenchido e deixa a pergunta vazia', () => {
  const valores = valoresIniciais(VERSAO);

  assert.equal(valores['c-nome'], 'Maria Souza');
  assert.equal(valores['c-tel'], '');
  assert.equal(valores['p-fuma'], null);
});

test('corpoDoEnvio omite o vazio e só leva o responsável quando é o caso', () => {
  const valores = { ...valoresIniciais(VERSAO), 'p-fuma': false, 'c-tel': '(11) 98765-4321' };

  assert.deepEqual(corpoDoEnvio(VERSAO, valores, TITULAR), {
    respostas: { 'c-nome': 'Maria Souza', 'c-tel': '(11) 98765-4321', 'p-fuma': false },
    aceite: true,
    preenchidoPor: 'titular',
  });
  assert.equal(
    corpoDoEnvio(VERSAO, valores, {
      aceite: true,
      preenchidoPor: QUEM_PREENCHE.RESPONSAVEL,
      nomeResponsavel: ' Joana ',
    }).nomeResponsavel,
    'Joana',
  );
});

test('validarEnvio cobra obrigatório, aceite e nome do responsável', () => {
  const valores = { ...valoresIniciais(VERSAO), 'c-nome': '' };
  const erros = validarEnvio(VERSAO, valores, {
    aceite: false,
    preenchidoPor: QUEM_PREENCHE.RESPONSAVEL,
    nomeResponsavel: ' ',
  });

  assert.deepEqual(erros, {
    porChave: {
      'c-nome': MENSAGENS_PUBLICAS.OBRIGATORIA,
      'p-fuma': MENSAGENS_PUBLICAS.OBRIGATORIA,
    },
    aceite: MENSAGENS_PUBLICAS.ACEITE,
    nomeResponsavel: MENSAGENS_PUBLICAS.RESPONSAVEL,
  });
  assert.equal(temErros(erros), true);
  assert.equal(
    temErros(validarEnvio(VERSAO, { ...valoresIniciais(VERSAO), 'p-fuma': true }, TITULAR)),
    false,
  );
});

test('errosDoEnvio leva cada 400 ao seu campo', () => {
  assert.deepEqual(
    errosDoEnvio({
      'respostas.c-tel': ['Resposta inválida para "Telefone"'],
      aceite: ['É preciso aceitar o termo para enviar'],
      nomeResponsavel: ['Informe o nome'],
      respostas: ['Envie as respostas como um objeto'],
    }),
    {
      porChave: { 'c-tel': 'Resposta inválida para "Telefone"' },
      aceite: 'É preciso aceitar o termo para enviar',
      nomeResponsavel: 'Informe o nome',
      outros: ['Envie as respostas como um objeto'],
    },
  );
});

test('mensagemDoErroPublico não diferencia o motivo do 404', () => {
  assert.equal(mensagemDoErroPublico(null), null);
  assert.deepEqual(mensagemDoErroPublico({ status: 404 }), {
    texto: MENSAGENS_PUBLICAS.INDISPONIVEL,
    tentarDeNovo: false,
  });
  assert.match(mensagemDoErroPublico({ status: 429, retryAfter: 30 }).texto, /30 segundos/);
  assert.equal(
    mensagemDoErroPublico({ status: 429, retryAfter: null }).texto,
    MENSAGENS_PUBLICAS.MUITAS_TENTATIVAS,
  );
  assert.equal(mensagemDoErroPublico({ status: 500 }).tentarDeNovo, true);
});
