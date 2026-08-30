import { LoadingState } from '@/components/loading-state';
import { ApiErrorAlert } from '@/components/api-error-alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ROTULOS_TIPO } from '../../constants';
import { useCampos } from '../../hooks/use-campos';
import { useVersaoDoFormulario } from '../../hooks/use-formularios';
import { alvosDaVersao, descreverAlerta } from '../../lib/alertas-formulario';
import { OPCOES_POLITICA } from '../../lib/formularios';
import { SeloAlerta } from '../selo-alerta';
import { SeloSensivel } from '../selo-sensivel';

const ROTULO_POLITICA = new Map(OPCOES_POLITICA.map((opcao) => [opcao.valor, opcao.rotulo]));
const CAMPOS_VAZIOS = [];

/** Os alertas da versão (FM5): um link já enviado usa os da versão dele. */
function AlertasDaVersao({ versao }) {
  const campos = useCampos().data ?? CAMPOS_VAZIOS;
  const alertas = versao.alertas ?? [];
  if (alertas.length === 0) {
    return null;
  }
  const alvos = alvosDaVersao(versao, campos);

  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium text-muted-foreground">Alertas</p>
      <ul className="grid gap-1.5">
        {alertas.map((alerta, indice) => (
          <li
            className="grid gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            key={alerta.id ?? indice}
          >
            <span className="flex flex-wrap items-baseline gap-2">
              <SeloAlerta nivel={alerta.nivel} />
              <span className="font-medium">{alerta.texto}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Quando {descreverAlerta(alerta, alvos)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Conteudo({ formularioId, versaoId }) {
  const versaoQuery = useVersaoDoFormulario(formularioId, versaoId);

  if (versaoQuery.error) {
    return <ApiErrorAlert error={versaoQuery.error} id="formulario-previa-erro" />;
  }
  if (versaoQuery.isPending) {
    return (
      <div className="grid gap-2" aria-busy="true">
        <LoadingState label="Carregando versão…" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const versao = versaoQuery.data;

  return (
    <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
      {versao.introducao && <p className="text-sm whitespace-pre-wrap">{versao.introducao}</p>}
      {versao.secoes.map((secao, indice) => (
        <section className="grid gap-2" key={indice}>
          {secao.titulo && <h3 className="text-sm font-semibold">{secao.titulo}</h3>}
          <ul className="grid gap-1.5">
            {secao.itens.map((item) => {
              const pergunta = item.pergunta;
              const dados = pergunta ?? item.campo;
              const rotulo = pergunta ? pergunta.rotulo : item.campo.label;

              return (
                <li
                  className="grid gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  key={pergunta ? `pergunta-${pergunta.id}` : item.campoId}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      {rotulo}
                      {item.obrigatorio && (
                        <>
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                          <span className="sr-only">(obrigatório)</span>
                        </>
                      )}
                      <span className="ml-2 text-[11px] text-muted-foreground">
                        {ROTULOS_TIPO[dados.tipo] ?? dados.tipo}
                      </span>
                      {dados.sensivel && <SeloSensivel className="ml-2" />}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {pergunta
                        ? 'Pergunta do formulário'
                        : [ROTULO_POLITICA.get(item.politica), item.preencher && 'vem preenchido']
                            .filter(Boolean)
                            .join(' · ')}
                    </span>
                  </div>
                  {pergunta?.ajuda && (
                    <p className="text-xs text-muted-foreground">{pergunta.ajuda}</p>
                  )}
                  {pergunta?.opcoes?.length > 0 && (
                    <p className="text-xs text-muted-foreground">{pergunta.opcoes.join(' · ')}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <div className="grid gap-1">
        <p className="text-xs font-medium text-muted-foreground">Termo de aceite</p>
        <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm whitespace-pre-wrap">
          {versao.termo}
        </p>
      </div>
      <AlertasDaVersao versao={versao} />
    </div>
  );
}

/**
 * Prévia de uma versão publicada, só leitura. Os nomes são os do dia da
 * publicação: renomear o campo depois não muda a versão.
 *
 * @param {{
 *   formularioId: string,
 *   versao: { id: string, versao: number } | null,
 *   onFechar: () => void,
 * }} props aberto enquanto houver `versao`
 */
export function PreviaVersaoDialog({ formularioId, versao, onFechar }) {
  return (
    <Dialog onOpenChange={(aberto) => !aberto && onFechar()} open={Boolean(versao)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Versão {versao?.versao}</DialogTitle>
          <DialogDescription>Como a pessoa vai ver o formulário.</DialogDescription>
        </DialogHeader>
        {versao && <Conteudo formularioId={formularioId} versaoId={versao.id} />}
      </DialogContent>
    </Dialog>
  );
}
