/* LUCAS LIMA — ORÇAMENTOS INDEPENDENTES. Não modifica estoque, vendas ou financeiro. */
(()=>{'use strict';
const KEY='erp_matriz_orcamentos_v1';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const numeric=v=>Number(String(v??'').replace(/\./g,'').replace(',','.'))||0;
const date=()=>new Date().toISOString().slice(0,10);
let docs=read(KEY,[]);if(!Array.isArray(docs))docs=[];
let selected=null,items=[],filter='',searched=false;
const products=()=>typeof window.LL_estoqueCentralConciliar==='function' ? window.LL_estoqueCentralConciliar() : read('erp_matriz_produtos_teste_v1',[]);
const clients=()=>read('erp_matriz_clientes_v1',[]);
// V415: exibir somente o nome do usuário vinculado ao funcionário vendedor.
// Preservar o ID do vendedor para não alterar vínculos e histórico.
const nomeUsuarioVendedorOr=f=>{
 const usuarios=read('erp_matriz_usuarios_v1',{usuarios:[]}).usuarios||[];
 const vinculado=usuarios.find(u=>String(u.funcionarioId||'')===String(f.id)&&String(u.situacao||'ATIVO').toUpperCase()!=='INATIVO');
 return String(vinculado?.nome||f.nome||'').trim();
};
const sellers=()=>{const d=read('erp_matriz_vendedores_v1',{});const legacy=Array.isArray(d.vendedores)?d.vendedores:[];const rh=read('erp_matriz_rh_v1',{funcionarios:[]});const employees=Array.isArray(rh.funcionarios)?rh.funcionarios:[];const vendedores=employees.filter(f=>/VENDEDOR/i.test([f.tipo,f.funcao,f.cargo,f.funcaoNome,f.cargoNome,f.descricaoCargo].filter(Boolean).join(' '))).map(f=>{const old=legacy.find(v=>String(v.funcionarioId)===String(f.id));return {id:String(old?.id??('F-'+(f.id??f.codigo))),nome:nomeUsuarioVendedorOr(f),situacao:String(f.situacao??'ATIVO').toUpperCase()}});return [...vendedores,...legacy.filter(v=>!vendedores.some(f=>String(f.id)===String(v.id)))];};
const nomeVendedorOr=d=>sellers().find(v=>String(v.id)===String(d.vendedorId))?.nome||String(d.vendedor||'').replace(/^\d+\s*[—-]\s*/,'');
const next=()=>Math.max(0,...docs.map(x=>Number(x.numero)||0))+1;
function usuarioAtualOr(){return (document.querySelector('.top-user strong')?.textContent||document.querySelector('.top-user')?.textContent||document.querySelector('[class*=user] strong')?.textContent||localStorage.getItem('erp_usuario_nome')||'LUCAS').trim()}
function mostrarUsuarioOr(){const d=docs.find(x=>x.numero===selected);const el=$('or-user');if(el){el.value=d?.usuario||usuarioAtualOr();el.title='CLIQUE PARA VER O HISTÓRICO DO ORÇAMENTO'}}
function registrarUsuarioOr(d,acao){d.historicoUsuario=Array.isArray(d.historicoUsuario)?d.historicoUsuario:[];d.historicoUsuario.push({acao,usuario:usuarioAtualOr(),data:new Date().toISOString()});d.usuario=usuarioAtualOr()}
function historicoUsuarioOr(){
 document.querySelectorAll('.or-user-overlay').forEach(el=>el.remove());
 const d=docs.find(x=>String(x.numero)===String(selected));
 const eventos=Array.isArray(d?.historicoUsuario)?d.historicoUsuario.slice().reverse():[];
 const ultimo=eventos[0]?.usuario||d?.usuario||usuarioAtualOr();
 const linhas=eventos.map(h=>{
  const acao=({GRAVAR:'CADASTRO',ALTERAR:'ALTERAÇÃO',BAIXAR:'BAIXA',CANCELAR:'CANCELAMENTO'})[String(h.acao||'').toUpperCase()]||String(h.acao||'AÇÃO');
  const dt=h.data?new Date(h.data):null;
  const horario=dt&&!Number.isNaN(dt.getTime())?dt.toLocaleString('pt-BR'):'DATA NÃO INFORMADA';
  return `<div class="or-history-item"><div><b>${esc(acao)}</b><span> — ${esc(h.usuario||'NÃO INFORMADO')}</span></div><small>${esc(horario)}</small></div>`;
 }).join('');
 const back=document.createElement('div');back.className='or-user-overlay or-history-back';
 back.innerHTML=`<section class="or-history-dialog" role="dialog" aria-modal="true" aria-label="HISTÓRICO DE ALTERAÇÕES"><div class="or-history-title">HISTÓRICO DE ALTERAÇÕES</div><div class="or-history-body"><p><b>ÚLTIMO USUÁRIO:</b> ${esc(ultimo)}</p><div class="or-history-list">${linhas||'<p>NENHUMA AÇÃO REGISTRADA PARA ESTE ORÇAMENTO.</p>'}</div></div><div class="or-history-footer"><button type="button" data-close>FECHAR</button></div></section>`;
 const style=document.createElement('style');style.textContent=`.or-history-back{z-index:100006;display:flex;align-items:center;justify-content:center}.or-history-dialog{width:min(440px,92vw);background:white;color:#173f74;border-radius:13px;box-shadow:0 15px 50px #00162d70;overflow:hidden;font-family:Arial,sans-serif}.or-history-title{background:#1c427a;color:white;font-size:16px;font-weight:800;padding:17px 18px}.or-history-body{padding:16px 17px 10px}.or-history-body>p{font-size:16px;margin:12px 0 24px}.or-history-list{max-height:42vh;overflow-y:auto}.or-history-list>p{font-size:16px;margin:0 0 20px}.or-history-item{border-bottom:1px solid #d1ddef;padding:9px 0 12px;font-size:15px}.or-history-item b{font-weight:800}.or-history-item small{display:block;font-size:12px;color:#6a819e;margin-top:3px}.or-history-footer{display:flex;justify-content:flex-end;padding:18px}.or-history-footer button{border:0;border-radius:5px;background:#1e5aab;color:white;font-weight:800;padding:11px 20px;cursor:pointer}`;
 document.head.appendChild(style);document.body.appendChild(back);
 const close=()=>{document.removeEventListener('keydown',key,true);back.remove();style.remove()};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',key,true);
 back.querySelector('[data-close]').onclick=close;
 back.onclick=e=>{if(e.target===back)close()};
}
function atalhosOrcamentos(){
 document.querySelectorAll('.or-shortcuts-back').forEach(x=>x.remove());
 const back=document.createElement('div');back.className='or-shortcuts-back';
 back.innerHTML=`<section class="or-shortcuts-dialog" role="dialog" aria-modal="true" aria-label="ATALHOS — ORÇAMENTOS"><header><strong>⌂ ATALHOS — ▣ ORÇAMENTOS</strong><button type="button" data-close aria-label="FECHAR">×</button></header><div class="or-shortcuts-list"><div><kbd>F1</kbd><span>Abrir esta janela de atalhos</span></div><div><kbd>F12</kbd><span>Localizar orçamento pelo número</span></div></div><footer><button type="button" data-close>FECHAR</button></footer></section>`;
 document.body.appendChild(back);
 const close=()=>back.remove();back.querySelectorAll('[data-close]').forEach(x=>x.onclick=close);
 back.addEventListener('click',e=>{if(e.target===back)close()});
}
function msg(s){erpAlert(s)}
function field(id,label,type='text',extra=''){return `<label class="or-field">${label}<input id="${id}" type="${type}" ${extra}></label>`}
function layout(){screen='ORÇAMENTOS';root().innerHTML=`<section class="or-page or-vendas-modelo">
<div class="or-topbar"><b>▣ ORÇAMENTOS</b><button id="or-shortcuts" type="button">⌂ ATALHOS</button></div>
<div class="or-panel"><h2>DADOS DO ORÇAMENTO</h2><div class="or-grid or-header-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
${field('or-number','Nº ORÇAMENTO','text','readonly')}${field('or-date','DATA','date')}<label class="or-field">CLIENTE<div style="display:flex;gap:6px"><input id="or-client-display" value="SELECIONE" readonly style="flex:1;min-width:0"><button type="button" id="or-client-plus" style="background:#0ba27f;color:white;border:0;border-radius:5px;min-width:38px;font-size:19px;font-weight:bold">+</button></div><select id="or-client" style="display:none" aria-label="Cliente selecionado"></select></label>
<label class="or-field">VENDEDOR<div style="display:flex;gap:6px"><input id="or-seller-display" value="SELECIONE" readonly style="flex:1;min-width:0"><button type="button" id="or-seller-plus" style="background:#0ba27f;color:white;border:0;border-radius:5px;min-width:38px;font-size:19px;font-weight:bold">+</button></div><select id="or-seller" style="display:none" aria-label="Vendedor selecionado"></select></label>${field('or-valid','VALIDADE','date')}<label class="or-field or-header-user" style="grid-column:3;grid-row:2;display:flex;visibility:visible">USUÁRIO<input readonly id="or-user" class="or-user-active" title="CLIQUE PARA VER O HISTÓRICO DE USUÁRIOS DESTE ORÇAMENTO"></label></div></div>
<div class="or-panel"><h2>PRODUTOS</h2><div class="or-products-grid"><div class="or-products-main"><div class="or-grid or-product-inputs">${field('or-code','CÓDIGO / BARRAS')}${field('or-desc','DESCRIÇÃO')}${field('or-qty','QUANTIDADE','number','min="0.001" step="any"')}</div><input id="or-price" type="hidden" value=""><button id="or-add" class="or-add">ADICIONAR PRODUTO</button><div class="or-scroll"><table class="or-table"><thead><tr><th>CÓDIGO</th><th>PRODUTO</th><th>QTD.</th><th>UNIT.</th><th>TOTAL</th><th></th></tr></thead><tbody id="or-items"></tbody></table></div></div><div class="or-stock"><div class="or-stock-one">PROVISÃO<strong id="or-provisao">—</strong></div><div class="or-stock-one">VENDA<strong id="or-venda">—</strong></div><div class="or-stock-one">DISPONÍVEL<strong id="or-disponivel">—</strong></div></div></div></div>
<div class="or-panel"><h2>VALORES DO ORÇAMENTO</h2><div class="or-values"><div class="or-summary" id="or-summary"></div><div class="or-adjust">${field('or-discount','DESCONTO (R$)','number','min="0" step="0.01"')}${field('or-discount-pct','DESCONTO (%)','number','min="0" step="0.01"')}${field('or-extra','ACRÉSCIMO (R$)','number','min="0" step="0.01"')}${field('or-extra-pct','ACRÉSCIMO (%)','number','min="0" step="0.01"')}</div></div><label class="or-field">OBSERVAÇÕES<textarea id="or-notes" rows="3"></textarea></label></div>
<div class="or-actions"><button id="or-new">NOVA</button><button id="or-save">GRAVAR</button><button id="or-edit">ALTERAR</button><button id="or-print">IMPRIMIR</button><button id="or-back">VOLTAR</button></div>
<div class="or-panel"><h2>CONSULTAR ORÇAMENTOS</h2><div class="or-filter"><label class="or-field">DATA INICIAL<input type="date" id="or-from"></label><label class="or-field">DATA FINAL<input type="date" id="or-to"></label><label class="or-field">CLIENTE<div class="or-consult-client"><input id="or-query" value="TODOS" readonly><button type="button" id="or-query-plus" aria-label="SELECIONAR CLIENTE">+</button></div></label><button type="button" id="or-search">PESQUISAR</button></div><div class="or-scroll"><table class="or-table"><thead><tr><th>Nº</th><th>DATA</th><th>CLIENTE</th><th>VENDEDOR</th><th>TOTAL</th></tr></thead><tbody id="or-list"></tbody></table></div></div>
</section>`;
$('or-client').innerHTML='<option value="">SELECIONE</option>'+clients().map(c=>`<option value="${esc(c.codigo??c.id)}">${esc(c.codigo??c.id)} — ${esc(c.nome??c.razao??c.descricao)}</option>`).join('');
$('or-seller').innerHTML='<option value="">SELECIONE</option>'+sellers().filter(s=>s.situacao!=='INATIVO').map(s=>`<option value="${esc(s.id)}">${esc(s.nome)}</option>`).join('');
$('or-client-plus').onclick=()=>choosePerson('client');$('or-seller-plus').onclick=()=>choosePerson('seller');mostrarUsuarioOr();$('or-user').onclick=historicoUsuarioOr;$('or-shortcuts').onclick=atalhosOrcamentos;$('or-new').onclick=newDoc;$('or-save').onclick=()=>persist(false);$('or-edit').onclick=()=>persist(true);$('or-query-plus').onclick=chooseConsultClient;$('or-search').onclick=()=>{searched=true;list()};$('or-print').onclick=printDoc;$('or-back').onclick=voltarAoMenuVendas;$('or-add').onclick=addItem;
$('or-code').addEventListener('change',lookupProduct);$('or-code').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupProduct();$('or-qty').focus()}});
['or-from','or-to'].forEach(id=>$(id).onchange=()=>{searched=false;list()});['or-discount','or-extra','or-discount-pct','or-extra-pct'].forEach(id=>$(id).addEventListener('input',()=>totals(id)));
searched=false;newDoc();list();active('VENDAS');}
function voltarAoMenuVendas(){
 document.querySelectorAll('.or-user-overlay,.or-shortcuts-back').forEach(el=>el.remove());
 if(typeof category==='function'){category('VENDAS');return;}
 if(typeof home==='function')home();
}
function syncPerson(kind){const id=kind==='client'?'or-client':'or-seller',display=kind==='client'?'or-client-display':'or-seller-display';const sel=$(id);$(display).value=sel.value?(sel.selectedOptions[0]?.textContent||'SELECIONE').replace(/^\d+\s*[—-]\s*/,''):'SELECIONE'}
let consultClientId='';
function chooseConsultClient(){
 const back=document.createElement('div');back.className='or-person-back';
 back.innerHTML=`<section class="or-person-dialog" role="dialog" aria-modal="true" aria-label="SELECIONE O CLIENTE"><header><strong>SELECIONE O CLIENTE</strong><button type="button" data-close>×</button></header><div class="or-person-body"><div class="or-person-filters"><label>PESQUISAR POR<select data-type><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label><label>TEXTO DA PESQUISA<input data-query type="search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" data-search>PESQUISAR</button><button type="button" data-all>TODOS</button></div><div class="or-person-table"><table><thead><tr><th>CÓDIGO</th><th>NOME DO CLIENTE</th><th>SITUAÇÃO</th></tr></thead><tbody data-results><tr><td colspan="3">CLIQUE EM PESQUISAR PARA EXIBIR OS CLIENTES.</td></tr></tbody></table></div><footer><small>DÊ DOIS CLIQUES PARA SELECIONAR.</small><button type="button" data-cancel>CANCELAR</button></footer></div></section>`;
 document.body.appendChild(back);const close=()=>back.remove();back.querySelector('[data-close]').onclick=close;back.querySelector('[data-cancel]').onclick=close;back.onclick=e=>{if(e.target===back)close()};
 const query=back.querySelector('[data-query]'),type=back.querySelector('[data-type]'),results=back.querySelector('[data-results]');
 const search=()=>{const q=query.value.trim().toLocaleUpperCase('pt-BR');const rows=clients().map(c=>({codigo:String(c.codigo??c.id??''),nome:String(c.nome??c.razao??c.descricao??''),situacao:String(c.situacao??'ATIVO')})).filter(c=>c[type.value].toLocaleUpperCase('pt-BR').includes(q));results.innerHTML=rows.length?rows.map(c=>`<tr data-code="${esc(c.codigo)}"><td>${esc(c.codigo)}</td><td>${esc(c.nome)}</td><td>${esc(c.situacao)}</td></tr>`).join(''):'<tr><td colspan="3">NENHUM CLIENTE ENCONTRADO.</td></tr>';results.querySelectorAll('tr[data-code]').forEach(tr=>tr.ondblclick=()=>{consultClientId=tr.dataset.code;const c=rows.find(x=>x.codigo===consultClientId);$('or-query').value=c?.nome||'TODOS';searched=false;list();close()})};
 back.querySelector('[data-search]').onclick=search;query.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search()}};back.querySelector('[data-all]').onclick=()=>{consultClientId='';$('or-query').value='TODOS';searched=false;list();close()};query.focus();
}
function choosePerson(kind){
 const isClient=kind==='client', id=isClient?'or-client':'or-seller',label=isClient?'CLIENTE':'VENDEDOR',plural=isClient?'CLIENTES':'VENDEDORES',sel=$(id);
 // Mesmo seletor de Vendas: pesquisa manual, tabela, cadastro e seleção por duplo clique.
 const back=document.createElement('div');back.className='or-person-back';
 back.innerHTML=`<section class="or-person-dialog" role="dialog" aria-modal="true" aria-label="SELECIONE O ${label}"><header><strong>SELECIONE O ${label}</strong><button type="button" data-close aria-label="FECHAR">×</button></header><div class="or-person-body"><div class="or-person-filters"><label>PESQUISAR POR<select data-type><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label><label>TEXTO DA PESQUISA<input data-query type="search" placeholder="DIGITE PARA PESQUISAR..."></label><button type="button" data-search>PESQUISAR</button><button type="button" data-new>+ NOVO ${label}</button></div><div class="or-person-table"><table><thead><tr><th>CÓDIGO</th><th>NOME DO ${label}</th><th>SITUAÇÃO</th></tr></thead><tbody data-results><tr><td colspan="3">CLIQUE EM PESQUISAR PARA EXIBIR OS ${plural}.</td></tr></tbody></table></div><footer><small>DÊ DOIS CLIQUES PARA SELECIONAR.</small><button type="button" data-cancel>CANCELAR</button></footer></div></section>`;
 document.body.appendChild(back);
 const close=()=>back.remove();back.querySelector('[data-close]').onclick=close;back.querySelector('[data-cancel]').onclick=close;back.onclick=e=>{if(e.target===back)close()};
 const query=back.querySelector('[data-query]'),type=back.querySelector('[data-type]'),results=back.querySelector('[data-results]');
 const rows=()=>isClient?clients().map(c=>({codigo:String(c.codigo??c.id??''),nome:String(c.nome??c.razao??c.descricao??''),situacao:String(c.situacao??'ATIVO')})):sellers().map(v=>({codigo:String(v.id??v.codigo??''),nome:String(v.nome??''),situacao:String(v.situacao??'ATIVO')}));
 const search=()=>{const q=query.value.trim().toLocaleUpperCase('pt-BR');const found=rows().filter(x=>String(x[type.value]||'').toLocaleUpperCase('pt-BR').includes(q));results.innerHTML=found.length?found.map(x=>`<tr data-code="${esc(x.codigo)}" title="DÊ DOIS CLIQUES PARA SELECIONAR"><td>${esc(x.codigo)}</td><td>${esc(x.nome)}</td><td>${esc(x.situacao)}</td></tr>`).join(''):`<tr><td colspan="3">NENHUM ${label} ENCONTRADO.</td></tr>`;
 results.querySelectorAll('tr[data-code]').forEach(tr=>tr.ondblclick=()=>{const code=tr.dataset.code;let opt=[...sel.options].find(o=>o.value===code);if(!opt){opt=document.createElement('option');opt.value=code;const item=rows().find(x=>x.codigo===code);opt.textContent=item?.nome||'';sel.appendChild(opt)}sel.value=code;syncPerson(kind);close()})};
 back.querySelector('[data-search]').onclick=search;query.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search()}};
 back.querySelector('[data-new]').onclick=()=>{close();if(isClient){if(typeof category==='function')category('CADASTROS');if(typeof clientForm==='function')clientForm()}else{open('FUNCIONÁRIOS')} };
 query.focus();
}
let orDiscountMode='reais',orExtraMode='reais';
function newDoc(){orDiscountMode='reais';orExtraMode='reais';selected=null;items=[];mostrarUsuarioOr();$('or-number').value=String(next()).padStart(6,'0');$('or-date').value=date();$('or-valid').value='';$('or-client').value='';$('or-seller').value='';syncPerson('client');syncPerson('seller');$('or-discount').value='0';$('or-extra').value='0';$('or-discount-pct').value='0';$('or-extra-pct').value='0';$('or-notes').value='';['or-code','or-desc','or-price'].forEach(id=>$(id).value='');$('or-qty').value='1';['or-provisao','or-venda','or-disponivel'].forEach(id=>$(id).textContent='—');drawItems()}
function findOrProduct(code){
 const v=String(code??'').trim();
 if(!v)return null;
 return products().find(p=>String(p.codigo??'').trim()===v||String(p.barras??p.codigoBarras??p.codigo_barras??'').trim()===v)||null;
}
function lookupProduct(){
 const p=findOrProduct($('or-code').value);
 if(!p){$('or-desc').value='';$('or-price').value='';['or-provisao','or-venda','or-disponivel'].forEach(id=>$(id).textContent='—');return false;}
 $('or-code').value=String(p.codigo??'');
 $('or-desc').value=p.descricao||'';
 $('or-price').value=Number(p.precoVenda??p.preco_venda??p.preco??0).toFixed(2);
 const prov=Number(p.provisao||0),venda=Number(p.venda||0);
 $('or-provisao').textContent=prov;$('or-venda').textContent=venda;$('or-disponivel').textContent=prov-venda;
 return true;
}
function addItem(){
 if(!lookupProduct())return msg('PRODUTO NÃO ENCONTRADO. INFORME O CÓDIGO INTERNO OU CÓDIGO DE BARRAS.');
 const code=$('or-code').value.trim(),desc=$('or-desc').value.trim(),qty=Number($('or-qty').value),price=Number($('or-price').value);
 if(!desc||!Number.isFinite(qty)||qty<=0||!Number.isFinite(price)||price<0)return msg('INFORME PRODUTO E QUANTIDADE VÁLIDOS.');
 items.push({codigo:code,descricao:desc,quantidade:qty,preco:price});
 ['or-code','or-desc','or-price'].forEach(id=>$(id).value='');$('or-qty').value='1';drawItems();
 ['or-provisao','or-venda','or-disponivel'].forEach(id=>$(id).textContent='—');$('or-code').focus();
}
function mostrarEstoqueItemOr(codigo){
 const p=findOrProduct(codigo);
 if(!p){['or-provisao','or-venda','or-disponivel'].forEach(id=>$(id).textContent='—');return;}
 const prov=Number(p.provisao)||0, venda=Number(p.venda)||0;
 $('or-provisao').textContent=prov;
 $('or-venda').textContent=venda;
 $('or-disponivel').textContent=prov-venda;
}
function drawItems(){
 $('or-items').innerHTML=items.length?items.map((x,i)=>`<tr><td data-stock="${i}" title="CLIQUE PARA VISUALIZAR O ESTOQUE" class="or-stock-link">${esc(x.codigo)}</td><td data-stock="${i}" title="CLIQUE PARA VISUALIZAR O ESTOQUE" class="or-stock-link">${esc(x.descricao)}</td><td>${x.quantidade}</td><td>${money(x.preco)}</td><td>${money(x.quantidade*x.preco)}</td><td><button data-remove="${i}" title="Remover item">REMOVER</button></td></tr>`).join(''):'<tr><td colspan="6">NENHUM PRODUTO ADICIONADO</td></tr>';
 $('or-items').querySelectorAll('[data-stock]').forEach(cell=>cell.onclick=()=>mostrarEstoqueItemOr(items[Number(cell.dataset.stock)].codigo));
 $('or-items').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{items.splice(Number(b.dataset.remove),1);drawItems()});
 totals();
}
function totals(origin=''){
 const bruto=items.reduce((n,x)=>n+Number(x.quantidade)*Number(x.preco),0);
 const num=id=>Math.max(0,Number($(id).value)||0);
 if(origin==='or-discount-pct')orDiscountMode='percentual';
 if(origin==='or-discount')orDiscountMode='reais';
 if(origin==='or-extra-pct')orExtraMode='percentual';
 if(origin==='or-extra')orExtraMode='reais';
 let discount,extra;
 if(orDiscountMode==='percentual'){
  discount=Math.round(bruto*num('or-discount-pct'))/100;
  $('or-discount').value=discount.toFixed(2);
 }else{
  discount=num('or-discount');
  $('or-discount-pct').value=bruto?(discount/bruto*100).toFixed(2):'0.00';
 }
 if(orExtraMode==='percentual'){
  extra=Math.round(bruto*num('or-extra-pct'))/100;
  $('or-extra').value=extra.toFixed(2);
 }else{
  extra=num('or-extra');
  $('or-extra-pct').value=bruto?(extra/bruto*100).toFixed(2):'0.00';
 }
 const total=Math.max(0,bruto-discount+extra);
 $('or-summary').innerHTML=`<div>BRUTO <b>${money(bruto)}</b></div><div>DESCONTO <b>${money(discount)}</b></div><div>ACRÉSCIMO <b>${money(extra)}</b></div><div class="or-total">TOTAL DO ORÇAMENTO <strong>${money(total)}</strong></div>`;
 return {bruto,discount,extra,total};
}
function data(){const client=$('or-client'),seller=$('or-seller');return {numero:Number($('or-number').value),data:$('or-date').value,validade:$('or-valid').value,clienteId:client.value,cliente:client.selectedOptions[0]?.textContent||'',vendedorId:seller.value,vendedor:seller.selectedOptions[0]?.textContent||'',itens:items.map(x=>({...x})),...totals(),descontoPercentual:Number($('or-discount-pct').value)||0,acrescimoPercentual:Number($('or-extra-pct').value)||0,modoDesconto:orDiscountMode,modoAcrescimo:orExtraMode,observacoes:$('or-notes').value.trim(),usuario:usuarioAtualOr()}}
function persist(edit){if(edit&&!selected)return msg('LOCALIZE UM ORÇAMENTO PARA ALTERAR.');if(!edit&&selected)return msg('ORÇAMENTO JÁ SALVO. USE ALTERAR (F4).');if(!items.length)return msg('ADICIONE PELO MENOS UM PRODUTO.');const d=data();if(!d.data)return msg('INFORME A DATA.');if(d.discount>d.bruto+d.extra)return msg('DESCONTO NÃO PODE ULTRAPASSAR O VALOR DO ORÇAMENTO.');const updated=docs.slice();if(edit){const i=updated.findIndex(x=>x.numero===selected);if(i<0)return msg('ORÇAMENTO NÃO ENCONTRADO.');d.historicoUsuario=updated[i].historicoUsuario||[];registrarUsuarioOr(d,'ALTERAR');updated[i]=d}else{d.numero=next();registrarUsuarioOr(d,'GRAVAR');updated.push(d)}try{localStorage.setItem(KEY,JSON.stringify(updated));docs=updated;selected=d.numero;$('or-number').value=String(selected).padStart(6,'0');mostrarUsuarioOr();list();msg(edit?'ORÇAMENTO ALTERADO.':'ORÇAMENTO GRAVADO.')}catch{msg('NÃO FOI POSSÍVEL SALVAR O ORÇAMENTO.')}}
function load(n){const d=docs.find(x=>x.numero===n);if(!d)return;selected=d.numero;mostrarUsuarioOr();$('or-number').value=String(d.numero).padStart(6,'0');$('or-date').value=d.data||'';$('or-valid').value=d.validade||'';$('or-client').value=d.clienteId||'';$('or-seller').value=d.vendedorId||'';syncPerson('client');syncPerson('seller');orDiscountMode=d.modoDesconto||'reais';orExtraMode=d.modoAcrescimo||'reais';$('or-discount').value=d.discount||0;$('or-extra').value=d.extra||0;$('or-discount-pct').value=d.descontoPercentual||0;$('or-extra-pct').value=d.acrescimoPercentual||0;$('or-notes').value=d.observacoes||'';items=(d.itens||[]).map(x=>({...x}));drawItems();window.scrollTo({top:0,behavior:'smooth'})}
function list(){const body=$('or-list');if(!searched){body.innerHTML='<tr><td colspan="5">CLIQUE EM PESQUISAR PARA CONSULTAR OS ORÇAMENTOS.</td></tr>';return}const from=$('or-from').value,to=$('or-to').value;body.innerHTML=docs.filter(x=>(!from||x.data>=from)&&(!to||x.data<=to)&&(!consultClientId||String(x.clienteId)===String(consultClientId))).sort((a,b)=>b.numero-a.numero).map(d=>`<tr data-id="${d.numero}" title="Duplo clique para abrir"><td>${String(d.numero).padStart(6,'0')}</td><td>${esc(d.data)}</td><td>${esc(d.cliente)}</td><td>${esc(nomeVendedorOr(d))}</td><td>${money(d.total)}</td></tr>`).join('')||'<tr><td colspan="5">NENHUM ORÇAMENTO ENCONTRADO</td></tr>';body.querySelectorAll('[data-id]').forEach(tr=>tr.ondblclick=()=>load(Number(tr.dataset.id)))}
async function findDoc(){const n=await erpPrompt('INFORME O NÚMERO DO ORÇAMENTO:');if(n===null)return;const id=Number(n);if(!docs.some(d=>d.numero===id))return msg('ORÇAMENTO NÃO ENCONTRADO.');load(id)}
function printDoc(){
 const d=selected?docs.find(x=>x.numero===selected):null;
 if(!d)return msg('GRAVE O ORÇAMENTO ANTES DE IMPRIMIR.');
 if(!Array.isArray(d.itens)||!d.itens.length)return msg('ORÇAMENTO SEM PRODUTOS.');
 document.querySelectorAll('.or-print-overlay').forEach(x=>x.remove());
 const numero=String(d.numero).padStart(6,'0');
 const dataBr=v=>/^\d{4}-\d{2}-\d{2}/.test(String(v||''))?String(v).slice(8,10)+'/'+String(v).slice(5,7)+'/'+String(v).slice(0,4):String(v||'—');
 const agora=new Date();
 const emitido=agora.toLocaleDateString('pt-BR');
 const usuario=usuarioAtualOr();
 const cliente=clients().find(c=>String(c.codigo??c.id)===String(d.clienteId))||{};
 const nomeCliente=cliente.nome||d.cliente||'NÃO INFORMADO';
 const vendedor=nomeVendedorOr(d)||'NÃO INFORMADO';
 const lojas=read('erp_matriz_lojas_v1',{});
 const lj=Array.isArray(lojas)?lojas[0]||{}:(lojas.lojas||[])[0]||{};
 const oficiais=read('erp_systems_dados_loja_v1',{});
 const loja=[oficiais.nome,oficiais.nomeFantasia,lj.nomeFantasia,lj.razaoSocial,lj.nome,document.querySelector('.topbar .store-company')?.textContent].find(v=>typeof v==='string'&&v.trim())||'LUCAS LIMA';
 const linha=(k,v)=>`<div class="linha"><b>${esc(k)}:</b> ${esc(v??'—')}</div>`;
 const itens=d.itens.map(x=>`<div class="item"><div>${esc(x.codigo||'')} — ${esc(x.descricao||'')}</div><div class="valores">${esc(x.quantidade)} × ${money(x.preco)} <b>${money(Number(x.quantidade)*Number(x.preco))}</b></div></div>`).join('');
 const corpo=`<div class="loja">${esc(loja)}</div><div class="titulo">ORÇAMENTO Nº ${numero}</div><section>${linha('DATA',dataBr(d.data))}${linha('VALIDADE',dataBr(d.validade))}${linha('CLIENTE',nomeCliente)}${linha('VENDEDOR',vendedor)}</section><section><h2>PRODUTOS</h2>${itens}</section><section>${linha('BRUTO',money(d.bruto))}${linha('DESCONTO',money(d.discount))}${linha('ACRÉSCIMO',money(d.extra))}<div class="destaque">TOTAL DO ORÇAMENTO: ${money(d.total)}</div></section>${d.observacoes?`<section>${linha('OBSERVAÇÕES',d.observacoes)}</section>`:''}<section class="aviso">ORÇAMENTO SEM VALOR FISCAL</section><footer>EMITIDO EM ${esc(emitido)}, POR ${esc(usuario)}.</footer>`;
 const css=largura=>`@page{size:${largura}mm auto;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111}body{width:${largura}mm;max-width:${largura}mm;padding:1.5mm 1.5mm 3mm;font:${largura===40?8:largura===56?9:10}px/1.3 Arial,sans-serif;overflow-wrap:anywhere}.loja,.titulo{text-align:center;font-weight:700}.loja{font-size:10px}.titulo{font-size:9px;margin:5px 0}section{border-top:1px dashed #444;padding:5px 0;break-inside:avoid}h2{font-size:9px;margin:0 0 4px}.linha{margin:3px 0}.item{margin:5px 0}.valores{display:flex;justify-content:space-between;gap:3px;margin-top:2px}.destaque{font-weight:bold;border-top:1px solid #333;padding-top:5px;margin-top:5px}.aviso{text-align:center;font-weight:bold}footer{border-top:1px dashed #444;text-align:center;font-size:7px;padding-top:6px}`;
 const documento=largura=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="receipt-width-mm" content="${largura}"><title>ORÇAMENTO ${numero}</title><style>${css(largura)}</style></head><body>${corpo}</body></html>`;
 let largura=80;
 const overlay=document.createElement('div');overlay.className='or-print-overlay';
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#001b3cbb;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif';
 overlay.innerHTML=`<div role="dialog" aria-modal="true" aria-label="IMPRIMIR ORÇAMENTO" style="width:min(1100px,96vw);height:min(720px,92vh);background:#fff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 12px 40px #0004"><header style="background:#194b88;color:white;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;font-weight:bold">IMPRIMIR ORÇAMENTO <button data-fechar style="border:0;background:transparent;color:white;font-size:24px;cursor:pointer">×</button></header><div style="display:grid;grid-template-columns:minmax(200px,1fr) minmax(260px,1.25fr);gap:16px;padding:16px;flex:1;min-height:0;overflow:auto"><div style="border:1px solid #cbd9ec;border-radius:6px;padding:14px"><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">DADOS DO ORÇAMENTO</div><p><b>ORÇAMENTO Nº:</b> ${numero}</p><p><b>CLIENTE:</b> ${esc(nomeCliente)}</p><p><b>VENDEDOR:</b> ${esc(vendedor)}</p><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">FORMATO DA IMPRESSÃO</div><p style="font-size:13px;color:#52677f">SELECIONE A LARGURA DA BOBINA:</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[40,56,80].map(mm=>`<label style="padding:9px 12px;border:1px solid #b5cbe6;border-radius:5px;cursor:pointer;font-weight:bold"><input type="radio" name="largura-orcamento" value="${mm}" ${mm===80?'checked':''}> ${mm} MM</label>`).join('')}</div><p style="font-size:13px;color:#52677f">Comprimento automático conforme o conteúdo.</p></div><div style="border:1px solid #cbd9ec;border-radius:6px;padding:14px;display:flex;flex-direction:column;min-height:350px"><div style="background:#e5effb;padding:12px;color:#194b88;font-weight:bold;font-size:13px">PRÉ-VISUALIZAÇÃO — BOBINA <span data-largura-label>80</span> MM</div><div style="flex:1;overflow:auto;background:#f1f4f8;display:flex;justify-content:center;align-items:flex-start;padding:16px"><iframe title="Pré-visualização do orçamento" style="width:80mm;min-width:80mm;height:100%;min-height:350px;background:#fff;border:1px solid #ccd5df;box-shadow:0 2px 8px #0002" sandbox="allow-same-origin allow-modals"></iframe></div></div></div><div style="border-top:1px solid #dce4ef;padding:12px 18px;display:flex;justify-content:flex-end;gap:10px"><button data-imprimir style="background:#1961cb;color:#fff;border:0;border-radius:5px;padding:12px 23px;cursor:pointer;font-weight:bold">IMPRIMIR</button><button data-salvar style="background:#009d79;color:#fff;border:0;border-radius:5px;padding:12px 23px;cursor:pointer;font-weight:bold">SALVAR</button><button data-fechar style="background:#e5effb;color:#174576;border:1px solid #b5cbe6;border-radius:5px;padding:12px 23px;cursor:pointer">FECHAR</button></div></div>`;
 document.body.appendChild(overlay);
 const iframe=overlay.querySelector('iframe');
 const atualizar=()=>{iframe.style.width=largura+'mm';iframe.style.minWidth=largura+'mm';iframe.srcdoc=documento(largura);overlay.querySelector('[data-largura-label]').textContent=largura};
 overlay.querySelectorAll('input[name="largura-orcamento"]').forEach(r=>r.onchange=()=>{largura=Number(r.value);atualizar()});
 atualizar();
 const fechar=()=>overlay.remove();overlay.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=fechar);
 overlay.querySelector('[data-imprimir]').onclick=()=>{try{iframe.contentWindow.focus();iframe.contentWindow.print()}catch(e){msg('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO: '+(e.message||e))}};
 overlay.querySelector('[data-salvar]').onclick=async()=>{try{
  if(typeof window.LucasTrocaSalvarPDF!=='function')throw Error('RECURSO DE SALVAR PDF INDISPONÍVEL.');
  await window.LucasTrocaSalvarPDF(documento(largura),`ORCAMENTO_${numero}_${largura}MM.pdf`);
 }catch(e){msg('NÃO FOI POSSÍVEL SALVAR O PDF: '+(e.message||e))}};
}

const previousOpen=open;open=function(name){if(name==='ORÇAMENTOS'){layout();return}return previousOpen(name)};
document.addEventListener('keydown',ev=>{if(screen!=='ORÇAMENTOS'||ev.altKey||ev.ctrlKey||ev.metaKey||!/^F(1|12)$/.test(ev.key))return;ev.preventDefault();ev.stopImmediatePropagation();if(document.querySelector('.or-shortcuts-back'))return;({F1:atalhosOrcamentos,F12:findDoc})[ev.key]()},true);
})();
