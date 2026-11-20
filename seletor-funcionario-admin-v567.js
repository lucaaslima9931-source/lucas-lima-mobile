/* V567 — Seletor de funcionários compartilhado no viewport principal. */
(function(){'use strict';
let current=null;
function close(){if(current){current.remove();current=null;}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
window.addEventListener('message',function(event){
 const d=event.data;if(!d||d.llAction!=='ll-employee-picker-open')return;
 const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===event.source && /(?:folha-pagamento|ferias|rescisoes)/.test(f.getAttribute('src')||''));
 if(!frame)return;close();
 const employees=Array.isArray(d.employees)?d.employees:[];
 const overlay=document.createElement('div');current=overlay;overlay.id='ll-employee-picker-v567';
 overlay.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:2147483647!important;background:rgba(4,24,55,.65)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;box-sizing:border-box!important;';
 overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-label="SELECIONE O FUNCIONÁRIO" style="width:min(960px,calc(100vw - 32px));max-height:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:hidden;background:#fff;border-radius:10px;color:#123c73;font:13px Arial,sans-serif;box-shadow:0 20px 50px #001b3b55;box-sizing:border-box"><header style="background:#245a95;color:#fff;padding:20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0"><strong style="font-size:16px">SELECIONE O FUNCIONÁRIO</strong><button id="ll-pick-x" type="button" aria-label="Fechar" style="background:transparent;color:white;border:1px solid #bcd2ec;border-radius:5px;padding:8px 12px;cursor:pointer">✕</button></header><div style="padding:18px 20px 12px;min-height:0;display:flex;flex-direction:column;flex:1"><div style="display:grid;grid-template-columns:110px minmax(0,1fr) 96px 145px;gap:6px;align-items:end;margin-bottom:12px"><label style="font-weight:bold;font-size:11px">PESQUISAR POR<select id="ll-pick-type" style="width:100%;height:44px;border:1px solid #bdd2f1;border-radius:5px;color:#173d70;background:white"><option value="nome">NOME</option><option value="id">CÓDIGO</option><option value="cpf">CPF</option></select></label><label style="font-weight:bold;font-size:11px">TEXTO DA PESQUISA<input id="ll-pick-query" placeholder="DIGITE PARA PESQUISAR..." style="box-sizing:border-box;width:100%;height:44px;border:1px solid #bdd2f1;border-radius:5px;padding:10px;color:#173d70"></label><button id="ll-pick-search" type="button" style="height:44px;border:0;border-radius:5px;background:#205a9a;color:white;font-weight:bold;cursor:pointer">PESQUISAR</button><button id="ll-pick-new" type="button" style="height:44px;border:0;border-radius:5px;background:#079d69;color:white;font-weight:bold;cursor:pointer">+ NOVO FUNCIONÁRIO</button></div><div style="overflow:auto;flex:1;min-height:100px;max-height:min(38vh,340px);border-bottom:1px solid #d3e0f4"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:12px"><thead style="position:sticky;top:0;background:#1e467b;color:white"><tr><th style="padding:13px 10px">CÓDIGO</th><th>NOME DO FUNCIONÁRIO</th><th>CARGO / FUNÇÃO</th><th>SITUAÇÃO</th></tr></thead><tbody id="ll-pick-rows"></tbody></table></div><footer style="display:flex;align-items:center;justify-content:space-between;padding:16px 0 0;gap:12px"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span>${d.includeTodos?'<button type="button" id="ll-pick-all" style="background:#009f78;color:white;border:0;border-radius:5px;padding:12px 18px;cursor:pointer">TODOS</button>':''}<button id="ll-pick-cancel" style="background:#eaf2ff;border:1px solid #b7cfff;border-radius:5px;padding:12px 18px;color:#205a9a;cursor:pointer">CANCELAR</button></footer></div></section>`;
 document.body.appendChild(overlay);
 const $=id=>overlay.querySelector('#'+id);
 function finish(id){try{frame.contentWindow.postMessage({llAction:'ll-employee-picker-result',id:d.id,employeeId:id},'*');}catch(_){}close();}
 function draw(){const field=$('ll-pick-type').value,q=$('ll-pick-query').value.toLocaleLowerCase('pt-BR').trim();const matches=employees.filter(e=>String(e[field]??'').toLocaleLowerCase('pt-BR').includes(q));$('ll-pick-rows').innerHTML=matches.map(e=>`<tr data-id="${esc(e.id)}" style="cursor:pointer;border-bottom:1px solid #cfdef1"><td style="padding:12px 10px">${esc(e.id)}</td><td>${esc(e.nome)}</td><td>${esc(e.cargo)}</td><td><span style="background:#c4f2dc;color:#08744a;border-radius:20px;padding:5px 12px">${esc(e.situacao||'ATIVO')}</span></td></tr>`).join('')||'<tr><td colspan="4" style="padding:18px">NENHUM FUNCIONÁRIO ENCONTRADO.</td></tr>';
 $('ll-pick-rows').querySelectorAll('tr[data-id]').forEach(tr=>tr.addEventListener('dblclick',()=>finish(tr.dataset.id)));}
 $('ll-pick-search').onclick=draw;$('ll-pick-type').onchange=draw;$('ll-pick-query').oninput=draw;
 $('ll-pick-query').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();draw();}};
 if(d.includeTodos)$('ll-pick-all').onclick=()=>finish('__TODOS__');$('ll-pick-x').onclick=()=>finish(null);$('ll-pick-cancel').onclick=()=>finish(null);
 // O cadastro permanece no módulo de funcionários; não inventar fluxo de criação.
 $('ll-pick-new').onclick=()=>{
   // Preserva os nós reais da folha, inclusive o iframe e seus campos preenchidos.
   const main=document.querySelector('#app-content')||document.querySelector('#content')||document.querySelector('main');
   const content=(typeof root==='function'?root():main);
   if(!content||typeof open!=='function')return;
   const saved=document.createDocumentFragment();
   while(content.firstChild)saved.appendChild(content.firstChild);
   const previousScreen=typeof screen!=='undefined'?screen:'FOLHA DE PAGAMENTO';
   close();
   try{open('FUNCIONÁRIOS');}catch(err){content.replaceChildren(saved);throw err;}
   const back=document.getElementById('rh-back');
   if(back){back.onclick=()=>{
      content.replaceChildren(saved);
      if(typeof screen!=='undefined')screen=previousScreen;
      if(typeof active==='function')active('ADMINISTRATIVO');
      // A folha permanece aberta, sem recriar a tela nem apagar os campos.
   };}
 };
 overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null);});
 draw();$('ll-pick-query').focus({preventScroll:true});
});
})();
