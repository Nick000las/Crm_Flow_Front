import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ROTAS_CRM } from '@/modules/crm/rotas';
import {
  AlertOctagon,
  ChevronDown,
  ExternalLink,
  Link2,
  Paperclip,
  Plus,
  Repeat,
  UserCheck,
  Workflow,
  X,
} from 'lucide-react';

const MAX_FILE_BYTES = 200000;

const SELECT_CLASS =
  'h-9 w-full appearance-none rounded-lg border border-input bg-card dark:bg-surface pl-3 pr-8 text-sm text-foreground transition-colors focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50';

export function CardExtensions({ details, onChange, columns, members, authApi, onDraftChange }) {
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [lead, setLead] = useState(details.leadId ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const links = details.links ?? [];
  const files = details.anexos ?? [];
  const rules = details.automacoes ?? [];

  function reportDraft(nextName = linkName, nextUrl = linkUrl, nextLead = lead, reading = false) {
    onDraftChange(Boolean(nextName || nextUrl || nextLead !== (details.leadId ?? '') || reading));
  }

  async function addFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_BYTES || files.length >= 3) {
      setError('Use até 3 arquivos de 200 KB por card. Para arquivos maiores, adicione um link.');
      return;
    }
    try {
      setLoading(true);
      reportDraft(linkName, linkUrl, lead, true);
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      onChange({
        anexos: [
          ...files,
          {
            id: crypto.randomUUID(),
            nome: file.name.slice(0, 200),
            conteudo: `data:application/octet-stream;base64,${data}`,
          },
        ],
      });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      reportDraft();
    }
  }

  return (
    <div className="space-y-5 border-t border-border pt-5">
      {/* Bloqueio */}
      <div className="space-y-1.5">
        <label
          htmlFor="kb-card-blocker"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <AlertOctagon className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
          Motivo do bloqueio
        </label>
        <Textarea
          id="kb-card-blocker"
          value={details.bloqueio ?? ''}
          maxLength={500}
          rows={2}
          placeholder="Descreva o impedimento; deixe vazio para desbloquear…"
          onChange={(event) => onChange({ bloqueio: event.target.value })}
        />
      </div>

      {/* Lead vinculado */}
      <section className="space-y-2" aria-label="Lead vinculado">
        <label
          htmlFor="kb-lead"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Lead do CRM (ID)
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="kb-lead"
            value={lead}
            className="flex-1"
            onChange={(event) => {
              setLead(event.target.value);
              reportDraft(linkName, linkUrl, event.target.value);
            }}
            placeholder="Cole o ID do lead"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            loading={loading}
            loadingText="Verificando…"
            onClick={async () => {
              if (!lead.trim()) {
                onChange({ leadId: null });
                onDraftChange(Boolean(linkName || linkUrl));
                return;
              }
              if (!/^[0-9a-f-]{36}$/i.test(lead.trim())) {
                setError('Informe um ID válido de lead.');
                return;
              }
              setLoading(true);
              try {
                await authApi.get(`/crm/leads/${encodeURIComponent(lead.trim())}`);
                onChange({ leadId: lead.trim() });
                onDraftChange(Boolean(linkName || linkUrl));
                setError('');
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            Vincular lead
          </Button>
        </div>
        {details.leadId && (
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            to={ROTAS_CRM.lead(details.leadId)}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Abrir lead vinculado
          </Link>
        )}
      </section>

      {/* Links e anexos */}
      <section className="space-y-3" aria-label="Links e anexos">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          Links e anexos
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
          <Input
            aria-label="Nome do link"
            placeholder="Nome do link"
            maxLength={200}
            value={linkName}
            onChange={(event) => {
              setLinkName(event.target.value);
              reportDraft(event.target.value);
            }}
          />
          <Input
            aria-label="Endereço do link"
            placeholder="https://…"
            maxLength={2000}
            value={linkUrl}
            onChange={(event) => {
              setLinkUrl(event.target.value);
              reportDraft(linkName, event.target.value);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            disabled={links.length >= 20}
            onClick={() => {
              try {
                const url = new URL(linkUrl);
                if (!['http:', 'https:'].includes(url.protocol) || !linkName.trim()) {
                  throw new Error('Informe nome e endereço HTTP ou HTTPS.');
                }
                onChange({
                  links: [
                    ...links,
                    { id: crypto.randomUUID(), nome: linkName.trim(), url: url.href },
                  ],
                });
                setLinkName('');
                setLinkUrl('');
                reportDraft('', '');
                setError('');
              } catch {
                setError('Informe nome e endereço HTTP ou HTTPS válidos.');
              }
            }}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Link
          </Button>
        </div>

        {links.length > 0 && (
          <div className="space-y-1.5">
            {links.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-sm"
              >
                <a
                  className="inline-flex min-w-0 items-center gap-1.5 truncate text-primary hover:underline"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.nome}</span>
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remover link ${item.nome}`}
                  onClick={() => onChange({ links: links.filter((row) => row.id !== item.id) })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
              Adicionar arquivo (até 200 KB · máximo 3)
            </span>
            <input
              type="file"
              disabled={loading || files.length >= 3}
              onChange={addFile}
              className="text-xs text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-card file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent"
            />
          </label>
          {files.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-card px-2.5 py-1.5 text-xs"
                >
                  <a
                    className="min-w-0 truncate font-medium text-foreground hover:text-primary hover:underline"
                    href={item.conteudo}
                    download={item.nome}
                  >
                    {item.nome}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remover anexo ${item.nome}`}
                    onClick={() => onChange({ anexos: files.filter((row) => row.id !== item.id) })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recorrência */}
      <div className="space-y-1.5">
        <label
          htmlFor="kb-card-recurrence"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
          Repetir ao concluir o prazo
        </label>
        <div className="relative">
          <select
            id="kb-card-recurrence"
            className={SELECT_CLASS}
            value={details.recorrencia ?? 'nenhuma'}
            onChange={(event) => onChange({ recorrencia: event.target.value })}
          >
            <option value="nenhuma">Não repetir</option>
            <option value="diaria">Diariamente</option>
            <option value="semanal">Semanalmente</option>
            <option value="mensal">Mensalmente</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Ao concluir um card com prazo, cria a próxima tarefa com o checklist reiniciado.
        </p>
      </div>

      {/* Automações por etapa */}
      {columns.length > 0 && (
        <section className="space-y-2.5" aria-label="Automações do card">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Workflow className="h-3.5 w-3.5" aria-hidden="true" />
            Ao entrar em uma etapa
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {columns.map((column) => {
              const rule = rules.find((item) => item.colunaId === column.id);
              function patch(value) {
                onChange({
                  automacoes: [
                    ...rules.filter((item) => item.colunaId !== column.id),
                    {
                      colunaId: column.id,
                      concluir: false,
                      responsavelId: null,
                      ...rule,
                      ...value,
                    },
                  ],
                });
              }
              return (
                <div
                  key={column.id}
                  className="space-y-2.5 rounded-lg border border-border/80 bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">{column.nome}</p>
                    {rule && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          onChange({
                            automacoes: rules.filter((item) => item.colunaId !== column.id),
                          })
                        }
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={rule?.concluir ?? false}
                      onChange={(event) => patch({ concluir: event.target.checked })}
                      className="h-3.5 w-3.5 rounded accent-[var(--primary)]"
                    />
                    Concluir prazo
                  </label>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-muted-foreground">
                      Atribuir para
                    </label>
                    <div className="relative">
                      <select
                        className={SELECT_CLASS}
                        value={rule?.responsavelId ?? ''}
                        onChange={(event) => patch({ responsavelId: event.target.value || null })}
                      >
                        <option value="">Manter responsável</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.nome}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="kb-error m-0">
          {error}
        </p>
      )}
    </div>
  );
}
