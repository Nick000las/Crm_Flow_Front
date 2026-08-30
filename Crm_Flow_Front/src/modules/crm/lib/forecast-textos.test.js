import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  avisoDoCampoDesligado,
  contadorSelecao,
  rotuloCurtoDoMes,
  rotuloDoMes,
  textoAtualizadas,
  textoDoMotivo,
  textoGanhasSemValor,
} from './forecast-textos.js';

test('cada motivo tem o seu texto, e o resto cai no genérico', () => {
  assert.equal(textoDoMotivo('NAO_ENCONTRADA'), 'Oportunidade não encontrada.');
  assert.equal(textoDoMotivo('NAO_ABERTA'), 'Já foi encerrada.');
  assert.equal(textoDoMotivo('RESOURCE_CONFLICT'), 'Está arquivada.');
  assert.equal(textoDoMotivo('ALGUM_OUTRO_CODE'), 'Não foi possível atualizar.');
  assert.equal(textoDoMotivo(undefined), 'Não foi possível atualizar.');
  assert.equal(textoDoMotivo('constructor'), 'Não foi possível atualizar.');
});

test('texto de campo desligado para gestão usa o "Ligue" do contrato', () => {
  assert.equal(
    avisoDoCampoDesligado('dataPrevistaFechamento', true),
    'Ligue Data prevista de fechamento em Configurações → Campos para o forecast posicionar as oportunidades.',
  );

  assert.equal(
    avisoDoCampoDesligado('probabilidadeFechamento', true),
    'Ligue Probabilidade de fechamento em Configurações → Campos para ajustar a probabilidade de cada oportunidade. Enquanto isso, vale a probabilidade padrão do status.',
  );
});

test('quem não é gestão recebe "Peça ao responsável pela conta para ligar"', () => {
  assert.equal(
    avisoDoCampoDesligado('dataPrevistaFechamento', false),
    'Peça ao responsável pela conta para ligar Data prevista de fechamento em Configurações → Campos para o forecast posicionar as oportunidades.',
  );

  assert.equal(
    avisoDoCampoDesligado('probabilidadeFechamento', false),
    'Peça ao responsável pela conta para ligar Probabilidade de fechamento em Configurações → Campos para ajustar a probabilidade de cada oportunidade. Enquanto isso, vale a probabilidade padrão do status.',
  );
});

test('chave desconhecida de campo desligado não tem aviso', () => {
  assert.equal(avisoDoCampoDesligado('nome', true), null);
  assert.equal(avisoDoCampoDesligado('constructor', false), null);
});

test('textoGanhasSemValor: zero não diz nada; um e plural têm frases próprias', () => {
  assert.equal(textoGanhasSemValor(0), null);
  assert.equal(textoGanhasSemValor(-1), null);
  assert.equal(textoGanhasSemValor(1), '1 venda sem valor não entra na soma');
  assert.equal(textoGanhasSemValor(2), '2 vendas sem valor não entram na soma');
});

test('textoAtualizadas: zero, um e plural', () => {
  assert.equal(textoAtualizadas(0), 'Nenhuma atualizada');
  assert.equal(textoAtualizadas(1), '1 atualizada');
  assert.equal(textoAtualizadas(12), '12 atualizadas');
});

test('contadorSelecao mostra "n de max"', () => {
  assert.equal(contadorSelecao(37, 200), '37 de 200');
});

test('rotuloDoMes: nome completo em minúsculas, sem depender de fuso', () => {
  assert.equal(rotuloDoMes('2026-11'), 'novembro de 2026');
  assert.equal(rotuloDoMes('2027-01'), 'janeiro de 2027');
  assert.equal(rotuloDoMes('2026-03'), 'março de 2026');
  assert.equal(rotuloDoMes('2026-12'), 'dezembro de 2026');
});

test('rotuloCurtoDoMes: abreviação com ano de dois dígitos', () => {
  assert.equal(rotuloCurtoDoMes('2026-11'), 'nov/26');
  assert.equal(rotuloCurtoDoMes('2027-02'), 'fev/27');
});

test('entrada inválida volta igual nos dois rótulos de mês', () => {
  for (const entrada of ['2026-13', '2026-00', '2026-1', '26-11', '2026/11', '', 'abril', null]) {
    assert.equal(rotuloDoMes(entrada), entrada);
    assert.equal(rotuloCurtoDoMes(entrada), entrada);
  }

  assert.equal(rotuloDoMes(undefined), undefined);
  assert.equal(rotuloCurtoDoMes(undefined), undefined);
});
