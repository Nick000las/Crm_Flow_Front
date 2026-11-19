import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LIMITES_ALERTA,
  OPCOES_NIVEL,
  alertaNovo,
  alvosDoRascunho,
} from '../../lib/alertas-formulario';
import { CampoForm } from '../campo-form';
import { CondicaoDeCampo } from '../condicao-de-campo';
import { ControleTravado } from '../controle-travado';
import { SelectSimples } from '../select-simples';

const SEM_ERROS = Object.freeze({});
const MOTIVO_SEM_ALVO = 'Ponha um campo ou uma pergunta salva no formulário para criar um alerta.';
const MOTIVO_LIMITE = `O limite é de ${LIMITES_ALERTA.POR_FORMULARIO} alertas por formulário.`;

/**
 * "Quando [campo ou pergunta] [operador] [valor], mostrar [nível]: [texto]".
 *
 * @param {{
 *   alerta: import('../../lib/alertas-formulario').AlertaNoForm,
 *   numero: number,
 *   alvos: import('../../lib/alertas-formulario').AlvoDoAlerta[],
 *   erros: import('../../lib/alertas-formulario').ErrosDoAlerta,
 *   onChange: (alerta: import('../../lib/alertas-formulario').AlertaNoForm) => void,
 *   onRemover: () => void,
 * }} props
 */
function LinhaDoAlerta({ alerta, numero, alvos, erros, onChange, onRemover }) {
  const idBase = `alerta-${alerta.chaveLocal}`;

  return (
    <li className="grid gap-3 border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Alerta {numero}</p>
        <Button
          className="rounded-none"
          onClick={onRemover}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
          Remover
          <span className="sr-only"> o alerta {numero}</span>
        </Button>
      </div>
      <CondicaoDeCampo
        campos={alvos}
        condicao={alerta.condicao}
        erros={erros}
        idBase={idBase}
        onChange={(condicao) => onChange({ ...alerta, condicao })}
        rotuloCampo="Quando"
      />
      <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <CampoForm erro={erros.nivel} id={`${idBase}-nivel`} label="Mostrar">
          {(controle) => (
            <SelectSimples
              {...controle}
              onChange={(nivel) => nivel && onChange({ ...alerta, nivel })}
              opcoes={OPCOES_NIVEL}
              value={alerta.nivel}
            />
          )}
        </CampoForm>
        <CampoForm
          ajuda={`${alerta.texto.trim().length}/${LIMITES_ALERTA.TEXTO}`}
          erro={erros.texto}
          id={`${idBase}-texto`}
          label="Texto do alerta"
          obrigatorio
        >
          {(controle) => (
            <Input
              {...controle}
              className="h-9 rounded-none"
              maxLength={LIMITES_ALERTA.TEXTO + 50}
              onChange={(event) => onChange({ ...alerta, texto: event.target.value })}
              placeholder="Ex.: Alergia a dipirona"
              value={alerta.texto}
            />
          )}
        </CampoForm>
      </div>
    </li>
  );
}

/**
 * Alertas do formulário (FM5): quando a resposta casa com a condição, a pessoa
 * ganha um alerta no topo da ficha e um selo no card. Vão junto com o rascunho
 * no "Salvar" e com a versão no "Publicar".
 *
 * @param {{
 *   rascunho: import('../../lib/formularios').RascunhoNoForm,
 *   campos: import('../../types').Campo[],
 *   errosPorAlerta: Record<string, import('../../lib/alertas-formulario').ErrosDoAlerta>,
 *   erroGeral: string | null,
 *   onChange: (rascunho: import('../../lib/formularios').RascunhoNoForm) => void,
 * }} props
 */
export function AlertasDoFormulario({ rascunho, campos, errosPorAlerta, erroGeral, onChange }) {
  const alvos = alvosDoRascunho(rascunho, campos);
  const perguntasNovas = rascunho.secoes
    .flatMap((secao) => secao.itens)
    .some((item) => 'pergunta' in item && !item.pergunta.id);
  const motivo =
    alvos.length === 0
      ? MOTIVO_SEM_ALVO
      : rascunho.alertas.length >= LIMITES_ALERTA.POR_FORMULARIO
        ? MOTIVO_LIMITE
        : null;

  const trocar = (chaveLocal, proximo) =>
    onChange({
      ...rascunho,
      alertas: rascunho.alertas.map((alerta) =>
        alerta.chaveLocal === chaveLocal ? proximo : alerta,
      ),
    });

  return (
    <fieldset className="grid gap-4 border border-border p-4">
      <legend className="mb-3 px-1 text-sm font-semibold">Alertas</legend>
      <p className="text-sm text-muted-foreground">
        Quando a resposta casar com a condição, a pessoa ganha um alerta no topo da ficha e um selo
        no card, até cada usuário marcar como visto.
        {perguntasNovas && ' Pergunta nova só entra num alerta depois de salvar o formulário.'}
      </p>
      {erroGeral && (
        <p className="text-sm text-destructive" role="alert">
          {erroGeral}
        </p>
      )}

      {rascunho.alertas.length > 0 && (
        <ol className="grid gap-3">
          {rascunho.alertas.map((alerta, indice) => (
            <LinhaDoAlerta
              alerta={alerta}
              alvos={alvos}
              erros={errosPorAlerta[alerta.chaveLocal] ?? SEM_ERROS}
              key={alerta.chaveLocal}
              numero={indice + 1}
              onChange={(proximo) => trocar(alerta.chaveLocal, proximo)}
              onRemover={() =>
                onChange({
                  ...rascunho,
                  alertas: rascunho.alertas.filter(
                    (atual) => atual.chaveLocal !== alerta.chaveLocal,
                  ),
                })
              }
            />
          ))}
        </ol>
      )}

      <div>
        <ControleTravado motivo={motivo} motivoId="formulario-alerta-motivo">
          <Button
            aria-describedby={motivo ? 'formulario-alerta-motivo' : undefined}
            className={motivo ? 'pointer-events-none rounded-none' : 'rounded-none'}
            disabled={Boolean(motivo)}
            onClick={() =>
              onChange({
                ...rascunho,
                alertas: [...rascunho.alertas, alertaNovo(rascunho.sequencia)],
                sequencia: rascunho.sequencia + 1,
              })
            }
            type="button"
            variant="outline"
          >
            <Plus aria-hidden="true" />
            Adicionar alerta
          </Button>
        </ControleTravado>
      </div>
    </fieldset>
  );
}
