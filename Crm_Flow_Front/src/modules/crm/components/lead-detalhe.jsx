import { CAMADA } from '../constants';
import { TIPO_COLUNA, lerValorDoCampo } from '../lib/colunas';
import { CelulaLead } from './celula-lead';

const GRUPOS = Object.freeze([
  { camada: CAMADA.CAMADA_1, titulo: 'Contato' },
  { camada: CAMADA.CAMADA_2, titulo: 'Dados adicionais' },
  { camada: CAMADA.CAMADA_3, titulo: 'Campos personalizados' },
]);

const COLUNA_VALOR = { id: 'valor', label: 'Valor', tipo: TIPO_COLUNA.MOEDA };
const COLUNA_RESPONSAVEL = { id: 'responsavel', label: 'Responsável', tipo: TIPO_COLUNA.RESPONSAVEL };

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

/**
 * Lead em modo leitura, agrupado por camada. A formatação é a mesma da
 * tabela (`CelulaLead`), para o valor nunca aparecer de dois jeitos.
 *
 * @param {{
 *   lead: import('../types').Lead,
 *   campos: import('../types').Campo[],
 *   nomePorId: Map<string, string>,
 * }} props
 */
export function LeadDetalhe({ lead, campos, nomePorId }) {
  return (
    <div className="grid gap-6 px-4 pb-4">
      {GRUPOS.map(({ camada, titulo }) => {
        const doGrupo = campos.filter((campo) => campo.camada === camada);
        if (doGrupo.length === 0) return null;

        return (
          <Grupo key={camada} titulo={titulo}>
            {doGrupo.map((campo) => (
              <Item key={campo.chave} label={campo.label}>
                <CelulaLead
                  coluna={{ id: campo.chave, label: campo.label, tipo: campo.tipo, campo }}
                  nomePorId={nomePorId}
                  valor={lerValorDoCampo(lead, campo)}
                />
              </Item>
            ))}
          </Grupo>
        );
      })}

      <Grupo titulo="Negócio">
        <Item label={COLUNA_VALOR.label}>
          <CelulaLead coluna={COLUNA_VALOR} nomePorId={nomePorId} valor={lead.valor} />
        </Item>
        <Item label={COLUNA_RESPONSAVEL.label}>
          <CelulaLead
            coluna={COLUNA_RESPONSAVEL}
            nomePorId={nomePorId}
            valor={lead.usuario_responsavel_id}
          />
        </Item>
      </Grupo>

      <p className="font-mono text-[11px] text-muted-foreground">
        ID <span className="select-all">{lead.id}</span>
      </p>
    </div>
  );
}
