import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAnonimizarLead } from '../hooks/use-lgpd';
import { confirmacaoBate, resumoDaAnonimizacao, textoDeConfirmacao } from '../lib/lgpd';

const CONFIRMACAO_ID = 'anonimizar-confirmacao';
const AJUDA_ID = 'anonimizar-confirmacao-ajuda';

/** Montado só com o dialog aberto: cada abertura começa com o campo vazio. */
function FormAnonimizar({ lead, onAnonimizado }) {
  const [digitado, setDigitado] = useState('');
  const anonimizar = useAnonimizarLead();
  const esperado = textoDeConfirmacao(lead);
  const confere = confirmacaoBate(digitado, esperado);

  function handleSubmit(event) {
    event.preventDefault();
    if (!confere || anonimizar.isPending) {
      return;
    }
    anonimizar.mutate(lead.id, {
      onSuccess: (resultado) => onAnonimizado(resumoDaAnonimizacao(resultado)),
    });
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-2 text-sm">
        <p>
          <span className="font-medium">Sai de vez:</span> nome (vira "Lead anonimizado"), e-mail,
          telefone, empresa, cargo, CPF, CNPJ, endereço, CEP, os campos personalizados que
          identificam a pessoa e as notas das atividades.
        </p>
        <p>
          <span className="font-medium">Fica, para as estatísticas:</span> status, estágio, valor,
          origem, score, datas, responsável, cidade/UF, tags e o histórico (sem os valores
          pessoais).
        </p>
        <p>Os leads que foram mesclados neste também são anonimizados.</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={CONFIRMACAO_ID}>
          Para confirmar, digite <span className="font-mono">{esperado}</span>
        </Label>
        <Input
          aria-describedby={AJUDA_ID}
          autoComplete="off"
          autoFocus
          className="h-9 rounded-none"
          id={CONFIRMACAO_ID}
          onChange={(event) => {
            setDigitado(event.target.value);
            if (anonimizar.error) {
              anonimizar.reset();
            }
          }}
          value={digitado}
        />
        <p className="text-xs text-muted-foreground" id={AJUDA_ID}>
          Não tem volta: os dados apagados não podem ser recuperados pelo CRM.
        </p>
      </div>

      <ApiErrorAlert
        error={anonimizar.error}
        id="anonimizar-erro"
        title="Não foi possível anonimizar"
      />

      <DialogFooter>
        <DialogClose
          render={<Button disabled={anonimizar.isPending} type="button" variant="outline" />}
        >
          Cancelar
        </DialogClose>
        <Button
          aria-busy={anonimizar.isPending}
          disabled={!confere || anonimizar.isPending}
          type="submit"
          variant="destructive"
        >
          {anonimizar.isPending ? 'Anonimizando…' : 'Anonimizar de vez'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Anonimizar o lead a pedido do titular (LGPD, DONO/MASTER). Irreversível:
 * a trava é digitar o nome do lead. Depois, o lead é buscado de novo (o
 * hook invalida) e quem chamou mostra o resumo.
 *
 * @param {{
 *   lead: { id: string, nome?: string | null } | null,
 *   onOpenChange: (open: boolean) => void,
 *   onAnonimizado: (resumo: string) => void,
 * }} props aberto enquanto houver `lead`
 */
export function AnonimizarLeadDialog({ lead, onOpenChange, onAnonimizado }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(lead)}>
      <DialogContent className="rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Anonimizar lead</DialogTitle>
          <DialogDescription>
            Pedido do titular dos dados (LGPD). Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        {lead && (
          <FormAnonimizar
            key={lead.id}
            lead={lead}
            onAnonimizado={(resumo) => {
              onOpenChange(false);
              onAnonimizado(resumo);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
