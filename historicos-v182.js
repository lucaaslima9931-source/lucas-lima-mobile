/* V183 — históricos compactos, no padrão do cadastro de funcionários. */
(function(){'use strict';
const processed=new WeakSet();
function normalize(dialog){
 if(processed.has(dialog))return;
 const header=dialog.querySelector(':scope > header, :scope > .modal-header, :scope > div:first-child');
 if(!header)return;
 const heading=(header.textContent||'').slice(0,220);
 if(!/HIST[ÓO]RICO\s+(?:DE\s+)?(?:ALTERA[ÇC][ÕO]ES|USU[ÁA]RIOS?)/i.test(heading))return;
 const closeButtons=Array.from(dialog.querySelectorAll('button')).filter(b=>/^(?:[×✕X]\s*)?(?:FECHAR|[×✕X])$/i.test((b.textContent||'').trim())||b.hasAttribute('data-close'));
 if(!closeButtons.length)return;
 const headerButtons=closeButtons.filter(b=>header.contains(b));
 const existingBottom=closeButtons.find(b=>!header.contains(b));
 processed.add(dialog);
 dialog.classList.add('ll-history-v182');header.classList.add('ll-history-v182-header');
 const title=header.querySelector('b,strong')||header;
 const page=String(typeof window.screen==='string'?window.screen:'').toUpperCase();
 const productPage=page.includes('PRODUTO')||!!document.querySelector('.pm-page');
 if(productPage && /^HIST[ÓO]RICO DE ALTERA[ÇC][ÕO]ES\s*$/i.test(title.textContent.trim())){
   title.textContent='HISTÓRICO DE ALTERAÇÕES — PRODUTOS';
   const body=header.nextElementSibling;
   const productName=String(document.querySelector('#produto-descricao,#prod-descricao,[id*="descricao-produto"]')?.value||'').trim();
   if(body && productName && !/PRODUTO:/i.test(body.textContent.slice(0,120))){
     const p=document.createElement('p');p.className='ll-history-v183-product';
     const b=document.createElement('b');b.textContent='PRODUTO: ';p.append(b,document.createTextNode(productName));body.insertBefore(p,body.firstChild);
   }
 }
 let footer=dialog.querySelector(':scope > footer, :scope > .modal-footer');
 if(!footer){footer=document.createElement('footer');dialog.appendChild(footer)}
 footer.classList.add('ll-history-v182-footer');
 if(existingBottom){
  existingBottom.textContent='FECHAR';existingBottom.classList.add('ll-history-v182-close');
  if(!footer.contains(existingBottom))footer.appendChild(existingBottom);
  headerButtons.forEach(b=>b.remove());
 }else if(headerButtons.length){
  const button=headerButtons[0];button.textContent='FECHAR';button.classList.add('ll-history-v182-close');footer.appendChild(button);
  headerButtons.slice(1).forEach(b=>b.remove());
 }
}
let queued=false;
function scan(){queued=false;document.querySelectorAll('[role="dialog"],.ae-modal,.rh-dialog,.modal-content,.modal').forEach(normalize)}
function schedule(){if(!queued){queued=true;requestAnimationFrame(scan)}}
function start(){new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});scan()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
