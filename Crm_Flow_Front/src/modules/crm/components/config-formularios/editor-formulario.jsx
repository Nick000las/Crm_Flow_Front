import { Form } from '@/components/ui/form';
import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  VALIDADE,
  corpoDoPut,
  dadosDoForm,
  formularioMudou,
  itensIndisponiveis,
  rascunhoDoForm,
  situacaoDoFormulario,
  validarNoCliente,
} from '../../lib/formularios';
import { CampoForm } from '../campo-form';
import { ControleTravado } from '../controle-travado';
import { AlertasDoFormulario } from './alertas-do-formulario';
import { SecoesDoFormulario } from './secoes-do-formulario';
import { VersoesDoFormulario } from './versoes-do-formulario';

const MOTIVO_NADA_NOVO = 'A versão publicada já é igual ao rascunho.';
const LEGENDA = 'mb-3 text-sm font-semibold';
const SEM_ERROS = Object.freeze({ dados: {}, porItem: {}, porAlerta: {}, geral: null });

/**
 * Editor de um formulário: dados, perguntas (seções e campos), termo e
 * alertas (FM5, que precisam do schema em `campos`). Tudo é
 * rascunho até "Salvar"; publicar grava uma versão nova a partir do salvo.
 * Montado com a `key` do `atualizadoEm`: depois de salvar, recomeça da resposta.
 *
 * @param {{
 *   detalhe: import('../../lib/formularios').DetalheDoFormulario,
 *   elegiveis: import('../../lib/formularios').CampoElegivel[],
 *   campos: import('../../types').Campo[],
 *   falha: {
 *     error: unknown,
 *     publicando: boolean,
 *     erros: import('../../lib/formularios').ErrosDoFormulario,
 *   } | null,
 *   ocupado: boolean,
 *   nomePorId: Map<string, string>,
 *   onGravar: (pedido: {
 *     corpo: object | null,
 *     rascunho: import('../../lib/formularios').RascunhoNoForm,
 *     publicarDepois: boolean,
 *   }) => void,
 *   onMudou: () => void,
 *   onVoltar: () => void,
 * }} props
 */
export function EditorFormulario({
  detalhe,
  elegiveis,
  campos,
  falha,
  ocupado,
  nomePorId,
  onGravar,
  onMudou,
  onVoltar,
}) {
  const [dados, setDados] = useState(() => dadosDoForm(detalhe));
  const [rascunho, setRascunho] = useState(() => rascunhoDoForm(detalhe.rascunho, campos));
  const [errosLocais, setErrosLocais] = useState(SEM_ERROS);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const inicial = useMemo(
    () => corpoDoPut(dadosDoForm(detalhe), rascunhoDoForm(detalhe.rascunho, campos), campos),
    [detalhe, campos],
  );
  const corpo = corpoDoPut(dados, rascunho, campos);
  const mudou = formularioMudou(inicial, corpo);
  const indisponiveis = itensIndisponiveis(rascunho, elegiveis);
  const situacao = situacaoDoFormulario(detalhe);
  const nadaNovo = !mudou && Boolean(detalhe.versaoAtual) && !detalhe.alteracoesNaoPublicadas;
  const erros = falha?.erros;
  const erroDe = (campo) => errosLocais.dados[campo] ?? erros?.dados[campo] ?? null;

  function limpar() {
    setErrosLocais(SEM_ERROS);
    onMudou();
  }

  function mudarDado(campo, valor) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    limpar();
  }

  function mudarRascunho(proximo) {
    setRascunho(proximo);
    limpar();
  }

  function gravar(publicarDepois) {
    const validacao = validarNoCliente(dados, rascunho, elegiveis, campos);
    if (
      Object.keys(validacao.dados).length > 0 ||
      Object.keys(validacao.porItem).length > 0 ||
      Object.keys(validacao.porAlerta).length > 0 ||
      validacao.geral
    ) {
      setErrosLocais(validacao);
      return;
    }
    onGravar({ corpo: mudou ? corpo : null, rascunho, publicarDepois });
  }

  function voltar() {
    if (mudou) {
      setConfirmandoSaida(true);
    } else {
      onVoltar();
    }
  }

  return (
    <Form
      className="grid gap-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        gravar(false);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button onClick={voltar} type="button" variant="ghost">
            <ArrowLeft aria-hidden="true" />
            Formulários
          </Button>
          <p className="truncate text-sm">
            <span className="font-medium">{detalhe.nome}</span>
            <span className="ml-2 text-muted-foreground">
              {situacao.rotulo}
              {situacao.versao !== null && (
                <span className="ml-1.5 text-xs">v{situacao.versao}</span>
              )}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            aria-busy={ocupado}
            disabled={!mudou || ocupado}
            type="submit"
            variant="outline"
            loading={ocupado}
          >
            Salvar
          </Button>
          <ControleTravado
            motivo={nadaNovo ? MOTIVO_NADA_NOVO : null}
            motivoId="formulario-publicar-motivo"
          >
            <Button
              aria-busy={ocupado}
              aria-describedby={nadaNovo ? 'formulario-publicar-motivo' : undefined}
              className={nadaNovo ? 'pointer-events-none' : undefined}
              disabled={nadaNovo || ocupado}
              onClick={() => gravar(true)}
              type="button"
              loading={ocupado}
            >
              {mudou ? 'Salvar e publicar' : 'Publicar'}
            </Button>
          </ControleTravado>
        </div>
      </div>

      {errosLocais.geral && (
        <p className="border border-destructive/30 px-3 py-2 text-sm text-destructive" role="alert">
          {errosLocais.geral}
        </p>
      )}
      <ApiErrorAlert
        error={falha?.error}
        id="formulario-gravar-erro"
        title={falha?.publicando ? 'Não foi possível publicar' : 'Não foi possível salvar'}
      />
      {erros?.outros.length > 0 && (
        <ul className="grid gap-1 text-sm text-destructive">
          {erros.outros.map((mensagem) => (
            <li key={mensagem}>{mensagem}</li>
          ))}
        </ul>
      )}

      <fieldset className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        <legend className={`${LEGENDA} px-1`}>Dados</legend>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <CampoForm erro={erroDe('nome')} id="formulario-nome" label="Nome" obrigatorio>
            {(controle) => (
              <Input
                {...controle}
                className="h-9"
                onChange={(event) => mudarDado('nome', event.target.value)}
                value={dados.nome}
              />
            )}
          </CampoForm>
          <CampoForm
            erro={erroDe('validadeDias')}
            id="formulario-validade"
            label="Validade do link (dias)"
            obrigatorio
          >
            {(controle) => (
              <Input
                {...controle}
                className="h-9 w-32 tabular-nums"
                inputMode="numeric"
                max={VALIDADE.MAXIMO}
                min={VALIDADE.MINIMO}
                onChange={(event) => mudarDado('validadeDias', event.target.value)}
                type="number"
                value={dados.validadeDias}
              />
            )}
          </CampoForm>
        </div>
        <CampoForm erro={erroDe('descricao')} id="formulario-descricao" label="Descrição">
          {(controle) => (
            <Textarea
              {...controle}
              onChange={(event) => mudarDado('descricao', event.target.value)}
              rows={2}
              value={dados.descricao}
            />
          )}
        </CampoForm>
        <div className="flex items-center gap-3">
          <Switch
            aria-describedby="formulario-ativo-ajuda"
            checked={dados.ativo}
            id="formulario-ativo"
            onCheckedChange={(ativo) => mudarDado('ativo', ativo)}
          />
          <Label htmlFor="formulario-ativo">Ativo</Label>
          <span className="text-xs text-muted-foreground" id="formulario-ativo-ajuda">
            Inativo, o formulário fica guardado, mas não é oferecido para envio.
          </span>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        <legend className={`${LEGENDA} px-1`}>Perguntas</legend>
        <CampoForm
          ajuda="Aparece antes das perguntas."
          erro={erros?.introducao}
          id="formulario-introducao"
          label="Introdução"
        >
          {(controle) => (
            <Textarea
              {...controle}
              onChange={(event) => mudarRascunho({ ...rascunho, introducao: event.target.value })}
              rows={3}
              value={rascunho.introducao}
            />
          )}
        </CampoForm>

        <SecoesDoFormulario
          elegiveis={elegiveis}
          erroDasSecoes={erros?.secoes ?? null}
          errosPorItem={{ ...erros?.porItem, ...errosLocais.porItem }}
          errosPorSecao={erros?.porSecao ?? {}}
          indisponiveis={indisponiveis}
          onChange={mudarRascunho}
          rascunho={rascunho}
        />

        <CampoForm
          ajuda="Obrigatório para publicar. A pessoa aceita este texto antes de enviar."
          erro={erros?.termo}
          id="formulario-termo"
          label="Termo de aceite"
        >
          {(controle) => (
            <Textarea
              {...controle}
              onChange={(event) => mudarRascunho({ ...rascunho, termo: event.target.value })}
              placeholder="Ex.: Autorizo o uso dos meus dados para o atendimento."
              rows={4}
              value={rascunho.termo}
            />
          )}
        </CampoForm>
      </fieldset>

      <AlertasDoFormulario
        campos={campos}
        erroGeral={erros?.alertas ?? null}
        errosPorAlerta={{ ...erros?.porAlerta, ...errosLocais.porAlerta }}
        onChange={mudarRascunho}
        rascunho={rascunho}
      />

      <VersoesDoFormulario formulario={detalhe} nomePorId={nomePorId} />

      <AlertDialog onOpenChange={setConfirmandoSaida} open={confirmandoSaida}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações deste formulário ainda não foram salvas e serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={onVoltar} variant="destructive">
              Descartar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
