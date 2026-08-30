/**
 * @file Construtor de filtro em Popover. Edita um rascunho e só aplica no botão "Aplicar" —
 * cada aplicação é uma busca. Abrir de novo recomeça do filtro aplicado, descartando o que não
 * foi aplicado.
 */
import { useState } from 'react';
import { ListFilter, Plus } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { BUSCA_LEADS } from '../constants';
import {
  contarFiltros,
  filtroDoRascunho,
  novaLinha,
  rascunhoDoFiltro,
  rascunhoVazio,
} from '../lib/filtro';
import { FiltrosFixos } from './filtros-fixos';
import { LinhaFiltro } from './linha-filtro';

/**
 * Construtor de filtro em Popover. Edita um rascunho e só aplica no botão
 * "Aplicar" — cada aplicação é uma busca. Abrir de novo recomeça do filtro
 * aplicado, descartando o que não foi aplicado.
 *
 * @param {{
 *   filtro: import('../lib/filtro').FiltroAplicado,
 *   campos: import('../types').Campo[],
 *   usuarios: { id: string, nome: string }[],
 *   chavesComErro: Set<string>,
 *   comValor: boolean,
 *   comCiclo?: boolean,
 *   comDataConversao?: boolean,
 *   onAplicar: (filtro: import('../lib/filtro').FiltroAplicado) => void,
 * }} props
 */
export function ConstrutorFiltro({
  filtro,
  campos,
  usuarios,
  chavesComErro,
  comValor,
  comCiclo = false,
  comDataConversao = true,
  onAplicar,
}) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState(rascunhoVazio);
  const [erros, setErros] = useState({});
  const total = contarFiltros(filtro);
  const limiteAtingido = rascunho.linhas.length >= BUSCA_LEADS.MAX_FILTROS;

  function handleOpenChange(proximo) {
    if (proximo) {
      setRascunho(rascunhoDoFiltro(filtro, campos));
      setErros({});
    }

    setAberto(proximo);
  }

  function alterarLinhas(transformar) {
    setRascunho((atual) => ({ ...atual, linhas: transformar(atual.linhas) }));
  }

  function aplicar(proximoRascunho) {
    const resultado = filtroDoRascunho(proximoRascunho, campos);

    if ('erros' in resultado) {
      setErros(resultado.erros);

      return;
    }

    onAplicar(resultado.filtro);
    setAberto(false);
  }

  return (
    <Popover onOpenChange={handleOpenChange} open={aberto}>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'outline' }), 'h-9 ')}>
        <ListFilter aria-hidden="true" />
        Filtros
        {total > 0 && <span className="text-xs tabular-nums">({total})</span>}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(44rem,calc(100vw-2rem))] gap-3 p-3 ring-border"
      >
        <PopoverTitle className="text-sm font-medium">Filtrar leads</PopoverTitle>

        {rascunho.linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum filtro por campo.</p>
        ) : (
          <ul className="grid gap-2">
            {rascunho.linhas.map((linha) => (
              <LinhaFiltro
                campos={campos}
                erro={erros[linha.id]}
                erroDoServidor={chavesComErro.has(linha.chave)}
                key={linha.id}
                linha={linha}
                onChange={(proxima) =>
                  alterarLinhas((linhas) =>
                    linhas.map((atual) => (atual.id === linha.id ? proxima : atual)),
                  )
                }
                onRemover={() =>
                  alterarLinhas((linhas) => linhas.filter((atual) => atual.id !== linha.id))
                }
              />
            ))}
          </ul>
        )}

        <Button
          className="w-fit"
          disabled={campos.length === 0 || limiteAtingido}
          onClick={() => alterarLinhas((linhas) => [...linhas, novaLinha(campos[0])])}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus aria-hidden="true" />
          Adicionar filtro
        </Button>

        <Separator />

        <FiltrosFixos
          comCiclo={comCiclo}
          comDataConversao={comDataConversao}
          comValor={comValor}
          erros={erros}
          fixos={rascunho.fixos}
          onChange={(chave, valor) =>
            setRascunho((atual) => ({ ...atual, fixos: { ...atual.fixos, [chave]: valor } }))
          }
          usuarios={usuarios}
        />

        <footer className="flex justify-end gap-2 border-t border-border pt-3">
          <Button onClick={() => setRascunho(rascunhoVazio())} type="button" variant="ghost">
            Limpar tudo
          </Button>
          <Button onClick={() => aplicar(rascunho)} type="button">
            Aplicar
          </Button>
        </footer>
      </PopoverContent>
    </Popover>
  );
}
