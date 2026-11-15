import { Copy, Download, MessageCircle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useId, useRef, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { salvarBlob } from '@/lib/download';
import { cn } from '@/lib/utils';
import {
  MOTIVOS_LINK,
  linkDoWhatsapp,
  mensagemDoWhatsapp,
  telefoneDoWhatsapp,
  urlAbsoluta,
} from '../../lib/links-formulario';
import { ControleTravado } from '../controle-travado';

const TAMANHO_QR = 192;

/**
 * Formas de envio de um link: copiar, WhatsApp e QR Code, tudo no front.
 *
 * @param {{
 *   obtido: import('../../api/links-formulario.api').LinkObtido & { formulario: string },
 *   telefone: string | null,
 *   primeiroNome: string | null,
 * }} props
 */
export function EnvioDoLink({ obtido, telefone, primeiroNome }) {
  const id = useId();
  const campo = useRef(null);
  const qr = useRef(null);
  const [aviso, setAviso] = useState(null);
  const [comQr, setComQr] = useState(false);
  const url = urlAbsoluta(obtido.url, window.location.origin);
  const digitos = telefoneDoWhatsapp(telefone);
  const whatsapp = digitos
    ? linkDoWhatsapp(
        digitos,
        mensagemDoWhatsapp({ primeiroNome, formulario: obtido.formulario, url }),
      )
    : null;
  const motivoWhatsapp = whatsapp ? null : MOTIVOS_LINK.SEM_TELEFONE;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setAviso('Link copiado.');
    } catch {
      campo.current?.select();
      setAviso('Não deu para copiar sozinho: o link está selecionado, use Ctrl+C.');
    }
  }

  function baixarQr() {
    const svg = qr.current?.querySelector('svg');
    if (svg) {
      const conteudo = new XMLSerializer().serializeToString(svg);
      salvarBlob(new Blob([conteudo], { type: 'image/svg+xml' }), `qr-${obtido.formulario}.svg`);
    }
  }

  return (
    <div className="grid gap-3 border border-border p-3">
      <p className="text-sm">
        <span className="font-medium">{obtido.formulario}</span>
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          v{obtido.link.versao.versao}
        </span>
        <span className="ml-2 text-xs text-muted-foreground">
          {obtido.criado ? 'Link criado agora.' : 'Este é o link que já estava ativo.'}
        </span>
      </p>

      <label className="sr-only" htmlFor={`${id}-url`}>
        Link do formulário
      </label>
      <Input
        className="h-9 rounded-none font-mono text-xs"
        id={`${id}-url`}
        onFocus={(event) => event.target.select()}
        readOnly
        ref={campo}
        value={url}
      />

      <div className="flex flex-wrap gap-2">
        <Button className="rounded-none" onClick={copiar} size="sm" type="button">
          <Copy aria-hidden="true" />
          Copiar
        </Button>
        <ControleTravado motivo={motivoWhatsapp} motivoId={`${id}-whatsapp-motivo`}>
          {whatsapp ? (
            <a
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-none')}
              href={whatsapp}
              rel="noopener noreferrer"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" />
              Abrir no WhatsApp
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : (
            <Button
              aria-describedby={`${id}-whatsapp-motivo`}
              className="pointer-events-none rounded-none"
              disabled
              size="sm"
              type="button"
              variant="outline"
            >
              <MessageCircle aria-hidden="true" />
              Abrir no WhatsApp
            </Button>
          )}
        </ControleTravado>
        <Button
          aria-expanded={comQr}
          className="rounded-none"
          onClick={() => setComQr((atual) => !atual)}
          size="sm"
          type="button"
          variant="outline"
        >
          <QrCode aria-hidden="true" />
          {comQr ? 'Esconder QR Code' : 'QR Code'}
        </Button>
      </div>

      <p className={aviso ? 'text-xs' : 'sr-only'} role="status">
        {aviso}
      </p>

      {comQr && (
        <div className="grid justify-items-start gap-2">
          <div className="border border-border bg-white p-3" ref={qr}>
            <QRCodeSVG
              aria-label={`QR Code do link de ${obtido.formulario}`}
              role="img"
              size={TAMANHO_QR}
              title={`QR Code do link de ${obtido.formulario}`}
              value={url}
            />
          </div>
          <Button
            className="rounded-none"
            onClick={baixarQr}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Download aria-hidden="true" />
            Baixar QR Code
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        A página que abre este link ainda está em construção: por enquanto, ele não abre nada.
      </p>
    </div>
  );
}
