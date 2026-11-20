(()=>{'use strict';
const K='erp_systems_saidas_almox_v1',D='erp_systems_destinos_almox_v1',P='erp_matriz_produtos_teste_v1';
const get=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return []}},put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),num=v=>Number(v)||0,fmt=v=>num(v).toLocaleString('pt-BR',{maximumFractionDigits:3});
const money=v=>num(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const costOf=x=>{if(x&&x.custoUnitario!==undefined&&x.custoUnitario!==null)return num(x.custoUnitario);return num(product(x?.codigo)?.custo)};
const today=()=>new Date().toLocaleDateString('en-CA'),next=a=>Math.max(0,...a.map(x=>num(x.id)))+1;
const user=()=>window.LucasLimaAuditoria?.usuarioAtual?.()||document.querySelector('.top-user strong')?.textContent?.trim()||'DEMONSTRAÇÃO';
const alert=m=>aviso('SAÍDAS DE ESTOQUE',m);
const confirm=async m=>typeof erpConfirm==='function'?erpConfirm(m):window.confirm(m);
let id=null,items=[],selected=null,chosenType='MATÉRIA-PRIMA';
let saidasPesquisa={from:'',to:'',type:'',status:'',executada:false};
const typeOf=p=>String(p?.tipo||'').trim().toUpperCase();
const typeMatches=p=>typeOf(p)===chosenType;
const doc=()=>get(K).find(x=>x.id===id),product=c=>get(P).find(x=>String(x.codigo)===String(c));
function permissions(action){const keys=['erp_systems_permissoes_v1','erp_matriz_usuarios_v1'];let users=keys.flatMap(get).filter?.(x=>x&&typeof x==='object')||[];let u=users.find(x=>String(x.nome||'').toUpperCase()===user().toUpperCase());if(!u)return true;const perms=u.permissoes;if(!perms)return true;const key=action==='baixar'?'SAIDA_ALMOX_BAIXAR':'SAIDA_ALMOX_REABRIR';if(Object.prototype.hasOwnProperty.call(perms,key))return !!perms[key];return true}
function shell(title,body){screen=title;active('ESTOQUE');root().innerHTML=`<div class="alm"><header class="alm-head"><h1>${title}</h1><small>ESTOQUE › ${title}</small></header>${body}</div>`}
function stock(c,q){let ps=get(P),p=ps.find(x=>String(x.codigo)===String(c));if(!p)throw Error('PRODUTO NÃO ENCONTRADO: '+c);p.provisao=+(num(p.provisao)+q).toFixed(3);put(P,ps);products=ps}
function showSaidasShortcuts(){
 if(document.getElementById('se-shortcuts-overlay'))return;
 const overlay=document.createElement('div');overlay.id='se-shortcuts-overlay';
 overlay.setAttribute('role','presentation');
 overlay.innerHTML=`<section class="se-shortcuts-dialog" role="dialog" aria-modal="true" aria-labelledby="se-shortcuts-heading"><header class="se-shortcuts-header"><strong id="se-shortcuts-heading">⌂ ATALHOS — ▣ SAÍDAS DE ESTOQUE</strong><button type="button" class="se-shortcuts-x" aria-label="Fechar">×</button></header><div class="se-shortcuts-body"><div><kbd>F1</kbd><span>Abrir esta janela de atalhos</span></div><div><kbd>F12</kbd><span>Localizar saída pelo número</span></div><div><kbd>F2</kbd><span>Baixar saída</span></div><div><kbd>F3</kbd><span>Cancelar saída</span></div></div><footer class="se-shortcuts-footer"><button type="button" class="se-shortcuts-close">FECHAR</button></footer></section>`;
 document.body.appendChild(overlay);
 const close=()=>{document.removeEventListener('keydown',onKey,true);overlay.remove()};
 const onKey=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();close()}else if(['F1','F2','F3','F12'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation()}};
 document.addEventListener('keydown',onKey,true);
 overlay.querySelector('.se-shortcuts-x').onclick=close;
 overlay.querySelector('.se-shortcuts-close').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 overlay.querySelector('.se-shortcuts-close').focus();
}
function render(){const d=doc(),locked=!!d&&d.situacao!=='PENDENTE';shell('SAÍDAS DE ESTOQUE',`<div class="se-title">▣ SAÍDAS DE ESTOQUE <button id="se-shortcuts">⌂ ATALHOS</button></div><section class="alm-card"><h2>DADOS DA SAÍDA</h2><div class="alm-fields"><label>Nº DA SAÍDA<input readonly value="${d?.id||next(get(K))}"></label><label>DATA<input type="date" id="al-date" value="${d?.data||today()}" ${locked?'disabled':''}></label><label>SITUAÇÃO<input readonly value="${d?.situacao||'PENDENTE'}"></label><label>USUÁRIO<input id="al-user" readonly title="CLIQUE PARA VER O HISTÓRICO" style="cursor:pointer" value="${esc(d?.usuario||user())}"></label></div><div class="se-type-row"><label>TIPO DE SAÍDA *<select id="al-type" ${locked?'disabled':''}><option value="MATÉRIA-PRIMA" ${((d?.tipoSaida||chosenType)==='MATÉRIA-PRIMA')?'selected':''}>MATÉRIAS-PRIMAS</option><option value="PRODUTO DE ALMOXARIFADO" ${((d?.tipoSaida||chosenType)==='PRODUTO DE ALMOXARIFADO')?'selected':''}>ALMOXARIFADO</option></select></label></div><label class="se-observation">OBSERVAÇÕES<textarea id="al-obs" rows="2" ${locked?'disabled':''}>${esc(d?.observacoes||'')}</textarea></label></section><div class="alm-columns"><section class="alm-card"><h2>ITENS DA SAÍDA</h2><div class="se-entry"><label>CÓDIGO DO PRODUTO<input id="al-code" placeholder="CÓDIGO" ${locked?'disabled':''}></label><label>DESCRIÇÃO DO PRODUTO<input id="al-desc" placeholder="DIGITE O CÓDIGO OU PESQUISE" readonly></label><button id="al-pick" class="se-plus" title="Pesquisar produto" ${locked?'disabled':''}>+</button><label>QUANTIDADE<input type="number" id="al-qty" min="0.001" step="0.001" ${locked?'disabled':''}></label><button id="al-add" class="se-add" ${locked?'disabled':''}>+ ADICIONAR</button></div><div class="alm-scroll"><table><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>UN.</th><th>QUANTIDADE</th><th>CUSTO UNIT.</th><th>CUSTO TOTAL</th><th>AÇÃO</th></tr></thead><tbody id="al-items"></tbody></table></div><strong id="al-total"></strong></section><aside class="alm-card alm-stock"><h2>ESTOQUE DO PRODUTO SELECIONADO</h2><h3 id="al-stock-name">SELECIONE UM PRODUTO</h3><div class="se-stock-grid"><div>PROVISÃO<strong id="al-prov">—</strong></div><div>VENDA<strong id="al-venda">—</strong></div><div>DISPONÍVEL<strong id="al-disponivel">—</strong></div></div></aside></div><section class="alm-card se-actions"><div class="alm-buttons">${[['novo','NOVO'],['gravar','GRAVAR'],['alterar','ALTERAR'],['baixar','BAIXAR'],['cancelar','CANCELAR'],['imprimir','IMPRIMIR'],['voltar','VOLTAR']].map(([k,v])=>`<button data-act="${k}">${v}</button>`).join('')}</div></section><section class="alm-card" id="al-search-section"><h2>PESQUISA DE SAÍDAS</h2><div class="se-search-fields"><label>DATA INICIAL<input id="al-f-from" type="date"></label><label>DATA FINAL<input id="al-f-to" type="date"></label><label>TIPO DE SAÍDA<select id="al-f-type"><option value="">TODOS</option><option value="MATÉRIA-PRIMA">MATÉRIAS-PRIMAS</option><option value="PRODUTO DE ALMOXARIFADO">ALMOXARIFADO</option></select></label><label>SITUAÇÃO<select id="al-f-status"><option value="">TODAS</option><option>PENDENTE</option><option>BAIXADA</option><option>CANCELADA</option></select></label><button type="button" id="al-search-btn">PESQUISAR</button></div><div class="alm-scroll"><table><thead><tr><th>Nº</th><th>DATA</th><th>TIPO</th><th>OBSERVAÇÕES</th><th>ITENS</th><th>SITUAÇÃO</th></tr></thead><tbody id="al-results"></tbody></table></div></section>`);
$('al-user').onclick=()=>history();$('al-type').onchange=()=>{const v=$('al-type').value;if(items.length){$('al-type').value=chosenType;return alert('REMOVA OS ITENS ANTES DE ALTERAR O TIPO DE SAÍDA.')}chosenType=v;$('al-code').value='';$('al-desc').value='';panel('')};$('se-shortcuts').onclick=showSaidasShortcuts;$('al-code').oninput=sync;$('al-pick').onclick=pick;$('al-add').onclick=add;$('al-code').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();sync();$('al-qty').focus()}};document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>action(b.dataset.act));$('al-search-btn').onclick=()=>{saidasPesquisa={...filters(),executada:true};list()};draw();$('al-f-from').value=saidasPesquisa.from;$('al-f-to').value=saidasPesquisa.to;$('al-f-type').value=saidasPesquisa.type;$('al-f-status').value=saidasPesquisa.status;if(saidasPesquisa.executada)list();else $('al-results').innerHTML='<tr><td colspan="6" style="text-align:center;padding:16px">SELECIONE OS FILTROS E CLIQUE EM PESQUISAR.</td></tr>'}

function history(){
 const d=doc();
 if(!d){if(window.LucasLimaAuditoria?.abrirHistorico)window.LucasLimaAuditoria.abrirHistorico({usuario:user(),historicoOperacoes:[]});else alert('AINDA NÃO HÁ HISTÓRICO REGISTRADO.');return}
 const events=Array.isArray(d.historico)?d.historico:[];
 const audit=Array.isArray(d.historicoOperacoes)?d.historicoOperacoes:[];
 const all=[...events,...audit].filter(e=>e&&e.data).sort((a,b)=>String(a.data).localeCompare(String(b.data)));
 const record={...d,historicoOperacoes:all.map(e=>({...e,acao:String(e.acao||'ALTERAÇÃO').toUpperCase()}))};
 if(window.LucasLimaAuditoria?.abrirHistorico)window.LucasLimaAuditoria.abrirHistorico(record);
 else alert(all.map(e=>`${e.acao}: ${e.usuario} — ${new Date(e.data).toLocaleString('pt-BR')}`).join(' | ')||'SEM HISTÓRICO REGISTRADO.');
}
function sync(){const candidate=product($('al-code').value),p=candidate&&typeMatches(candidate)?candidate:null;$('al-desc').value=p?.descricao||'';if(p)panel(p.codigo);return p}
function panel(c){let p=product(c);$('al-stock-name').textContent=p?.descricao||'SELECIONE UM PRODUTO';$('al-prov').textContent=p?fmt(p.provisao):'—';$('al-venda').textContent=p?fmt(p.venda):'—';$('al-disponivel').textContent=p?fmt(num(p.provisao)-num(p.venda)):'—'}
function add(){if(doc()?.situacao!=='PENDENTE'&&doc())return alert('SOMENTE SAÍDAS PENDENTES PODEM SER ALTERADAS.');let p=sync(),q=Number($('al-qty').value);if(!p||!Number.isFinite(q)||q<=0)return alert('SELECIONE UM PRODUTO DO TIPO ESCOLHIDO E INFORME UMA QUANTIDADE VÁLIDA.');let old=items.find(x=>String(x.codigo)===String(p.codigo));if(old){old.quantidade+=q;if(old.custoUnitario===undefined)old.custoUnitario=num(p.custo)}else items.push({codigo:p.codigo,descricao:p.descricao,unidade:p.unidade||'UN',quantidade:q,custoUnitario:num(p.custo)});$('al-code').value='';$('al-qty').value='';$('al-desc').value='';selected=p.codigo;draw()}
function draw(){
 const locked=doc()?.situacao!=='PENDENTE'&&!!doc();
 $('al-items').innerHTML=items.map((x,i)=>`<tr data-item-row="${i}" tabindex="0" aria-label="CONSULTAR ESTOQUE DE ${esc(x.descricao)}" style="cursor:pointer;${String(selected)===String(x.codigo)?'background:#d9eaff;outline:2px solid #3b82d6;outline-offset:-2px;':''}"><td>${esc(x.codigo)}</td><td>${esc(x.descricao)}</td><td>${esc(x.unidade)}</td><td>${fmt(x.quantidade)}</td><td>${money(costOf(x))}</td><td>${money(num(x.quantidade)*costOf(x))}</td><td>${locked?'':`<button class="en-mini" data-remove="${i}">EXCLUIR</button>`}</td></tr>`).join('')||'<tr><td colspan="7">NENHUM PRODUTO ADICIONADO</td></tr>';
 $('al-total').textContent=`TOTAL: ${items.length} PRODUTO(S) — ${fmt(items.reduce((a,x)=>a+num(x.quantidade),0))} UNIDADES — CUSTO TOTAL: ${money(items.reduce((a,x)=>a+num(x.quantidade)*costOf(x),0))}`;
 const choose=i=>{selected=items[i].codigo;panel(selected);draw()};
 $('al-items').querySelectorAll('[data-item-row]').forEach(row=>{row.onclick=()=>choose(+row.dataset.itemRow);row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(+row.dataset.itemRow)}}});
 $('al-items').querySelectorAll('[data-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();const removed=items.splice(+b.dataset.remove,1)[0];if(String(selected)===String(removed.codigo)){selected=null;panel('')}draw()});
 if(selected&&items.some(x=>String(x.codigo)===String(selected)))panel(selected);
}

function pick(){window.LL_selecionarProdutoEstoque({produtos:()=>get(P).filter(p=>typeMatches(p)),selecionar:p=>{$('al-code').value=p.codigo;sync();$('al-qty').focus()},novo:()=>open('PRODUTOS')})}
function filters(){return {from:$('al-f-from').value,to:$('al-f-to').value,type:$('al-f-type').value,status:$('al-f-status').value}}
function filtered(){let f=filters();return get(K).filter(x=>(!f.type||x.tipoSaida===f.type)&&(!f.from||x.data>=f.from)&&(!f.to||x.data<=f.to)&&(!f.status||x.situacao===f.status)).sort((a,b)=>b.id-a.id)}
function list(){const results=$('al-results');results.innerHTML=filtered().map(x=>`<tr data-search-row="${x.id}" tabindex="0" title="CLIQUE DUAS VEZES PARA ABRIR" style="cursor:pointer"><td>${x.id}</td><td>${esc(x.data.split('-').reverse().join('/'))}</td><td>${esc(x.tipoSaida==='PRODUTO DE ALMOXARIFADO'?'ALMOXARIFADO':x.tipoSaida==='MATÉRIA-PRIMA'?'MATÉRIAS-PRIMAS':'ANTERIOR')}</td><td>${esc(x.observacoes||'—')}</td><td>${x.itens.length}</td><td>${x.situacao}</td></tr>`).join('')||'<tr><td colspan="6">NENHUMA SAÍDA ENCONTRADA</td></tr>';results.querySelectorAll('[data-search-row]').forEach(r=>{r.onclick=()=>{results.querySelectorAll('[data-search-row]').forEach(row=>row.classList.remove('se-selected-result'));r.classList.add('se-selected-result')};r.ondblclick=()=>load(+r.dataset.searchRow);r.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();load(+r.dataset.searchRow)}}})}
function load(n){id=n;selected=null;items=doc()?.itens.map(x=>({...x}))||[];chosenType=doc()?.tipoSaida||typeOf(product(items[0]?.codigo))||'MATÉRIA-PRIMA';render()}
function gravar(){let d=doc();if(d&&d.situacao!=='PENDENTE')return alert('DOCUMENTO NÃO ESTÁ PENDENTE.');if(!items.length)return alert('ADICIONE PELO MENOS UM PRODUTO.');if(items.some(x=>!typeMatches(product(x.codigo))))return alert('EXISTEM ITENS QUE NÃO CORRESPONDEM AO TIPO DE SAÍDA.');let ds=get(K),record={id:d?.id||next(ds),data:$('al-date').value,tipoSaida:chosenType,destinoId:d?.destinoId||null,destino:d?.destino||'',observacoes:$('al-obs').value,itens:items.map(x=>({...x,custoUnitario:costOf(x)})),situacao:'PENDENTE',usuario:user(),historico:[...(d?.historico||[]),{acao:d?'ALTERAR':'GRAVAR',usuario:user(),data:new Date().toISOString()}]};if(!record.data)return alert('INFORME A DATA.');if(d)Object.assign(ds.find(x=>x.id===d.id),record);else ds.push(record);put(K,ds);id=record.id;render();alert('SAÍDA GRAVADA COMO PENDENTE.')}
async function autenticarSaida(operacao,documento){
 return new Promise(resolve=>{
  document.getElementById('se-auth-overlay')?.remove();
  const overlay=document.createElement('div');overlay.id='se-auth-overlay';overlay.className='ae-modal-overlay';
  overlay.innerHTML=`<div class="ae-modal ae-auth-caixa-modelo" role="dialog" aria-modal="true" aria-labelledby="se-auth-title"><header><strong id="se-auth-title">IDENTIFICAÇÃO PARA ${operacao==='baixar'?'BAIXAR':'CANCELAR'} SAÍDA DE ESTOQUE</strong><button type="button" data-fechar aria-label="Fechar">×</button></header><div class="ae-modal-body"><label for="se-auth-code">USUÁRIO (CÓDIGO)</label><input id="se-auth-code" type="text" inputmode="numeric" autocomplete="off" placeholder="INFORME O CÓDIGO DO OPERADOR"><div class="ae-auth-person"><strong id="se-auth-name">INFORME O CÓDIGO DO USUÁRIO</strong><small id="se-auth-role">O NOME APARECERÁ AUTOMATICAMENTE</small></div><label for="se-auth-pass">SENHA</label><input id="se-auth-pass" type="password" autocomplete="off" placeholder="DIGITE SUA SENHA"><p id="se-auth-error" role="alert" aria-live="polite"></p><p class="ae-auth-note">VALIDAÇÃO LOCAL DOS USUÁRIOS CADASTRADOS. NÃO SUBSTITUI AUTENTICAÇÃO SEGURA EM SERVIDOR.</p></div><footer><button type="button" id="se-auth-ok">CONTINUAR</button><button type="button" data-fechar>CANCELAR</button></footer></div>`;
  document.body.appendChild(overlay);
  const code=overlay.querySelector('#se-auth-code'),pass=overlay.querySelector('#se-auth-pass'),err=overlay.querySelector('#se-auth-error'),name=overlay.querySelector('#se-auth-name'),role=overlay.querySelector('#se-auth-role');
  const list=()=>{try{const d=JSON.parse(localStorage.getItem('erp_matriz_usuarios_v1')||'[]');return Array.isArray(d)?d:(d.usuarios||d.items||[])}catch{return []}};
  const selected=()=>{const v=code.value.trim();if(!v)return null;return list().find(u=>String(u.id??u.codigo)===v&&String(u.situacao||'ATIVO').toUpperCase()==='ATIVO')||null};
  const close=result=>{overlay.remove();document.removeEventListener('keydown',onKey,true);resolve(result)};
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(null)}};
  document.addEventListener('keydown',onKey,true);
  overlay.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=()=>close(null));overlay.onclick=e=>{if(e.target===overlay)close(null)};
  code.oninput=()=>{const u=selected();name.textContent=u?(u.nome||u.login||'USUÁRIO'):(code.value.trim()?'USUÁRIO NÃO ENCONTRADO':'INFORME O CÓDIGO DO USUÁRIO');role.textContent=u?(u.perfil||'USUÁRIO'):'O NOME APARECERÁ AUTOMATICAMENTE';err.textContent='';pass.value=''};
  code.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();pass.focus()}};
  const validate=async()=>{
   const u=selected();if(!u){err.textContent='USUÁRIO NÃO ENCONTRADO OU INATIVO.';return}
   if(!pass.value){err.textContent='INFORME A SENHA.';pass.focus();return}
   if(!u.senhaHash||!u.senhaSalt||typeof window.LL_SHA256!=='function'){err.textContent='NÃO FOI POSSÍVEL VALIDAR A SENHA DESTE USUÁRIO.';return}
   let valid=false;try{valid=await window.LL_SHA256(u.senhaSalt+':'+pass.value)===u.senhaHash}catch{}
   if(!valid){err.textContent='SENHA INCORRETA.';pass.value='';pass.focus();return}
   if(operacao==='cancelar'&&documento?.situacao==='BAIXADA'){
    const responsavel=String(documento.baixadoPor||'').trim().toUpperCase();
    if(!responsavel||![u.nome,u.login,String(u.id),String(u.codigo)].some(v=>String(v||'').trim().toUpperCase()===responsavel)){
     err.textContent='SOMENTE O USUÁRIO QUE REALIZOU A BAIXA PODE CANCELAR ESTA SAÍDA.';return;
    }
   }
   close({nome:u.nome||u.login||String(u.id),id:u.id});
  };
  overlay.querySelector('#se-auth-ok').onclick=validate;pass.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();validate()}};code.focus();
 });
}
async function transition(act){
 const ds=get(K),d=ds.find(x=>x.id===id);
 if(!d)return alert('GRAVE A SAÍDA PRIMEIRO.');
 if(d.situacao==='CANCELADA')return alert('ESTA SAÍDA JÁ ESTÁ CANCELADA.');
 
 if(act==='baixar'&&d.situacao!=='PENDENTE')return alert('SOMENTE SAÍDAS PENDENTES PODEM SER BAIXADAS.');
 if(act==='cancelar'&&!['PENDENTE','BAIXADA'].includes(d.situacao))return alert('OPERAÇÃO NÃO PERMITIDA NESTA SITUAÇÃO.');
 if(act==='baixar'&&!permissions(act))return aviso('ACESSO NEGADO','USUÁRIO SEM ACESSO');
 const autorizado=(act==='baixar'||(act==='cancelar'&&d.situacao==='BAIXADA'))?await autenticarSaida(act,d):null;
 if((act==='baixar'||(act==='cancelar'&&d.situacao==='BAIXADA'))&&!autorizado)return;
 if(!await confirm(`CONFIRMA ${act.toUpperCase()} A SAÍDA Nº ${d.id}?`))return;
 try{
  const agora=new Date().toISOString(),baixada=d.situacao==='BAIXADA';
  if(act==='baixar'){
   const missing=d.itens.filter(x=>!product(x.codigo));
   if(missing.length)throw Error('PRODUTO NÃO ENCONTRADO: '+missing.map(x=>x.codigo).join(', '));
   const insufficient=d.itens.filter(x=>num(product(x.codigo)?.provisao)<num(x.quantidade));
   if(insufficient.length&&!await confirm('ESTOQUE INSUFICIENTE: '+insufficient.map(x=>x.descricao).join(', ')+'. O ESTOQUE PODERÁ FICAR NEGATIVO. DESEJA CONTINUAR?'))return;
  }
  if(act==='cancelar'&&baixada&&d.itens.some(x=>!product(x.codigo)))throw Error('PRODUTO NÃO ENCONTRADO PARA ESTORNO.');
  // Somente a baixa e o cancelamento de uma baixa movimentam o saldo físico.
  if(act==='baixar'||(act==='cancelar'&&baixada)){
   const ps=get(P);
   for(const it of d.itens){const p=ps.find(x=>String(x.codigo)===String(it.codigo));p.provisao=+(num(p.provisao)+(act==='baixar'?-1:1)*num(it.quantidade)).toFixed(3)}
   put(P,ps);products=ps;
  }
  d.historico=Array.isArray(d.historico)?d.historico:[];
  d.historico.push({acao:act.toUpperCase(),usuario:autorizado?.nome||user(),data:agora});
  if(act==='baixar'){d.situacao='BAIXADA';d.baixadaEm=agora;d.baixadoPor=autorizado.nome}
  else{d.situacao='CANCELADA';d.canceladaEm=agora;d.canceladoPor=autorizado?.nome||user();d.cancelamentoDeBaixa=baixada;d.situacaoAntesCancelamento=baixada?'BAIXADA':'PENDENTE'}
  d.usuario=user();put(K,ds);if(typeof window.LL_estoqueCentralConciliar==='function')window.LL_estoqueCentralConciliar();render();alert(act==='baixar'?'SAÍDA BAIXADA. MOVIMENTAÇÃO REGISTRADA NA FICHA DE ESTOQUE.':'SAÍDA CANCELADA.');
 }catch(e){alert(e.message)}
}

function printDoc(listMode=false){
 let orientation="portrait";
 const records=listMode?filtered():(doc()?[doc()]:[]);
 if(!records.length)return alert('NENHUM DOCUMENTO PARA IMPRIMIR.');
 let loja={};try{loja=JSON.parse(localStorage.getItem('lucas_loja_cadastro')||'{}')||{}}catch(e){}
 const company=loja.nome||loja.razao||'LOJA 01 - MATRIZ';
 const companyDetails=[loja.cnpj?'CNPJ: '+loja.cnpj:'',[loja.rua,loja.numero,loja.bairro,loja.cidade,loja.uf].filter(Boolean).join(', '),loja.telefone||''].filter(Boolean);
 const date=v=>String(v||'').split('-').reverse().join('/');
 const type=d=>d.tipoSaida==='PRODUTO DE ALMOXARIFADO'?'ALMOXARIFADO':d.tipoSaida==='MATÉRIA-PRIMA'?'MATÉRIAS-PRIMAS':d.tipoSaida||'NÃO INFORMADO';
 // PDF A4 gerado localmente: sem cabeçalhos/rodapés do navegador e sem internet.
 const buildPdf=(orientation)=>{
 const W=595.28,H=841.89, margin=42, pages=[];let commands=[],y=H-50;
 const cp1252={'€':128,'‚':130,'ƒ':131,'„':132,'…':133,'†':134,'‡':135,'ˆ':136,'‰':137,'Š':138,'‹':139,'Œ':140,'Ž':142,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'˜':152,'™':153,'š':154,'›':155,'œ':156,'ž':158,'Ÿ':159};
 const bytes=v=>{const out=[];for(const ch of String(v??'')){const n=ch.codePointAt(0);out.push(n<=255?n:(cp1252[ch]??63))}return out};
 const literal=v=>'('+bytes(v).map(n=>n===40||n===41||n===92?'\\'+String.fromCharCode(n):n<32||n>126?'\\'+n.toString(8).padStart(3,'0'):String.fromCharCode(n)).join('')+')';
 const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
 const fit=(v,max=88)=>{const t=clean(v);return t.length>max?t.slice(0,max-3)+'...':t};
 const text=(v,x,yy,size=10,bold=false)=>{commands.push(`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${yy.toFixed(2)} Tm ${literal(v)} Tj ET`)};
 const line=(x1,y1,x2,y2)=>commands.push(`0.68 G 0.6 w ${x1} ${y1.toFixed(2)} m ${x2} ${y2.toFixed(2)} l S 0 G`);
 const page=()=>{if(commands.length)pages.push(commands.join('\n'));commands=[];y=H-50};
 const ensure=h=>{if(y-h<70){page();header()}};
 const write=(v,size=10,bold=false,indent=0)=>{ensure(size+9);text(v,margin+indent,y,size,bold);y-=size+8};
 const header=()=>{text(fit(company,72),margin,y,14,true);y-=19;write('LOJA: 01 - MATRIZ',9);for(const detail of companyDetails)write(fit(detail,100),8);line(margin,y+3,W-margin,y+3);y-=20};
 const wrap=(v,width=92)=>{const words=String(v??'').split(/\s+/),lines=[];let cur='';for(const word of words){if((cur+' '+word).trim().length>width){if(cur)lines.push(cur);cur=word;while(cur.length>width){lines.push(cur.slice(0,width));cur=cur.slice(width)}}else cur=(cur+' '+word).trim()}if(cur)lines.push(cur);return lines.length?lines:['-']};
 if(listMode){
   header();write('LISTAGEM DE SAÍDAS DE ESTOQUE',13,true);y-=9;
   for(const d of records){ensure(26);write(`${d.id}   ${date(d.data)}   ${type(d)}   ${d.situacao}   ${d.itens?.length||0} ITEM(NS)`,9)}
   y-=12;write(`TOTAL: ${records.length} SAÍDA(S)`,11,true);
 }else{
   for(const d of records){
     if(commands.length)page();header();write('COMPROVANTE DE SAÍDA DE ESTOQUE',13,true);y-=9;
     write(`Nº DA SAÍDA: ${d.id}                              DATA: ${date(d.data)}`,10);
     write(`TIPO: ${type(d)}                              SITUAÇÃO: ${d.situacao}`,10);
     y-=12;write('PRODUTOS DA SAÍDA',10,true);
     line(margin,y+5,W-margin,y+5);
     text('CÓD.',margin,y,8,true);
     text('DESCRIÇÃO',margin+48,y,8,true);
     text('UN.',margin+252,y,8,true);
     text('QTD.',margin+288,y,8,true);
     text('CUSTO UNIT.',margin+342,y,8,true);
     text('CUSTO TOTAL',margin+429,y,8,true);
     y-=17;line(margin,y+5,W-margin,y+5);
     for(const x of d.itens||[]){
       ensure(23);
       text(fit(x.codigo,8),margin,y,8);
       text(fit(x.descricao,34),margin+48,y,8);
       text(fit(x.unidade||'UN',5),margin+252,y,8);
       text(fmt(x.quantidade),margin+288,y,8);
       text(money(costOf(x)),margin+342,y,8);
       text(money(num(x.quantidade)*costOf(x)),margin+429,y,8);
       y-=20;line(margin,y+6,W-margin,y+6);
     }
     y-=12;write(`TOTAL: ${(d.itens||[]).length} PRODUTO(S) - ${fmt((d.itens||[]).reduce((a,x)=>a+num(x.quantidade),0))} UNIDADES`,10,true);
     write(`CUSTO TOTAL DA SAÍDA: ${money((d.itens||[]).reduce((a,x)=>a+num(x.quantidade)*costOf(x),0))}`,11,true);
     y-=12;write('OBSERVAÇÕES',10,true);
     for(const row of String(d.observacoes||'-').split(/\n/))for(const part of wrap(row,94))write(part,9);
     ensure(115);y-=70;
     line(margin,y,margin+230,y);line(W-margin-230,y,W-margin,y);y-=13;
     text('ASSINATURA DE QUEM ENTREGOU',margin+30,y,8);
     text('ASSINATURA DE QUEM RECEBEU',W-margin-204,y,8);
     y-=33;write('USUÁRIO RESPONSÁVEL: '+fit(d.usuario||'-',70),8);
   }
 }
 page();
 const objects=[null];const add=v=>{objects.push(v);return objects.length-1};
 const catalog=add(''),pagesId=add('');
 const f1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 const f2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
 const pageIds=[];
 for(const content of pages){
   const transformed=orientation==="landscape"?`q 0.70 0 0 0.70 0 0 cm\n${content}\nQ`:content;
   const stream=add(`<< /Length ${transformed.length} >>\nstream\n${transformed}\nendstream`);
   pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${orientation==="landscape"?H:W} ${orientation==="landscape"?W:H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${stream} 0 R >>`));
 }
 objects[catalog]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
 objects[pagesId]=`<< /Type /Pages /Kids [${pageIds.map(n=>n+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;
 let output='%PDF-1.4\n%PDF-LUCAS\n',offsets=[0];
 for(let i=1;i<objects.length;i++){offsets.push(output.length);output+=`${i} 0 obj\n${objects[i]}\nendobj\n`}
 const xref=output.length;output+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
 for(let i=1;i<objects.length;i++)output+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
 output+=`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
 return new Blob([Uint8Array.from(output,c=>c.charCodeAt(0))],{type:'application/pdf'});
 };
 const h=esc;
 const current=records[0];
 const count=records.reduce((sum,d)=>sum+(d.itens||[]).length,0);
 const formatDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v).split('-').reverse().join('/'):String(v||'');
 const companyName=(()=>{try{const info=JSON.parse(localStorage.getItem('erp_systems_dados_loja_v1')||'{}');return info.nome||info.nomeFantasia||info.razaoSocial||document.querySelector('.store-company')?.textContent?.trim()||company}catch{return company}})();
 const printable=()=>{
   const body=records.map(d=>{
     let total=0;const rows=(d.itens||[]).map(x=>{const q=num(x.quantidade),c=costOf(x);total+=q*c;return `<tr><td>${h(x.codigo)}</td><td>${h(x.descricao)}</td><td>${h(x.unidade||'UN')}</td><td class="n">${fmt(q)}</td><td class="n">${money(c)}</td><td class="n">${money(q*c)}</td></tr>`}).join('');
     return `<article><header><strong>LOJA: 01 - MATRIZ</strong><div>${h(companyName)}</div></header><h1>SAÍDA DE ESTOQUE</h1><div class="meta"><div><b>Nº DA SAÍDA:</b> ${h(d.id)}</div><div><b>DATA:</b> ${h(formatDate(d.data))}</div><div><b>TIPO:</b> ${h(type(d))}</div><div><b>SITUAÇÃO:</b> ${h(d.situacao)}</div><div><b>USUÁRIO:</b> ${h(d.usuario||'-')}</div></div><table><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>UN.</th><th>QUANTIDADE</th><th>CUSTO UNIT.</th><th>CUSTO TOTAL</th></tr></thead><tbody>${rows}</tbody></table><p class="total">CUSTO TOTAL: ${money(total)}</p><p class="obs"><b>OBSERVAÇÕES:</b> ${h(d.observacoes||'-')}</p><div class="signatures"><span>ASSINATURA DE QUEM ENTREGOU</span><span>ASSINATURA DE QUEM RECEBEU</span></div><div class="footer">Emitido em ${h(new Date().toLocaleDateString('pt-BR'))}, por ${h(user())}.</div></article>`
   }).join('');
   return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>@page{size:A4 ${orientation};margin:15mm}*{box-sizing:border-box}body{margin:0;font:12px Arial,sans-serif;color:#111}article{break-after:page}article:last-child{break-after:auto}header{border-bottom:1px solid #333;padding-bottom:12px}header strong{font-size:16px}h1{text-align:center;font-size:18px;margin:26px 0}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}table{width:100%;border-collapse:collapse}th{font-size:10px;text-align:left;border-bottom:1px solid #333;padding:9px 4px}td{border-bottom:1px solid #ddd;padding:9px 4px;vertical-align:top}tr{break-inside:avoid}.n{text-align:right}.total{text-align:right;font-weight:bold;margin-top:18px}.obs{white-space:pre-wrap;margin-top:25px;overflow-wrap:anywhere}.signatures{display:flex;gap:35px;justify-content:space-between;margin-top:85px}.signatures span{flex:1;border-top:1px solid #333;text-align:center;padding-top:8px;font-size:10px}.footer{font-size:10px;text-align:right;color:#555;margin-top:32px}</style></head><body>${body}</body></html>`;
 };
 document.getElementById('se-print-overlay')?.remove();
 const overlay=document.createElement('div');overlay.id='se-print-overlay';
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(5,22,49,.65);display:flex;align-items:center;justify-content:center;padding:18px';
 overlay.innerHTML=`<div role="dialog" aria-modal="true" aria-label="Imprimir Saída de Estoque" style="background:white;border-radius:10px;width:min(1100px,98vw);height:min(740px,94vh);display:flex;flex-direction:column;overflow:hidden;font-family:Arial,sans-serif;color:#173966"><div style="background:#1d518d;color:#fff;padding:18px 22px;display:flex;justify-content:space-between;align-items:center"><strong>IMPRIMIR ${listMode?'LISTAGEM DE SAÍDAS':'SAÍDA DE ESTOQUE'}</strong><button type="button" data-se-close style="background:none;border:0;color:white;font-size:25px;cursor:pointer">×</button></div><div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(220px,40%) minmax(0,60%);gap:16px;padding:16px"><section style="border:1px solid #cbd9ea;border-radius:6px;padding:15px;overflow:auto"><h3 style="background:#e5eef9;padding:13px;margin:0 0 18px;font-size:14px">DADOS DA SAÍDA</h3>${listMode?`<p><b>SAÍDAS:</b> ${records.length}</p>`:`<p><b>SAÍDA Nº:</b> ${h(current.id)}</p><p><b>DATA:</b> ${h(formatDate(current.data))}</p><p><b>SITUAÇÃO:</b> ${h(current.situacao)}</p><p><b>USUÁRIO:</b> ${h(current.usuario||'-')}</p><p><b>TIPO:</b> ${h(type(current))}</p>`}<p><b>PRODUTOS:</b> ${count}</p><h3 style="background:#e5eef9;padding:13px;font-size:14px">FORMATO DA IMPRESSÃO</h3><div style="display:flex;gap:16px;flex-wrap:wrap"><label><input type="radio" name="se-orientation" value="portrait" checked> RETRATO</label><label><input type="radio" name="se-orientation" value="landscape"> PAISAGEM</label></div><p>Papel A4 — impressão sem bordas externas.</p></section><section style="background:#f0f3f8;border:1px solid #cbd9ea;border-radius:6px;min-width:0;display:flex;flex-direction:column;padding:14px"><h3 style="background:#e5eef9;padding:13px;margin:0 0 12px;font-size:14px">PRÉ-VISUALIZAÇÃO — A4</h3><iframe title="Pré-visualização da Saída de Estoque" style="flex:1;width:100%;border:1px solid #ccd4df;background:white"></iframe></section></div><footer style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #dce4ee;padding:12px 18px"><button type="button" data-se-print style="background:#1764c6;color:white;border:0;border-radius:5px;padding:13px 28px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button type="button" data-se-save style="background:#009e72;color:white;border:0;border-radius:5px;padding:13px 28px;font-weight:bold;cursor:pointer">SALVAR</button><button type="button" data-se-close style="background:#e9f1fc;color:#244e80;border:1px solid #c2d2e6;border-radius:5px;padding:13px 25px;cursor:pointer">FECHAR</button></footer></div>`;
 document.body.appendChild(overlay);
 const frame=overlay.querySelector('iframe');frame.srcdoc=printable();
 overlay.querySelectorAll('[name=se-orientation]').forEach(r=>r.onchange=()=>{orientation=r.value;frame.srcdoc=printable()});
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 const close=()=>{document.removeEventListener('keydown',key,true);overlay.remove()};
 document.addEventListener('keydown',key,true);
 overlay.querySelectorAll('[data-se-close]').forEach(b=>b.onclick=close);
 overlay.onclick=e=>{if(e.target===overlay)close()};
 overlay.querySelector('[data-se-print]').onclick=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){alert('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO.')}};
 overlay.querySelector('[data-se-save]').onclick=async()=>{
   const filename=listMode?'LISTAGEM_SAIDAS_ESTOQUE.pdf':`SAIDA_ESTOQUE_${current.id}.pdf`;
   // The browser's native Save As dialog is available through the File System Access API in Chrome.
   // Fallback: a regular PDF download when the API is unavailable (e.g. restricted file:// contexts).
   try{if(window.showSaveFilePicker){const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const writable=await handle.createWritable();await writable.write(buildPdf(orientation));await writable.close();return}}catch(e){if(e.name==='AbortError')return}
   const url=URL.createObjectURL(buildPdf(orientation));const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 };

}

function localizarSaida(){
 if(document.getElementById('se-locate-overlay'))return;
 const overlay=document.createElement('div');overlay.id='se-locate-overlay';
 overlay.style.cssText='position:fixed;inset:0;z-index:1000001;background:rgba(5,24,53,.66);display:flex;align-items:center;justify-content:center;padding:16px';
 overlay.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="se-locate-title" style="width:min(475px,calc(100vw - 32px));background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 18px 50px #0005;color:#16375e;font-family:Arial,sans-serif"><div style="background:#20599a;color:white;padding:18px 20px;min-height:62px;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center"><strong id="se-locate-title" style="font-size:16px;font-weight:800">▣ LOCALIZAR SAÍDA DE ESTOQUE — F12</strong><button type="button" id="se-locate-x" aria-label="Fechar" style="background:transparent;border:0;color:white;font-size:24px;cursor:pointer">×</button></div><div style="padding:24px 20px 0"><p style="margin:0 0 14px;font-size:14px;color:#3c536e">Informe o número da saída.</p><label for="se-locate-code" style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:#16375e">NÚMERO DA SAÍDA</label><input id="se-locate-code" type="text" inputmode="numeric" autocomplete="off" placeholder="DIGITE O NÚMERO..." style="display:block;box-sizing:border-box;width:100%;height:47px;padding:10px 12px;border:2px solid #67a5ff;border-radius:7px;font-size:14px;color:#233a55;outline:none"><p id="se-locate-error" role="alert" style="color:#c62828;font-size:13px;min-height:18px;margin:9px 0 0"></p></div><div style="padding:14px 20px 20px;display:flex;justify-content:center;gap:10px"><button type="button" id="se-locate-go" style="min-width:112px;background:#19569b;color:white;border:1px solid #19569b;padding:11px 15px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">LOCALIZAR</button><button type="button" id="se-locate-cancel" style="min-width:112px;border:1px solid #bdd5f7;background:#eef4ff;color:#19569b;padding:11px 15px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">CANCELAR</button></div></div>`;
 document.body.appendChild(overlay);
 const input=overlay.querySelector('#se-locate-code');
 const close=()=>{document.removeEventListener('keydown',onKey,true);overlay.remove()};
 const locate=()=>{const value=input.value.trim();if(!/^[1-9]\d*$/.test(value)){overlay.querySelector('#se-locate-error').textContent='INFORME UM NÚMERO DE SAÍDA VÁLIDO.';input.focus();return}const record=get(K).find(x=>Number(x.id)===Number(value));if(!record){overlay.querySelector('#se-locate-error').textContent='SAÍDA NÃO ENCONTRADA.';input.select();return}close();load(record.id)};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();locate()}else if(['F1','F2','F3','F12'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation()}};
 document.addEventListener('keydown',onKey,true);
 overlay.querySelector('#se-locate-x').onclick=close;
 overlay.querySelector('#se-locate-cancel').onclick=close;
 overlay.querySelector('#se-locate-go').onclick=locate;
 input.focus();
}
function action(a){if(a==='novo'){id=null;items=[];selected=null;chosenType='MATÉRIA-PRIMA';return render()}if(a==='alterar'){const d=doc();if(!d)return alert('GRAVE A SAÍDA ANTES DE ALTERAR.');if(d.situacao!=='PENDENTE')return alert('SOMENTE SAÍDAS PENDENTES PODEM SER ALTERADAS.');return gravar()}if(a==='gravar')return gravar();if(['baixar','cancelar'].includes(a))return transition(a);if(a==='pesquisar')return $('al-search-section').scrollIntoView({behavior:'smooth'});if(a==='localizar')return localizarSaida();if(a==='imprimir')return printDoc();if(a==='listagem')return printDoc(true);if(a==='voltar')return category('ESTOQUE')}
window.LLopenStockExitFromStock=function(n){if(!get(K).some(x=>Number(x.id)===Number(n)))return false;load(Number(n));return true};
const oldOpen=open;open=function(name){if(name==='SAÍDAS DE ESTOQUE'||name==='SAÍDA DO ALMOXARIFADO'||name==='SAÍDA DE ALMOXARIFADO'){id=null;items=[];selected=null;chosenType='MATÉRIA-PRIMA';return render()}return oldOpen(name)};
document.addEventListener('keydown',e=>{if(screen!=='SAÍDAS DE ESTOQUE'||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='F1'){e.preventDefault();e.stopImmediatePropagation();$('se-shortcuts')?.click()}if(e.key==='F12'){e.preventDefault();e.stopImmediatePropagation();action('localizar')}if(e.key==='F2'){e.preventDefault();e.stopImmediatePropagation();action('baixar')}if(e.key==='F3'){e.preventDefault();e.stopImmediatePropagation();action('cancelar')}},true);
})();
