(()=>{'use strict';
const DB='erp_systems_pedidos_compra_v1';let id=null,items=[],filter=false,searchFilters={from:'',to:'',supplier:'',status:''};
const $=x=>document.getElementById(x), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{return JSON.parse(localStorage.getItem(DB)||'[]')}catch{return []}};
const write=a=>localStorage.setItem(DB,JSON.stringify(a));
const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dt=()=>new Date().toLocaleDateString('en-CA');const stamp=()=>new Date().toISOString();
const user=()=>document.querySelector('header strong')?.textContent?.trim()||'DEMONSTRAÇÃO';
const suppliers=()=>{try{return JSON.parse(localStorage.getItem('erp_matriz_operacoes_v2')||'{}').fornecedores||[]}catch{return []}};
const total=()=>items.reduce((s,i)=>s+i.q*i.cost,0);
const msg=t=>typeof aviso==='function'?aviso('PEDIDOS DE COMPRA',t):erpAlert(t);
const field=(label,html)=>`<label class="pc-field"><span>${label}</span>${html}</label>`;
const inp=(x,type='text',extra='')=>`<input id="pc-${x}" type="${type}" ${extra}>`;
const options=()=>suppliers().map(s=>`<option value="${esc(s.id)}">${esc(s.id)} - ${esc(s.nome)}</option>`).join('');
const prods=()=>products.map(p=>`<option value="${esc(p.codigo)}">${esc(p.codigo)} - ${esc(p.descricao)}</option>`).join('');
const next=()=>Math.max(0,...read().map(x=>Number(x.id)||0))+1;
function render(){const rec=read().find(x=>x.id===id),locked=rec?.status==='CANCELADO'||rec?.status==='BAIXADA';const w=root();w.innerHTML=`<div class="pc-page"><div class="pc-title"><h1>▣ PEDIDOS DE COMPRA</h1><button type="button" class="pc-shortcut" data-pc="shortcuts">⌂ ATALHOS</button></div><section class="pc-card"><h3>DADOS DO PEDIDO</h3><div class="pc-grid pc-head">${field('Nº DO PEDIDO',inp('id','text','readonly'))}${field('DATA',inp('date','date'))}${field('FORNECEDOR *',`<div class="pc-picker"><input id="pc-supplier" type="hidden"><input id="pc-supplier-name" type="text" value="SELECIONE O FORNECEDOR" readonly aria-label="Fornecedor selecionado" title="Clique em + para selecionar o fornecedor"><button type="button" class="pc-plus" data-pc="supplier" title="Localizar fornecedor">+</button></div>`)}${field('SITUAÇÃO',inp('status','text','readonly'))}${field('USUÁRIO',inp('user','text','readonly'))}</div></section><div class="pc-cols"><section class="pc-card"><h3>ITENS DO PEDIDO</h3><div class="pc-grid pc-add">${field('CÓDIGO DO PRODUTO',`<input id="pc-product" type="text" inputmode="numeric" autocomplete="off" placeholder="CÓDIGO">`)}${field('DESCRIÇÃO DO PRODUTO',`<div class="pc-picker"><input id="pc-description" type="text" readonly placeholder="DIGITE O CÓDIGO OU PESQUISE"><button type="button" class="pc-plus" data-pc="product" title="Pesquisar produto">+</button></div>`)}${field('QUANTIDADE',inp('qty','number','min="0.001" step="0.001"'))}<button class="pc-btn green" data-pc="add">+ ADICIONAR</button></div><div class="pc-overflow"><table class="pc-table"><thead><tr><th>#</th><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>QUANTIDADE</th><th>AÇÃO</th></tr></thead><tbody id="pc-items"></tbody></table></div></section><section class="pc-card"><h3>ESTOQUE DO PRODUTO SELECIONADO</h3><strong id="pc-prodname">SELECIONE UM PRODUTO</strong><div class="pc-stats"><div>PROVISÃO<strong id="pc-prov">—</strong></div><div>VENDA<strong id="pc-sale">—</strong></div><div>DISPONÍVEL<strong id="pc-avail">—</strong></div></div></section></div><div class="pc-cols"><section class="pc-card"><h3>OBSERVAÇÕES</h3><textarea id="pc-notes" rows="4" placeholder="Observações para o fornecedor..."></textarea></section><section class="pc-card"><h3>TOTAIS DO PEDIDO</h3><p>TOTAL DE ITENS: <strong id="pc-count">0</strong></p></section></div><section class="pc-card pc-actions"><div class="pc-buttons"><button data-pc="new" class="pc-btn green">NOVO</button><button data-pc="save" class="pc-btn blue">GRAVAR</button><button data-pc="edit" class="pc-btn orange">ALTERAR</button><button data-pc="lower" class="pc-btn green">BAIXAR</button><button data-pc="cancel" class="pc-btn red">CANCELAR</button><button data-pc="print" class="pc-btn slate">IMPRIMIR</button><button data-pc="home" class="pc-btn red">VOLTAR</button></div></section><section class="pc-card pc-history"><h3>PESQUISA DE PEDIDOS</h3><div class="pc-grid pc-filters">${field('DATA INICIAL',inp('from','date'))}${field('DATA FINAL',inp('to','date'))}${field('FORNECEDOR',`<div class="pc-picker"><input id="pc-filter-supplier" type="hidden" value=""><input id="pc-filter-supplier-name" type="text" value="TODOS" readonly aria-label="Fornecedor da pesquisa" title="Clique no botão + para escolher um fornecedor"><button type="button" class="pc-plus" data-pc="filter-supplier" title="Selecionar fornecedor da pesquisa">+</button></div>`)}${field('SITUAÇÃO',`<select id="pc-filter-status"><option value="">TODAS</option><option>PENDENTE</option><option>BAIXADA</option><option>CANCELADO</option></select>`)}<button data-pc="filter" class="pc-btn blue">PESQUISAR</button></div><div class="pc-overflow"><table class="pc-table"><thead><tr><th>Nº</th><th>DATA</th><th>FORNECEDOR</th><th>SITUAÇÃO</th><th>USUÁRIO</th></tr></thead><tbody id="pc-list"></tbody></table></div></section></div>`;
$('pc-id').value=rec?.id||next();$('pc-date').value=rec?.date||dt();$('pc-supplier').value=rec?.supplier||'';$('pc-supplier-name').value=suppliers().find(x=>String(x.id)===String(rec?.supplier))?.nome||'SELECIONE O FORNECEDOR';$('pc-status').value=rec?.status||'PENDENTE';$('pc-user').value=rec?.createdBy||user();$('pc-notes').value=rec?.notes||'';
if(locked)for(const k of ['date','supplier','supplier-name','product','description','qty','notes'])$('pc-'+k).disabled=true;
$('pc-user').style.cursor='pointer';$('pc-user').title='CLIQUE PARA VER O HISTÓRICO DESTE PEDIDO';$('pc-user').addEventListener('click',showOrderHistory);$('pc-product').addEventListener('input',stock);w.querySelectorAll('[data-pc]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.pc,b.dataset.i)));$('pc-from').value=searchFilters.from;$('pc-to').value=searchFilters.to;$('pc-filter-supplier').value=searchFilters.supplier;$('pc-filter-supplier-name').value=searchFilters.supplier?(suppliers().find(x=>String(x.id)===String(searchFilters.supplier))?.nome||'FORNECEDOR NÃO ENCONTRADO'):'TODOS';$('pc-filter-status').value=searchFilters.status;drawItems();drawList();stock();active('COMPRAS');}
function stock(){
 const code=$('pc-product')?.value.trim();
 const p=products.find(x=>String(x.codigo)===code);
 if($('pc-description'))$('pc-description').value=p?.descricao||'';
 if(!p){
  $('pc-prodname').textContent='SELECIONE UM PRODUTO';
  for(const k of ['prov','sale','avail'])$('pc-'+k).textContent='—';
  return;
 }
 $('pc-prodname').textContent=p.codigo+' - '+p.descricao;
 let current=p;
 if(typeof window.LL_estoqueCentralConciliar==='function'){
  const reconciled=window.LL_estoqueCentralConciliar();
  if(Array.isArray(reconciled))current=reconciled.find(x=>String(x.codigo)===String(p.codigo))||p;
 }
 const prov=Number(current.provisao)||0,sale=Number(current.venda)||0;
 $('pc-prov').textContent=prov;
 $('pc-sale').textContent=sale;
 $('pc-avail').textContent=prov-sale;
}
function drawItems(){
 const el=$('pc-items');if(!el)return;
 el.innerHTML=items.map((i,j)=>`<tr class="pc-item-select" data-item-index="${j}" title="Clique para visualizar o estoque deste produto" tabindex="0"><td>${j+1}</td><td>${esc(i.code)}</td><td>${esc(products.find(p=>String(p.codigo)===String(i.code))?.descricao||i.desc)}</td><td>${i.q}</td><td><button class="pc-mini" data-pc="remove" data-i="${j}">EXCLUIR</button></td></tr>`).join('')||'<tr><td colspan="5">Nenhum item adicionado.</td></tr>';
 $('pc-count').textContent=items.length;
 el.querySelectorAll('[data-pc]').forEach(b=>b.onclick=e=>{e.stopPropagation();action(b.dataset.pc,b.dataset.i)});
 el.querySelectorAll('[data-item-index]').forEach(row=>{
   const select=()=>{const item=items[Number(row.dataset.itemIndex)];if(!item)return;$('pc-product').value=String(item.code);stock();el.querySelectorAll('.pc-item-select').forEach(r=>r.classList.remove('pc-item-selected'));row.classList.add('pc-item-selected')};
   row.addEventListener('click',select);
   row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select()}});
 });
}
function drawList(){
 const el=$('pc-list');if(!el)return;
 if(!filter){el.innerHTML='<tr><td colspan="5" class="pc-search-hint">INFORME OS FILTROS E CLIQUE EM PESQUISAR PARA EXIBIR OS PEDIDOS.</td></tr>';return;}
 const {supplier:fs,status:st,from,to}=searchFilters;
 el.innerHTML=read().filter(x=>(!fs||String(x.supplier)===String(fs))&&(!st||x.status===st)&&(!from||x.date>=from)&&(!to||x.date<=to)).sort((a,b)=>b.id-a.id).map(x=>`<tr class="pc-search-result" data-order-id="${Number(x.id)}" title="Dê dois cliques para abrir este pedido" tabindex="0"><td>${x.id}</td><td>${esc(x.date)}</td><td>${esc(suppliers().find(s=>String(s.id)===String(x.supplier))?.nome||x.supplier)}</td><td>${esc(x.status)}</td><td>${esc(x.createdBy)}</td></tr>`).join('')||'<tr><td colspan="5">Nenhum pedido encontrado.</td></tr>';
 el.querySelectorAll('[data-order-id]').forEach(row=>{const load=()=>loadOne(row.dataset.orderId);row.addEventListener('dblclick',load);row.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();load()}})});
}
function captureSearch(){searchFilters={from:$('pc-from').value,to:$('pc-to').value,supplier:$('pc-filter-supplier').value,status:$('pc-filter-status').value};filter=true;drawList();}

function loadOne(n){const r=read().find(x=>x.id===Number(n));if(!r)return msg('PEDIDO NÃO ENCONTRADO.');id=r.id;items=r.items.map(x=>({...x}));render();}
function showOrderHistory(){
 const r=read().find(x=>Number(x.id)===Number(id));
 document.getElementById('pc-own-history')?.remove();
 const overlay=document.createElement('div');
 overlay.id='pc-own-history';
 overlay.style.cssText='position:fixed;inset:0;z-index:1000000;background:#071d3b99;display:flex;align-items:center;justify-content:center;padding:16px';
 const history=Array.isArray(r?.history)?r.history:[];
 const actionName=a=>({GRAVAR:'CADASTRO',ALTERAR:'ALTERAÇÃO',CANCELAR:'CANCELAMENTO',BAIXAR:'BAIXA',REABRIR:'REABERTURA'}[String(a||'').toUpperCase()]||String(a||'OPERAÇÃO').toUpperCase());
 const events=history.length?history.slice().reverse().map(h=>'<div style="padding:13px 0;border-bottom:1px solid #dbe6f3"><b>'+esc(actionName(h.action))+' — '+esc(h.by||'USUÁRIO NÃO IDENTIFICADO')+'</b><div style="font-size:12px;color:#60748c;margin-top:4px">'+esc(h.at?new Date(h.at).toLocaleString('pt-BR'):'')+'</div></div>').join(''):'<p>ESTE PEDIDO NÃO POSSUI HISTÓRICO REGISTRADO.</p>';
 overlay.innerHTML='<div role="dialog" aria-modal="true" style="width:min(440px,95vw);max-height:85vh;background:white;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;color:#173b6c;font:14px Arial,sans-serif"><header style="background:#1c508f;color:white;padding:17px 19px;font-weight:bold">HISTÓRICO DE ALTERAÇÕES</header><div style="padding:20px;overflow:auto"><p><b>PEDIDO Nº:</b> '+esc(r?.id||'NÃO GRAVADO')+'</p><p><b>ÚLTIMO USUÁRIO:</b> '+esc(r?.updatedBy||r?.createdBy||user())+'</p>'+events+'</div><footer style="padding:15px 20px;display:flex;justify-content:flex-end"><button type="button" data-close style="background:#195aa5;border:0;color:#fff;border-radius:5px;padding:11px 20px;cursor:pointer;font-weight:bold">FECHAR</button></footer></div>';
 document.body.appendChild(overlay);
 overlay.querySelector('[data-close]').onclick=()=>overlay.remove();
 overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
}
function saveOrder(){const all=read(),old=all.find(x=>x.id===id);if(old&&old.status!=='PENDENTE')return msg('SOMENTE PEDIDOS PENDENTES PODEM SER ALTERADOS.');if(!$('pc-supplier').value||!items.length)return msg('INFORME O FORNECEDOR E ADICIONE PELO MENOS UM PRODUTO.');const r={id:old?.id||next(),date:$('pc-date').value,supplier:$('pc-supplier').value,delivery:old?.delivery||'',status:'PENDENTE',items:items.map(x=>({...x})),notes:$('pc-notes').value,total:total(),createdBy:old?.createdBy||user(),createdAt:old?.createdAt||stamp(),updatedBy:user(),updatedAt:stamp(),history:[...(old?.history||[]),{action:old?'ALTERAR':'GRAVAR',by:user(),at:stamp()}]};if(old)all[all.findIndex(x=>x.id===old.id)]=r;else all.push(r);write(all);id=r.id;render();msg('PEDIDO Nº '+id+' GRAVADO. NÃO MOVIMENTA ESTOQUE OU FINANCEIRO.');}
function printOrder(){
 const r=read().find(x=>x.id===id);if(!r)return msg('GRAVE O PEDIDO ANTES DE IMPRIMIR.');
 const sup=suppliers().find(x=>String(x.id)===String(r.supplier));
 let loja={};try{loja=JSON.parse(localStorage.getItem('erp_systems_dados_loja_v1')||'{}')}catch{}
 const date=v=>{if(!v)return '—';const a=String(v).slice(0,10).split('-');return a.length===3?a.reverse().join('/'):String(v)};
 const supplierName=sup?.nome||r.supplier||'—';
 const rows=(r.items||[]).map(x=>`<tr><td>${esc(x.code??x.codigo)}</td><td>${esc(products.find(p=>String(p.codigo)===String(x.code??x.codigo))?.descricao||x.desc||x.descricao||'PRODUTO')}</td><td class="num">${esc(x.q??x.quantidade)}</td></tr>`).join('');
 const emission='EMITIDO EM '+new Date().toLocaleDateString('pt-BR')+', POR '+user()+'.';
 const doc=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Pedido de Compra Nº ${esc(r.id)}</title><style>
 @page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#17263c;background:white;margin:0 auto;padding:7mm;width:100%;max-width:210mm;overflow-wrap:anywhere}header{text-align:center;border:0;padding:0;margin-bottom:16px}.company-head{display:flex;align-items:center;justify-content:center;gap:22px;text-align:left;width:100%;max-width:180mm;margin:0 auto 15px;padding:7px 0 14px;border-bottom:1px solid #c5d8f0}.company-details{flex:1;min-width:0}.company-head img{display:block;max-height:100px;max-width:135px;object-fit:contain;flex-shrink:0;margin:0}.company-details h1{margin:0 0 7px;font-size:17px;line-height:1.25}.company-details .sub{margin:3px 0;line-height:1.55}.document-title{font-size:17px;letter-spacing:.2px;text-align:center;background:#e5effc;color:#153f79;padding:12px 8px;margin:0 0 14px;border-radius:3px}h2{font-size:13px;color:#153f79;margin:22px 0 8px;border-bottom:1px solid #b8c7da;padding-bottom:5px}.sub{font-size:11px;color:#555;line-height:1.5}.meta{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px;margin:15px 0}.meta div{line-height:1.5}.meta b{color:#153f79}table{width:100%;border-collapse:collapse;table-layout:fixed}th{text-align:left;background:#e9eff7;color:#153f79;padding:8px 5px;font-size:10px}td{padding:8px 5px;border-bottom:1px solid #e1e6ee;overflow-wrap:anywhere}.num{text-align:right}.notes{white-space:pre-wrap;min-height:20px}.sign{margin:48px auto 0;display:flex;justify-content:center;width:100%;break-inside:avoid}.sign div{width:85mm;max-width:100%;border-top:1px solid #333;text-align:center;padding-top:7px}.emission-footer{margin:24px 0 0;text-align:right;font-size:10px;font-weight:bold;color:#153f79;break-inside:avoid}@media print{body{margin:0 auto;padding:7mm;width:100%;max-width:210mm}tr{break-inside:avoid}h2{break-after:avoid}}</style></head><body>
 <header><div class="company-head">${loja.logo?`<img src="${esc(loja.logo)}" alt="Logomarca">`:''}<div class="company-details"><h1>${esc(loja.nome||loja.fantasia||loja.razao||'LOJA NÃO CADASTRADA')}</h1><div class="sub">${esc([loja.razao,loja.cnpj].filter(Boolean).join(' · '))}</div><div class="sub">${esc([loja.rua,loja.numero,loja.bairro,loja.cidade,loja.uf].filter(Boolean).join(' · '))}</div><div class="sub">${esc([loja.telefone,loja.email].filter(Boolean).join(' · '))}</div></div></div><h1 class="document-title">PEDIDO DE COMPRA</h1></header>
 <div class="meta"><div><b>Nº DO PEDIDO:</b> ${esc(r.id)}</div><div><b>DATA:</b> ${date(r.date)}</div><div><b>FORNECEDOR:</b> ${esc(supplierName)}</div><div><b>SITUAÇÃO:</b> ${esc(r.status)}</div><div><b>USUÁRIO:</b> ${esc(r.createdBy||user())}</div></div>
 <section id="pc-document-items"><h2>PRODUTOS DO PEDIDO</h2><table><thead><tr><th style="width:12%">CÓDIGO</th><th>DESCRIÇÃO</th><th class="num" style="width:12%">QTD.</th></tr></thead><tbody>${rows}</tbody></table></section>
 <section id="pc-document-notes"><h2>OBSERVAÇÕES</h2><div class="notes">${esc(r.notes||'—')}</div></section><div class="sign" id="pc-document-sign"><div>RESPONSÁVEL PELO PEDIDO</div></div><div class="emission-footer">${esc(emission)}</div></body></html>`;
 document.getElementById('pc-print-preview')?.remove();
 const overlay=document.createElement('div');overlay.id='pc-print-preview';overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,19,46,.70);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Arial,sans-serif;color:#102c55';
 overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-label="Imprimir pedido de compra" style="background:#fff;width:min(1250px,98vw);height:min(850px,95vh);display:flex;flex-direction:column;border-radius:10px;overflow:hidden;box-shadow:0 12px 42px #0004">
 <header style="background:#174b88;color:white;padding:17px 22px;font-weight:700;font-size:19px;display:flex;justify-content:space-between;align-items:center"><span>IMPRIMIR PEDIDO DE COMPRA</span><button type="button" id="pc-prev-x" style="border:0;background:transparent;color:white;font-size:26px;cursor:pointer">×</button></header>
 <div style="display:grid;grid-template-columns:minmax(290px,40%) minmax(0,60%);gap:14px;padding:16px;flex:1;min-height:0;overflow:auto">
 <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px"><div style="background:#e5effc;padding:10px;font-weight:bold">DADOS DO PEDIDO SELECIONADO</div><div style="line-height:2;padding:10px"><b>Nº DO PEDIDO:</b> ${esc(r.id)} &nbsp; <b>DATA:</b> ${date(r.date)}<div><b>FORNECEDOR:</b> ${esc(supplierName)}</div><div><b>SITUAÇÃO:</b> ${esc(r.status)} &nbsp; <b>USUÁRIO:</b> ${esc(r.createdBy||user())}</div></div></section>
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px"><div style="background:#e5effc;padding:10px;font-weight:bold">TIPO DE IMPRESSÃO</div><label style="display:block;margin:14px 0"><input type="radio" name="pc-print-type" value="complete" checked> COMPLETA (Produtos, Observações e Assinatura)</label><label><input type="radio" name="pc-print-type" value="simple"> SIMPLIFICADA (Produtos)</label></section>
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px"><div style="background:#e5effc;padding:10px;font-weight:bold">OPÇÕES DE IMPRESSÃO</div><label style="display:block;margin:14px 0"><input type="checkbox" id="pc-show-items" checked> INCLUIR PRODUTOS DO PEDIDO</label><label style="display:block;margin:14px 0"><input type="checkbox" id="pc-show-notes" checked> INCLUIR OBSERVAÇÕES</label><label style="display:block;margin:14px 0"><input type="checkbox" id="pc-show-sign" checked> INCLUIR ASSINATURA</label></section>
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px"><div style="background:#e5effc;padding:10px;font-weight:bold">ORIENTAÇÃO DA FOLHA</div><select id="pc-orientation" style="margin-top:10px;width:100%;padding:10px;border:1px solid #b7cde9;border-radius:5px"><option value="portrait">RETRATO</option><option value="landscape">PAISAGEM</option></select></section></div>
 <section style="border:1px solid #c5d8f0;border-radius:7px;padding:12px;display:flex;flex-direction:column;min-height:440px;min-width:0"><div style="background:#e5effc;padding:10px;font-weight:bold;margin-bottom:10px">PRÉ-VISUALIZAÇÃO A4</div><iframe id="pc-preview-frame" title="Pré-visualização A4" style="width:100%;height:700px;flex:none;min-height:0;border:1px solid #b7cde9;background:white" scrolling="no"></iframe></section></div>
 <footer style="display:flex;gap:10px;justify-content:flex-end;padding:13px 20px;border-top:1px solid #d6e2f0"><button type="button" id="pc-do-print" style="background:#1765d5;color:white;border:0;border-radius:5px;padding:13px 24px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button type="button" id="pc-do-save" style="background:#07975c;color:white;border:0;border-radius:5px;padding:13px 24px;font-weight:bold;cursor:pointer">SALVAR</button><button type="button" id="pc-do-close" style="background:#e8f1fd;color:#174b88;border:1px solid #b7cde9;border-radius:5px;padding:13px 24px;font-weight:bold;cursor:pointer">FECHAR</button></footer></section>`;
 document.body.appendChild(overlay);
 const frame=overlay.querySelector('#pc-preview-frame');let ready=false;
 function refresh(){
  const simple=overlay.querySelector('input[name="pc-print-type"]:checked').value==='simple';
  const orient=overlay.querySelector('#pc-orientation').value;
  const style=`<style>@page{size:A4 ${orient};margin:0}body{max-width:${orient==='portrait'?'210mm':'297mm'};margin:0 auto;padding:8mm}header{margin-bottom:12px}h2{margin-top:12px}</style>`;
  let html=doc.replace('</head>',style+'</head>');
  if(!overlay.querySelector('#pc-show-items').checked)html=html.replace(/<section id="pc-document-items">[\s\S]*?<\/section>/,'');
  if(simple||!overlay.querySelector('#pc-show-notes').checked)html=html.replace(/<section id="pc-document-notes">[\s\S]*?<\/section>/,'');
  if(simple||!overlay.querySelector('#pc-show-sign').checked)html=html.replace(/<div class="sign" id="pc-document-sign">[\s\S]*?<\/div><\/div>/,'');
  ready=false;
  frame.onload=()=>{try{const inner=frame.contentDocument;inner.documentElement.style.overflow='hidden';inner.body.style.overflow='hidden';const resize=()=>{if(frame.isConnected)frame.style.height=(Math.max(inner.documentElement.scrollHeight,inner.body.scrollHeight,390)+8)+'px'};resize();if(inner.fonts?.ready)inner.fonts.ready.then(resize);inner.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',resize,{once:true})})}catch(e){frame.style.height='900px'}ready=true};
  frame.srcdoc=html;
 }
 const close=()=>{document.removeEventListener('keydown',onKey,true);overlay.remove()};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',onKey,true);
 overlay.querySelector('#pc-prev-x').onclick=close;overlay.querySelector('#pc-do-close').onclick=close;
 overlay.onclick=e=>{if(e.target===overlay)close()};
 overlay.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',refresh));
 const doPrint=()=>{if(!ready)return msg('AGUARDE A PRÉ-VISUALIZAÇÃO CARREGAR.');try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){msg('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO.')}};
 overlay.querySelector('#pc-do-print').onclick=doPrint;
 overlay.querySelector('#pc-do-save').onclick=async()=>{
  if(typeof window.LucasPedidoCompraPDF!=='function')return msg('GERADOR DE PDF NÃO DISPONÍVEL.');
  const simple=overlay.querySelector('input[name="pc-print-type"]:checked').value==='simple';
  const include=id=>overlay.querySelector(id).checked;
  const rows=(r.items||[]).map(x=>[String(x.code??x.codigo??''),String(products.find(p=>String(p.codigo)===String(x.code??x.codigo))?.descricao||x.desc||x.descricao||'PRODUTO'),String(x.q??x.quantidade??'')]);
  const company=loja.nome||loja.fantasia||loja.razao||'LOJA NÃO CADASTRADA';
  const details=[[loja.razao,loja.cnpj].filter(Boolean).join(' · '),[loja.rua,loja.numero,loja.bairro,loja.cidade,loja.uf].filter(Boolean).join(' · '),[loja.telefone,loja.email].filter(Boolean).join(' · ')];
  const button=overlay.querySelector('#pc-do-save');button.disabled=true;button.textContent='SALVANDO...';
  try{await window.LucasPedidoCompraPDF({number:r.id,date:date(r.date),supplier:supplierName,status:r.status,user:r.createdBy||user(),company,details,logo:loja.logo,orientation:overlay.querySelector('#pc-orientation').value,showItems:include('#pc-show-items'),items:rows,showNotes:!simple&&include('#pc-show-notes'),notes:r.notes||'—',showSignature:!simple&&include('#pc-show-sign'),issuedBy:user(),issuedAt:new Date().toLocaleDateString('pt-BR')})}
  catch(e){msg('NÃO FOI POSSÍVEL SALVAR O PDF: '+(e.message||e))}
  finally{button.disabled=false;button.textContent='SALVAR'}
 };
 refresh();
}
async function autenticarPedido(operacao){
 return new Promise(resolve=>{
  document.getElementById('pc-auth-overlay')?.remove();
  const overlay=document.createElement('div');overlay.id='pc-auth-overlay';overlay.className='ae-modal-overlay';
  overlay.innerHTML=`<div class="ae-modal pc-auth-caixa-modelo" role="dialog" aria-modal="true" aria-labelledby="pc-auth-title"><header><strong id="pc-auth-title">IDENTIFICAÇÃO PARA ${operacao} PEDIDO</strong><button type="button" data-fechar aria-label="Fechar">×</button></header><div class="ae-modal-body"><label for="pc-auth-code">USUÁRIO (CÓDIGO)</label><input id="pc-auth-code" type="text" inputmode="numeric" autocomplete="off" placeholder="INFORME O CÓDIGO DO OPERADOR"><div class="pc-auth-person"><strong id="pc-auth-name">INFORME O CÓDIGO DO USUÁRIO</strong><small id="pc-auth-role">O NOME APARECERÁ AUTOMATICAMENTE</small></div><label for="pc-auth-pass">SENHA</label><input id="pc-auth-pass" type="password" autocomplete="off" placeholder="DIGITE SUA SENHA"><p id="pc-auth-error" role="alert" aria-live="polite"></p><p class="pc-auth-note">VALIDAÇÃO LOCAL DOS USUÁRIOS CADASTRADOS. NÃO SUBSTITUI AUTENTICAÇÃO SEGURA EM SERVIDOR.</p></div><footer><button type="button" id="pc-auth-ok">CONTINUAR</button><button type="button" data-fechar>CANCELAR</button></footer></div>`;
  document.body.appendChild(overlay);
  const code=overlay.querySelector('#pc-auth-code'),pass=overlay.querySelector('#pc-auth-pass'),err=overlay.querySelector('#pc-auth-error'),name=overlay.querySelector('#pc-auth-name'),role=overlay.querySelector('#pc-auth-role');
  const list=()=>{try{const d=JSON.parse(localStorage.getItem('erp_matriz_usuarios_v1')||'[]');return Array.isArray(d)?d:(d.usuarios||d.items||[])}catch{return []}};
  const selected=()=>{const v=code.value.trim();if(!v)return null;return list().find(u=>String(u.id??u.codigo)===v&&String(u.situacao||'ATIVO').toUpperCase()==='ATIVO')||null};
  const close=result=>{overlay.remove();document.removeEventListener('keydown',onKey,true);resolve(result)};
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(null)}};
  document.addEventListener('keydown',onKey,true);
  overlay.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=()=>close(null));
  overlay.onclick=e=>{if(e.target===overlay)close(null)};
  code.oninput=()=>{const u=selected();name.textContent=u?(u.nome||u.login||'USUÁRIO'):(code.value.trim()?'USUÁRIO NÃO ENCONTRADO':'INFORME O CÓDIGO DO USUÁRIO');role.textContent=u?(u.perfil||'USUÁRIO'):(code.value.trim()?'CONFIRA O CÓDIGO INFORMADO':'O NOME APARECERÁ AUTOMATICAMENTE');err.textContent='';pass.value=''};
  code.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();pass.focus()}};
  const confirm=async()=>{
   const u=selected();if(!u){err.textContent='USUÁRIO NÃO ENCONTRADO OU INATIVO.';return}
   if(!pass.value){err.textContent='INFORME A SENHA.';pass.focus();return}
   if(!u.senhaHash||!u.senhaSalt||typeof window.LL_SHA256!=='function'){err.textContent='NÃO FOI POSSÍVEL VALIDAR A SENHA DESTE USUÁRIO.';return}
   let valid=false;try{valid=await window.LL_SHA256(u.senhaSalt+':'+pass.value)===u.senhaHash}catch{}
   if(!valid){err.textContent='SENHA INCORRETA.';pass.value='';pass.focus();return}
   // As permissões existentes são avaliadas pelo mecanismo central, quando disponível.
   if(typeof window.LL_hasPermission==='function'&&!window.LL_hasPermission(u,operacao==='BAIXAR'?'Baixar — PEDIDOS DE COMPRA':'Cancelar — PEDIDOS DE COMPRA')){err.textContent='USUÁRIO SEM PERMISSÃO PARA ESTA OPERAÇÃO.';return}
   close({nome:u.nome||u.login||String(u.id),id:u.id});
  };
  overlay.querySelector('#pc-auth-ok').onclick=confirm;
  pass.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();confirm()}};
  code.focus();
 });
}
async function transition(k){const d=load(),a=d.find(x=>x.id===id);if(!a)return note('GRAVE O PEDIDO PRIMEIRO.');if((k==='baixar'&&a.situacao!=='PENDENTE')||(k==='reabrir'&&a.situacao!=='BAIXADO')||(k==='cancelar'&&!['PENDENTE','BAIXADO'].includes(a.situacao)))return note('OPERAÇÃO NÃO PERMITIDA PARA A SITUAÇÃO ATUAL.');const autorizado=(k==='baixar'||k==='cancelar')?await autenticarPedido(k):null;if((k==='baixar'||k==='cancelar')&&!autorizado)return;if(!await erpConfirm(`CONFIRMA ${k.toUpperCase()} O PEDIDO Nº ${a.id}?`))return;if(k==='baixar'){for(const it of a.itens){it.anterior=n(product(it.codigo)?.provisao);it.diferenca=+(it.contagem-it.anterior).toFixed(3)}move(a.itens,1);a.situacao='BAIXADO';a.baixadoEm=new Date().toISOString();a.baixadoPor=autorizado?.nome||user()}else if(k==='reabrir'){a.situacao='PENDENTE'}else {if(a.situacao==='BAIXADO'){move(a.itens,-1);a.cancelamentoDeBaixa=true}a.situacao='CANCELADO';a.canceladoEm=new Date().toISOString()}a.usuario=autorizado?.nome||user();(a.historico??=[]).push({acao:k.toUpperCase(),data:new Date().toISOString(),usuario:a.usuario});save(d);if(typeof window.LL_estoqueCentralConciliar==='function')window.LL_estoqueCentralConciliar();items=a.itens.map(x=>({...x}));render();note('OPERAÇÃO REALIZADA.')}
async function action(a,i){const old=read().find(x=>x.id===id);if(a==='home')return category('COMPRAS');if(a==='shortcuts')return atalhosPedidoPadrao();if(a==='supplier')return chooseSupplier();if(a==='filter-supplier')return chooseFilterSupplier();if(a==='product')return chooseProduct();if(a==='new'){id=null;items=[];return render();}if(a==='load')return loadOne(i);if(a==='save')return saveOrder();if(a==='edit'){if(!old)return msg('SELECIONE UM PEDIDO.');if(old.status!=='PENDENTE')return msg('SOMENTE PEDIDOS PENDENTES PODEM SER ALTERADOS.');return $('pc-supplier').focus();}if(a==='print')return printOrder();if(a==='search'||a==='filter')return captureSearch();if(a==='locate'){const n=await erpPrompt('NÚMERO DO PEDIDO:');if(n!==null)loadOne(n);return;}if(a==='lower'){
 if(!old)return msg('GRAVE OU LOCALIZE O PEDIDO PRIMEIRO.');
 if(old.status!=='PENDENTE')return msg('SOMENTE PEDIDOS PENDENTES PODEM SER BAIXADOS.');
 const autorizado=await autenticarPedido('BAIXAR');if(!autorizado)return;
 if(!await erpConfirm('BAIXAR PEDIDO Nº '+old.id+'?'))return;
 const all=read(),r=all.find(x=>x.id===id);if(!r||r.status!=='PENDENTE')return msg('SITUAÇÃO DO PEDIDO ALTERADA.');
 r.status='BAIXADA';r.baixadoPor=autorizado.nome;r.baixadoPorId=autorizado.id;r.baixadoEm=stamp();r.updatedBy=autorizado.nome;r.updatedAt=stamp();r.history=Array.isArray(r.history)?r.history:[];r.history.push({action:'BAIXAR',by:autorizado.nome,at:stamp()});write(all);render();return msg('PEDIDO Nº '+r.id+' BAIXADO. SEM MOVIMENTAÇÃO DE ESTOQUE.');
 }if(a==='cancel'){
 if(!old)return msg('GRAVE O PEDIDO PRIMEIRO.');
 if(!['PENDENTE','BAIXADA'].includes(old.status))return msg('ESTE PEDIDO NÃO PODE SER CANCELADO.');
 const autorizado=await autenticarPedido('CANCELAR');if(!autorizado)return;
 if(old.status==='BAIXADA'&&String(old.baixadoPorId||'')&&String(old.baixadoPorId)!==String(autorizado.id))return msg('SOMENTE O USUÁRIO QUE REALIZOU A BAIXA PODE CANCELAR ESTE PEDIDO.');
 if(!await erpConfirm('CANCELAR PEDIDO Nº '+old.id+'?'))return;
 const all=read(),r=all.find(x=>x.id===id);if(!r||!['PENDENTE','BAIXADA'].includes(r.status))return msg('SITUAÇÃO DO PEDIDO ALTERADA.');
 r.status='CANCELADO';r.canceladoPor=autorizado.nome;r.canceladoEm=stamp();r.updatedBy=autorizado.nome;r.updatedAt=stamp();r.history=Array.isArray(r.history)?r.history:[];r.history.push({action:'CANCELAR',by:autorizado.nome,at:stamp()});write(all);render();return msg('PEDIDO Nº '+r.id+' CANCELADO. SEM MOVIMENTAÇÃO DE ESTOQUE.');
 }if(old&&old.status!=='PENDENTE')return msg('SOMENTE PEDIDOS PENDENTES PODEM SER ALTERADOS.');if(a==='add'){const code=$('pc-product').value.trim(),q=Number($('pc-qty').value),p=products.find(x=>String(x.codigo)===code);if(!p||!Number.isFinite(q)||q<=0)return msg('PRODUTO OU QUANTIDADE INVÁLIDOS.');items.push({code,desc:p.descricao,q});$('pc-product').value='';$('pc-qty').value='';stock();drawItems();}if(a==='remove'){items.splice(Number(i),1);drawItems();}}
function atalhosPedidoPadrao(){
 document.getElementById('pc-shortcuts-overlay')?.remove();
 const rows=[['F1','Abrir esta janela de atalhos'],['F12','Localizar pedido pelo número'],['F2','Baixar pedido'],['F3','Cancelar pedido']];
 const overlay=document.createElement('div');overlay.id='pc-shortcuts-overlay';
 overlay.style.cssText='position:fixed;inset:0;background:rgba(4,25,57,.68);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px';
 overlay.innerHTML=`<div role="dialog" aria-modal="true" aria-label="Atalhos — Pedidos de Compra" style="width:475px;max-width:100%;background:#fff;border-radius:13px;overflow:hidden;box-shadow:0 16px 45px #001b3b55;color:#0b3775;font-family:Arial,sans-serif"><header style="background:#195596;color:white;padding:20px 22px;display:flex;justify-content:space-between;align-items:center"><strong>⌂ ATALHOS — ▣ PEDIDOS DE COMPRA</strong><button type="button" data-close style="background:transparent;border:0;color:white;font-size:24px;cursor:pointer">×</button></header><div style="padding:18px 22px">${rows.map(([key,label])=>`<div style="display:flex;align-items:center;gap:16px;padding:10px 0;border-bottom:1px solid #e4ebf5"><span style="display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:34px;background:#eaf2ff;border:1px solid #bfd4f5;border-radius:5px;color:#0b3775;font-weight:bold">${key}</span><span>${label}</span></div>`).join('')}</div><footer style="padding:12px 20px;text-align:right;border-top:1px solid #e4ebf5"><button type="button" data-close style="background:#195596;color:white;padding:12px 22px;border:0;border-radius:5px;cursor:pointer">FECHAR</button></footer></div>`;
 document.body.appendChild(overlay);
 const close=()=>{overlay.remove();document.removeEventListener('keydown',onKey,true)};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(['F1','F2','F3','F12'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation()}};
 document.addEventListener('keydown',onKey,true);
 overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);
 overlay.onclick=e=>{if(e.target===overlay)close()};
}
function chooser(title,rows,select){const old=document.getElementById('pc-modal');if(old)old.remove();const el=document.createElement('div');el.id='pc-modal';el.className='pc-modal';el.innerHTML=`<div class="pc-modal-box"><header><strong>${esc(title)}</strong><button type="button" class="pc-modal-close">×</button></header><input class="pc-modal-search" placeholder="PESQUISE POR CÓDIGO OU NOME"><div class="pc-modal-results"></div><button type="button" class="pc-modal-close pc-modal-bottom">FECHAR</button></div>`;document.body.appendChild(el);el.querySelectorAll('.pc-modal-close').forEach(b=>b.onclick=()=>el.remove());el.addEventListener('click',e=>{if(e.target===el)el.remove()});const inp=el.querySelector('.pc-modal-search'),out=el.querySelector('.pc-modal-results');function show(){const q=inp.value.toLocaleUpperCase('pt-BR');out.replaceChildren();const found=rows.filter(x=>x.label.toLocaleUpperCase('pt-BR').includes(q));found.forEach(x=>{const b=document.createElement('button');b.type='button';b.textContent=x.label;b.onclick=()=>{select(x);el.remove()};out.appendChild(b)});if(!found.length)out.textContent='NENHUM REGISTRO ENCONTRADO.';}inp.oninput=show;show();inp.focus();}
let pedidoSupplierDraft=null;
function supplierBackToOrder(){
 const draft=pedidoSupplierDraft;
 open('PEDIDOS DE COMPRA');
 if(!draft)return;
 id=draft.id;items=draft.items;searchFilters=draft.searchFilters;filter=draft.filter;
 render();
 for(const [key,value] of Object.entries(draft.fields)){const el=document.getElementById(key);if(el)el.value=value;}
 drawItems();drawList();stock();
 pedidoSupplierDraft=null;
}
function openSupplierRegistrationFromOrder(){
 const fields={};
 document.querySelectorAll('.pc-page input,.pc-page textarea,.pc-page select').forEach(el=>{if(el.id)fields[el.id]=el.value;});
 pedidoSupplierDraft={id,items:items.map(x=>({...x})),searchFilters:{...searchFilters},filter,fields};
 document.getElementById('pc-modal')?.remove();
 open('FORNECEDORES');
 const workspace=root();
 if(!workspace)return;
 const back=document.createElement('button');
 back.type='button';back.textContent='← VOLTAR PARA PEDIDOS DE COMPRA';
 back.style.cssText='display:block;margin:12px 0;padding:12px 18px;background:#e42c43;color:#fff;border:0;border-radius:5px;font-weight:bold;cursor:pointer';
 back.addEventListener('click',supplierBackToOrder);
 workspace.prepend(back);
 const buttons=[...workspace.querySelectorAll('#forn-actions button')];
 const originalBack=buttons.find(x=>x.textContent.trim().toUpperCase()==='VOLTAR');
 if(originalBack){const replacement=originalBack.cloneNode(true);originalBack.replaceWith(replacement);replacement.addEventListener('click',supplierBackToOrder);}
}
function chooseSupplier(forSearch=false){
 document.getElementById('pc-modal')?.remove();
 const overlay=document.createElement('div');
 overlay.id='pc-modal';overlay.className='pc-modal';
 overlay.innerHTML=`<div class="pc-supplier-dialog" role="dialog" aria-modal="true" aria-label="Selecione o fornecedor">
 <header><strong>${forSearch?"SELECIONE O FORNECEDOR DA PESQUISA":"SELECIONE O FORNECEDOR"}</strong><button type="button" id="pc-sup-close" aria-label="Fechar">×</button></header>
 <div class="pc-supplier-content"><div class="pc-supplier-search">
 <label>PESQUISAR POR<select id="pc-sup-mode"><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label>
 <label>TEXTO DA PESQUISA<input id="pc-sup-query" type="text" placeholder="DIGITE PARA PESQUISAR..."></label>
 <button type="button" id="pc-sup-find">PESQUISAR</button>${forSearch?"":'<button type="button" id="pc-sup-new">+ NOVO FORNECEDOR</button>'}</div>
 <div class="pc-supplier-list"><table><thead><tr><th>CÓDIGO</th><th>NOME DO FORNECEDOR</th><th>SITUAÇÃO</th></tr></thead><tbody id="pc-sup-rows"></tbody></table></div>
 <footer><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" id="pc-sup-cancel">CANCELAR</button></footer></div></div>`;
 document.body.appendChild(overlay);
 const close=()=>overlay.remove();
 overlay.querySelector('#pc-sup-close').onclick=close;
 overlay.querySelector('#pc-sup-cancel').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 const input=overlay.querySelector('#pc-sup-query'),mode=overlay.querySelector('#pc-sup-mode'),tbody=overlay.querySelector('#pc-sup-rows');
 function search(){
  const q=input.value.trim().toLocaleLowerCase('pt-BR'),byCode=mode.value==='codigo';
  const found=suppliers().filter(x=>String(byCode?(x.id??x.codigo):(x.nome??x.razaoSocial??'')).toLocaleLowerCase('pt-BR').includes(q));
  tbody.innerHTML=(forSearch?'<tr data-supplier-id="" tabindex="0"><td>—</td><td>TODOS</td><td>—</td></tr>':'')+found.map(x=>{const status=String(x.situacao||x.status||'ATIVO').toUpperCase();return `<tr data-supplier-id="${esc(x.id)}" tabindex="0"><td>${esc(x.id)}</td><td>${esc(x.nome||x.razaoSocial||'')}</td><td><span class="pc-supplier-status ${status==='ATIVO'?'':'inactive'}">${esc(status)}</span></td></tr>`}).join('')||'<tr><td colspan="3">NENHUM FORNECEDOR ENCONTRADO.</td></tr>';
  tbody.querySelectorAll('[data-supplier-id]').forEach(row=>{
   const select=()=>{const value=row.dataset.supplierId;const x=suppliers().find(v=>String(v.id)===value);if(!x&&value!=='')return;
    if(forSearch){$('pc-filter-supplier').value=value;$('pc-filter-supplier-name').value=x?(x.nome||x.razaoSocial||''):'TODOS';}
    else if(x){$('pc-supplier').value=String(x.id);$('pc-supplier-name').value=x.nome||x.razaoSocial||'';}close();};
   row.addEventListener('dblclick',select);
   row.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();select();}});
  });
 }
 overlay.querySelector('#pc-sup-find').onclick=search;
 if(!forSearch)overlay.querySelector('#pc-sup-new').onclick=openSupplierRegistrationFromOrder;
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
 mode.onchange=search;
 search();input.focus();
}
function chooseFilterSupplier(){chooseSupplier(true);}
let pedidoProductDraft=null;
function returnFromProductToOrder(){
 const draft=pedidoProductDraft;
 open('PEDIDOS DE COMPRA');
 if(!draft)return;
 id=draft.id;items=draft.items;searchFilters=draft.searchFilters;filter=draft.filter;
 render();
 for(const [key,value] of Object.entries(draft.fields)){
  const el=document.getElementById(key);if(el)el.value=value;
 }
 drawItems();drawList();stock();
 pedidoProductDraft=null;
}
function createProductFromOrder(){
 const fields={};
 document.querySelectorAll('.pc-page input,.pc-page textarea,.pc-page select').forEach(el=>{if(el.id)fields[el.id]=el.value;});
 pedidoProductDraft={id,items:items.map(x=>({...x})),searchFilters:{...searchFilters},filter,fields};
 document.getElementById('pc-modal')?.remove();
 open('PRODUTOS');
 const workspace=root();
 if(!workspace)return;
 const back=document.createElement('button');
 back.type='button';
 back.textContent='← VOLTAR PARA PEDIDOS DE COMPRA';
 back.className='pc-product-back';
 back.addEventListener('click',returnFromProductToOrder);
 workspace.prepend(back);
}
function chooseProduct(){
 document.getElementById('pc-modal')?.remove();
 const overlay=document.createElement('div');
 overlay.id='pc-modal';overlay.className='pc-modal';
 overlay.innerHTML=`<div class="pc-supplier-dialog" role="dialog" aria-modal="true" aria-label="Selecione o produto">
 <header><strong>SELECIONE O PRODUTO</strong><button type="button" id="pc-prod-close" aria-label="Fechar">×</button></header>
 <div class="pc-supplier-content"><div class="pc-supplier-search">
 <label>PESQUISAR POR<select id="pc-prod-mode"><option value="descricao">DESCRIÇÃO</option><option value="codigo">CÓDIGO</option></select></label>
 <label>TEXTO DA PESQUISA<input id="pc-prod-query" type="text" placeholder="DIGITE PARA PESQUISAR..."></label>
 <button type="button" id="pc-prod-find">PESQUISAR</button><button type="button" id="pc-prod-new">+ NOVO PRODUTO</button></div>
 <div class="pc-supplier-list"><table><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO DO PRODUTO</th><th>SITUAÇÃO</th></tr></thead><tbody id="pc-prod-rows"></tbody></table></div>
 <footer><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" id="pc-prod-cancel">CANCELAR</button></footer></div></div>`;
 document.body.appendChild(overlay);
 const close=()=>overlay.remove();
 overlay.querySelector('#pc-prod-close').onclick=close;
 overlay.querySelector('#pc-prod-cancel').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 const input=overlay.querySelector('#pc-prod-query'),mode=overlay.querySelector('#pc-prod-mode'),tbody=overlay.querySelector('#pc-prod-rows');
 function search(){
  const q=input.value.trim().toLocaleLowerCase('pt-BR'),byCode=mode.value==='codigo';
  const found=products.filter(x=>String(byCode?x.codigo:(x.descricao||'')).toLocaleLowerCase('pt-BR').includes(q));
  tbody.innerHTML=found.map(x=>{
   const status=String(x.situacao||x.status||'ATIVO').toUpperCase();
   return `<tr data-product-code="${esc(x.codigo)}" tabindex="0"><td>${esc(x.codigo)}</td><td>${esc(x.descricao||'')}</td><td><span class="pc-supplier-status ${status==='ATIVO'?'':'inactive'}">${esc(status)}</span></td></tr>`;
  }).join('')||'<tr><td colspan="3">NENHUM PRODUTO ENCONTRADO.</td></tr>';
  tbody.querySelectorAll('[data-product-code]').forEach(row=>{
   const select=()=>{const x=products.find(v=>String(v.codigo)===row.dataset.productCode);if(!x)return;
    $('pc-product').value=String(x.codigo);stock();close();};
   row.addEventListener('dblclick',select);
   row.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();select();}});
  });
 }
 overlay.querySelector('#pc-prod-find').onclick=search;
 overlay.querySelector('#pc-prod-new').onclick=createProductFromOrder;
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
 mode.onchange=search;
 search();input.focus();
}
const prev=open;open=function(name){if(name==='PEDIDOS DE COMPRA'){id=null;items=[];render();return;}return prev(name);};
document.addEventListener('keydown',ev=>{if(!$('pc-id')||ev.ctrlKey||ev.altKey||ev.metaKey)return;const map={F1:'shortcuts',F2:'lower',F3:'cancel',F12:'locate'};if(map[ev.key]){ev.preventDefault();ev.stopImmediatePropagation();action(map[ev.key]);}},true);
// Exibir o usuário responsável nas telas de cadastro e movimentação existentes.
const observer=new MutationObserver(()=>{const w=root();if(!w||w.querySelector('.ls-loja')||w.querySelector('.us-page')||w.querySelector('.pc-page')||w.querySelector('.cr-page')||w.querySelector('.ax-compact-screen')||w.querySelector('.en-page')||w.querySelector('.alm')||w.querySelector('.ae-page')||w.querySelector('.modern-module.module-screen')||w.querySelector('.rh-employee-screen'))return;const title=w.querySelector('h1');if(!title||w.querySelector('.fs-page')||w.querySelector('[data-user-audit]')||w.querySelector('.vt-user-field')||w.querySelector('#tr-user'))return;const heading=title.textContent.trim().toUpperCase();if(heading==='INÍCIO'||heading==='CADASTROS'||heading==='COMPRAS'||heading==='ESTOQUE'||heading==='FINANCEIRO'||heading==='ADMINISTRATIVO'||heading==='RELATÓRIOS'||heading==='CONFIGURAÇÕES'||heading==='CAIXA')return;const block=document.createElement('div');block.className='pc-userline';block.dataset.userAudit='1';block.innerHTML='<label>USUÁRIO <input type="text" readonly></label>';block.querySelector('input').value=user();const dataHeading=[...w.querySelectorAll('h2,h3')].find(e=>/DADOS D[AO]|CADASTRO DE|DADOS PRINCIPAIS/i.test(e.textContent));const dataPanel=dataHeading?.parentElement;const dataGrid=dataPanel?.querySelector('.vt-grid,.us-fields,.fields,.form-grid,.grid,.cad-grid');if(dataGrid){dataGrid.appendChild(block)}else if(dataPanel){dataPanel.appendChild(block)}else{title.insertAdjacentElement('afterend',block)}});
observer.observe(root(),{childList:true,subtree:true});
})();