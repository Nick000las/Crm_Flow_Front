import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isAccessError } from '@/services/api';
import { ROTULOS_LISTA, TIPOS_LISTA } from '../../constants';
import { useListas, useReordenarOpcoes } from '../../hooks/use-listas';
import { ExcluirOpcaoDialog } from './excluir-opcao-dialog';
import { OpcaoDialog } from './opcao-dialog';
import { TabelaOpcoes } from './tabela-opcoes';

const PARAM_LISTA = 'lista';
const TIPOS = Object.values(TIPOS_LISTA);
const LINHAS_SKELETON = 6;

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando listas…
      </span>
      {Array.from({ length: LINHAS_SKELETON }, (_, indice) => (
        <Skeleton className="h-11 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/**
 * Configurações › Listas: status, origem, motivos de perda, tipos de
 * atividade e tags do tenant. A key de cada opção é o que o lead grava, e
 * não muda ao renomear; desativar tira dos seletores sem mexer em lead
 * nenhum. A aba fica na URL (`?lista=`) para dar link direto.
 */
export function SecaoListas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tipo = TIPOS.includes(searchParams.get(PARAM_LISTA))
    ? searchParams.get(PARAM_LISTA)
    : TIPOS_LISTA.STATUS;
  const listasQuery = useListas();
  const reordenar = useReordenarOpcoes();
  // `undefined` = fechado; `null` = criando; objeto = editando.
  const [emEdicao, setEmEdicao] = useState(undefined);
  const [aExcluir, setAExcluir] = useState(null);
  const [aviso, setAviso] = useState(null);

  if (isAccessError(listasQuery.error)) {
    return <AcessoIndisponivel error={listasQuery.error} />;
  }
  if (listasQuery.error) {
    return <ApiErrorAlert error={listasQuery.error} id="config-listas-carregar-erro" />;
  }
  if (listasQuery.isPending) {
    return <Carregando />;
  }

  const opcoes = listasQuery.data[tipo] ?? [];
  const rotuloDaLista = ROTULOS_LISTA[tipo];

  function trocarLista(proximo) {
    setAviso(null);
    reordenar.reset();
    setSearchParams(proximo === TIPOS_LISTA.STATUS ? {} : { [PARAM_LISTA]: proximo }, {
      replace: true,
    });
  }

  function abrir(acao) {
    setAviso(null);
    reordenar.reset();
    acao();
  }

  const botaoNovo = (
    <Button onClick={() => abrir(() => setEmEdicao(null))}>
      <Plus aria-hidden="true" />
      Nova opção
    </Button>
  );

  return (
    <Tabs onValueChange={trocarLista} value={tipo}>
      <TabsList className="mb-4 flex-wrap" variant="line">
        {TIPOS.map((item) => (
          <TabsTrigger key={item} value={item}>
            {ROTULOS_LISTA[item]}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Um painel só: o da aba ativa (as outras não carregam nada a mais). */}
      <TabsContent className="grid gap-4" value={tipo}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-sm text-muted-foreground">
            A ordem daqui é a dos seletores. Renomear não muda os leads; desativar tira a opção dos
            seletores, e quem já a tem continua com ela.
          </p>
          {opcoes.length > 0 && botaoNovo}
        </div>

        <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
          {aviso}
        </p>
        <ApiErrorAlert
          error={reordenar.error}
          id="config-listas-ordem-erro"
          title="Não foi possível salvar a ordem. A lista voltou ao que era."
        />

        <TabelaOpcoes
          acaoVazio={botaoNovo}
          onEditar={(opcao) => abrir(() => setEmEdicao(opcao))}
          onExcluir={(opcao) => abrir(() => setAExcluir(opcao))}
          onReordenar={(ids) => reordenar.mutate({ tipo, ids })}
          opcoes={opcoes}
          ordemOcupada={reordenar.isPending}
          tipo={tipo}
        />

        <OpcaoDialog
          onOpenChange={(aberto) => !aberto && setEmEdicao(undefined)}
          onSalvo={(salva) =>
            salva &&
            setAviso(
              emEdicao ? `Opção "${salva.label}" atualizada.` : `Opção "${salva.label}" criada.`,
            )
          }
          open={emEdicao !== undefined}
          opcao={emEdicao}
          rotuloDaLista={rotuloDaLista}
          tipo={tipo}
        />
        <ExcluirOpcaoDialog
          onExcluida={(label) => setAviso(`Opção "${label}" excluída.`)}
          onOpenChange={(aberto) => !aberto && setAExcluir(null)}
          opcao={aExcluir}
          tipo={tipo}
        />
      </TabsContent>
    </Tabs>
  );
}
