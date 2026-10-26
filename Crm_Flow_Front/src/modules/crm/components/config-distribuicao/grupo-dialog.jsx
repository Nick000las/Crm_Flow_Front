import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { getFieldError } from '@/services/api';
import { useCriarGrupo, useEditarGrupo } from '../../hooks/use-distribuicao';
import { MENSAGENS_DISTRIBUICAO } from '../../lib/distribuicao';
import { CampoForm } from '../campo-form';

const CAMPOS_DO_SERVIDOR = ['nome', 'membros'];

/** Montado só com o dialog aberto: cada abertura parte do grupo atual. */
function FormGrupo({ grupo, usuarios, onSalvo }) {
  const editando = Boolean(grupo);
  const [nome, setNome] = useState(grupo?.nome ?? '');
  // Membro desativado some da lista de usuários ativos: não volta marcado.
  const [membros, setMembros] = useState(() =>
    (grupo?.membros ?? []).filter((id) => usuarios.some((usuario) => usuario.id === id)),
  );
  const [erroNome, setErroNome] = useState(null);
  const criar = useCriarGrupo();
  const editar = useEditarGrupo();
  const mutacao = editando ? editar : criar;

  const erroDe = (campo) => (mutacao.error ? getFieldError(mutacao.error, campo) : null);
  const erroSemCampo = mutacao.error && !CAMPOS_DO_SERVIDOR.some((campo) => erroDe(campo));

  function limparErros() {
    setErroNome(null);
    if (mutacao.error) mutacao.reset();
  }

  function alternar(id, marcado) {
    setMembros((atuais) => (marcado ? [...atuais, id] : atuais.filter((atual) => atual !== id)));
    limparErros();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!nome.trim()) {
      setErroNome(MENSAGENS_DISTRIBUICAO.NOME_GRUPO);
      return;
    }
    const corpo = { nome: nome.trim(), membros };
    if (editando) editar.mutate({ id: grupo.id, grupo: corpo }, { onSuccess: onSalvo });
    else criar.mutate(corpo, { onSuccess: onSalvo });
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      {/* 409 de nome repetido chega em `fields.nome`. */}
      <CampoForm erro={erroNome ?? erroDe('nome')} id="grupo-nome" label="Nome" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus
            className="h-9 rounded-none"
            onChange={(event) => {
              setNome(event.target.value);
              limparErros();
            }}
            placeholder="Ex.: Vendas SP"
            value={nome}
          />
        )}
      </CampoForm>

      <CampoForm comoGrupo erro={erroDe('membros')} id="grupo-membros" label="Membros">
        {() =>
          usuarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário ativo.</p>
          ) : (
            <div className="grid max-h-64 gap-2 overflow-y-auto border border-border p-2 sm:grid-cols-2">
              {usuarios.map((usuario) => {
                const id = `grupo-membro-${usuario.id}`;
                return (
                  <label className="flex items-center gap-2 text-sm" htmlFor={id} key={usuario.id}>
                    <Checkbox
                      checked={membros.includes(usuario.id)}
                      id={id}
                      onCheckedChange={(marcado) => alternar(usuario.id, Boolean(marcado))}
                    />
                    {usuario.nome}
                  </label>
                );
              })}
            </div>
          )
        }
      </CampoForm>
      <p className="-mt-2 text-xs text-muted-foreground">
        Os leads do grupo vão para os membros ativos em rodízio. Sem membro ativo, a regra é pulada e vale a próxima.
      </p>

      {erroSemCampo && <ApiErrorAlert error={mutacao.error} id="grupo-erro" title="Não foi possível salvar o grupo" />}

      <DialogFooter>
        <DialogClose render={<Button disabled={mutacao.isPending} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button aria-busy={mutacao.isPending} disabled={mutacao.isPending} type="submit">
          {mutacao.isPending ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar grupo'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Criar ou editar um grupo de distribuição. Salva na hora (não faz parte do
 * rascunho das regras).
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   grupo?: import('../../api/distribuicao.api').GrupoDistribuicao | null,
 *   usuarios: { id: string, nome: string }[],
 *   onSalvo: (grupo: import('../../api/distribuicao.api').GrupoDistribuicao) => void,
 * }} props
 */
export function GrupoDialog({ open, onOpenChange, grupo, usuarios, onSalvo }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{grupo ? 'Editar grupo' : 'Novo grupo'}</DialogTitle>
          <DialogDescription>Um grupo pode ser o destino de uma regra de distribuição.</DialogDescription>
        </DialogHeader>
        {open && (
          <FormGrupo
            grupo={grupo}
            key={grupo?.id ?? 'novo'}
            onSalvo={(salvo) => {
              onOpenChange(false);
              onSalvo(salvo);
            }}
            usuarios={usuarios}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
