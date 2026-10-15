/**
 * Dispara o download de um Blob no navegador, sem abrir aba nova.
 *
 * @param {Blob} blob
 * @param {string} nomeArquivo
 */
export function salvarBlob(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = nomeArquivo;
  document.body.append(link);
  link.click();
  link.remove();
  // O navegador já copiou a referência ao iniciar o download.
  URL.revokeObjectURL(url);
}

// BOM: sem ele o Excel abre CSV UTF-8 como Latin-1 e estraga os acentos.
const BOM_UTF8 = String.fromCharCode(0xfeff);

/** @param {string} conteudo @param {string} nomeArquivo */
export function salvarCsv(conteudo, nomeArquivo) {
  salvarBlob(new Blob([BOM_UTF8, conteudo], { type: 'text/csv;charset=utf-8' }), nomeArquivo);
}
