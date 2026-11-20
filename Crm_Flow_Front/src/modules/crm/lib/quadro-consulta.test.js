import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FILTRO_VAZIO } from './filtro.js';
import {
  ORDEM_PADRAO,
  avisoDoFormulario,
  avisoDoMovimento,
  montarConsulta,
  opcoesDeOrdem,
  ordemValida,
} from './quadro-consulta.js';

const valores = (opcoes) => opcoes.map((opcao) => opcao.valor);
const COM_VALOR = [{ chave: 'valor' }];

test('opcoesDeOrdem só oferece o campo que o papel vê, além dos três livres', () => {
  assert.deepEqual(valores(opcoesDeOrdem([])), ['atualizadoEm', 'criadoEm', 'nome']);
  assert.deepEqual(valores(opcoesDeOrdem(COM_VALOR)), [
    'atualizadoEm',
    'criadoEm',
    'nome',
    'valor',
  ]);
});

test('ordemValida aceita a ordem salva disponível', () => {
  const ordem = { campo: 'valor', direcao: 'asc' };

  assert.deepEqual(ordemValida(ordem, COM_VALOR), ordem);
});

test('ordemValida cai no padrão com campo oculto ou lixo no storage', () => {
  assert.equal(ordemValida({ campo: 'valor', direcao: 'asc' }, []), ORDEM_PADRAO);
  assert.equal(ordemValida({ campo: 'nome', direcao: 'lado' }, []), ORDEM_PADRAO);
  assert.equal(ordemValida({ campo: 'inventado', direcao: 'asc' }, []), ORDEM_PADRAO);
  assert.equal(ordemValida(null, []), ORDEM_PADRAO);
  assert.equal(ordemValida('texto', []), ORDEM_PADRAO);
});

test('montarConsulta sem filtro e na ordem padrão manda o corpo de antes', () => {
  assert.deepEqual(montarConsulta({ busca: '', filtro: FILTRO_VAZIO }, ORDEM_PADRAO), {});
});

test('montarConsulta leva a busca dentro de filtros', () => {
  const { filtros } = montarConsulta({ busca: 'ana', filtro: FILTRO_VAZIO }, ORDEM_PADRAO);

  assert.deepEqual(filtros, { busca: 'ana', filtros: [] });
});

test('montarConsulta fecha o dia de criadoAte, como a tabela', () => {
  const filtro = { filtros: [], criadoAte: '2026-11-06' };
  const { filtros } = montarConsulta({ busca: '', filtro }, ORDEM_PADRAO);

  assert.equal(filtros.criadoAte, '2026-11-06T23:59:59.999');
});

test('montarConsulta só manda ordem fora do padrão', () => {
  const ordem = { campo: 'atualizadoEm', direcao: 'asc' };

  assert.deepEqual(montarConsulta({ busca: '', filtro: FILTRO_VAZIO }, ordem), { ordem });
});

test('avisoDoMovimento avisa do filtro e do conflito', () => {
  assert.equal(avisoDoMovimento({ conflito: false, saiuDoFiltro: false }), null);
  assert.equal(
    avisoDoMovimento({ conflito: false, saiuDoFiltro: true }),
    'Movido. Não aparece no filtro atual.',
  );
  assert.match(avisoDoMovimento({ conflito: true, saiuDoFiltro: false }), /outra pessoa/);
  assert.match(avisoDoMovimento({ conflito: true, saiuDoFiltro: true }), /filtro.*Outra pessoa/);
});

test('a probabilidade redefinida entra no aviso, com a padrão do destino', () => {
  const avisos = [
    { codigo: 'PROBABILIDADE_REDEFINIDA', campo: 'probabilidadeFechamento', anterior: 35 },
  ];

  assert.equal(
    avisoDoMovimento({ conflito: false, saiuDoFiltro: false, avisos }, 80),
    'A probabilidade voltou ao padrão do status (80%). Antes era 35%.',
  );
  assert.equal(
    avisoDoFormulario({ conflito: false, saiuDoFiltro: false, avisos }, 80),
    'Card movido. A probabilidade voltou ao padrão do status (80%). Antes era 35%.',
  );
  assert.equal(avisoDoMovimento({ conflito: false, saiuDoFiltro: false, avisos: [] }, 80), null);
});

test('avisoDoFormulario sempre confirma, com o aviso exato do filtro', () => {
  assert.equal(avisoDoFormulario({ conflito: false, saiuDoFiltro: false }), 'Card movido.');
  assert.equal(
    avisoDoFormulario({ conflito: false, saiuDoFiltro: true }),
    'Movido. Não aparece no filtro atual.',
  );
  assert.match(avisoDoFormulario({ conflito: true, saiuDoFiltro: false }), /outra pessoa/);
});
