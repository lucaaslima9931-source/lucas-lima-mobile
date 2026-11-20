/* LUCAS LIMA — apresentação dos atalhos sem alterar as rotinas de negócio. */
(()=>{'use strict';
const shortcuts={F1:'Voltar ao início',F2:'Novo',F3:'Gravar',F4:'Alterar',F5:'Pesquisar',F6:'Baixar',F7:'Cancelar',F8:'Reabrir',F9:'Imprimir',F10:'Imprimir',F12:'Localizar'};
const ignored=new Set(['ATALHOS','FECHAR','CANCELAR']);
let processing=false;
function normalize(s){return (s||'').replace(/\s+/g,' ').trim();}
function cleanButtons(){
 document.querySelectorAll('button,input[type="button"],input[type="submit"]').forEach(b=>{
  if(b.closest('#erp-shortcuts-modal'))return;
  const value=b.tagName==='INPUT'?b.value:b.textContent; if(value&&!b.dataset.erpOriginalLabel)b.dataset.erpOriginalLabel=value;
  if(!value||!/(?:\(|\[)\s*F(?:[1-9]|1[0-2])\s*(?:\)|\])|\bF12\b/i.test(value))return;
  const updated=normalize(value.replace(/\s*[\(\[]\s*F(?:[1-9]|1[0-2])\s*[\)\]]/gi,'').replace(/\s+F12\b/gi,''));
  if(!updated)return;
  if(b.tagName==='INPUT'){if(b.value!==updated)b.value=updated;}else if(b.textContent!==updated){b.textContent=updated;}
 });
}
function activeScreen(){
 const main=document.querySelector('main')||document.querySelector('#app')||document.body;
 const h=[...main.querySelectorAll('h1,h2,.page-title')].find(x=>x.getBoundingClientRect().width>0);
 return normalize(h?.textContent||document.title).replace(/^LUCAS LIMA\s*[—-]\s*/i,'');
}
function visible(el){return !!(el.getClientRects().length) && getComputedStyle(el).visibility!=='hidden';}
function isCentroCustos(){return !!document.querySelector('.cc-page .cc-launch')}
function isCaixaPrincipal(){return !!document.querySelector('#app .cx-dashboard');}
function getAvailable(){
 if(isCaixaPrincipal())return [['F1','Abrir esta janela de atalhos',null],['F12','Localizar caixa pelo nome do operador ou número',null]];
 const map={F1:'Voltar ao início',F2:'Novo',F3:'Gravar',F4:'Alterar',F5:'Pesquisar',F6:'Baixar',F7:'Cancelar',F8:'Reabrir',F9:'Imprimir',F12:'Localizar'};
 if(isCentroCustos())return [
  ['F1','Abrir esta janela de atalhos',null],
  ['F12','Localizar lançamento pelo número',null],
  ['F2','Baixar lançamento',null],
  ['F3','Cancelar lançamento',null]
 ];
 const found=new Map();
 const root=document.querySelector('#workspace')||document.querySelector('#app')||document.body;
 root.querySelectorAll('button,input[type="button"],input[type="submit"]').forEach(b=>{
  if(!visible(b)||b.closest('#erp-shortcuts-modal')||b.classList.contains('erp-shortcut-open'))return;
  const raw=normalize(b.dataset.erpOriginalLabel||b.textContent||b.value).toUpperCase();
  const keyMatch=raw.match(/\(\s*(F(?:[1-9]|1[0-2]))\s*\)/);
  let key=keyMatch?.[1];
  const clean=raw.replace(/^[^A-ZÀ-Ú0-9]+/u,'').replace(/\s*\(F\d+\)/g,'').trim();
  if(!key){
   if(/^NOVA?(?:\s|$)|^NOVO(?:\s|$)/.test(clean))key=null;
   else if(/^GRAVAR(?:\s|$)/.test(clean))key=null;
   else if(/^ALTERAR(?:\s|$)/.test(clean))key=null;
   else if(/^PESQUISAR(?:\s|$)/.test(clean))key='F5';
   else if(/^BAIXAR(?:\s|$)/.test(clean))key='F6';
   else if(/^CANCELAR(?:\s|$)/.test(clean))key='F7';
   else if(/^REABRIR(?:\s|$)/.test(clean))key='F8';
   else if(/^LOCALIZAR(?:\s|$)/.test(clean)&&!clean.includes('VENDA'))key='F12';
   else if(/^VOLTAR(?:\s|$)/.test(clean))key=null;
  }
  if(key==='F1')key=null;
  if(key&&!found.has(key))found.set(key,{label:map[key],button:b});
 });
 // Os cadastros de produtos/clientes têm F12 implementado diretamente no JavaScript.
 const title=activeScreen().toUpperCase();
 if(/CADASTRO DE PRODUTOS/.test(title)){
  found.clear();
  found.set('F1',{label:'Abrir esta janela de atalhos',button:null});
  found.set('F6',{label:'Abrir Simular Preços',button:null});
  found.set('F7',{label:'Abrir Promoções',button:null});
  found.set('F12',{label:'Localizar produto por código',button:null});
 } else if(/CADASTRO DE CLIENTES/.test(title)&&!found.has('F12'))found.set('F12',{label:'Localizar por código',button:null});
 if(!found.has('F1'))found.set('F1',{label:'Visualizar atalhos',button:null});
 return [...found].sort((a,b)=>Number(a[0].slice(1))-Number(b[0].slice(1))).map(([key,item])=>[key,item.label,item.button]);
}

function close(){document.getElementById('erp-shortcuts-modal')?.remove();document.removeEventListener('keydown',onKey,true);}
function onKey(e){if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopPropagation();close();}}
function open(){close();const rows=getAvailable();const wrap=document.createElement('div');wrap.id='erp-shortcuts-modal';wrap.setAttribute('role','presentation');
 const modal=document.createElement('section');modal.className='erp-shortcuts-dialog';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Atalhos da tela');
 const header=document.createElement('header');header.textContent='⌂  ATALHOS — '+activeScreen();const x=document.createElement('button');x.textContent='×';x.className='erp-shortcuts-close';x.setAttribute('aria-label','Fechar');x.onclick=close;header.append(x);modal.append(header);
 const content=document.createElement('div');content.className='erp-shortcuts-content';if(!rows.length){const p=document.createElement('p');p.textContent='Esta tela não possui atalhos cadastrados.';content.append(p);}else rows.forEach(([key,label])=>{const r=document.createElement('div');r.className='erp-shortcuts-row';const k=document.createElement('kbd');k.textContent=key;const v=document.createElement('span');v.textContent=label;r.append(k,v);content.append(r);});modal.append(content);
 const foot=document.createElement('footer');const ok=document.createElement('button');ok.textContent='FECHAR';ok.onclick=close;foot.append(ok);modal.append(foot);wrap.append(modal);wrap.addEventListener('click',e=>{if(e.target===wrap)close();});document.body.append(wrap);document.addEventListener('keydown',onKey,true);ok.focus();}
function addShortcutButton(){
 const app=document.querySelector('#app');if(!app)return;
 // Backup do sistema: esta tela não deve exibir o botão ATALHOS.
 if(app.querySelector('.llbk')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;}
 // Cadastro da Loja ja tem seu proprio botao ATALHOS no canto direito.
 if(app.querySelector('.ae-adjust-page')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('[data-ll-saida-caixa-active="1"]')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('#forn-main')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.client-employee-layout')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('#sf-fields')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.ax-compact-screen')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.or-page')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.vt-page')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.pc-page')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.fp-page')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.cb-page')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.us-page')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.ls-loja')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;} if(app.querySelector('.fs-page')){app.querySelectorAll('.erp-shortcut-open').forEach(b=>b.remove());return;}
 const headings=[...app.querySelectorAll('h1,h2')].filter(visible);
 const title=headings.map(x=>normalize(x.textContent).toUpperCase()).join(' ');
 const isMenu=!!app.querySelector('.modern-module,.module-screen,.module-cards,.modulo-cards,.erp-module-grid') && !app.querySelector('form');
 const actions=[...app.querySelectorAll('button')].filter(b=>visible(b)&&/\b(GRAVAR|ALTERAR|BAIXAR|PESQUISAR|NOVA?|NOVO|CANCELAR)\b/i.test(b.textContent));
 const existing=app.querySelector('.erp-shortcut-open');
 if(!actions.length||isMenu){existing?.remove();return;}
 if(existing){const head=app.querySelector('h1,h2');if(head&&head.parentElement&&existing.parentElement!==head.parentElement)head.parentElement.append(existing);return;}
 const b=document.createElement('button');b.type='button';b.className='erp-shortcut-open';b.innerHTML='<span aria-hidden="true">⌂</span> ATALHOS';b.title='Consultar atalhos desta tela';b.onclick=open;
 const heading=app.querySelector('h1,h2');const group=app.querySelector('.product-heading-row')||heading?.parentElement||actions[0].parentElement;
 if(group)group.append(b);else actions[0].insertAdjacentElement('afterend',b);
}
function removeInstruction(){document.querySelectorAll('.vt-panel p,.module-heading-text p').forEach(p=>{if(/não gera lançamento bancário automático nesta versão|gerencie as informações e operações deste módulo/i.test(p.textContent))p.remove();});}
function update(){if(processing)return;processing=true;try{cleanButtons();removeInstruction();addShortcutButton();}finally{processing=false;}}
let queued=false;const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update();});});
function start(){document.addEventListener('keydown',e=>{
 if(!isCentroCustos()||!['F12','F2','F3'].includes(e.key)||document.getElementById('erp-shortcuts-modal')||document.getElementById('cc-choose-overlay')||document.getElementById('cc-launch-history-overlay')||document.getElementById('cc-history-overlay'))return;
 e.preventDefault();e.stopImmediatePropagation();
 const a=window.LucasLimaCentrosAtalhos;
 if(e.key==='F12')a?.localizar?.();
 if(e.key==='F2')a?.baixar?.();
 if(e.key==='F3')a?.cancelar?.();
 },true);document.addEventListener('keydown',e=>{if(e.key==='F1'&&!document.querySelector('iframe[src*="rescisoes/index.html"]')&&!document.querySelector('iframe[src*="ferias/index.html"]')&&!document.querySelector('#app .client-employee-layout')&&!document.querySelector('[data-ll-saida-caixa-active="1"]')&&!isCaixaPrincipal()&&!document.getElementById('forn-main')&&!document.getElementById('erp-demo-gate')&&!document.getElementById('ls-loja-modal')&&!document.getElementById('erp-shortcuts-modal')){e.preventDefault();e.stopImmediatePropagation();if(isCaixaPrincipal()){const button=document.querySelector('#app .erp-shortcut-open');if(button)button.click();else open();}else open();}},true);update();obs.observe(document.body,{subtree:true,childList:true,characterData:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
