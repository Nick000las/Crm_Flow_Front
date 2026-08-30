import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { toApiError } from '@/services/api';
import { LIMITES_LAYOUT } from '../../constants';
import { useSalvarMeu, useSalvarPadrao } from '../../hooks/use-layout';
import {
  MODO,
  errosPorParte,
  layoutParaEnvio,
  parcialDoMeu,
  validarLayout,
} from '../../lib/layout';
import { CampoForm } from '../campo-form';
import { SelectSimples } from '../select-simples';
import { EditorSecoes } from './editor-secoes';
import { SeletorOrdenado } from './seletor-ordenado';

/**
 * O editor de um modo ("Padrão da empresa" ou "Só para mim"). Montado com
 * `key` pela base: depois de salvar, a resposta do back vira a base nova e
 * o formulário recomeça limpo a partir dela.
 *
 * @param {{
 *   modo: 'padrao' | 'meu',
 *   base: import('../../lib/layout').LayoutRefs,
 *   opcoes: {
 *     identificador: { valor: string, rotulo: string }[],
 *     ficha: { ref: string, label: string }[],
 *     tabela: { ref: string, label: string }[],
 *   },
 *   automatica: { nome: string, campos: { label: string }[] } | null,
 *   onSalvo: (aviso: string) => void,
 * }} props
 */
export function FormLayout({ modo, base, opcoes, automatica, onSalvo }) {
  const [layout, setLayout] = useState(base);
  const [errosCliente, setErrosCliente] = useState({});
  const salvarPadrao = useSalvarPadrao();
  const salvarMeu = useSalvarMeu();
  const mutacao = modo === MODO.PADRAO ? salvarPadrao : salvarMeu;

  const doServidor = errosPorParte(mutacao.error ? toApiError(mutacao.error).fields : undefined);
  const erroDe = (parte) => errosCliente[parte] ?? doServidor.porParte[parte] ?? null;
  const alterado = JSON.stringify(layout) !== JSON.stringify(base);

  function alterar(parte, valor) {
    setLayout((atual) => ({ ...atual, [parte]: valor }));
    setErrosCliente((atuais) => ({ ...atuais, [parte]: undefined }));
    if (mutacao.error) {
      mutacao.reset();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const erros = validarLayout(layout);
    if (Object.keys(erros).length > 0) {
      setErrosCliente(erros);
      return;
    }

    const envio = layoutParaEnvio(layout);
    const opcoesMutacao = {
      onSuccess: () =>
        onSalvo(modo === MODO.PADRAO ? 'Padrão da empresa salvo.' : 'Seu layout foi salvo.'),
    };
    if (modo === MODO.PADRAO) {
      salvarPadrao.mutate(envio, opcoesMutacao);
    } else {
      salvarMeu.mutate(parcialDoMeu(base, envio), opcoesMutacao);
    }
  }

  // Colunas não repetem o identificador: ele já é a 1ª coluna, sempre.
  const opcoesDeColuna = opcoes.tabela.filter((opcao) => opcao.ref !== layout.identificador);
  const temErroGeral =
    mutacao.error && (doServidor.geral.length > 0 || Object.keys(doServidor.porParte).length === 0);

  return (
    <form className="grid gap-8" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <CampoForm
          erro={erroDe('identificador')}
          id="layout-identificador"
          label="Identificador"
          obrigatorio
        >
          {(controle) => (
            <SelectSimples
              {...controle}
              onChange={(ref) => alterar('identificador', ref)}
              opcoes={opcoes.identificador}
              value={layout.identificador}
            />
          )}
        </CampoForm>
        <p className="self-end text-xs text-muted-foreground md:pb-2">
          Título do lead e 1ª coluna da tabela. Vazio no lead, aparece o Nome.
        </p>

        <SeletorOrdenado
          ajuda='Embaixo do título, unidos por " · ".'
          erro={erroDe('subtitulo')}
          id="layout-subtitulo"
          legenda="Subtítulo"
          max={LIMITES_LAYOUT.SUBTITULO}
          onChange={(refs) => alterar('subtitulo', refs)}
          opcoes={opcoes.ficha}
          valor={layout.subtitulo}
        />
        <SeletorOrdenado
          ajuda="Chips no topo do drawer."
          erro={erroDe('destaques')}
          id="layout-destaques"
          legenda="Destaques"
          max={LIMITES_LAYOUT.DESTAQUES}
          onChange={(refs) => alterar('destaques', refs)}
          opcoes={opcoes.ficha}
          valor={layout.destaques}
        />
      </div>

      <SeletorOrdenado
        ajuda="Colunas de quem ainda não escolheu as próprias na tabela."
        erro={erroDe('colunas')}
        id="layout-colunas"
        legenda="Colunas padrão da tabela"
        onChange={(refs) => alterar('colunas', refs)}
        opcoes={opcoesDeColuna}
        valor={layout.colunas}
      />

      <EditorSecoes
        automatica={automatica}
        erro={erroDe('secoes')}
        onChange={(secoes) => alterar('secoes', secoes)}
        opcoes={opcoes.ficha}
        secoes={layout.secoes}
      />

      {temErroGeral && (
        <ApiErrorAlert
          error={mutacao.error}
          id="layout-erro"
          title="Não foi possível salvar o layout"
        />
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          aria-busy={mutacao.isPending}
          disabled={!alterado || mutacao.isPending}
          type="submit"
        >
          {mutacao.isPending
            ? 'Salvando…'
            : modo === MODO.PADRAO
              ? 'Salvar padrão da empresa'
              : 'Salvar meu layout'}
        </Button>
        <Button
          disabled={!alterado || mutacao.isPending}
          onClick={() => {
            setLayout(base);
            setErrosCliente({});
            mutacao.reset();
          }}
          type="button"
          variant="outline"
        >
          Descartar
        </Button>
      </div>
    </form>
  );
}
