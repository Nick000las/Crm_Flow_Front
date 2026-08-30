import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterTeamMembers, TEAM_PAGE_SIZE, updateTeamSelection } from './team-selection.js';

const members = Array.from({ length: 250 }, (_, index) => ({
  id: String(index),
  nome: `Funcionário ${index}`,
}));

test('seleção em lote inclui páginas não renderizadas e preserva escolhas fora do filtro', () => {
  const initial = new Set(['external']);
  const selected = updateTeamSelection(
    initial,
    members.map((member) => member.id),
    true,
  );
  assert.equal(selected.size, members.length + 1);
  assert.equal(initial.size, 1);
  const filtered = filterTeamMembers(members, selected, 'funcionario 24', 'selected');
  const remaining = updateTeamSelection(
    selected,
    filtered.map((member) => member.id),
    false,
  );
  assert(remaining.has('external'));
  assert(remaining.has('0'));
  assert(!remaining.has('249'));
  assert.equal(selected.size, members.length + 1);
});

test('busca ignora acentos, caixa e ordem dos termos', () => {
  const team = [
    { id: 'joao', nome: 'João da Silva' },
    { id: 'ana', nome: 'Ana Souza' },
  ];
  assert.deepEqual(filterTeamMembers(team, new Set(), ' SILVA joao ', 'all'), [team[0]]);
  assert.deepEqual(filterTeamMembers(team, new Set(), 'inexistente', 'all'), []);
});

test('filtros de selecionados e disponíveis não alteram seleção ao navegar', () => {
  const selected = new Set(['0', '24', '249']);
  const allSelected = filterTeamMembers(members, selected, '', 'selected');
  assert.equal(allSelected.length, 3);
  assert.equal(filterTeamMembers(members, selected, '', 'available').length, 247);
  const secondPage = filterTeamMembers(members, selected, '', 'all').slice(
    TEAM_PAGE_SIZE,
    TEAM_PAGE_SIZE * 2,
  );
  assert(secondPage.some((member) => member.id === '24'));
  assert.deepEqual([...selected], ['0', '24', '249']);
});
