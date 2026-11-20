/* V740 — F12 no Cadastro de Produtos. Não interfere em outros módulos. */
(() => {
  'use strict';
  document.addEventListener('keydown', event => {
    if (event.key !== 'F12' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (typeof screen === 'undefined' || screen !== 'PRODUTOS') return;
    if (typeof modalAberto !== 'undefined' && modalAberto) return;
    if (document.querySelector('.pm-overlay, .ax-overlay, .erp-overlay, [role="dialog"][aria-modal="true"]')) return;
    if (typeof localizarProdutoF12 !== 'function') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    localizarProdutoF12();
  }, true);
})();
