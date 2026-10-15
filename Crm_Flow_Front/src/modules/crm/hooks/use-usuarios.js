import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { listarUsuarios } from '../api/usuarios.api';
import { crmKeys } from '../query-keys';

const LISTA_VAZIA = [];
// A lista de usuários do tenant muda pouco; não precisa refazer a cada tela.
const USUARIOS_STALE_TIME_MS = 5 * 60_000;

/**
 * Usuários do tenant e um mapa `id → nome`. Falhar aqui não derruba a tela:
 * quem consome cai para o ID curto do responsável.
 */
export function useUsuarios() {
  const { authApi } = useAuth();
  const query = useQuery({
    queryKey: crmKeys.usuarios(),
    queryFn: ({ signal }) => listarUsuarios(authApi, { signal }),
    staleTime: USUARIOS_STALE_TIME_MS,
  });
  const usuarios = query.data ?? LISTA_VAZIA;

  const nomePorId = useMemo(
    () => new Map(usuarios.map((usuario) => [usuario.id, usuario.nome])),
    [usuarios],
  );

  return { ...query, usuarios, nomePorId };
}
