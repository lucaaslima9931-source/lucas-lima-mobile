
/* LUCAS LIMA — Contas a Pagar: parcelas individuais e pagamento integral */
(()=>{'use strict';
const STORE='erp_matriz_operacoes_v2';
const $=id=>document.getElementById(id);
const read=()=>{try{const d=JSON.parse(localStorage.getItem(STORE)||'{}');if(!Array.isArray(d.pagar))d.pagar=[];return d}catch{return {pagar:[]}}};
const persist=d=>{try{localStorage.setItem(STORE,JSON.stringify(d));return true}catch{alert('Não foi possível salvar os dados.');return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const dt=s=>s?String(s).slice(0,10).split('-').reverse().join('/'):'—';
const note=s=>typeof aviso==='function'?aviso('CONTAS A PAGAR',s):alert(s);
const paid=p=>Number(p.saldo??(Number(p.valor||0)-Number(p.pago||0)))<=0||['PAGA','BAIXADA','BAIXADO'].includes(p.situacao);
const status=p=>paid(p)?'BAIXADA':p.vencimento&&p.vencimento<today()?'VENCIDA':'PENDENTE';
const sup=()=>read().fornecedores||[];
let selected=null;let editing=null;
let draft=[];let cpSearched=false;let cpSupplierFilter="";
function nextNumber(){return Math.max(0,...read().pagar.map(x=>Number(x.conta||x.id)||0))+1}
function screenPay(){
 screen='CONTAS A PAGAR';active('FINANCEIRO');draft=[];editing=null;cpSearched=false;cpSupplierFilter='';
 root().innerHTML=`<div class="cp-page cp-pedidos">
 <div class="cp-caixa-header"><strong>▣ CONTAS A PAGAR</strong><button type="button" id="cp-shortcuts">⌂ ATALHOS</button></div>
 <div class="cp-summary"><div>PARCELAS PENDENTES<strong id="cp-pending">0</strong></div><div>PARCELAS VENCIDAS<strong id="cp-overdue">0</strong></div><div>PAGO NO MÊS<strong id="cp-month">R$ 0,00</strong></div><div>TOTAL A PAGAR<strong id="cp-total">R$ 0,00</strong></div></div>
 <section class="cp-panel"><h3>DADOS DA CONTA</h3><div class="cp-fields cp-header-fields">
 <label>Nº DA CONTA<input id="cp-number" value="${nextNumber()}" readonly></label>
 <label>DATA<input id="cp-date" type="date" value="${today()}" readonly></label>
 <label>FORNECEDOR *<span class="cp-supplier-picker"><input id="cp-supplier-name" value="SELECIONE" readonly><input id="cp-supplier" type="hidden"><button type="button" id="cp-pick-supplier">+</button></span></label>
 <label>SITUAÇÃO<input id="cp-account-status" value="PENDENTE" readonly></label>
 <label>USUÁRIO<input id="cp-user" readonly value="DEMONSTRAÇÃO"></label></div>
 <div class="cp-fields cp-desc-fields"><label>DESCRIÇÃO DA CONTA<input id="cp-desc" placeholder="DESCRIÇÃO / REFERÊNCIA"></label></div></section>
 <section class="cp-panel"><h3>PARCELAS DA CONTA</h3><div class="cp-fields cp-parcel-fields">
 <label>Nº DA PARCELA<input id="cp-parcel-no" readonly value="1"></label>
 <label>VENCIMENTO<input id="cp-due" type="date" value="${today()}"></label>
 <label>VALOR DA PARCELA<input id="cp-value" type="number" min="0.01" step="0.01" placeholder="0,00"></label>
 <button id="cp-add">＋ ADICIONAR PARCELA</button></div>
 <div class="cp-overflow"><table class="cp-table"><thead><tr><th>#</th><th>Nº PARCELA</th><th>VENCIMENTO</th><th>VALOR (R$)</th><th>SITUAÇÃO</th><th>AÇÃO</th></tr></thead><tbody id="cp-draft"></tbody></table></div>
 <div class="cp-actions"><button id="cp-new">NOVO</button><button id="cp-create">GRAVAR</button><button id="cp-edit">ALTERAR</button><button id="cp-pay">PAGAR</button><button id="cp-print">IMPRIMIR</button><button id="cp-back">VOLTAR</button></div></section>
 <section class="cp-panel"><h3>PESQUISAR PARCELAS</h3><div class="cp-fields cp-search-fields">
 <label>FORNECEDOR<span class="cp-supplier-picker"><input id="cp-filter-supplier-name" value="TODOS" readonly><input id="cp-filter-supplier" type="hidden"><button type="button" id="cp-filter-pick">+</button></span></label>
 
 <label>SITUAÇÃO<select id="cp-status"><option value="TODAS">TODAS</option><option value="PENDENTES">PENDENTES</option><option value="BAIXADAS">BAIXADAS</option><option value="CANCELADAS">CANCELADAS</option></select></label>
 <label>VENCIMENTO DE<input type="date" id="cp-from"></label><label>ATÉ<input type="date" id="cp-to"></label>
 <button id="cp-find">PESQUISAR</button></div>
 <div class="cp-overflow"><table class="cp-table"><thead><tr><th>Nº CONTA</th><th>FORNECEDOR</th><th>PARCELA</th><th>DESCRIÇÃO</th><th>VENCIMENTO</th><th>VALOR</th><th>SALDO</th><th>SITUAÇÃO</th></tr></thead><tbody id="cp-rows"></tbody></table></div>
 <div class="cp-results">PARCELAS <span id="cp-count"></span></div></section></div>`;
 const currentUser=document.querySelector('.top-user strong,.top-user,.user-name')?.textContent?.trim()||'DEMONSTRAÇÃO';
 $('cp-user').value=currentUser.replace(/^USUÁRIO\s*/i,'').trim()||'DEMONSTRAÇÃO';
 document.querySelectorAll('#app .pc-userline,#app [data-user-audit],#app .vt-user-field,#app .erp-user-next-to-field').forEach(x=>x.remove());
 document.querySelectorAll('#app label').forEach(x=>{if(x.textContent?.trim().toUpperCase()==='USUÁRIO'&&!x.contains($('cp-user')))x.remove()});
 const cpRemoveExtraActions=()=>{const actions=document.querySelector('.cp-page .cp-actions');if(!actions)return;Array.from(actions.querySelectorAll('button')).forEach((b,i)=>{if(i>=6||/atalhos/i.test(b.textContent||''))b.remove()})};
 cpRemoveExtraActions();
 if(window.__cpActionObserver)window.__cpActionObserver.disconnect();
 window.__cpActionObserver=new MutationObserver(cpRemoveExtraActions);
 window.__cpActionObserver.observe(document.querySelector('.cp-page .cp-actions'),{childList:true,subtree:true});
 $('cp-shortcuts').onclick=showCpShortcuts;
 const cpKeyHandler=e=>{if(!document.getElementById('cp-shortcuts'))return;if(e.key==='F1'){e.preventDefault();e.stopImmediatePropagation();showCpShortcuts()}else if(e.key==='F12'){e.preventDefault();e.stopImmediatePropagation();showCpLookup()}};
 if(window.__cpKeyHandler)document.removeEventListener('keydown',window.__cpKeyHandler);
 window.__cpKeyHandler=cpKeyHandler;document.addEventListener('keydown',cpKeyHandler);
 $('cp-add').onclick=addDraft;$('cp-create').onclick=create;$('cp-new').onclick=screenPay;
 $('cp-pick-supplier').onclick=pickSupplier;
 $('cp-edit').onclick=editAccount; $('cp-pay').onclick=()=>{const p=read().pagar.find(x=>String(x.conta||x.id)===String(editing));if(p)payment(Number(p.id));else note('LOCALIZE UMA CONTA PARA PAGAR.');};
 $('cp-print').onclick=()=>{const p=read().pagar.find(x=>String(x.conta||x.id)===String(editing));if(p)printOne(Number(p.id));else note('LOCALIZE UMA CONTA PARA IMPRIMIR.');};
 $('cp-filter-pick').onclick=()=>chooseCpSupplier(true);
 $('cp-find').onclick=()=>{cpSearched=true;render()};
 $('cp-back').onclick=()=>category('FINANCEIRO');renderDraft();render();
}

function showCpShortcuts(){
 const existing=document.querySelector('.cp-shortcuts-overlay');if(existing){existing.remove();return}
 const m=modal('⌂ ATALHOS — ▣ CONTAS A PAGAR',`<div class="cp-shortcut-list"><div class="cp-shortcut-row"><span class="cp-shortcut-key">F1</span><span>Abrir esta janela de atalhos</span></div><div class="cp-shortcut-row"><span class="cp-shortcut-key">F12</span><span>Localizar conta pelo número do lançamento</span></div></div><div class="cp-shortcut-footer"><button type="button" class="cp-shortcut-close">FECHAR</button></div>`);
 m.classList.add('cp-shortcuts-overlay');m.querySelector('.cp-dialog').classList.add('cp-shortcuts-dialog');
 m.querySelector('.cp-shortcut-close').onclick=()=>m.remove();
}
function showCpLookup(){
 document.querySelector('.cp-shortcuts-overlay')?.remove();
 document.getElementById('cp-localizar-f12')?.remove();
 const overlay=document.createElement('div');
 overlay.id='cp-localizar-f12';
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483640;background:rgba(5,25,55,.65);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
 overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="cp-localizar-title" style="box-sizing:border-box;width:min(475px,100%);background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 15px 40px #0005;color:#173e75;font:14px Arial,sans-serif">
 <header style="display:flex;justify-content:space-between;align-items:center;background:#1e4e86;color:#fff;padding:17px 20px;font-size:17px;font-weight:800"><span id="cp-localizar-title">▣ LUCAS LIMA — LOCALIZAR</span><button type="button" data-close aria-label="Fechar" style="border:0;background:transparent;color:white;font-size:24px;cursor:pointer">×</button></header>
 <div style="padding:22px 22px 8px"><p style="margin:0 0 18px">NÚMERO DO LANÇAMENTO:</p><label for="cp-localizar-numero" style="display:block;font-size:12px;font-weight:800;margin-bottom:9px">INFORME O VALOR</label><input id="cp-localizar-numero" type="text" inputmode="numeric" autocomplete="off" placeholder="DIGITE AQUI..." style="box-sizing:border-box;width:100%;height:43px;border:1px solid #8db8f6;border-radius:7px;padding:0 12px;font:13px Arial,sans-serif;color:#173e75;outline-color:#1a63bf"><p data-error role="alert" style="color:#b42332;min-height:17px;font-size:12px;margin:8px 0 0"></p></div>
 <footer style="display:flex;justify-content:center;gap:10px;padding:12px 20px 22px"><button type="button" data-confirm style="background:#195ba9;color:white;border:0;border-radius:6px;padding:12px 22px;font-weight:800;cursor:pointer">CONFIRMAR</button><button type="button" data-cancel style="background:#eef4ff;color:#174d89;border:1px solid #bbd2f4;border-radius:6px;padding:12px 22px;font-weight:800;cursor:pointer">CANCELAR</button></footer></section>`;
 document.body.appendChild(overlay);
 const input=overlay.querySelector('input'),error=overlay.querySelector('[data-error]');
 const close=()=>{document.removeEventListener('keydown',onKey,true);overlay.remove()};
 const locate=()=>{const raw=input.value.trim();if(!/^[1-9]\d*$/.test(raw)){error.textContent='INFORME UM NÚMERO DE LANÇAMENTO VÁLIDO.';input.focus();return}const p=read().pagar.find(x=>String(x.conta||x.id)===String(Number(raw)));if(!p){error.textContent='LANÇAMENTO Nº '+raw+' NÃO ENCONTRADO.';input.focus();return}close();loadAccount(Number(p.id))};
 const onKey=e=>{if(['Escape','Enter','F12'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')close();else if(e.key==='Enter')locate()}};
 overlay.querySelector('[data-close]').onclick=close;overlay.querySelector('[data-cancel]').onclick=close;overlay.querySelector('[data-confirm]').onclick=locate;
 document.addEventListener('keydown',onKey,true);input.focus();
}

function pickSupplier(){chooseCpSupplier(false)}
function chooseCpSupplier(forFilter){
 document.getElementById('cp-supplier-modal')?.remove();
 const overlay=document.createElement('div');overlay.id='cp-supplier-modal';overlay.className='pc-modal';
 overlay.innerHTML=`<div class="pc-supplier-dialog" role="dialog" aria-modal="true" aria-label="Selecione o fornecedor">
 <header><strong>SELECIONE O FORNECEDOR</strong><button type="button" id="cp-sup-close" aria-label="Fechar">×</button></header>
 <div class="pc-supplier-content"><div class="pc-supplier-search">
 <label>PESQUISAR POR<select id="cp-sup-mode"><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label>
 <label>TEXTO DA PESQUISA<input id="cp-sup-query" type="text" placeholder="DIGITE PARA PESQUISAR..."></label>
 <button type="button" id="cp-sup-find">PESQUISAR</button><button type="button" id="cp-sup-new">+ NOVO FORNECEDOR</button></div>
 <div class="pc-supplier-list"><table><thead><tr><th>CÓDIGO</th><th>NOME DO FORNECEDOR</th><th>SITUAÇÃO</th></tr></thead><tbody id="cp-sup-rows"></tbody></table></div>
 <footer><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" id="cp-sup-cancel">CANCELAR</button></footer></div></div>`;
 document.body.appendChild(overlay);
 const close=()=>{document.removeEventListener('keydown',keyHandler,true);overlay.remove()};
 const keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',keyHandler,true);
 overlay.querySelector('#cp-sup-close').onclick=close;overlay.querySelector('#cp-sup-cancel').onclick=close;
 overlay.onclick=e=>{if(e.target===overlay)close()};
 const input=overlay.querySelector('#cp-sup-query'),mode=overlay.querySelector('#cp-sup-mode'),tbody=overlay.querySelector('#cp-sup-rows');
 const supplierStatus=f=>String(f.situacao||f.status||(f.ativo===false?'INATIVO':'ATIVO')).toUpperCase();
 function search(){
  const q=input.value.trim().toLocaleLowerCase('pt-BR'),byCode=mode.value==='codigo';
  const found=sup().filter(f=>String(byCode?(f.id??f.codigo):(f.nome??f.razaoSocial??'')).toLocaleLowerCase('pt-BR').includes(q));
  const rows=(forFilter?'<tr data-supplier-id="" tabindex="0"><td>—</td><td>TODOS</td><td>—</td></tr>':'')+found.map(f=>{const status=supplierStatus(f);return `<tr data-supplier-id="${esc(f.id)}" tabindex="0"><td>${esc(f.id)}</td><td>${esc(f.nome||f.razaoSocial||'')}</td><td><span class="pc-supplier-status ${status==='ATIVO'?'':'inactive'}">${esc(status)}</span></td></tr>`}).join('');
  tbody.innerHTML=rows||'<tr><td colspan="3">NENHUM FORNECEDOR ENCONTRADO.</td></tr>';
  tbody.querySelectorAll('[data-supplier-id]').forEach(row=>{
   const select=()=>{const value=row.dataset.supplierId,f=sup().find(x=>String(x.id)===value);
    if(value!==''&&!f)return;
    if(!forFilter&&f&&supplierStatus(f)!=='ATIVO'){note('FORNECEDOR INATIVO. SELECIONE UM FORNECEDOR ATIVO.');return}
    if(forFilter){cpSupplierFilter=value;$('cp-filter-supplier').value=value;$('cp-filter-supplier-name').value=f?(f.nome||f.razaoSocial||''):'TODOS'}
    else if(f){$('cp-supplier').value=String(f.id);$('cp-supplier-name').value=f.nome||f.razaoSocial||''}
    close();};
   row.addEventListener('dblclick',select);row.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();select()}});
  });
 }
 overlay.querySelector('#cp-sup-find').onclick=search;
 input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search()}};
 overlay.querySelector('#cp-sup-new').onclick=()=>{
  close();
  // Preservar a tela e os dados da conta, inclusive parcelas ainda não gravadas.
  const fields={};document.querySelectorAll('.cp-page input,.cp-page select').forEach(el=>{if(el.id)fields[el.id]=el.value});
  const state={fields,draft:draft.map(x=>({...x})),editing,cpSearched,cpSupplierFilter,forFilter};
  window.__cpSupplierReturn={
   restore(item){
    screenPay();
    Object.entries(state.fields).forEach(([id,value])=>{const el=$(id);if(el)el.value=value});
    draft=state.draft.map(x=>({...x}));editing=state.editing;cpSearched=state.cpSearched;cpSupplierFilter=state.cpSupplierFilter;
    if(item){const name=item.nome||item.razaoSocial||'';
     if(state.forFilter){cpSupplierFilter=String(item.id);$('cp-filter-supplier').value=String(item.id);$('cp-filter-supplier-name').value=name}
     else{$('cp-supplier').value=String(item.id);$('cp-supplier-name').value=name}
    }
    renderDraft();updateAccountStatus();render();
    window.__cpSupplierReturn=null;
   }
  };
  if(typeof open==='function'){open('FORNECEDORES')}else{window.__cpSupplierReturn=null;note('ABRA O CADASTRO DE FORNECEDORES NO MENU CADASTROS.')}
 };
 search();input.focus();
}
function loadAccount(id){const p=read().pagar.find(x=>Number(x.id)===id);if(!p)return;editing=p.conta||p.id;$('cp-number').value=editing;$('cp-supplier').value=p.pessoa||'';$('cp-supplier-name').value=supplierName(p);$('cp-desc').value=p.descricao||'';draft=read().pagar.filter(x=>String(x.conta||x.id)===String(editing)).map(x=>({id:x.id,due:x.vencimento,value:Number(x.valor),situacao:status(x),saldo:Number(x.saldo??x.valor)}));renderDraft();updateAccountStatus();const locked=read().pagar.some(x=>String(x.conta||x.id)===String(editing)&&(paid(x)||Number(x.pago||0)>0||(x.pagamentos||[]).length));$('cp-edit').disabled=locked;$('cp-edit').title=locked?'CONTA COM PAGAMENTO REGISTRADO: ALTERAÇÃO BLOQUEADA':'';window.scrollTo({top:0,behavior:'smooth'});}
function editAccount(){if(!editing)return note('LOCALIZE UMA CONTA PARA ALTERAR.');const d=read(),rows=d.pagar.filter(x=>String(x.conta||x.id)===String(editing));if(!rows.length)return note('CONTA NÃO ENCONTRADA.');if(rows.some(x=>paid(x)||Number(x.pago||0)>0||(x.pagamentos||[]).length))return note('CONTA COM PAGAMENTOS NÃO PODE TER PARCELAS ALTERADAS.');if(!$('cp-supplier').value||!$('cp-desc').value.trim()||!draft.length)return note('INFORME FORNECEDOR, DESCRIÇÃO E PARCELAS.');const old=rows.map(x=>x.id);d.pagar=d.pagar.filter(x=>!old.includes(x.id));let next=Math.max(0,...d.pagar.map(x=>Number(x.id)||0),...old)+1;draft.forEach((p,i)=>d.pagar.push({id:next++,conta:editing,parcela:i+1,totalParcelas:draft.length,pessoa:$('cp-supplier').value,descricao:$('cp-desc').value.trim(),valor:p.value,pago:0,saldo:p.value,vencimento:p.due,situacao:'PENDENTE',pagamentos:[],usuario:$('cp-user').value}));if(persist(d)){note('CONTA ALTERADA.');screenPay()}}

function updateAccountStatus(){const field=$('cp-account-status');if(!field)return;if(!editing){field.value='PENDENTE';return;}const rows=read().pagar.filter(x=>String(x.conta||x.id)===String(editing));field.value=rows.length&&rows.every(p=>paid(p))?'BAIXADA':rows.some(p=>['CANCELADA','CANCELADO'].includes(String(p.situacao).toUpperCase()))?'CANCELADA':'PENDENTE';}
function renderDraft(){
 $('cp-parcel-no').value=draft.length+1;
 $('cp-draft').innerHTML=draft.map((p,i)=>`<tr><td>${i+1}</td><td>${i+1}/${draft.length}</td><td>${dt(p.due)}</td><td>${money(p.value)}</td><td>${p.situacao||"PENDENTE"}</td><td>${p.id?"—":`<button data-remove="${i}">EXCLUIR</button>`}</td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center">Nenhuma parcela adicionada.</td></tr>';
 document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{draft.splice(Number(b.dataset.remove),1);renderDraft()});
}
function addDraft(){
 const due=$('cp-due').value,value=Number($('cp-value').value);
 if(!due||!Number.isFinite(value)||value<=0)return note('INFORME O VENCIMENTO E O VALOR DA PARCELA.');
 draft.push({due,value:Math.round(value*100)/100});$('cp-value').value='';renderDraft();
}
function create(){
 if(editing)return note('CONTA CARREGADA. CLIQUE ALTERAR OU NOVO.');
 const supplier=$('cp-supplier').value,desc=$('cp-desc').value.trim();
 if(!supplier||!desc||!draft.length)return note('SELECIONE O FORNECEDOR, INFORME A DESCRIÇÃO E ADICIONE AO MENOS UMA PARCELA.');
 const d=read(),id=nextNumber();let nextId=Math.max(0,...d.pagar.map(x=>Number(x.id)||0))+1;
 draft.forEach((p,i)=>d.pagar.push({id:nextId++,conta:id,parcela:i+1,totalParcelas:draft.length,pessoa:supplier,descricao:desc,valor:p.value,pago:0,saldo:p.value,vencimento:p.due,situacao:'PENDENTE',pagamentos:[],ref:null,usuario:$('cp-user').value}));
 if(persist(d)){note('CONTA CADASTRADA COM '+draft.length+' PARCELA(S).');screenPay()}
}
const supplierName=p=>{const f=sup().find(x=>String(x.id)===String(p.pessoa));return f?.nome||p.pessoa||'NÃO INFORMADO'};
function loadAccountByNumber(n){const p=read().pagar.find(x=>String(x.conta||x.id)===String(n));if(p)loadAccount(Number(p.id));else note('CONTA NÃO ENCONTRADA.')}
function filtered(){const f=cpSupplierFilter,st=$('cp-status').value,from=$('cp-from').value,to=$('cp-to').value;return read().pagar.filter(p=>{const canceled=p.ccCancelado||['CANCELADA','CANCELADO'].includes(String(p.situacao||'').toUpperCase());const match=st==='TODAS'||(st==='CANCELADAS'&&canceled)||(st==='PENDENTES'&&!canceled&&!paid(p))||(st==='BAIXADAS'&&!canceled&&paid(p));return match&&(!f||String(p.pessoa)===f)&&(!from||p.vencimento>=from)&&(!to||p.vencimento<=to)})}
function render(){
 const d=read(),all=d.pagar,unpaid=all.filter(p=>!paid(p)),month=today().slice(0,7);
 $('cp-pending').textContent=unpaid.length;
 $('cp-overdue').textContent=unpaid.filter(p=>status(p)==='VENCIDA').length;
 $('cp-total').textContent=money(unpaid.reduce((a,p)=>a+Number(p.saldo??p.valor),0));
 $('cp-month').textContent=money(all.flatMap(p=>p.pagamentos||[]).filter(x=>!x.estornado&&String(x.data||'').startsWith(month)).reduce((a,x)=>a+Number(x.total||x.valor||0),0));
 const rows=cpSearched?filtered():[];$('cp-count').textContent=cpSearched?'('+rows.length+' ENCONTRADAS)':'';
 $('cp-rows').innerHTML=rows.map(p=>`<tr data-cp-open="${p.id}" title="DUPLO CLIQUE PARA ABRIR"><td>${esc(p.conta||p.ref||p.id)}</td><td>${esc(supplierName(p))}</td><td>${esc(p.parcela||1)}/${esc(p.totalParcelas||1)}</td><td>${esc(p.descricao)}</td><td>${dt(p.vencimento)}</td><td>${money(p.valor)}</td><td>${money(p.saldo??p.valor)}</td><td class="cp-${status(p).toLowerCase()}">${p.ccCancelado||['CANCELADA','CANCELADO'].includes(String(p.situacao||'').toUpperCase())?'CANCELADA':status(p)}</td></tr>`).join('')||'<tr><td colspan="8">NENHUMA PARCELA ENCONTRADA.</td></tr>';
 document.querySelectorAll('[data-cp-open]').forEach(r=>r.ondblclick=e=>{if(e.target.closest('button'))return;loadAccount(Number(r.dataset.cpOpen))});
 document.querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>payment(Number(b.dataset.pay)));
 document.querySelectorAll('[data-print]').forEach(b=>b.onclick=()=>printOne(Number(b.dataset.print)));
 document.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>history(Number(b.dataset.history))); 
}
function modal(title,content){
 const layer=document.createElement('div');layer.className='cp-overlay';layer.innerHTML=`<div class="cp-dialog"><header><strong>${esc(title)}</strong><button data-close>✕</button></header><div class="cp-modalbody">${content}</div></div>`;document.body.append(layer);layer.querySelector('[data-close]').onclick=()=>layer.remove();layer.onclick=e=>{if(e.target===layer)layer.remove()};return layer;
}
function registeredPayMethods(){
 try{const data=JSON.parse(localStorage.getItem('erp_matriz_formas_pagamento_v1')||'{}');return (Array.isArray(data.formas)?data.formas:[]).filter(f=>(f.ativo===true||String(f.ativo).toUpperCase()==='SIM'||String(f.situacao||'').toUpperCase()==='ATIVO')&&f.compras!==false)}catch{return []}
}
function payment(id){
 const p=read().pagar.find(x=>Number(x.id)===id);if(p?.ccCancelado||p?.situacao==='CANCELADA')return note('CONTA CANCELADA NO CENTRO DE CUSTOS.');if(!p||paid(p))return note('PARCELA JÁ PAGA.');
 const methods=registeredPayMethods();
 const finKey='erp_systems_financeiro_v1';
 const finData=(()=>{try{return JSON.parse(localStorage.getItem(finKey)||'{}')}catch{return {}}})();
 const accounts=(Array.isArray(finData.contas)?finData.contas:[]).filter(a=>a.ativo!==false);
 const m=modal('PAGAR PARCELA',`<div class="cp-payment-info"><strong>${esc(supplierName(p))} — ${esc(p.parcela||1)}/${esc(p.totalParcelas||1)}</strong><span>VALOR DA PARCELA: <b>${money(p.saldo??p.valor)}</b></span></div><div class="cp-payment-grid cp-payment-values"><label>VALOR A ABATER DO SALDO<input id="cp-amount" type="number" min="0.01" step="0.01" value="${Number(p.saldo??p.valor)}"></label><label>JUROS (R$)<input id="cp-interest" type="number" min="0" step="0.01" value="0"></label><label>MULTA (R$)<input id="cp-fine" type="number" min="0" step="0.01" value="0"></label><label>DESCONTO (R$)<input id="cp-discount" type="number" min="0" step="0.01" value="0"></label></div><div class="cp-payment-grid cp-payment-details"><label>DATA DO PAGAMENTO<input id="cp-paydate" type="date" value="${today()}"></label><label>CONTA DE ORIGEM<select id="cp-origin"><option value="">SELECIONE</option>${accounts.map(a=>`<option value="${esc(a.id)}">${esc(a.nome)}</option>`).join('')}</select></label><label>FORMA DE PAGAMENTO<select id="cp-method"><option value="">SELECIONE</option>${methods.map(f=>`<option value="${esc(f.id)}">${esc(f.descricao||f.tipo||f.id)}</option>`).join('')}</select></label></div>${methods.length?'':'<small>NENHUMA FORMA ATIVA HABILITADA PARA COMPRAS. CADASTRE EM FORMAS DE PAGAMENTO.</small>'}<div class="cp-payment-total"><span>TOTAL A PAGAR</span><strong id="cp-paytotal"></strong></div><div class="cp-payment-actions"><button type="button" id="cp-payment-close">FECHAR</button><button type="button" id="cp-confirm">CONFIRMAR PAGAMENTO</button></div>`);
 m.classList.add('cp-payment-overlay');
 m.querySelector('#cp-payment-close').onclick=()=>m.remove();
 const calc=()=>{const j=Number($('cp-interest').value),fine=Number($('cp-fine').value),discount=Number($('cp-discount').value);return {j,fine,discount,total:Math.round((Number($('cp-amount').value)+j+fine-discount)*100)/100}};
 const update=()=>{$('cp-paytotal').textContent=money(calc().total)};
 for(const x of ['cp-amount','cp-interest','cp-fine','cp-discount'])$(x).oninput=update;update();
 $('cp-confirm').onclick=()=>{
 const origin=accounts.find(a=>String(a.id)===$('cp-origin').value);if(!origin)return note('SELECIONE UMA CONTA DE ORIGEM ATIVA.');
 const selectedMethod=methods.find(f=>String(f.id)===$('cp-method').value);if(!selectedMethod)return note('SELECIONE UMA FORMA DE PAGAMENTO CADASTRADA E ATIVA.');
 const v=calc();if(![v.j,v.fine,v.discount,v.total].every(Number.isFinite)||Number($('cp-amount').value)<=0||Number($('cp-amount').value)>Number(p.saldo??p.valor)+0.001||v.j<0||v.fine<0||v.discount<0||v.total<=0||!$('cp-paydate').value)return note('CONFIRA OS VALORES DO PAGAMENTO.');
 const d=read(),row=d.pagar.find(x=>Number(x.id)===id);if(!row||paid(row))return note('PARCELA JÁ QUITADA.');
 row.pagamentos=Array.isArray(row.pagamentos)?row.pagamentos:[];row.pagamentos.push({data:$('cp-paydate').value,valor:Number($('cp-amount').value),juros:v.j,multa:v.fine,desconto:v.discount,total:v.total,forma:selectedMethod.descricao||selectedMethod.tipo,formaId:selectedMethod.id,tipoForma:selectedMethod.tipo,contaId:origin.id,conta:origin.nome,estornado:false,criadoEm:new Date().toISOString()});
 row.pago=Math.round((Number(row.pago||0)+Number($('cp-amount').value))*100)/100;row.saldo=Math.max(0,Math.round((Number(row.valor)-row.pago)*100)/100);row.situacao=row.saldo<=0?'BAIXADA':'PENDENTE';
 // Sincronizar a baixa do lançamento original do Centro de Custos, sem criar outro pagamento.
 const ccKey='lucas_lima_cc_lancamentos_v2';
 let ccOld=null,ccNew=null;
 if(row.ccLancamentoId!=null){
   try{
     ccOld=localStorage.getItem(ccKey);
     ccNew=JSON.parse(ccOld||'[]');
     if(!Array.isArray(ccNew))throw Error('DADOS INVÁLIDOS');
     const lanc=ccNew.find(x=>String(x.id)===String(row.ccLancamentoId));
     if(!lanc)throw Error('LANÇAMENTO VINCULADO NÃO ENCONTRADO');
     const related=d.pagar.filter(x=>String(x.ccLancamentoId)===String(row.ccLancamentoId));
     const fullyPaid=related.every(x=>paid(x));
     lanc.status=fullyPaid?'BAIXADO':'PENDENTE';
     lanc.pago=related.reduce((a,x)=>a+Number(x.pago||0),0);
     lanc.saldo=related.reduce((a,x)=>a+Number((x.saldo??x.valor)||0),0);
     lanc.usuario=row.usuario||lanc.usuario;
     lanc.historico=Array.isArray(lanc.historico)?lanc.historico:[];
     lanc.historico.push({acao:fullyPaid?'BAIXA AUTOMÁTICA POR PAGAMENTO':'PAGAMENTO PARCIAL',usuario:row.usuario||'SISTEMA',data:new Date().toLocaleString('pt-BR'),conta:row.conta,parcela:row.parcela,valor:v.total});
   }catch(err){return note('NÃO FOI POSSÍVEL SINCRONIZAR O CENTRO DE CUSTOS: '+err.message)}
 }
 const oldDb=localStorage.getItem(STORE),oldFin=localStorage.getItem(finKey);
 const movementRef='CP-'+String(row.id)+'-'+String(row.pagamentos.length);
 let financial;try{financial=JSON.parse(oldFin||'{}')}catch{financial={}}
 financial.movimentos=Array.isArray(financial.movimentos)?financial.movimentos:[];
 if(financial.movimentos.some(x=>x.ref===movementRef))return note('PAGAMENTO JÁ REGISTRADO NO FINANCEIRO.');
 financial.movimentos.push({id:Math.max(0,...financial.movimentos.map(x=>Number(x.id)||0))+1,date:$('cp-paydate').value,conta:origin.id,tipo:'SAIDA',valor:v.total,descricao:'PAGAMENTO CONTA A PAGAR Nº '+String(row.conta||row.id)+' — PARCELA '+String(row.parcela||1),ref:movementRef,categoria:'CONTAS A PAGAR',usuario:row.usuario||'SISTEMA',created:new Date().toISOString()});
 try{
   if(ccNew)localStorage.setItem(ccKey,JSON.stringify(ccNew));
   localStorage.setItem(finKey,JSON.stringify(financial));
   if(!persist(d))throw Error('FALHA AO SALVAR');
 }catch(err){try{if(ccNew){if(ccOld===null)localStorage.removeItem(ccKey);else localStorage.setItem(ccKey,ccOld)}if(oldDb===null)localStorage.removeItem(STORE);else localStorage.setItem(STORE,oldDb);if(oldFin===null)localStorage.removeItem(finKey);else localStorage.setItem(finKey,oldFin)}catch{}return note('NÃO FOI POSSÍVEL CONCLUIR O PAGAMENTO. '+err.message)}
 m.remove();const currentAccount=row.conta||row.id;screenPay();loadAccountByNumber(currentAccount);render();note(row.situacao==='BAIXADA'?'PARCELA BAIXADA. CENTRO DE CUSTOS ATUALIZADO, QUANDO VINCULADO.':'PAGAMENTO PARCIAL REGISTRADO. SALDO ATUALIZADO.');
 };
}
function history(id){
 const p=read().pagar.find(x=>Number(x.id)===id);if(!p)return;
 const records=(p.pagamentos||[]).map(x=>`<tr><td>${dt(x.data)}</td><td>${esc(x.forma)}</td><td>${money(x.total??x.valor)}</td><td>${x.estornado?'ESTORNADO':'CONFIRMADO'}</td></tr>`).join('');
 modal('HISTÓRICO DE PAGAMENTOS',`<p>${esc(p.descricao)} — PARCELA ${esc(p.parcela||1)}/${esc(p.totalParcelas||1)}</p><table class="cp-table"><thead><tr><th>DATA</th><th>FORMA</th><th>VALOR</th><th>SITUAÇÃO</th></tr></thead><tbody>${records||'<tr><td colspan="4">SEM PAGAMENTOS</td></tr>'}</tbody></table><p><b>ESTORNAR PAGAMENTO:</b> indisponível nesta versão local. É necessária autenticação real para validar a senha do usuário conectado com segurança.</p>`);
}
function printOne(id){
 const data=read();const p=data.pagar.find(x=>Number(x.id)===id);if(!p)return;
 const rows=data.pagar.filter(x=>String(x.conta||x.id)===String(p.conta||p.id));
 const pays=rows.flatMap(x=>(x.pagamentos||[]).filter(z=>!z.estornado).map(z=>({...z,parcela:(x.parcela||1)+'/'+(x.totalParcelas||1)})));
 const total=rows.reduce((a,x)=>a+Number(x.valor||0),0),saldo=rows.reduce((a,x)=>a+Number(x.saldo??x.valor??0),0);
 const host=document;host.getElementById('cp-print-overlay')?.remove();
 const overlay=host.createElement('div');overlay.id='cp-print-overlay';overlay.style.cssText='position:fixed;inset:0;z-index:2147483640;background:#071c3bb5;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:Arial,sans-serif;color:#143c70';
 overlay.innerHTML=`<div style="background:white;border-radius:11px;width:min(1250px,96vw);height:min(610px,85vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 15px 45px #001b3b55"><header style="background:#20548d;color:white;display:flex;justify-content:space-between;align-items:center;padding:17px 22px;font-size:19px;font-weight:800">IMPRIMIR CONTAS A PAGAR<button data-close style="background:transparent;color:white;border:0;font-size:27px;cursor:pointer">×</button></header><div style="display:grid;grid-template-columns:40% minmax(0,60%);gap:14px;padding:15px;overflow:hidden;flex:1;min-height:0;box-sizing:border-box"><div style="overflow:auto;display:flex;flex-direction:column;gap:13px"><section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">DADOS DA CONTA SELECIONADA</h3><p><b>Nº DA CONTA:</b> ${esc(p.conta||p.id)}</p><p><b>FORNECEDOR:</b> ${esc(supplierName(p))}</p><p><b>DESCRIÇÃO:</b> ${esc(p.descricao||'—')}</p><p><b>PARCELAS:</b> ${rows.length}</p><p><b>VALOR:</b> ${money(total)}</p><p><b>SALDO:</b> ${money(saldo)}</p><p><b>SITUAÇÃO:</b> ${esc(rows.every(paid)?'BAIXADA':'PENDENTE')}</p></section><section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">TIPO DE IMPRESSÃO</h3><label style="display:block;margin:12px 0"><input type="radio" name="cp-print-kind" value="complete" checked> COMPLETA (Dados, Pagamentos e Assinaturas)</label><label style="display:block;margin:12px 0"><input type="radio" name="cp-print-kind" value="simple"> SIMPLIFICADA (Dados e Valores)</label></section><section style="border:1px solid #c2d7f5;border-radius:6px;padding:12px"><h3 style="background:#e0ebfa;margin:0 0 12px;padding:12px;font-size:15px">OPÇÕES DE IMPRESSÃO</h3><label><input type="checkbox" data-sign checked> INCLUIR ASSINATURA</label></section></div><div style="border:1px solid #c2d7f5;background:#eef5fd;border-radius:6px;padding:12px;display:flex;flex-direction:column;min-width:0;min-height:0"><h3 style="background:#e0ebfa;text-align:center;margin:0 0 10px;padding:11px;font-size:15px">PRÉ-VISUALIZAÇÃO A4</h3><iframe data-preview title="PRÉ-VISUALIZAÇÃO A4" style="width:100%;flex:1;border:1px solid #c2d7f5;background:white;min-height:0"></iframe></div></div><footer style="border-top:1px solid #d6e2f2;padding:12px 20px;display:flex;justify-content:flex-end;gap:10px"><button data-print style="background:#1765df;color:white">IMPRIMIR</button><button data-save style="background:#009d74;color:white">SALVAR</button><button data-close style="background:#e4efff;color:#10417b">FECHAR</button></footer></div>`;
 overlay.querySelectorAll('footer button').forEach(b=>b.style.cssText+=';border:0;border-radius:5px;padding:13px 22px;font-weight:bold;cursor:pointer');host.body.appendChild(overlay);
 const frame=overlay.querySelector('[data-preview]');let html='';
 const field=(k,v)=>`<div class="field"><b>${esc(k)}</b><span>${esc(v)}</span></div>`;
 const tr=(cells)=>`<tr>${cells.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`;
 const refresh=()=>{
  const complete=overlay.querySelector('input[name="cp-print-kind"]:checked').value==='complete';
  const sign=complete&&overlay.querySelector('[data-sign]').checked;
  const user=String(document.querySelector('[id*="usuario"]')?.textContent||window.usuarioLogado?.nome||'USUÁRIO').trim();
  const emit='EMITIDO EM '+new Date().toLocaleDateString('pt-BR')+', POR '+user.toUpperCase()+'.';
  const details=field('Nº DA CONTA',p.conta||p.id)+field('FORNECEDOR',supplierName(p))+field('DESCRIÇÃO',p.descricao||'—')+field('VALOR ORIGINAL',money(total))+field('TOTAL PAGO',money(total-saldo))+field('SALDO A PAGAR',money(saldo));
  const parcelTable=`<h3>PARCELAS DA CONTA</h3><table><thead><tr><th>PARCELA</th><th>VENCIMENTO</th><th>VALOR</th><th>SALDO</th><th>SITUAÇÃO</th></tr></thead><tbody>${rows.map(x=>tr([(x.parcela||1)+'/'+(x.totalParcelas||1),dt(x.vencimento),money(x.valor),money(x.saldo??x.valor),status(x)])).join('')}</tbody></table>`;
  const payTable=complete&&pays.length?`<h3>PAGAMENTOS REALIZADOS</h3><table><thead><tr><th>DATA / PARCELA</th><th>FORMA / CONTA</th><th>JUROS</th><th>MULTA</th><th>DESCONTO</th><th>PAGO</th></tr></thead><tbody>${pays.map(z=>tr([dt(z.data)+' — '+z.parcela,(z.forma||'—')+' / '+(z.contaOrigem||z.conta||z.contaId||'—'),money(z.juros),money(z.multa),money(z.desconto),money(z.total??z.valor)])).join('')}</tbody></table>`:'';
  html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>CONTAS A PAGAR — ${esc(p.conta||p.id)}</title><style>@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{font:12px Arial;color:#173c70;background:white;margin:0;padding:15px}h1{font-size:19px;margin:0 0 6px}h2{font-size:15px;margin:12px 0;border-bottom:2px solid #20548d;padding-bottom:8px}h3{font-size:12px;background:#e0ebfa;padding:9px;margin:20px 0 8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.field{border-bottom:1px solid #d9e4f1;padding:7px 2px;display:flex;flex-direction:column;gap:5px}.field b{font-size:10px}.field span{font-size:12px}table{width:100%;border-collapse:collapse;font-size:10px}th{text-align:left;background:#e0ebfa}td,th{padding:7px 5px;border-bottom:1px solid #d9e4f1}.sign{margin-top:45px;text-align:center}.sign span{display:inline-block;border-top:1px solid #173c70;padding:7px 50px}.foot{margin-top:28px;font-size:10px;text-align:right;width:100%}@media print{body{padding:0}}</style></head><body><h1>LUCAS LIMA — 01 MATRIZ</h1><h2>COMPROVANTE — CONTAS A PAGAR</h2><div class="grid">${details}</div>${parcelTable}${payTable}${sign?'<div class="sign"><span>ASSINATURA DO RESPONSÁVEL</span></div>':''}<div class="foot">${esc(emit)}</div></body></html>`;
  frame.srcdoc=html;
 };
 overlay.querySelectorAll('input').forEach(x=>x.addEventListener('change',refresh));overlay.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>overlay.remove());overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
 overlay.querySelector('[data-print]').onclick=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch{note('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO.')}};
 overlay.querySelector('[data-save]').onclick=async()=>{const filename='CONTAS_A_PAGAR_'+(p.conta||p.id)+'.html';try{if(window.showSaveFilePicker){const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento HTML',accept:{'text/html':['.html']}}]});const writer=await handle.createWritable();await writer.write(html);await writer.close();return}}catch(e){if(e.name==='AbortError')return}const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 refresh();
}

window.LLopenPayableFromDRE=id=>{const p=read().pagar.find(x=>String(x.conta||x.id)===String(id));if(!p)return false;screenPay();loadAccount(Number(p.id));return true};
const oldOpen=open;open=function(name){if(name==='CONTAS A PAGAR')return screenPay();return oldOpen(name)};
})();
