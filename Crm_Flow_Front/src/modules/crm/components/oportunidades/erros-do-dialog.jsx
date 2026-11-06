import { ApiErrorAlert } from '@/components/api-error-alert';

/**
 * Erro sem campo no dialog. `outros` aparecem em texto: `CAMPOS_OBRIGATORIOS`
 * pode pedir um dado do lead, e o alerta geral só diz "preencha os campos".
 *
 * @param {{ erro: unknown, id: string, titulo: string, outros: string[], mostrar: boolean }} props
 */
export function ErrosDoDialog({ erro, id, titulo, outros, mostrar }) {
  if (!mostrar) {
    return null;
  }

  return (
    <div className="grid gap-1">
      <ApiErrorAlert error={erro} id={id} title={titulo} />
      {outros.length > 0 && (
        <ul className="list-inside list-disc text-sm text-destructive">
          {outros.map((mensagem) => (
            <li key={mensagem}>{mensagem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
