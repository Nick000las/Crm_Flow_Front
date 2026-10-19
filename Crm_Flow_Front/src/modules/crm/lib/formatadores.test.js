import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  documentoSemMascara,
  formatarCep,
  formatarCnpj,
  formatarCpf,
  formatarData,
  formatarEndereco,
  formatarInstante,
  formatarIntervalo,
  formatarMoeda,
  formatarNumero,
  formatarTelefone,
  mascararCep,
  mascararCnpj,
  mascararCpf,
  mascararTelefone,
  paraNumero,
  urlSegura,
} from './formatadores.js';

// Intl separa "R$" do valor com espaço não separável (U+00A0).
const NBSP = String.fromCharCode(0xa0);
const semNbsp = (texto) => texto.replaceAll(NBSP, ' ');

test('paraNumero converte NUMERIC em string', () => {
  assert.equal(paraNumero('1500.50'), 1500.5);
  assert.equal(paraNumero(3), 3);
  assert.equal(paraNumero(''), null);
  assert.equal(paraNumero(null), null);
  assert.equal(paraNumero('abc'), null);
});

test('formatarData não volta um dia em timestamp à meia-noite UTC', () => {
  assert.equal(formatarData('2026-10-14T00:00:00.000Z'), '14/10/2026');
  assert.equal(formatarData('2026-01-01'), '01/01/2026');
});

test('formatarData ignora valor inválido', () => {
  assert.equal(formatarData(null), null);
  assert.equal(formatarData('ontem'), null);
});

test('formatarNumero e formatarMoeda usam pt-BR', () => {
  assert.equal(formatarNumero('1234.5'), '1.234,5');
  assert.equal(semNbsp(formatarMoeda('1500')), 'R$ 1.500,00');
  assert.equal(formatarMoeda(null), null);
});

test('mascararTelefone formata aos poucos, enquanto se digita', () => {
  assert.equal(mascararTelefone('11'), '11');
  assert.equal(mascararTelefone('119'), '(11) 9');
  assert.equal(mascararTelefone('1192345'), '(11) 9234-5');
  assert.equal(mascararTelefone('11923456789'), '(11) 92345-6789');
  assert.equal(mascararTelefone('(11) 92345-67890'), '(11) 92345-6789');
});

test('formatarTelefone: fixo e celular BR; o resto como veio', () => {
  assert.equal(formatarTelefone('1123456789'), '(11) 2345-6789');
  assert.equal(formatarTelefone('11923456789'), '(11) 92345-6789');
  assert.equal(formatarTelefone('+1 555 0100'), '+1 555 0100');
  assert.equal(formatarTelefone(null), null);
});

test('urlSegura aceita só http e https', () => {
  assert.equal(urlSegura('https://acme.com/a'), 'https://acme.com/a');
  assert.equal(urlSegura('http://acme.com'), 'http://acme.com/');
  assert.equal(urlSegura('javascript:alert(1)'), null);
  assert.equal(urlSegura('acme.com'), null);
  assert.equal(urlSegura(''), null);
});

test('CNPJ e CPF ganham máscara só com a quantidade certa de dígitos', () => {
  assert.equal(formatarCnpj('12345678000190'), '12.345.678/0001-90');
  assert.equal(formatarCnpj('12.345.678/0001-90'), '12.345.678/0001-90');
  // M11: CNPJ alfanumérico também ganha o molde.
  assert.equal(formatarCnpj('12abc34501de35'), '12.ABC.345/01DE-35');
  assert.equal(formatarCnpj('123'), '123');
  assert.equal(formatarCpf('12345678909'), '123.456.789-09');
  assert.equal(formatarCpf(null), null);
});

test('formatarInstante usa o fuso local e ignora lixo', () => {
  const meioDoDia = new Date(2026, 9, 16, 12).toISOString();

  assert.equal(formatarInstante(meioDoDia), '16/10/2026');
  assert.equal(formatarInstante('não é data'), null);
  assert.equal(formatarInstante(null), null);
});

test('máscaras progressivas de CPF, CNPJ e CEP', () => {
  assert.equal(mascararCpf('1234'), '123.4');
  assert.equal(mascararCpf('123.456.789-0912'), '123.456.789-09');
  assert.equal(mascararCnpj('12abc3'), '12.ABC.3');
  assert.equal(mascararCnpj('12ABC34501DE35XX'), '12.ABC.345/01DE-35');
  assert.equal(mascararCep('013101'), '01310-1');
  assert.equal(formatarCep('01310100'), '01310-100');
  assert.equal(documentoSemMascara('12.abc.345/01de-35'), '12ABC34501DE35');
});

test('formatarIntervalo e formatarEndereco', () => {
  assert.equal(formatarIntervalo({ de: '2026-02-01', ate: '2026-02-10' }), '01/02/2026 a 10/02/2026');
  assert.equal(formatarIntervalo({ de: '2026-02-01' }), 'a partir de 01/02/2026');
  assert.equal(formatarIntervalo(null), null);
  assert.equal(
    formatarEndereco({ cep: '01310100', logradouro: 'Av. Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' }),
    'Av. Paulista, 1000 - Bela Vista, São Paulo/SP, 01310-100',
  );
  assert.equal(formatarEndereco({ cidade: 'Recife' }), 'Recife');
  assert.equal(formatarEndereco({}), null);
});
