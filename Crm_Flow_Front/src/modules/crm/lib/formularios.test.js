import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENSAGENS_FORMULARIO,
  POLITICAS,
  TIPOS_PERGUNTA,
  adicionarItem,
  adicionarPergunta,
  adicionarSecao,
  alterarItem,
  camposDisponiveis,
  corpoDoPut,
  dadosDoForm,
  editarPergunta,
  errosDoFormulario,
  formularioMudou,
  itensIndisponiveis,
  moverItem,
  moverSecao,
  perguntaVazia,
  rascunhoDoForm,
  rascunhoParaApi,
  removerItem,
  removerSecao,
  situacaoDoFormulario,
  validarNoCliente,
  validarPergunta,
} from './formularios.js';

const campo = (id, extras = {}) => ({
  id,
  chave: id,
  label: id.toUpperCase(),
  tipo: 'texto',
  camada: 3,
  sensivel: false,
  opcoes: null,
  politicaPadrao: POLITICAS.SOBRESCREVER,
  podePreencher: true,
  ...extras,
});
const item = (campoId, extras = {}) => ({
  campoId,
  obrigatorio: false,
  politica: POLITICAS.SOBRESCREVER,
  preencher: false,
  ...extras,
});
const PERGUNTA = {
  pergunta: {
    id: 'p1',
    rotulo: 'Sente dor?',
    ajuda: null,
    tipo: 'selecao',
    opcoes: ['Nenhuma', 'Leve'],
    sensivel: true,
  },
  obrigatorio: false,
};
const DA_API = {
  secoes: [
    { titulo: 'Saúde', itens: [item('a', { obrigatorio: true }), PERGUNTA] },
    { titulo: null, itens: [item('c', { preencher: true })] },
  ],
  introducao: 'Oi',
  termo: 'Aceito',
};
const FORMULARIO = {
  id: 'f1',
  nome: 'Anamnese',
  descricao: null,
  ativo: true,
  validadeDias: 7,
  versaoAtual: null,
  alteracoesNaoPublicadas: true,
  atualizadoEm: '2026-11-07T10:00:00.000Z',
};
const ELEGIVEIS = ['a', 'b', 'c'].map((id) => campo(id));
const chaves = (rascunho) =>
  rascunho.secoes.map((secao) => secao.itens.map((atual) => atual.chaveLocal));

test('situacaoDoFormulario distingue rascunho, publicado e publicado com alterações', () => {
  const publicado = { versaoAtual: { id: 'v', versao: 2, publicadaEm: '' } };

  assert.deepEqual(situacaoDoFormulario(FORMULARIO), { rotulo: 'Rascunho', versao: null });
  assert.deepEqual(situacaoDoFormulario({ ...publicado, alteracoesNaoPublicadas: false }), {
    rotulo: 'Publicado',
    versao: 2,
  });
  assert.equal(
    situacaoDoFormulario({ ...publicado, alteracoesNaoPublicadas: true }).rotulo,
    'Publicado com alterações',
  );
});

test('rascunhoDoForm e rascunhoParaApi vão e voltam, com o id da pergunta', () => {
  assert.deepEqual(rascunhoParaApi(rascunhoDoForm(DA_API)), DA_API);
  assert.deepEqual(chaves(rascunhoDoForm(DA_API)), [['campo:a', 'pergunta:p1'], ['campo:c']]);
});

test('rascunhoDoForm aceita o item de campo antigo, sem preencher', () => {
  const antigo = {
    secoes: [
      { titulo: null, itens: [{ campoId: 'a', obrigatorio: false, politica: 'overwrite' }] },
    ],
  };

  assert.equal(rascunhoDoForm(antigo).secoes[0].itens[0].preencher, false);
});

test('rascunhoDoForm começa com uma seção vazia, que não vai no PUT', () => {
  const vazio = rascunhoDoForm({ secoes: [], introducao: null, termo: null });

  assert.equal(vazio.secoes.length, 1);
  assert.deepEqual(rascunhoParaApi(vazio), { secoes: [], introducao: null, termo: null });
});

test('pergunta nova vai sem id e com a chave local própria', () => {
  const rascunho = adicionarPergunta(rascunhoDoForm(DA_API), 'secao-1', {
    ...perguntaVazia(),
    rotulo: '  Alergias? ',
  });
  const nova = rascunho.secoes[1].itens.at(-1);

  assert.equal(nova.chaveLocal, 'nova-2');
  assert.deepEqual(rascunhoParaApi(rascunho).secoes[1].itens.at(-1), {
    pergunta: { rotulo: 'Alergias?', ajuda: null, tipo: 'texto', sensivel: false },
    obrigatorio: false,
  });
});

test('editarPergunta mantém o id, e trocar para texto tira as opções', () => {
  const rascunho = rascunhoDoForm(DA_API);
  const pergunta = rascunho.secoes[0].itens[1].pergunta;
  const editado = editarPergunta(rascunho, 'pergunta:p1', { ...pergunta, tipo: 'texto' });

  assert.deepEqual(rascunhoParaApi(editado).secoes[0].itens[1].pergunta, {
    id: 'p1',
    rotulo: 'Sente dor?',
    ajuda: null,
    tipo: 'texto',
    sensivel: true,
  });
});

test('o tipo de pergunta não oferece usuário nem endereço', () => {
  assert.equal(TIPOS_PERGUNTA.includes('usuario'), false);
  assert.equal(TIPOS_PERGUNTA.includes('endereco'), false);
  assert.equal(TIPOS_PERGUNTA.includes('selecao'), true);
});

test('formularioMudou compara o corpo do PUT', () => {
  const dados = dadosDoForm(FORMULARIO);
  const rascunho = rascunhoDoForm(DA_API);
  const inicial = corpoDoPut(dados, rascunho);

  assert.equal(formularioMudou(inicial, corpoDoPut(dados, adicionarSecao(rascunho))), false);
  assert.equal(formularioMudou(inicial, corpoDoPut({ ...dados, nome: 'Outro' }, rascunho)), true);
  assert.equal(formularioMudou(inicial, corpoDoPut(dados, removerItem(rascunho, 'campo:c'))), true);
});

test('adicionarItem usa a política padrão do campo e não vem preenchido', () => {
  const rascunho = adicionarItem(
    rascunhoDoForm(DA_API),
    'secao-1',
    campo('email', { politicaPadrao: POLITICAS.PREENCHER_SE_VAZIO }),
  );

  assert.deepEqual(rascunho.secoes[1].itens.at(-1), {
    chaveLocal: 'campo:email',
    campoId: 'email',
    obrigatorio: false,
    politica: POLITICAS.PREENCHER_SE_VAZIO,
    preencher: false,
  });
});

test('alterarItem muda só o item pedido', () => {
  const rascunho = alterarItem(rascunhoDoForm(DA_API), 'pergunta:p1', { obrigatorio: true });

  assert.equal(rascunho.secoes[0].itens[1].obrigatorio, true);
  assert.equal(rascunho.secoes[0].itens[0].obrigatorio, true);
  assert.equal(rascunho.secoes[1].itens[0].obrigatorio, false);
});

test('moverItem reordena dentro da seção e leva para outra', () => {
  const rascunho = rascunhoDoForm(DA_API);

  assert.deepEqual(chaves(moverItem(rascunho, 'campo:a', { secao: 'secao-0', indice: 1 })), [
    ['pergunta:p1', 'campo:a'],
    ['campo:c'],
  ]);
  assert.deepEqual(chaves(moverItem(rascunho, 'pergunta:p1', { secao: 'secao-1', indice: 99 })), [
    ['campo:a'],
    ['campo:c', 'pergunta:p1'],
  ]);
});

test('removerSecao devolve os campos e mantém uma seção', () => {
  const semSaude = removerSecao(rascunhoDoForm(DA_API), 'secao-0');

  assert.deepEqual(
    camposDisponiveis(ELEGIVEIS, semSaude).map((atual) => atual.id),
    ['a', 'b'],
  );
  assert.equal(removerSecao(semSaude, 'secao-1').secoes.length, 1);
});

test('adicionarSecao não repete a chave de uma seção removida', () => {
  const rascunho = adicionarSecao(removerSecao(rascunhoDoForm(DA_API), 'secao-1'));

  assert.deepEqual(
    rascunho.secoes.map((secao) => secao.chaveLocal),
    ['secao-0', 'secao-2'],
  );
});

test('moverSecao troca a ordem das seções', () => {
  assert.deepEqual(chaves(moverSecao(rascunhoDoForm(DA_API), 0, 1)), [
    ['campo:c'],
    ['campo:a', 'pergunta:p1'],
  ]);
});

test('itensIndisponiveis só olha os campos', () => {
  assert.deepEqual(itensIndisponiveis(rascunhoDoForm(DA_API), [campo('a')]), new Set(['campo:c']));
});

test('validarPergunta segue os limites do back', () => {
  const base = { ...perguntaVazia(), rotulo: 'Ok' };

  assert.deepEqual(validarPergunta(base), {});
  assert.equal(validarPergunta({ ...base, rotulo: ' ' }).rotulo, MENSAGENS_FORMULARIO.ROTULO);
  assert.equal(
    validarPergunta({ ...base, rotulo: 'x'.repeat(201) }).rotulo,
    MENSAGENS_FORMULARIO.ROTULO_LONGO,
  );
  assert.equal(
    validarPergunta({ ...base, tipo: 'selecao', opcoes: ['', ' '] }).opcoes,
    MENSAGENS_FORMULARIO.SEM_OPCOES,
  );
  assert.equal(
    validarPergunta({ ...base, tipo: 'selecao', opcoes: ['Sim', 'sim'] }).opcoes,
    MENSAGENS_FORMULARIO.OPCAO_REPETIDA,
  );
  // Fora da seleção, as opções não importam: nem vão no PUT.
  assert.deepEqual(validarPergunta({ ...base, tipo: 'texto', opcoes: ['a', 'a'] }), {});
});

test('validarNoCliente confere nome, validade e itens', () => {
  const rascunho = rascunhoDoForm(DA_API);
  const dados = dadosDoForm(FORMULARIO);

  assert.deepEqual(validarNoCliente(dados, rascunho, ELEGIVEIS), {
    dados: {},
    porItem: {},
    geral: null,
  });
  assert.deepEqual(
    validarNoCliente({ ...dados, nome: ' ', validadeDias: '91' }, rascunho, ELEGIVEIS).dados,
    { nome: MENSAGENS_FORMULARIO.NOME, validadeDias: MENSAGENS_FORMULARIO.VALIDADE },
  );
  assert.equal(
    validarNoCliente(dados, rascunho, [campo('a')]).geral,
    MENSAGENS_FORMULARIO.INDISPONIVEIS,
  );
});

test('validarNoCliente pede para desligar o preenchido de campo que virou sensível', () => {
  const elegiveis = [campo('a'), campo('b'), campo('c', { sensivel: true, podePreencher: false })];
  const resultado = validarNoCliente(dadosDoForm(FORMULARIO), rascunhoDoForm(DA_API), elegiveis);

  assert.deepEqual(resultado.porItem, {
    'campo:c': { preencher: MENSAGENS_FORMULARIO.DESLIGUE_PREENCHER },
  });
  assert.equal(resultado.geral, MENSAGENS_FORMULARIO.REVISE_ITENS);
});

test('validarNoCliente marca a pergunta inválida', () => {
  const rascunho = adicionarPergunta(rascunhoDoForm(DA_API), 'secao-0', perguntaVazia());

  assert.deepEqual(validarNoCliente(dadosDoForm(FORMULARIO), rascunho, ELEGIVEIS).porItem, {
    'nova-2': { pergunta: MENSAGENS_FORMULARIO.ROTULO },
  });
});

test('errosDoFormulario leva cada erro ao seu lugar, pelos índices do que foi enviado', () => {
  // A primeira seção, vazia, não foi enviada: o índice 0 do back é "Saúde".
  const enviado = {
    ...rascunhoDoForm(DA_API),
    secoes: [{ chaveLocal: 'vazia', titulo: '', itens: [] }, ...rascunhoDoForm(DA_API).secoes],
  };
  const erros = errosDoFormulario(
    {
      'rascunho.secoes.0.itens.0.campoId': ['"A" já está no formulário'],
      'rascunho.secoes.0.itens.1.pergunta.opcoes.1': ['Escreva a opção'],
      'rascunho.secoes.0.itens.1.pergunta.rotulo': ['Escreva a pergunta'],
      'rascunho.secoes.1.itens.0.preencher': ['Campo sensível não vem preenchido'],
      'rascunho.secoes.1.titulo': ['Longo demais'],
      'rascunho.secoes': ['Escolha ao menos um item para publicar'],
      'rascunho.termo': ['Escreva o termo de aceite para publicar'],
      nome: ['Já existe um formulário chamado "Anamnese"'],
      outro: ['Algo'],
    },
    enviado,
  );

  assert.deepEqual(erros.porItem, {
    'campo:a': { campo: '"A" já está no formulário' },
    'pergunta:p1': { pergunta: 'Escreva a opção' },
    'campo:c': { preencher: 'Campo sensível não vem preenchido' },
  });
  assert.deepEqual(erros.porSecao, { 'secao-1': 'Longo demais' });
  assert.equal(erros.secoes, 'Escolha ao menos um item para publicar');
  assert.equal(erros.termo, 'Escreva o termo de aceite para publicar');
  assert.deepEqual(erros.dados, { nome: 'Já existe um formulário chamado "Anamnese"' });
  assert.deepEqual(erros.outros, ['Algo']);
});
