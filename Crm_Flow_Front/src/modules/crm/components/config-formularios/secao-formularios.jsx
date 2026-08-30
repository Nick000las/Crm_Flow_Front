/**
 * @file Configurações › Formulários (FM1, só gestão): a lista ou, com `?formulario=`, o editor
 * de um deles, para dar link direto. O link para a pessoa responder vem na FM2.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FormularioAberto } from './formulario-aberto';
import { ListaFormularios } from './lista-formularios';

const PARAM_FORMULARIO = 'formulario';

/**
 * Configurações › Formulários (FM1, só gestão): a lista ou, com `?formulario=`,
 * o editor de um deles, para dar link direto. O link para a pessoa responder
 * vem na FM2.
 */
export function SecaoFormularios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [aviso, setAviso] = useState(null);
  const id = searchParams.get(PARAM_FORMULARIO);

  function abrir(proximo, texto = null) {
    setAviso(texto);

    setSearchParams((atuais) => {
      const params = new URLSearchParams(atuais);

      if (proximo) {
        params.set(PARAM_FORMULARIO, proximo);
      } else {
        params.delete(PARAM_FORMULARIO);
      }

      return params;
    });
  }

  return (
    <div className="grid gap-4">
      <p
        className={
          aviso ? 'rounded-lg border border-border bg-surface px-3 py-2 text-sm' : 'sr-only'
        }
        role="status"
      >
        {aviso}
      </p>
      {id ? (
        <FormularioAberto id={id} key={id} onAviso={setAviso} onVoltar={() => abrir(null)} />
      ) : (
        <ListaFormularios onAbrir={abrir} />
      )}
    </div>
  );
}
