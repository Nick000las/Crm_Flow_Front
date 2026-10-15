import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  PASSO,
  autoMapear,
  estadoInicial,
  mapeamentoParaEnvio,
  normalizar,
  percentualConcluido,
  problemasDoMapeamento,
  relatorioCsv,
  validarArquivo,
  wizardReducer,
} from './importacao.js';

const campos = [
  { chave: 'nome', label: 'Nome', tipo: 'texto', obrigatorio: true },
  { chave: 'email', label: 'E-mail', tipo: 'texto', obrigatorio: false },
  { chave: 'telefone', label: 'Telefone', tipo: 'texto', obrigatorio: false },
  { chave: 'fonteLead', label: 'Origem do lead', tipo: 'selecao', obrigatorio: false },
  { chave: 'valor', label: 'Valor', tipo: 'numero', obrigatorio: false },
];

describe('arquivo', () => {
  test('aceita .xlsx dentro do limite', () => {
    assert.equal(validarArquivo({ name: 'Leads.XLSX', size: 1000 }), null);
  });

  test('recusa extensão, tamanho e vazio', () => {
    assert.match(validarArquivo({ name: 'leads.csv', size: 10 }), /xlsx/);
    assert.match(validarArquivo({ name: 'a.xlsx', size: 11 * 1024 * 1024 }), /10 MB/);
    assert.match(validarArquivo({ name: 'a.xlsx', size: 0 }), /vazio/);
  });
});

describe('mapeamento', () => {
  test('normalizar ignora acento, caixa e pontuação', () => {
    assert.equal(normalizar('E-mail do Cliente'), 'emaildocliente');
    assert.equal(normalizar('Origem do Lead'), normalizar('origem do lead'));
  });

  test('autoMapear casa por label ou chave, cada campo uma vez', () => {
    assert.deepEqual(autoMapear(['NOME', 'email', 'E-mail', 'fonteLead', 'Observação'], campos), {
      NOME: 'nome',
      email: 'email',
      'E-mail': '',
      fonteLead: 'fonteLead',
      Observação: '',
    });
  });

  test('mapeamentoParaEnvio descarta colunas sem destino', () => {
    assert.deepEqual(mapeamentoParaEnvio({ A: 'nome', B: '' }), { A: 'nome' });
  });

  test('problemas espelham o back', () => {
    assert.deepEqual(problemasDoMapeamento({ A: '', B: '' }, campos), [
      'Mapeie ao menos uma coluna',
      'O campo obrigatório "Nome" não foi mapeado',
      'Mapeie ao menos a coluna de e-mail ou a de telefone',
    ]);
    assert.deepEqual(problemasDoMapeamento({ A: 'nome', B: 'email', C: 'email' }, campos), [
      '"E-mail" foi escolhido para mais de uma coluna',
    ]);
    assert.deepEqual(problemasDoMapeamento({ A: 'nome', B: 'telefone' }, campos), []);
  });
});

describe('relatório e progresso', () => {
  test('CSV com ; e aspas escapadas', () => {
    assert.equal(
      relatorioCsv([{ linha: 3, coluna: 'E-mail', motivo: 'Inválido "x"' }, { linha: 4, motivo: 'Sem nome' }]),
      '"Linha";"Coluna";"Motivo"\r\n"3";"E-mail";"Inválido ""x"""\r\n"4";"";"Sem nome"',
    );
  });

  test('percentual nunca passa de 100 nem divide por zero', () => {
    assert.equal(percentualConcluido({ total_linhas: 200, linhas_processadas: 50 }), 25);
    assert.equal(percentualConcluido({ total_linhas: 0, linhas_processadas: 0 }), 0);
    assert.equal(percentualConcluido({ total_linhas: 10, linhas_processadas: 12 }), 100);
  });
});

describe('wizardReducer', () => {
  const preview = { colunas: ['Nome', 'Telefone'], campos, linhas: [], totalLinhas: 2 };
  const lido = wizardReducer(estadoInicial(), { tipo: 'arquivoLido', arquivo: 'f', preview });

  test('ler o arquivo vai para Mapear já com auto-mapeamento', () => {
    assert.equal(lido.passo, PASSO.MAPEAR);
    assert.deepEqual(lido.mapeamento, { Nome: 'nome', Telefone: 'telefone' });
  });

  test('mudar o mapeamento descarta a validação anterior', () => {
    const validado = wizardReducer(lido, { tipo: 'validado', validacao: { jobId: 'j' } });
    const voltou = wizardReducer(validado, { tipo: 'voltar' });
    const mudou = wizardReducer(voltou, { tipo: 'mapear', coluna: 'Nome', chave: '' });

    assert.equal(validado.passo, PASSO.REVISAR);
    assert.equal(voltou.passo, PASSO.MAPEAR);
    assert.equal(mudou.validacao, null);
  });

  test('confirmar só avança com jobId', () => {
    const semJob = wizardReducer(lido, { tipo: 'validado', validacao: { jobId: null } });
    const comJob = wizardReducer(lido, { tipo: 'validado', validacao: { jobId: 'j1' } });

    assert.equal(wizardReducer(semJob, { tipo: 'confirmado' }).passo, PASSO.REVISAR);
    assert.deepEqual(
      [wizardReducer(comJob, { tipo: 'confirmado' }).passo, wizardReducer(comJob, { tipo: 'confirmado' }).jobId],
      [PASSO.PROCESSAR, 'j1'],
    );
  });

  test('ação fora do passo é ignorada', () => {
    assert.equal(wizardReducer(estadoInicial(), { tipo: 'validado', validacao: {} }).passo, PASSO.ARQUIVO);
  });

  test('job na URL retoma direto em Processar', () => {
    assert.deepEqual([estadoInicial('j9').passo, estadoInicial('j9').jobId], [PASSO.PROCESSAR, 'j9']);
  });
});
