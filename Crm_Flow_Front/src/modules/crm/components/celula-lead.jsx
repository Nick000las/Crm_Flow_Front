import { TIPOS_CAMPO } from '../constants';
import { TIPO_COLUNA } from '../lib/colunas';
import { formatarData, formatarMoeda, formatarNumero } from '../lib/formatadores';
import { rotuloOpcao } from '../lib/rotulos';
import { OpcaoBadge } from './opcao-badge';

const MAX_BADGES = 2;
const TAMANHO_ID_CURTO = 8;
const DADO = 'font-mono text-xs tabular-nums';

function Vazio() {
  return (
    <>
      <span className="text-muted-foreground" aria-hidden="true">
        —
      </span>
      <span className="sr-only">Sem valor</span>
    </>
  );
}

function Opcoes({ valores, campo }) {
  const visiveis = valores.slice(0, MAX_BADGES);
  const restantes = valores.length - visiveis.length;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {visiveis.map((valor) => (
        <OpcaoBadge key={valor} rotulo={rotuloOpcao(valor, campo)} valor={valor} />
      ))}
      {restantes > 0 && (
        <span className={`${DADO} text-muted-foreground`} title={valores.slice(MAX_BADGES).join(', ')}>
          +{restantes}
        </span>
      )}
    </span>
  );
}

function Responsavel({ id, nomePorId }) {
  const nome = nomePorId.get(id);
  if (nome) return nome;

  // Sem `/crm/usuarios` (ou usuário removido), o ID curto ainda identifica.
  return (
    <span className={`${DADO} text-muted-foreground`} title={id}>
      {id.slice(0, TAMANHO_ID_CURTO)}
    </span>
  );
}

/**
 * Valor de uma célula, renderizado pelo tipo da coluna.
 *
 * @param {{
 *   coluna: import('../lib/colunas').Coluna,
 *   valor: unknown,
 *   nomePorId: Map<string, string>,
 * }} props
 */
export function CelulaLead({ coluna, valor, nomePorId }) {
  if (valor === null || valor === undefined || valor === '') return <Vazio />;

  switch (coluna.tipo) {
    case TIPO_COLUNA.MOEDA:
      return <span className={DADO}>{formatarMoeda(valor) ?? '—'}</span>;
    case TIPO_COLUNA.RESPONSAVEL:
      return <Responsavel id={String(valor)} nomePorId={nomePorId} />;
    case TIPOS_CAMPO.NUMERO:
      return <span className={DADO}>{formatarNumero(valor) ?? '—'}</span>;
    case TIPOS_CAMPO.DATA:
      return <span className={DADO}>{formatarData(valor) ?? '—'}</span>;
    case TIPOS_CAMPO.BOOLEANO:
      return valor ? 'Sim' : 'Não';
    case TIPOS_CAMPO.SELECAO:
      return <OpcaoBadge rotulo={rotuloOpcao(valor, coluna.campo)} valor={String(valor)} />;
    case TIPOS_CAMPO.SELECAO_MULTIPLA:
      return Array.isArray(valor) && valor.length > 0 ? (
        <Opcoes campo={coluna.campo} valores={valor} />
      ) : (
        <Vazio />
      );
    default:
      return String(valor);
  }
}
