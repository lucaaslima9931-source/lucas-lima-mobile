
// F1 da Sangria: intercepta antes dos atalhos globais de outras telas.
window.addEventListener('keydown',function(e){
 if(e.key!=='F1'||e.altKey||e.ctrlKey||e.metaKey)return;
 const active=document.querySelector('[data-ll-sangria-active="1"]');
 if(!active||!active.isConnected||document.querySelector('.cx-shortcut-overlay'))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(!e.repeat)active.querySelector('.cx-shortcuts')?.click();
},true);
/* LUCAS LIMA - CAIXA INDIVIDUAL. Dados locais: protótipo sem autenticação segura em servidor. */
(() => {
'use strict';
const KEY='erp_systems_caixas_v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}};
let caixas=read();
const save=()=>localStorage.setItem(KEY,JSON.stringify(caixas));
// Resolve IDs numéricos das formas de pagamento antes de classificar os estornos.
function normalizedPayment(value){
 const raw=String(value??'').trim().toUpperCase();
 if(!raw)return '';
 let name=raw;
 if(/^\d+$/.test(raw)){
  try{
   const stored=JSON.parse(localStorage.getItem('erp_matriz_formas_pagamento_v1')||'{}');
   const forms=Array.isArray(stored)?stored:(stored.formas||[]);
   const found=forms.find(x=>String(x.id)===String(Number(raw)));
   name=String(found?.tipo||found?.descricao||({1:'DINHEIRO',2:'PIX',3:'DÉBITO',4:'CRÉDITO'}[Number(raw)]||raw)).toUpperCase();
  }catch{name=({1:'DINHEIRO',2:'PIX',3:'DÉBITO',4:'CRÉDITO'}[Number(raw)]||raw)}
 }
 if(name.includes('DINHEIRO')||name.includes('ESPÉCIE'))return 'DINHEIRO';
 if(name.includes('PIX'))return 'PIX';
 if(name.includes('CRÉDITO')||name.includes('CREDITO'))return 'CARTÃO DE CRÉDITO';
 if(name.includes('DÉBITO')||name.includes('DEBITO'))return 'CARTÃO DE DÉBITO';
 return name;
}

// Concilia estornos confirmados em dinheiro que não foram persistidos no livro-caixa.
// A chave idEstorno impede lançamento duplicado ao abrir a tela novamente.
function reconcileCashRefunds(){
 const list=read();let records=[];
 try{records=JSON.parse(localStorage.getItem('erp_systems_estornos_v1')||'[]')}catch{}
 if(!Array.isArray(records))return list;
 let changed=false;
 for(const reg of records){
  if(normalizedPayment(reg.forma)!=='DINHEIRO'||!reg.id||!(Number(reg.valor)>0))continue;
  const cash=list.find(c=>String(c.id)===String(reg.caixaId));
  if(!cash)continue;
  cash.movimentos=Array.isArray(cash.movimentos)?cash.movimentos:[];
  if(cash.movimentos.some(m=>String(m.idEstorno||'')===String(reg.id)))continue;
  cash.movimentos.push({idEstorno:reg.id,vendaNumero:reg.vendaNumero,tipo:'SAÍDA',categoria:'ESTORNO DE VENDA',descricao:'ESTORNO VENDA '+String(reg.vendaNumero).padStart(6,'0'),valor:Number(reg.valor),forma:'DINHEIRO',data:reg.data||new Date().toISOString(),operador:reg.operador||cash.operador});
  changed=true;
 }
 if(changed)localStorage.setItem(KEY,JSON.stringify(list));
 return list;
}

// V503: conciliação idempotente dos recebimentos E devoluções de trocas baixadas com o livro-caixa.
// A origem financeira continua sendo o lançamento da conta vinculada; aqui se registra
// a movimentação do operador para aparecer na consulta e no resumo por forma.
function reconcileTradeCashPayments(){
 const list=read();let trades=[];
 try{trades=JSON.parse(localStorage.getItem('erp_matriz_trocas_v1')||'[]')}catch{}
 if(!Array.isArray(trades))return list;
 let changed=false;
 for(const trade of trades){
  if(trade.situacao!=='BAIXADA'||!['PAGAMENTO','DEVOLUCAO'].includes(trade.acerto))continue;
  const cash=list.find(c=>String(c.id)===String(trade.caixaBaixa));
  if(!cash)continue;
  cash.movimentos=Array.isArray(cash.movimentos)?cash.movimentos:[];
  (trade.pagamentos||[]).forEach((pay,i)=>{
   if(pay.boleto||String(pay.forma||'').toUpperCase().includes('BOLETO'))return;
   const amount=Number(pay.valor||0);
   if(!(amount>0))return;
   const ref='TROCA:'+trade.numero+':'+i;
   if(cash.movimentos.some(m=>String(m.ref||'')===ref))return;
   cash.movimentos.push({ref,trocaNumero:trade.numero,vendaNumero:trade.venda,
    tipo:trade.acerto==='DEVOLUCAO'?'SAÍDA':'ENTRADA',categoria:trade.acerto==='DEVOLUCAO'?'DEVOLUÇÃO DE TROCA':'TROCA',descricao:(trade.acerto==='DEVOLUCAO'?'DEVOLUÇÃO AO CLIENTE — ':'')+'TROCA Nº '+String(trade.numero).padStart(6,'0')+' — VENDA Nº '+String(trade.venda).padStart(6,'0'),
    valor:amount,forma:pay.forma||'NÃO INFORMADA',formaId:pay.formaId,
    taxaLoja:Number(pay.taxaLoja||0),identificacaoPagamento:pay.identificacaoPagamento||'',
    data:trade.baixadaEm||trade.data||new Date().toISOString(),operador:trade.operadorBaixa||cash.operador});
   changed=true;
  });
 }
 if(changed)localStorage.setItem(KEY,JSON.stringify(list));
 return list;
}
window.LL_conciliarPagamentosTrocasCaixa=reconcileTradeCashPayments;

const fmt=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const el=(tag,cls='',str='')=>{let x=document.createElement(tag);x.className=cls;x.textContent=str;return x};
const btn=(str,fn,cls='primary-button')=>{let b=el('button','cx-modern-btn '+cls,str);b.type='button';b.onclick=fn;return b};
const input=(label,type='text',value='')=>{let w=el('label','cx-field'),s=el('span','',label),i=el('input');i.type=type;i.value=value;w.append(s,i);return [w,i]};
const line=(container,...els)=>{let r=el('div','cx-row');r.append(...els);container.append(r);return r};
const panel=(title)=>{screen=title;root().replaceChildren();const p=el('section','module-screen cx-module');const heading=el('div','cx-vendas-header');heading.append(el('strong','', '▣ '+title));heading.append(btn('⌃ ATALHOS',()=>erpAlert('CAIXA: ABRA O CAIXA ANTES DE REGISTRAR MOVIMENTAÇÕES. O HISTÓRICO FICA NO FINAL DESTA TELA.'),'cx-shortcuts'));p.append(heading);root().append(p);active('CAIXA');return p};
// O campo estornado identifica a movimentação original, mas ela continua no livro-caixa.
// Seu estorno é uma movimentação inversa separada: excluir o original duplica o efeito.
const cashMoves=c=>c.movimentos.filter(x=>normalizedPayment(x.forma)==='DINHEIRO');
// Disponível por modalidade: inclui a movimentação original e seu estorno inverso.\n// Não descartar o original marcado estornado, pois isso criaria saldo fictício\n// (ex.: saída de R$ 8 cancelada, cujo estorno de +R$ 8 continuaria sozinho).\n// Exclui boletos e respeita lançamentos deste caixa.
function availableByForm(c,form){
 const key=normalizedPayment(form);
 if(key.includes('BOLETO')||key.includes('CARNE'))return 0;
 let balance=key==='DINHEIRO'?Number(c.inicial||0):0;
 for(const m of c.movimentos||[]){if(normalizedPayment(m.forma)!==key)continue;
  balance+=(String(m.tipo).toUpperCase()==='ENTRADA'?1:-1)*Number(m.valor||0);
 }
 return Math.max(0,Math.round(balance*100)/100);
}
const expected=c=>Number(c.inicial||0)+cashMoves(c).reduce((v,x)=>v+(x.tipo==='ENTRADA'?x.valor:-x.valor),0);
const activeCash=code=>caixas.find(x=>x.operador===code&&x.situacao==='ABERTO');
const users=()=>{try{const raw=localStorage.getItem('erp_matriz_usuarios_v1');return raw?JSON.parse(raw):[]}catch{return []}};
// Sessão da pessoa conectada (não confundir com o operador do caixa consultado).
const connectedUser=()=>{try{return JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'null')}catch{return null}};
// Nome do operador registrado na abertura; jamais atribuir outro usuário ao caixa.
const operatorName=code=>{
 const id=String(code??'').trim();if(!id)return '—';
 if(id==='300')return 'USUÁRIO DE DEMONSTRAÇÃO';
 const valid=v=>{const x=String(v??'').trim();return x&&!/^\d+$/.test(x)&&!/^USU[AÁ]RIO (?:DE DEMONSTRA[CÇ][AÃ]O|N[AÃ]O IDENTIFICADO)$/i.test(x)?x:''};
 const raw=users();const list=Array.isArray(raw)?raw:(raw?.usuarios||raw?.items||[]);
 const match=(Array.isArray(list)?list:[]).find(u=>[u.id,u.codigo,u.usuario,u.login].some(v=>v!=null&&String(v).trim()===id));
 const registered=valid(match?.nome||match?.nomeCompleto||match?.name||match?.login);if(registered)return registered;
 const sess=connectedUser();
 if(sess&&[sess.id,sess.codigo,sess.usuario,sess.login].some(v=>v!=null&&String(v).trim()===id)){
  const name=valid(sess.nome||sess.name)||valid(document.querySelector('.top-user strong')?.textContent);
  if(name)return name;
 }
 return id;
};
const operatorLabel=(code,cash)=>{
 if(String(code??'').trim()==='300')return 'USUÁRIO DE DEMONSTRAÇÃO';
 const valid=v=>{const x=String(v??'').trim();return x&&!/^\d+$/.test(x)&&!/^USU[AÁ]RIO (?:DE DEMONSTRA[CÇ][AÃ]O|N[AÃ]O IDENTIFICADO)$/i.test(x)?x:''};
 const saved=[cash?.operadorNome,cash?.nomeOperador,cash?.criadoPor,cash?.usuarioAbertura,cash?.abertoPor].map(valid).find(Boolean);
 if(saved)return saved;
 return operatorName(code);
};
// O cadastro de usuários pode estar em outra chave. Não simular validação real de senha.
async function verifyCashPassword(password,user){
 if(!user?.senhaHash||!user.senhaSalt)return false;
 try{return await window.LL_SHA256(user.senhaSalt+':'+password)===user.senhaHash}catch{return false}
}
function authenticate(title,done){
 const overlay=el('div','erp-overlay');const dialog=el('div','erp-dialog cx-dialog');
 const sangriaAuth=title==='IDENTIFICAÇÃO PARA BAIXAR SANGRIA'||title==='IDENTIFICAÇÃO PARA BAIXAR SAÍDA DE CAIXA'||title==='IDENTIFICAÇÃO PARA BAIXAR ENTRADA DE CAIXA'||title==='IDENTIFICAÇÃO PARA ABRIR CAIXA'||title==='IDENTIFICAÇÃO PARA FECHAR CAIXA'||title==='IDENTIFICAÇÃO PARA BAIXAR VENDA'||title==='IDENTIFICAÇÃO PARA BAIXAR TROCA'||title==='IDENTIFICAÇÃO PARA CANCELAR VENDA'||title==='IDENTIFICAÇÃO PARA CANCELAR TROCA'||title==='IDENTIFICAÇÃO PARA ESTORNAR'||title==='IDENTIFICAÇÃO PARA CANCELAR ENTRADA DE CAIXA'||title==='IDENTIFICAÇÃO PARA CANCELAR SAÍDA DE CAIXA'||title==='IDENTIFICAÇÃO PARA CANCELAR SANGRIA';
 if(sangriaAuth){
  dialog.style.cssText='width:min(470px,calc(100vw - 32px));max-width:470px;padding:0;overflow:hidden;border-radius:12px;';
  const header=el('div','',title);
  header.style.cssText='background:#245b98;color:white;font-size:16px;font-weight:800;padding:21px 20px;position:relative;';
  const x=btn('×',()=>overlay.remove());
  x.style.cssText='position:absolute;right:14px;top:12px;border:0;background:transparent;color:white;font-size:25px;cursor:pointer;';
  header.append(x);dialog.append(header);
 }else dialog.append(el('h2','',title));
 const [uw,u]=input('USUÁRIO (CÓDIGO)');u.placeholder='INFORME O CÓDIGO DO OPERADOR';u.autocomplete='off';
 const person=el('div','cx-operator-identity');const personName=el('strong','','INFORME O CÓDIGO DO USUÁRIO');
 const personRole=el('small','','O NOME APARECERÁ AUTOMATICAMENTE');person.append(personName,personRole);
 const [pw,pass]=input('SENHA','password');pass.placeholder='DIGITE SUA SENHA';pass.autocomplete='off';
 const error=el('p','cx-login-error');error.setAttribute('role','alert');
 const note=el('p','cx-note','VALIDAÇÃO LOCAL DOS USUÁRIOS CADASTRADOS. NÃO SUBSTITUI AUTENTICAÇÃO SEGURA EM SERVIDOR.');
 if(sangriaAuth){
  const content=el('div');content.style.cssText='padding:25px 20px 5px;display:flex;flex-direction:column;gap:14px;';
  person.style.cssText='margin:0;padding:12px 14px;background:#e7f0fc;border:1px solid #c3d6f4;border-radius:5px;';
  note.style.cssText='margin:0;font-size:11px;line-height:1.4;color:#58749a;';
  content.append(uw,person,pw,error,note);dialog.append(content);
 }else dialog.append(uw,person,pw,error,note);
 const getUser=()=>{
  const code=u.value.trim();if(!code)return null;
  const data=users();const list=Array.isArray(data)?data:(data.usuarios||[]);
  const registered=list.find(x=>String(Number(x.id))===String(Number(code))&&String(x.situacao||'ATIVO').toUpperCase()==='ATIVO');
  if(registered)return {id:String(registered.id),nome:registered.nome||registered.login||'USUÁRIO',perfil:registered.perfil||'USUÁRIO',record:registered};
  if(code==='300')return {id:'300',nome:'USUÁRIO DE DEMONSTRAÇÃO',perfil:'ACESSO PARA TESTES',record:null};
  return null;
 };
 const update=()=>{const found=getUser();personName.textContent=found?found.nome:'USUÁRIO NÃO ENCONTRADO';personRole.textContent=found?found.perfil:'CONFIRA O CÓDIGO INFORMADO';error.textContent='';pass.value=''};
 u.addEventListener('input',update);
 // ENTER no código avança para a senha; ENTER na senha confirma a identificação.
 u.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
   e.preventDefault();
   const found=getUser();
   if(!found){error.textContent='USUÁRIO NÃO ENCONTRADO OU INATIVO.';u.focus();return}
   pass.focus();
  }
 });
 const proceed=async()=>{
  const found=getUser();if(!found){error.textContent='USUÁRIO NÃO ENCONTRADO OU INATIVO.';pass.value='';u.focus();return}
  if(!pass.value){error.textContent='INFORME A SENHA.';pass.focus();return}
  const ok=found.record?await verifyCashPassword(pass.value,found.record):(found.id==='300'&&pass.value==='123456');
  if(!ok){error.textContent='SENHA INCORRETA. DIGITE NOVAMENTE.';pass.value='';pass.focus();return}
  overlay.remove();done(found.id);
 };
 if(sangriaAuth){
  const footer=el('div');footer.style.cssText='display:flex;justify-content:center;gap:10px;padding:17px 20px 20px;';
  const go=btn('CONTINUAR',proceed);go.style.cssText='background:#1d5ca8;color:white;border:0;border-radius:5px;padding:11px 18px;cursor:pointer;';
  const cancel=btn('CANCELAR',()=>overlay.remove());cancel.style.cssText='background:#c7defb !important;color:#123e76 !important;border:1px solid #7eafe9 !important;border-radius:5px;padding:11px 18px;cursor:pointer;font-weight:700;opacity:1 !important;text-shadow:none !important;';
  footer.append(go,cancel);dialog.append(footer);
 }else line(dialog,btn('CONTINUAR',proceed),btn('CANCELAR',()=>overlay.remove(),'cx-btn-gray'));
 pass.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();proceed()}});
 overlay.append(dialog);document.body.append(overlay);u.focus();
}

// A autorização do cancelamento de uma baixa pertence ao operador que a realizou.
// Se o movimento antigo não guardar operador identificável, não autorizar por suposição.
function llAuthorizePaidCancellation(title,record,originals,proceed,alertFn){
 const owners=[...new Set((originals||[]).map(m=>String(m.operador??'').trim()).filter(Boolean))];
 const recorded=String(record?.operadorBaixa??record?.operador??'').trim();
 if(owners.length!==1||!recorded||owners[0]!==recorded){
  alertFn('NÃO FOI POSSÍVEL IDENTIFICAR COM SEGURANÇA O USUÁRIO RESPONSÁVEL PELA BAIXA. CANCELAMENTO BLOQUEADO.');return;
 }
 authenticate(title,code=>{
  if(String(code)!==recorded){alertFn('CANCELAMENTO NÃO AUTORIZADO. SOMENTE O USUÁRIO QUE REALIZOU A BAIXA PODE CANCELAR.');return}
  proceed(code);
 });
}

function summary(p,c){let row=el('div','cx-summary');const moves=cashMoves(c);const cash=expected(c);
 for(const [label,val,color] of [['SALDO INICIAL',c.inicial,'#fff2c5'],['ENTRADAS EM DINHEIRO',moves.filter(x=>x.tipo==='ENTRADA'&&x.forma==='DINHEIRO').reduce((s,x)=>s+x.valor,0),'#e0f6e8'],['SAÍDAS / SANGRIAS',moves.filter(x=>x.tipo!=='ENTRADA'&&x.forma==='DINHEIRO').reduce((s,x)=>s+x.valor,0),'#fce5e5'],['DINHEIRO ESPERADO',cash,'#e0edff']]){let box=el('div','cx-tile');box.style.background=color;box.append(el('small','',label),el('strong','',fmt(val)));row.append(box)}p.append(row)}
function movements(p,c){p.append(el('h2','','MOVIMENTAÇÕES'));const t=el('table','erp-table');const h=el('tr');['DATA/HORA','TIPO','DESCRIÇÃO','FORMA','VALOR'].forEach(x=>h.append(el('th','',x)));t.append(h);c.movimentos.slice().reverse().forEach(m=>{const tr=el('tr');[new Date(m.data).toLocaleString('pt-BR'),m.estornado?'ESTORNADA':m.tipo,m.descricao,m.forma,fmt(m.valor)].forEach(x=>tr.append(el('td','',x)));t.append(tr)});p.append(t)}
function openCash(){authenticate('IDENTIFICAÇÃO PARA ABRIR CAIXA',code=>{if(activeCash(code)){erpAlert('ESTE OPERADOR JÁ TEM UM CAIXA ABERTO.');return}const p=panel('ABERTURA DE CAIXA');p.querySelector('.cx-shortcuts')?.remove();p.append(el('p','',`OPERADOR: ${operatorName(code)}`));const [w,amount]=input('SALDO INICIAL EM DINHEIRO (R$)','number','0');amount.min='0';amount.step='0.01';p.append(w);const actions=el('div','cx-row cx-opening-actions');p.append(actions);actions.append(btn('CONFIRMAR',()=>{let v=Number(amount.value);if(!Number.isFinite(v)||v<0)return erpAlert('VALOR INVÁLIDO.');caixas.push({id:Math.max(0,...caixas.map(x=>x.id))+1,operador:code,operadorNome:operatorName(code),inicial:v,situacao:'ABERTO',abertura:new Date().toISOString(),movimentos:[]});save();cashScreen();},'cx-btn-blue'));actions.append(btn('CANCELAR',cashScreen,'cx-btn-lightblue'))})}
// Saídas com vínculo único ao Centro de Custos: GRAVAR não movimenta o dinheiro.
const expenseKey='lucas_lima_cc_lancamentos_v2',centerKey='erp_systems_centros_custos_v1';
const expenses=()=>getData(expenseKey,[]);
const centers=()=>getData(centerKey,[]).filter(x=>x.status==='ATIVO');
// Seletor padronizado como o cadastro de marcas: pesquisa manual e duplo clique.
function openCostCenterPicker(onChoose,{all=false}={}){
 const overlay=el('div','erp-overlay cx-center-picker-overlay');overlay.style.zIndex='2147483000';
 const dialog=el('div','cx-cost-picker');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','SELECIONE O CENTRO DE CUSTOS');
 const header=el('div','cx-cost-head');header.append(el('strong','','SELECIONE O CENTRO DE CUSTOS'));
 const close=btn('×',()=>overlay.remove(),'cx-cost-x');header.append(close);dialog.append(header);
 const body=el('div','cx-cost-body');const filters=el('div','cx-cost-filters');
 const typeWrap=el('label','','PESQUISAR POR');const type=el('select');type.append(new Option('DESCRIÇÃO','name'),new Option('CÓDIGO','id'));typeWrap.append(type);
 const queryWrap=el('label','','TEXTO DA PESQUISA');const query=el('input');query.placeholder='DIGITE PARA PESQUISAR...';queryWrap.append(query);
 const search=btn('PESQUISAR',()=>render(),'cx-cost-search');
 const create=btn('+ NOVO',()=>{overlay.remove();window.LL_retornoCentroCustosCaixa=()=>openCostCenterPicker(onChoose,{all});open('CENTRO DE CUSTOS');},'cx-cost-new');
 filters.append(typeWrap,queryWrap,search,create);body.append(filters);
 const table=el('table','cx-cost-table');const head=el('thead');const tr=el('tr');['CÓDIGO','DESCRIÇÃO DO CENTRO DE CUSTOS','SITUAÇÃO'].forEach(t=>tr.append(el('th','',t)));head.append(tr);table.append(head);
 const tbody=el('tbody');table.append(tbody);body.append(table);
 const footer=el('div','cx-cost-footer');footer.append(el('small','','DÊ DOIS CLIQUES PARA SELECIONAR.'));footer.append(btn('CANCELAR',()=>overlay.remove(),'cx-cost-cancel'));body.append(footer);dialog.append(body);overlay.append(dialog);
 function render(){tbody.replaceChildren();const q=query.value.trim().toLocaleUpperCase('pt-BR');const data=centers().map(x=>({id:String(x.id),name:String(x.name||''),status:'ATIVO'}));if(all)data.unshift({id:'',name:'TODOS',status:'ATIVO'});
 const items=data.filter(x=>!q||(type.value==='id'?x.id.includes(q):x.name.toLocaleUpperCase('pt-BR').includes(q)));
 if(!items.length){const r=el('tr');const td=el('td','','NENHUM CENTRO DE CUSTOS ATIVO ENCONTRADO.');td.colSpan=3;r.append(td);tbody.append(r);return}
 items.forEach(x=>{const r=el('tr');const code=el('td','',x.id?x.id.padStart(6,'0'):'—');const name=el('td','',x.name);const status=el('td');status.append(el('span','cx-cost-active','ATIVO'));r.append(code,name,status);r.addEventListener('dblclick',()=>{onChoose(x);overlay.remove()});tbody.append(r)});
 }
 overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);render();query.focus();
}
function register(c,tipo){
 if(tipo!=='SAÍDA')return registerSimple(c,tipo);
 // Avisos desta tela seguem a janela VALIDAÇÃO do Cadastro de Produtos.
 const erpAlert=(message)=>{
  const overlay=document.createElement('div');
  overlay.className='cx-saida-validation-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(8,26,57,.64);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  const dialog=document.createElement('section');
  dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','VALIDAÇÃO');
  dialog.style.cssText='width:min(475px,100%);background:#fff;color:#183a66;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px #08172d66;font:14px Arial,sans-serif';
  const header=document.createElement('header');
  header.style.cssText='background:#18579c;color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;font-size:16px;font-weight:700';
  const heading=document.createElement('strong');heading.textContent='▣ VALIDAÇÃO';
  const x=document.createElement('button');x.type='button';x.textContent='×';x.setAttribute('aria-label','Fechar');x.style.cssText='border:0;background:transparent;color:white;font-size:24px;cursor:pointer';
  header.append(heading,x);
  const body=document.createElement('div');body.style.cssText='padding:24px 22px 18px;line-height:1.6;min-height:66px;box-sizing:border-box;text-align:left';body.textContent=String(message);
  const footer=document.createElement('footer');footer.style.cssText='display:flex;justify-content:center;padding:12px 20px 22px';
  const ok=document.createElement('button');ok.type='button';ok.textContent='OK';ok.style.cssText='background:#175aa2;color:white;border:0;border-radius:6px;padding:10px 23px;font-weight:bold;cursor:pointer';footer.append(ok);
  dialog.append(header,body,footer);overlay.append(dialog);
  const close=()=>{document.removeEventListener('keydown',onKey,true);overlay.remove()};
  const onKey=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();close()}};
  x.onclick=close;ok.onclick=close;overlay.onclick=e=>{if(e.target===overlay)close()};
  document.body.append(overlay);document.addEventListener('keydown',onKey,true);ok.focus();
 };

 const p=panel('SAÍDA DE CAIXA');p.classList.add('cx-expense-sales-size');summary(p,c);
 const title=el('div','cx-section-title','DADOS DA DESPESA');p.append(title);
 const form=el('div','cx-expense-form');p.append(form);
 const [nw,num]=input('Nº SAÍDA','text',String(Math.max(0,...expenses().filter(x=>x.origem==='SAÍDA DE CAIXA').map(x=>Number(x.numeroSaida)||0))+1).padStart(6,'0'));num.readOnly=true;
 const [dtw,date]=input('DATA','date',new Date().toLocaleDateString('en-CA'));
 const [ow,op]=input('USUÁRIO','text',connectedUser()?.nome||'NÃO IDENTIFICADO');op.readOnly=true;op.title='CLIQUE PARA VISUALIZAR O HISTÓRICO DO OPERADOR';op.classList.add('cx-operator-clickable');
 op.title='CLIQUE PARA VISUALIZAR O HISTÓRICO DE ALTERAÇÕES';
 op.addEventListener('click',()=>{
  const x=current(),history=Array.isArray(x?.historico)?x.historico:[];
  const overlay=el('div','');overlay.style.cssText='position:fixed;inset:0;background:rgba(9,29,58,.62);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
  const dialog=el('div','');dialog.style.cssText='box-sizing:border-box;width:440px;max-width:100%;background:#fff;color:#17457c;border-radius:12px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.22);font-family:Arial,sans-serif;';
  const heading=el('div','','HISTÓRICO DE ALTERAÇÕES');heading.style.cssText='background:#194b89;color:white;font-size:17px;font-weight:800;padding:16px;line-height:20px;';
  const body=el('div','');body.style.cssText='padding:26px 16px 4px;box-sizing:border-box;';
  const last=history[history.length-1];const lastUser=last?.usuario||(x?.operador?operatorName(x.operador):connectedUser()?.nome)||'NÃO IDENTIFICADO';
  const title=el('div','');title.style.cssText='font-size:16px;line-height:23px;margin:0 0 22px;';
  const bold=el('strong','','ÚLTIMO USUÁRIO: ');title.append(bold,document.createTextNode(String(lastUser).toUpperCase()));body.append(title);
  if(!x){const note=el('div','','GRAVE OU LOCALIZE UMA SAÍDA PARA VISUALIZAR SEU HISTÓRICO.');note.style.cssText='color:#667d9a;font-size:12px;line-height:18px;';body.append(note)}
  else if(!history.length){const note=el('div','','NENHUMA AÇÃO REGISTRADA NESTA SAÍDA.');note.style.cssText='color:#667d9a;font-size:12px;';body.append(note)}
  else history.forEach(h=>{
   const line=el('div','');line.style.cssText='border-bottom:1px solid #d4e0ef;padding:0 0 14px;margin-bottom:14px;';
   const action=String(h.acao||'ALTERAÇÃO').toUpperCase().replace('GRAVAÇÃO','CADASTRO');
   const who=el('div','');who.style.cssText='font-size:15px;line-height:20px;';
   const label=el('strong','',action+' — ');who.append(label,document.createTextNode(String(h.usuario||'NÃO IDENTIFICADO').toUpperCase()));
   const when=el('div','',String(h.data||''));when.style.cssText='font-size:12px;color:#667d9a;margin-top:3px;';line.append(who,when);body.append(line);
  });
  const footer=el('div','');footer.style.cssText='display:flex;justify-content:flex-end;padding:24px 20px 18px;';
  const close=btn('FECHAR',()=>overlay.remove(),'');close.style.cssText='background:#1955a0;color:white;border:0;border-radius:5px;padding:10px 19px;font-weight:700;cursor:pointer;';
  footer.append(close);dialog.append(heading,body,footer);overlay.append(dialog);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
 });
 const [dw,desc]=input('DESCRIÇÃO DA DESPESA');
 const [cw,center]=input('CENTRO DE CUSTOS','text','SELECIONE');center.readOnly=true;center.classList.add('cx-center-display');
 const select=el('select');select.style.display='none';
 const refreshCenters=()=>{const old=select.value;select.replaceChildren(new Option('SELECIONE',''));centers().forEach(x=>select.append(new Option(x.name,x.id)));select.value=[...select.options].some(o=>o.value===old)?old:'';center.value=select.selectedOptions[0]?.textContent||'SELECIONE'};
 refreshCenters();
 const centerRow=el('div','cx-center-select-row');const plus=btn('+',()=>{
  if(plus.disabled)return;
  refreshCenters();
  openCostCenterPicker(x=>{refreshCenters();select.value=String(x.id);center.value=x.name});
 },'cx-center-plus');plus.title='SELECIONAR CENTRO DE CUSTOS';centerRow.append(center,plus);cw.append(centerRow);
 const [vw,value]=input('VALOR (R$)','number');value.min='0.01';value.step='0.01';
 const [sw,status]=input('SITUAÇÃO','text','PENDENTE');status.readOnly=true;
 form.append(nw,dtw,ow,dw,cw,vw,sw);
 const buttons=el('div','cx-expense-buttons');p.append(buttons);
 let currentId=null;
 const current=()=>expenses().find(x=>String(x.id)===String(currentId)&&x.origem==='SAÍDA DE CAIXA');
 const update=()=>{const x=current();op.value=connectedUser()?.nome||'NÃO IDENTIFICADO';status.value=x?.status==='CANCELADO'?'CANCELADA':x?.status==='BAIXADO'?'BAIXADA':x?.status||'PENDENTE';if(x){num.value=String(x.numeroSaida).padStart(6,'0');date.value=x.data;desc.value=x.descricao;select.value=x.centro;center.value=select.selectedOptions[0]?.textContent||'SELECIONE';value.value=x.valor;}desc.disabled=select.disabled=value.disabled=date.disabled=plus.disabled=!!x&&x.status!=='PENDENTE'};
 const validate=()=>{const amount=Number(value.value);if(!desc.value.trim()||!select.value||!(amount>0)||!date.value){erpAlert('INFORME DATA, DESCRIÇÃO, CENTRO DE CUSTOS E VALOR VÁLIDO.');return false}return true};
 const gravar=()=>{if(!validate())return;let all=expenses(),x=current();if(x)return erpAlert('ESTA SAÍDA JÁ FOI GRAVADA. UTILIZE O BOTÃO ALTERAR PARA EDITAR UM LANÇAMENTO PENDENTE.');if(!x){x={id:Math.max(0,...all.map(y=>Number(y.id)||0))+1,numeroSaida:Number(num.value),origem:'SAÍDA DE CAIXA',caixaId:c.id,operador:c.operador,status:'PENDENTE',historico:[]};all.push(x)}Object.assign(x,{data:date.value,descricao:desc.value.trim().toUpperCase(),centro:select.value,valor:Number(value.value),usuario:connectedUser()?.nome||operatorName(c.operador),gerarCP:false});x.historico.push({acao:'GRAVAÇÃO',usuario:x.usuario,data:new Date().toLocaleString('pt-BR')});try{localStorage.setItem(expenseKey,JSON.stringify(all))}catch{return erpAlert('NÃO FOI POSSÍVEL GRAVAR A DESPESA.')};currentId=x.id;update();erpAlert('DESPESA PENDENTE GRAVADA. AINDA NÃO FOI DESCONTADA DO CAIXA.')};
 const alterar=()=>{
  const x=current();
  if(!x)return erpAlert('LOCALIZE UMA SAÍDA PENDENTE PARA ALTERAR.');
  if(x.status!=='PENDENTE')return erpAlert('SOMENTE SAÍDAS PENDENTES PODEM SER ALTERADAS.');
  if(!validate())return;
  const all=expenses(),target=all.find(y=>String(y.id)===String(x.id)&&y.origem==='SAÍDA DE CAIXA');
  if(!target||target.status!=='PENDENTE')return erpAlert('SOMENTE SAÍDAS PENDENTES PODEM SER ALTERADAS.');
  const previous=JSON.stringify(target);
  Object.assign(target,{data:date.value,descricao:desc.value.trim().toUpperCase(),centro:select.value,valor:Number(value.value)});
  target.historico=Array.isArray(target.historico)?target.historico:[];
  target.historico.push({acao:'ALTERAÇÃO',usuario:connectedUser()?.nome||operatorName(c.operador),data:new Date().toLocaleString('pt-BR')});
  try{localStorage.setItem(expenseKey,JSON.stringify(all))}
  catch{Object.assign(target,JSON.parse(previous));return erpAlert('NÃO FOI POSSÍVEL ALTERAR A SAÍDA.')}
  update();erpAlert('LANÇAMENTO ALTERADO COM SUCESSO.');
 };
 const baixar=()=>{
  const selected=current();
  if(!selected)return erpAlert('GRAVE A DESPESA ANTES DE BAIXAR.');
  if(selected.status!=='PENDENTE')return erpAlert('A DESPESA NÃO ESTÁ PENDENTE.');
  authenticate('IDENTIFICAÇÃO PARA BAIXAR SAÍDA DE CAIXA',code=>{
   const caixaOperador=activeCash(code);
   if(!caixaOperador)return erpAlert('ESTE USUÁRIO NÃO POSSUI CAIXA ABERTO.');
   const all=expenses(),x=all.find(y=>String(y.id)===String(selected.id)&&y.origem==='SAÍDA DE CAIXA');
   if(!x||x.status!=='PENDENTE')return erpAlert('A DESPESA NÃO ESTÁ PENDENTE.');
   if(Number(x.valor)>expected(caixaOperador))return erpAlert('DINHEIRO INSUFICIENTE NO CAIXA DO USUÁRIO.');
   if(caixaOperador.movimentos.some(m=>String(m.ccLancamentoId)===String(x.id)&&!m.estornado))return erpAlert('ESTA DESPESA JÁ FOI REGISTRADA NO CAIXA.');
   const movement={tipo:'SAÍDA',categoria:'SAÍDA',descricao:x.descricao,valor:Number(x.valor),forma:'DINHEIRO',data:new Date().toISOString(),ccLancamentoId:x.id,operador:code};
   const previous={status:x.status,caixaId:x.caixaId,operador:x.operador};
   x.status='BAIXADA';x.caixaId=caixaOperador.id;x.operador=code;
   x.historico=x.historico||[];
   x.historico.push({acao:'BAIXA',usuario:operatorName(code),data:new Date().toLocaleString('pt-BR'),caixaId:caixaOperador.id});
   try{
    caixaOperador.movimentos.push(movement);
    localStorage.setItem(expenseKey,JSON.stringify(all));
    save();
   }catch(err){
    caixaOperador.movimentos=caixaOperador.movimentos.filter(m=>m!==movement);
    x.historico.pop();Object.assign(x,previous);
    try{localStorage.setItem(expenseKey,JSON.stringify(all));save()}catch{}
    return erpAlert('FALHA AO REGISTRAR A BAIXA. VERIFIQUE O ARMAZENAMENTO.');
   }
   update();erpAlert('DESPESA BAIXADA COM SUCESSO.');
  });
 };
 const cancelar=()=>{
  const currentExpense=current();if(!currentExpense)return erpAlert('GRAVE A DESPESA PRIMEIRO.');
  if(['CANCELADO','CANCELADA'].includes(currentExpense.status))return erpAlert('ESTA OPERAÇÃO JÁ ESTÁ CANCELADA E NÃO PODE SER CANCELADA NOVAMENTE.');
  const paid=['BAIXADO','BAIXADA'].includes(currentExpense.status);
  const caixaBaixa=caixas.find(k=>String(k.id)===String(currentExpense.caixaId));
  const originals=paid?(caixaBaixa?.movimentos||[]).filter(m=>String(m.ccLancamentoId)===String(currentExpense.id)&&!m.estornado):[];
  const execute=code=>{
   const all=expenses(),x=all.find(y=>String(y.id)===String(currentExpense.id)&&y.origem==='SAÍDA DE CAIXA');
   if(!x||['CANCELADO','CANCELADA'].includes(x.status))return erpAlert('ESTA OPERAÇÃO JÁ ESTÁ CANCELADA E NÃO PODE SER CANCELADA NOVAMENTE.');
   if(paid&&!['BAIXADO','BAIXADA'].includes(x.status))return erpAlert('A SITUAÇÃO DA OPERAÇÃO MUDOU.');
   if(!paid&&x.status!=='PENDENTE')return erpAlert('A SITUAÇÃO DA OPERAÇÃO MUDOU.');
   const target=caixas.find(k=>String(k.id)===String(x.caixaId));
   const active=paid?(target?.movimentos||[]).filter(m=>String(m.ccLancamentoId)===String(x.id)&&!m.estornado):[];
   const reversals=paid?(target?.movimentos||[]).filter(m=>String(m.estornoCcLancamentoId)===String(x.id)&&!m.estornado):[];
   if(paid&&(!target||active.length!==1||reversals.length||String(active[0].operador)!==String(code)))return erpAlert('MOVIMENTAÇÃO DE BAIXA INVÁLIDA OU JÁ ESTORNADA. CANCELAMENTO BLOQUEADO.');
   const reversal=paid?{tipo:'ENTRADA',categoria:'ESTORNO DE SAÍDA',descricao:'ESTORNO: '+x.descricao,valor:Number(active[0].valor),forma:active[0].forma||'DINHEIRO',data:new Date().toISOString(),estornoCcLancamentoId:x.id,operador:code}:null;
   const old=JSON.stringify(x);x.status='CANCELADA';x.historico??=[];x.historico.push({acao:'CANCELAMENTO',usuario:operatorName(code||connectedUser()?.id||x.operador),data:new Date().toLocaleString('pt-BR')});
   if(reversal)target.movimentos.push(reversal);
   try{localStorage.setItem(expenseKey,JSON.stringify(all));if(reversal)save()}
   catch(err){Object.assign(x,JSON.parse(old));if(reversal)target.movimentos=target.movimentos.filter(m=>m!==reversal);try{localStorage.setItem(expenseKey,JSON.stringify(all))}catch{}return erpAlert('FALHA AO CANCELAR: '+err.message)}
   update();erpAlert(paid?'DESPESA CANCELADA. ESTORNO REGISTRADO.':'DESPESA PENDENTE CANCELADA SEM ESTORNO.');
  };
  if(paid)return llAuthorizePaidCancellation('IDENTIFICAÇÃO PARA CANCELAR SAÍDA DE CAIXA',currentExpense,originals,execute,erpAlert);
  execute(null);
 };
 const reabrir=()=>{const all=expenses(),x=all.find(y=>y.id===currentId);if(!x||!['CANCELADO','CANCELADA'].includes(x.status))return erpAlert('SOMENTE DESPESA CANCELADA PODE SER REABERTA.');x.status='PENDENTE';x.historico.push({acao:'REABERTURA',usuario:x.usuario,data:new Date().toLocaleString('pt-BR')});localStorage.setItem(expenseKey,JSON.stringify(all));update()};
 const novo=()=>{currentId=null;num.value=String(Math.max(0,...expenses().filter(x=>x.origem==='SAÍDA DE CAIXA').map(x=>Number(x.numeroSaida)||0))+1).padStart(6,'0');date.value=new Date().toLocaleDateString('en-CA');desc.value='';select.value='';center.value='SELECIONE';value.value='';update()};
 const print=()=>{
  const x=current();if(!x)return erpAlert('GRAVE A SAÍDA PARA IMPRIMIR.');
  const esc=t=>String(t??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const store=typeof getData==='function'?getData('lucas_lima_loja',{}):{};
  const company=store?.nomeFantasia||store?.nome||'LUCAS LIMA';
  const centroNome=centers().find(y=>String(y.id)===String(x.centro))?.name||'—';
  const emitted=()=>`EMITIDO EM ${new Date().toLocaleDateString('pt-BR')}, POR ${(connectedUser()?.nome||'USUÁRIO').toUpperCase()}.`;
  const overlay=el('div','erp-overlay');overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(8,28,57,.6);display:flex;align-items:center;justify-content:center;padding:16px';
  const modal=el('div');modal.style.cssText='background:white;width:min(1100px,96vw);max-height:90vh;overflow:auto;border-radius:12px;color:#113d75;font:13px Arial,sans-serif';
  const head=el('div');head.style.cssText='background:#164a8c;color:white;padding:20px 22px;display:flex;justify-content:space-between;align-items:center;font-weight:bold;font-size:17px';head.append(el('span','','IMPRIMIR SAÍDA DE CAIXA'));
  const xbtn=el('button','','×');xbtn.style.cssText='background:transparent;color:white;border:0;font-size:25px;cursor:pointer';xbtn.onclick=()=>overlay.remove();head.append(xbtn);
  const columns=el('div');columns.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px';
  const left=el('section'),right=el('section');[left,right].forEach(a=>a.style.cssText='border:1px solid #d3e0ef;border-radius:7px;padding:14px;min-width:0');
  const sectionTitle=(t)=>{const e=el('h3','',t);e.style.cssText='background:#e8f2ff;padding:12px;margin:0 0 12px;font-size:13px;color:#084584';return e};
  left.append(sectionTitle('DADOS DA SAÍDA SELECIONADA'));
  const info=el('div');info.style.cssText='background:#eaf2fd;padding:15px;line-height:2;border-radius:6px';info.textContent=`Nº ${String(x.numeroSaida).padStart(6,'0')} — ${x.descricao||'—'} | ${fmt(x.valor)} | ${x.status}`;left.append(info,sectionTitle('TIPO DE IMPRESSÃO'));
  const typ=el('div');typ.innerHTML='<label style="display:block;margin:10px 0"><input type="radio" name="sangria-print-type" value="completo" checked> COMPROVANTE COMPLETO</label><label style="display:block;margin:10px 0"><input type="radio" name="sangria-print-type" value="simples"> COMPROVANTE SIMPLIFICADO</label>';left.append(typ,sectionTitle('OPÇÕES ADICIONAIS'));
  const opt=el('label');opt.style.cssText='display:block;margin:12px 0';opt.innerHTML='<input type="checkbox" id="sangria-history-print"> INCLUIR HISTÓRICO';left.append(opt);
  const label=el('label','','ORIENTAÇÃO');label.style.cssText='display:block;font-weight:bold;margin-top:12px';const orientation=el('select');orientation.style.cssText='display:block;width:100%;padding:10px;margin-top:7px;border:1px solid #b7cde9;border-radius:5px';orientation.innerHTML='<option value="portrait">RETRATO</option><option value="landscape">PAISAGEM</option>';label.append(orientation);left.append(label);
  right.append(sectionTitle('PRÉ-VISUALIZAÇÃO A4'));const preview=el('div');preview.style.cssText='background:white;border:1px solid #c6d5e7;padding:18px;height:370px;overflow:auto;color:#153e72';right.append(preview);
  columns.append(left,right);const foot=el('div');foot.style.cssText='display:flex;justify-content:flex-end;gap:10px;padding:0 16px 16px';
  const makeBtn=(name,bg,fg)=>{const b=el('button','',name);b.style.cssText=`background:${bg};color:${fg};border:1px solid #b4c9e4;border-radius:5px;padding:12px 18px;font-weight:bold;cursor:pointer`;foot.append(b);return b};
  const print=makeBtn('IMPRIMIR','#1763c4','white'),save=makeBtn('SALVAR','#079d79','white'),close=makeBtn('FECHAR','#e8f1ff','#12467f');close.onclick=()=>overlay.remove();
  const render=()=>{const full=typ.querySelector('input:checked').value==='completo';const row=(k,v)=>`<div style="padding:8px 0"><b>${esc(k)}</b><div>${esc(v)}</div></div>`;let doc=`<div style="display:flex;justify-content:space-between;gap:15px;border-bottom:1px solid #d7e0ed;padding-bottom:14px"><b style="font-size:19px">${esc(company)}</b><b>SAÍDA DE CAIXA<br>Nº ${esc(String(x.numeroSaida).padStart(6,'0'))}</b></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 15px">${row('DATA',x.data)}${row('SITUAÇÃO',x.status)}${row('CAIXA DE ORIGEM',x.caixaId||'—')}${row('CENTRO DE CUSTOS',centroNome)}${row('DESCRIÇÃO',x.descricao)}${full?row('USUÁRIO',x.usuario||operatorName(x.operador)):''}</div><div style="background:#eaf2fd;padding:15px;margin:15px 0;font-size:17px;font-weight:bold">VALOR DA SAÍDA: ${esc(fmt(x.valor))}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;text-align:center;margin-top:70px"><div style="border-top:1px solid #777;padding-top:8px">Operador do caixa</div><div style="border-top:1px solid #777;padding-top:8px">Responsável / Recebedor</div></div>`;if(opt.querySelector('input').checked)doc+=`<h3>HISTÓRICO DE ALTERAÇÕES</h3>${(x.historico||[]).map(h=>row(h.acao,`${h.usuario||''} — ${h.data||''}`)).join('')}`;doc+=`<div style="text-align:right;font-size:10px;margin-top:40px">${esc(emitted())}</div>`;preview.innerHTML=doc;return doc};
  const receiptHtml=()=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>SAÍDA ${esc(x.numeroSaida)}</title><style>@page{size:A4 ${orientation.value};margin:16mm}body{font:12px Arial,sans-serif;color:#153e72;margin:0}*{box-sizing:border-box} @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${render()}</body></html>`;
  print.onclick=()=>{
   // A impressão é feita em um iframe oculto: não abre pop-up nem imprime o ERP.
   const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';document.body.append(frame);
   frame.onload=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(err){erpAlert('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO: '+err.message)}setTimeout(()=>frame.remove(),60000)};
   frame.srcdoc=receiptHtml();
  };
  save.onclick=async()=>{
   // Gera um PDF real localmente; nunca depende de pop-ups.
   const filename='SAIDA_CAIXA_'+String(x.numeroSaida).padStart(6,'0')+'.pdf';
   try{
    const landscape=orientation.value==='landscape',w=landscape?1123:794,h=landscape?794:1123;
    const canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=h*2;
    const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle='white';ctx.fillRect(0,0,w,h);ctx.fillStyle='#153e72';
    const margin=65;let y=75;const line=(key,value)=>{ctx.font='bold 14px Arial';ctx.fillText(key,margin,y);ctx.font='14px Arial';ctx.fillText(String(value??'—'),margin,y+22);y+=65};
    ctx.font='bold 23px Arial';ctx.fillText(company,margin,y);ctx.textAlign='right';ctx.font='bold 17px Arial';ctx.fillText('SAÍDA DE CAIXA Nº '+String(x.numeroSaida).padStart(6,'0'),w-margin,y);ctx.textAlign='left';y+=55;
    ctx.strokeStyle='#d7e0ed';ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(w-margin,y);ctx.stroke();y+=42;
    line('DATA',x.data);line('SITUAÇÃO',x.status);line('CAIXA DE ORIGEM',x.caixaId||'—');line('CENTRO DE CUSTOS',centroNome);line('DESCRIÇÃO',x.descricao);
    if(typ.querySelector('input:checked').value==='completo')line('USUÁRIO',x.usuario||operatorName(x.operador));
    ctx.fillStyle='#eaf2fd';ctx.fillRect(margin,y,w-margin*2,52);ctx.fillStyle='#153e72';ctx.font='bold 19px Arial';ctx.fillText('VALOR DA SAÍDA: '+fmt(x.valor),margin+15,y+33);y+=120;
    ctx.strokeStyle='#777';ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(w/2-25,y);ctx.moveTo(w/2+25,y);ctx.lineTo(w-margin,y);ctx.stroke();ctx.font='12px Arial';ctx.fillText('Operador do caixa',margin+10,y+22);ctx.fillText('Responsável / Recebedor',w/2+35,y+22);y+=70;
    if(opt.querySelector('input').checked){ctx.font='bold 14px Arial';ctx.fillText('HISTÓRICO DE ALTERAÇÕES',margin,y);y+=24;ctx.font='12px Arial';for(const item of (x.historico||[])){if(y>h-110)break;ctx.fillText([item.acao,item.usuario,item.data].filter(Boolean).join(' — '),margin,y);y+=22}}
    ctx.textAlign='right';ctx.font='11px Arial';ctx.fillText(emitted(),w-margin,h-50);
    const jpeg=atob(canvas.toDataURL('image/jpeg',.92).split(',')[1]);const bytes=Uint8Array.from(jpeg,c=>c.charCodeAt(0));const enc=new TextEncoder();const parts=[];const offsets=[0];let length=0;const add=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length};const obj=(n,v)=>{offsets[n]=length;add(n+' 0 obj\n'+v+'\nendobj\n')};
    add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');const pw=landscape?841.89:595.28,ph=landscape?595.28:841.89;
    obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');const cmd=`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q\n`;obj(5,`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`);const start=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`);
    const blob=new Blob(parts,{type:'application/pdf'});
    if(typeof window.showSaveFilePicker==='function'){try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const stream=await handle.createWritable();await stream.write(blob);await stream.close();return}catch(e){if(e.name==='AbortError')return;if(e.name!=='SecurityError'&&e.name!=='NotAllowedError')throw e}}
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
   }catch(err){erpAlert('NÃO FOI POSSÍVEL SALVAR O PDF: '+err.message)}
  };
  typ.querySelectorAll('input').forEach(e=>e.onchange=render);opt.querySelector('input').onchange=render;orientation.onchange=render;
  modal.append(head,columns,foot);overlay.append(modal);document.body.append(overlay);render();
 };
 // Identifica a tela para priorizar F1 antes dos atalhos globais.
 p.setAttribute('data-ll-saida-caixa-active','1');
 // Atalhos exclusivos desta tela, seguindo o modelo de TROCAS.
 const showShortcutModal=()=>{
  const overlay=el('div','erp-overlay cx-shortcut-overlay');
  const dialog=el('div','cx-shortcut-dialog');
  const header=el('div','cx-shortcut-head');header.append(el('strong','','⌂ ATALHOS — ▣ SAÍDA DE CAIXA'));
  const closeX=btn('×',()=>overlay.remove(),'cx-shortcut-x');header.append(closeX);dialog.append(header);
  const body=el('div','cx-shortcut-body');
  [['F1','Abrir esta janela de atalhos'],['F2','Baixar saída de caixa'],['F3','Cancelar saída de caixa'],['F12','Localizar saída pelo número']].forEach(([key,description])=>{const row=el('div','cx-shortcut-line');row.append(el('span','cx-shortcut-key',key),el('span','',description));body.append(row)});
  dialog.append(body);const footer=el('div','cx-shortcut-footer');footer.append(btn('FECHAR',()=>overlay.remove(),'cx-shortcut-close'));dialog.append(footer);overlay.append(dialog);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
 };
 const findExpense=()=>{
  const overlay=el('div','erp-overlay cx-shortcut-overlay'),dialog=el('div','cx-shortcut-dialog');
  const header=el('div','cx-shortcut-head');header.append(el('strong','','▣ LOCALIZAR SAÍDA DE CAIXA — F12'),btn('×',()=>overlay.remove(),'cx-shortcut-x'));dialog.append(header);
  const body=el('div','cx-shortcut-body');body.style.cssText='padding:22px 20px 14px';
  body.append(el('p','','Informe o número da saída de caixa.'));
  const label=el('label','','NÚMERO DA SAÍDA');label.style.cssText='display:block;font-weight:700;font-size:12px;margin:15px 0 5px';
  const field=document.createElement('input');field.type='text';field.inputMode='numeric';field.autocomplete='off';field.placeholder='DIGITE O NÚMERO...';
  field.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #b5cbea;border-radius:6px;font-size:15px';
  const msg=el('div','');msg.style.cssText='color:#b42318;font-size:12px;min-height:18px;margin-top:7px';
  body.append(label,field,msg);
  const actions=el('div','');actions.style.cssText='display:flex;justify-content:center;gap:10px;margin:19px 0 0';
  const searchBtn=btn('LOCALIZAR',()=>{
   const q=field.value.trim();
   if(!/^\d+$/.test(q)){msg.textContent='INFORME UM NÚMERO DE SAÍDA VÁLIDO.';field.focus();return}
   const found=expenses().find(x=>x.origem==='SAÍDA DE CAIXA'&&String(x.caixaId)===String(c.id)&&String(Number(x.numeroSaida))===String(Number(q)));
   if(!found){msg.textContent='SAÍDA Nº '+q+' NÃO ENCONTRADA.';field.focus();return}
   currentId=found.id;refreshCenters();overlay.remove();update();num.focus();
  },'cx-shortcut-close');searchBtn.style.cssText='min-width:110px';
  const cancelBtn=btn('CANCELAR',()=>overlay.remove(),'cx-modern-btn');cancelBtn.style.cssText='background:#eef4fd;color:#174a87;border:1px solid #b5cbea;min-width:110px';
  actions.append(searchBtn,cancelBtn);body.append(actions);dialog.append(body);overlay.append(dialog);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
  field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchBtn.click()}else if(e.key==='Escape'){e.preventDefault();overlay.remove()}});
  field.addEventListener('input',()=>{msg.textContent=''});field.focus();
 };
 const shortcutButton=p.querySelector('.cx-shortcuts');if(shortcutButton){shortcutButton.textContent='⌂ ATALHOS';shortcutButton.onclick=showShortcutModal}
 // F1 em captura: abre somente os atalhos da Saída de Caixa, mesmo com outros módulos carregados.
 const expenseF1Capture=e=>{
  if(!p.isConnected){document.removeEventListener('keydown',expenseF1Capture,true);return}
  if(e.key!=='F1'||e.altKey||e.ctrlKey||e.metaKey)return;
  if(document.querySelector('.cx-shortcut-overlay')||document.querySelector('.erp-overlay'))return;
  e.preventDefault();e.stopImmediatePropagation();
  if(!e.repeat)showShortcutModal();
 };
 document.addEventListener('keydown',expenseF1Capture,true);

 const handleShortcuts=e=>{
  if(!p.isConnected){document.removeEventListener('keydown',handleShortcuts);return}
  if(!['F1','F2','F3','F12'].includes(e.key))return;
  if(document.querySelector('.erp-overlay'))return;
  e.preventDefault();
  if(e.key==='F1')showShortcutModal();else if(e.key==='F2')baixar();else if(e.key==='F3')cancelar();else findExpense();
 };
 document.addEventListener('keydown',handleShortcuts);
 buttons.append(btn('NOVO',novo,'cx-btn-green'),btn('GRAVAR',gravar),btn('ALTERAR',alterar,'cx-btn-yellow'),btn('BAIXAR',baixar,'cx-btn-green'),btn('CANCELAR',cancelar,'cx-btn-red'),btn('IMPRIMIR',print,'cx-btn-gray'),btn('VOLTAR',cashScreen,'cx-btn-red'));

 // PESQUISA DE SAÍDAS: filtros em uma única linha; consulta somente após PESQUISAR.
 const searchSection=el('section','cx-expense-search');
 searchSection.append(el('div','cx-section-title','PESQUISA DE SAÍDAS DE CAIXA'));
 const searchFields=el('div','cx-expense-search-row');
 const [fromWrap,fromDate]=input('DATA INICIAL','date');
 const [toWrap,toDate]=input('DATA FINAL','date');
 const [centerWrap,centerDisplay]=input('CENTRO DE CUSTOS','text','TODOS');
 centerDisplay.readOnly=true;
 const centerPicker=el('div','cx-center-select-row');
 let selectedCenter='';
 const searchPlus=btn('+',()=>{
  openCostCenterPicker(x=>{selectedCenter=String(x.id);centerDisplay.value=x.name},{all:true});
 },'cx-center-plus');
 searchPlus.title='SELECIONAR CENTRO DE CUSTOS';
 centerPicker.append(centerDisplay,searchPlus);centerWrap.append(centerPicker);
 const searchButton=btn('PESQUISAR',()=>showSearchResults(),'cx-search-submit');
 searchFields.append(fromWrap,toWrap,centerWrap,searchButton);searchSection.append(searchFields);
 const results=el('div','cx-expense-search-results');searchSection.append(results);
 p.append(searchSection);
 const formatDate=d=>{if(!d)return '—';const parts=String(d).split('-');return parts.length===3?parts.reverse().join('/'):d};
 const showSearchResults=()=>{
  results.replaceChildren();
  if(fromDate.value&&toDate.value&&fromDate.value>toDate.value){erpAlert('DATA INICIAL NÃO PODE SER MAIOR QUE A DATA FINAL.');return}
  const all=expenses().filter(x=>x.origem==='SAÍDA DE CAIXA')
   .filter(x=>!fromDate.value||x.data>=fromDate.value)
   .filter(x=>!toDate.value||x.data<=toDate.value)
   .filter(x=>!selectedCenter||String(x.centro)===selectedCenter)
   .sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))||Number(b.numeroSaida)-Number(a.numeroSaida));
  const table=el('table','cx-dash-table cx-expense-results-table');
  const header=el('tr');['Nº','DATA','DESCRIÇÃO','CENTRO DE CUSTOS','VALOR (R$)','SITUAÇÃO'].forEach(t=>header.append(el('th','',t)));
  const thead=el('thead');thead.append(header);table.append(thead);
  const tbody=el('tbody');table.append(tbody);
  all.forEach(x=>{
   const tr=el('tr');tr.tabIndex=0;tr.title='DUPLO CLIQUE PARA ABRIR A SAÍDA';
   const centerName=centers().find(y=>String(y.id)===String(x.centro))?.name||'—';
   [String(x.numeroSaida).padStart(6,'0'),formatDate(x.data),x.descricao||'',centerName,fmt(x.valor),x.status||''].forEach(v=>tr.append(el('td','',String(v))));
   const open=()=>{if(String(x.caixaId)!==String(c.id)){erpAlert('ESTA SAÍDA PERTENCE A OUTRO CAIXA. ABRA O CAIXA CORRESPONDENTE PARA EDITÁ-LA.');return}currentId=x.id;refreshCenters();update();num.focus();};
   tr.addEventListener('dblclick',open);tr.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();open()}});
   tbody.append(tr);
  });
  results.append(table);
  if(!all.length)results.append(el('p','cx-note','NENHUMA SAÍDA ENCONTRADA PARA OS FILTROS INFORMADOS.'));
 };
}

const entryKey='lucas_lima_caixa_entradas_v1';
const entries=()=>getData(entryKey,[]);
function registerEntry(c){
 // Mesmas mensagens de validação da Sangria de Caixa.
 const erpAlert=(message)=>{
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(5,25,54,.62);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  const modal=document.createElement('div');
  modal.style.cssText='width:475px;max-width:100%;background:white;border-radius:12px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.24);color:#173e70;font-family:Arial,sans-serif';
  const header=document.createElement('div');
  header.style.cssText='height:60px;background:#195494;color:white;display:flex;align-items:center;justify-content:space-between;padding:0 20px;box-sizing:border-box;font-size:16px;font-weight:700';
  const label=document.createElement('span');label.textContent='▣ VALIDAÇÃO';
  const x=document.createElement('button');x.type='button';x.textContent='×';x.setAttribute('aria-label','Fechar');x.style.cssText='border:0;background:transparent;color:white;font-size:26px;cursor:pointer';
  const body=document.createElement('div');body.textContent=String(message);body.style.cssText='padding:26px 20px 20px;min-height:64px;box-sizing:border-box;font-size:14px;line-height:1.5;text-align:left';
  const footer=document.createElement('div');footer.style.cssText='display:flex;justify-content:center;padding:0 20px 22px';
  const ok=document.createElement('button');ok.type='button';ok.textContent='OK';ok.style.cssText='background:#1956a0;color:#fff;border:0;border-radius:5px;padding:10px 23px;font-weight:700;cursor:pointer';
  const close=()=>overlay.remove();x.onclick=close;ok.onclick=close;overlay.onclick=e=>{if(e.target===overlay)close()};
  header.append(label,x);footer.append(ok);modal.append(header,body,footer);overlay.append(modal);document.body.append(overlay);ok.focus();
 };

 const p=panel('ENTRADA DE CAIXA');p.classList.add('cx-expense-sales-size');summary(p,c);
 p.append(el('div','cx-section-title','DADOS DA ENTRADA'));
 const form=el('div','cx-expense-form cx-entry-two-rows');p.append(form);
 const next=()=>String(Math.max(0,...entries().map(x=>Number(x.numero)||0))+1).padStart(6,'0');
 const [nw,num]=input('Nº ENTRADA','text',next());num.readOnly=true;
 const [dtw,date]=input('DATA','date',new Date().toLocaleDateString('en-CA'));
 const [ow,op]=input('USUÁRIO','text',connectedUser()?.nome||'NÃO IDENTIFICADO');op.readOnly=true;
 op.title='CLIQUE PARA VISUALIZAR O HISTÓRICO DO OPERADOR';op.classList.add('cx-operator-clickable');
 op.addEventListener('click',()=>{
  const x=current(),history=Array.isArray(x?.historico)?x.historico:[];
  const overlay=el('div','');overlay.style.cssText='position:fixed;inset:0;background:rgba(9,29,58,.62);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
  const dialog=el('div','');dialog.style.cssText='box-sizing:border-box;width:440px;max-width:100%;background:#fff;color:#17457c;border-radius:12px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.22);font-family:Arial,sans-serif;';
  const heading=el('div','','HISTÓRICO DE ALTERAÇÕES');heading.style.cssText='background:#194b89;color:white;font-size:17px;font-weight:800;padding:16px;line-height:20px;';
  const body=el('div','');body.style.cssText='padding:26px 16px 4px;box-sizing:border-box;';
  const last=history[history.length-1];const lastUser=last?.usuario||(x?.operador?operatorName(x.operador):connectedUser()?.nome)||'NÃO IDENTIFICADO';
  const title=el('div','');title.style.cssText='font-size:16px;line-height:23px;margin:0 0 22px;';
  const bold=el('strong','','ÚLTIMO USUÁRIO: ');title.append(bold,document.createTextNode(String(lastUser).toUpperCase()));body.append(title);
  if(!x){const note=el('div','','GRAVE OU LOCALIZE UMA ENTRADA PARA VISUALIZAR SEU HISTÓRICO.');note.style.cssText='color:#667d9a;font-size:12px;line-height:18px;';body.append(note)}
  else if(!history.length){const note=el('div','','NENHUMA AÇÃO REGISTRADA NESTA ENTRADA.');note.style.cssText='color:#667d9a;font-size:12px;';body.append(note)}
  else history.forEach(h=>{
   const line=el('div','');line.style.cssText='border-bottom:1px solid #d4e0ef;padding:0 0 14px;margin-bottom:14px;';
   const action=String(h.acao||'ALTERAÇÃO').toUpperCase().replace('GRAVAÇÃO','CADASTRO');
   const who=el('div','');who.style.cssText='font-size:15px;line-height:20px;';
   const label=el('strong','',action+' — ');who.append(label,document.createTextNode(String(h.usuario||'NÃO IDENTIFICADO').toUpperCase()));
   const when=el('div','',String(h.data||''));when.style.cssText='font-size:12px;color:#667d9a;margin-top:3px;';line.append(who,when);body.append(line);
  });
  const footer=el('div','');footer.style.cssText='display:flex;justify-content:flex-end;padding:24px 20px 18px;';
  const close=btn('FECHAR',()=>overlay.remove(),'');close.style.cssText='background:#1955a0;color:white;border:0;border-radius:5px;padding:10px 19px;font-weight:700;cursor:pointer;';
  footer.append(close);dialog.append(heading,body,footer);overlay.append(dialog);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
 });
 const [dw,desc]=input('DESCRIÇÃO DA ENTRADA');
 const [vw,value]=input('VALOR (R$)','number');value.min='0.01';value.step='0.01';
 const [sw,status]=input('SITUAÇÃO','text','PENDENTE');status.readOnly=true;
 form.append(nw,dtw,ow,dw,vw,sw);
 let currentId=null;
 const current=()=>entries().find(x=>String(x.id)===String(currentId));
 const persist=a=>localStorage.setItem(entryKey,JSON.stringify(a));
 // Compatibilidade com versões antigas: uma entrada CANCELADA ou reaberta
 // como PENDENTE jamais pode conservar valor líquido ativo no caixa.
 // Preservamos o lançamento original e criamos o estorno faltante uma única vez.
 const reconcileOldEntries=()=>{
  let changed=false;
  entries().filter(x=>String(x.caixaId)===String(c.id)&&['PENDENTE','CANCELADA'].includes(x.status)).forEach(x=>{
   const originals=c.movimentos.filter(m=>String(m.entradaId)===String(x.id)&&!m.estornado);
   const reversals=c.movimentos.filter(m=>String(m.estornoEntradaId)===String(x.id)&&!m.estornado);
   const net=Math.round((originals.reduce((v,m)=>v+Number(m.valor||0),0)-reversals.reduce((v,m)=>v+Number(m.valor||0),0))*100)/100;
   if(net>0){c.movimentos.push({tipo:'SAÍDA',categoria:'ESTORNO DE ENTRADA',descricao:'REGULARIZAÇÃO DE ENTRADA '+String(x.numero).padStart(6,'0')+' — '+(x.descricao||''),valor:net,forma:'DINHEIRO',data:new Date().toISOString(),estornoEntradaId:x.id,operador:c.operador,regularizacao:true});changed=true}
  });
  if(changed)save();
 };
 reconcileOldEntries();
 const oldSummary=p.querySelector('.cx-summary');if(oldSummary){const holder=el('div');summary(holder,c);oldSummary.replaceWith(holder.firstElementChild)}
 const update=()=>{const x=current();op.value=connectedUser()?.nome||'NÃO IDENTIFICADO';status.value=x?.status||'PENDENTE';if(x){num.value=String(x.numero).padStart(6,'0');date.value=x.data;desc.value=x.descricao;value.value=x.valor;}const locked=!!x&&x.status!=='PENDENTE';[date,desc,value].forEach(i=>i.disabled=locked)};
 const summaryRefresh=()=>{const old=p.querySelector('.cx-summary');if(old){const holder=el('div');summary(holder,c);old.replaceWith(holder.firstElementChild)}};
 const valid=()=>{if(!date.value||!desc.value.trim()||!(Number(value.value)>0)){erpAlert('INFORME DATA, DESCRIÇÃO E VALOR.');return false}return true};
 const novo=()=>{currentId=null;num.value=next();date.value=new Date().toLocaleDateString('en-CA');desc.value='';value.value='';update()};
 const gravar=(silencioso=false)=>{if(!valid())return;const a=entries();let x=current();if(x)return erpAlert('ESTA ENTRADA JÁ FOI GRAVADA. UTILIZE ALTERAR PARA MODIFICAR UMA ENTRADA PENDENTE.');if(!x){x={id:Math.max(0,...a.map(y=>Number(y.id)||0))+1,numero:Number(num.value),caixaId:c.id,operador:c.operador,status:'PENDENTE',historico:[]};a.push(x)}
 Object.assign(x,{data:date.value,descricao:desc.value.trim().toUpperCase(),categoria:'ENTRADA DE CAIXA',valor:Number(value.value)});x.historico??=[];x.historico.push({acao:'GRAVAÇÃO',usuario:connectedUser()?.nome||operatorName(c.operador),data:new Date().toLocaleString('pt-BR')});persist(a);currentId=x.id;update();if(!silencioso)erpAlert('ENTRADA DE CAIXA Nº '+String(x.numero).padStart(6,'0')+' GRAVADA COM SUCESSO.')};
 const confirmEntry=(title,message,onConfirm)=>{
  const overlay=el('div','erp-overlay');
  const dialog=el('div','erp-dialog cx-center-dialog cx-sangria-confirm-dialog');
  dialog.style.cssText='width:min(475px,calc(100vw - 32px));max-width:475px;padding:0;overflow:hidden;border-radius:10px;gap:0;';
  const header=el('div');
  header.style.cssText='background:#225b9b;color:#fff;padding:20px 22px;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:space-between;';
  header.append(el('span','',title));
  const x=btn('×',()=>overlay.remove());
  x.style.cssText='border:0;background:transparent;color:white;font-size:25px;cursor:pointer;padding:0 3px;';
  header.append(x);
  const msg=el('p','',message);
  msg.style.cssText='margin:0;padding:32px 20px 24px;color:#18467d;font-size:15px;line-height:1.5;';
  const controls=el('div');
  controls.style.cssText='display:flex;justify-content:center;gap:10px;padding:10px 20px 22px;';
  const yes=btn('CONFIRMAR',()=>{overlay.remove();onConfirm()});
  yes.style.cssText='background:#1955a0;color:white;border:0;border-radius:4px;padding:11px 20px;font-weight:700;cursor:pointer;';
  const no=btn('CANCELAR',()=>overlay.remove());
  no.style.cssText='background:#eaf2ff;color:#14519a;border:1px solid #b6d0fa;border-radius:4px;padding:10px 18px;cursor:pointer;';
  controls.append(yes,no);dialog.append(header,msg,controls);overlay.append(dialog);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
  document.body.append(overlay);
 };
 const alterar=()=>{
  const atual=current();
  if(!atual)return erpAlert('LOCALIZE UM LANÇAMENTO PENDENTE PARA ALTERAR.');
  if(atual.status!=='PENDENTE')return erpAlert('SOMENTE LANÇAMENTOS PENDENTES PODEM SER ALTERADOS.');
  if(String(atual.caixaId)!==String(c.id))return erpAlert('LANÇAMENTO DE OUTRO CAIXA: CONSULTA SOMENTE.');
  if(!valid())return;
  const todos=entries(),alvo=todos.find(y=>String(y.id)===String(atual.id));
  if(!alvo||alvo.status!=='PENDENTE')return erpAlert('SOMENTE LANÇAMENTOS PENDENTES PODEM SER ALTERADOS.');
  Object.assign(alvo,{data:date.value,descricao:desc.value.trim().toUpperCase(),categoria:'ENTRADA DE CAIXA',valor:Number(value.value)});
  alvo.historico=Array.isArray(alvo.historico)?alvo.historico:[];
  alvo.historico.push({acao:'ALTERAÇÃO',usuario:connectedUser()?.nome||operatorName(c.operador),data:new Date().toLocaleString('pt-BR')});
  try{persist(todos)}catch{return erpAlert('NÃO FOI POSSÍVEL SALVAR A ALTERAÇÃO.');}
  update();erpAlert('LANÇAMENTO ALTERADO COM SUCESSO.');
 };
 const baixar=()=>{
  let x=current();
  if(!x)return erpAlert('GRAVE A ENTRADA ANTES DE BAIXAR.');
  if(x.status==='CANCELADA')return erpAlert('ENTRADA CANCELADA NÃO PODE SER BAIXADA.');
  if(x.status!=='PENDENTE')return erpAlert('ESTA ENTRADA JÁ FOI BAIXADA.');
  authenticate('IDENTIFICAÇÃO PARA BAIXAR ENTRADA DE CAIXA',code=>{
   const target=activeCash(code);
   if(!target)return erpAlert('ESTE USUÁRIO NÃO POSSUI CAIXA ABERTO.');
   const all=entries(),entry=all.find(y=>String(y.id)===String(x.id));
   if(!entry||entry.status!=='PENDENTE')return erpAlert('ESTA ENTRADA NÃO ESTÁ PENDENTE.');
   const original=caixas.flatMap(k=>k.movimentos||[]).filter(m=>String(m.entradaId)===String(entry.id)&&!m.estornado);
   const reversals=caixas.flatMap(k=>k.movimentos||[]).filter(m=>String(m.estornoEntradaId)===String(entry.id)&&!m.estornado);
   const active=Math.round((original.reduce((t,m)=>t+Number(m.valor||0),0)-reversals.reduce((t,m)=>t+Number(m.valor||0),0))*100);
   if(active>0)return erpAlert('ESTA ENTRADA JÁ FOI LANÇADA NO CAIXA.');
   confirmEntry('CONFIRMAR BAIXA','DESEJA BAIXAR A ENTRADA Nº '+String(entry.numero).padStart(6,'0')+' NO VALOR DE '+fmt(entry.valor)+' NO CAIXA DO USUÁRIO '+operatorName(code)+'?',()=>{
    const latest=entries().find(y=>String(y.id)===String(entry.id));
    if(!latest||latest.status!=='PENDENTE'||String(activeCash(code)?.id)!==String(target.id))return erpAlert('ENTRADA NÃO PENDENTE OU CAIXA DO USUÁRIO FECHADO.');
    if(caixas.some(k=>(k.movimentos||[]).some(m=>String(m.entradaId)===String(entry.id)&&!m.estornado)))return erpAlert('ESTA ENTRADA JÁ FOI REGISTRADA NO CAIXA.');
    const previous={status:latest.status,caixaId:latest.caixaId,operador:latest.operador};
    const mov={entradaId:latest.id,tipo:'ENTRADA',categoria:'ENTRADA',descricao:latest.descricao,valor:Number(latest.valor),forma:'DINHEIRO',data:new Date().toISOString(),operador:code};
    latest.status='BAIXADA';latest.caixaId=target.id;latest.operador=code;
    latest.historico??=[];latest.historico.push({acao:'BAIXA',usuario:operatorName(code),data:new Date().toLocaleString('pt-BR'),caixaId:target.id});
    try{target.movimentos.push(mov);persist(all);save()}
    catch(err){target.movimentos=target.movimentos.filter(m=>m!==mov);latest.historico.pop();Object.assign(latest,previous);try{persist(all);save()}catch{}return erpAlert('FALHA AO SALVAR BAIXA: '+err.message)}
    if(entries().find(y=>String(y.id)===String(entry.id))?.status!=='BAIXADA')return erpAlert('A BAIXA NÃO FOI CONFIRMADA.');
    update();summaryRefresh();erpAlert('ENTRADA BAIXADA E REGISTRADA NO CAIXA DO USUÁRIO '+operatorName(code)+'.');
   });
  });
 };
 const cancelar=()=>{const before=current();if(!before)return erpAlert('SELECIONE UMA ENTRADA.');if(before.status==='CANCELADA')return erpAlert('ESTA OPERAÇÃO JÁ ESTÁ CANCELADA E NÃO PODE SER CANCELADA NOVAMENTE.');
 const paid=before.status==='BAIXADA';const originCash=caixas.find(k=>String(k.id)===String(before.caixaId));
 const originalMovements=paid?(originCash?.movimentos||[]).filter(m=>String(m.entradaId)===String(before.id)&&!m.estornado):[];
 const requestCancel=(authorizedCode)=>{
 confirmEntry('CONFIRMAR CANCELAMENTO','DESEJA CANCELAR A ENTRADA Nº '+String(before.numero).padStart(6,'0')+'?'+(before.status==='BAIXADA'?' O VALOR SERÁ ESTORNADO DO CAIXA.':''),()=>{
 const all=entries(),x=all.find(y=>String(y.id)===String(before.id));if(!x||x.status==='CANCELADA')return erpAlert('ESTA OPERAÇÃO JÁ ESTÁ CANCELADA E NÃO PODE SER CANCELADA NOVAMENTE.');
 if(x.status!==before.status)return erpAlert('A SITUAÇÃO DA OPERAÇÃO MUDOU.');
 const wasPaid=x.status==='BAIXADA';const caixaBaixa=caixas.find(k=>String(k.id)===String(x.caixaId))||c;
 const originals=caixaBaixa.movimentos.filter(m=>String(m.entradaId)===String(x.id)&&!m.estornado);
 const previousReversals=caixaBaixa.movimentos.filter(m=>String(m.estornoEntradaId)===String(x.id)&&!m.estornado);
 const outstanding=Math.round((originals.reduce((t,m)=>t+Number(m.valor||0),0)-previousReversals.reduce((t,m)=>t+Number(m.valor||0),0))*100)/100;
 if(wasPaid&&(String(x.operador)!==String(authorizedCode)||originals.length!==1))return erpAlert('USUÁRIO DA BAIXA NÃO CONFERE. CANCELAMENTO BLOQUEADO.');
 if(wasPaid&&outstanding<=0)return erpAlert('NÃO HÁ ENTRADA ATIVA PARA ESTORNAR. CANCELAMENTO INTERROMPIDO.');
 const reversal=wasPaid?{tipo:'SAÍDA',categoria:'ESTORNO DE ENTRADA',descricao:'CANCELAMENTO ENTRADA Nº '+String(x.numero).padStart(6,'0')+' — '+x.descricao,valor:outstanding,forma:'DINHEIRO',data:new Date().toISOString(),estornoEntradaId:x.id,operador:x.operador}:null;
 const oldStatus=x.status;x.status='CANCELADA';x.historico??=[];x.historico.push({acao:'CANCELAMENTO',usuario:operatorName(authorizedCode||connectedUser()?.id||x.operador),data:new Date().toLocaleString('pt-BR')});
 if(reversal)caixaBaixa.movimentos.push(reversal);
 try{persist(all);if(reversal)save()}catch(err){x.status=oldStatus;if(reversal)caixaBaixa.movimentos=caixaBaixa.movimentos.filter(m=>m!==reversal);persist(all);return erpAlert('FALHA AO CANCELAR: '+err.message)}
 if(current()?.status!=='CANCELADA')return erpAlert('CANCELAMENTO NÃO CONFIRMADO.');update();summaryRefresh();erpAlert(wasPaid?'ENTRADA CANCELADA. O ESTORNO FOI REGISTRADO NO CAIXA.':'ENTRADA PENDENTE CANCELADA SEM ESTORNO.');});};
 if(paid)return llAuthorizePaidCancellation('IDENTIFICAÇÃO PARA CANCELAR ENTRADA DE CAIXA',before,originalMovements,requestCancel,erpAlert);
 requestCancel(null);};
 const imprimir=()=>{
  const x=current();if(!x)return erpAlert('GRAVE A ENTRADA PARA IMPRIMIR.');
  const esc=t=>String(t??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const store=typeof getData==='function'?getData('lucas_lima_loja',{}):{};
  const company=store?.nomeFantasia||store?.nome||'LUCAS LIMA';
  const emitted=()=>`EMITIDO EM ${new Date().toLocaleDateString('pt-BR')}, POR ${(connectedUser()?.nome||'USUÁRIO').toUpperCase()}.`;
  const overlay=el('div','erp-overlay');overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(8,28,57,.6);display:flex;align-items:center;justify-content:center;padding:16px';
  const modal=el('div');modal.style.cssText='background:white;width:min(1100px,96vw);max-height:90vh;overflow:auto;border-radius:12px;color:#113d75;font:13px Arial,sans-serif';
  const head=el('div');head.style.cssText='background:#164a8c;color:white;padding:20px 22px;display:flex;justify-content:space-between;align-items:center;font-weight:bold;font-size:17px';head.append(el('span','','IMPRIMIR ENTRADA DE CAIXA'));
  const xbtn=el('button','','×');xbtn.style.cssText='background:transparent;color:white;border:0;font-size:25px;cursor:pointer';xbtn.onclick=()=>overlay.remove();head.append(xbtn);
  const columns=el('div');columns.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px';
  const left=el('section'),right=el('section');[left,right].forEach(a=>a.style.cssText='border:1px solid #d3e0ef;border-radius:7px;padding:14px;min-width:0');
  const sectionTitle=(t)=>{const e=el('h3','',t);e.style.cssText='background:#e8f2ff;padding:12px;margin:0 0 12px;font-size:13px;color:#084584';return e};
  left.append(sectionTitle('DADOS DA ENTRADA SELECIONADA'));
  const info=el('div');info.style.cssText='background:#eaf2fd;padding:15px;line-height:2;border-radius:6px';info.textContent=`Nº ${String(x.numero).padStart(6,'0')} — ${x.descricao||'—'} | ${fmt(x.valor)} | ${x.status}`;left.append(info,sectionTitle('TIPO DE IMPRESSÃO'));
  const typ=el('div');typ.innerHTML='<label style="display:block;margin:10px 0"><input type="radio" name="entrada-print-type" value="completo" checked> COMPROVANTE COMPLETO</label><label style="display:block;margin:10px 0"><input type="radio" name="entrada-print-type" value="simples"> COMPROVANTE SIMPLIFICADO</label>';left.append(typ,sectionTitle('OPÇÕES ADICIONAIS'));
  const opt=el('label');opt.style.cssText='display:block;margin:12px 0';opt.innerHTML='<input type="checkbox" id="entrada-history-print"> INCLUIR HISTÓRICO';left.append(opt);
  const label=el('label','','ORIENTAÇÃO');label.style.cssText='display:block;font-weight:bold;margin-top:12px';const orientation=el('select');orientation.style.cssText='display:block;width:100%;padding:10px;margin-top:7px;border:1px solid #b7cde9;border-radius:5px';orientation.innerHTML='<option value="portrait">RETRATO</option><option value="landscape">PAISAGEM</option>';label.append(orientation);left.append(label);
  right.append(sectionTitle('PRÉ-VISUALIZAÇÃO A4'));const preview=el('div');preview.style.cssText='background:white;border:1px solid #c6d5e7;padding:18px;height:370px;overflow:auto;color:#153e72';right.append(preview);
  columns.append(left,right);const foot=el('div');foot.style.cssText='display:flex;justify-content:flex-end;gap:10px;padding:0 16px 16px';
  const makeBtn=(name,bg,fg)=>{const b=el('button','',name);b.style.cssText=`background:${bg};color:${fg};border:1px solid #b4c9e4;border-radius:5px;padding:12px 18px;font-weight:bold;cursor:pointer`;foot.append(b);return b};
  const print=makeBtn('IMPRIMIR','#1763c4','white'),save=makeBtn('SALVAR','#079d79','white'),close=makeBtn('FECHAR','#e8f1ff','#12467f');close.onclick=()=>overlay.remove();
  const render=()=>{const full=typ.querySelector('input:checked').value==='completo';const row=(k,v)=>`<div style="padding:8px 0"><b>${esc(k)}</b><div>${esc(v)}</div></div>`;let doc=`<div style="display:flex;justify-content:space-between;gap:15px;border-bottom:1px solid #d7e0ed;padding-bottom:14px"><b style="font-size:19px">${esc(company)}</b><b>ENTRADA DE CAIXA<br>Nº ${esc(String(x.numero).padStart(6,'0'))}</b></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 15px">${row('DATA',x.data)}${row('SITUAÇÃO',x.status)}${row('CAIXA DE DESTINO',x.caixaId||'—')}${row('DESCRIÇÃO',x.descricao)}${full?row('USUÁRIO',x.usuario||operatorName(x.operador)):''}</div><div style="background:#eaf2fd;padding:15px;margin:15px 0;font-size:17px;font-weight:bold">VALOR DA ENTRADA: ${esc(fmt(x.valor))}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;text-align:center;margin-top:70px"><div style="border-top:1px solid #777;padding-top:8px">Responsável pela entrada</div><div style="border-top:1px solid #777;padding-top:8px">Operador do caixa</div></div>`;if(opt.querySelector('input').checked)doc+=`<h3>HISTÓRICO DE ALTERAÇÕES</h3>${(x.historico||[]).map(h=>row(h.acao,`${h.usuario||''} — ${h.data||''}`)).join('')}`;doc+=`<div style="text-align:right;font-size:10px;margin-top:40px">${esc(emitted())}</div>`;preview.innerHTML=doc;return doc};
  const receiptHtml=()=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>ENTRADA ${esc(x.numero)}</title><style>@page{size:A4 ${orientation.value};margin:16mm}body{font:12px Arial,sans-serif;color:#153e72;margin:0}*{box-sizing:border-box} @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${render()}</body></html>`;
  print.onclick=()=>{
   // A impressão é feita em um iframe oculto: não abre pop-up nem imprime o ERP.
   const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';document.body.append(frame);
   frame.onload=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(err){erpAlert('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO: '+err.message)}setTimeout(()=>frame.remove(),60000)};
   frame.srcdoc=receiptHtml();
  };
  save.onclick=async()=>{
   // Gera um PDF real localmente; nunca depende de pop-ups.
   const filename='ENTRADA_'+String(x.numero).padStart(6,'0')+'.pdf';
   try{
    const landscape=orientation.value==='landscape',w=landscape?1123:794,h=landscape?794:1123;
    const canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=h*2;
    const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle='white';ctx.fillRect(0,0,w,h);ctx.fillStyle='#153e72';
    const margin=65;let y=75;const line=(key,value)=>{ctx.font='bold 14px Arial';ctx.fillText(key,margin,y);ctx.font='14px Arial';ctx.fillText(String(value??'—'),margin,y+22);y+=65};
    ctx.font='bold 23px Arial';ctx.fillText(company,margin,y);ctx.textAlign='right';ctx.font='bold 17px Arial';ctx.fillText('ENTRADA DE CAIXA Nº '+String(x.numero).padStart(6,'0'),w-margin,y);ctx.textAlign='left';y+=55;
    ctx.strokeStyle='#d7e0ed';ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(w-margin,y);ctx.stroke();y+=42;
    line('DATA',x.data);line('SITUAÇÃO',x.status);line('CAIXA DE DESTINO',x.caixaId||'—');line('DESCRIÇÃO',x.descricao);
    if(typ.querySelector('input:checked').value==='completo')line('USUÁRIO',x.usuario||operatorName(x.operador));
    ctx.fillStyle='#eaf2fd';ctx.fillRect(margin,y,w-margin*2,52);ctx.fillStyle='#153e72';ctx.font='bold 19px Arial';ctx.fillText('VALOR DA ENTRADA: '+fmt(x.valor),margin+15,y+33);y+=120;
    ctx.strokeStyle='#777';ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(w/2-25,y);ctx.moveTo(w/2+25,y);ctx.lineTo(w-margin,y);ctx.stroke();ctx.font='12px Arial';ctx.fillText('Responsável pela entrada',margin+10,y+22);ctx.fillText('Operador do caixa',w/2+35,y+22);y+=70;
    if(opt.querySelector('input').checked){ctx.font='bold 14px Arial';ctx.fillText('HISTÓRICO DE ALTERAÇÕES',margin,y);y+=24;ctx.font='12px Arial';for(const item of (x.historico||[])){if(y>h-110)break;ctx.fillText([item.acao,item.usuario,item.data].filter(Boolean).join(' — '),margin,y);y+=22}}
    ctx.textAlign='right';ctx.font='11px Arial';ctx.fillText(emitted(),w-margin,h-50);
    const jpeg=atob(canvas.toDataURL('image/jpeg',.92).split(',')[1]);const bytes=Uint8Array.from(jpeg,c=>c.charCodeAt(0));const enc=new TextEncoder();const parts=[];const offsets=[0];let length=0;const add=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length};const obj=(n,v)=>{offsets[n]=length;add(n+' 0 obj\n'+v+'\nendobj\n')};
    add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');const pw=landscape?841.89:595.28,ph=landscape?595.28:841.89;
    obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');const cmd=`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q\n`;obj(5,`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`);const start=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`);
    const blob=new Blob(parts,{type:'application/pdf'});
    if(typeof window.showSaveFilePicker==='function'){try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const stream=await handle.createWritable();await stream.write(blob);await stream.close();return}catch(e){if(e.name==='AbortError')return;if(e.name!=='SecurityError'&&e.name!=='NotAllowedError')throw e}}
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
   }catch(err){erpAlert('NÃO FOI POSSÍVEL SALVAR O PDF: '+err.message)}
  };
  typ.querySelectorAll('input').forEach(e=>e.onchange=render);opt.querySelector('input').onchange=render;orientation.onchange=render;
  modal.append(head,columns,foot);overlay.append(modal);document.body.append(overlay);render();
 };
 const actions=el('div','cx-expense-buttons');p.append(actions);
 actions.append(btn('NOVO',novo,'cx-btn-green'),btn('GRAVAR',()=>gravar(false)),btn('ALTERAR',alterar,'cx-btn-yellow'),btn('BAIXAR',baixar,'cx-btn-green'),btn('CANCELAR',cancelar,'cx-btn-red'),btn('IMPRIMIR',imprimir,'cx-btn-gray'),btn('VOLTAR',cashScreen,'cx-btn-red'));
 const search=el('section','cx-expense-search');search.append(el('div','cx-section-title','PESQUISA DE ENTRADAS DE CAIXA'));
 const filters=el('div','cx-expense-search-row');
 const [fw,from]=input('DATA INICIAL','date'),[tw,to]=input('DATA FINAL','date');
 const results=el('div','cx-expense-search-results');
 const searchNow=()=>{results.replaceChildren();if(from.value&&to.value&&from.value>to.value)return erpAlert('PERÍODO INVÁLIDO.');
 const matches=entries().filter(x=>(!from.value||x.data>=from.value)&&(!to.value||x.data<=to.value)).sort((a,b)=>b.numero-a.numero);
 const table=el('table','cx-dash-table cx-expense-results-table');const head=el('tr');['Nº','DATA','DESCRIÇÃO','MOTIVO','VALOR (R$)','SITUAÇÃO'].forEach(t=>head.append(el('th','',t)));const th=el('thead');th.append(head);table.append(th);const body=el('tbody');table.append(body);
 matches.forEach(x=>{const tr=el('tr');[String(x.numero).padStart(6,'0'),x.data,x.descricao,x.categoria,fmt(x.valor),x.status].forEach(v=>tr.append(el('td','',String(v))));tr.title='DUPLO CLIQUE PARA ABRIR';tr.addEventListener('dblclick',()=>{if(String(x.caixaId)!==String(c.id))return erpAlert('ENTRADA DE OUTRO CAIXA.');currentId=x.id;update()});body.append(tr)});results.append(table);if(!matches.length)results.append(el('p','cx-note','NENHUMA ENTRADA ENCONTRADA.'))};
 filters.append(fw,tw,btn('PESQUISAR',searchNow,'cx-search-submit'));search.append(filters,results);p.append(search);

 p.dataset.llSangriaActive='1';
 const showEntryShortcuts=()=>{
  const overlay=el('div','erp-overlay cx-shortcut-overlay'),dialog=el('div','cx-shortcut-dialog');
  const header=el('div','cx-shortcut-head');header.append(el('strong','','⌂ ATALHOS — ▣ ENTRADA DE CAIXA'),btn('×',()=>overlay.remove(),'cx-shortcut-x'));dialog.append(header);
  const body=el('div','cx-shortcut-body');
  [['F1','Abrir esta janela de atalhos'],['F2','Baixar entrada de caixa'],['F3','Cancelar entrada de caixa'],['F12','Localizar entrada pelo número']].forEach(([key,label])=>{const line=el('div','cx-shortcut-line');line.append(el('span','cx-shortcut-key',key),el('span','',label));body.append(line)});
  dialog.append(body);const footer=el('div','cx-shortcut-footer');footer.append(btn('FECHAR',()=>overlay.remove(),'cx-shortcut-close'));dialog.append(footer);overlay.append(dialog);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
 };
 const locateEntry=()=>{
  const overlay=el('div','erp-overlay cx-shortcut-overlay'),dialog=el('div','cx-shortcut-dialog');
  const header=el('div','cx-shortcut-head');header.append(el('strong','','▣ LOCALIZAR ENTRADA DE CAIXA — F12'),btn('×',()=>overlay.remove(),'cx-shortcut-x'));dialog.append(header);
  const body=el('div','cx-shortcut-body');body.style.cssText='padding:22px 20px 14px';
  body.append(el('p','','Informe o número da entrada de caixa.'));
  const label=el('label','','NÚMERO DA ENTRADA');label.style.cssText='display:block;font-weight:700;font-size:12px;margin:15px 0 5px';
  const field=document.createElement('input');field.type='text';field.inputMode='numeric';field.autocomplete='off';field.placeholder='DIGITE O NÚMERO...';
  field.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #b5cbea;border-radius:6px;font-size:15px';
  const msg=el('div','');msg.style.cssText='color:#b42318;font-size:12px;min-height:18px;margin-top:7px';
  body.append(label,field,msg);
  const actions=el('div','');actions.style.cssText='display:flex;justify-content:center;gap:10px;margin:19px 0 0';
  const searchBtn=btn('LOCALIZAR',()=>{
   const q=field.value.trim();
   if(!/^\d+$/.test(q)){msg.textContent='INFORME UM NÚMERO DE ENTRADA VÁLIDO.';field.focus();return}
   const found=entries().find(x=>String(Number(x.numero))===String(Number(q)));
   if(!found){msg.textContent='ENTRADA Nº '+q+' NÃO ENCONTRADA.';field.focus();return}
   if(String(found.caixaId)!==String(c.id)){msg.textContent='ESTA ENTRADA PERTENCE A OUTRO CAIXA.';return}
   currentId=found.id;overlay.remove();update();
  },'cx-shortcut-close');searchBtn.style.cssText='min-width:110px';
  const cancelBtn=btn('CANCELAR',()=>overlay.remove(),'cx-modern-btn');cancelBtn.style.cssText='background:#eef4fd;color:#174a87;border:1px solid #b5cbea;min-width:110px';
  actions.append(searchBtn,cancelBtn);body.append(actions);dialog.append(body);overlay.append(dialog);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
  field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchBtn.click()}else if(e.key==='Escape'){e.preventDefault();overlay.remove()}});
  field.addEventListener('input',()=>{msg.textContent=''});field.focus();
 };
 const shortcutButton=p.querySelector('.cx-shortcuts');if(shortcutButton){shortcutButton.textContent='⌂ ATALHOS';shortcutButton.onclick=showEntryShortcuts}
 const handleEntryKeys=e=>{
  if(!p.isConnected){document.removeEventListener('keydown',handleEntryKeys);return}
  if(document.querySelector('.erp-overlay'))return;
  const actions={F1:showEntryShortcuts,F2:baixar,F3:cancelar,F12:locateEntry};
  if(actions[e.key]){e.preventDefault();actions[e.key]()}
 };
 document.addEventListener('keydown',handleEntryKeys);
 update();
}

const sangriaKey='lucas_lima_caixa_sangrias_v1';
const sangrias=()=>getData(sangriaKey,[]);
// V692: taxa apurada pelos pagamentos reais das vendas baixadas, sem campo manual de parcelas.
// As sangrias baixadas anteriores consomem o saldo elegível na mesma ordem de registro.
function llV692TaxaOrigem(x){
 const round=n=>Math.round((Number(n)||0)*100);
 const forma=String(x.forma||'').trim().toUpperCase();
 const vendas=getData('erp_matriz_vendas_v1',[]);
 if(!Array.isArray(vendas))throw Error('CADASTRO DE VENDAS INDISPONÍVEL PARA CONFERÊNCIA DAS TAXAS.');
 const lotes=[];
 for(const v of vendas){
  if(!['BAIXADA','BAIXADO'].includes(String(v.situacao||v.status||'').toUpperCase()))continue;
  for(const [i,p] of (v.pagamentos||[]).entries()){
   if(p.boleto)continue;
   if(String(p.descricao||p.forma||'').trim().toUpperCase()!==forma)continue;
   const bruto=round(p.valor);if(bruto<=0)continue;
   const taxa=Number(p.taxa??0);
   if(!Number.isFinite(taxa)||taxa<0||taxa>=100)throw Error('TAXA INVÁLIDA NA VENDA '+v.numero);
   lotes.push({bruto,taxa,ref:'VENDA '+v.numero+' / PAGAMENTO '+(i+1),data:String(v.data||'')});
  }
 }
 lotes.sort((a,b)=>a.data.localeCompare(b.data)||a.ref.localeCompare(b.ref));
 const anteriores=sangrias().filter(z=>z.status==='BAIXADA'&&String(z.id)!==String(x.id)&&String(z.forma||'').trim().toUpperCase()===forma).sort((a,b)=>String(a.data||'').localeCompare(String(b.data||''))||Number(a.id)-Number(b.id));
 let consumido=anteriores.reduce((a,z)=>a+round(z.valor),0);
 let restante=round(x.valor),taxaCent=0;const fontes=[];
 for(const lote of lotes){
  const livre=Math.max(0,lote.bruto-consumido);consumido=Math.max(0,consumido-lote.bruto);
  if(!livre||!restante)continue;
  const usado=Math.min(livre,restante);restante-=usado;
  taxaCent+=Math.round(usado*lote.taxa/100);
  fontes.push({referencia:lote.ref,valor:usado/100,taxa:lote.taxa});
 }
 if(restante>0)throw Error('NÃO HÁ PAGAMENTOS DE VENDAS BAIXADAS SUFICIENTES PARA CONFERIR ESTA SANGRIA. VALOR SEM ORIGEM: '+(restante/100).toFixed(2));
 return {taxa:taxaCent/100,fontes};
}

// V690: recebimentos ficam no Caixa; a conta cadastrada é usada apenas na baixa da sangria.
const sangriaFinKey='erp_systems_financeiro_v1';
function syncSangriaTesouraria(x,estornar=false){
 const d=JSON.parse(localStorage.getItem(sangriaFinKey)||'{}');
 d.contas=Array.isArray(d.contas)?d.contas:[];d.movimentos=Array.isArray(d.movimentos)?d.movimentos:[];
 const pagamentos=JSON.parse(localStorage.getItem('erp_matriz_formas_pagamento_v1')||'{}');
 const formas=Array.isArray(pagamentos)?pagamentos:(pagamentos.formas||[]);
 const cadastro=formas.find(f=>String(f.id)===String(x.formaId))||
   formas.find(f=>String(f.descricao||'').trim().toUpperCase()===String(x.forma||'').trim().toUpperCase());
 if(!cadastro)throw Error('FORMA DE PAGAMENTO NÃO ENCONTRADA NO CADASTRO.');
 // V716: a sangria sempre transfere do CAIXA para a TESOURARIA,
 // independentemente da conta vinculada à forma de pagamento.
 let origem=d.contas.find(c=>c.contaPadrao==='CAIXA')||d.contas.find(c=>String(c.tipo||'').toUpperCase()==='CAIXA');
 let destino=d.contas.find(c=>c.contaPadrao==='TESOURARIA')||d.contas.find(c=>String(c.tipo||'').toUpperCase()==='TESOURARIA'||String(c.nome||'').trim().toUpperCase()==='TESOURARIA');
 const nextId=()=>Math.max(0,...d.contas.map(c=>Number(c.id)||0))+1;
 if(!origem){origem={id:nextId(),nome:'CAIXA DA LOJA',tipo:'CAIXA',contaPadrao:'CAIXA',ativo:true,usuario:'SISTEMA'};d.contas.push(origem)}
 if(!destino){destino={id:nextId(),nome:'TESOURARIA',tipo:'TESOURARIA',contaPadrao:'TESOURARIA',ativo:true,usuario:'SISTEMA'};d.contas.push(destino)}
 if(origem.ativo===false||destino.ativo===false)throw Error('ATIVE AS CONTAS CAIXA E TESOURARIA NO FINANCEIRO.');
 if(String(origem.id)===String(destino.id))throw Error('A CONTA DE DESTINO DESTA SANGRIA É O PRÓPRIO CAIXA.');
 const ref='SANGRIA-'+x.id+'-CAIXA-'+x.caixaId;
 const ativos=d.movimentos.filter(m=>m.ref===ref&&m.categoria==='TRANSFERENCIA_SANGRIA');
 if(estornar){
   if(!ativos.length)return;
   d.movimentos=d.movimentos.filter(m=>!(m.ref===ref&&['TRANSFERENCIA_SANGRIA','TAXA_SANGRIA'].includes(m.categoria)));
 }else{
   if(ativos.length===2)return;
   if(ativos.length)throw Error('TRANSFERÊNCIA INCOMPLETA: VERIFIQUE O FINANCEIRO.');
   const bruto=Math.round(Number(x.valor)*100)/100;
   if(!(bruto>0))throw Error('VALOR DA SANGRIA INVÁLIDO.');
   const tipo=String(cadastro.tipo||'').toUpperCase();
   // Cartões: usar a taxa já aplicada a cada pagamento na venda original.
   // Outras formas continuam usando a configuração do cadastro.
   let taxa=0;
   let fontes=[];
   if(/CR[EÉ]DITO|D[EÉ]BITO/.test(tipo)){
     const apuracao=llV692TaxaOrigem(x);taxa=apuracao.taxa;fontes=apuracao.fontes;
   }else if(tipo==='PIX'){
     const percentual=Number(cadastro.taxaPix??cadastro.taxaPIX??0);
     if(!Number.isFinite(percentual)||percentual<0||percentual>=100)throw Error('TAXA PIX INVÁLIDA.');
     taxa=Math.round(bruto*percentual)/100;
   }
   const liquido=Math.round((bruto-taxa)*100)/100;
   const base={forma:x.forma||cadastro.descricao,formaId:cadastro.id,date:x.data||new Date().toISOString().slice(0,10),descricao:'SANGRIA Nº '+String(x.numero).padStart(6,'0')+' — '+cadastro.descricao+' — '+destino.nome,ref,categoria:'TRANSFERENCIA_SANGRIA',usuario:x.operador||'SISTEMA',created:new Date().toISOString()};
   let id=Math.max(0,...d.movimentos.map(z=>Number(z.id)||0));
   d.movimentos.push({...base,id:++id,conta:origem.id,tipo:'SAIDA',valor:bruto},
     {...base,id:++id,conta:destino.id,tipo:'ENTRADA',valor:liquido});
   if(taxa>0)d.movimentos.push({...base,id:++id,conta:destino.id,tipo:'INFORMATIVO',valor:taxa,categoria:'TAXA_SANGRIA',contabilizaSaldo:false,descricao:'TAXA — '+base.descricao,origensVendas:fontes});
 }
 localStorage.setItem(sangriaFinKey,JSON.stringify(d));
}

function registerSangria(c){
 // Mensagens exclusivas da Sangria: mesmo padrão visual da VALIDAÇÃO de Produtos.
 const erpAlert=(message)=>{
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(5,25,54,.62);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  const modal=document.createElement('div');
  modal.style.cssText='width:475px;max-width:100%;background:white;border-radius:12px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.24);color:#173e70;font-family:Arial,sans-serif';
  const header=document.createElement('div');
  header.style.cssText='height:60px;background:#195494;color:white;display:flex;align-items:center;justify-content:space-between;padding:0 20px;box-sizing:border-box;font-size:16px;font-weight:700';
  const label=document.createElement('span');label.textContent='▣ VALIDAÇÃO';
  const x=document.createElement('button');x.type='button';x.textContent='×';x.setAttribute('aria-label','Fechar');x.style.cssText='border:0;background:transparent;color:white;font-size:26px;cursor:pointer';
  const body=document.createElement('div');body.textContent=String(message);body.style.cssText='padding:26px 20px 20px;min-height:64px;box-sizing:border-box;font-size:14px;line-height:1.5;text-align:left';
  const footer=document.createElement('div');footer.style.cssText='display:flex;justify-content:center;padding:0 20px 22px';
  const ok=document.createElement('button');ok.type='button';ok.textContent='OK';ok.style.cssText='background:#1956a0;color:#fff;border:0;border-radius:5px;padding:10px 23px;font-weight:700;cursor:pointer';
  const close=()=>overlay.remove();x.onclick=close;ok.onclick=close;overlay.onclick=e=>{if(e.target===overlay)close()};
  header.append(label,x);footer.append(ok);modal.append(header,body,footer);overlay.append(modal);document.body.append(overlay);ok.focus();
 };
 const p=panel('SANGRIA DE CAIXA');p.classList.add('cx-expense-sales-size');summary(p,c);
 p.append(el('div','cx-section-title','DADOS DA SANGRIA'));
 const form=el('div','cx-expense-form cx-sangria-form');form.id='cx-sangria-alinhamento-v254';p.append(form);
 const next=()=>String(Math.max(0,...sangrias().map(x=>Number(x.numero)||0))+1).padStart(6,'0');
 const [nw,num]=input('Nº SANGRIA','text',next());num.readOnly=true;
 const [dtw,date]=input('DATA','date',new Date().toLocaleDateString('en-CA'));
 const [ow,op]=input('USUÁRIO','text',connectedUser()?.nome||'NÃO IDENTIFICADO');op.readOnly=true;
 op.title='CLIQUE PARA VISUALIZAR O HISTÓRICO DE ALTERAÇÕES';op.classList.add('cx-operator-clickable');
 op.addEventListener('click',()=>{
  const x=current(),history=Array.isArray(x?.historico)?x.historico:[];
  const overlay=el('div','');overlay.style.cssText='position:fixed;inset:0;background:rgba(9,29,58,.62);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
  const dialog=el('div','');dialog.style.cssText='box-sizing:border-box;width:440px;max-width:100%;background:#fff;color:#17457c;border-radius:12px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.22);font-family:Arial,sans-serif;';
  const heading=el('div','','HISTÓRICO DE ALTERAÇÕES');heading.style.cssText='background:#194b89;color:white;font-size:17px;font-weight:800;padding:16px;line-height:20px;';
  const body=el('div','');body.style.cssText='padding:26px 16px 4px;box-sizing:border-box;';
  const last=history[history.length-1];const lastUser=last?.usuario||(x?.operador?operatorName(x.operador):connectedUser()?.nome)||'NÃO IDENTIFICADO';
  const title=el('div','');title.style.cssText='font-size:16px;line-height:23px;margin:0 0 22px;';
  const bold=el('strong','','ÚLTIMO USUÁRIO: ');title.append(bold,document.createTextNode(String(lastUser).toUpperCase()));body.append(title);
  if(!x){const note=el('div','','GRAVE OU LOCALIZE UMA SANGRIA PARA VISUALIZAR SEU HISTÓRICO.');note.style.cssText='color:#667d9a;font-size:12px;line-height:18px;';body.append(note)}
  else if(!history.length){const note=el('div','','NENHUMA AÇÃO REGISTRADA NESTA SANGRIA.');note.style.cssText='color:#667d9a;font-size:12px;';body.append(note)}
  else history.forEach(h=>{
   const line=el('div','');line.style.cssText='border-bottom:1px solid #d4e0ef;padding:0 0 14px;margin-bottom:14px;';
   const action=String(h.acao||'ALTERAÇÃO').toUpperCase().replace('GRAVAÇÃO','CADASTRO');
   const who=el('div','');who.style.cssText='font-size:15px;line-height:20px;';
   const label=el('strong','',action+' — ');who.append(label,document.createTextNode(String(h.usuario||'NÃO IDENTIFICADO').toUpperCase()));
   const when=el('div','',String(h.data||''));when.style.cssText='font-size:12px;color:#667d9a;margin-top:3px;';line.append(who,when);body.append(line);
  });
  const footer=el('div','');footer.style.cssText='display:flex;justify-content:flex-end;padding:24px 20px 18px;';
  const close=btn('FECHAR',()=>overlay.remove(),'');close.style.cssText='background:#1955a0;color:white;border:0;border-radius:5px;padding:10px 19px;font-weight:700;cursor:pointer;';
  footer.append(close);dialog.append(heading,body,footer);overlay.append(dialog);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
 });
 const [dw,desc]=input('DESCRIÇÃO DA SANGRIA');
 const formaWrap=el('label','cx-field');formaWrap.append(el('span','','FORMA DE PAGAMENTO'));const forma=el('select');forma.style.cssText='width:100%;min-height:40px;border:1px solid #c7d5e6;border-radius:6px;padding:8px;background:#fff;color:#173b68';formaWrap.append(forma);
 let currentId=null;
 const current=()=>sangrias().find(x=>String(x.id)===String(currentId));
 const paymentRegistry=()=>{try{const d=JSON.parse(localStorage.getItem('erp_matriz_formas_pagamento_v1')||'{}');return (Array.isArray(d)?d:(Array.isArray(d.formas)?d.formas:[]))}catch{return []}};
 const isPaymentActive=f=>f.ativo===true||String(f.ativo).toUpperCase()==='SIM'||String(f.situacao||'').toUpperCase()==='ATIVO';
 const refreshFormas=()=>{
  const previous=forma.value;
  const saved=currentId==null?null:sangrias().find(x=>String(x.id)===String(currentId));
  const savedName=String(saved?.forma||'').trim();
  const registry=paymentRegistry();
  forma.replaceChildren();forma.add(new Option('SELECIONE',''));
  registry.filter(f=>isPaymentActive(f)&&!String(f.tipo||f.descricao||'').toUpperCase().includes('BOLETO')).forEach(f=>{
   const name=/BOLETO/i.test(String(f.descricao||''))?'CARNÊ':String(f.descricao||f.tipo||'').trim();if(!name)return;
   const opt=new Option(name+' — DISPONÍVEL '+fmt(availableByForm(c,name)),name);
   opt.dataset.formaId=String(f.id??'');forma.add(opt);
  });
  if(savedName&&![...forma.options].some(o=>o.value===savedName)){
   const old=new Option(savedName+' (INATIVA OU NÃO CADASTRADA)',savedName);old.disabled=true;forma.add(old);
  }
  if([...forma.options].some(o=>o.value===previous))forma.value=previous;
  else if(savedName)forma.value=savedName;
  else forma.value='';
 };refreshFormas();
 const [vw,value]=input('VALOR (R$)','number');value.min='0.01';value.step='0.01';
 const [sw,status]=input('SITUAÇÃO','text','PENDENTE');status.readOnly=true;
 form.append(nw,dtw,ow,formaWrap,dw,vw,sw);
 const persist=a=>localStorage.setItem(sangriaKey,JSON.stringify(a));
 // Compatibilidade com versões antigas: uma sangria CANCELADA ou reaberta
 // como PENDENTE jamais pode conservar valor líquido ativo no caixa.
 // Preservamos o lançamento original e criamos o estorno faltante uma única vez.
 const reconcileOldEntries=()=>{
  let changed=false;
  sangrias().filter(x=>String(x.caixaId)===String(c.id)&&['PENDENTE','CANCELADA'].includes(x.status)).forEach(x=>{
   const originals=c.movimentos.filter(m=>String(m.sangriaId)===String(x.id)&&!m.estornado);
   const reversals=c.movimentos.filter(m=>String(m.estornoSangriaId)===String(x.id)&&!m.estornado);
   const net=Math.round((originals.reduce((v,m)=>v+Number(m.valor||0),0)-reversals.reduce((v,m)=>v+Number(m.valor||0),0))*100)/100;
   if(net>0){c.movimentos.push({tipo:'ENTRADA',categoria:'ESTORNO DE SANGRIA',descricao:'REGULARIZAÇÃO DE SANGRIA '+String(x.numero).padStart(6,'0')+' — '+(x.descricao||''),valor:net,forma:x.forma||'DINHEIRO',data:new Date().toISOString(),estornoSangriaId:x.id,operador:c.operador,regularizacao:true});changed=true}
  });
  if(changed)save();
 };
 reconcileOldEntries();
 const oldSummary=p.querySelector('.cx-summary');if(oldSummary){const holder=el('div');summary(holder,c);oldSummary.replaceWith(holder.firstElementChild)}
 const update=()=>{const x=current();op.value=connectedUser()?.nome||'NÃO IDENTIFICADO';status.value=x?.status||'PENDENTE';if(x){num.value=String(x.numero).padStart(6,'0');date.value=x.data;desc.value=x.descricao;refreshFormas();forma.value=String(x.forma||'DINHEIRO');value.value=x.valor}const locked=!!x&&(x.status!=='PENDENTE'||String(x.caixaId)!==String(c.id));[date,desc,forma,value].forEach(i=>i.disabled=locked)};
 const summaryRefresh=()=>{const old=p.querySelector('.cx-summary');if(old){const holder=el('div');summary(holder,c);old.replaceWith(holder.firstElementChild)}};
 const valid=()=>{if(!forma.value||!paymentRegistry().some(f=>isPaymentActive(f)&&String(f.descricao||f.tipo||'').trim()===forma.value)){erpAlert('SELECIONE UMA FORMA DE PAGAMENTO ATIVA E CADASTRADA.');return false}if(!date.value||!desc.value.trim()||!(Number(value.value)>0)){erpAlert('INFORME DATA, DESCRIÇÃO E VALOR.');return false}return true};
 const novo=()=>{currentId=null;num.value=next();date.value=new Date().toLocaleDateString('en-CA');desc.value='';value.value='';update();refreshFormas();forma.value=''};
 const gravar=(silencioso=false)=>{if(current()&&String(current().caixaId)!==String(c.id))return erpAlert('SANGRIA DE OUTRO CAIXA: CONSULTA SOMENTE.');if(!valid())return;const a=sangrias();let x=current();if(x&&x.status!=='PENDENTE')return erpAlert('REABRA A SANGRIA PARA ALTERAR.');if(!x){x={id:Math.max(0,...a.map(y=>Number(y.id)||0))+1,numero:Number(num.value),caixaId:c.id,operador:c.operador,status:'PENDENTE',historico:[]};a.push(x)}
 Object.assign(x,{data:date.value,descricao:desc.value.trim().toUpperCase(),categoria:desc.value.trim().toUpperCase(),forma:forma.value,formaId:forma.selectedOptions[0]?.dataset.formaId||null,valor:Number(value.value)});x.historico??=[];x.historico.push({acao:'GRAVAÇÃO',usuario:connectedUser()?.nome||operatorName(c.operador),data:new Date().toLocaleString('pt-BR')});try{persist(a)}catch(err){return erpAlert('NÃO FOI POSSÍVEL GRAVAR A SANGRIA: '+err.message)};if(!sangrias().some(y=>String(y.id)===String(x.id)))return erpAlert('NÃO FOI POSSÍVEL CONFIRMAR A GRAVAÇÃO DA SANGRIA.');currentId=x.id;update();if(silencioso!==true)erpAlert('LANÇAMENTO GRAVADO COM SUCESSO!')};
 const confirmEntry=(title,message,onConfirm)=>{
  const overlay=el('div','erp-overlay');
  const dialog=el('div','erp-dialog cx-center-dialog cx-sangria-confirm-dialog');
  dialog.style.cssText='width:min(475px,calc(100vw - 32px));max-width:475px;padding:0;overflow:hidden;border-radius:10px;gap:0;';
  const header=el('div');
  header.style.cssText='background:#225b9b;color:#fff;padding:20px 22px;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:space-between;';
  header.append(el('span','',title));
  const x=btn('×',()=>overlay.remove());
  x.style.cssText='border:0;background:transparent;color:white;font-size:25px;cursor:pointer;padding:0 3px;';
  header.append(x);
  const msg=el('p','',message);
  msg.style.cssText='margin:0;padding:32px 20px 24px;color:#18467d;font-size:15px;line-height:1.5;';
  const controls=el('div');
  controls.style.cssText='display:flex;justify-content:center;gap:10px;padding:10px 20px 22px;';
  const yes=btn('CONFIRMAR',()=>{overlay.remove();onConfirm()});
  yes.style.cssText='background:#1955a0;color:white;border:0;border-radius:4px;padding:11px 20px;font-weight:700;cursor:pointer;';
  const no=btn('CANCELAR',()=>overlay.remove());
  no.style.cssText='background:#eaf2ff;color:#14519a;border:1px solid #b6d0fa;border-radius:4px;padding:10px 18px;cursor:pointer;';
  controls.append(yes,no);dialog.append(header,msg,controls);overlay.append(dialog);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
  document.body.append(overlay);
 };
 const alterar=()=>{
  const atual=current();
  if(!atual)return erpAlert('LOCALIZE UM LANÇAMENTO PENDENTE PARA ALTERAR.');
  if(atual.status!=='PENDENTE')return erpAlert('SOMENTE LANÇAMENTOS PENDENTES PODEM SER ALTERADOS.');
  if(String(atual.caixaId)!==String(c.id))return erpAlert('LANÇAMENTO DE OUTRO CAIXA: CONSULTA SOMENTE.');
  if(!valid())return;
  const todos=sangrias(),alvo=todos.find(y=>String(y.id)===String(atual.id));
  if(!alvo||alvo.status!=='PENDENTE')return erpAlert('SOMENTE LANÇAMENTOS PENDENTES PODEM SER ALTERADOS.');
  Object.assign(alvo,{data:date.value,descricao:desc.value.trim().toUpperCase(),categoria:desc.value.trim().toUpperCase(),forma:forma.value,formaId:forma.selectedOptions[0]?.dataset.formaId||null,valor:Number(value.value)});
  alvo.historico=Array.isArray(alvo.historico)?alvo.historico:[];
  alvo.historico.push({acao:'ALTERAÇÃO',usuario:connectedUser()?.nome||operatorName(c.operador),data:new Date().toLocaleString('pt-BR')});
  try{persist(todos)}catch{return erpAlert('NÃO FOI POSSÍVEL SALVAR A ALTERAÇÃO.');}
  update();erpAlert('LANÇAMENTO ALTERADO COM SUCESSO.');
 };
 const baixar=()=>{if(current()&&String(current().caixaId)!==String(c.id))return erpAlert('SANGRIA DE OUTRO CAIXA: CONSULTA SOMENTE.');let x=current();if(!x){if(!valid())return;gravar(true);x=current();if(!x)return}
 if(x.status==='CANCELADA')return erpAlert('SANGRIA CANCELADA NÃO PODE SER BAIXADA.');
 if(x.status!=='PENDENTE')return erpAlert('ESTA SANGRIA JÁ FOI BAIXADA.');

 const all=sangrias();x=all.find(y=>String(y.id)===String(currentId));
 if(!x)return erpAlert('SANGRIA NÃO ENCONTRADA.');
 // Somente a baixa ativa impede nova baixa. Baixas canceladas/estornadas são históricas.
 const movimentosAtivos=caixas.flatMap(z=>z.movimentos||[]).filter(m=>String(m.sangriaId)===String(x.id)&&!m.estornado);
 const estornos=caixas.flatMap(z=>z.movimentos||[]).filter(m=>String(m.estornoSangriaId)===String(x.id)&&!m.estornado);
 const ativoCentavos=Math.round(movimentosAtivos.reduce((t,m)=>t+Number(m.valor||0),0)*100)-Math.round(estornos.reduce((t,m)=>t+Number(m.valor||0),0)*100);
 if(ativoCentavos>0)return erpAlert('ESTA SANGRIA JÁ FOI LANÇADA NO CAIXA.');
 authenticate('IDENTIFICAÇÃO PARA BAIXAR SANGRIA',code=>{
 const target=activeCash(code);
 if(!target)return erpAlert('ESTE USUÁRIO NÃO POSSUI CAIXA ABERTO. BAIXA NÃO AUTORIZADA.');
 if(Number(x.valor)>availableByForm(target,x.forma||'DINHEIRO'))return erpAlert('SALDO INSUFICIENTE NA FORMA '+(x.forma||'DINHEIRO')+' DO CAIXA DO USUÁRIO AUTENTICADO.');
 confirmEntry('CONFIRMAR BAIXA','DESEJA BAIXAR A SANGRIA Nº '+String(x.numero).padStart(6,'0')+' NO VALOR DE '+fmt(x.valor)+'?',()=>{
 // Revalidar no momento da confirmação para impedir baixa após cancelamento.
 const latest=sangrias().find(z=>String(z.id)===String(x.id));
 if(!latest||latest.status!=='PENDENTE'||activeCash(code)?.id!==target.id)return erpAlert('SANGRIA NÃO PENDENTE OU CAIXA FECHADO.');
 x.caixaId=target.id;x.operador=code;
 const mov={sangriaId:x.id,tipo:'SANGRIA',categoria:'SANGRIA',descricao:x.descricao+' — '+x.categoria,valor:Number(x.valor),forma:x.forma||'DINHEIRO',data:new Date().toISOString(),operador:code};
 x.status='BAIXADA';x.historico??=[];x.historico.push({acao:'BAIXA',usuario:operatorName(code),data:new Date().toLocaleString('pt-BR')});
 try{syncSangriaTesouraria(x);persist(all);target.movimentos.push(mov);save()}catch(err){try{syncSangriaTesouraria(x,true)}catch(_){};x.status='PENDENTE';target.movimentos=target.movimentos.filter(m=>m!==mov);persist(all);return erpAlert('FALHA AO SALVAR BAIXA: '+err.message)}
 if(current()?.status!=='BAIXADA')return erpAlert('A BAIXA NÃO FOI CONFIRMADA NO ARMAZENAMENTO.');
 update();summaryRefresh();erpAlert('SANGRIA BAIXADA: VALOR TRANSFERIDO À TESOURARIA.');});});};
 const cancelar=()=>{if(current()&&String(current().caixaId)!==String(c.id))return erpAlert('SANGRIA DE OUTRO CAIXA: CONSULTA SOMENTE.');const before=current();if(!before)return erpAlert('SELECIONE UMA SANGRIA.');if(before.status==='CANCELADA')return erpAlert('ESTA OPERAÇÃO JÁ ESTÁ CANCELADA E NÃO PODE SER CANCELADA NOVAMENTE.');
 const paid=before.status==='BAIXADA';const originCash=caixas.find(z=>String(z.id)===String(before.caixaId));
 const originalMovements=paid?(originCash?.movimentos||[]).filter(m=>String(m.sangriaId)===String(before.id)&&!m.estornado):[];
 const requestCancel=(authorizedCode)=>{
 confirmEntry('CONFIRMAR CANCELAMENTO','DESEJA CANCELAR A SANGRIA Nº '+String(before.numero).padStart(6,'0')+'?'+(before.status==='BAIXADA'?' O VALOR SERÁ ESTORNADO DO CAIXA.':''),()=>{
 const all=sangrias(),x=all.find(y=>String(y.id)===String(before.id));if(!x||x.status==='CANCELADA')return erpAlert('ESTA OPERAÇÃO JÁ ESTÁ CANCELADA E NÃO PODE SER CANCELADA NOVAMENTE.');
 if(x.status!==before.status)return erpAlert('A SITUAÇÃO DA OPERAÇÃO MUDOU.');
 const wasPaid=x.status==='BAIXADA';
 const origin=caixas.find(z=>String(z.id)===String(x.caixaId))||c;
 const originals=origin.movimentos.filter(m=>String(m.sangriaId)===String(x.id)&&!m.estornado);
 const previousReversals=origin.movimentos.filter(m=>String(m.estornoSangriaId)===String(x.id)&&!m.estornado);
 const outstanding=Math.round((originals.reduce((t,m)=>t+Number(m.valor||0),0)-previousReversals.reduce((t,m)=>t+Number(m.valor||0),0))*100)/100;
 if(wasPaid&&(String(x.operador)!==String(authorizedCode)||originals.length!==1))return erpAlert('USUÁRIO DA BAIXA NÃO CONFERE. CANCELAMENTO BLOQUEADO.');
 if(wasPaid&&outstanding<=0)return erpAlert('NÃO HÁ SANGRIA ATIVA PARA ESTORNAR. CANCELAMENTO INTERROMPIDO.');
 const reversal=wasPaid?{tipo:'ENTRADA',categoria:'ESTORNO DE SANGRIA',descricao:'CANCELAMENTO SANGRIA Nº '+String(x.numero).padStart(6,'0')+' — '+x.descricao,valor:outstanding,forma:x.forma||'DINHEIRO',data:new Date().toISOString(),estornoSangriaId:x.id,operador:connectedUser()?.id||c.operador}:null;
 const oldStatus=x.status;x.status='CANCELADA';x.historico??=[];x.historico.push({acao:'CANCELAMENTO',usuario:operatorName(authorizedCode||connectedUser()?.id||x.operador),data:new Date().toLocaleString('pt-BR')});
 if(reversal)origin.movimentos.push(reversal);
 try{if(wasPaid)syncSangriaTesouraria(x,true);persist(all);if(reversal)save()}catch(err){x.status=oldStatus;if(reversal)origin.movimentos=origin.movimentos.filter(m=>m!==reversal);persist(all);return erpAlert('FALHA AO CANCELAR: '+err.message)}
 if(current()?.status!=='CANCELADA')return erpAlert('CANCELAMENTO NÃO CONFIRMADO.');update();summaryRefresh();erpAlert(wasPaid?'LANÇAMENTO CANCELADO E ESTORNADO COM SUCESSO!':'LANÇAMENTO PENDENTE CANCELADO SEM ESTORNO.');});};
 if(paid)return llAuthorizePaidCancellation('IDENTIFICAÇÃO PARA CANCELAR SANGRIA',before,originalMovements,requestCancel,erpAlert);
 requestCancel(null);};
 const imprimir=()=>{
  const x=current();if(!x)return erpAlert('GRAVE A SANGRIA PARA IMPRIMIR.');
  const esc=t=>String(t??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const store=typeof getData==='function'?getData('lucas_lima_loja',{}):{};
  const company=store?.nomeFantasia||store?.nome||'LUCAS LIMA';
  const emitted=()=>`EMITIDO EM ${new Date().toLocaleDateString('pt-BR')}, POR ${(connectedUser()?.nome||'USUÁRIO').toUpperCase()}.`;
  const overlay=el('div','erp-overlay');overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(8,28,57,.6);display:flex;align-items:center;justify-content:center;padding:16px';
  const modal=el('div');modal.style.cssText='background:white;width:min(1100px,96vw);max-height:90vh;overflow:auto;border-radius:12px;color:#113d75;font:13px Arial,sans-serif';
  const head=el('div');head.style.cssText='background:#164a8c;color:white;padding:20px 22px;display:flex;justify-content:space-between;align-items:center;font-weight:bold;font-size:17px';head.append(el('span','','IMPRIMIR SANGRIA DE CAIXA'));
  const xbtn=el('button','','×');xbtn.style.cssText='background:transparent;color:white;border:0;font-size:25px;cursor:pointer';xbtn.onclick=()=>overlay.remove();head.append(xbtn);
  const columns=el('div');columns.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px';
  const left=el('section'),right=el('section');[left,right].forEach(a=>a.style.cssText='border:1px solid #d3e0ef;border-radius:7px;padding:14px;min-width:0');
  const sectionTitle=(t)=>{const e=el('h3','',t);e.style.cssText='background:#e8f2ff;padding:12px;margin:0 0 12px;font-size:13px;color:#084584';return e};
  left.append(sectionTitle('DADOS DA SANGRIA SELECIONADA'));
  const info=el('div');info.style.cssText='background:#eaf2fd;padding:15px;line-height:2;border-radius:6px';info.textContent=`Nº ${String(x.numero).padStart(6,'0')} — ${x.descricao||'—'} | ${fmt(x.valor)} | ${x.status}`;left.append(info,sectionTitle('TIPO DE IMPRESSÃO'));
  const typ=el('div');typ.innerHTML='<label style="display:block;margin:10px 0"><input type="radio" name="sangria-print-type" value="completo" checked> COMPROVANTE COMPLETO</label><label style="display:block;margin:10px 0"><input type="radio" name="sangria-print-type" value="simples"> COMPROVANTE SIMPLIFICADO</label>';left.append(typ,sectionTitle('OPÇÕES ADICIONAIS'));
  const opt=el('label');opt.style.cssText='display:block;margin:12px 0';opt.innerHTML='<input type="checkbox" id="sangria-history-print"> INCLUIR HISTÓRICO';left.append(opt);
  const label=el('label','','ORIENTAÇÃO');label.style.cssText='display:block;font-weight:bold;margin-top:12px';const orientation=el('select');orientation.style.cssText='display:block;width:100%;padding:10px;margin-top:7px;border:1px solid #b7cde9;border-radius:5px';orientation.innerHTML='<option value="portrait">RETRATO</option><option value="landscape">PAISAGEM</option>';label.append(orientation);left.append(label);
  right.append(sectionTitle('PRÉ-VISUALIZAÇÃO A4'));const preview=el('div');preview.style.cssText='background:white;border:1px solid #c6d5e7;padding:18px;height:370px;overflow:auto;color:#153e72';right.append(preview);
  columns.append(left,right);const foot=el('div');foot.style.cssText='display:flex;justify-content:flex-end;gap:10px;padding:0 16px 16px';
  const makeBtn=(name,bg,fg)=>{const b=el('button','',name);b.style.cssText=`background:${bg};color:${fg};border:1px solid #b4c9e4;border-radius:5px;padding:12px 18px;font-weight:bold;cursor:pointer`;foot.append(b);return b};
  const print=makeBtn('IMPRIMIR','#1763c4','white'),save=makeBtn('SALVAR','#079d79','white'),close=makeBtn('FECHAR','#e8f1ff','#12467f');close.onclick=()=>overlay.remove();
  const render=()=>{const full=typ.querySelector('input:checked').value==='completo';const row=(k,v)=>`<div style="padding:8px 0"><b>${esc(k)}</b><div>${esc(v)}</div></div>`;let doc=`<div style="display:flex;justify-content:space-between;gap:15px;border-bottom:1px solid #d7e0ed;padding-bottom:14px"><b style="font-size:19px">${esc(company)}</b><b>SANGRIA DE CAIXA<br>Nº ${esc(String(x.numero).padStart(6,'0'))}</b></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 15px">${row('DATA',x.data)}${row('SITUAÇÃO',x.status)}${row('CAIXA DE ORIGEM',x.caixaId||'—')}${row('DESTINO','TESOURARIA')}${row('DESCRIÇÃO',x.descricao)}${full?row('USUÁRIO',operatorName(x.operador)):''}</div><div style="background:#eaf2fd;padding:15px;margin:15px 0;font-size:17px;font-weight:bold">VALOR DA SANGRIA: ${esc(fmt(x.valor))}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;text-align:center;margin-top:70px"><div style="border-top:1px solid #777;padding-top:8px">Responsável pela retirada</div><div style="border-top:1px solid #777;padding-top:8px">Responsável pela Tesouraria</div></div>`;if(opt.querySelector('input').checked)doc+=`<h3>HISTÓRICO DE ALTERAÇÕES</h3>${(x.historico||[]).map(h=>row(h.acao,`${h.usuario||''} — ${h.data||''}`)).join('')}`;doc+=`<div style="text-align:right;font-size:10px;margin-top:40px">${esc(emitted())}</div>`;preview.innerHTML=doc;return doc};
  const receiptHtml=()=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>SANGRIA ${esc(x.numero)}</title><style>@page{size:A4 ${orientation.value};margin:16mm}body{font:12px Arial,sans-serif;color:#153e72;margin:0}*{box-sizing:border-box} @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${render()}</body></html>`;
  print.onclick=()=>{
   // A impressão é feita em um iframe oculto: não abre pop-up nem imprime o ERP.
   const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';document.body.append(frame);
   frame.onload=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(err){erpAlert('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO: '+err.message)}setTimeout(()=>frame.remove(),60000)};
   frame.srcdoc=receiptHtml();
  };
  save.onclick=async()=>{
   // Gera um PDF real localmente; nunca depende de pop-ups.
   const filename='SANGRIA_'+String(x.numero).padStart(6,'0')+'.pdf';
   try{
    const landscape=orientation.value==='landscape',w=landscape?1123:794,h=landscape?794:1123;
    const canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=h*2;
    const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle='white';ctx.fillRect(0,0,w,h);ctx.fillStyle='#153e72';
    const margin=65;let y=75;const line=(key,value)=>{ctx.font='bold 14px Arial';ctx.fillText(key,margin,y);ctx.font='14px Arial';ctx.fillText(String(value??'—'),margin,y+22);y+=65};
    ctx.font='bold 23px Arial';ctx.fillText(company,margin,y);ctx.textAlign='right';ctx.font='bold 17px Arial';ctx.fillText('SANGRIA DE CAIXA Nº '+String(x.numero).padStart(6,'0'),w-margin,y);ctx.textAlign='left';y+=55;
    ctx.strokeStyle='#d7e0ed';ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(w-margin,y);ctx.stroke();y+=42;
    line('DATA',x.data);line('SITUAÇÃO',x.status);line('CAIXA DE ORIGEM',x.caixaId||'—');line('DESTINO','TESOURARIA');line('DESCRIÇÃO',x.descricao);
    if(typ.querySelector('input:checked').value==='completo')line('USUÁRIO',operatorName(x.operador));
    ctx.fillStyle='#eaf2fd';ctx.fillRect(margin,y,w-margin*2,52);ctx.fillStyle='#153e72';ctx.font='bold 19px Arial';ctx.fillText('VALOR DA SANGRIA: '+fmt(x.valor),margin+15,y+33);y+=120;
    ctx.strokeStyle='#777';ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(w/2-25,y);ctx.moveTo(w/2+25,y);ctx.lineTo(w-margin,y);ctx.stroke();ctx.font='12px Arial';ctx.fillText('Responsável pela retirada',margin+10,y+22);ctx.fillText('Responsável pela Tesouraria',w/2+35,y+22);y+=70;
    if(opt.querySelector('input').checked){ctx.font='bold 14px Arial';ctx.fillText('HISTÓRICO DE ALTERAÇÕES',margin,y);y+=24;ctx.font='12px Arial';for(const item of (x.historico||[])){if(y>h-110)break;ctx.fillText([item.acao,item.usuario,item.data].filter(Boolean).join(' — '),margin,y);y+=22}}
    ctx.textAlign='right';ctx.font='11px Arial';ctx.fillText(emitted(),w-margin,h-50);
    const jpeg=atob(canvas.toDataURL('image/jpeg',.92).split(',')[1]);const bytes=Uint8Array.from(jpeg,c=>c.charCodeAt(0));const enc=new TextEncoder();const parts=[];const offsets=[0];let length=0;const add=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length};const obj=(n,v)=>{offsets[n]=length;add(n+' 0 obj\n'+v+'\nendobj\n')};
    add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');const pw=landscape?841.89:595.28,ph=landscape?595.28:841.89;
    obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');const cmd=`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q\n`;obj(5,`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`);const start=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`);
    const blob=new Blob(parts,{type:'application/pdf'});
    if(typeof window.showSaveFilePicker==='function'){try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const stream=await handle.createWritable();await stream.write(blob);await stream.close();return}catch(e){if(e.name==='AbortError')return;if(e.name!=='SecurityError'&&e.name!=='NotAllowedError')throw e}}
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
   }catch(err){erpAlert('NÃO FOI POSSÍVEL SALVAR O PDF: '+err.message)}
  };
  typ.querySelectorAll('input').forEach(e=>e.onchange=render);opt.querySelector('input').onchange=render;orientation.onchange=render;
  modal.append(head,columns,foot);overlay.append(modal);document.body.append(overlay);render();
 };
 const actions=el('div','cx-expense-buttons');p.append(actions);
 actions.append(btn('NOVO',novo,'cx-btn-green'),btn('GRAVAR',()=>gravar(false)),btn('ALTERAR',alterar,'cx-btn-yellow'),btn('BAIXAR',baixar,'cx-btn-green'),btn('CANCELAR',cancelar,'cx-btn-red'),btn('IMPRIMIR',imprimir,'cx-btn-gray'),btn('VOLTAR',cashScreen,'cx-btn-red'));
 const search=el('section','cx-expense-search');search.append(el('div','cx-section-title','PESQUISA DE SANGRIAS DE CAIXA'));
 const filters=el('div','cx-expense-search-row');
 const [fw,from]=input('DATA INICIAL','date'),[tw,to]=input('DATA FINAL','date');
 const results=el('div','cx-expense-search-results');
 const searchNow=()=>{results.replaceChildren();if(from.value&&to.value&&from.value>to.value)return erpAlert('PERÍODO INVÁLIDO.');
 const matches=sangrias().filter(x=>(!from.value||x.data>=from.value)&&(!to.value||x.data<=to.value)).sort((a,b)=>b.numero-a.numero);
 const table=el('table','cx-dash-table cx-expense-results-table');const head=el('tr');['Nº','DATA','DESCRIÇÃO','MOTIVO','VALOR (R$)','SITUAÇÃO'].forEach(t=>head.append(el('th','',t)));const th=el('thead');th.append(head);table.append(th);const body=el('tbody');table.append(body);
 matches.forEach(x=>{const tr=el('tr');[String(x.numero).padStart(6,'0'),x.data,x.descricao,x.categoria,fmt(x.valor),x.status].forEach(v=>tr.append(el('td','',String(v))));tr.title='DUPLO CLIQUE PARA ABRIR';tr.addEventListener('dblclick',()=>{currentId=x.id;update()});body.append(tr)});results.append(table);if(!matches.length)results.append(el('p','cx-note','NENHUMA SANGRIA ENCONTRADA.'))};
 filters.append(fw,tw,btn('PESQUISAR',searchNow,'cx-search-submit'));search.append(filters,results);p.append(search);

 p.dataset.llSangriaActive='1';
 const showEntryShortcuts=()=>{
  const overlay=el('div','erp-overlay cx-shortcut-overlay'),dialog=el('div','cx-shortcut-dialog');
  const header=el('div','cx-shortcut-head');header.append(el('strong','','⌂ ATALHOS — ▣ SANGRIA DE CAIXA'),btn('×',()=>overlay.remove(),'cx-shortcut-x'));dialog.append(header);
  const body=el('div','cx-shortcut-body');
  [['F1','Abrir esta janela de atalhos'],['F2','Baixar sangria de caixa'],['F3','Cancelar sangria de caixa'],['F12','Localizar sangria pelo número']].forEach(([key,label])=>{const line=el('div','cx-shortcut-line');line.append(el('span','cx-shortcut-key',key),el('span','',label));body.append(line)});
  dialog.append(body);const footer=el('div','cx-shortcut-footer');footer.append(btn('FECHAR',()=>overlay.remove(),'cx-shortcut-close'));dialog.append(footer);overlay.append(dialog);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
 };
 const locateEntry=()=>{
  const overlay=el('div','erp-overlay cx-shortcut-overlay'),dialog=el('div','cx-shortcut-dialog');
  const header=el('div','cx-shortcut-head');header.append(el('strong','','▣ LOCALIZAR SANGRIA — F12'),btn('×',()=>overlay.remove(),'cx-shortcut-x'));dialog.append(header);
  const body=el('div','cx-shortcut-body');body.style.cssText='padding:22px 20px 14px';
  body.append(el('p','','Informe o número da sangria.'));
  const label=el('label','','NÚMERO DA SANGRIA');label.style.cssText='display:block;font-weight:700;font-size:12px;margin:15px 0 5px';
  const field=document.createElement('input');field.type='text';field.inputMode='numeric';field.autocomplete='off';field.placeholder='DIGITE O NÚMERO...';
  field.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #b5cbea;border-radius:6px;font-size:15px';
  const msg=el('div','');msg.style.cssText='color:#b42318;font-size:12px;min-height:18px;margin-top:7px';
  body.append(label,field,msg);
  const actions=el('div','');actions.style.cssText='display:flex;justify-content:center;gap:10px;margin:19px 0 0';
  const searchBtn=btn('LOCALIZAR',()=>{
   const q=field.value.trim();
   if(!/^\d+$/.test(q)){msg.textContent='INFORME UM NÚMERO DE SANGRIA VÁLIDO.';field.focus();return}
   const found=sangrias().find(x=>String(Number(x.numero))===String(Number(q)));
   if(!found){msg.textContent='SANGRIA Nº '+q+' NÃO ENCONTRADA.';field.focus();return}
   currentId=found.id;overlay.remove();update();
  },'cx-shortcut-close');searchBtn.style.cssText='min-width:110px';
  const cancelBtn=btn('CANCELAR',()=>overlay.remove(),'cx-modern-btn');cancelBtn.style.cssText='background:#eef4fd;color:#174a87;border:1px solid #b5cbea;min-width:110px';
  actions.append(searchBtn,cancelBtn);body.append(actions);dialog.append(body);overlay.append(dialog);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
  field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchBtn.click()}else if(e.key==='Escape'){e.preventDefault();overlay.remove()}});
  field.addEventListener('input',()=>{msg.textContent=''});field.focus();
 };
 const shortcutButton=p.querySelector('.cx-shortcuts');if(shortcutButton){shortcutButton.textContent='⌂ ATALHOS';shortcutButton.onclick=showEntryShortcuts}
 const handleEntryKeys=e=>{
  if(!p.isConnected){document.removeEventListener('keydown',handleEntryKeys,true);return}
  if(document.querySelector('.erp-overlay'))return;
  const actions={F1:showEntryShortcuts,F2:baixar,F3:cancelar,F12:locateEntry};
  if(actions[e.key]){e.preventDefault();e.stopImmediatePropagation();actions[e.key]()}
 };
 document.addEventListener('keydown',handleEntryKeys,true);
 update();
}
function registerSimple(c,tipo){if(tipo==='ENTRADA')return registerEntry(c);if(tipo==='SANGRIA')return registerSangria(c);
let p=panel(tipo==='SANGRIA'?'SANGRIA DE CAIXA':'ENTRADA DE CAIXA');summary(p,c);const [vw,v]=input('VALOR (R$)','number');v.min='0.01';v.step='0.01';const [dw,d]=input('MOTIVO / DESCRIÇÃO');p.append(vw,dw);let [cw,cat]=input('CATEGORIA / DESTINO');p.append(cw);p.append(btn('REGISTRAR '+tipo,()=>{let amount=Number(v.value);if(!Number.isFinite(amount)||amount<=0||!d.value.trim()||!cat.value.trim())return erpAlert('INFORME VALOR, MOTIVO E CATEGORIA.');if(tipo!=='ENTRADA'&&amount>expected(c))return erpAlert('DINHEIRO INSUFICIENTE NO CAIXA.');c.movimentos.push({tipo:tipo==='ENTRADA'?'ENTRADA':'SAÍDA',categoria:tipo,descricao:d.value.trim()+' — '+cat.value.trim(),valor:amount,forma:'DINHEIRO',data:new Date().toISOString()});save();cashScreen()}));p.append(btn('VOLTAR',cashScreen,'cx-btn-gray'))}
// Estornos: a venda cancelada gera obrigação de devolver, mas a saída só ocorre na confirmação.
const vendasKey='erp_matriz_vendas_v1', operacoesKey='erp_matriz_operacoes_v2';
const getData=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
const cents=n=>Math.round((Number(n)||0)*100);
function refundData(venda){
 const base=getData(operacoesKey,{}),ref='VENDA '+String(venda.numero).padStart(6,'0');
 const boletos=(base.receber||[]).filter(x=>x.ref===ref&&x.chaveVenda);
 const pagoBoletos=boletos.reduce((s,x)=>s+cents(x.pago),0);
 const naoBoleto=(venda.situacaoAntesCancelamento==='BAIXADA'||venda.baixadaEm||venda.historico?.some?.(h=>String(h.acao||'').includes('BAIXAR')))
   ?(venda.pagamentos||[]).filter(x=>!x.boleto&&!String(x.descricao||'').toUpperCase().includes('BOLETO')).reduce((s,x)=>s+cents(x.valor),0):0;
 const recebido=Math.min(cents(venda.total),pagoBoletos+naoBoleto);
 const estornos=getData('erp_systems_estornos_v1',[]).filter(x=>String(x.vendaNumero)===String(venda.numero));
 const devolvido=estornos.reduce((s,x)=>s+cents(x.valor),0);
 return {recebido,devolvido,restante:Math.max(0,recebido-devolvido),estornos};
}
function estornar(c){
 const p=panel('ESTORNAR VENDA / TROCA');p.classList.add('cx-expense-sales-size','cx-refund-page');p.querySelector('.cx-shortcuts')?.remove();
 p.append(el('div','cx-section-title','DADOS DO DOCUMENTO CANCELADO'));
 const typeLabel=el('label','cx-field','TIPO DE ESTORNO'),tipoDoc=el('select');[['VENDA','VENDA'],['TROCA','TROCA']].forEach(([v,n])=>{const o=el('option','',n);o.value=v;tipoDoc.append(o)});typeLabel.append(tipoDoc);
 const searchCard=el('div','cx-refund-search cx-refund-search-v377');searchCard.append(typeLabel);p.append(searchCard);
 const [nw,numero]=input('Nº DO DOCUMENTO');numero.placeholder='DIGITE O NÚMERO DA VENDA (F12)';numero.inputMode='numeric';
 const selectSale=btn('+',()=>{
  const overlay=el('div','erp-overlay cx-shortcut-overlay'),dialog=el('div','cx-refund-picker');
  const close=()=>overlay.remove();
  const head=el('div','cx-refund-picker-head');head.append(el('strong','', 'SELECIONE O DOCUMENTO CANCELADO'),btn('×',close,'cx-refund-picker-x'));dialog.append(head);
  const body=el('div','cx-refund-picker-body');
  const controls=el('div','cx-refund-picker-controls');
  const byLabel=el('label','','PESQUISAR POR'),by=el('select');
  [['NUMERO','NÚMERO'],['CLIENTE','CLIENTE']].forEach(([value,label])=>{const opt=el('option','',label);opt.value=value;by.append(opt)});byLabel.append(by);
  const queryLabel=el('label','','TEXTO DA PESQUISA'),filter=el('input');filter.placeholder='DIGITE PARA PESQUISAR...';filter.autocomplete='off';queryLabel.append(filter);
  const go=btn('PESQUISAR',()=>render(true),'cx-refund-picker-go');controls.append(byLabel,queryLabel,go);body.append(controls);
  const wrap=el('div','cx-refund-picker-table-wrap'),table=el('table','cx-refund-picker-table'),thead=el('thead'),tr=el('tr');
  ['Nº DOCUMENTO','TIPO','CLIENTE / VENDA ORIGINAL','DATA','SITUAÇÃO','VALOR A ESTORNAR'].forEach(t=>tr.append(el('th','',t)));thead.append(tr);
  const tbody=el('tbody');table.append(thead,tbody);wrap.append(table);body.append(wrap);
  const foot=el('div','cx-refund-picker-foot');foot.append(el('span','','DÊ DOIS CLIQUES PARA SELECIONAR.'),btn('CANCELAR',close,'cx-refund-picker-cancel'));body.append(foot);dialog.append(body);
  const render=(searched=false)=>{
   tbody.replaceChildren();
   if(!searched){const row=el('tr');const cell=el('td','','CLIQUE EM PESQUISAR PARA EXIBIR OS DOCUMENTOS.');cell.colSpan=6;row.append(cell);tbody.append(row);return}
   const q=filter.value.toUpperCase().trim(),kind=tipoDoc.value;
   const docs=(kind==='TROCA'?getData('erp_matriz_trocas_v1',[]):getData(vendasKey,[])).filter(v=>{
    if(String(v.situacao).toUpperCase()!=='CANCELADA')return false;
    if(!(kind==='TROCA'?tradeBalances(v):balances(v)).some(x=>x.restante>0))return false;
    const client=String(v.clienteNome||v.cliente||v.venda||'').toUpperCase();
    return !q||(by.value==='NUMERO'?String(v.numero).includes(q):client.includes(q));
   });
   docs.forEach(v=>{
    const row=el('tr');row.tabIndex=0;row.title='DÊ DOIS CLIQUES PARA SELECIONAR';
    const total=(kind==='TROCA'?tradeBalances(v):balances(v)).reduce((sum,x)=>sum+x.restante,0)/100;
    const date=String(v.data||v.criadoEm||v.createdAt||'').slice(0,10);const dateLabel=/^\d{4}-\d{2}-\d{2}$/.test(date)?date.split('-').reverse().join('/'):date||'—';
    [String(v.numero).padStart(6,'0'),kind,String(v.clienteNome||v.cliente|| (kind==='TROCA'?'VENDA '+(v.venda||''):'—')),dateLabel,'CANCELADA',fmt(total)].forEach(value=>row.append(el('td','',value)));
    const choose=()=>{numero.value=String(v.numero);close();localizar()};row.addEventListener('dblclick',choose);row.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();choose()}});tbody.append(row);
   });
   if(!docs.length){const row=el('tr'),cell=el('td','','NENHUM DOCUMENTO CANCELADO COM ESTORNO PENDENTE.');cell.colSpan=6;row.append(cell);tbody.append(row)}
  };
  filter.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();render(true)}});
  overlay.addEventListener('click',e=>{if(e.target===overlay)close()});overlay.append(dialog);document.body.append(overlay);render();filter.focus();
 },'cx-action blue cx-refund-plus');
 searchCard.append(nw,selectSale);
 const details=el('div','cx-refund-details'),actions=el('div','cx-refund-actions');
 p.append(details,actions);
 const bottom=el('div','cx-refund-bottom');
 bottom.append(btn('IMPRIMIR',()=>{
  if(!escolhida)return erpAlert('LOCALIZE UMA VENDA OU TROCA CANCELADA PARA IMPRIMIR.');
  const isTrade=tipoDoc.value==='TROCA';
  const logs=getData('erp_systems_estornos_v1',[]).filter(x=>isTrade
   ? x.tipoDocumento==='TROCA'&&String(Number(x.trocaNumero))===String(Number(escolhida.numero))
   : x.tipoDocumento!=='TROCA'&&String(Number(x.vendaNumero))===String(Number(escolhida.numero)));
  const dados=isTrade?tradeBalances(escolhida):balances(escolhida);
  const esc=v=>String(v??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const num=v=>String(v??'').padStart(6,'0');
  const rows=dados.map(x=>`<tr><td>${esc(x.forma)}</td><td>${fmt(x.total/100)}</td><td>${fmt(x.returned/100)}</td><td>${fmt(x.restante/100)}</td></tr>`).join('');
  const history=logs.map(x=>`<tr><td>${esc(new Date(x.data).toLocaleString('pt-BR'))}</td><td>${esc(x.forma)}</td><td>${fmt(x.valor)}</td><td>${esc(x.operador)}</td><td>${esc(x.caixaId)}</td></tr>`).join('');
  const total=logs.reduce((sum,x)=>sum+cents(x.valor),0)/100;
  // Pré-visualização no mesmo padrão da ficha de cadastro do produto.
  const connected=typeof connectedUser==='function'?connectedUser():null;
  const emissor=String(connected?.nome||connected?.name||'USUÁRIO CONECTADO').toUpperCase();
  const emissao=`EMITIDO EM ${new Date().toLocaleDateString('pt-BR')}, POR ${emissor}.`;
  const realizado=logs.length>0;
  const status=realizado?'ESTORNO REALIZADO':'NENHUM ESTORNO REALIZADO';
  const companyData=getData('lucas_lima_loja',{});
  const company=companyData?.nomeFantasia||companyData?.nome||'LUCAS LIMA';
  const overlay=el('div','erp-overlay');overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(8,28,57,.65);display:flex;align-items:center;justify-content:center;padding:16px';
  const modal=el('div');modal.style.cssText='background:#fff;width:min(1100px,96vw);max-height:90vh;overflow:auto;border-radius:12px;color:#113d75;font:13px Arial,sans-serif';
  const head=el('div');head.style.cssText='background:#164a8c;color:white;padding:20px 22px;display:flex;justify-content:space-between;align-items:center;font-weight:bold;font-size:17px';head.append(el('span','','IMPRIMIR COMPROVANTE DE ESTORNO'));
  const xbtn=el('button','','×');xbtn.style.cssText='background:transparent;color:white;border:0;font-size:25px;cursor:pointer';xbtn.onclick=()=>overlay.remove();head.append(xbtn);modal.append(head);
  const columns=el('div');columns.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px';
  const left=el('section'),right=el('section');[left,right].forEach(a=>a.style.cssText='border:1px solid #d3e0ef;border-radius:7px;padding:14px;min-width:0');
  const sectionTitle=t=>{const e=el('h3','',t);e.style.cssText='background:#e8f2ff;padding:12px;margin:0 0 12px;font-size:13px;color:#084584';return e};
  left.append(sectionTitle('DADOS DO ESTORNO SELECIONADO'));
  const info=el('div');info.style.cssText='background:#eaf2fd;padding:15px;line-height:2;border-radius:6px';info.textContent=`${isTrade?'TROCA':'VENDA'} Nº ${num(escolhida.numero)} | ${status} | TOTAL ESTORNADO: ${fmt(total)}`;left.append(info);
  left.append(sectionTitle('OPÇÕES DE IMPRESSÃO'));
  const opt=el('div');opt.innerHTML='<label style="display:block;margin:12px 0"><input type="checkbox" id="cx-refund-print-payments" checked> INCLUIR PAGAMENTOS</label><label style="display:block;margin:12px 0"><input type="checkbox" id="cx-refund-print-operators" checked> INCLUIR IDENTIFICAÇÃO DO OPERADOR</label>';
  left.append(opt);const orientationLabel=el('label','','ORIENTAÇÃO');orientationLabel.style.cssText='display:block;font-weight:bold;margin-top:12px';const orientation=el('select');orientation.style.cssText='display:block;width:100%;padding:10px;margin-top:7px;border:1px solid #b7cde9;border-radius:5px';orientation.innerHTML='<option value="portrait">RETRATO</option><option value="landscape">PAISAGEM</option>';orientationLabel.append(orientation);left.append(orientationLabel);
  right.append(sectionTitle('PRÉ-VISUALIZAÇÃO A4'));const preview=el('div');preview.style.cssText='background:white;border:1px solid #c6d5e7;padding:18px;height:400px;overflow:auto;color:#153e72';right.append(preview);columns.append(left,right);modal.append(columns);
  const foot=el('div');foot.style.cssText='display:flex;justify-content:flex-end;gap:10px;padding:0 16px 16px';
  const makeBtn=(name,bg,fg)=>{const button=el('button','',name);button.style.cssText=`background:${bg};color:${fg};border:1px solid #b4c9e4;border-radius:5px;padding:12px 18px;font-weight:bold;cursor:pointer`;foot.append(button);return button};
  const printButton=makeBtn('IMPRIMIR','#1763c4','white'),saveButton=makeBtn('SALVAR','#079d79','white'),closeButton=makeBtn('FECHAR','#e8f1ff','#12467f');closeButton.onclick=()=>overlay.remove();modal.append(foot);
  const render=()=>{
   const payments=opt.querySelector('#cx-refund-print-payments').checked,operators=opt.querySelector('#cx-refund-print-operators').checked;
   const detail=(name,value)=>`<div style="padding:7px 0"><b>${esc(name)}:</b> ${esc(value)}</div>`;
   const paymentsSection=payments?`<h3>RESUMO POR FORMA DE PAGAMENTO</h3><table><thead><tr><th>FORMA</th><th>RECEBIDO</th><th>ESTORNADO</th><th>PENDENTE</th></tr></thead><tbody>${rows||'<tr><td colspan="4">SEM VALORES IDENTIFICADOS</td></tr>'}</tbody></table>`:'';
   const historyRows=logs.map(x=>`<tr><td>${esc(new Date(x.data).toLocaleString('pt-BR'))}</td><td>${esc(x.forma)}</td><td>${fmt(x.valor)}</td>${operators?`<td>${esc(x.operador)}</td><td>${esc(x.caixaId)}</td>`:''}</tr>`).join('');
   const historySection=`<h3>ESTORNOS REALIZADOS</h3><table><thead><tr><th>DATA</th><th>FORMA</th><th>VALOR</th>${operators?'<th>OPERADOR</th><th>CAIXA</th>':''}</tr></thead><tbody>${historyRows||`<tr><td colspan="${operators?5:3}">NENHUM ESTORNO REGISTRADO</td></tr>`}</tbody></table>`;
   const doc=`<div style="display:flex;justify-content:space-between;gap:15px;border-bottom:2px solid #193b68;padding-bottom:12px"><div><h2 style="margin:0;font-size:20px">${esc(company)}</h2><small>SISTEMA DE GESTÃO EMPRESARIAL</small></div><b>COMPROVANTE DE ESTORNO</b></div><div style="margin:18px 0;padding:12px;background:${realizado?'#e2f5e9':'#fff1dc'};font-size:17px;text-align:center;font-weight:bold;color:${realizado?'#13723c':'#8b5b0a'}">${status}</div>${detail('TIPO',isTrade?'TROCA':'VENDA')}${detail('Nº DO DOCUMENTO',num(escolhida.numero))}${isTrade?detail('VENDA ORIGINAL',num(escolhida.venda)):''}${detail('CLIENTE',escolhida.clienteNome||escolhida.cliente||'—')}${detail('SITUAÇÃO DO DOCUMENTO',escolhida.situacao)}${paymentsSection}${historySection}<div style="font-weight:bold;font-size:16px;text-align:right;margin-top:22px">TOTAL ESTORNADO: ${fmt(total)}</div><div style="text-align:right;font-size:11px;margin-top:45px">${esc(emissao)}</div>`;
   preview.innerHTML=doc;return doc;
  };
  const printDocument=()=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>COMPROVANTE DE ESTORNO ${esc(num(escolhida.numero))}</title><style>@page{size:A4 ${orientation.value};margin:16mm}body{font:12px Arial,sans-serif;color:#153e72;margin:0}table{width:100%;border-collapse:collapse;margin:8px 0 20px}th,td{padding:8px 5px;text-align:left;border-bottom:1px solid #d7e0ed}th{background:#eaf2fd}h3{font-size:13px;margin:22px 0 8px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${render()}</body></html>`;
  const doPrint=()=>{const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';document.body.append(frame);frame.onload=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(error){erpAlert('NÃO FOI POSSÍVEL ABRIR A IMPRESSÃO: '+error.message)}setTimeout(()=>frame.remove(),60000)};frame.srcdoc=printDocument()};
  printButton.onclick=doPrint;
  saveButton.onclick=async()=>{
   if(saveButton.disabled)return;
   saveButton.disabled=true;
   try{
    if(typeof window.LucasEstornoPDF!=='function')throw Error('Gerador de PDF não carregado.');
    const result=await window.LucasEstornoPDF({
     company,kind:isTrade?'TROCA':'VENDA',number:num(escolhida.numero),original:isTrade?num(escolhida.venda):'',
     customer:escolhida.clienteNome||escolhida.cliente||'—',status:escolhida.situacao,
     realized:realizado,total:fmt(total),emission:emissao,landscape:orientation.value==='landscape',
     showPayments:opt.querySelector('#cx-refund-print-payments').checked,
     showOperators:opt.querySelector('#cx-refund-print-operators').checked,
     payments:dados.map(x=>[String(x.forma),fmt(x.total/100),fmt(x.returned/100),fmt(x.restante/100)]),
     history:logs.map(x=>[new Date(x.data).toLocaleString('pt-BR'),String(x.forma),fmt(x.valor),String(x.operador??'—'),String(x.caixaId??'—')])
    });
    if(result==='downloaded')erpAlert('PDF BAIXADO. PARA ESCOLHER A PASTA, ATIVE NO CHROME A OPÇÃO DE PERGUNTAR ONDE SALVAR CADA ARQUIVO.');
   }catch(error){erpAlert('NÃO FOI POSSÍVEL SALVAR O PDF: '+(error.message||error))}
   finally{saveButton.disabled=false}
  };
  opt.querySelectorAll('input').forEach(input=>input.addEventListener('change',render));orientation.addEventListener('change',render);
  overlay.addEventListener('click',event=>{if(event.target===overlay)overlay.remove()});overlay.append(modal);document.body.append(overlay);render();
 },'cx-action gray cx-refund-print'));
 bottom.append(btn('VOLTAR',cashScreen,'cx-action red cx-refund-back'));p.append(bottom);
 let escolhida=null;
 // Registra o débito financeiro uma única vez, preservando a conta de origem quando identificável.
 // V693: o estorno bruto e a reversão da taxa são registros separados.
 // Nunca escolher uma conta por aproximação: usar a conta do pagamento original.
 function lancarFinanceiroEstorno(reg){
  const forma=normalizedPayment(reg.forma);
  if(forma==='DINHEIRO')return; // Dinheiro é movimentado exclusivamente pelo livro-caixa.
  const key='erp_systems_financeiro_v1',d=getData(key,{});
  d.contas=Array.isArray(d.contas)?d.contas:[];d.movimentos=Array.isArray(d.movimentos)?d.movimentos:[];
  const ref='ESTORNO-'+(reg.tipoDocumento==='TROCA'?'TROCA':'VENDA')+'-'+reg.id;
  if(d.movimentos.some(m=>m.ref===ref))return;
  const doc=reg.tipoDocumento==='TROCA'
   ?getData('erp_matriz_trocas_v1',[]).find(x=>String(x.numero)===String(reg.trocaNumero))
   :getData(vendasKey,[]).find(x=>String(x.numero)===String(reg.vendaNumero));
  if(!doc)throw Error('DOCUMENTO ORIGINAL NÃO ENCONTRADO PARA CONCILIAR ESTORNO.');
  const pagamentos=(doc.pagamentos||[]).filter(p=>normalizedPayment(p.forma||p.formaId||p.tipo||p.formaPagamento||p.descricao)===forma);
  const brutoTotal=pagamentos.reduce((n,p)=>n+cents(p.valor),0);
  if(brutoTotal<=0)throw Error('PAGAMENTO ORIGINAL NÃO IDENTIFICADO PARA '+forma+'.');
  const contaIds=[...new Set(pagamentos.map(p=>String(p.contaId||'')).filter(Boolean))];
  if(contaIds.length!==1)throw Error('CONTA BANCÁRIA ORIGINAL AMBÍGUA OU NÃO INFORMADA. ESTORNO FINANCEIRO BLOQUEADO.');
  const conta=d.contas.find(x=>String(x.id)===contaIds[0]);
  if(!conta)throw Error('CONTA BANCÁRIA ORIGINAL NÃO LOCALIZADA.');
  const taxaTotal=pagamentos.reduce((n,p)=>n+cents(p.taxaLoja!=null?p.taxaLoja:(Number(p.valor||0)*Number(p.taxa||0)/100)),0);
  const estornos=getData('erp_systems_estornos_v1',[]).filter(x=>x.id!==reg.id&&x.tipoDocumento===reg.tipoDocumento&&String(reg.tipoDocumento==='TROCA'?x.trocaNumero:x.vendaNumero)===String(reg.tipoDocumento==='TROCA'?reg.trocaNumero:reg.vendaNumero)&&normalizedPayment(x.forma)===forma);
  const jaEstornado=estornos.reduce((n,x)=>n+cents(x.valor),0);
  const taxaAnterior=Math.round(taxaTotal*Math.min(brutoTotal,jaEstornado)/brutoTotal);
  const taxaAteAgora=Math.round(taxaTotal*Math.min(brutoTotal,jaEstornado+cents(reg.valor))/brutoTotal);
  const taxaRevertida=Math.max(0,taxaAteAgora-taxaAnterior);
  const liquidoCent=cents(reg.valor)-taxaRevertida;
  if(liquidoCent<0)throw Error('TAXA MAIOR QUE O ESTORNO.');
  const id=Math.max(0,...d.movimentos.map(x=>Number(x.id)||0))+1;
  const comum={date:reg.data.slice(0,10),conta:conta.id,usuario:reg.operador,created:reg.data,estornoId:reg.id,valorBruto:reg.valor};
  d.movimentos.push({...comum,id,tipo:'SAIDA',valor:liquidoCent/100,descricao:'ESTORNO LÍQUIDO '+reg.tipoDocumento+' '+String(reg.tipoDocumento==='TROCA'?reg.trocaNumero:reg.vendaNumero).padStart(6,'0'),ref,categoria:'ESTORNO DE '+(reg.tipoDocumento||'VENDA'),taxaRevertida:taxaRevertida/100});
  if(taxaRevertida>0)d.movimentos.push({...comum,id:id+1,tipo:'INFORMATIVO',valor:taxaRevertida/100,descricao:'REVERSÃO DE TAXA — '+ref,ref:ref+'-TAXA',categoria:'ESTORNO_TAXA',contabilizaSaldo:false});
  localStorage.setItem(key,JSON.stringify(d));
 }

 const paymentForm=x=>normalizedPayment(x.forma||x.formaId||x.tipo||x.formaPagamento||x.descricao);
 const receivedForRefund=v=>{
  const numero=String(Number(v.numero));
  return getData('erp_systems_caixas_v1',[]).flatMap(c=>c.movimentos||[]).filter(m=>m.categoria==='VENDA'&&m.tipo==='ENTRADA'&&(
    String(m.ref||'').startsWith('VENDA:'+numero+':')||
    (m.vendaNumero!=null&&String(Number(m.vendaNumero))===numero)||
    new RegExp('\\bVENDA\\s*(?:N[º°O.]*)?\\s*#?\\s*0*'+numero+'(?!\\d)','i').test(String(m.descricao||''))));
 };
 const balances=v=>{
  const numero=String(Number(v.numero));
  const isSale=m=>{
   if(m.categoria!=='VENDA'||m.tipo!=='ENTRADA')return false;
   if(String(m.ref||'').startsWith('VENDA:'+numero+':'))return true;
   if(m.vendaNumero!=null&&String(Number(m.vendaNumero))===numero)return true;
   return new RegExp('\\bVENDA\\s*(?:N[º°O.]*)?\\s*#?\\s*0*'+numero+'(?!\\d)','i').test(String(m.descricao||''));
  };
  const caixas=getData('erp_systems_caixas_v1',[]);
  const allMoves=caixas.flatMap(c=>(c.movimentos||[]));
  const received=allMoves.filter(isSale);
  const formTotals={};
  received.forEach(m=>{const f=paymentForm(m);formTotals[f]=(formTotals[f]||0)+cents(m.valor)});
  // Pagamentos da venda são usados somente se não houver lançamento correspondente no Caixa.
  // A ausência deles após o cancelamento não apaga o recebimento histórico.
  const accepted=(v.situacaoAntesCancelamento==='BAIXADA'||v.baixadaEm||v.historico?.some?.(h=>String(h.acao||'').includes('BAIXAR')));
  if(!received.length&&accepted)(v.pagamentos||[]).filter(x=>!x.boleto&&!String(x.descricao||'').toUpperCase().includes('BOLETO')).forEach(x=>{const f=paymentForm(x);formTotals[f]=(formTotals[f]||0)+cents(x.valor)});
  const manual=getData('erp_systems_estornos_v1',[]).filter(x=>String(Number(x.vendaNumero))===numero);
  const returned={};
  manual.forEach(x=>{const f=paymentForm(x);returned[f]=(returned[f]||0)+cents(x.valor)});
  // Movimentos antigos de estorno automático NÃO comprovam devolução ao cliente.
  // A V71 os tratava incorretamente como estornos confirmados.
  // Eles permanecem no histórico para auditoria e serão conciliados na confirmação.
  return Object.entries(formTotals).map(([forma,total])=>({forma,total,returned:Math.min(total,returned[forma]||0),restante:Math.max(0,total-(returned[forma]||0))}));
 };
 function selecionarPagamentosEstorno(entries,onSelect){
  const overlay=el('div','erp-overlay cx-shortcut-overlay'),dialog=el('div','cx-refund-picker');
  const close=()=>overlay.remove();
  const head=el('div','cx-refund-picker-head');head.append(el('strong','','SELECIONAR PAGAMENTOS PARA ESTORNO'),btn('×',close,'cx-refund-picker-x'));dialog.append(head);
  const body=el('div','cx-refund-picker-body');const selected=new Set(entries.map((_,i)=>i));
  const table=el('table','cx-refund-picker-table'),th=el('tr');['SELECIONAR','DOCUMENTO','FORMA DE PAGAMENTO','VALOR PENDENTE'].forEach(t=>th.append(el('th','',t)));table.append(th);
  const total=el('strong','','');
  const update=()=>{const sum=entries.reduce((a,x,i)=>a+(selected.has(i)?x.restante:0),0);total.textContent='TOTAL SELECIONADO: '+fmt(sum/100)};
  entries.forEach((x,i)=>{const tr=el('tr'),td=el('td'),check=el('input');check.type='checkbox';check.checked=true;check.addEventListener('change',()=>{if(check.checked)selected.add(i);else selected.delete(i);update()});td.append(check);tr.append(td);[x.documento,x.forma,fmt(x.restante/100)].forEach(t=>tr.append(el('td','',t)));table.append(tr)});
  body.append(table,total);const foot=el('div','cx-refund-picker-foot cx-refund-payment-actions');foot.append(btn('CONTINUAR',()=>{const chosen=entries.filter((_,i)=>selected.has(i));if(!chosen.length)return erpAlert('SELECIONE PELO MENOS UM PAGAMENTO.');close();onSelect(chosen)},'cx-refund-payment-continue'),btn('CANCELAR',close,'cx-refund-picker-cancel'));body.append(foot);dialog.append(body);overlay.append(dialog);document.body.append(overlay);update();
 }
 function validarOperadorEstorno(done){
  authenticate('IDENTIFICAÇÃO PARA ESTORNAR',code=>{
   const all=reconcileCashRefunds(),cash=all.find(x=>String(x.operador)===String(code)&&x.situacao==='ABERTO');
   if(!cash)return erpAlert('ESTORNO BLOQUEADO: ESTE USUÁRIO NÃO POSSUI CAIXA ABERTO.');
   done(code,cash);
  });
 }
 function confirmarEstorno(message,onConfirm){
  // Identificação obrigatória ANTES da confirmação; nunca executar com operador antigo.
  window.__llEstornoOperador=null;
  window.__llEstornoCaixa=null;
  validarOperadorEstorno((code,cash)=>{
   const overlay=el('div','erp-overlay cx-shortcut-overlay'),dialog=el('div','cx-shortcut-dialog cx-estorno-confirm-dialog');
   const head=el('div','cx-shortcut-head');head.append(el('strong','','▣ CONFIRMAR ESTORNO'),btn('×',()=>overlay.remove(),'cx-shortcut-x'));dialog.append(head);
   const body=el('div','cx-shortcut-body');body.append(el('p','cx-refund-confirm-message',message));dialog.append(body);
   const footer=el('div','cx-shortcut-footer');footer.append(btn('CONFIRMAR',()=>{
    // Revalidar o caixa no momento exato da confirmação.
    const aberto=reconcileCashRefunds().find(x=>String(x.id)===String(cash.id)&&String(x.operador)===String(code)&&x.situacao==='ABERTO');
    if(!aberto)return erpAlert('ESTORNO BLOQUEADO: O CAIXA DO USUÁRIO NÃO ESTÁ ABERTO.');
    overlay.remove();window.__llEstornoOperador=code;window.__llEstornoCaixa=aberto.id;
    try{onConfirm()}finally{window.__llEstornoOperador=null;window.__llEstornoCaixa=null}
   },'cx-shortcut-close'),btn('CANCELAR',()=>overlay.remove(),'cx-estorno-confirm-cancel'));dialog.append(footer);
   overlay.append(dialog);overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};document.body.append(overlay);
  });
 }
 // V376: o documento é identificado pelo par TIPO + NÚMERO, nunca apenas pelo número.
 function tradeBalances(t){
  const pend=getData('erp_systems_estornos_trocas_pendentes_v1',[]).find(x=>String(x.trocaNumero)===String(t.numero));
  if(!pend||t.situacao!=='CANCELADA')return [];
  const logs=getData('erp_systems_estornos_v1',[]).filter(x=>x.tipoDocumento==='TROCA'&&String(x.trocaNumero)===String(t.numero));
  const forms={};
  (pend.pagamentos||[]).forEach(x=>{const f=paymentForm(x);forms[f]=(forms[f]||0)+cents(x.valor)});
  return Object.entries(forms).map(([forma,total])=>{const returned=logs.filter(x=>paymentForm(x)===forma).reduce((a,x)=>a+cents(x.valor),0);return {forma,total,returned:Math.min(total,returned),restante:Math.max(0,total-returned)}});
 }
 function tradeGroup(v){
  return getData('erp_matriz_trocas_v1',[]).filter(t=>String(t.venda)===String(v.numero)&&t.situacao==='CANCELADA'&&tradeBalances(t).some(x=>x.restante>0));
 }
 function refundTrades(trades,selectedKeys=null){
  const all=getData('erp_systems_estornos_v1',[]),cashList=reconcileCashRefunds(),agora=new Date().toISOString();
  let total=0;
  for(const t of trades){
   const pending=getData('erp_systems_estornos_trocas_pendentes_v1',[]).find(x=>String(x.trocaNumero)===String(t.numero));
   if(!pending)continue;
   const cash=cashList.find(x=>String(x.id)===String(window.__llEstornoCaixa));
   if(!cash)throw Error('CAIXA DA TROCA '+t.numero+' NÃO ENCONTRADO.');
   cash.movimentos=Array.isArray(cash.movimentos)?cash.movimentos:[];
   for(const item of tradeBalances(t).filter(x=>x.restante>0&&(!selectedKeys||selectedKeys.has(String(t.numero)+'|'+x.forma)))){
    const id='EST-TROCA-'+t.numero+'-'+item.forma.replace(/\W/g,'')+'-'+Date.now();
    if(all.some(x=>x.id===id))continue;
    const reg={id,tipoDocumento:'TROCA',trocaNumero:t.numero,vendaNumero:t.venda,cliente:t.cliente||'',valor:item.restante/100,forma:item.forma,data:agora,caixaId:cash.id,operador:cash.operador,pendenteEfetivacao:item.forma!=='DINHEIRO'};
    cash.movimentos.push({idEstorno:id,trocaNumero:t.numero,vendaNumero:t.venda,tipo:'SAÍDA',categoria:'ESTORNO DE TROCA',descricao:'ESTORNO TROCA '+String(t.numero).padStart(6,'0')+' — VENDA '+String(t.venda).padStart(6,'0'),valor:reg.valor,forma:item.forma,data:agora,operador:cash.operador,estornoConfirmado:true});
    all.push(reg);total+=item.restante;
   }
   if(!tradeBalances(t).some(x=>x.restante>0&&(!selectedKeys||!selectedKeys.has(String(t.numero)+'|'+x.forma))))pending.situacao='ESTORNADO';
  }
  localStorage.setItem(KEY,JSON.stringify(cashList));
  localStorage.setItem('erp_systems_estornos_v1',JSON.stringify(all));
  const pendingAll=getData('erp_systems_estornos_trocas_pendentes_v1',[]);
  for(const x of pendingAll){if(trades.some(t=>String(t.numero)===String(x.trocaNumero))&&!tradeBalances(trades.find(t=>String(t.numero)===String(x.trocaNumero))).some(y=>y.restante>0))x.situacao='ESTORNADO'}
  localStorage.setItem('erp_systems_estornos_trocas_pendentes_v1',JSON.stringify(pendingAll));
  caixas=cashList;
  return total;
 }
 function locateTrade(){
  const trade=getData('erp_matriz_trocas_v1',[]).find(x=>numero.value.trim()&&Number(x.numero)===Number(numero.value));
  // Compartilhar o documento localizado com a rotina de impressão, mesmo após o estorno completo.
  escolhida=trade||null;
  details.replaceChildren();actions.replaceChildren();
  if(!trade)return erpAlert('TROCA NÃO ENCONTRADA.');
  if(trade.situacao!=='CANCELADA')return erpAlert('SOMENTE TROCAS CANCELADAS PODEM SER ESTORNADAS.');
  const items=tradeBalances(trade),sum=items.reduce((a,x)=>a+x.restante,0);
  details.append(el('div','cx-section-title','INFORMAÇÕES DA TROCA'));
  const grid=el('div','cx-refund-grid');details.append(grid);
  [['Nº DA TROCA',String(trade.numero).padStart(6,'0')],['VENDA ORIGINAL',String(trade.venda).padStart(6,'0')],['SITUAÇÃO','CANCELADA'],['VALOR A DEVOLVER',fmt(sum/100)]].forEach(([k,v])=>{const b=el('div','cx-refund-info');b.append(el('small','',k),el('strong','',v));grid.append(b)});
  if(!sum){actions.append(el('p','cx-note','NÃO HÁ ESTORNO PENDENTE PARA ESTA TROCA.'));return}
  items.forEach(x=>actions.append(el('p','cx-note',x.forma+' — '+fmt(x.restante/100))));
  actions.append(btn('ESTORNAR',()=>selecionarPagamentosEstorno(items.filter(x=>x.restante>0).map(x=>({...x,documento:'TROCA Nº '+trade.numero,chave:String(trade.numero)+'|'+x.forma})),chosen=>confirmarEstorno('CONFIRMAR DEVOLUÇÃO DE '+fmt(chosen.reduce((s,x)=>s+x.restante,0)/100)+'?',()=>{
   try{const amount=refundTrades([trade],new Set(chosen.map(x=>x.chave)));erpAlert('ESTORNO REGISTRADO: '+fmt(amount/100));locateTrade()}catch(e){erpAlert(e.message)}
  })),'cx-action green'));
 }
 function localizar(){
  if(tipoDoc.value==='TROCA')return locateTrade();
  const vendas=getData(vendasKey,[]);
  escolhida=vendas.find(v=>numero.value.trim()&&Number(v.numero)===Number(numero.value));
  details.replaceChildren();actions.replaceChildren();
  if(!escolhida)return erpAlert('VENDA NÃO ENCONTRADA.');
  if(String(escolhida.situacao).toUpperCase()!=='CANCELADA')return erpAlert('SOMENTE VENDAS CANCELADAS PODEM SER ESTORNADAS.');
  const data=balances(escolhida),sum=data.reduce((s,x)=>s+x.restante,0);
  const bar=el('div','cx-section-title','INFORMAÇÕES DA VENDA');details.append(bar);
  const grid=el('div','cx-refund-grid');details.append(grid);
  [['Nº DA VENDA',String(escolhida.numero).padStart(6,'0')],['CLIENTE',String(escolhida.cliente||'—')],['SITUAÇÃO','CANCELADA'],['VALOR A DEVOLVER',fmt(sum/100)]].forEach(([k,v])=>{
   const b=el('div','cx-refund-info');b.append(el('small','',k),el('strong','',v));grid.append(b);
  });
  actions.append(el('div','cx-section-title','DEVOLUÇÃO POR FORMA DE PAGAMENTO'));
  if(!data.length){actions.append(el('p','cx-note','NÃO HÁ RECEBIMENTOS IDENTIFICADOS PARA ESTA VENDA NO HISTÓRICO DO CAIXA OU NOS PAGAMENTOS REGISTRADOS. NENHUM ESTORNO SERÁ GERADO.'));return}
  const pendentes=data.filter(x=>x.restante>0);
  const related=getData('erp_matriz_trocas_v1',[]).filter(t=>String(t.venda)===String(escolhida.numero));
  const active=related.filter(t=>t.situacao==='BAIXADA');
  if(active.length){actions.append(el('p','cx-note','EXISTEM TROCAS BAIXADAS VINCULADAS. CANCELE-AS ANTES DE ESTORNAR A VENDA PARA EVITAR DEVOLUÇÕES INCORRETAS.'));return}
  const group=tradeGroup(escolhida);
  if(group.length){
   const tradeSum=group.reduce((s,t)=>s+tradeBalances(t).reduce((a,x)=>a+x.restante,0),0);
   actions.append(btn('ESTORNAR VENDA + '+group.length+' TROCA(S) — '+fmt((sum+tradeSum)/100),()=>{
    confirmarEstorno('CONFIRMAR ESTORNO DA VENDA E DE '+group.length+' TROCA(S), TOTAL '+fmt((sum+tradeSum)/100)+'?',()=>{
     // Operação combinada só é permitida com caixa e documentos válidos.
     const nowTrades=tradeGroup(escolhida);
     if(nowTrades.length!==group.length)return erpAlert('SITUAÇÃO DAS TROCAS MUDOU. LOCALIZE NOVAMENTE.');
     const caixaNow=reconcileCashRefunds().find(x=>String(x.id)===String(window.__llEstornoCaixa));
     if(!caixaNow)return erpAlert('CAIXA NÃO ENCONTRADO.');
     const allCashes=reconcileCashRefunds();const original=allCashes.find(x=>String(x.id)===String(window.__llEstornoCaixa));
     const records=getData('erp_systems_estornos_v1',[]),agora=new Date().toISOString();
     if(nowTrades.some(t=>!getData('erp_systems_caixas_v1',[]).some(ca=>String(ca.id)===String(window.__llEstornoCaixa))))return erpAlert('CAIXA DE UMA TROCA NÃO ENCONTRADO. NENHUM ESTORNO REALIZADO.');
     const saleItems=balances(escolhida).filter(x=>x.restante>0);
     for(const item of saleItems){const id='EST-VENDA-'+escolhida.numero+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);const reg={id,tipoDocumento:'VENDA',vendaNumero:escolhida.numero,cliente:escolhida.cliente,valor:item.restante/100,forma:item.forma,data:agora,caixaId:original.id,operador:original.operador};original.movimentos.push({idEstorno:id,vendaNumero:escolhida.numero,tipo:'SAÍDA',categoria:'ESTORNO DE VENDA',descricao:'ESTORNO VENDA '+String(escolhida.numero).padStart(6,'0'),valor:reg.valor,forma:item.forma,data:agora,operador:original.operador,estornoConfirmado:true});records.push(reg)}
     localStorage.setItem(KEY,JSON.stringify(allCashes));localStorage.setItem('erp_systems_estornos_v1',JSON.stringify(records));
     try{refundTrades(nowTrades)}catch(e){return erpAlert('ESTORNO DA VENDA REGISTRADO; FALHA NO ESTORNO DAS TROCAS: '+e.message)}
     erpAlert('ESTORNO CONJUNTO CONFIRMADO: '+fmt((sum+tradeSum)/100));localizar();
    });
   },'cx-action green'));
   actions.append(el('p','cx-note','O BOTÃO ACIMA ESTORNA A VENDA E AS TROCAS CANCELADAS EM UMA ÚNICA CONFIRMAÇÃO.'));
  }
  if(pendentes.length&&!group.length){actions.append(btn('ESTORNAR',()=>selecionarPagamentosEstorno(pendentes.map(x=>({...x,documento:'VENDA Nº '+escolhida.numero})),selecionados=>{
   const atual=getData(vendasKey,[]).find(x=>String(x.numero)===String(escolhida.numero));
   if(!atual||String(atual.situacao).toUpperCase()!=='CANCELADA')return erpAlert('VENDA NÃO ESTÁ CANCELADA.');
   const parcelas=balances(atual).filter(x=>x.restante>0&&selecionados.some(y=>y.forma===x.forma));
   if(!parcelas.length)return erpAlert('ESTORNO JÁ REGISTRADO.');
   confirmarEstorno('CONFIRMAR ESTORNO TOTAL DE '+fmt(parcelas.reduce((s,x)=>s+x.restante,0)/100)+' EM TODAS AS FORMAS DE PAGAMENTO?',()=>{
    const caixasAtuais=reconcileCashRefunds(),caixaAtual=caixasAtuais.find(x=>String(x.id)===String(window.__llEstornoCaixa));
    if(!caixaAtual)return erpAlert('CAIXA ORIGINAL NÃO ENCONTRADO.');
    caixaAtual.movimentos=caixaAtual.movimentos||[];
    const historico=getData('erp_systems_estornos_v1',[]),agora=new Date().toISOString();
    for(const item of parcelas){
     const id='EST-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
     const reg={id,vendaNumero:atual.numero,cliente:atual.cliente,valor:item.restante/100,forma:item.forma,data:agora,caixaId:caixaAtual.id,operador:caixaAtual.operador,pendenteEfetivacao:item.forma!=='DINHEIRO'};
     const originais=caixaAtual.movimentos.filter(m=>m.tipo==='SAÍDA'&&m.estornoRef&&receivedForRefund(atual).some(e=>e.ref===m.estornoRef)&&paymentForm(m)===item.forma&&!m.estornoConfirmado&&!m.estornado);
     let saldo=item.restante;
     for(const m of originais){if(saldo<=0)break;const valor=cents(m.valor);if(valor<=saldo){m.estornoConfirmado=true;m.idEstorno=id;saldo-=valor;}else{m.valor=(valor-saldo)/100;caixaAtual.movimentos.push({...m,valor:saldo/100,estornoConfirmado:true,idEstorno:id,data:agora});saldo=0;}}
     if(saldo>0)caixaAtual.movimentos.push({idEstorno:id,vendaNumero:atual.numero,tipo:'SAÍDA',categoria:'ESTORNO DE VENDA',descricao:'ESTORNO VENDA '+String(atual.numero).padStart(6,'0'),valor:saldo/100,forma:item.forma,data:agora,operador:caixaAtual.operador,estornoConfirmado:true,pendenteEfetivacao:item.forma!=='DINHEIRO'});
     historico.push(reg);
    }
    localStorage.setItem(KEY,JSON.stringify(caixasAtuais));localStorage.setItem('erp_systems_estornos_v1',JSON.stringify(historico));caixas=caixasAtuais;
    historico.filter(x=>x.data===agora&&String(x.vendaNumero)===String(atual.numero)).forEach(lancarFinanceiroEstorno);
    erpAlert('VENDA ESTORNADA INTEGRALMENTE: '+fmt(parcelas.reduce((s,x)=>s+x.restante,0)/100));localizar();
   });
  }),'cx-action green'));}
  if(!group.length)data.forEach(item=>{
   const row=el('div','cx-refund-payment');actions.append(row);
   const info=el('div');info.append(el('strong','',item.forma),el('small','',`RECEBIDO: ${fmt(item.total/100)} · DEVOLVIDO: ${fmt(item.returned/100)} · RESTANTE: ${fmt(item.restante/100)}`));row.append(info);
   if(!item.restante){row.append(el('span','cx-refund-done','ESTORNADO'));return}
   const [vw,amount]=input('VALOR A ESTORNAR (R$)','number',(item.restante/100).toFixed(2));amount.step='0.01';amount.min='0.01';amount.max=String(item.restante/100);row.append(vw);
   row.append(btn('ESTORNO',()=>{
    const v=getData(vendasKey,[]).find(x=>String(x.numero)===String(escolhida.numero));
    if(!v||String(v.situacao).toUpperCase()!=='CANCELADA')return erpAlert('A VENDA NÃO ESTÁ CANCELADA.');
    const current=balances(v).find(x=>x.forma===item.forma);
    const cent=cents(amount.value);
    if(!current||!Number.isFinite(Number(amount.value))||cent<=0||cent>current.restante)return erpAlert('VALOR INVÁLIDO OU JÁ ESTORNADO.');
    // O saldo pode ficar negativo após devoluções: registrar a saída real sem bloquear o estorno.
    confirmarEstorno('CONFIRMAR ESTORNO DE '+fmt(cent/100)+' POR '+item.forma+'?',()=>{
    const id='EST-'+Date.now()+'-'+Math.floor(Math.random()*100000),dataHora=new Date().toISOString();
    // Recarregar o caixa: vendas e outros módulos atualizam o localStorage independentemente.
    // Usar a referência antiga sobrescrevia movimentações e ocultava o débito no painel.
    const caixasAtuais=reconcileCashRefunds();
    const caixaAtual=caixasAtuais.find(x=>String(x.id)===String(window.__llEstornoCaixa));
    if(!caixaAtual)return erpAlert('CAIXA ORIGINAL NÃO ENCONTRADO. ESTORNO NÃO REGISTRADO.');
    caixaAtual.movimentos=caixaAtual.movimentos||[];
    const reg={id,vendaNumero:v.numero,cliente:v.cliente,valor:cent/100,forma:item.forma,data:dataHora,caixaId:caixaAtual.id,operador:caixaAtual.operador};
    // Conciliação de versões anteriores: se o cancelamento já criou uma SAÍDA
    // automática no livro-caixa, reutilizar esse débito, sem descontar duas vezes.
    const auto=caixaAtual.movimentos.filter(m=>m.tipo==='SAÍDA'&&m.estornoRef&&
      receivedForRefund(v).some(e=>e.ref===m.estornoRef)&&
      paymentForm(m)===item.forma&&!m.estornoConfirmado&&!m.estornado);
    let saldoAntigo=cent;
    for(const m of auto){if(saldoAntigo<=0)break;
      const existente=cents(m.valor);
      if(existente<=saldoAntigo){m.estornoConfirmado=true;m.idEstorno=id;saldoAntigo-=existente;}
      else {m.valor=(existente-saldoAntigo)/100;
        caixaAtual.movimentos.push({...m,valor:saldoAntigo/100,estornoConfirmado:true,idEstorno:id,data:dataHora});saldoAntigo=0;}
    }
    // Persistir primeiro o movimento do caixa; depois a confirmação do estorno.
    if(saldoAntigo>0){
     // Toda devolução é registrada imediatamente na forma original. Somente DINHEIRO altera o saldo físico.
     caixaAtual.movimentos.push({idEstorno:id,vendaNumero:v.numero,tipo:'SAÍDA',categoria:'ESTORNO DE VENDA',descricao:'ESTORNO VENDA '+String(v.numero).padStart(6,'0'),valor:saldoAntigo/100,forma:item.forma,data:dataHora,operador:caixaAtual.operador,estornoConfirmado:true});
    }
    localStorage.setItem(KEY,JSON.stringify(caixasAtuais));
    const all=getData('erp_systems_estornos_v1',[]);all.push(reg);
    localStorage.setItem('erp_systems_estornos_v1',JSON.stringify(all));
    caixas=caixasAtuais;
    lancarFinanceiroEstorno(reg);
    erpAlert('ESTORNO REGISTRADO NO CAIXA: '+fmt(cent/100)+' — '+item.forma);
    localizar();
    });
   },'cx-action green'));
  });

 }
 const pesquisa=el('section','cx-expense-search cx-refund-history');pesquisa.append(el('div','cx-section-title','PESQUISA DE ESTORNOS DE VENDAS E TROCAS'));
 const filtros=el('div','cx-expense-search-row');const [fw,inicio]=input('DATA INICIAL','date'),[tw,fim]=input('DATA FINAL','date');
 const tipoFiltroWrap=el('label','cx-field');tipoFiltroWrap.append(el('span','','TIPO DE DOCUMENTO'));const tipoFiltro=el('select');[['TODOS','TODOS'],['VENDA','VENDAS'],['TROCA','TROCAS']].forEach(([value,label])=>{const option=el('option','',label);option.value=value;tipoFiltro.append(option)});tipoFiltroWrap.append(tipoFiltro);
 const resultado=el('div','cx-expense-search-results');
 const pesquisar=()=>{resultado.replaceChildren();if(inicio.value&&fim.value&&inicio.value>fim.value)return erpAlert('PERÍODO INVÁLIDO.');
  const list=getData('erp_systems_estornos_v1',[]).filter(x=>{const d=String(x.data||'').slice(0,10);return (!inicio.value||d>=inicio.value)&&(!fim.value||d<=fim.value)&&(tipoFiltro.value==='TODOS'||(x.tipoDocumento==='TROCA'?'TROCA':'VENDA')===tipoFiltro.value)}).sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  const table=el('table','cx-dash-table cx-expense-results-table'),head=el('tr');['DATA','TIPO','Nº DOCUMENTO','CLIENTE','FORMA','VALOR','OPERADOR'].forEach(x=>head.append(el('th','',x)));table.append(head);
  list.forEach(x=>{const tr=el('tr');[String(x.data||'').slice(0,10).split('-').reverse().join('/'),x.tipoDocumento==='TROCA'?'TROCA':'VENDA',String(x.tipoDocumento==='TROCA'?x.trocaNumero:x.vendaNumero).padStart(6,'0'),x.cliente||'—',x.forma||'—',fmt(x.valor),x.operador||'—'].forEach(y=>tr.append(el('td','',String(y))));tr.title='DUPLO CLIQUE PARA ABRIR';tr.ondblclick=()=>{tipoDoc.value=x.tipoDocumento==='TROCA'?'TROCA':'VENDA';numero.value=String(x.tipoDocumento==='TROCA'?x.trocaNumero:x.vendaNumero);localizar();window.scrollTo({top:0,behavior:'smooth'})};table.append(tr)});resultado.append(table);if(!list.length)resultado.append(el('p','cx-note','NENHUM ESTORNO ENCONTRADO.'));
 };
 filtros.append(fw,tw,tipoFiltroWrap,btn('PESQUISAR',pesquisar,'cx-search-submit'));pesquisa.append(filtros,resultado);p.append(pesquisa);
 tipoDoc.onchange=()=>{numero.value='';numero.placeholder=tipoDoc.value==='TROCA'?'DIGITE O NÚMERO DA TROCA (F12)':'DIGITE O NÚMERO DA VENDA (F12)';details.replaceChildren();actions.replaceChildren()};
 numero.oninput=()=>{if(numero.value.trim())localizar();else{details.replaceChildren();actions.replaceChildren()}};
 numero.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();localizar()}};
 const shortcut=e=>{if(!p.isConnected){document.removeEventListener('keydown',shortcut);return}if(e.key==='F12'){e.preventDefault();numero.focus();numero.select()}};
 document.addEventListener('keydown',shortcut);
 numero.focus();
}
function closeCash(c){authenticate('IDENTIFICAÇÃO PARA FECHAR CAIXA',code=>{if(code!==c.operador){erpAlert('O FECHAMENTO DE OUTRO OPERADOR EXIGE AUTORIZAÇÃO ADMINISTRATIVA, AINDA NÃO IMPLEMENTADA.');return}let p=panel('FECHAMENTO DE CAIXA Nº '+c.id);p.querySelector('.cx-shortcuts')?.remove();summary(p,c);const [cw,contado]=input('DINHEIRO CONTADO (R$)','number',String(expected(c)));contado.min='0';contado.step='0.01';const diff=el('p','cx-diff');const update=()=>{let v=Number(contado.value)-expected(c);diff.textContent='DIFERENÇA: '+(v<0?'FALTA ':v>0?'SOBRA ':'SEM DIFERENÇA ')+fmt(Math.abs(v))};contado.oninput=update;p.append(cw,diff);update();const label=el('label','cx-field','DESTINO DO DINHEIRO');const dest=el('select');[['TESOURARIA','ENTREGAR À TESOURARIA'],['MANTER','MANTER NO CAIXA']].forEach(([value,title])=>{let o=el('option','',title);o.value=value;dest.append(o)});label.append(dest);p.append(label);const actions=el('div','cx-row cx-opening-actions');p.append(actions);actions.append(btn('CONFIRMAR FECHAMENTO',()=>{let val=Number(contado.value);if(!Number.isFinite(val)||val<0)return erpAlert('VALOR INVÁLIDO.');c.contado=val;c.diferenca=+(val-expected(c)).toFixed(2);c.destino=dest.value;c.situacao='FECHADO';c.fechamento=new Date().toISOString();save();cashScreen()},'cx-btn-blue'));actions.append(btn('CANCELAR',cashScreen,'cx-btn-lightblue'))})}
// Consulta sem lançamento adicional: recebimentos já registrados nos caixas.
function showCashReceipts(c){
 const p=panel('RECEBIMENTOS DO CAIXA');
 const shortcutButton=p.querySelector('.cx-shortcuts');if(shortcutButton)shortcutButton.remove();
 const section=el('div','cx-vendas-card');section.append(el('div','cx-vendas-section','LOCALIZAR E RECEBER PARCELAS DE CARNÊ'));
 const help=el('p','cx-note','DIGITE O CÓDIGO IMPRESSO NO CARNÊ: V15-02 (VENDA) OU N8-01 (NEGOCIAÇÃO).');section.append(help);
 const line=el('div','cx-filters');const code=el('input');code.placeholder='CÓDIGO DO CARNÊ (EX.: V15-02)';code.setAttribute('aria-label','Código do carnê');const locate=btn('LOCALIZAR',find,'cx-action blue');line.append(code,locate);section.append(line);
 const details=el('div','cx-listing');section.append(details);p.append(section);
 const hist=el('div','cx-vendas-card');hist.append(el('div','cx-vendas-section','PESQUISA DE RECEBIMENTOS'));const filters=el('div','cx-filters');const from=el('input');from.type='date';const to=el('input');to.type='date';const search=el('input');search.placeholder='PESQUISAR POR CÓDIGO OU DESCRIÇÃO';const go=btn('PESQUISAR',draw,'cx-action blue');filters.append(from,to,search,go);hist.append(filters);const listing=el('div','cx-listing');hist.append(listing);p.append(hist);
 const footer=el('div','cx-receipts-footer');
 const footerPrint=btn('IMPRIMIR',()=>{erpAlert('LOCALIZE UMA PARCELA OU SELECIONE UM RECEBIMENTO PARA IMPRIMIR.');},'cx-action gray');
 footerPrint.style.display='none';footer.append(footerPrint,btn('VOLTAR',cashScreen,'cx-action red'));p.insertBefore(footer,hist);
 function setPrintAction(action){footerPrint.onclick=action;footerPrint.style.display='';}

 function db(){try{const d=JSON.parse(localStorage.getItem('erp_matriz_operacoes_v2')||'{}');return d&&typeof d==='object'?d:{}}catch{return {}}}
 function confirmEntry(title,message,onConfirm){
  const overlay=el('div','erp-overlay'),dialog=el('div','erp-dialog cx-dialog');
  dialog.append(el('div','cx-confirm-title',title),el('p','cx-confirm-message',message));
  const actions=el('div','cx-confirm-buttons');
  actions.append(btn('CONFIRMAR',()=>{overlay.remove();onConfirm()},'cx-btn-green'),btn('VOLTAR',()=>overlay.remove(),'cx-btn-gray'));
  dialog.append(actions);overlay.append(dialog);document.body.append(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
 }
 function cashesNow(){return read()}
 function caixaDoUsuario(){
  const user=connectedUser();
  if(!user?.id)return null;
  return cashesNow().find(z=>z.situacao==='ABERTO'&&String(z.operador)===String(user.id))||null;
 }
 function getCode(x){if(x.codigoCarne||x.codigoCarneParcela||x.codigoIdentificacao)return String(x.codigoCarne||x.codigoCarneParcela||x.codigoIdentificacao).toUpperCase().replace(/\s/g,'');const ref=String(x.ref||x.origem||'');const m=ref.match(/(?:VENDA|NEGOCIA(?:ÇÃO|CAO)|^\s*([VN]))\s*[Nº#:-]*\s*(\d+)/i);if(!m)return '';const prefix=/NEGOCIA|^\s*N/i.test(ref)?'N':'V';return prefix+Number(m[2])+'-'+String(Number(x.parcela||1)).padStart(2,'0')}
 function find(){details.replaceChildren();footerPrint.style.display='none';const q=code.value.toUpperCase().replace(/\s/g,'');const match=q.match(/^([VN])(\d+)-(\d{1,3})$/);if(!match){details.append(el('p','cx-note','INFORME UM CÓDIGO VÁLIDO, COMO V15-02 OU N8-01.'));return}const d=db();const matches=(d.receber||[]).filter(x=>getCode(x)===q);if(matches.length!==1){details.append(el('p','cx-note',matches.length?'CÓDIGO DUPLICADO. CORRIJA A IDENTIFICAÇÃO DAS PARCELAS.':'PARCELA NÃO ENCONTRADA EM CONTAS A RECEBER. CONFIRA SE O CARNÊ FOI GERADO E SALVO.'));return}const x=matches[0];const balance=Number(x.saldo??(Number(x.valor||0)-Number(x.pago||0)));const status=String(x.situacao||'PENDENTE').toUpperCase();const info=el('div','cx-vendas-card cx-parcel-detail');info.append(el('div','cx-vendas-section','DADOS DA PARCELA'));
 const dateBR=v=>{if(!v)return '—';const t=String(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(t)?t.split('-').reverse().join('/'):String(v)};
 const due=String(x.vencimento||'').slice(0,10);const today=new Date();today.setHours(0,0,0,0);const dueDate=/^\d{4}-\d{2}-\d{2}$/.test(due)?new Date(due+'T00:00:00'):null;const overdue=dueDate&&balance>0?Math.max(0,Math.floor((today-dueDate)/86400000)):0;
 const source=String(x.ref||x.origem||'');const originNo=x.numeroOrigem||Number(match[2]);const isNegotiation=match[1]==='N';
 for(const name of ['DINHEIRO','PIX','CARTÃO DE DÉBITO','CARTÃO DE CRÉDITO','TRANSFERÊNCIA']){if(!rows.some(f=>f.key===classify(name)))rows.push({id:'PADRAO:'+name,name,key:classify(name)})}
 const sales=(()=>{try{return JSON.parse(localStorage.getItem('erp_vendas_trocas_v1')||'[]')}catch{return []}})();
 const name=String(x.nomeCliente||x.clienteNome||x.nomePessoa||x.cliente||x.pessoa||'—');
 const heading=el('div','cx-parcel-head');heading.append(el('div','','CÓDIGO DO CARNÊ: '+q),el('strong','',status));info.append(heading);
 const gridInfo=el('div','cx-parcel-grid');
 const fields=[['Nº DA VENDA',isNegotiation?(x.numeroVendaOriginal||'—'):String(originNo).padStart(6,'0')],['Nº DA NEGOCIAÇÃO',isNegotiation?String(originNo).padStart(6,'0'):'—'],['CÓDIGO DO CLIENTE',String(x.pessoa||x.clienteId||'—')],['NOME DO CLIENTE',name],['PARCELA',String(x.parcela||1)+'/'+String(x.totalParcelas||1)],['DATA DA VENDA / NEGOCIAÇÃO',dateBR(x.dataVenda||x.dataNegociacao||x.data||'')],['VENCIMENTO',dateBR(x.vencimento)],['DIAS EM ATRASO',String(overdue)],['VALOR ORIGINAL',fmt(x.valor)],['TOTAL JÁ RECEBIDO',fmt(x.pago||0)],['DESCONTOS REGISTRADOS',fmt((x.pagamentos||[]).filter(p=>!p.estornado).reduce((n,p)=>n+Number(p.desconto||0),0))],['ACRÉSCIMOS REGISTRADOS',fmt((x.pagamentos||[]).filter(p=>!p.estornado).reduce((n,p)=>n+Number(p.juros||0)+Number(p.multa||0),0))],['ORIGEM',source||'—'],['SITUAÇÃO',status]];
 fields.forEach(([k,v])=>{const cell=el('div','cx-parcel-cell');cell.append(el('small','',k),el('strong','',String(v)));gridInfo.append(cell)});info.append(gridInfo);
 const balanceBox=el('div','cx-parcel-balance');balanceBox.append(el('small','','SALDO RESTANTE'),el('strong','',fmt(balance)));info.append(balanceBox);
 if(overdue>0)info.append(el('p','cx-parcel-warning','ATENÇÃO: PARCELA COM '+overdue+' DIA(S) DE ATRASO.'));
 if(/QUEBRAD|SUBSTITU|CANCELAD|INATIV/.test(status))info.append(el('p','cx-parcel-warning','PARCELA BLOQUEADA PARA RECEBIMENTO: '+status));
 info.append(el('div','cx-vendas-section','HISTÓRICO DE PAGAMENTOS DA PARCELA'));
 const history=el('table','cx-dash-table'),trh=el('tr');['DATA / HORA','FORMA','VALOR','OPERADOR'].forEach(k=>trh.append(el('th','',k)));history.append(trh);
 const payments=Array.isArray(x.pagamentos)?x.pagamentos:[];payments.forEach(pay=>{const tr=el('tr');[pay.data?new Date(pay.data).toLocaleString('pt-BR'):'—',pay.forma||'—',fmt(pay.valor||pay.total||0)+(pay.estornado?' (ESTORNADO)':''),pay.operador||pay.usuario||'—'].forEach(v=>tr.append(el('td','',String(v))));history.append(tr)});info.append(history);if(!payments.length)info.append(el('p','cx-note','NENHUM PAGAMENTO REGISTRADO NESTA PARCELA.'));details.append(info);
 const printParcel=()=>{const printable=info.cloneNode(true);const w=window.open('','_blank');if(!w){erpAlert('PERMITA JANELAS POP-UP PARA IMPRIMIR.');return}w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>PARCELA '+q+'</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#172b4d}.cx-parcel-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.cx-parcel-cell{padding:8px;border-bottom:1px solid #ddd}.cx-parcel-cell small{display:block;color:#555}.cx-parcel-head{display:flex;justify-content:space-between;margin:16px 0}.cx-parcel-balance{margin:16px 0;font-size:20px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;text-align:left;padding:6px}</style></head><body><h2>RECEBIMENTOS DO CAIXA — DADOS DA PARCELA</h2>'+printable.outerHTML+'</body></html>');w.document.close();w.focus();w.print()};
 setPrintAction(printParcel);
 if(balance<=0.005||status==='PAGA'||status==='QUITADA'){details.append(el('p','cx-note','PARCELA QUITADA. NOVO RECEBIMENTO BLOQUEADO.'));return}
 if(/QUEBRAD|SUBSTITU|CANCELAD|INATIV/.test(status)){details.append(el('p','cx-note','PARCELA INATIVA OU NEGOCIAÇÃO QUEBRADA. RECEBIMENTO BLOQUEADO.'));return}
 const amount=el('input');amount.type='number';amount.min='0.01';amount.step='0.01';amount.max=String(balance);amount.value=balance.toFixed(2);const method=el('select');
 const registered=(()=>{try{const d=JSON.parse(localStorage.getItem('erp_matriz_formas_pagamento_v1')||'{}');return Array.isArray(d.formas)?d.formas.filter(f=>f.ativo===true||String(f.ativo).toUpperCase()==='SIM'||String(f.situacao||'').toUpperCase()==='ATIVO'):[]}catch{return []}})();
 method.add(new Option('SELECIONE',''));
 registered.filter(f=>f.vendas!==false).forEach(f=>{const o=new Option(String(f.descricao||f.tipo||''),String(f.id));o.dataset.tipo=String(f.tipo||'');method.add(o)});
 if(!registered.length)method.add(new Option('NENHUMA FORMA ATIVA CADASTRADA','',false,false));
 const selectedPayment=()=>registered.find(f=>String(f.id)===method.value);
const form=el('div','cx-filters');form.append(el('label','cx-field','VALOR RECEBIDO (R$)'),amount,el('label','cx-field','FORMA DE PAGAMENTO'),method);details.append(form);
 const receiveBtn=btn('RECEBER',()=>{const chosen=selectedPayment();if(!chosen){erpAlert('SELECIONE UMA FORMA DE PAGAMENTO CADASTRADA E ATIVA.');return}const val=Number(amount.value);if(!Number.isFinite(val)||val<=0||val>balance+0.005){erpAlert('VALOR INVÁLIDO OU SUPERIOR AO SALDO.');return}const cash=caixaDoUsuario();if(!cash){erpAlert('CAIXA FECHADO. ABRA SEU CAIXA PARA REALIZAR RECEBIMENTOS.');return}confirmEntry('CONFIRMAR RECEBIMENTO','RECEBER '+fmt(val)+' DA PARCELA '+q+' EM '+chosen.descricao+'?',()=>{const current=db();const item=(current.receber||[]).find(z=>String(z.id)===String(x.id));if(!item||getCode(item)!==q){erpAlert('PARCELA ALTERADA. LOCALIZE NOVAMENTE.');return}const rest=Number(item.saldo??(Number(item.valor||0)-Number(item.pago||0)));if(val>rest+0.005||rest<=0||/QUEBRAD|SUBSTITU|CANCELAD|INATIV|QUITAD|PAGA/.test(String(item.situacao||'').toUpperCase())){erpAlert('PARCELA INDISPONÍVEL OU SALDO ALTERADO. LOCALIZE NOVAMENTE.');return}const latest=cashesNow();const active=latest.find(z=>String(z.id)===String(cash.id)&&z.situacao==='ABERTO'&&String(z.operador)===String(connectedUser()?.id));if(!active){erpAlert('CAIXA NÃO ESTÁ ABERTO.');return}const id='CARNE-'+q+'-'+Date.now();const payment={id,data:new Date().toISOString(),forma:chosen.descricao,formaId:chosen.id,tipoForma:chosen.tipo,contaId:chosen.contaId,valor:val,total:val,juros:0,multa:0,desconto:0,caixaId:active.id,operador:connectedUser()?.id,usuario:connectedUser()?.nome,estornado:false};item.pagamentos=Array.isArray(item.pagamentos)?item.pagamentos:[];item.pagamentos.push(payment);item.pago=+(Number(item.pago||0)+val).toFixed(2);item.saldo=+(rest-val).toFixed(2);item.situacao=item.saldo<=0.005?'PAGA':'PARCIAL';active.movimentos=Array.isArray(active.movimentos)?active.movimentos:[];active.movimentos.push({idRecebimento:id,tipo:'ENTRADA',categoria:'RECEBIMENTO DE CARNÊ',descricao:'RECEBIMENTO '+q+' — '+String(item.descricao||''),valor:val,forma:chosen.descricao,formaId:chosen.id,tipoForma:chosen.tipo,contaId:chosen.contaId,data:payment.data,operador:connectedUser()?.id,usuario:connectedUser()?.nome,codigoCarne:q,parcelaId:item.id});try{localStorage.setItem('erp_matriz_operacoes_v2',JSON.stringify(current));localStorage.setItem(KEY,JSON.stringify(latest));caixas=latest}catch(e){erpAlert('NÃO FOI POSSÍVEL SALVAR. CONFIRA O ARMAZENAMENTO.');return}find();draw();erpAlert('RECEBIMENTO REGISTRADO. CONFIRA O CAIXA E CONTAS A RECEBER.')})},'cx-action green');setPrintAction(printParcel);const actionRow=el('div','cx-receipt-actions');actionRow.append(receiveBtn);details.append(actionRow);
 }
 function draw(){listing.replaceChildren();const table=el('table','cx-dash-table');const header=el('tr');['DATA / HORA','CÓDIGO','DESCRIÇÃO','FORMA','VALOR'].forEach(t=>header.append(el('th','',t)));table.append(header);const rows=cashesNow().flatMap(z=>(z.movimentos||[]).filter(m=>m.idRecebimento).map(m=>({...m,caixa:z.id}))).filter(m=>(!from.value||String(m.data).slice(0,10)>=from.value)&&(!to.value||String(m.data).slice(0,10)<=to.value)&&(!search.value||(String(m.descricao||'')+' '+String(m.codigoCarne||'')).toUpperCase().includes(search.value.toUpperCase())));rows.slice().reverse().forEach(m=>{const tr=el('tr');[new Date(m.data).toLocaleString('pt-BR'),m.codigoCarne||'',m.descricao||'',m.forma||'',fmt(m.valor)].forEach(v=>tr.append(el('td','',String(v))));tr.title='DUPLO CLIQUE PARA VISUALIZAR';tr.style.cursor='pointer';tr.ondblclick=()=>{const codigo=String(m.codigoCarne||'');if(!codigo){erpAlert('RECEBIMENTO SEM CÓDIGO DE CARNÊ.');return}code.value=codigo;find();const record=el('div','cx-vendas-card');record.append(el('div','cx-vendas-section','DETALHES DO RECEBIMENTO'),el('p','cx-note','CÓDIGO: '+codigo+' · DATA: '+new Date(m.data).toLocaleString('pt-BR')+' · VALOR: '+fmt(m.valor)+' · FORMA: '+(m.forma||'—')+' · OPERADOR: '+(m.operador||'—')));const printReceipt=btn('IMPRIMIR',()=>{const w=window.open('','_blank');if(!w){erpAlert('PERMITA JANELAS POP-UP PARA IMPRIMIR.');return}const safe=v=>String(v??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));const rows=[['CÓDIGO DO CARNÊ',codigo],['DATA / HORA',new Date(m.data).toLocaleString('pt-BR')],['DESCRIÇÃO',m.descricao],['FORMA DE PAGAMENTO',m.forma],['VALOR RECEBIDO',fmt(m.valor)],['OPERADOR',m.operador||'—'],['CAIXA Nº',m.caixa]];w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comprovante '+safe(codigo)+'</title><style>body{font:14px Arial,sans-serif;max-width:720px;margin:28px auto;color:#17345b}header{display:flex;align-items:center;gap:18px;margin-bottom:24px}header img{max-width:110px;max-height:70px}h2{margin:0;text-align:center;flex:1}table{width:100%;border-collapse:collapse}td{padding:10px 4px;border-bottom:1px solid #eee}td:first-child{font-weight:bold;width:40%}footer{text-align:center;margin-top:36px;color:#555}@media print{body{margin:12mm auto}}</style></head><body><header><h2>COMPROVANTE DE RECEBIMENTO</h2></header><table>'+rows.map(r=>'<tr><td>'+safe(r[0])+'</td><td>'+safe(r[1])+'</td></tr>').join('')+'</table><footer>Comprovante de recebimento de carnê — LUCAS LIMA</footer></body></html>');w.document.close();w.focus();w.print()},'cx-action gray');setPrintAction(printReceipt.onclick);footerPrint.title='IMPRIMIR COMPROVANTE DO RECEBIMENTO SELECIONADO';details.prepend(record);section.scrollIntoView({behavior:'smooth',block:'start'})};table.append(tr)});listing.append(table);if(!rows.length)listing.append(el('p','cx-empty','NENHUM RECEBIMENTO ENCONTRADO.'))}
 code.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();find()}};const shortcut=e=>{if(!p.isConnected){document.removeEventListener('keydown',shortcut);return}if(e.key==='F12'){e.preventDefault();code.focus();code.select()}};document.addEventListener('keydown',shortcut);code.focus();
}
let pendingCashHistoryState=null;
function cashScreenFor(id){window.__lucasSelectedCash=id;cashScreen()}
function cashScreen(){
 caixas=reconcileCashRefunds();
 caixas=reconcileTradeCashPayments();
 const p=panel('CAIXA');p.classList.add('cx-dashboard');
 const shortcutButton=p.querySelector('.cx-shortcuts');
 function cashModal(title){const overlay=el('div','erp-overlay cx-shortcut-overlay');const dialog=el('div','cx-shortcut-dialog');overlay.append(dialog);const header=el('div','cx-shortcut-head');header.append(el('strong','',title),btn('×',()=>overlay.remove(),'cx-shortcut-x'));dialog.append(header);document.body.append(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});return {overlay,dialog}}
 function cashShortcuts(){const {overlay,dialog}=cashModal('⌂ ATALHOS — ▣ CAIXA');const body=el('div','cx-shortcut-body');[['F1','Abrir esta janela de atalhos'],['F5','Abrir caixa'],['F6','Fechar caixa'],['F12','Localizar caixa pelo número']].forEach(([key,description])=>{const line=el('div','cx-shortcut-line');line.append(el('span','cx-shortcut-key',key),el('span','',description));body.append(line)});dialog.append(body);const footer=el('div','cx-shortcut-footer');footer.append(btn('FECHAR',()=>overlay.remove(),'cx-shortcut-close'));dialog.append(footer)}
 function locateCash(){
  const {overlay,dialog}=cashModal('▣ LOCALIZAR CAIXA — F12');
  const body=el('div','cx-shortcut-body');
  body.style.cssText='padding:22px 20px 14px';
  body.append(el('p','','Informe o número do caixa.'));
  const label=el('label','','NÚMERO DO CAIXA');
  label.style.cssText='display:block;font-weight:700;font-size:12px;margin:15px 0 5px';
  const field=document.createElement('input');field.type='text';field.inputMode='numeric';field.autocomplete='off';field.placeholder='DIGITE O NÚMERO...';
  field.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #b5cbea;border-radius:6px;font-size:15px';
  const msg=el('div','');msg.style.cssText='color:#b42318;font-size:12px;min-height:18px;margin-top:7px';
  body.append(label,field,msg);
  const actions=el('div','');actions.style.cssText='display:flex;justify-content:center;gap:10px;margin:19px 0 0';
  const searchBtn=btn('LOCALIZAR',()=>{
   const q=field.value.trim();
   if(!/^\d+$/.test(q)){msg.textContent='INFORME UM NÚMERO DE CAIXA VÁLIDO.';field.focus();return}
   // Ler diretamente os caixas gravados, incluindo os fechados.
   caixas=read();
   const found=caixas.find(x=>Number(x.id)===Number(q));
   if(!found){msg.textContent='CAIXA Nº '+q+' NÃO ENCONTRADO.';field.focus();return}
   overlay.remove();cashScreenFor(found.id);
  },'cx-shortcut-close');
  searchBtn.style.cssText='min-width:110px';
  const cancelBtn=btn('CANCELAR',()=>overlay.remove(),'cx-modern-btn');
  cancelBtn.style.cssText='background:#eef4fd;color:#174a87;border:1px solid #b5cbea;min-width:110px';
  actions.append(searchBtn,cancelBtn);body.append(actions);dialog.append(body);
  field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchBtn.click()}else if(e.key==='Escape'){e.preventDefault();overlay.remove()}});
  field.addEventListener('input',()=>{msg.textContent=''});field.focus();
 }
 window.LucasLimaCaixaLocalizarF12=locateCash;
 if(shortcutButton){shortcutButton.textContent='⌂ ATALHOS';shortcutButton.onclick=e=>{e.preventDefault();e.stopPropagation();cashShortcuts()};shortcutButton.style.cursor='pointer'}
 const dashboardKeys=e=>{if(!p.isConnected||e.ctrlKey||e.altKey||e.metaKey||e.repeat||document.querySelector('.cx-shortcut-overlay, .erp-overlay, .erp-modal-overlay, .cx-expense-sales-size, [data-ll-sangria-active="1"]'))return;if(!['F1','F5','F6','F12'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();if(e.key==='F1')cashShortcuts();else if(e.key==='F12')locateCash();else if(e.key==='F5')openCash();else {const active=caixas.find(x=>x.situacao==='ABERTO');if(active)closeCash(active);else erpAlert('NÃO HÁ CAIXA ABERTO PARA FECHAR.')}};
 if(window.__lucasCashKeys)document.removeEventListener('keydown',window.__lucasCashKeys,true);window.__lucasCashKeys=dashboardKeys;document.addEventListener('keydown',dashboardKeys,true);
 const c=caixas.find(x=>String(x.id)===String(window.__lucasSelectedCash))||caixas.find(x=>x.situacao==='ABERTO')||caixas[caixas.length-1];
 const details=el('div','cx-vendas-card');details.append(el('div','cx-vendas-section','DADOS DO CAIXA'));p.append(details);const head=el('div','cx-dash-head');const h=el('div');h.append(el('h2','','CONTROLE DE MOVIMENTAÇÕES DO OPERADOR'),el('p','cx-note',c?`CAIXA Nº ${c.id} · OPERADOR ${operatorLabel(c.operador,c)} · ${c.situacao} · ABERTURA ${new Date(c.abertura).toLocaleString('pt-BR')}`:'NENHUM CAIXA ABERTO · ABRA UM CAIXA PARA REGISTRAR MOVIMENTAÇÕES'));head.append(h,el('span','cx-status '+(c&&c.situacao==='ABERTO'?'on':'off'),c&&c.situacao==='ABERTO'?'ABERTO':'FECHADO'));details.append(head);
 // Reconcilia vendas canceladas em versões anteriores sem duplicar registros.
 // O registro de compensação é INFORMATIVO e não altera saldo ou fluxo financeiro.
 if(c){
  const sales=read('erp_matriz_vendas_v1',[]);
  const canceled=new Map((Array.isArray(sales)?sales:[]).filter(v=>v.situacao==='CANCELADA'&&v.situacaoAntesCancelamento==='BAIXADA').map(v=>[String(v.numero),v]));
  const original=(c.movimentos||[]).filter(m=>m.naoFinanceiro&&!m.cancelamentoInformativo&&String(m.ref||'').includes('BOLETO-INFORMATIVO'));
  let changed=false;
  original.forEach(m=>{
   const sale=canceled.get(String(m.vendaNumero));if(!sale)return;
   const ref=String(m.ref)+':CANCELAMENTO-CARNE';
   if(c.movimentos.some(x=>x.ref===ref))return;
   c.movimentos.push({tipo:'INFORMATIVO',categoria:'CANCELAMENTO DE CARNÊ',descricao:'CANCELAMENTO DA VENDA Nº '+String(sale.numero).padStart(6,'0')+' — CARNÊ (SOMENTE CONSULTA)',forma:'CARNÊ',formaId:m.formaId,valor:Number(m.valor)||0,ref,refOriginal:m.ref,vendaNumero:sale.numero,operador:sale.usuarioCancelamento||sale.usuario||m.operador,data:sale.atualizadoEm||new Date().toISOString(),naoFinanceiro:true,cancelamentoInformativo:true});changed=true;
  });
  if(changed)save('erp_systems_caixas_v1',caixas);
 }
 const moves=c?.movimentos||[];const cash=c?expected(c):0;
 const entrada=moves.filter(m=>m.forma==='DINHEIRO'&&m.tipo==='ENTRADA').reduce((a,m)=>a+m.valor,0);
 const saida=moves.filter(m=>m.forma==='DINHEIRO'&&m.tipo!=='ENTRADA').reduce((a,m)=>a+m.valor,0);
 const tiles=el('div','cx-summary');[['SALDO INICIAL EM DINHEIRO',c?.inicial||0,'initial'],['ENTRADAS (DINHEIRO)',entrada,'in'],['SAÍDAS (DINHEIRO)',saida,'out'],['SALDO ATUAL EM DINHEIRO',cash,'balance']].forEach(([name,val,kind])=>{let tile=el('div','cx-dash-tile '+kind);tile.append(el('small','',name),el('strong','',fmt(val)));tiles.append(tile)});details.append(tiles);
 const layout=el('div','cx-dash-layout');const left=el('div','cx-dash-main cx-vendas-card'),right=el('div','cx-dash-side cx-vendas-card');layout.append(left,right);p.append(layout);left.append(el('div','cx-vendas-section','MOVIMENTAÇÕES DO CAIXA'));right.append(el('div','cx-vendas-section','RESUMO POR FORMA DE PAGAMENTO'));
 const listing=el('div','cx-listing');const filters=el('div','cx-filters');const search=el('input');search.placeholder='PESQUISAR POR DESCRIÇÃO...';search.setAttribute('aria-label','Pesquisar movimentações');const type=el('select');[['TODOS','TODOS'],['SANGRIA','SANGRIA'],['RECEBIMENTOS','RECEBIMENTOS'],['ESTORNO','ESTORNO'],['ENTRADA','ENTRADA'],['SAÍDA (DESPESA)','SAÍDA']].forEach(([label,value])=>{let o=el('option','',label);o.value=value;type.append(o)});filters.append(search,type);left.append(filters,listing);
 function movementKind(m){const cat=String(m.categoria||'').toUpperCase(),desc=String(m.descricao||'').toUpperCase(),kind=String(m.tipo||'').toUpperCase();if(m.naoFinanceiro||kind==='INFORMATIVO')return 'LEGADO';if(cat.includes('ESTORNO')||desc.includes('ESTORNO')||desc.includes('CANCELAMENTO SANGRIA')||desc.includes('REGULARIZAÇÃO DE SANGRIA'))return 'ESTORNO';if(cat.includes('SANGRIA'))return 'SANGRIA';if(cat.includes('RECEBIMENTO')||cat.includes('VENDA')||desc.includes('RECEBIMENTO')||desc.includes('PARCELA')||desc.includes('CLIENTE')||desc.includes('VENDA'))return 'RECEBIMENTOS';if(kind==='SAÍDA')return 'SAÍDA';if(kind==='ENTRADA')return 'ENTRADA';return kind}
 function openMovement(m){
  const kind=movementKind(m);
  if(m.codigoCarne){showCashReceipts(c);const field=document.querySelector('input[placeholder*="CARNÊ"], input[placeholder*="carnê"]');if(field){field.value=m.codigoCarne;field.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))}return}
  const page=panel('MOVIMENTAÇÃO DO CAIXA');page.classList.add('cx-dashboard');
  const card=el('div','cx-vendas-card');card.append(el('div','cx-vendas-section','DADOS DA MOVIMENTAÇÃO — '+kind));page.append(card);
  const grid=el('div','cx-parcel-grid');card.append(grid);
  const details=[['CAIXA Nº',c?.id],['Nº DA MOVIMENTAÇÃO',m.idx],['DATA / HORA',m.data?new Date(m.data).toLocaleString('pt-BR'):'—'],['TIPO',m.categoria||m.tipo],['DESCRIÇÃO',m.descricao],['FORMA DE PAGAMENTO',m.forma],['VALOR',fmt(m.valor)],['OPERADOR',operatorLabel(m.operador||c?.operador,c)],['SITUAÇÃO',m.cancelamentoInformativo?'CANCELAMENTO INFORMATIVO':m.estornado?'ESTORNADA':'REGISTRADA']];
  if(m.numeroSaida)details.push(['Nº DA SAÍDA',m.numeroSaida]);
  if(m.vendaNumero)details.push(['Nº DA VENDA',m.vendaNumero]);
  if(m.ref)details.push(['REFERÊNCIA',m.ref]);
  if(m.idEstorno)details.push(['CÓDIGO DO ESTORNO',m.idEstorno]);
  if(m.idRecebimento)details.push(['CÓDIGO DO RECEBIMENTO',m.idRecebimento]);
  if(m.codigoCarne)details.push(['CÓDIGO DO CARNÊ',m.codigoCarne]);
  details.forEach(([name,value])=>{const cell=el('div','cx-parcel-cell');cell.append(el('small','',name),el('strong','',String(value??'—')));grid.append(cell)});
  const actions=el('div','cx-dash-actions');actions.append(btn('VOLTAR',()=>cashScreen(),'cx-action red'));page.append(actions);
 }
 function renderRows(){listing.replaceChildren();const t=el('table','cx-dash-table');let tr=el('tr');['Nº','DATA / HORA','TIPO','DESCRIÇÃO','FORMA','VALOR (R$)','OPERADOR'].forEach(x=>tr.append(el('th','',x)));t.append(tr);let data=moves.map((m,i)=>({...m,idx:i+1})).filter(m=>(type.value==='TODOS'||movementKind(m)===type.value)&&String(m.descricao||'').toUpperCase().includes(search.value.trim().toUpperCase()));data.slice().reverse().forEach(m=>{let r=el('tr');[m.idx,new Date(m.data).toLocaleString('pt-BR'),m.categoria||m.tipo,m.descricao,m.forma,(m.cancelamentoInformativo?'−':m.naoFinanceiro?'':m.tipo==='ENTRADA'?'+':'−')+fmt(m.valor),operatorLabel(m.operador||c?.operador,c)].forEach((x,i)=>{let td=el('td','',String(x));if(i===2&&!m.naoFinanceiro)td.classList.add(m.tipo==='ENTRADA'?'cx-positive':'cx-negative');r.append(td)});r.title='DUPLO CLIQUE PARA VISUALIZAR A MOVIMENTAÇÃO';r.style.cursor='pointer';r.ondblclick=()=>openMovement(m);t.append(r)});listing.append(t);if(!data.length)listing.append(el('p','cx-empty','NENHUMA MOVIMENTAÇÃO PARA EXIBIR.'))}
 search.oninput=renderRows;type.onchange=renderRows;renderRows();
 // Resumo por forma: usa o próprio livro de movimentações exibido à esquerda.
 // Não depende da situação atual da venda nem de índices de parcelas que possam mudar.
 const paymentDb=(()=>{try{return JSON.parse(localStorage.getItem('erp_matriz_formas_pagamento_v1')||'{}')}catch{return {}}})();
 const registeredForms=Array.isArray(paymentDb)?paymentDb:(Array.isArray(paymentDb.formas)?paymentDb.formas:[]);
 const normalize=v=>String(v??'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const classify=v=>{const n=normalize(v);if(n.includes('BOLETO')||n.includes('CARNE'))return 'BOLETO';if(n.includes('DINHEIRO')||n.includes('ESPECIE'))return 'DINHEIRO';if(n.includes('PIX'))return 'PIX';if(n.includes('DEBITO'))return 'DEBITO';if(n.includes('CREDITO'))return 'CREDITO';return n};
 const rows=registeredForms.filter(f=>classify(f.tipo||f.descricao)!=='BOLETO'&&f.ativo!==false&&normalize(f.situacao||'ATIVO')!=='INATIVO').map(f=>({id:String(f.id),name:String(f.descricao||f.tipo||'').trim(),key:classify(f.tipo||f.descricao)})).filter(f=>f.name);
 const amounts=new Map(rows.map(f=>[f.id,0]));let unclassified=0;
 const findForm=m=>{const exact=rows.find(f=>f.id===String(m.formaId));if(exact)return exact;const key=classify(m.tipoForma||m.forma);return rows.find(f=>f.key===key)||null};
 // Somente movimentos efetivos, nunca propostas de estorno ou boletos ainda não recebidos.
 for(const m of moves){
  if(m.naoFinanceiro||m.estornado)continue;
  const kind=classify(m.tipoForma||m.forma);
  if(kind==='BOLETO')continue;
  const amount=Number(m.valor||0)*(String(m.tipo).toUpperCase()==='ENTRADA'?1:-1);
  if(!Number.isFinite(amount))continue;
  if(kind==='DINHEIRO')continue; // dinheiro já é o saldo físico expected(c)
  const target=findForm(m);
  if(target)amounts.set(target.id,(amounts.get(target.id)||0)+amount);
  else unclassified+=amount;
 }
 const t=el('table','cx-dash-table');let r=el('tr');r.append(el('th','','FORMA DE PAGAMENTO'),el('th','','TOTAL ATUAL'));t.append(r);let total=0;
 let moneyShown=false;
 rows.forEach(f=>{
  if(f.key==='DINHEIRO'&&moneyShown)return;
  const value=f.key==='BOLETO'?moves.filter(m=>m.naoFinanceiro&&classify(m.forma)==='BOLETO').reduce((n,m)=>n+(m.cancelamentoInformativo?-1:1)*Number(m.valor||0),0):(f.key==='DINHEIRO'?cash:(amounts.get(f.id)||0));
  if(f.key==='DINHEIRO')moneyShown=true;
  if(f.key!=='BOLETO')total+=value;
  const tr=el('tr');tr.append(el('td','',f.name),el('td','',fmt(value)));t.append(tr);
 });
 if(!moneyShown){total+=cash;const tr=el('tr');tr.append(el('td','','DINHEIRO'),el('td','',fmt(cash)));t.append(tr)}
 if(Math.abs(unclassified)>0.005){total+=unclassified;const tr=el('tr');tr.append(el('td','','FORMA NÃO IDENTIFICADA'),el('td','',fmt(unclassified)));t.append(tr)}

 const tr=el('tr','cx-total');tr.append(el('td','','TOTAL POR FORMAS (TODAS AS CONTAS)'),el('td','',fmt(total)));t.append(tr);
 right.append(t);
 const actions=el('div','cx-dash-actions cx-vendas-card');
 const available=!!c&&c.situacao==='ABERTO';
 const action=(title,callback,cls,needsOpen=true)=>{const b=btn(title,callback,'cx-action '+cls);b.disabled=needsOpen&&!available;actions.append(b)};
 action('ABRIR CAIXA',openCash,'green',false);
 action('FECHAR CAIXA',()=>closeCash(c),'blue');
 action('SANGRIA',()=>register(c,'SANGRIA'),'orange');
 action('SAÍDA (DESPESA)',()=>register(c,'SAÍDA'),'gray');
 action('ENTRADA',()=>register(c,'ENTRADA'),'blue');
 action('ESTORNAR',()=>estornar(c),'cyan');
 action('IMPRIMIR',()=>window.LucasCaixaImpressao.abrir(c),'gray',false);
 action('VOLTAR',()=>{if(typeof category==='function')category('CAIXA');else if(typeof open==='function')open('INÍCIO')},'red',false);
 p.append(actions);
 const history=el('div','cx-history');history.append(el('div','cx-vendas-section','HISTÓRICO DE CAIXAS'));
 const historyFilters=el('div','cx-history-filters');
 const dateStart=el('input');dateStart.type='date';dateStart.setAttribute('aria-label','DATA INICIAL');
 const dateEnd=el('input');dateEnd.type='date';dateEnd.setAttribute('aria-label','DATA FINAL');
 const operator=el('input');operator.type='text';operator.value='TODOS';operator.readOnly=true;operator.setAttribute('aria-label','OPERADOR');operator.style.cursor='pointer';
 let selectedOperator='TODOS';
 const addOperator=btn('+',()=>{
   const raw=users(),registered=Array.isArray(raw)?raw:(Array.isArray(raw?.usuarios)?raw.usuarios:[]);
   const known=new Map();
   registered.forEach(u=>{const id=String(u.codigo??u.id??'').trim();if(id)known.set(id,operatorName(id))});
   caixas.forEach(x=>{const id=String(x.operador??'').trim();if(id&&!known.has(id))known.set(id,operatorName(id))});
   const overlay=el('div','erp-overlay'),dialog=el('div','erp-dialog cx-dialog');
   dialog.style.cssText='width:min(960px,calc(100vw - 32px));max-width:960px;padding:0;overflow:hidden;border-radius:9px;background:#fff';
   const header=el('div');header.style.cssText='background:#195592;color:white;padding:20px;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:space-between';
   header.append(el('span','','SELECIONAR OPERADOR'));
   const closeTop=btn('×',()=>overlay.remove());closeTop.style.cssText='background:transparent;color:#fff;border:0;font-size:26px;cursor:pointer';header.append(closeTop);dialog.append(header);
   const body=el('div');body.style.cssText='padding:20px 20px 18px';
   const filters=el('div');filters.style.cssText='display:grid;grid-template-columns:110px minmax(0,1fr) 115px;gap:8px;align-items:end;margin:10px 0 14px';
   const fieldBox=(label,control)=>{const box=el('div');const caption=el('div','',label);caption.style.cssText='font-size:11px;font-weight:700;margin-bottom:7px;color:#173e73';box.append(caption,control);return box};
   const mode=el('select');mode.style.cssText='width:100%;height:40px;border:1px solid #bcd0e8;border-radius:5px;color:#153d73;padding:6px';
   [['NOME','NOME'],['CÓDIGO','CÓDIGO']].forEach(([value,label])=>{const opt=el('option','',label);opt.value=value;mode.append(opt)});
   const search=el('input');search.type='text';search.placeholder='DIGITE PARA PESQUISAR...';search.style.cssText='width:100%;box-sizing:border-box;height:40px;border:1px solid #bcd0e8;border-radius:5px;padding:10px';
   const searchButton=btn('PESQUISAR',()=>draw(),'cx-action blue');searchButton.style.height='40px';
   filters.append(fieldBox('PESQUISAR POR',mode),fieldBox('TEXTO DA PESQUISA',search),searchButton);body.append(filters);
   const list=el('div');list.style.cssText='max-height:248px;overflow-y:auto;border:1px solid #d3e0ef';
   const table=el('table','cx-dash-table');table.style.cssText='width:100%;border-collapse:collapse;table-layout:fixed';
   const choose=(id,name)=>{selectedOperator=id;operator.value=id==='TODOS'?'TODOS':id+' — '+name;overlay.remove()};
   const entries=[['TODOS','TODOS'],...[...known.entries()].sort((a,b)=>a[1].localeCompare(b[1],'pt-BR'))];
   function draw(){
     table.replaceChildren();
     const head=el('tr');['CÓDIGO','NOME DO OPERADOR','SITUAÇÃO'].forEach(label=>{const th=el('th','',label);th.style.cssText='background:#153e70;color:white;padding:10px;text-align:left';th.style.width=label==='CÓDIGO'?'22%':label==='SITUAÇÃO'?'26%':'52%';head.append(th)});table.append(head);
     const q=search.value.trim().toLocaleUpperCase('pt-BR');
     const matches=entries.filter(([id,name])=>!q||(mode.value==='CÓDIGO'?id:name).toLocaleUpperCase('pt-BR').includes(q));
     matches.forEach(([id,name])=>{
       const tr=el('tr');tr.style.cssText='cursor:pointer;border-bottom:1px solid #dbe5f2;color:#173e73';
       [id==='TODOS'?'—':id,name,id==='TODOS'?'—':(registered.find(u=>String(u.codigo??u.id??'')===id)?.situacao||'ATIVO')].forEach((v,i)=>{const td=el('td','',v);td.style.cssText='padding:10px 10px';if(i===2&&v==='ATIVO'){const pill=el('span','',v);pill.style.cssText='background:#baf1d4;color:#116e3b;border-radius:20px;padding:3px 14px;font-weight:700';td.replaceChildren(pill)}tr.append(td)});
       tr.tabIndex=0;tr.title='DÊ DOIS CLIQUES PARA SELECIONAR';tr.addEventListener('dblclick',()=>choose(id,name));tr.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();choose(id,name)}});table.append(tr)
     });
     if(!matches.length){const tr=el('tr');const td=el('td','','NENHUM OPERADOR ENCONTRADO.');td.colSpan=3;td.style.padding='16px';tr.append(td);table.append(tr)}
   }
   mode.addEventListener('change',draw);search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();draw()}});draw();
   list.append(table);body.append(list);
   const footer=el('div');footer.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-top:16px';
   const hint=el('span','','DÊ DOIS CLIQUES PARA SELECIONAR.');hint.style.cssText='font-size:11px;color:#195592';
   const cancel=btn('CANCELAR',()=>overlay.remove());cancel.style.cssText='background:#dceaff !important;color:#124a88 !important;border:1px solid #a9c9f5 !important;border-radius:5px;padding:10px 15px;cursor:pointer;box-shadow:none !important;font-size:12px;font-weight:600;opacity:1 !important;filter:none !important;text-shadow:none !important';
   footer.append(hint,cancel);body.append(footer);dialog.append(body);
   overlay.append(dialog);document.body.append(overlay);search.focus();
 },'cx-action blue cx-history-plus');
 operator.addEventListener('click',()=>addOperator.click());
 const field=(label,control)=>{const wrap=el('label','cx-history-field');wrap.append(el('span','',label),control);return wrap};
 historyFilters.append(field('DATA INICIAL',dateStart),field('DATA FINAL',dateEnd));
 const opWrap=el('div','cx-history-operator');opWrap.append(operator,addOperator);historyFilters.append(field('OPERADOR',opWrap));
 const historySearch=btn('PESQUISAR',()=>renderHistory(),'cx-action blue cx-history-search');historyFilters.append(historySearch);history.append(historyFilters);
 const results=el('div','cx-history-results');history.append(results);p.append(history);
 function renderHistory(){
   results.replaceChildren();
   if(dateStart.value&&dateEnd.value&&dateStart.value>dateEnd.value){erpAlert('DATA INICIAL MAIOR QUE DATA FINAL.');return}
   const matched=caixas.slice().reverse().filter(x=>{
     const day=String(x.abertura||'').slice(0,10);
     return (!dateStart.value||day>=dateStart.value)&&(!dateEnd.value||day<=dateEnd.value)&&(selectedOperator==='TODOS'||String(x.operador)===selectedOperator);
   });
   const table=el('table','cx-dash-table cx-history-table');
   const head=el('tr');['Nº CAIXA','DATA ABERTURA','OPERADOR','SITUAÇÃO'].forEach(label=>head.append(el('th','',label)));table.append(head);
   matched.forEach(x=>{
     const tr=el('tr','cx-history-row');tr.tabIndex=0;tr.title='DUPLO CLIQUE PARA ABRIR O CAIXA';
     const date=x.abertura?new Date(x.abertura):null;
     const dateLabel=date&&!isNaN(date.getTime())?date.toLocaleString('pt-BR'):String(x.abertura||'—');
     [String(x.id).padStart(6,'0'),dateLabel,operatorLabel(x.operador,x),String(x.situacao||'—')].forEach(v=>tr.append(el('td','',v)));
     const openDetail=()=>{
       // Carregar o caixa selecionado no painel principal, sem abrir uma tela separada.
       // A situação original (ABERTO ou FECHADO) continua controlando as ações.
       pendingCashHistoryState={dateStart:dateStart.value,dateEnd:dateEnd.value,selectedOperator,operatorLabel:operator.value,scrollY:window.scrollY};
       cashScreenFor(x.id);
     };
     tr.addEventListener('dblclick',openDetail);
     tr.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();openDetail()}});
     table.append(tr);
   });
   results.append(table);
   if(!matched.length)results.append(el('p','cx-empty','NENHUM CAIXA ENCONTRADO.'));
 }
 // Restaura a pesquisa anterior após trocar o caixa selecionado.
 if(pendingCashHistoryState){
   const state=pendingCashHistoryState;pendingCashHistoryState=null;
   dateStart.value=state.dateStart;dateEnd.value=state.dateEnd;
   selectedOperator=state.selectedOperator;operator.value=state.operatorLabel;
   renderHistory();
   window.scrollTo({top:state.scrollY,behavior:'instant'});
 }

}
window.LL_identificarOperadorCaixa=authenticate;
const previous=open;
open=function(name){if(name==='CAIXA'||name==='ABERTURA E MOVIMENTAÇÕES'||name==='FECHAMENTO DE CAIXA'||name==='HISTÓRICO DE CAIXAS')return cashScreen();return previous(name)};
})();
