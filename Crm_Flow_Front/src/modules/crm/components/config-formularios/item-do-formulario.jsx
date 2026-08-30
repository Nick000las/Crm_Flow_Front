/**
 * @file Um item do formulário: campo do CRM (a resposta grava na pessoa) ou pergunta do
 * formulário (a resposta fica só no formulário), marcado de forma visível. `indisponivel`: o
 * campo foi desligado ou removido, e o back recusa salvar.
 */
import { Pencil, Trash2 } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { ROTULOS_TIPO } from '../../constants';
import { ehPergunta, MENSAGENS_FORMULARIO, OPCOES_POLITICA } from '../../lib/formularios';
import { BotaoIcone } from '../botao-icone';
import { ControleTravado } from '../controle-travado';
import { BotoesOrdem } from '../ordenavel/botoes-ordem';
import { PuxadorOrdem } from '../ordenavel/puxador-ordem';
import { useLinhaOrdenavel } from '../ordenavel/use-linha-ordenavel';
import { SelectSimples } from '../select-simples';
import { SeloSensivel } from '../selo-sensivel';

const MARCA =
  'rounded-md border border-border bg-surface px-1.5 text-[11px] text-muted-foreground uppercase';

/** Um interruptor com rótulo, no tamanho pequeno da linha. */
function Interruptor({ id, rotulo, checked, disabled = false, onChange, describedBy }) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        aria-describedby={describedBy}
        checked={checked}
        className={disabled ? 'pointer-events-none' : undefined}
        disabled={disabled}
        id={id}
        onCheckedChange={onChange}
        size="sm"
      />
      <Label className="text-xs font-normal" htmlFor={id}>
        {rotulo}
      </Label>
    </div>
  );
}

/**
 * Um item do formulário: campo do CRM (a resposta grava na pessoa) ou pergunta
 * do formulário (a resposta fica só no formulário), marcado de forma visível.
 * `indisponivel`: o campo foi desligado ou removido, e o back recusa salvar.
 *
 * @param {{
 *   item: import('../../lib/formularios').ItemDoFormulario,
 *   campo: import('../../lib/formularios').CampoElegivel | undefined,
 *   rotulo: string,
 *   secao: string,
 *   secoes: { valor: string, rotulo: string }[],
 *   indice: number,
 *   total: number,
 *   indisponivel: boolean,
 *   erros: import('../../lib/formularios').ErrosDoItem | undefined,
 *   onAlterar: (mudancas: Record<string, unknown>) => void,
 *   onEditarPergunta: () => void,
 *   onMover: (destino: { secao: string, indice: number }) => void,
 *   onRemover: () => void,
 * }} props
 */
export function ItemDoFormulario({
  item,
  campo,
  rotulo,
  secao,
  secoes,
  indice,
  total,
  indisponivel,
  erros,
  onAlterar,
  onEditarPergunta,
  onMover,
  onRemover,
}) {
  const { linha, puxador } = useLinhaOrdenavel(item.chaveLocal, false);
  const pergunta = ehPergunta(item) ? item.pergunta : null;
  const idBase = `formulario-item-${item.chaveLocal.replace(/[^\w-]/g, '-')}`;
  const mensagens = [
    indisponivel ? 'Este campo foi desligado ou removido. Tire-o para salvar.' : null,
    erros?.campo,
    erros?.preencher,
    erros?.pergunta,
    erros?.item,
  ].filter(Boolean);
  const tipo = pergunta?.tipo ?? campo?.tipo;
  const sensivel = pergunta?.sensivel ?? campo?.sensivel;
  // Desligar continua possível: senão o campo que virou sensível travaria o salvar.
  const motivoPreencher =
    campo && !pergunta && campo.podePreencher === false && !item.preencher
      ? MENSAGENS_FORMULARIO.SEM_PREENCHER
      : null;

  return (
    <li
      {...linha}
      aria-label={rotulo}
      className={cn(
        'grid gap-2 border border-border bg-background p-2 text-sm',
        mensagens.length > 0 && 'border-destructive/50',
        linha.className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PuxadorOrdem {...puxador} rotulo={rotulo} />
        <div className="min-w-40 flex-1">
          <span className={MARCA}>{pergunta ? 'Pergunta do formulário' : 'Campo do CRM'}</span>
          <span className={cn('ml-2 font-medium', !campo && !pergunta && 'text-muted-foreground')}>
            {rotulo}
          </span>
          {tipo && (
            <span className="ml-2 text-[11px] text-muted-foreground">
              {ROTULOS_TIPO[tipo] ?? tipo}
            </span>
          )}
          {sensivel && <SeloSensivel className="ml-2" />}
          {pergunta?.ajuda.trim() && (
            <span className="mt-0.5 block text-xs text-muted-foreground">{pergunta.ajuda}</span>
          )}
        </div>
        <BotoesOrdem
          desabilitado={false}
          indice={indice}
          onMover={(_de, para) => onMover({ secao, indice: para })}
          rotulo={rotulo}
          total={total}
        />
        {pergunta && (
          <BotaoIcone
            icone={Pencil}
            onClick={onEditarPergunta}
            rotulo={`Editar a pergunta ${rotulo}`}
          />
        )}
        <BotaoIcone
          icone={Trash2}
          variant="destructive"
          onClick={onRemover}
          rotulo={`Tirar ${rotulo} do formulário`}
        />
      </div>

      {(campo || pergunta) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-9">
          <Interruptor
            checked={item.obrigatorio}
            id={`${idBase}-obrigatorio`}
            onChange={(obrigatorio) => onAlterar({ obrigatorio })}
            rotulo="Obrigatório neste formulário"
          />
          {pergunta ? (
            <Interruptor
              checked={pergunta.sensivel}
              id={`${idBase}-sensivel`}
              onChange={(marcado) => onAlterar({ pergunta: { ...pergunta, sensivel: marcado } })}
              rotulo="Sensível"
            />
          ) : (
            <>
              <ControleTravado motivo={motivoPreencher} motivoId={`${idBase}-preencher-motivo`}>
                <Interruptor
                  checked={item.preencher}
                  describedBy={motivoPreencher ? `${idBase}-preencher-motivo` : undefined}
                  disabled={Boolean(motivoPreencher)}
                  id={`${idBase}-preencher`}
                  onChange={(preencher) => onAlterar({ preencher })}
                  rotulo="Vem preenchido"
                />
              </ControleTravado>
              <SelectSimples
                aria-label={`Ao responder ${rotulo}`}
                className="h-8 w-56 text-xs"
                onChange={(politica) => politica && onAlterar({ politica })}
                opcoes={OPCOES_POLITICA}
                value={item.politica}
              />
            </>
          )}
          {secoes.length > 1 && (
            <SelectSimples
              aria-label={`Seção de ${rotulo}`}
              className="h-8 w-44 text-xs"
              onChange={(destino) =>
                destino && destino !== secao && onMover({ secao: destino, indice: Infinity })
              }
              opcoes={secoes}
              value={secao}
            />
          )}
        </div>
      )}

      {mensagens.map((mensagem) => (
        <p className="pl-9 text-xs text-destructive" key={mensagem} role="alert">
          {mensagem}
        </p>
      ))}
    </li>
  );
}
