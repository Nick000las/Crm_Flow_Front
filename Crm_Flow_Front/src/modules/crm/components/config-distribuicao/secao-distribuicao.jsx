import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { isAccessError } from '@/services/api';
import { PAPEIS_GESTAO, TIPOS_DESTINO } from '../../constants';
import { useCampos } from '../../hooks/use-campos';
import { useDistribuicao } from '../../hooks/use-distribuicao';
import { useUsuarios } from '../../hooks/use-usuarios';
import { chaveDaConfig, destinoParaSelect } from '../../lib/distribuicao';
import { FormDistribuicao } from './form-distribuicao';
import { GruposDistribuicao } from './grupos-distribuicao';

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando distribuição…
      </span>
      {Array.from({ length: 4 }, (_, indice) => (
        <Skeleton className="h-14 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/** Destinos do select: usuários ativos e grupos. */
function opcoesDeDestino(usuarios, grupos) {
  return [
    ...usuarios.map((usuario) => ({
      valor: destinoParaSelect({ tipo: TIPOS_DESTINO.USUARIO, id: usuario.id }),
      rotulo: `Usuário: ${usuario.nome}`,
    })),
    ...grupos.map((grupo) => ({
      valor: destinoParaSelect({ tipo: TIPOS_DESTINO.GRUPO, id: grupo.id }),
      rotulo: `Grupo: ${grupo.nome}`,
    })),
  ];
}

/**
 * Configurações › Distribuição (`crm.distribuicao`): quem recebe cada lead
 * novo. Regras (rascunho + um PUT com tudo) e grupos (salvam na hora).
 * Todos leem; só DONO/MASTER alteram.
 */
export function SecaoDistribuicao() {
  const { user } = useAuth();
  const podeEditar = podeVer({ roles: PAPEIS_GESTAO }, user);
  const distribuicaoQuery = useDistribuicao();
  const camposQuery = useCampos();
  const { usuarios, nomePorId } = useUsuarios();
  const [aviso, setAviso] = useState(null);
  const erro = distribuicaoQuery.error ?? camposQuery.error;

  if (isAccessError(erro)) {
    return <AcessoIndisponivel error={erro} />;
  }
  if (erro) {
    return <ApiErrorAlert error={erro} id="distribuicao-carregar-erro" />;
  }
  if (distribuicaoQuery.isPending || camposQuery.isPending) {
    return <Carregando />;
  }

  const config = distribuicaoQuery.data;
  // As condições usam os campos com id (os de `/fields`, como nas regras de campo).
  const campos = camposQuery.data.filter((campo) => campo.id);

  return (
    <div className="grid gap-4">
      <div className="grid max-w-2xl gap-1 text-sm text-muted-foreground">
        <p>
          Escolhe o responsável de cada lead novo (no cadastro e no import) quando ninguém foi
          escolhido à mão.
        </p>
        {!config.configurado && <p>A empresa ainda usa a configuração padrão (desligada).</p>}
        {!podeEditar && <p>Só DONO e MASTER alteram a distribuição.</p>}
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      <FormDistribuicao
        campos={campos}
        config={config}
        key={chaveDaConfig(config)}
        nomePorId={nomePorId}
        onSalvo={setAviso}
        opcoesDestino={opcoesDeDestino(usuarios, config.grupos)}
        podeEditar={podeEditar}
      />

      <GruposDistribuicao
        grupos={config.grupos}
        nomePorId={nomePorId}
        onAviso={setAviso}
        podeEditar={podeEditar}
        usuarios={usuarios}
      />
    </div>
  );
}
