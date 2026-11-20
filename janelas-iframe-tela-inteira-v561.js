/* V563: a janela modal precisa ocupar o viewport REAL do navegador.
   Um <dialog> dentro de iframe não pode ultrapassar as bordas desse iframe.
   Enquanto um dialog está aberto, o iframe passa a ser uma camada fixa de
   tela inteira; seu conteúdo normal fica invisível e o dialog permanece visível.
   Ao fechar, todas as propriedades originais são restauradas sem recarregar. */
(function () {
  'use strict';
  const selector = 'iframe[src*="folha-pagamento/"]';
  const states = new WeakMap();
  function enter(frame, doc) {
    if (states.has(frame)) return;
    const originalStyle = frame.getAttribute('style');
    const css = doc.createElement('style');
    css.setAttribute('data-ll-full-viewport-dialog', 'v563');
    css.textContent = `
      html, body { background:transparent!important; }
      body > :not(dialog) { visibility:hidden!important; }
      dialog[open] { visibility:visible!important; position:fixed!important;
        left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;
        margin:0!important;transform:translate(-50%,-50%)!important;
        max-height:calc(100dvh - 32px)!important;max-width:calc(100vw - 32px)!important;
        overflow:auto!important;z-index:2147483647!important; }
      dialog[open] * { visibility:visible!important; }
      dialog[open]::backdrop { background:rgba(4,24,55,.65)!important; }
    `;
    doc.head.appendChild(css);
    states.set(frame, { originalStyle, css });
    frame.style.setProperty('position', 'fixed', 'important');
    frame.style.setProperty('inset', '0', 'important');
    frame.style.setProperty('top', '0', 'important');
    frame.style.setProperty('left', '0', 'important');
    frame.style.setProperty('right', 'auto', 'important');
    frame.style.setProperty('bottom', 'auto', 'important');
    frame.style.setProperty('width', '100vw', 'important');
    frame.style.setProperty('height', '100dvh', 'important');
    frame.style.setProperty('max-width', 'none', 'important');
    frame.style.setProperty('max-height', 'none', 'important');
    frame.style.setProperty('min-height', '0', 'important');
    frame.style.setProperty('z-index', '2147483646', 'important');
    frame.style.setProperty('border-radius', '0', 'important');
    frame.style.setProperty('background', 'transparent', 'important');
    frame.style.setProperty('overflow', 'visible', 'important');
  }
  function leave(frame) {
    const state = states.get(frame);
    if (!state) return;
    if (state.originalStyle === null) frame.removeAttribute('style');
    else frame.setAttribute('style', state.originalStyle);
    state.css.remove();
    states.delete(frame);
  }
  function update() {
    document.querySelectorAll(selector).forEach(frame => {
      let doc, open = false;
      try { doc = frame.contentDocument; open = !!doc?.querySelector('dialog[open]'); }
      catch (_) { /* iframe not ready */ }
      if (open && doc) enter(frame, doc);
      else leave(frame);
    });
    requestAnimationFrame(update);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update);
  else update();
})();
