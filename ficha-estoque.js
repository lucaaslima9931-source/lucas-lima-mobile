/* FICHA DE ESTOQUE — consulta por produto; dados locais existentes */
(()=>{'use strict';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n=v=>Number(v)||0;
const fmt=v=>n(v).toLocaleString('pt-BR',{maximumFractionDigits:3});
const date=v=>{if(!v)return '';const s=String(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s.slice(8)+'/'+s.slice(5,7)+'/'+s.slice(0,4):s};
const iso=v=>String(v||'').slice(0,10);
const user=()=>document.querySelector('.top-user strong')?.textContent?.trim()||'DEMONSTRAÇÃO';
const items=d=>Array.isArray(d?.itens)?d.itens:[];
const key=x=>String(x?.codigo??x?.produtoCodigo??'');
function history(code,p){
 const rows=[];
 // Preserve the actual event timestamp when available; legacy date-only documents
 // retain their original encounter order rather than sorting by document name.
 let sequence=0;
 const eventTime=(d,record,actions)=>{
  const audit=[...(record?.historico||[]),...(record?.historicoUsuario||[])];
  const match=audit.slice().reverse().find(h=>actions.some(a=>String(h.acao||'').toUpperCase().includes(a)));
  const candidate=[d,match?.data,record?.data].find(x=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(x||'')));
  return String(candidate||d||match?.data||record?.data||'');
 };
 const add=(d,kind,doc,qty,desc,who,obs)=>rows.push({day:iso(d),kind,doc,qty,desc,who:who||'—',obs:obs||'',sort:String(d||''),sequence:sequence++});
 const status=x=>String(x?.situacao||'').toUpperCase();
 const hasBaixa=x=>[...(x?.historico||[]),...(x?.historicoUsuario||[])].some(h=>/BAIX/.test(String(h.acao||'').toUpperCase()));
 const wasLowered=x=>Boolean(x?.cancelamentoDeBaixa||x?.situacaoAntesCancelamento==='BAIXADA'||x?.situacaoAntesCancelamento==='BAIXADO'||x?.baixadoEm||x?.baixadaEm||hasBaixa(x));
 const db=read('erp_matriz_operacoes_v2',{});
 for(const e of db.entradas||[]){
  const qty=items(e).filter(x=>key(x)===code).reduce((a,x)=>a+n(x.quantidade),0);
  if(!qty)continue;
  const lowered=status(e)==='BAIXADA'||(status(e)==='CANCELADA'&&wasLowered(e));
  if(lowered)add(eventTime(e.baixadaEm||e.data,e,['BAIX']), 'entrada','Entrada '+e.id,qty,'Compra',e.baixadoPor||e.usuario,'Destino: '+String(e.destino||'ESTOQUE'));
  if(status(e)==='CANCELADA')add(eventTime(e.canceladaEm||e.atualizadoEm||e.data,e,['CANCEL']), 'cancelada','Entrada '+e.id,lowered?-qty:0,'Entrada cancelada',e.canceladoPor||e.usuario,lowered?'Estorno da entrada':'Sem movimentação');
 }
 const sales=[...read('erp_matriz_vendas_v1',[])];
 // Avoid duplicate movements when the same sale exists in both data stores.
 for(const s of db.vendas||[])if(!sales.some(v=>String(v.numero)===String(s.id)))sales.push({...s,numero:s.id});
 for(const s of sales){
  const qty=items(s).filter(x=>key(x)===code).reduce((a,x)=>a+n(x.quantidade),0);if(!qty)continue;
  const lowered=status(s)==='BAIXADA'||(status(s)==='CANCELADA'&&wasLowered(s));
  if(lowered)add(eventTime(s.baixadaEm||s.atualizadoEm||s.data,s,['BAIX']), 'saida','Venda '+s.numero,-qty,'Venda baixada',s.usuario,'');
  if(status(s)==='CANCELADA')add(eventTime(s.canceladaEm||s.autorizacaoCancelamento?.data||s.atualizadoEm||s.data,s,['CANCEL']), 'cancelada','Venda '+s.numero,lowered?qty:0,'Venda cancelada',s.autorizacaoCancelamento?.usuario||s.usuario,lowered?'Devolução ao estoque':'Sem movimentação');
 }
 for(const t of read('erp_matriz_trocas_v1',[])){
  const returned=(t.devolvidos||[]).filter(x=>key(x)===code).reduce((a,x)=>a+n(x.quantidade),0);
  const outgoing=(t.novos||[]).filter(x=>key(x)===code).reduce((a,x)=>a+n(x.quantidade),0);
  const lowered=status(t)==='BAIXADA'||(status(t)==='CANCELADA'&&wasLowered(t));
  const returnedToStock=t.condicao==='ESTOQUE'||(!t.condicao||t.condicao==='RETORNAR AO ESTOQUE');
  if(lowered){
   if(returned&&returnedToStock)add(eventTime(t.baixadaEm||t.data,t,['BAIX']), 'entrada','Troca '+t.numero,returned,'Devolução',t.usuario,'Retorno ao estoque');
   if(outgoing)add(eventTime(t.baixadaEm||t.data,t,['BAIX']), 'saida','Troca '+t.numero,-outgoing,'Troca',t.usuario,'Novo produto entregue');
  }
  if(status(t)==='CANCELADA'){
   if(returned&&returnedToStock&&lowered)add(eventTime(t.canceladaEm||t.data,t,['CANCEL']), 'cancelada','Troca '+t.numero,-returned,'Troca cancelada',t.usuario,'Reversão do produto devolvido');
   if(outgoing&&lowered)add(eventTime(t.canceladaEm||t.data,t,['CANCEL']), 'cancelada','Troca '+t.numero,outgoing,'Troca cancelada',t.usuario,'Retorno do produto novo');
   if(!lowered&&(returned||outgoing))add(eventTime(t.canceladaEm||t.data,t,['CANCEL']), 'cancelada','Troca '+t.numero,0,'Troca cancelada',t.usuario,'Sem movimentação');
  }
 }
 for(const a of read('erp_systems_acertos_v1',[]))for(const it of a.itens||[]){
  if(String(it.codigo)!==code)continue;const diff=n(it.diferenca);if(!diff)continue;
  const lowered=status(a)==='BAIXADO'||(status(a)==='CANCELADO'&&wasLowered(a));
  if(lowered)add(eventTime(a.baixadoEm||a.data,a,['BAIX']),diff>0?'entrada':'saida','Acerto '+a.id,diff,'Acerto de estoque',a.baixadoPor||a.usuario,a.observacoes||'');
  if(status(a)==='CANCELADO')add(eventTime(a.canceladoEm||a.data,a,['CANCEL']), 'cancelada','Acerto '+a.id,lowered?-diff:0,'Acerto cancelado',a.usuario,a.observacoes||'');
 }
 for(const a of read('erp_systems_avariados_v1',[]))for(const it of a.itens||[]){
  if(String(it.codigo)!==code)continue;const qtd=n(it.quantidade);if(!qtd)continue;
  const lowered=status(a)==='BAIXADO'||(status(a)==='CANCELADO'&&wasLowered(a));
  if(lowered)add(eventTime(a.baixadoEm||a.data,a,['BAIX']), 'saida','Avariado '+a.id,-qtd,'Produto avariado',a.usuarioAutorizador||a.usuario,a.observacoes||'');
  if(status(a)==='CANCELADO')add(eventTime(a.canceladoEm||a.data,a,['CANCEL']), 'cancelada','Avariado '+a.id,lowered?qtd:0,'Avaria cancelada',a.usuarioAutorizador||a.usuario,a.observacoes||'');
 }
 // Saídas de Estoque: baixa e estorno separados, com a data real de cada evento.
 for(const s of read('erp_systems_saidas_almox_v1',[])){
  const qty=items(s).filter(x=>key(x)===code).reduce((a,x)=>a+n(x.quantidade),0);
  if(!qty)continue;
  const lowered=status(s)==='BAIXADA'||(status(s)==='CANCELADA'&&wasLowered(s));
  if(lowered)add(eventTime(s.baixadaEm||s.data,s,['BAIX']), 'saida','Saída '+s.id,-qty,'Saída de estoque',s.baixadoPor||s.usuario,s.observacoes||'');
  if(status(s)==='CANCELADA')add(eventTime(s.canceladaEm||s.data,s,['CANCEL']), 'cancelada','Saída '+s.id,lowered?qty:0,'Saída cancelada',s.canceladoPor||s.usuario,lowered?'Estorno da saída de estoque':'Cancelamento pendente sem movimentação');
 }
 rows.sort((a,b)=>{
  const dayOrder=a.day.localeCompare(b.day);if(dayOrder)return dayOrder;
  const aTimed=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(a.sort);
  const bTimed=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(b.sort);
  if(aTimed&&bTimed)return a.sort.localeCompare(b.sort)||a.sequence-b.sequence;
  // Legacy date-only events cannot be ordered reliably within the same day.
  return a.sequence-b.sequence;
 });
 // Anchor the ledger to the real current physical stock; reconstruct the opening
 // from the sum of posted operations, not from an assumed zero starting balance.
 const base=n(p.provisao)-rows.reduce((a,r)=>a+r.qty,0);
 let balance=base;for(const r of rows){balance+=r.qty;r.balance=balance;}
 return {rows,base};
}
function inspectMovement(r){
 const m=/^(Entrada|Venda|Troca|Acerto|Avariado|Saída)\s+(.+)$/.exec(r.doc||'');if(!m)return;
 const routes={Entrada:'LLopenEntryFromStock',Venda:'LLopenSaleFromStock',Troca:'LLopenTradeFromStock',Acerto:'LLopenAdjustmentFromStock',Avariado:'LLopenDamagedFromStock',Saída:'LLopenStockExitFromStock'};
 const route=routes[m[1]];
 if(!route||typeof window[route]!=='function'){alert('A tela original desta movimentação ainda não oferece abertura direta nesta versão.');return;}
 const state={product:document.getElementById('fs-product')?.value||'',from:document.getElementById('fs-from')?.value||'',to:document.getElementById('fs-to')?.value||'',kind:document.getElementById('fs-kind')?.value||'todas'};
 if(!window[route](Number(m[2]))){alert('Documento original não encontrado.');return;}
 const back=document.createElement('button');back.type='button';back.id='ll-back-to-stock';back.textContent='← VOLTAR À FICHA DE ESTOQUE';back.style.cssText='position:fixed;right:22px;bottom:22px;z-index:9999;background:#e92745;color:#fff;border:0;border-radius:6px;padding:15px 22px;font-weight:bold;cursor:pointer;box-shadow:0 4px 16px #0004';
 back.onclick=()=>{back.remove();render();const p=document.getElementById('fs-product');p.value=state.product;p.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('fs-from').value=state.from;document.getElementById('fs-to').value=state.to;document.getElementById('fs-kind').value=state.kind;document.getElementById('fs-search').click()};
 document.body.appendChild(back);
}

window.LL_fichaEstoqueHistoricoCompartilhado=(code,p)=>history(String(code),p);
window.LL_fichaEstoqueAbrirMovimento=inspectMovement;
function render(){
 if(typeof window.LL_estoqueCentralConciliar==='function'){window.LL_estoqueCentralConciliar();products=read('erp_matriz_produtos_teste_v1',[]);}
 screen='FICHA DE ESTOQUE';active('ESTOQUE');const rootEl=root();rootEl.innerHTML=`<div class="fs-page"><header class="fs-header"><h1>▣ FICHA DE ESTOQUE</h1></header><div class="fs-top"><section class="fs-card"><h2>PRODUTO</h2><div class="fs-fields"><label>CÓDIGO / PRODUTO<input id="fs-product" type="text" inputmode="numeric" autocomplete="off" placeholder="SELECIONE O PRODUTO" aria-label="Digite o código do produto"></label><label>DESCRIÇÃO<div class="fs-description-line"><input id="fs-description" readonly><button type="button" id="fs-pick-product" title="Pesquisar e selecionar produto">+</button></div></label><label>MARCA<input id="fs-brand" readonly></label><label>CATEGORIA<input id="fs-category" readonly></label><label>UNIDADE<input id="fs-unit" readonly></label></div></section><section class="fs-card"><h2>ESTOQUE ATUAL</h2><div class="fs-stats"><div class="fs-stat fs-yellow" style="background:#fff0b8!important;color:#765200!important">PROVISÃO<strong id="fs-provision">—</strong></div><div class="fs-stat fs-red" style="background:#ffe0e0!important;color:#a92323!important">VENDA<strong id="fs-reserved">—</strong></div><div class="fs-stat fs-green" style="background:#d9f5e5!important;color:#137647!important">DISPONÍVEL<strong id="fs-available">—</strong></div></div></section></div><section class="fs-card fs-controls"><h2>▣ PESQUISA DE MOVIMENTAÇÕES</h2><div class="fs-control-row"><div class="fs-period"><label>DATA INICIAL<input type="date" id="fs-from"></label><label>DATA FINAL<input type="date" id="fs-to"></label></div><label>MOVIMENTAÇÕES<select id="fs-kind"><option value="todas">TODAS</option><option value="entrada">ENTRADAS</option><option value="saida">SAÍDAS</option><option value="cancelada">CANCELADAS</option></select></label><div class="fs-buttons"><button id="fs-search">PESQUISAR</button></div></div></section><section class="fs-card"><h2>MOVIMENTAÇÕES</h2><div class="fs-legend"><span class="fs-leg-in">ENTRADAS</span><span class="fs-leg-out">SAÍDAS</span><span class="fs-leg-cancel">CANCELADAS</span></div><div class="fs-scroll"><table class="fs-table"><thead><tr><th>DATA</th><th>DOCUMENTO</th><th>MOVIMENTAÇÃO</th><th>ENTRADA</th><th>SAÍDA</th><th>SALDO</th><th>USUÁRIO</th><th>OBSERVAÇÕES</th></tr></thead><tbody id="fs-rows"><tr><td colspan="8" class="fs-empty">SELECIONE O PRODUTO E CLIQUE EM PESQUISAR.</td></tr></tbody></table></div></section><div class="fs-footer"><button id="fs-back">VOLTAR</button></div></div>`;
 document.querySelectorAll('#app .pc-userline,#app [data-user-audit],#app .erp-shortcut-open').forEach(el=>el.remove());
 const $=id=>document.getElementById(id);
 let searched=false;function resetResults(){searched=false;$('fs-rows').innerHTML='<tr><td colspan="8" class="fs-empty">SELECIONE OS FILTROS E CLIQUE EM PESQUISAR.</td></tr>'}
 function draw(){products=typeof window.LL_estoqueCentralConciliar==='function'?window.LL_estoqueCentralConciliar():read('erp_matriz_produtos_teste_v1',[]);const p=products.find(x=>String(x.codigo)===$('fs-product').value);for(const [id,value] of [['fs-description',p?.descricao],['fs-brand',p?.marca],['fs-category',p?.categoria],['fs-unit',p?.unidade]])$(id).value=value||'';for(const [id,value] of [['fs-provision',p?.provisao],['fs-reserved',p?.venda],['fs-available',p?n(p.provisao)-n(p.venda):null]])$(id).textContent=value==null?'—':fmt(value);if(!p||!searched){resetResults();return;}
 const {rows,base}=history(String(p.codigo),p),from=$('fs-from').value,to=$('fs-to').value,kind=$('fs-kind').value,filtered=rows.filter(r=>(!from||r.day>=from)&&(!to||r.day<=to)&&(kind==='todas'||r.kind===kind));
 let opening=base;for(const r of rows)if(from&&r.day<from)opening+=r.qty;
 const newestFirst=filtered.slice().reverse();
 const html=newestFirst.map((r,i)=>`<tr class="fs-${r.kind}" data-fs-move="${i}" title="DOIS CLIQUES PARA VISUALIZAR" style="cursor:pointer"><td>${esc(date(r.day))}</td><td>${esc(r.doc)}</td><td>${esc(r.desc)}</td><td>${r.qty>0?fmt(r.qty):'—'}</td><td>${r.qty<0?fmt(-r.qty):'—'}</td><td>${fmt(r.balance)}</td><td>${esc(r.who)}</td><td>${esc(r.obs)}</td></tr>`).join('');
 $('fs-rows').innerHTML=(html||'<tr><td colspan="8" class="fs-empty">NENHUMA MOVIMENTAÇÃO NO PERÍODO.</td></tr>')+`<tr class="fs-opening"><td>${from?esc(date(from)):'—'}</td><td>—</td><td>SALDO ANTERIOR</td><td>—</td><td>—</td><td>${fmt(opening)}</td><td>—</td><td>—</td></tr>`;$('fs-rows').querySelectorAll('[data-fs-move]').forEach(tr=>tr.ondblclick=()=>inspectMovement(newestFirst[Number(tr.dataset.fsMove)]));}
 function pickProduct(){
  document.getElementById('fs-picker-overlay')?.remove();
  const overlay=document.createElement('div');overlay.id='fs-picker-overlay';overlay.className='fs-picker-overlay';
  overlay.innerHTML=`<div class="fs-picker-dialog" role="dialog" aria-modal="true" aria-label="Selecionar produto"><div class="fs-picker-header"><strong>SELECIONE O PRODUTO</strong><button type="button" id="fs-picker-x" aria-label="Fechar">×</button></div><div class="fs-picker-content"><div class="fs-picker-search"><label>PESQUISAR POR<select id="fs-picker-type"><option value="descricao">DESCRIÇÃO</option><option value="codigo">CÓDIGO</option></select></label><label>TEXTO DA PESQUISA<input id="fs-picker-query" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" id="fs-picker-search">PESQUISAR</button></div><div class="fs-picker-tablewrap"><table class="fs-picker-table"><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO DO PRODUTO</th><th>SITUAÇÃO</th></tr></thead><tbody id="fs-picker-results"></tbody></table></div></div><div class="fs-picker-footer"><span>DÊ DOIS CLIQUES PARA SELECIONAR.</span><button type="button" id="fs-picker-cancel">CANCELAR</button></div></div>`;
  document.body.appendChild(overlay);
  const q=id=>overlay.querySelector('#'+id);
  const close=()=>{document.removeEventListener('keydown',keyHandler,true);overlay.remove()};
  const keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}else if(e.key==='Enter'&&e.target===q('fs-picker-query')){e.preventDefault();show()}};
  const show=()=>{const value=q('fs-picker-query').value.trim().toLocaleLowerCase('pt-BR'),field=q('fs-picker-type').value;const matches=products.filter(p=>!value||String(p[field]??'').toLocaleLowerCase('pt-BR').includes(value));const tbody=q('fs-picker-results');tbody.innerHTML=matches.map(p=>`<tr data-code="${esc(p.codigo)}"><td>${esc(p.codigo)}</td><td>${esc(p.descricao)}</td><td><span class="fs-picker-status">${esc(p.situacao||'ATIVO')}</span></td></tr>`).join('')||'<tr><td colspan="3" class="fs-picker-none">NENHUM PRODUTO ENCONTRADO.</td></tr>';tbody.querySelectorAll('tr[data-code]').forEach(row=>row.ondblclick=()=>{$('fs-product').value=row.dataset.code;resetResults();draw();close()})};
  q('fs-picker-x').onclick=close;q('fs-picker-cancel').onclick=close;q('fs-picker-search').onclick=show;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});document.addEventListener('keydown',keyHandler,true);show();q('fs-picker-query').focus();
 }
 $('fs-pick-product').onclick=pickProduct;
 $('fs-product').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const code=e.currentTarget.value.trim();const p=products.find(x=>String(x.codigo)===code);if(p){resetResults();draw();e.currentTarget.blur()}else{alert('PRODUTO NÃO ENCONTRADO. DIGITE UM CÓDIGO VÁLIDO OU CLIQUE NO BOTÃO +.')}}});$('fs-product').addEventListener('change',()=>{const code=$('fs-product').value.trim();if(!code||products.some(p=>String(p.codigo)===code)){resetResults();draw();}});$('fs-search').onclick=()=>{searched=true;draw()};$('fs-back').onclick=()=>category('ESTOQUE');
 const keyboard=e=>{if(screen!=='FICHA DE ESTOQUE')return;if(e.key==='F5'){e.preventDefault();searched=true;draw()}if(e.key==='F12'){e.preventDefault();pickProduct()}};document.addEventListener('keydown',keyboard);draw();
}
const prev=open;open=function(name){if(name==='FICHA DE ESTOQUE'||name==='RELATÓRIO DE ESTOQUE')return render();return prev(name)};
})();
