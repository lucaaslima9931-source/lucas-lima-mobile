/* Marcas, Categorias e Unidades: impedir duplicações após renderização */
(() => {
 'use strict';
 let scheduled=false;
 function fix(){
  const page=document.querySelector('#app .ax-compact-screen');if(!page)return;
  const header=page.querySelector(':scope > .ax-titlebar');
  const shortcut=page.querySelector('#ax-shortcuts');
  if(header&&shortcut&&shortcut.parentElement!==header)header.append(shortcut);
  page.querySelectorAll('.erp-shortcut-open').forEach(e=>e.remove());
  const keep=page.querySelector('#ax-user')?.closest('label');
  page.querySelectorAll('label').forEach(el=>{
   if(el!==keep&&el.querySelector('input')&&/^USUÁRIO\s*$/i.test((el.childNodes[0]?.textContent||'').trim()))el.remove();
  });
  page.querySelectorAll('.pc-userline,[data-user-audit],.vt-user-field').forEach(el=>{if(el!==keep&&!el.contains(keep))el.remove()});
  const locate=page.querySelector('#ax-codefind');if(locate){locate.hidden=true;locate.style.display='none'}
 }
 const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;fix()})});
 function start(){observer.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});fix()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
