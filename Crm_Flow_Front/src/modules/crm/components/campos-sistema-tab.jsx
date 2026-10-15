import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROTULOS_CAMADA_2 } from '../constants';
import { useSalvarVisibilidade } from '../hooks/use-campos-config';
import { MENSAGENS_CAMPOS, alterarVisibilidade, lerOrdem, linhasAlteradas } from '../lib/campos-config';

const HEAD_CLASS = 'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';
const AVISO_SALVO = 'Campos do sistema salvos.';

/**
 * Camada 2: 15 campos nativos que o tenant liga/desliga. Edita um rascunho
 * local; "Salvar" manda só as linhas alteradas (o `PUT` é parcial).
 *
 * @param {{ visibilidade: import('../lib/campos-config').LinhaVisibilidade[] }} props
 *   o estado salvo — o componente é montado quando ele chega
 */
export function CamposSistemaTab({ visibilidade }) {
  const [salvas, setSalvas] = useState(visibilidade);
  const [linhas, setLinhas] = useState(visibilidade);
  // Ordem é editada como texto: "-" ou vazio são estados válidos enquanto digita.
  const [ordensDigitadas, setOrdensDigitadas] = useState({});
  const [aviso, setAviso] = useState(null);
  const salvar = useSalvarVisibilidade();

  const alteradas = linhasAlteradas(salvas, linhas);
  const ordensInvalidas = Object.entries(ordensDigitadas).filter(([, texto]) => lerOrdem(texto) === null);

  function alterar(coluna, mudancas) {
    setAviso(null);
    setLinhas((atuais) =>
      atuais.map((linha) => (linha.coluna === coluna ? alterarVisibilidade(linha, mudancas) : linha)),
    );
  }

  function digitarOrdem(coluna, texto) {
    setOrdensDigitadas((atuais) => ({ ...atuais, [coluna]: texto }));
    const ordem = lerOrdem(texto);
    if (ordem !== null) alterar(coluna, { ordem });
  }

  function handleSalvar() {
    salvar.mutate(alteradas, {
      onSuccess: (atualizadas) => {
        setSalvas(atualizadas);
        setLinhas(atualizadas);
        setOrdensDigitadas({});
        setAviso(AVISO_SALVO);
      },
    });
  }

  function descartar() {
    setLinhas(salvas);
    setOrdensDigitadas({});
    salvar.reset();
  }

  return (
    <div className="grid gap-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Ligue os campos que fazem sentido para a sua operação. Desligar um campo não apaga os dados já
        preenchidos — ele só deixa de aparecer no formulário, nos filtros e na tabela.
      </p>

      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={HEAD_CLASS} scope="col">Campo</TableHead>
              <TableHead className={HEAD_CLASS} scope="col">Visível</TableHead>
              <TableHead className={HEAD_CLASS} scope="col">Obrigatório</TableHead>
              <TableHead className={HEAD_CLASS} scope="col">Ordem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((linha) => {
              const rotulo = ROTULOS_CAMADA_2[linha.coluna] ?? linha.coluna;
              const ordemTexto = ordensDigitadas[linha.coluna] ?? String(linha.ordem);
              const ordemInvalida = lerOrdem(ordemTexto) === null;
              const erroOrdemId = `ordem-${linha.coluna}-erro`;

              return (
                <TableRow key={linha.coluna}>
                  <TableCell className="font-medium">{rotulo}</TableCell>
                  <TableCell>
                    <Switch
                      aria-label={`${rotulo} visível`}
                      checked={linha.visivel}
                      onCheckedChange={(visivel) => alterar(linha.coluna, { visivel })}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      aria-label={`${rotulo} obrigatório`}
                      checked={linha.obrigatorio}
                      // Obrigatório invisível não teria como ser preenchido.
                      disabled={!linha.visivel}
                      onCheckedChange={(obrigatorio) => alterar(linha.coluna, { obrigatorio })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-describedby={ordemInvalida ? erroOrdemId : undefined}
                      aria-invalid={ordemInvalida || undefined}
                      aria-label={`Ordem de ${rotulo}`}
                      className="h-8 w-20 rounded-none font-mono tabular-nums"
                      inputMode="numeric"
                      onChange={(event) => digitarOrdem(linha.coluna, event.target.value)}
                      value={ordemTexto}
                    />
                    {ordemInvalida && (
                      <p className="mt-1 text-xs text-destructive" id={erroOrdemId}>
                        {MENSAGENS_CAMPOS.ORDEM}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ApiErrorAlert error={salvar.error} id="campos-sistema-erro" title="Não foi possível salvar" />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          aria-busy={salvar.isPending}
          disabled={alteradas.length === 0 || ordensInvalidas.length > 0 || salvar.isPending}
          onClick={handleSalvar}
        >
          {salvar.isPending ? 'Salvando…' : 'Salvar alterações'}
        </Button>
        <Button disabled={alteradas.length === 0 || salvar.isPending} onClick={descartar} variant="ghost">
          Descartar
        </Button>
        <p className="font-mono text-xs text-muted-foreground tabular-nums" role="status">
          {aviso ?? (alteradas.length > 0 ? `${alteradas.length} alteração(ões) não salva(s)` : '')}
        </p>
      </div>
    </div>
  );
}
