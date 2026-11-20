/* Digitação em maiúsculas em todos os formulários.
   Senhas e campos de e-mail são preservados para não alterar credenciais e endereços. */
(function () {
  'use strict';
  function deveConverter(el) {
    if (!el || !el.matches || !el.matches('input, textarea')) return false;
    if (el.disabled || el.readOnly) return false;
    var tipo = (el.getAttribute('type') || 'text').toLowerCase();
    if (tipo === 'email' && el.id === 'c-email') return true;
    if (['password','email','number','date','datetime-local','time','month','week','file','hidden',
         'checkbox','radio','range','color','button','submit','reset','tel'].includes(tipo)) return false;
    return true;
  }
  function converter(el) {
    if (!deveConverter(el)) return;
    var anterior = el.value;
    var novo = anterior.toLocaleUpperCase('pt-BR');
    if (anterior === novo) return;
    var inicio = null, fim = null;
    try { inicio = el.selectionStart; fim = el.selectionEnd; } catch (e) {}
    el.value = novo;
    try { if (inicio !== null) el.setSelectionRange(inicio, fim); } catch (e) {}
  }
  document.addEventListener('input', function (evento) {
    if (deveConverter(evento.target)) converter(evento.target);
  }, true);
  document.addEventListener('change', function (evento) {
    if (deveConverter(evento.target)) converter(evento.target);
  }, true);
  document.addEventListener('blur', function (evento) {
    if (deveConverter(evento.target)) converter(evento.target);
  }, true);
  var estilo = document.createElement('style');
  estilo.textContent = 'input:not([type=password]):not([type=email]):not([type=tel]), textarea, input#c-email { text-transform: uppercase; }';
  document.head.appendChild(estilo);
})();
