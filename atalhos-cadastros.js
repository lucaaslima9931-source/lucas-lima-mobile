/* LUCAS LIMA — atalhos de teclado para Marcas, Categorias e Unidades */
(() => {
  'use strict';
  const telas = new Set(['MARCAS', 'CATEGORIAS', 'UNIDADES']);
  const botoes = {F1:'ax-shortcuts',F12:'ax-codefind'};
  document.addEventListener('keydown', event => {
    if (!telas.has(window.screen) && !telas.has(screen)) return;
    const id = botoes[event.key];
    if (!id) return;
    if (typeof modalAberto !== 'undefined' && modalAberto) return;
    if (document.querySelector('.ax-overlay,.pm-overlay,.erp-overlay,[role="dialog"]')) return;
    const button = document.querySelector('.ax-screen #' + id);
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.click();
  }, true);
})();
