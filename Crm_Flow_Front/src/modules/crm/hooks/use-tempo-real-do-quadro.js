/**
 * @file Mantém o quadro aberto em dia: entra na sala, junta os avisos e relê os cards com o
 * filtro da tela.
 */
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';

import { BOARD_TYPE, relerCards } from '../api/quadro.api';
import {
  aplicarNaColuna,
  colunasAfetadas,
  lotesDeIds,
  ordenaPorAtualizacao,
} from '../lib/quadro-tempo-real';
import { crmKeys } from '../query-keys';

const TEMPO_DA_SALA_MS = 5000;
// Janelas fixas: não reiniciam a cada aviso, senão uma importação nunca releria.
const JANELA_DOS_AVISOS_MS = 400;
// O resumo custa uma consulta sobre a coluna inteira.
const JANELA_DA_RECARGA_MS = 3000;
const STATUS_NAO_ENCONTRADO = 404;

/**
 * Mantém o quadro aberto em dia: entra na sala, junta os avisos e relê os cards
 * com o filtro da tela. Sem socket ou sem a sala, o quadro segue sem tempo real.
 * Com a tela `ocupado` (arraste ou movimento em andamento) ou uma coluna buscando,
 * a releitura espera: a posição do card é de quem arrasta, e uma busca anterior
 * ao aviso apagaria o que foi aplicado.
 *
 * @param {{
 *   socket: import('socket.io-client').Socket | null | undefined,
 *   quadroRef: string,
 *   consulta: import('../lib/quadro-consulta').ConsultaDoQuadro | null,
 *   ocupado: boolean,
 * }} tela
 * @returns {{ semAcesso: boolean }} `semAcesso`: o quadro deixou de existir para este usuário
 */
export function useTempoRealDoQuadro({ socket, quadroRef, consulta, ocupado }) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();
  const [semAcessoEm, setSemAcessoEm] = useState(null);
  const tela = useRef({ consulta, ocupado });
  // Fora do efeito: renovar o token cria outro socket, e os avisos se perdem igual.
  const salaAberta = useRef(null);

  useEffect(() => {
    tela.current = { consulta, ocupado };
  }, [consulta, ocupado]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const sala = { boardType: BOARD_TYPE, quadroRef };
    const pendentes = new Set();
    const colunasDaRecarga = new Set();
    let ativo = true;
    let lendo = false;
    let janelaDosAvisos = null;
    let janelaDaRecarga = null;

    const colunaBuscando = () =>
      queryClient.isFetching({ queryKey: crmKeys.quadroCardsTodos(quadroRef) }) > 0;
    const livre = () =>
      Boolean(tela.current.consulta) && !tela.current.ocupado && !lendo && !colunaBuscando();
    const recarregarQuadro = () =>
      queryClient.invalidateQueries({ queryKey: crmKeys.quadro(quadroRef) });

    function abrirJanelaDosAvisos() {
      janelaDosAvisos ??= window.setTimeout(reler, JANELA_DOS_AVISOS_MS);
    }

    function abrirJanelaDaRecarga() {
      janelaDaRecarga ??= window.setTimeout(recarregarColunas, JANELA_DA_RECARGA_MS);
    }

    function recarregarColunas() {
      janelaDaRecarga = null;

      if (tela.current.ocupado) {
        abrirJanelaDaRecarga();

        return;
      }

      const recarregaCards = !ordenaPorAtualizacao(tela.current.consulta?.ordem);

      for (const colunaRef of colunasDaRecarga) {
        queryClient.invalidateQueries({ queryKey: crmKeys.quadroResumo(quadroRef, colunaRef) });

        if (recarregaCards) {
          queryClient.invalidateQueries({ queryKey: crmKeys.quadroCards(quadroRef, colunaRef) });
        }
      }

      colunasDaRecarga.clear();
    }

    function aplicar(releitura, consultaLida) {
      const colunas = queryClient.getQueryData(crmKeys.quadroColunas(quadroRef)) ?? [];
      const chaveDaColuna = (colunaRef) => crmKeys.quadroCards(quadroRef, colunaRef, consultaLida);
      const dadosPorColuna = new Map(
        colunas.map(({ ref }) => [ref, queryClient.getQueryData(chaveDaColuna(ref))]),
      );
      const afetadas = colunasAfetadas(dadosPorColuna, releitura);

      // Antes de aplicar: gravar nas colunas tira delas a marca de velhas.
      queryClient.invalidateQueries({ queryKey: crmKeys.leads(), refetchType: 'none' });

      for (const colunaRef of dadosPorColuna.keys()) {
        queryClient.setQueryData(chaveDaColuna(colunaRef), (dados) =>
          aplicarNaColuna(dados, colunaRef, releitura, consultaLida.ordem),
        );
      }

      // Coluna que a tela não conhece é status novo.
      if ([...afetadas.colunas].some((colunaRef) => !dadosPorColuna.has(colunaRef))) {
        queryClient.invalidateQueries({ queryKey: crmKeys.quadroColunas(quadroRef) });
      }

      const alvos = afetadas.desconhecido ? dadosPorColuna.keys() : afetadas.colunas;

      for (const colunaRef of alvos) {
        colunasDaRecarga.add(colunaRef);
      }

      if (colunasDaRecarga.size > 0) {
        abrirJanelaDaRecarga();
      }
    }

    function tratarFalha(erro) {
      if (!ativo) {
        return;
      }

      if (erro?.status === STATUS_NAO_ENCONTRADO) {
        sair();
        setSemAcessoEm(quadroRef);
      } else {
        recarregarQuadro();
      }
    }

    async function reler() {
      janelaDosAvisos = null;

      if (!livre()) {
        abrirJanelaDosAvisos();

        return;
      }

      const ids = [...pendentes];
      const consultaLida = tela.current.consulta;
      const { filtros } = consultaLida;

      pendentes.clear();

      let respostas;

      lendo = true;

      try {
        respostas = await Promise.all(
          lotesDeIds(ids).map((lote) =>
            relerCards(authApi, quadroRef, { ids: lote, ...(filtros && { filtros }) }),
          ),
        );
      } catch (erro) {
        tratarFalha(erro);

        return;
      } finally {
        lendo = false;
      }

      if (!ativo) {
        return;
      }

      const mesmaConsulta = JSON.stringify(tela.current.consulta) === JSON.stringify(consultaLida);

      if (!mesmaConsulta || !livre()) {
        ids.forEach((id) => pendentes.add(id));
        abrirJanelaDosAvisos();

        return;
      }

      aplicar(
        {
          itens: respostas.flatMap((resposta) => resposta.itens),
          ausentes: respostas.flatMap((resposta) => resposta.ausentes),
        },
        consultaLida,
      );
    }

    function aoMudar({ boardType, quadroRef: quadroDoAviso, entidadeIds }) {
      if (boardType !== BOARD_TYPE || quadroDoAviso !== quadroRef) {
        return;
      }

      entidadeIds.forEach((id) => pendentes.add(id));
      abrirJanelaDosAvisos();
    }

    async function entrar() {
      if (!ativo) {
        return;
      }

      // `ok: false` ou sem resposta: o quadro funciona, só não se atualiza sozinho.
      await socket
        .timeout(TEMPO_DA_SALA_MS)
        .emitWithAck('quadro:watch', sala)
        .catch(() => null);

      if (!ativo) {
        return;
      }

      if (salaAberta.current === quadroRef) {
        // Os avisos perdidos não voltam.
        recarregarQuadro();
      }

      salaAberta.current = quadroRef;
    }

    function sair() {
      ativo = false;
      window.clearTimeout(janelaDosAvisos);
      window.clearTimeout(janelaDaRecarga);
      socket.off('quadro:changed', aoMudar);
      socket.off('connect', entrar);
      socket.off('realtime:ready', entrar);

      if (socket.connected) {
        socket.emit('quadro:unwatch', sala);
      }
    }

    socket.on('quadro:changed', aoMudar);
    socket.on('connect', entrar);
    socket.on('realtime:ready', entrar);

    if (socket.connected) {
      queueMicrotask(entrar);
    }

    return () => {
      if (ativo) {
        sair();
      }
    };
  }, [authApi, queryClient, quadroRef, socket]);

  return { semAcesso: semAcessoEm === quadroRef };
}
