import assert from 'node:assert/strict';
import { test } from 'node:test';
import { autorDoEvento, detalheDoEvento, itemDoDiff, itensDoEvento, tituloDoEvento } from './historico.js';

const NOMES = new Map([['u1', 'Ana']]);
const STATUS = {
  chave: 'status',
  label: 'Status',
  tipo: 'selecao',
  opcoesLista: [
    { key: 'novo', label: 'Novo', color: null, category: 'aberto', ativo: true },
    { key: 'ganho', label: 'Ganho', color: null, category: 'ganho', ativo: true },
  ],
};
const ANA = { id: 'u1', nome: 'Ana' };

const evento = (extra) => ({ id: 'e1', tipo: 'atualizado', autor: null, criadoEm: '2026-10-16T10:00:00Z', diff: [], ...extra });
const titulo = (extra) => tituloDoEvento(evento(extra)).titulo;

test('autor nulo é o sistema', () => {
  assert.equal(autorDoEvento(evento({ autor: ANA })), 'Ana');
  assert.equal(autorDoEvento(evento()), 'Sistema');
});

test('título por tipo; criado e atualizado já trazem o autor', () => {
  assert.deepEqual(tituloDoEvento(evento({ tipo: 'criado', autor: ANA })), { titulo: 'Criado por Ana', comAutor: true });
  assert.deepEqual(tituloDoEvento(evento({ autor: ANA })), { titulo: 'Ana alterou', comAutor: true });
  assert.equal(titulo({}), 'Sistema alterou');
  assert.deepEqual(tituloDoEvento(evento({ tipo: 'arquivado', autor: ANA })), { titulo: 'Arquivado', comAutor: false });
  assert.equal(titulo({ tipo: 'desarquivado' }), 'Desarquivado');
  assert.equal(titulo({ tipo: 'excluido' }), 'Enviado para a lixeira');
  assert.equal(titulo({ tipo: 'restaurado' }), 'Restaurado da lixeira');
  assert.equal(titulo({ tipo: 'anonimizado' }), 'Dados pessoais removidos a pedido do titular');
  assert.equal(titulo({ tipo: 'convertido' }), 'Lead alterado');
});

test('mesclado diz com quem', () => {
  assert.equal(titulo({ tipo: 'mesclado', detalhes: { leadDescartadoId: 'l2', nomeDescartado: 'Ana S.' } }), 'Mesclado com Ana S.');
  assert.equal(titulo({ tipo: 'mesclado', detalhes: {} }), 'Mesclado com outro lead');
});

test('enriquecido: CNPJ mascarado só quando vem', () => {
  assert.equal(
    titulo({ tipo: 'enriquecido', detalhes: { cnpj: '12345678000190', provedor: 'brasilapi' } }),
    'Dados da Receita aplicados (CNPJ 12.345.678/0001-90)',
  );
  assert.equal(titulo({ tipo: 'enriquecido', detalhes: { provedor: 'brasilapi' } }), 'Dados da Receita aplicados');
});

test('criado com distribuição: de onde veio o responsável', () => {
  const criado = (distribuicao) => evento({ tipo: 'criado', detalhes: { distribuicao } });

  assert.equal(detalheDoEvento(criado({ origem: 'regra', regraId: 'r1', regraNome: 'Site' })), 'Atribuído pela regra "Site"');
  assert.equal(detalheDoEvento(criado({ origem: 'rodizio_geral' })), 'Atribuído pelo rodízio geral');
  assert.equal(detalheDoEvento(criado({ origem: 'sem_responsavel' })), 'Ficou sem responsável (nenhuma regra casou)');
  assert.equal(detalheDoEvento(evento({ tipo: 'criado' })), null);
  assert.equal(detalheDoEvento(evento({ detalhes: { distribuicao: { origem: 'regra' } } })), null);
});

test('lista vira rótulo pela opcoesLista; lado vazio é null', () => {
  assert.deepEqual(itemDoDiff({ ...STATUS, antes: 'novo', depois: 'ganho' }, NOMES), {
    chave: 'status',
    label: 'Status',
    antes: 'Novo',
    depois: 'Ganho',
  });

  const cidade = { chave: 'cidade', label: 'Cidade', tipo: 'texto' };
  assert.equal(itemDoDiff({ ...cidade, antes: null, depois: 'Recife' }, NOMES).antes, null);
  assert.equal(itemDoDiff({ ...cidade, antes: 'Recife', depois: '' }, NOMES).depois, null);
});

test('usuário: nome do back, depois o da lista, depois "Usuário removido"', () => {
  const responsavel = { chave: 'usuarioResponsavelId', label: 'Responsável', tipo: 'usuario' };
  const estagio = { chave: 'funilEstagioId', label: 'Estágio', tipo: 'texto', antes: 'id-1', depois: 'id-2' };

  const comNomes = itemDoDiff({ ...responsavel, antes: 'u8', depois: 'u9', antesNome: 'Dona Ana', depoisNome: 'Bruno' }, NOMES);
  assert.deepEqual([comNomes.antes, comNomes.depois], ['Dona Ana', 'Bruno']);

  const removido = itemDoDiff({ ...responsavel, antes: 'u9', depois: 'u1', antesNome: null, depoisNome: null }, NOMES);
  assert.deepEqual([removido.antes, removido.depois], ['Usuário removido', 'Ana']);

  const doEstagio = itemDoDiff({ ...estagio, antesNome: 'Contato', depoisNome: 'Proposta' }, NOMES);
  assert.deepEqual([doEstagio.antes, doEstagio.depois], ['Contato', 'Proposta']);
});

test('monetário e booleano saem formatados; texto longo é resumido', () => {
  const valor = itemDoDiff({ chave: 'valor', label: 'Valor', tipo: 'monetario', antes: 10, depois: 1500.5 }, NOMES);
  const ativo = itemDoDiff({ chave: 'vip', label: 'VIP', tipo: 'booleano', antes: true, depois: false }, NOMES);
  const nota = itemDoDiff({ chave: 'obs', label: 'Obs', tipo: 'texto_longo', antes: null, depois: 'x'.repeat(200) }, NOMES);

  assert.match(valor.antes, /^R\$\s10,00$/);
  assert.match(valor.depois, /^R\$\s1\.500,50$/);
  assert.deepEqual([ativo.antes, ativo.depois], ['Sim', 'Não']);
  assert.equal(nota.depois.length, 80);
});

test('itensDoEvento: o diff, menos na anonimização', () => {
  const diff = [{ ...STATUS, antes: 'novo', depois: 'ganho' }];

  assert.equal(itensDoEvento(evento({ diff }), NOMES).length, 1);
  assert.equal(itensDoEvento(evento({ tipo: 'mesclado', diff }), NOMES).length, 1);
  assert.deepEqual(itensDoEvento(evento({ tipo: 'anonimizado', diff }), NOMES), []);
  assert.deepEqual(itensDoEvento(evento({ diff: undefined }), NOMES), []);
});
