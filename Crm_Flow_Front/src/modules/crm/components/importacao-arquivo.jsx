import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IMPORTACAO } from '../constants';
import { usePreviewImportacao } from '../hooks/use-importacao';
import { validarArquivo } from '../lib/importacao';

const BYTES_POR_MB = 1024 * 1024;
const LIMITE_TEXTO =
  `Planilha .xlsx com até ${IMPORTACAO.MAX_LINHAS.toLocaleString('pt-BR')} linhas e ` +
  `${IMPORTACAO.TAMANHO_MAXIMO_ARQUIVO_BYTES / BYTES_POR_MB} MB. A primeira linha deve ter os nomes das colunas.`;

/**
 * Passo 1: escolher a planilha (botão ou arrastar). Valida extensão e
 * tamanho antes de enviar; o back lê e devolve o preview.
 *
 * @param {{ onLido: (arquivo: File, preview: object) => void }} props
 */
export function ImportacaoArquivo({ onLido }) {
  const inputRef = useRef(null);
  const [arrastando, setArrastando] = useState(false);
  const [erroLocal, setErroLocal] = useState(null);
  const preview = usePreviewImportacao();

  function receber(arquivo) {
    if (!arquivo) return;
    preview.reset();

    const motivo = validarArquivo(arquivo);
    setErroLocal(motivo);
    if (!motivo) preview.mutate(arquivo, { onSuccess: (dados) => onLido(arquivo, dados) });
  }

  return (
    <div className="grid gap-4">
      <div
        className={cn(
          'grid justify-items-center gap-3 border border-dashed px-6 py-14 text-center transition-colors duration-200',
          arrastando ? 'border-foreground bg-muted/50' : 'border-border',
        )}
        onDragLeave={() => setArrastando(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setArrastando(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setArrastando(false);
          receber(event.dataTransfer.files?.[0]);
        }}
      >
        <FileUp className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Arraste a planilha aqui</p>
        <p className="max-w-sm text-sm text-muted-foreground">{LIMITE_TEXTO}</p>
        <Button
          aria-busy={preview.isPending}
          className="mt-2"
          disabled={preview.isPending}
          onClick={() => inputRef.current?.click()}
          variant="outline"
        >
          {preview.isPending ? 'Lendo planilha…' : 'Escolher arquivo'}
        </Button>
        <input
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => {
            receber(event.target.files?.[0]);
            // Permite escolher o mesmo arquivo de novo depois de corrigir.
            event.target.value = '';
          }}
          ref={inputRef}
          type="file"
        />
      </div>

      {erroLocal && (
        <p className="text-sm text-destructive" role="alert">
          {erroLocal}
        </p>
      )}
      <ApiErrorAlert error={preview.error} id="importacao-arquivo-erro" title="Não foi possível ler a planilha" />
    </div>
  );
}
