import { CAMADA } from '../constants';
import { TIPO_COLUNA, lerValorDaColuna, lerValorDoCampo } from '../lib/colunas';
import { colunaDoItem } from '../lib/layout';
import { CelulaLead } from './celula-lead';

const GRUPOS = Object.freeze([
  { camada: CAMADA.CAMADA_1, titulo: 'Contato' },
  { camada: CAMADA.CAMADA_2, titulo: 'Dados adicionais' },
  { camada: CAMADA.CAMADA_3, titulo: 'Campos personalizados' },
]);

const COLUNA_VALOR = { id: 'valor', label: 'Valor', tipo: TIPO_COLUNA.MOEDA };
const COLUNA_RESPONSAVEL = {
  id: 'responsavel',
  label: 'Responsável',
  tipo: TIPO_COLUNA.RESPONSAVEL,
};
const COLUNAS_NEGOCIO = Object.freeze([COLUNA_VALOR, COLUNA_RESPONSAVEL]);

function Item({ label, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function Grupo({ titulo, children }) {
  return (
    <section className="grid gap-1">
      <h3 className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        {titulo}
      </h3>
      <dl className="divide-y divide-border border-y border-border">{children}</dl>
    </section>
  );
}

/** Seções do layout (`crm.layout`), na ordem; a automática ("Outros campos") vem no fim. */
function SecoesDoLayout({ lead, secoes, nomePorId }) {
  return secoes.map((secao) => (
    <Grupo key={secao.nome} titulo={secao.nome}>
      {secao.campos.map((item) => {
        const coluna = colunaDoItem(item);

        return (
          <Item key={item.ref} label={item.label}>
            <CelulaLead
              completo
              coluna={coluna}
              nomePorId={nomePorId}
              valor={lerValorDaColuna(lead, coluna)}
            />
          </Item>
        );
      })}
    </Grupo>
  ));
}

/** Sem layout: agrupado por camada. */
function GruposPorCamada({ lead, campos, nomePorId }) {
  return GRUPOS.map(({ camada, titulo }) => {
    const doGrupo = campos.filter((campo) => campo.camada === camada);
    if (doGrupo.length === 0) {
      return null;
    }

    return (
      <Grupo key={camada} titulo={titulo}>
        {doGrupo.map((campo) => (
          <Item key={campo.chave} label={campo.label}>
            <CelulaLead
              completo
              coluna={{ id: campo.chave, label: campo.label, tipo: campo.tipo, campo }}
              nomePorId={nomePorId}
              valor={lerValorDoCampo(lead, campo)}
            />
          </Item>
        ))}
      </Grupo>
    );
  });
}

/**
 * Lead em modo leitura. Com layout, pelas seções configuradas; sem, por
 * camada. A formatação é a mesma da tabela (`CelulaLead`), para o valor
 * nunca aparecer de dois jeitos. Valor e Responsável ficam em "Negócio",
 * a não ser que o layout já os tenha posto numa seção.
 *
 * @param {{
 *   lead: import('../types').Lead,
 *   campos: import('../types').Campo[],
 *   layout: import('../lib/layout').LayoutEfetivo | null,
 *   nomePorId: Map<string, string>,
 * }} props
 */
export function LeadDetalhe({ lead, campos, layout, nomePorId }) {
  const nasSecoes = new Set(
    (layout?.secoes ?? []).flatMap((secao) => secao.campos.map((item) => colunaDoItem(item).id)),
  );
  const negocio = COLUNAS_NEGOCIO.filter((coluna) => !nasSecoes.has(coluna.id));

  return (
    <div className="grid gap-6 px-4 pb-4">
      {layout ? (
        <SecoesDoLayout lead={lead} nomePorId={nomePorId} secoes={layout.secoes} />
      ) : (
        <GruposPorCamada campos={campos} lead={lead} nomePorId={nomePorId} />
      )}

      {negocio.length > 0 && (
        <Grupo titulo="Negócio">
          {negocio.map((coluna) => (
            <Item key={coluna.id} label={coluna.label}>
              <CelulaLead
                coluna={coluna}
                nomePorId={nomePorId}
                valor={lerValorDaColuna(lead, coluna)}
              />
            </Item>
          ))}
        </Grupo>
      )}

      <p className="font-mono text-[11px] text-muted-foreground">
        ID <span className="select-all">{lead.id}</span>
      </p>
    </div>
  );
}
