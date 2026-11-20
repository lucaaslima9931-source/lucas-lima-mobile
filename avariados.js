(()=>{'use strict';
const K='erp_systems_avariados_v1',P='erp_matriz_produtos_teste_v1',el=id=>document.getElementById(id),read=()=>{try{return JSON.parse(localStorage.getItem(K)||'[]')}catch{return []}},write=a=>localStorage.setItem(K,JSON.stringify(a)),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),n=v=>Number(v)||0,fmt=v=>n(v).toLocaleString('pt-BR',{maximumFractionDigits:3}),who=()=>document.querySelector('.top-user strong')?.textContent||'DEMONSTRAÇÃO',alerta=m=>aviso('AVARIADOS',m),prod=c=>products.find(p=>String(p.codigo)===String(c)),newid=()=>Math.max(0,...read().map(x=>n(x.id)))+1;
let id=null,itens=[],selected=0;
// V484: registros pendentes antigos descontavam estoque no GRAVAR.
// Reverter esse desconto uma única vez; o conciliador recompõe os produtos documentados.
function corrigirPendentesAntigos(){
 const ds=read(), pendentes=ds.filter(d=>d.situacao==='PENDENTE'&&d.estoqueAplicado===true);
 if(!pendentes.length)return;
 const ps=JSON.parse(localStorage.getItem(P)||'[]');
 for(const d of pendentes){for(const it of d.itens||[]){const p=ps.find(x=>String(x.codigo)===String(it.codigo));if(p)p.provisao=+(n(p.provisao)+n(it.quantidade)).toFixed(3)}d.estoqueAplicado=false;(d.historico??=[]).push({acao:'CORREÇÃO V484',detalhe:'PENDENTE NÃO MOVIMENTA ESTOQUE',usuario:'SISTEMA',data:new Date().toISOString()})}
 localStorage.setItem(P,JSON.stringify(ps));write(ds);
}
corrigirPendentesAntigos();

const avSituacaoExibir = valor => valor === 'BAIXADO' ? 'BAIXADA' : valor === 'CANCELADO' ? 'CANCELADA' : (valor || 'PENDENTE');
let avPesquisa={de:"",ate:"",situacao:"",executada:false};
function doc(){return read().find(x=>x.id===id)}
function move(codigo,qtd){let ps=JSON.parse(localStorage.getItem(P)||'[]');const p=ps.find(x=>String(x.codigo)===String(codigo));if(!p)throw Error('PRODUTO NÃO ENCONTRADO: '+codigo);p.provisao=+(n(p.provisao)+qtd).toFixed(3);localStorage.setItem(P,JSON.stringify(ps));products=ps}
function audit(d,acao,detalhe=''){d.usuario=who();(d.historico??=[]).push({acao,detalhe,usuario:d.usuario,data:new Date().toISOString()})}
function userHistory(){const d=doc();document.querySelectorAll('.av-user-history-overlay').forEach(x=>x.remove());const overlay=document.createElement('div');overlay.className='ae-modal-overlay av-user-history-overlay';const rows=(d?.historico||[]).slice().reverse().map(h=>`<tr><td>${esc(new Date(h.data).toLocaleString('pt-BR'))}</td><td>${esc(h.usuario)}</td><td>${esc(h.acao)}</td><td>${esc(h.detalhe||'—')}</td></tr>`).join('');overlay.innerHTML=`<div class="ae-modal" role="dialog" aria-modal="true"><header><strong>HISTÓRICO DE ALTERAÇÕES — AVARIADOS</strong><button type="button" data-close aria-label="Fechar">×</button></header><div class="ae-modal-body"><p><b>Nº DO AVARIADO:</b> ${esc(d?.id||'NÃO GRAVADO')}</p><p><b>ÚLTIMO USUÁRIO:</b> ${esc(d?.usuario||who())}</p>${rows?`<div style="overflow:auto"><table class="ae-table"><thead><tr><th>DATA / HORA</th><th>USUÁRIO</th><th>AÇÃO</th><th>DETALHES</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p>NÃO HÁ HISTÓRICO REGISTRADO PARA ESTE LANÇAMENTO.</p>'}</div><footer><button type="button" data-close>FECHAR</button></footer></div>`;document.body.append(overlay);const close=()=>{overlay.remove();document.removeEventListener('keydown',key,true)};const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};document.addEventListener('keydown',key,true);overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);overlay.onclick=e=>{if(e.target===overlay)close()}}
function render(){screen='AVARIADOS';active('ESTOQUE');const d=doc(),locked=d&&d.situacao!=='PENDENTE';root().innerHTML=`<div class="ae-page av-page"><div class="av-topbar"><strong>▣ AVARIADOS</strong><button type="button" data-av="atalhos">⌂ ATALHOS</button></div><section class="ae-card"><h3>DADOS DO AVARIADO</h3><div class="ae-grid"><label>Nº DO AVARIADO<input readonly value="${d?.id||newid()}"></label><label>DATA<input type="date" id="av-data" value="${d?.data||new Date().toLocaleDateString('en-CA')}" ${locked?'disabled':''}></label><label>SITUAÇÃO<input readonly value="${avSituacaoExibir(d?.situacao)}"></label><label>USUÁRIO<input id="av-usuario" readonly title="CLIQUE PARA CONSULTAR O HISTÓRICO DE ALTERAÇÕES" style="cursor:pointer" value="${esc(d?.usuario||who())}"></label><label>OBSERVAÇÕES<input id="av-obs" value="${esc(d?.observacoes||'')}" ${locked?'disabled':''}></label></div></section><section class="ae-card"><h3>PRODUTOS AVARIADOS</h3><div class="ae-prod-grid"><label>CÓDIGO DO PRODUTO<input id="av-codigo" placeholder="DIGITE O CÓDIGO" ${locked?'disabled':''}></label><label>DESCRIÇÃO DO PRODUTO<div class="ae-desc-line"><input id="av-descricao" readonly placeholder="PREENCHIMENTO AUTOMÁTICO"><button id="av-procurar" ${locked?'disabled':''}>+</button></div></label><label>UNIDADE<input id="av-unidade" readonly></label><label>CUSTO UNITÁRIO<input id="av-custo" readonly></label><label>QUANTIDADE AVARIADA<input id="av-qtd" type="number" min="0.001" step="0.001" ${locked?'disabled':''}></label><button id="av-adicionar" ${locked?'disabled':''}>ADICIONAR PRODUTO</button></div><div class="ae-scroll"><table class="ae-table"><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>UN.</th><th>CUSTO UNIT.</th><th>QUANTIDADE</th><th>CUSTO TOTAL</th><th>AÇÃO</th></tr></thead><tbody id="av-itens"></tbody></table></div></section><aside class="av-stock-panel"><h3>ESTOQUE DO PRODUTO SELECIONADO</h3><strong id="av-stock-name">SELECIONE UM PRODUTO</strong><div class="av-stock-boxes"><div>PROVISÃO<b id="av-prov">—</b></div><div>VENDA<b id="av-venda">—</b></div><div>DISPONÍVEL<b id="av-disp">—</b></div></div></aside><section class="ae-card"><div class="ae-actions">${[['novo','NOVO'],['gravar','GRAVAR'],['alterar','ALTERAR'],['baixar','BAIXAR'],['cancelar','CANCELAR'],['imprimir','IMPRIMIR'],['voltar','VOLTAR']].map(([k,v])=>`<button data-av="${k}">${v}</button>`).join('')}</div></section><section class="ae-card" id="av-pesquisa"><h3>PESQUISA DE AVARIADOS</h3><div class="av-search-grid"><label>DATA INICIAL<input id="av-de" type="date"></label><label>DATA FINAL<input id="av-ate" type="date"></label><label>SITUAÇÃO<select id="av-filtro"><option value="">TODAS</option><option>PENDENTE</option><option value="BAIXADO">BAIXADA</option><option value="CANCELADO">CANCELADA</option></select></label><button type="button" id="av-buscar">PESQUISAR</button></div><div class="ae-scroll"><table class="ae-table"><thead><tr><th>Nº</th><th>DATA</th><th>OBSERVAÇÕES</th><th>ITENS</th><th>SITUAÇÃO</th><th>USUÁRIO</th><th>AÇÃO</th></tr></thead><tbody id="av-lista"></tbody></table></div></section></div>`;
// A grade inferior deve conter somente sete comandos, sem ATALHOS.
const botoesPermitidos=new Set(['novo','gravar','alterar','baixar','cancelar','imprimir','voltar']);
root().querySelectorAll('.av-page .ae-actions button').forEach(b=>{if(!botoesPermitidos.has(b.dataset.av))b.remove()});
el('av-usuario').onclick=userHistory;el('av-codigo').oninput=sync;el('av-procurar').onclick=searchProduct;el('av-adicionar').onclick=add;el('av-codigo').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();sync();el('av-qtd').focus()}};document.querySelectorAll('[data-av]').forEach(b=>b.onclick=()=>action(b.dataset.av));el('av-buscar').onclick=()=>{avPesquisa={de:el('av-de').value,ate:el('av-ate').value,situacao:el('av-filtro').value,executada:true};list()};draw();el('av-de').value=avPesquisa.de;el('av-ate').value=avPesquisa.ate;el('av-filtro').value=avPesquisa.situacao;if(avPesquisa.executada)list();else el('av-lista').innerHTML='<tr><td colspan="7">CLIQUE EM PESQUISAR PARA CONSULTAR OS AVARIADOS.</td></tr>';stock(itens.length?prod(itens[selected]?.codigo):null)}
function cost(p){return n(p?.custoUnitario??p?.custo_unitario??p?.custo??p?.precoCusto??0)}
function money(v){return n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
// Os três saldos são consultados da mesma base conciliada da Ficha de Estoque.
// Não usar a cópia antiga do produto que ficou em memória ao abrir Avariados.
function estoqueDaFicha(codigo){
 if(codigo===undefined||codigo===null||String(codigo)==='')return null;
 let lista;
 try{lista=typeof window.LL_estoqueCentralConciliar==='function'
  ?window.LL_estoqueCentralConciliar()
  :JSON.parse(localStorage.getItem(P)||'[]');}catch(_){lista=[]}
 if(!Array.isArray(lista))lista=[];
 products=lista;
 return lista.find(x=>String(x.codigo)===String(codigo))||null;
}
function stock(p){
 const atual=p?estoqueDaFicha(p.codigo):null;
 const prov=n(atual?.provisao),venda=n(atual?.venda);
 el('av-stock-name').textContent=atual?`${atual.codigo} - ${atual.descricao}`:'SELECIONE UM PRODUTO';
 el('av-prov').textContent=atual?fmt(prov):'—';
 el('av-venda').textContent=atual?fmt(venda):'—';
 el('av-disp').textContent=atual?fmt(prov-venda):'—';
}
function sync(){let p=estoqueDaFicha(el('av-codigo').value.trim());el('av-descricao').value=p?.descricao||'';el('av-unidade').value=p?(p.unidade||p.un||''):'';el('av-custo').value=p?money(cost(p)):'';stock(p);return p}
function searchProduct(){window.LL_selecionarProdutoEstoque({produtos:()=>{try{const v=JSON.parse(localStorage.getItem(P)||'[]');return Array.isArray(v)?v:[]}catch{return []}},selecionar:p=>{el('av-codigo').value=p.codigo;sync();el('av-qtd').focus()},novo:()=>open('PRODUTOS')})}
function add(){if(doc()?.situacao!=='PENDENTE'&&doc())return alerta('REABRA UM LANÇAMENTO PENDENTE PARA ALTERAR.');let p=sync(),q=Number(el('av-qtd').value);if(!p||!Number.isFinite(q)||q<=0)return alerta('INFORME PRODUTO E QUANTIDADE VÁLIDOS.');if(itens.some(x=>String(x.codigo)===String(p.codigo)))return alerta('PRODUTO JÁ ADICIONADO.');itens.push({codigo:String(p.codigo),descricao:p.descricao,estoque:n(p.provisao),unidade:p.unidade||p.un||'',custo:cost(p),quantidade:q,troca:0,descarte:0,recebida:0});el('av-codigo').value='';el('av-qtd').value='';sync();draw();el('av-codigo').focus()}
function draw(){
 let locked=doc()?.situacao!=='PENDENTE'&&!!doc();
 el('av-itens').innerHTML=itens.map((x,i)=>`<tr data-row="${i}" style="cursor:pointer;${selected===i?'background:#dceafe;':''}"><td>${esc(x.codigo)}</td><td>${esc(x.descricao)}</td><td>${esc(x.unidade||prod(x.codigo)?.unidade||'')}</td><td>${money(x.custo??cost(prod(x.codigo)))}</td><td>${fmt(x.quantidade)}</td><td>${money(n(x.quantidade)*n(x.custo??cost(prod(x.codigo))))}</td><td>${locked?'':`<button data-remove="${i}" class="av-delete">EXCLUIR</button>`}</td></tr>`).join('')||'<tr><td colspan="7">NENHUM PRODUTO ADICIONADO.</td></tr>';
 el('av-itens').querySelectorAll('[data-row]').forEach(b=>b.onclick=()=>{selected=+b.dataset.row;stock(prod(itens[selected].codigo));draw()});
 el('av-itens').querySelectorAll('[data-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();itens.splice(+b.dataset.remove,1);selected=0;draw();stock(itens.length?prod(itens[0].codigo):null)});
}
function list(){let de=el('av-de').value,ate=el('av-ate').value,st=el('av-filtro').value;el('av-lista').innerHTML=read().filter(x=>(!de||x.data>=de)&&(!ate||x.data<=ate)&&(!st||x.situacao===st)).sort((a,b)=>b.id-a.id).map(x=>`<tr data-open="${x.id}" title="DÊ DOIS CLIQUES PARA ABRIR" style="cursor:pointer"><td>${x.id}</td><td>${esc(x.data)}</td><td>${esc(x.observacoes||x.motivo||'')}</td><td>${x.itens.length}</td><td>${avSituacaoExibir(x.situacao)}</td><td>${esc(x.usuario)}</td><td>—</td></tr>`).join('')||'<tr><td colspan="7">NENHUM AVARIADO ENCONTRADO.</td></tr>';el('av-lista').querySelectorAll('[data-open]').forEach(b=>b.ondblclick=()=>{id=+b.dataset.open;itens=doc().itens.map(x=>({...x}));selected=0;render()})}
function applyDelta(delta){const ps=JSON.parse(localStorage.getItem(P)||'[]');for(const [codigo,q] of Object.entries(delta)){const p=ps.find(x=>String(x.codigo)===codigo);if(!p)throw Error('PRODUTO NÃO ENCONTRADO: '+codigo);p.provisao=+(n(p.provisao)+q).toFixed(3)}localStorage.setItem(P,JSON.stringify(ps));products=ps}
function diffStock(before,after){const delta={};for(const x of before)delta[String(x.codigo)]=(delta[String(x.codigo)]||0)+n(x.quantidade);for(const x of after)delta[String(x.codigo)]=(delta[String(x.codigo)]||0)-n(x.quantidade);return delta}
function gravar(mensagemAlteracao=false){
 const ds=read(),old=doc();
 if(old&&old.situacao!=='PENDENTE')return alerta('SOMENTE AVARIADOS PENDENTES PODEM SER ALTERADOS.');
 if(!itens.length)return alerta('ADICIONE PELO MENOS UM PRODUTO.');
 const d={id:old?.id||newid(),data:el('av-data').value,observacoes:el('av-obs').value,usuario:old?.usuario||who(),situacao:'PENDENTE',estoqueAplicado:false,itens:itens.map(x=>({...x})),historico:old?.historico||[]};
 audit(d,old?'ALTERAR':'GRAVAR','SEM MOVIMENTAÇÃO DE ESTOQUE — PENDENTE');
 const idx=ds.findIndex(x=>x.id===d.id);if(idx<0)ds.push(d);else ds[idx]=d;
 write(ds);id=d.id;render();alerta(mensagemAlteracao?'LANÇAMENTO ALTERADO COM SUCESSO.':'AVARIADO GRAVADO COMO PENDENTE. ESTOQUE NÃO MOVIMENTADO.');
}
async function autenticarAvaria(operacao){
 return new Promise(resolve=>{
  document.getElementById('ae-auth-overlay')?.remove();
  const overlay=document.createElement('div');overlay.id='ae-auth-overlay';overlay.className='ae-modal-overlay';
  overlay.innerHTML=`<div class="ae-modal ae-auth-caixa-modelo" role="dialog" aria-modal="true" aria-labelledby="ae-auth-title"><header><strong id="ae-auth-title">IDENTIFICAÇÃO PARA ${operacao==='baixar'?'BAIXAR':'CANCELAR'} AVARIA</strong><button type="button" data-fechar aria-label="Fechar">×</button></header><div class="ae-modal-body"><label for="ae-auth-code">USUÁRIO (CÓDIGO)</label><input id="ae-auth-code" type="text" inputmode="numeric" autocomplete="off" placeholder="INFORME O CÓDIGO DO OPERADOR"><div class="ae-auth-person"><strong id="ae-auth-name">INFORME O CÓDIGO DO USUÁRIO</strong><small id="ae-auth-role">O NOME APARECERÁ AUTOMATICAMENTE</small></div><label for="ae-auth-pass">SENHA</label><input id="ae-auth-pass" type="password" autocomplete="off" placeholder="DIGITE SUA SENHA"><p id="ae-auth-error" role="alert" aria-live="polite"></p><p class="ae-auth-note">VALIDAÇÃO LOCAL DOS USUÁRIOS CADASTRADOS. NÃO SUBSTITUI AUTENTICAÇÃO SEGURA EM SERVIDOR.</p></div><footer><button type="button" id="ae-auth-ok">CONTINUAR</button><button type="button" data-fechar>CANCELAR</button></footer></div>`;
  document.body.appendChild(overlay);
  const code=overlay.querySelector('#ae-auth-code'),pass=overlay.querySelector('#ae-auth-pass'),err=overlay.querySelector('#ae-auth-error'),name=overlay.querySelector('#ae-auth-name'),role=overlay.querySelector('#ae-auth-role');
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
   if(typeof window.LL_hasPermission==='function'&&!window.LL_hasPermission(u,operacao==='baixar'?'Baixar — AVARIA DE ESTOQUE':'Cancelar — AVARIA DE ESTOQUE')){err.textContent='USUÁRIO SEM PERMISSÃO PARA ESTA OPERAÇÃO.';return}
   close({nome:u.nome||u.login||String(u.id),id:u.id});
  };
  overlay.querySelector('#ae-auth-ok').onclick=confirm;
  pass.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();confirm()}};
  code.focus();
 });
}

async function transition(k){
 const ds=read(),d=ds.find(x=>x.id===id);
 if(!d)return alerta('GRAVE O LANÇAMENTO PRIMEIRO.');
 if((k==='baixar'&&d.situacao!=='PENDENTE')||(k==='cancelar'&&!['PENDENTE','BAIXADO'].includes(d.situacao)))return alerta('OPERAÇÃO NÃO PERMITIDA NESTA SITUAÇÃO.');
 const autorizado=await autenticarAvaria(k);
 if(!autorizado)return;
 if(!await erpConfirm(`CONFIRMA ${k.toUpperCase()} O AVARIADO Nº ${d.id}?`))return;
 try{
  if(k==='baixar'){
   if(!d.estoqueAplicado)applyDelta(diffStock([],d.itens));
   d.estoqueAplicado=true;d.situacao='BAIXADO';d.baixadoEm=new Date().toISOString();
  }else{
   if(d.estoqueAplicado||d.situacao==='BAIXADO')applyDelta(diffStock(d.itens,[]));
   d.estoqueAplicado=false;d.situacao='CANCELADO';d.canceladoEm=new Date().toISOString();
  }
 }catch(e){return alerta(e.message)}
 audit(d,k.toUpperCase(),`AUTORIZADO POR ${autorizado.nome} (CÓDIGO ${autorizado.id})`);
 d.usuarioAutorizador=autorizado.nome;
 d.codigoUsuarioAutorizador=autorizado.id;
 write(ds);if(typeof window.LL_estoqueCentralConciliar==='function')window.LL_estoqueCentralConciliar();itens=d.itens.map(x=>({...x}));render();alerta('OPERAÇÃO REALIZADA.');
}
function avModal(title,body){document.querySelectorAll('.av-shortcut-modal').forEach(x=>x.remove());const o=document.createElement('div');o.className='ae-modal-overlay av-shortcut-modal';o.innerHTML=`<div class="ae-modal" role="dialog" aria-modal="true" style="max-width:475px;width:calc(100% - 30px)"><header style="background:#195596;color:white;padding:20px 22px"><strong>${title}</strong><button type="button" data-close style="color:white;background:transparent;border:0;font-size:24px">×</button></header><div class="ae-modal-body" style="padding:18px 22px">${body}</div><footer style="padding:12px 20px;text-align:right"><button type="button" data-close style="background:#195596;color:white;padding:12px 22px;border:0;border-radius:5px">FECHAR</button></footer></div>`;document.body.append(o);const close=()=>{o.remove();document.removeEventListener('keydown',esc,true)};const esc=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};document.addEventListener('keydown',esc,true);o.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);o.onclick=e=>{if(e.target===o)close()};return o}
function avShortcuts(){const rows=[['F1','Abrir esta janela de atalhos'],['F12','Localizar avaria pelo número'],['F2','Baixar avaria'],['F3','Cancelar avaria']];avModal('⌂ ATALHOS — ▣ AVARIADOS',rows.map(([key,label])=>`<div style="display:flex;align-items:center;gap:16px;padding:10px 0;border-bottom:1px solid #e4ebf5"><span style="display:inline-flex;align-items:center;justify-content:center;width:54px;height:34px;background:#eaf2ff;border:1px solid #bfd4f5;border-radius:5px;color:#0b3775;font-weight:bold">${key}</span><span>${label}</span></div>`).join(''))}
function avLocate(){
 document.getElementById('av-localizar-avaria')?.remove();
 const overlay=document.createElement('div');overlay.id='av-localizar-avaria';overlay.className='ae-modal-overlay';
 overlay.innerHTML=`<div class="ae-modal ae-modal-f12" role="dialog" aria-modal="true" aria-labelledby="av-f12-title"><header><strong id="av-f12-title">▣ LOCALIZAR AVARIA — F12</strong><button type="button" data-fechar aria-label="Fechar">×</button></header><div class="ae-modal-body"><p class="ae-f12-help">Informe o número da avaria.</p><label for="av-numero-busca">NÚMERO DA AVARIA</label><input id="av-numero-busca" type="text" inputmode="numeric" autocomplete="off" placeholder="DIGITE O NÚMERO..."><p id="av-erro-busca" role="alert" style="color:#c62828"></p></div><footer><button type="button" id="av-confirmar-busca">LOCALIZAR</button><button type="button" data-fechar>CANCELAR</button></footer></div>`;
 document.body.appendChild(overlay);
 const fechar=()=>{overlay.remove();document.removeEventListener('keydown',tecla,true)};
 const buscar=()=>{const digitado=document.getElementById('av-numero-busca').value.trim();const numero=/^\d+$/.test(digitado)?Number(digitado):NaN,d=read().find(x=>x.id===numero);if(!Number.isInteger(numero)||numero<1||!d){document.getElementById('av-erro-busca').textContent='AVARIA NÃO ENCONTRADA. CONFIRA O NÚMERO.';return}id=d.id;itens=d.itens.map(x=>({...x}));selected=0;fechar();render()};
 const tecla=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();fechar()}else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();buscar()}};
 document.addEventListener('keydown',tecla,true);overlay.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=fechar);overlay.onclick=e=>{if(e.target===overlay)fechar()};document.getElementById('av-confirmar-busca').onclick=buscar;document.getElementById('av-numero-busca').focus();
}

function avNomeLoja(){try{const d=JSON.parse(localStorage.getItem('erp_systems_dados_loja_v1')||'{}');return String(d?.nome||d?.nomeFantasia||d?.razaoSocial||'').trim()||String(document.querySelector('.topbar .store-company')?.textContent||'').trim()}catch{return String(document.querySelector('.topbar .store-company')?.textContent||'').trim()}}
function avPdf(d,orientation="portrait"){
 const enc=s=>Array.from(String(s??''),c=>{let n=c.codePointAt(0);return n<256?n:({8211:150,8212:151,8364:128}[n]||63)});
 const lit=s=>enc(s).map(c=>c===40?'\\(':c===41?'\\)':c===92?'\\\\':c<32||c>126?'\\'+c.toString(8).padStart(3,'0'):String.fromCharCode(c)).join('');
 let pages=[],ops=[],y=790;
 const t=(s,x,z=y,size=10,bold=false)=>ops.push(`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x} ${z} Tm (${lit(s)}) Tj ET`);
 const line=(z)=>ops.push(`48 ${z} m 547 ${z} l S`);
 const next=()=>{pages.push(ops.join('\n'));ops=[];y=790};
 const money=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 t('LOJA: 01 - MATRIZ',48,y,13,true);y-=18;t(avNomeLoja(),48);y-=12;line(y);y-=30;t('COMPROVANTE DE PRODUTOS AVARIADOS',135,y,13,true);y-=32;
 t('Nº DO AVARIADO: '+d.id,48,y,10,true);t('DATA: '+(d.data||'').split('-').reverse().join('/'),310);y-=20;t('SITUAÇÃO: '+avSituacaoExibir(d.situacao),48);t('USUÁRIO: '+d.usuario,310);y-=35;
 const head=()=>{t('PRODUTOS AVARIADOS',48,y,10,true);y-=22;['CÓD.','DESCRIÇÃO','UN.','QTD.','CUSTO UNIT.','TOTAL'].forEach((v,i)=>t(v,[48,90,267,308,357,448][i],y,8,true));y-=10;line(y);y-=18};head();
 let total=0,qtd=0;
 for(const item of d.itens){if(y<135){next();head()}const q=Number(item.quantidade)||0,c=Number(item.custo)||0;total+=q*c;qtd+=q;[item.codigo,String(item.descricao).slice(0,30),item.unidade||'',String(q).replace('.',','),money(c),money(q*c)].forEach((v,i)=>t(v,[48,90,267,308,357,448][i],y,8));y-=21;line(y+8)}
 if(y<260)next();y-=18;t('TOTAL: '+qtd.toLocaleString('pt-BR')+' UNIDADES - '+money(total),290,y,10,true);y-=40;t('OBSERVAÇÕES',48,y,10,true);y-=20;
 const words=String(d.observacoes||'—').split(/\s+/);let row='';for(const word of words){if((row+' '+word).length>90){t(row,48,y,9);y-=15;row=word}else row=(row+' '+word).trim()}if(row){t(row,48,y,9);y-=15}
 if(y<190)next();y-=90;ops.push(`165 ${y} m 430 ${y} l S`);y-=18;t('ASSINATURA DO RESPONSÁVEL',210,y,9,true);y-=38;t('USUÁRIO RESPONSÁVEL: '+d.usuario,48,y,9);next();
 let objects=[null,'<< /Type /Catalog /Pages 2 0 R >>',null,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];let kids=[];
 for(const original of pages){const content=orientation==='landscape'?'q 0.7071 0 0 0.7071 0 0 cm\n'+original+'\nQ':original;let stream=objects.length;objects.push('<< /Length '+enc(content).length+' >>\nstream\n'+content+'\nendstream');let page=objects.length;objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+(orientation==='landscape'?'841.89 595.28':'595.28 841.89')+'] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+stream+' 0 R >>');kids.push(page+' 0 R')}
 objects[2]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+kids.length+' >>';let bytes=enc('%PDF-1.4\n'),offset=[0],add=s=>bytes.push(...enc(s));for(let i=1;i<objects.length;i++){offset[i]=bytes.length;add(i+' 0 obj\n'+objects[i]+'\nendobj\n')}let xref=bytes.length;add('xref\n0 '+objects.length+'\n0000000000 65535 f \n');for(let i=1;i<objects.length;i++)add(String(offset[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');return new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
}
function imprimirAvaria(){
 const d=doc();if(!d)return alerta('GRAVE O AVARIADO ANTES DE IMPRIMIR.');
 document.querySelectorAll('.av-print-overlay').forEach(x=>x.remove());
 const h=v=>esc(v), num=v=>(Number(v)||0).toLocaleString('pt-BR',{maximumFractionDigits:3}), money=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')?v.split('-').reverse().join('/'):String(v||'');
 const status=d.situacao==='BAIXADO'?'BAIXADA':d.situacao==='CANCELADO'?'CANCELADA':d.situacao;
 const items=d.itens||[];let total=0;
 const lines=items.map(i=>{const q=Number(i.quantidade)||0,c=Number(i.custo)||0;total+=q*c;return `<tr><td>${h(i.codigo)}</td><td>${h(i.descricao)}</td><td>${h(i.unidade||'')}</td><td class="num">${money(c)}</td><td class="num">${num(q)}</td><td class="num">${money(q*c)}</td></tr>`}).join('');
 let orientation='portrait';const makeHtml=()=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Produtos Avariados ${h(d.id)}</title><style>@page{size:A4 ${orientation};margin:15mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#111;margin:0}header{border-bottom:1px solid #222;padding-bottom:12px}header strong{font-size:16px}h1{text-align:center;font-size:17px;margin:24px 0}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:25px}table{width:100%;border-collapse:collapse}th{text-align:left;border-bottom:1px solid #333;padding:9px 4px;font-size:10px}td{border-bottom:1px solid #ddd;padding:9px 4px;vertical-align:top}.num{text-align:right}.total{text-align:right;font-weight:bold;margin-top:18px}.obs{margin-top:28px;white-space:pre-wrap;overflow-wrap:anywhere}.assinatura{margin:90px auto 0;width:290px;text-align:center;border-top:1px solid #333;padding-top:8px}.rodape{margin-top:35px;font-size:10px;color:#555;text-align:right}@media print{tr{break-inside:avoid}}</style></head><body><header><strong>LOJA: 01 - MATRIZ</strong><div>${h(avNomeLoja())}</div></header><h1>PRODUTOS AVARIADOS</h1><div class="meta"><div><b>Nº DO AVARIADO:</b> ${h(d.id)}</div><div><b>DATA:</b> ${h(date(d.data))}</div><div><b>SITUAÇÃO:</b> ${h(status)}</div><div><b>USUÁRIO:</b> ${h(d.usuario)}</div></div><table><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>UN.</th><th>CUSTO UNITÁRIO</th><th>QUANTIDADE</th><th>CUSTO TOTAL</th></tr></thead><tbody>${lines}</tbody></table><div class="total">TOTAL: ${money(total)}</div><div class="obs"><b>OBSERVAÇÕES:</b> ${h(d.observacoes||'—')}</div><div class="assinatura">ASSINATURA DO RESPONSÁVEL</div><div class="rodape">Emitido em ${h(new Date().toLocaleDateString('pt-BR'))}, por ${h(who())}.</div></body></html>`;
 const overlay=document.createElement('div');overlay.className='av-print-overlay';overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(5,22,49,.65);display:flex;align-items:center;justify-content:center;padding:18px';
 overlay.innerHTML=`<div role="dialog" aria-modal="true" aria-label="Imprimir Produtos Avariados" style="background:#fff;border-radius:10px;width:min(1100px,98vw);height:min(740px,94vh);display:flex;flex-direction:column;overflow:hidden;font-family:Arial,sans-serif;color:#173966"><div style="background:#1d518d;color:#fff;padding:18px 22px;display:flex;justify-content:space-between;align-items:center"><strong>IMPRIMIR PRODUTOS AVARIADOS</strong><button type="button" data-av-close style="background:none;border:0;color:white;font-size:25px;cursor:pointer">×</button></div><div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(220px,40%) minmax(0,60%);gap:16px;padding:16px"><section style="border:1px solid #cbd9ea;border-radius:6px;padding:15px;overflow:auto"><h3 style="background:#e5eef9;padding:13px;margin:0 0 18px;font-size:14px">DADOS DO AVARIADO</h3><p><b>AVARIADO Nº:</b> ${h(d.id)}</p><p><b>DATA:</b> ${h(date(d.data))}</p><p><b>SITUAÇÃO:</b> ${h(status)}</p><p><b>USUÁRIO:</b> ${h(d.usuario)}</p><p><b>PRODUTOS:</b> ${items.length}</p><h3 style="background:#e5eef9;padding:13px;font-size:14px">FORMATO DA IMPRESSÃO</h3><div style="display:flex;gap:16px;flex-wrap:wrap"><label><input type="radio" name="av-orientation" value="portrait" checked> RETRATO</label><label><input type="radio" name="av-orientation" value="landscape"> PAISAGEM</label></div><p>Papel A4 — impressão sem bordas externas.</p></section><section style="background:#f0f3f8;border:1px solid #cbd9ea;border-radius:6px;min-width:0;display:flex;flex-direction:column;padding:14px"><h3 style="background:#e5eef9;padding:13px;margin:0 0 12px;font-size:14px">PRÉ-VISUALIZAÇÃO — A4</h3><iframe title="Pré-visualização de Produtos Avariados" style="flex:1;width:100%;border:1px solid #ccd4df;background:white"></iframe></section></div><footer style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #dce4ee;padding:12px 18px"><button type="button" data-av-print style="background:#1764c6;color:#fff;border:0;border-radius:5px;padding:13px 28px;font-weight:bold;cursor:pointer">IMPRIMIR</button><button type="button" data-av-save style="background:#009e72;color:#fff;border:0;border-radius:5px;padding:13px 28px;font-weight:bold;cursor:pointer">SALVAR</button><button type="button" data-av-close style="background:#e9f1fc;color:#244e80;border:1px solid #c2d2e6;border-radius:5px;padding:13px 25px;cursor:pointer">FECHAR</button></footer></div>`;
 document.body.appendChild(overlay);const frame=overlay.querySelector('iframe');frame.srcdoc=makeHtml();overlay.querySelectorAll('[name=av-orientation]').forEach(r=>r.onchange=()=>{orientation=r.value;frame.srcdoc=makeHtml()});
 const close=()=>{document.removeEventListener('keydown',key,true);overlay.remove()};const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',key,true);overlay.querySelectorAll('[data-av-close]').forEach(b=>b.onclick=close);overlay.onclick=e=>{if(e.target===overlay)close()};
 overlay.querySelector('[data-av-print]').onclick=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){alerta('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO.')}};
 overlay.querySelector('[data-av-save]').onclick=async()=>{const filename='AVARIADO_'+d.id+'.pdf';const pdf=avPdf(d,orientation);try{if(window.showSaveFilePicker){const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const writable=await handle.createWritable();await writable.write(pdf);await writable.close();return}}catch(e){if(e.name==='AbortError')return}const url=URL.createObjectURL(pdf);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)};
}
function action(k){if(k==='novo'){id=null;itens=[];selected=0;return render()}if(k==='gravar')return gravar();if(['baixar','reabrir','cancelar'].includes(k))return transition(k);if(k==='voltar')return category('ESTOQUE');if(k==='imprimir')return imprimirAvaria();if(k==='pesquisar')return el('av-pesquisa').scrollIntoView({behavior:'smooth'});if(k==='alterar'){if(!doc())return alerta('LOCALIZE OU GRAVE UM AVARIADO ANTES DE ALTERAR.');if(doc().situacao!=='PENDENTE')return alerta('SOMENTE AVARIADOS PENDENTES PODEM SER ALTERADOS.');return gravar(true)}if(k==='localizar')return avLocate();if(k==='atalhos')return avShortcuts()}
const oldOpen=open;open=function(name){if(name==='AVARIADOS'){id=null;itens=[];selected=0;return render()}return oldOpen(name)};
document.addEventListener('keydown',e=>{if(screen!=='AVARIADOS'||e.ctrlKey||e.altKey||e.metaKey)return;if(document.querySelector('.ae-modal-overlay'))return;const m={F1:'atalhos',F2:'baixar',F3:'cancelar',F12:'localizar'};if(m[e.key]){e.preventDefault();e.stopImmediatePropagation();action(m[e.key])}},true);
window.LLopenDamagedFromStock=n=>{const d=read().find(x=>Number(x.id)===Number(n));if(!d)return false;id=d.id;itens=d.itens.map(x=>({...x}));selected=0;render();return true};
})();
