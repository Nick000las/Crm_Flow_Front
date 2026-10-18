/** Query keys das notificações. Invalidar `all()` recarrega contador e páginas. */
export const notificacoesKeys = {
  all: () => ['notificacoes'],
  pagina: (pagina, tamanho) => ['notificacoes', { pagina, tamanho }],
};
