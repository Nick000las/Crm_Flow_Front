import { TIPOS_CAMPO } from '../constants';
import { TIPO_COLUNA } from '../lib/colunas';
import {
  formatarData,
  formatarMoeda,
  formatarNumero,
  formatarTelefone,
  urlSegura,
} from '../lib/formatadores';
import { opcaoDoCampo } from '../lib/opcoes';
import { OpcaoBadge } from './opcao-badge';

const MAX_BADGES = 2;
const TAMANHO_ID_CURTO = 8;
const DADO = 'font-mono text-xs tabular-nums';
const LINK = 'underline-offset-4 outline-none hover:underline focus-visible:underline';

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
        <OpcaoBadge key={valor} opcao={opcaoDoCampo(campo, valor)} />
      ))}
      {restantes > 0 && (
        <span className={`${DADO} text-muted-foreground`} title={valores.slice(MAX_BADGES).map((valor) => opcaoDoCampo(campo, valor).label).join(', ')}>
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

/** Só http/https vira link; o resto aparece como texto (nunca num `href`). */
function Url({ valor }) {
  const href = urlSegura(valor);
  if (!href) return String(valor);

  return (
    <a className={`${LINK} break-all`} href={href} rel="noopener noreferrer" target="_blank">
      {String(valor)}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

/**
 * Valor de uma célula, renderizado pelo tipo da coluna. `completo` (ficha)
 * mostra o texto longo inteiro; na tabela ele fica em uma linha. `semLink`
 * evita link dentro de link quando a célula já está no link do lead.
 *
 * @param {{
 *   coluna: import('../lib/colunas').Coluna,
 *   valor: unknown,
 *   nomePorId: Map<string, string>,
 *   completo?: boolean,
 *   semLink?: boolean,
 * }} props
 */
export function CelulaLead({ coluna, valor, nomePorId, completo = false, semLink = false }) {
  if (valor === null || valor === undefined || valor === '') return <Vazio />;

  switch (coluna.tipo) {
    case TIPO_COLUNA.MOEDA:
    case TIPOS_CAMPO.MONETARIO:
      return <span className={DADO}>{formatarMoeda(valor) ?? '—'}</span>;
    case TIPO_COLUNA.RESPONSAVEL:
      return <Responsavel id={String(valor)} nomePorId={nomePorId} />;
    case TIPOS_CAMPO.NUMERO:
      return <span className={DADO}>{formatarNumero(valor) ?? '—'}</span>;
    case TIPOS_CAMPO.DATA:
      return <span className={DADO}>{formatarData(valor) ?? '—'}</span>;
    case TIPOS_CAMPO.BOOLEANO:
      return valor ? 'Sim' : 'Não';
    case TIPOS_CAMPO.TELEFONE:
      return <span className={DADO}>{formatarTelefone(valor)}</span>;
    case TIPOS_CAMPO.EMAIL:
      return semLink ? (
        String(valor)
      ) : (
        <a className={`${LINK} break-all`} href={`mailto:${String(valor)}`}>
          {String(valor)}
        </a>
      );
    case TIPOS_CAMPO.URL:
      return semLink ? String(valor) : <Url valor={valor} />;
    case TIPOS_CAMPO.TEXTO_LONGO:
      return completo ? (
        <span className="whitespace-pre-wrap">{String(valor)}</span>
      ) : (
        <span className="line-clamp-1" title={String(valor)}>
          {String(valor)}
        </span>
      );
    case TIPOS_CAMPO.SELECAO:
      return <OpcaoBadge opcao={opcaoDoCampo(coluna.campo, valor)} />;
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
