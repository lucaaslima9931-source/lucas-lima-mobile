/* LUCAS LIMA — FUNCIONÁRIOS E FOLHA, complemento sem alterar o tema original */
(() => {
'use strict';
const KEY='erp_matriz_rh_v1', OPER='erp_matriz_operacoes_v2';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const n=v=>{let s=String(v??'0').replace(/\s|R\$/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Math.max(0,Number(s)||0)};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const month=()=>{const d=new Date();d.setMonth(d.getMonth()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
const load=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return {funcionarios:Array.isArray(x.funcionarios)?x.funcionarios:[],eventos:Array.isArray(x.eventos)?x.eventos:[],folhas:x.folhas||{}}}catch{return {funcionarios:[],eventos:[],folhas:{}}}};
let db=load(),selected=null,competencia=month(),tab='FALTAS / ATESTADOS';
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch{aviso('ERRO','ARMAZENAMENTO CHEIO OU INDISPONÍVEL.');return false}};
const uid=()=>String(Date.now())+String(Math.floor(Math.random()*100000));
// Máscaras do cadastro de funcionários: somente dígitos como origem.
const rhDigits=(value,max)=>String(value??'').replace(/\D/g,'').slice(0,max);
function rhCPF(value){const d=rhDigits(value,11);return d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/,'.$1-$2')}
function rhPhone(value){const d=rhDigits(value,11);if(!d)return '';if(d.length<=2)return '('+d+(d.length===2?') ':'');const area='('+d.slice(0,2)+') ';const tail=d.slice(2);if(tail.length<=4)return area+tail;const split=tail.length<=8?4:5;return area+tail.slice(0,split)+'-'+tail.slice(split)}
function rhCEP(value){const d=rhDigits(value,8);return d.length>5?d.slice(0,5)+'-'+d.slice(5):d}
let rhCepSeq=0;
function rhFormatFields(){
 const rules={cpf:rhCPF,telefone:rhPhone,cep:rhCEP};
 for(const [name,fn] of Object.entries(rules)){
  const input=$('rh-'+name);if(!input)continue;
  input.setAttribute('inputmode','numeric');input.setAttribute('autocomplete','off');
  input.addEventListener('input',()=>{const before=input.value;const cursor=input.selectionStart??before.length;const count=before.slice(0,cursor).replace(/\D/g,'').length;input.value=fn(before);if(document.activeElement===input){let pos=0,seen=0;while(pos<input.value.length&&seen<count){if(/\d/.test(input.value[pos]))seen++;pos++}input.setSelectionRange(pos,pos)}if(name==='cep')rhFetchCEP()});
  input.addEventListener('blur',()=>{input.value=fn(input.value);if(name==='cep')rhFetchCEP()});
 }
 for(const name of ['nome','rg','email','rua','numero','complemento','bairro','cidade','uf','observacoes']){
  const input=$('rh-'+name);if(input)input.addEventListener('input',()=>{const a=input.selectionStart,b=input.selectionEnd;input.value=input.value.toLocaleUpperCase('pt-BR');if(a!==null&&b!==null)input.setSelectionRange(a,b)});
 }
}
async function rhFetchCEP(){
 const cep=rhDigits($('rh-cep')?.value,8);const seq=++rhCepSeq;
 if(cep.length!==8)return;
 const fieldsToFill={rua:'logradouro',bairro:'bairro',cidade:'localidade',uf:'uf'};
 const snapshots=Object.fromEntries(Object.keys(fieldsToFill).map(k=>[k,$('rh-'+k)?.value||'']));
 try{
  const res=await fetch('https://viacep.com.br/ws/'+cep+'/json/');if(!res.ok)throw Error('CEP indisponível');
  const data=await res.json();if(data.erro||seq!==rhCepSeq||rhDigits($('rh-cep')?.value,8)!==cep)return;
  for(const [k,field] of Object.entries(fieldsToFill)){
   const input=$('rh-'+k);if(input&&input.value===snapshots[k]&&!input.value.trim()&&data[field])input.value=String(data[field]).toLocaleUpperCase('pt-BR');
  }
 }catch(e){/* Sem internet/CEP não encontrado: preenchimento manual continua permitido. */}
}
const fields=['nome','cpf','rg','nascimento','telefone','email','cep','rua','numero','complemento','bairro','cidade','uf','cargo','departamento','vinculo','admissao','desligamento','salario','tipo','comissao','meta','situacao','observacoes'];
const inp=(id,label,type='text',extra='')=>`<label class="rh-field">${label}<input id="rh-${id}" type="${type}" ${extra}></label>`;
const sel=(id,label,options)=>`<label class="rh-field">${label}<select id="rh-${id}">${options.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label>`;
const button=(label,id,cl)=>`<button type="button" id="${id}" class="action-button ${cl}">${label}</button>`;
function employee(){return db.funcionarios.find(x=>Number(x.id)===Number(selected))}
function screenEmployee(){
 screen='FUNCIONÁRIOS';
 root().innerHTML=`<section class="rh-page rh-employee-screen"><div class="rh-employee-head"><h1>▣ CADASTRO DE FUNCIONÁRIOS</h1><button type="button" id="rh-shortcuts" class="rh-shortcuts">⌂ ATALHOS</button></div><div class="rh-panel"><h2>DADOS PESSOAIS E PROFISSIONAIS</h2><div class="rh-form">${inp('codigo','CÓDIGO','text','readonly')}${inp('nome','NOME COMPLETO *')}${inp('cpf','CPF')}${inp('rg','RG')}${inp('nascimento','DATA DE NASCIMENTO','date')}${inp('telefone','TELEFONE / WHATSAPP')}${inp('email','E-MAIL','email')}${inp('cep','CEP')}${inp('rua','RUA / ENDEREÇO')}${inp('numero','NÚMERO')}${inp('complemento','COMPLEMENTO')}${inp('bairro','BAIRRO')}${inp('cidade','CIDADE')}${inp('uf','UF')}${rhPick('cargo','CARGO / FUNÇÃO')}${rhPick('departamento','DEPARTAMENTO')}${sel('vinculo','VÍNCULO',['CLT','AUTÔNOMO','TEMPORÁRIO','ESTAGIÁRIO','AVULSO','OUTRO'])}${inp('admissao','ADMISSÃO','date')}${inp('desligamento','DESLIGAMENTO','date')}${inp('salario','SALÁRIO FIXO (R$)','number','min="0" step="0.01"')}${sel('tipo','TIPO DE FUNCIONÁRIO',['COMUM','VENDEDOR (COMISSÃO)'])}${inp('comissao','PERCENTUAL DE COMISSÃO (%)','number','min="0" step="0.01"')}${inp('meta','META DE VENDAS (R$)','number','min="0" step="0.01"')}${sel('situacao','SITUAÇÃO',['ATIVO','INATIVO'])}${inp('observacoes','OBSERVAÇÕES')}${inp('usuario','USUÁRIO','text','readonly title="Clique para consultar o histórico de alterações"')}</div><div class="rh-actions">${button('NOVO','rh-new','green')}${button('GRAVAR','rh-save','blue')}${button('ALTERAR','rh-update','orange')}${button('VOLTAR','rh-back','red')}${window.LL_cadastroVendedorDaVenda?button('VOLTAR PARA VENDAS','rh-back-sales','blue'):''}</div></div><section class="rh-employee-search-panel"><h2>⌕ PESQUISA DE FUNCIONÁRIOS</h2><div class="rh-employee-search-controls"><label>PESQUISAR POR CÓDIGO, NOME OU CPF<input id="rh-filter-text" placeholder="CÓDIGO, NOME OU CPF"></label><label>SITUAÇÃO<select id="rh-filter-status"><option value="">TODOS</option><option>ATIVO</option><option>INATIVO</option></select></label><button type="button" id="rh-filter-go" class="action-button blue">PESQUISAR</button></div><div class="rh-employee-results"><table class="rh-table"><thead><tr><th>CÓDIGO</th><th>NOME COMPLETO</th><th>CPF</th><th>CARGO / FUNÇÃO</th><th>DEPARTAMENTO</th><th>SITUAÇÃO</th></tr></thead><tbody id="rh-filter-results"></tbody></table></div><div id="rh-filter-count" class="rh-filter-count"></div></section></section>`;
 $('rh-shortcuts').onclick=showEmployeeShortcuts;$('rh-new').onclick=clear;$('rh-save').onclick=()=>{saveEmployee(false);resetEmployeeSearchResults()};$('rh-update').onclick=()=>{saveEmployee(true);resetEmployeeSearchResults()};$('rh-filter-go').onclick=renderEmployeeSearch;$('rh-filter-text').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();renderEmployeeSearch()}};$('rh-filter-status').onchange=resetEmployeeSearchResults;$('rh-usuario').onclick=historyEmployee;$('rh-usuario').style.cursor='pointer';$('rh-usuario').style.textDecoration='underline';$('rh-back').onclick=()=>category('CADASTROS');
 const backSales=$('rh-back-sales');
 if(backSales)backSales.onclick=()=>{
   window.LL_cadastroVendedorDaVenda=false;
   window.dispatchEvent(new CustomEvent('ll-voltar-vendas-cadastro-vendedor'));
 };

 for(const kind of ['cargo','departamento']){const b=$('rh-add-'+kind);if(b)b.onclick=()=>manageOptions(kind);}
 rhFormatFields();
 clear();resetEmployeeSearchResults();active('CADASTROS');
}
function resetEmployeeSearchResults(){
 const body=$('rh-filter-results');if(!body)return;
 body.innerHTML='<tr><td colspan="6">CLIQUE EM PESQUISAR PARA EXIBIR OS FUNCIONÁRIOS.</td></tr>';
 const count=$('rh-filter-count');if(count)count.textContent='';
}
function renderEmployeeSearch(){
 const body=$('rh-filter-results');if(!body)return;
 const q=String($('rh-filter-text').value||'').trim().toLocaleUpperCase('pt-BR');
 const normalized=q.replace(/\D/g,'');const status=$('rh-filter-status').value;
 const items=db.funcionarios.filter(f=>(!status||String(f.situacao||'ATIVO').toUpperCase()===status)&&(!q||String(f.id).includes(q)||String(f.nome||'').toLocaleUpperCase('pt-BR').includes(q)||(normalized&&String(f.cpf||'').replace(/\D/g,'').includes(normalized))));
 body.replaceChildren();
 for(const f of items){const tr=document.createElement('tr');tr.style.cursor='pointer';tr.title='DÊ DOIS CLIQUES PARA ABRIR O CADASTRO';for(const v of [f.id,f.nome,f.cpf,f.cargo,f.departamento,f.situacao]){const td=document.createElement('td');td.textContent=v??'';tr.append(td)}tr.ondblclick=()=>{fill(f.id);window.scrollTo({top:0,behavior:'smooth'})};body.append(tr)}
 if(!items.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=6;td.textContent='NENHUM FUNCIONÁRIO ENCONTRADO.';tr.append(td);body.append(tr)}
 $('rh-filter-count').textContent=items.length+' FUNCIONÁRIO(S) ENCONTRADO(S)';
}
const RH_OPTIONS_KEY='lucas_lima_rh_opcoes_v1';
const rhPick=(id,label)=>`<label class="rh-field">${label}<span class="rh-pick"><select id="rh-${id}"><option value="">SELECIONE</option></select><button type="button" id="rh-add-${id}" title="CADASTRAR ${label}">+</button></span></label>`;
function getOptions(){try{const o=JSON.parse(localStorage.getItem(RH_OPTIONS_KEY)||'{}');return {cargo:Array.isArray(o.cargo)?o.cargo:[],departamento:Array.isArray(o.departamento)?o.departamento:[]}}catch{return {cargo:[],departamento:[]}}}
function saveOptions(o){try{localStorage.setItem(RH_OPTIONS_KEY,JSON.stringify(o));return true}catch{aviso('ERRO','NÃO FOI POSSÍVEL GRAVAR AS OPÇÕES.');return false}}
function refreshOptions(kind,keep){const el=$('rh-'+kind);if(!el)return;const value=keep??el.value;const opts=getOptions()[kind];el.replaceChildren(new Option('SELECIONE',''));for(const x of opts.filter(x=>x.situacao==='ATIVO'||x.nome===value))el.add(new Option(x.nome,x.nome));if(value&&!opts.some(x=>x.nome===value))el.add(new Option(value,value));el.value=value||''}
function manageOptions(kind){if(document.querySelector('.rh-overlay'))return;const label=kind==='cargo'?'CARGO / FUNÇÃO':'DEPARTAMENTO';let selectedId=null;const cover=document.createElement('div');cover.className='rh-overlay';cover.innerHTML=`<section class="rh-dialog" role="dialog" aria-modal="true"><h2>CADASTRO DE ${label}</h2><label>CÓDIGO <input id="rh-opt-code" readonly></label><label>DESCRIÇÃO <input id="rh-opt-name" maxlength="100"></label><label>SITUAÇÃO <select id="rh-opt-status"><option>ATIVO</option><option>INATIVO</option></select></label><label>OPÇÕES CADASTRADAS <select id="rh-opt-list" size="5" style="width:100%"></select></label><div class="rh-actions">${button('NOVO','rh-opt-new','green')}${button('GRAVAR','rh-opt-save','blue')}${button('ALTERAR','rh-opt-edit','orange')}${button('VOLTAR','rh-opt-back','red')}</div><p id="rh-opt-error"></p></section>`;document.body.append(cover);
 const refresh=()=>{const o=getOptions()[kind];$('rh-opt-list').replaceChildren(...o.map(x=>new Option(x.id+' — '+x.nome+' ('+x.situacao+')',String(x.id))))};
 const novo=()=>{selectedId=null;$('rh-opt-code').value=String(Math.max(0,...getOptions()[kind].map(x=>x.id))+1);$('rh-opt-name').value='';$('rh-opt-status').value='ATIVO';$('rh-opt-error').textContent='';$('rh-opt-name').focus()};
 const store=edit=>{const o=getOptions();const nome=$('rh-opt-name').value.trim().toLocaleUpperCase('pt-BR');if(!nome)return $('rh-opt-error').textContent='INFORME A DESCRIÇÃO.';if(o[kind].some(x=>x.nome===nome&&x.id!==selectedId))return $('rh-opt-error').textContent='ESTA DESCRIÇÃO JÁ ESTÁ CADASTRADA.';if(edit&&!selectedId)return $('rh-opt-error').textContent='SELECIONE UMA OPÇÃO PARA ALTERAR.';if(!edit&&selectedId)return $('rh-opt-error').textContent='USE ALTERAR PARA MODIFICAR.';const id=selectedId||Math.max(0,...o[kind].map(x=>x.id))+1;const record={id,nome,situacao:$('rh-opt-status').value};const i=o[kind].findIndex(x=>Number(x.id)===Number(id));if(i>=0)o[kind][i]=record;else o[kind].push(record);if(!saveOptions(o))return;refreshOptions(kind,record.situacao==='ATIVO'?record.nome:'');refresh();selectedId=id;$('rh-opt-code').value=id;$('rh-opt-error').textContent='REGISTRO GRAVADO.'};
 $('rh-opt-list').onchange=()=>{const x=getOptions()[kind].find(x=>String(x.id)===$('rh-opt-list').value);if(x){selectedId=x.id;$('rh-opt-code').value=x.id;$('rh-opt-name').value=x.nome;$('rh-opt-status').value=x.situacao}};
 $('rh-opt-new').onclick=novo;$('rh-opt-save').onclick=()=>store(false);$('rh-opt-edit').onclick=()=>store(true);const close=()=>{cover.remove();document.removeEventListener('keydown',key,true)};const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};document.addEventListener('keydown',key,true);$('rh-opt-back').onclick=close;refresh();novo();
}
function searchEmployees(){if(document.querySelector('.rh-overlay'))return;const cover=document.createElement('div');cover.className='rh-overlay';cover.innerHTML=`<section class="rh-dialog rh-search-dialog" role="dialog" aria-modal="true"><h2>PESQUISAR FUNCIONÁRIOS</h2><label>DIGITE PARTE DO NOME <input id="rh-search-text" placeholder="NOME DO FUNCIONÁRIO"></label><div class="rh-scroll"><table class="rh-table"><thead><tr><th>CÓDIGO</th><th>NOME</th><th>CPF</th><th>CARGO / FUNÇÃO</th><th>DEPARTAMENTO</th><th>SITUAÇÃO</th></tr></thead><tbody id="rh-search-results"></tbody></table></div><p>DÊ DOIS CLIQUES PARA ABRIR O CADASTRO.</p>${button('VOLTAR','rh-search-close','red')}</section>`;document.body.append(cover);
 const render=()=>{const q=$('rh-search-text').value.toLocaleUpperCase('pt-BR');$('rh-search-results').replaceChildren();for(const f of db.funcionarios.filter(x=>String(x.nome||'').toLocaleUpperCase('pt-BR').includes(q))){const tr=document.createElement('tr');for(const v of [f.id,f.nome,f.cpf,f.cargo,f.departamento,f.situacao]){const td=document.createElement('td');td.textContent=v??'';tr.append(td)}tr.title='DUPLO CLIQUE PARA ABRIR';tr.ondblclick=()=>{close();fill(f.id)};$('rh-search-results').append(tr)}};
 const close=()=>{cover.remove();document.removeEventListener('keydown',key,true)};const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};document.addEventListener('keydown',key,true);$('rh-search-close').onclick=close;$('rh-search-text').oninput=render;render();$('rh-search-text').focus();
}
function historyEmployee(){
 if(document.querySelector('.rh-overlay'))return;
 if(!selected)return aviso('HISTÓRICO','GRAVE OU LOCALIZE UM FUNCIONÁRIO.');
 const f=employee();if(!f)return;
 const cover=document.createElement('div');cover.className='rh-overlay';
 const raw=Array.isArray(f.historico)?f.historico:[];
 const labels={nome:'NOME COMPLETO',cpf:'CPF',rg:'RG',nascimento:'DATA DE NASCIMENTO',telefone:'TELEFONE / WHATSAPP',email:'E-MAIL',cep:'CEP',rua:'ENDEREÇO',numero:'NÚMERO',complemento:'COMPLEMENTO',bairro:'BAIRRO',cidade:'CIDADE',uf:'UF',cargo:'CARGO / FUNÇÃO',departamento:'DEPARTAMENTO',vinculo:'VÍNCULO',admissao:'ADMISSÃO',desligamento:'DESLIGAMENTO',salario:'SALÁRIO FIXO',tipo:'TIPO DE FUNCIONÁRIO',comissao:'COMISSÃO',meta:'META DE VENDAS',situacao:'SITUAÇÃO',observacoes:'OBSERVAÇÕES'};
 const normalized=raw.map(item=>({
  date:String(item.data||''),
  user:(()=>{const u=String(item.usuario||'').trim();return !u||u.toUpperCase()==='DEMONSTRAÇÃO'||u.toUpperCase()==='USUÁRIO DO SISTEMA'?'USUÁRIO NÃO IDENTIFICADO':u})(),
  field:String(item.campo||''),before:String(item.antes??''),after:String(item.depois??'')
 }));
 // Uma operação pode modificar vários campos; agrupá-los pelo usuário e instante da gravação.
 const groups=[];
 for(const e of normalized){
  const prev=groups[groups.length-1];
  if(prev&&prev.date===e.date&&prev.user===e.user)prev.entries.push(e);
  else groups.push({date:e.date,user:e.user,entries:[e]});
 }
 const blocks=groups.length?groups.slice().reverse().map(group=>{
  const registration=group.entries.every(x=>x.field==='CADASTRO');
  const details=group.entries.map(x=>x.field==='CADASTRO'
   ?'<div style="font-size:12px;color:#4d617d;margin-top:6px">REGISTRO CRIADO.</div>'
   :`<div style="font-size:12px;margin-top:7px;line-height:1.5"><b>${esc(labels[x.field.toLowerCase()]||x.field)}</b>: ${esc(x.before||'(VAZIO)')} → ${esc(x.after||'(VAZIO)')}</div>`).join('');
  return `<div style="padding:12px 0;border-bottom:1px solid #dce6f2"><div style="font-weight:700;color:#133b70">${registration?'CADASTRO':'ALTERAÇÃO'} — ${esc(group.user)}</div><div style="font-size:12px;color:#60738c;margin-top:3px">${esc(group.date)}</div>${details}</div>`;
 }).join(''):'<p style="color:#60738c">Este funcionário ainda não possui histórico registrado.</p>';
 const last=f.usuario||f.alteradoPor||f.criadoPor||'NÃO INFORMADO';
 cover.innerHTML=`<section class="rh-employee-history-dialog" role="dialog" aria-modal="true" aria-label="HISTÓRICO DE ALTERAÇÕES — FUNCIONÁRIOS" style="width:min(440px,calc(100vw - 32px));height:min(493px,calc(100vh - 32px));max-width:440px;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;padding:0;background:white;border-radius:12px;color:#173b6c;box-shadow:0 16px 60px #001a3a80;font:14px Arial,sans-serif"><div style="background:#103e78;color:white;padding:17px;flex-shrink:0;font-weight:bold;font-size:14px;line-height:1.3">HISTÓRICO DE ALTERAÇÕES — FUNCIONÁRIOS</div><div style="padding:20px 20px 0;display:flex;flex-direction:column;flex:1;min-height:0"><div class="rh-employee-history-scroll" style="overflow-y:auto;overflow-x:hidden;flex:1;min-height:0;font-size:13px"><p style="margin:10px 0 14px"><b>FUNCIONÁRIO:</b> ${esc(f.nome)}</p><p style="margin:0 0 12px"><b>ÚLTIMO USUÁRIO:</b> ${esc(last)}</p>${blocks}</div><div style="display:flex;justify-content:flex-end;padding:15px 0 20px;flex-shrink:0"><button type="button" id="rh-history-close" style="background:#1357a6;color:white;border:0;border-radius:5px;padding:10px 18px;cursor:pointer;font:14px Arial,sans-serif">FECHAR</button></div></div></section>`;
 document.body.append(cover);
 const close=()=>{cover.remove();document.removeEventListener('keydown',key,true)};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',key,true);
 cover.querySelector('#rh-history-close').addEventListener('click',close);
 cover.addEventListener('click',e=>{if(e.target===cover)close()});
}

function showEmployeeShortcuts(){
 if(document.getElementById('rh-shortcuts-overlay'))return;
 const overlay=document.createElement('div');
 overlay.id='rh-shortcuts-overlay';
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#001b3aa8;display:grid;place-items:center;padding:15px';
 overlay.innerHTML=`<div role="dialog" aria-modal="true" aria-label="ATALHOS — CADASTRO DE FUNCIONÁRIOS" style="width:min(475px,95vw);background:white;border-radius:12px;overflow:hidden;box-shadow:0 16px 60px #001a3a80;font:14px Arial,sans-serif;color:#103e78"><div style="display:flex;align-items:center;justify-content:space-between;background:#1e5797;color:white;padding:19px 22px;font-weight:800;font-size:16px"><span>⌂ ATALHOS — CADASTRO DE FUNCIONÁRIOS</span><button type="button" id="rh-shortcuts-x" aria-label="Fechar" style="border:0;background:transparent;color:white;font-size:23px;cursor:pointer">×</button></div><div style="padding:18px 22px 0"><div style="display:flex;align-items:center;gap:15px;padding:10px 0;border-bottom:1px solid #dbe5f1"><strong style="min-width:54px;text-align:center;background:#eaf2ff;border:1px solid #bfd6ff;border-radius:5px;padding:8px;color:#103d76">F1</strong><span>Abrir esta janela de atalhos</span></div><div style="display:flex;align-items:center;gap:15px;padding:10px 0"><strong style="min-width:54px;text-align:center;background:#eaf2ff;border:1px solid #bfd6ff;border-radius:5px;padding:8px;color:#103d76">F12</strong><span>Localizar funcionário por código ou CPF</span></div></div><div style="border-top:1px solid #dbe5f1;margin-top:10px;padding:12px 20px;display:flex;justify-content:flex-end"><button id="rh-shortcuts-close" type="button" style="background:#1e5797;color:white;border:0;border-radius:5px;padding:11px 21px;cursor:pointer;font-size:15px">FECHAR</button></div></div>`;
 document.body.appendChild(overlay);
 const close=()=>{overlay.remove();document.removeEventListener('keydown',onKey,true)};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',onKey,true);
 overlay.querySelector('#rh-shortcuts-close').onclick=close;
 overlay.querySelector('#rh-shortcuts-x').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
}

function clear(){selected=null;for(const f of fields)if($('rh-'+f))$('rh-'+f).value='';$('rh-usuario').value=currentOperator();$('rh-codigo').value=String(Math.max(0,...db.funcionarios.map(f=>Number(f.id)||0))+1);$('rh-vinculo').value='CLT';$('rh-tipo').value='COMUM';$('rh-situacao').value='ATIVO';refreshOptions('cargo','');refreshOptions('departamento','');$('rh-nome').focus()}
function fill(id){const f=db.funcionarios.find(x=>Number(x.id)===Number(id));if(!f)return;selected=id;for(const k of fields)if($('rh-'+k))$('rh-'+k).value=({cpf:rhCPF,telefone:rhPhone,cep:rhCEP}[k]||((v)=>v))(f[k]??'');$('rh-codigo').value=String(id);$('rh-usuario').value=f.usuario||f.alteradoPor||f.criadoPor||currentOperator();refreshOptions('cargo',f.cargo);refreshOptions('departamento',f.departamento);window.scrollTo({top:0,behavior:'smooth'})}
const iAmEditHistory=edit=>Boolean(edit);
function saveEmployee(edit){const name=$('rh-nome').value.trim().toUpperCase();if(!name)return aviso('VALIDAÇÃO','INFORME O NOME DO FUNCIONÁRIO.');if(edit&&!selected)return aviso('VALIDAÇÃO','LOCALIZE UM FUNCIONÁRIO PARA ALTERAR.');if(!edit&&selected)return aviso('CADASTRO','ESTE FUNCIONÁRIO JÁ EXISTE. USE ALTERAR.');const cpf=$('rh-cpf').value.replace(/\D/g,'');if(cpf&&(!validCPF(cpf)||db.funcionarios.some(f=>f.id!==selected&&String(f.cpf||'').replace(/\D/g,'')===cpf)))return aviso('VALIDAÇÃO','CPF INVÁLIDO OU JÁ CADASTRADO.');const id=selected??Math.max(0,...db.funcionarios.map(f=>Number(f.id)||0))+1;const old=db.funcionarios.find(f=>f.id===id)||{};const f={...old,id};for(const k of fields)f[k]=$('rh-'+k).value.trim();f.cpf=rhCPF(f.cpf);f.telefone=rhPhone(f.telefone);f.cep=rhCEP(f.cep);f.nome=name;f.salario=n(f.salario);f.comissao=n(f.comissao);f.meta=n(f.meta);const changes=[];for(const k of fields){if(String(old[k]??'')!==String(f[k]??''))changes.push({data:new Date().toLocaleString('pt-BR'),campo:k.toUpperCase(),antes:String(old[k]??''),depois:String(f[k]??''),usuario:currentOperator()});}
if(edit&&!changes.length)return aviso('INFORMAÇÃO','NENHUMA ALTERAÇÃO FOI REALIZADA.');
f.usuario=currentOperator();f.historico=[...(old.historico||[]),...(edit?changes:[{data:new Date().toLocaleString('pt-BR'),campo:'CADASTRO',antes:'',depois:'FUNCIONÁRIO CADASTRADO',usuario:currentOperator()}])];const i=db.funcionarios.findIndex(x=>Number(x.id)===Number(id));if(i>=0)db.funcionarios[i]=f;else db.funcionarios.push(f);if(!persist())return;selected=id;$('rh-codigo').value=String(id);const gravado=load().funcionarios.find(x=>Number(x.id)===Number(id))||f;$('rh-usuario').value=gravado.usuario||f.usuario;aviso('SUCESSO',edit?'FUNCIONÁRIO ALTERADO.':'FUNCIONÁRIO CADASTRADO.')}
function renderEmployees(){if(!$('rh-rows'))return;const q=($('rh-query').value||'').toUpperCase();$('rh-rows').replaceChildren();for(const f of db.funcionarios.filter(x=>[x.id,x.nome,x.cpf,x.cargo].some(v=>String(v||'').toUpperCase().includes(q)))){const tr=document.createElement('tr');for(const v of [String(f.id),f.nome,f.cpf,f.cargo,f.departamento,f.situacao]){const td=document.createElement('td');td.textContent=v||'';tr.append(td)}tr.ondblclick=()=>fill(f.id);$('rh-rows').append(tr)}}
function lookup(){
 if(document.querySelector('.rh-overlay'))return;
 const cover=document.createElement('div');cover.className='rh-overlay fp-lookup-overlay';
 cover.innerHTML=`<section class="fp-lookup-dialog" role="dialog" aria-modal="true" aria-labelledby="rh-lookup-title">
   <header class="fp-lookup-head"><strong id="rh-lookup-title">▣ LOCALIZAR FUNCIONÁRIO — F12</strong><button type="button" class="fp-lookup-x" aria-label="Fechar">×</button></header>
   <div class="fp-lookup-body"><p>Informe o código ou CPF do funcionário.</p><label for="rh-lvalue">CÓDIGO OU CPF</label><input id="rh-lvalue" placeholder="DIGITE O CÓDIGO OU CPF..." autocomplete="off"><p id="rh-lerror" role="alert" aria-live="polite"></p>
   <footer class="fp-lookup-actions"><button type="button" id="rh-lgo">LOCALIZAR</button><button type="button" id="rh-lcancel">CANCELAR</button></footer></div>
 </section>`;
 document.body.append(cover);
 const close=()=>{document.removeEventListener('keydown',key,true);cover.remove()};
 const go=()=>{const q=$('rh-lvalue').value.trim();const digits=q.replace(/\D/g,'');const f=db.funcionarios.find(x=>(digits.length===11&&String(x.cpf||'').replace(/\D/g,'')===digits)||(/^\d+$/.test(q)&&Number(x.id)===Number(q)));if(f){close();fill(f.id)}else $('rh-lerror').textContent=q?'FUNCIONÁRIO NÃO ENCONTRADO. CONFIRA O CÓDIGO OU CPF.':'INFORME O CÓDIGO OU CPF.'};
 const key=ev=>{if(['F12','Escape','Enter'].includes(ev.key)){ev.preventDefault();ev.stopImmediatePropagation();if(ev.key==='Escape')close();if(ev.key==='Enter')go()}};
 document.addEventListener('keydown',key,true);
 cover.querySelector('.fp-lookup-x').onclick=close;
 $('rh-lgo').onclick=go;$('rh-lcancel').onclick=close;
 cover.onclick=e=>{if(e.target===cover)close()};$('rh-lvalue').focus();
}

const entries=()=>db.eventos.filter(x=>Number(x.funcionario)===Number(selected));

const currentOperator=()=>{
 // A autenticação ativa é mantida em sessionStorage, não na sessão antiga do localStorage.
 try{const x=JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'null');if(x&&String(x.nome||x.name||'').trim())return String(x.nome||x.name).trim()}catch{}
 return 'USUÁRIO NÃO IDENTIFICADO';
};
const ledgerKey='lucas_lima_adiantamentos_financeiros_v1';
function rhPaymentForms(){
 try{const d=JSON.parse(localStorage.getItem('erp_matriz_formas_pagamento_v1')||'{}');return (Array.isArray(d)?d:d.formas||[]).filter(f=>f.ativo!==false&&String(f.tipo||'').toUpperCase()!=='BOLETO')}catch{return []}
}
function rhPaymentAccount(form){
 const fin=JSON.parse(localStorage.getItem('erp_systems_financeiro_v1')||'{}');
 const accounts=Array.isArray(fin.contas)?fin.contas:[];
 const id=Number(form?.contaId);
 const account=accounts.find(a=>Number(a.id)===id&&a.ativo!==false);
 return account||null;
}
function syncAdvance(ev,remove=false){
 try{
 const key='erp_systems_financeiro_v1',fin=JSON.parse(localStorage.getItem(key)||'{}');
 fin.movimentos=Array.isArray(fin.movimentos)?fin.movimentos:[];
 fin.movimentos=fin.movimentos.filter(x=>String(x.origemId)!==String(ev.id));
 if(!remove&&['VALE','ADIANTAMENTO'].includes(ev.tipo)){
  fin.movimentos.push({id:'RH-'+ev.id,origemId:ev.id,date:ev.data,tipo:'SAIDA',categoria:'ADIANTAMENTO FUNCIONÁRIO',descricao:ev.tipo+' — '+(employee()?.nome||'FUNCIONÁRIO'),conta:Number(ev.conta),formaPagamentoId:Number(ev.formaPagamentoId),formaPagamento:ev.formaPagamento||'',valor:n(ev.valor),origem:'RH'});
 }
 localStorage.setItem(key,JSON.stringify(fin));return true;
 }catch(e){aviso('FINANCEIRO','NÃO FOI POSSÍVEL SINCRONIZAR O FINANCEIRO.');return false}
}
// Filtro independente do funcionário selecionado no cabeçalho.
function rhEmployeeFilterHTML(){return `<label class="rh-field" style="min-width:0">FUNCIONÁRIO<div style="display:flex;gap:5px"><input id="rh-search-employee-name" value="TODOS" readonly style="min-width:0;flex:1"><input id="rh-search-employee-id" type="hidden" value=""><button type="button" id="rh-search-employee-pick" aria-label="Selecionar funcionário" style="background:#079b72;color:#fff;border:0;border-radius:5px;font-weight:800;font-size:19px;padding:0 13px;cursor:pointer">+</button></div></label>`}
function rhBindEmployeeFilter(){
 const pick=$('rh-search-employee-pick');if(!pick)return;
 pick.onclick=()=>{
  db=load();if(document.getElementById('rh-filter-picker-overlay'))return;
  const overlay=document.createElement('div');overlay.className='rh-overlay';overlay.id='rh-filter-picker-overlay';overlay.style.zIndex='999999';
  overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="rh-filter-picker-title" style="background:#fff;width:min(960px,96vw);max-height:86vh;display:flex;flex-direction:column;border-radius:11px;overflow:hidden;box-shadow:0 20px 60px #001a3e66;font-family:Arial,sans-serif;color:#153b6d">
   <header style="background:#205995;color:white;min-height:79px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box"><strong id="rh-filter-picker-title" style="font-size:17px">SELECIONE O FUNCIONÁRIO</strong><button type="button" data-close aria-label="Fechar" style="border:1px solid #a7c6ee;border-radius:5px;background:transparent;color:#fff;font-size:22px;width:35px;height:35px;cursor:pointer">×</button></header>
   <div style="padding:18px 20px 20px;overflow:auto">
    <div style="display:grid;grid-template-columns:110px minmax(0,1fr) 95px 150px;gap:7px;align-items:end;margin-bottom:12px">
     <label style="font-size:11px;font-weight:bold">PESQUISAR POR<select data-by style="display:block;width:100%;height:44px;margin-top:6px;border:1px solid #bdd4f8;border-radius:6px;background:white;color:#153b6d;padding:8px"><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label>
     <label style="font-size:11px;font-weight:bold;min-width:0">TEXTO DA PESQUISA<input data-q type="text" placeholder="DIGITE PARA PESQUISAR..." style="box-sizing:border-box;width:100%;height:44px;margin-top:6px;border:1px solid #77a7fa;border-radius:6px;padding:11px;color:#153b6d;outline-color:#2674e8"></label>
     <button data-go type="button" style="height:40px;border:0;border-radius:5px;background:#1d579a;color:white;font-size:11px;font-weight:bold;cursor:pointer">PESQUISAR</button>
     <button data-new type="button" style="height:40px;border:0;border-radius:5px;background:#069966;color:white;font-size:11px;font-weight:bold;cursor:pointer">+ NOVO FUNCIONÁRIO</button>
    </div>
    <div style="max-height:40vh;overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left"><thead style="position:sticky;top:0;background:#173e77;color:#fff"><tr><th style="padding:13px 10px">CÓDIGO</th><th style="padding:13px 10px">NOME DO FUNCIONÁRIO</th><th style="padding:13px 10px">CARGO / FUNÇÃO</th><th style="padding:13px 10px">SITUAÇÃO</th></tr></thead><tbody data-rows></tbody></table></div>
    <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #d6e2f4;margin-top:18px;padding-top:15px;gap:12px"><div style="display:flex;align-items:center;gap:12px"><span style="font-size:11px">DÊ DOIS CLIQUES PARA SELECIONAR.</span><button data-all type="button" style="background:#079b72;border:0;border-radius:5px;color:#fff;padding:11px 15px;cursor:pointer;font-weight:bold">TODOS</button></div><button data-close type="button" style="background:#eaf2ff;border:1px solid #b8d1fa;border-radius:5px;color:#1b5599;padding:12px 17px;cursor:pointer">CANCELAR</button></div>
   </div></section>`;
  document.body.append(overlay);
  const close=()=>{overlay.remove();document.removeEventListener('keydown',onKey,true)};
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}};
  document.addEventListener('keydown',onKey,true);
  overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);
  const render=()=>{db=load();const q=overlay.querySelector('[data-q]').value.trim().toLocaleUpperCase('pt-BR'),by=overlay.querySelector('[data-by]').value,rows=overlay.querySelector('[data-rows]');rows.replaceChildren();const matches=db.funcionarios.filter(f=>!q||(by==='codigo'?String(f.id).includes(q):String(f.nome||'').toLocaleUpperCase('pt-BR').includes(q)));matches.forEach((f,i)=>{const tr=document.createElement('tr');tr.style.cssText=`cursor:pointer;background:${i%2?'#fff':'#f5f9ff'};border-bottom:1px solid #cbdcf4`;[f.id,f.nome||'',f.cargo||'',f.situacao||'ATIVO'].forEach((v,j)=>{const td=document.createElement('td');td.style.padding='12px 10px';if(j===3){const tag=document.createElement('span');tag.textContent=v;tag.style.cssText='background:#bdf0d3;color:#126341;border-radius:15px;padding:5px 12px;font-weight:bold';td.append(tag)}else td.textContent=v;tr.append(td)});tr.ondblclick=()=>{$('rh-search-employee-id').value=String(f.id);$('rh-search-employee-name').value=f.nome;close()};rows.append(tr)});if(!matches.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=4;td.textContent='NENHUM FUNCIONÁRIO ENCONTRADO.';td.style.padding='18px 10px';tr.append(td);rows.append(tr)}};
  overlay.querySelector('[data-go]').onclick=render;
  overlay.querySelector('[data-q]').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();render()}};
  overlay.querySelector('[data-all]').onclick=()=>{$('rh-search-employee-id').value='';$('rh-search-employee-name').value='TODOS';close()};
  overlay.querySelector('[data-new]').onclick=()=>{close();screenEmployee()};
  render();overlay.querySelector('[data-q]').focus();
 };
}
function renderTab(){
 const body=$('rh-tab-body');if(!body)return;
 
 const isAbs=tab==='FALTAS / ATESTADOS',isAdvance=tab==='VALES / ADIANTAMENTOS',isExtra=tab==='ADICIONAIS / DESCONTOS',isCommission=tab==='COMISSÕES',isPayment=tab==='PAGAMENTOS';
 if(isCommission||isPayment){
  const records=[];
  if(isCommission){
   const months=new Set();
   for(const v of [...(JSON.parse(localStorage.getItem('erp_matriz_vendas_v1')||'[]')),...(JSON.parse(localStorage.getItem('erp_matriz_trocas_v1')||'[]'))]){
    const d=String(v.baixadaEm||v.dataBaixa||v.data||'');if(/^\d{4}-\d{2}/.test(d))months.add(d.slice(0,7));
   }
   for(const folha of JSON.parse(localStorage.getItem('lucas_lima_folhas_individuais_v2')||'[]'))months.add(`${folha.ano}-${String(folha.mes).padStart(2,'0')}`);
   for(const f of db.funcionarios)for(const comp of months){const items=window.LL_comissoesFuncionarioV546?.(f,comp)||[];for(const entry of items)records.push({...entry,funcionarioId:String(f.id),funcionarioNome:f.nome,detalhe:entry.detalhe+(entry.consolidada?' — FOLHA GERADA':'')});}
  }else{
   // Fonte oficial: pagamentos vinculados a documentos, não lançamentos pendentes.
   const docs={
    'FOLHA DE PAGAMENTO':JSON.parse(localStorage.getItem('lucas_lima_folhas_individuais_v2')||'[]'),
    'FÉRIAS':JSON.parse(localStorage.getItem('lucas_lima_ferias_v1')||'[]'),
    'RESCISÃO':JSON.parse(localStorage.getItem('erp_systems_rescisoes_v2')||'[]')
   };
   const contas=(JSON.parse(localStorage.getItem('erp_matriz_operacoes_v2')||'{}').pagar||[]);
   const seen=new Set();
   const add=(origem,doc,pay,funcId,funcNome)=>{
    if(!pay||pay.estornado||Number(pay.valor)<=0||!pay.data)return;
    const identity=[origem,doc.numero,pay.id??pay.data+'-'+pay.valor].join('|');
    if(seen.has(identity))return;seen.add(identity);
    records.push({data:String(pay.data).slice(0,10),numero:String(doc.numero),origem,valor:pay.valor,detalhe:funcNome+' — '+(pay.forma||pay.contaOrigem||pay.conta||''),funcionarioId:String(funcId),funcionarioNome:funcNome,documentoNumero:String(doc.numero)});
   };
   for(const [origem,lista] of Object.entries(docs))for(const doc of (Array.isArray(lista)?lista:[])){
    const funcId=doc.funcionarioId??doc.funcionario;
    const funcNome=db.funcionarios.find(f=>String(f.id)===String(funcId))?.nome||doc.funcionarioSnapshot?.nome||'';
    const conta=contas.find(x=>x.origem===origem&&String(x[origem==='FOLHA DE PAGAMENTO'?'folhaNumero':origem==='FÉRIAS'?'feriasNumero':'rescisaoNumero'])===String(doc.numero));
    for(const pay of conta?.pagamentos||[])add(origem,doc,pay,funcId,funcNome);
   }
   // Compatibilidade com folhas consolidadas do RH legado, sem duplicar registros.
   for(const [comp,folha] of Object.entries(db.folhas||{}))for(const item of folha.itens||[])for(const pay of item.pagamentos||[]){
    if(pay.estornado||Number(pay.valor)<=0||!pay.data)continue;
    const id='LEGADO|'+comp+'|'+item.id+'|'+(pay.id??pay.data+'-'+pay.valor);
    if(seen.has(id))continue;seen.add(id);
    records.push({data:pay.data,numero:comp,origem:'FOLHA DE PAGAMENTO (LEGADO)',valor:pay.valor,detalhe:item.nome||'',funcionarioId:String(item.id),funcionarioNome:item.nome||'',documentoNumero:comp,legado:true});
   }
   records.sort((a,b)=>String(b.data).localeCompare(String(a.data)));
  }
  body.innerHTML=`<div class="rh-form" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.25fr) auto;gap:12px;align-items:end">${inp('start','DATA INICIAL','date')}${inp('end','DATA FINAL','date')}${rhEmployeeFilterHTML()}${button('PESQUISAR','rh-search-commission','blue')}</div><div class="rh-scroll"><table class="rh-table"><thead><tr><th>DATA</th><th>ORIGEM</th><th>NÚMERO</th><th>VALOR</th><th>DETALHES</th></tr></thead><tbody id="ll-results"><tr><td colspan="5">INFORME AS DATAS E CLIQUE EM PESQUISAR PARA EXIBIR OS RESULTADOS.</td></tr></tbody></table></div>`;
  rhBindEmployeeFilter();const draw=()=>{const from=$('rh-start').value,to=$('rh-end').value,who=$('rh-search-employee-id').value;const shown=records.filter(x=>(!from||x.data>=from)&&(!to||x.data<=to)&&(!who||String(x.funcionarioId)===who));$('ll-results').innerHTML=shown.map((x,i)=>`<tr data-payment-index="${i}" style="cursor:pointer" title="DÊ DOIS CLIQUES PARA ABRIR O DOCUMENTO ORIGINAL"><td>${esc(x.data)}</td><td>${esc(x.origem)}</td><td>${esc(x.numero)}</td><td>${brl(x.valor)}</td><td>${esc(x.detalhe)}</td></tr>`).join('')||'<tr><td colspan="5">NENHUM RESULTADO ENCONTRADO.</td></tr>';$('ll-results').querySelectorAll('[data-payment-index]').forEach(tr=>tr.ondblclick=()=>{const rec=shown[Number(tr.dataset.paymentIndex)];if(rec&&!rec.legado)window.LL_abrirPagamentoConsulta?.(rec);else if(rec)aviso('PAGAMENTO LEGADO','ESTE PAGAMENTO PERTENCE À FOLHA ANTIGA E NÃO POSSUI DOCUMENTO INDIVIDUAL VINCULADO.')})};
  $('rh-search-commission').onclick=draw;return;
 }
 const tipos=isAbs?['FALTA SEM JUSTIFICATIVA','FALTA COM ATESTADO','FALTA JUSTIFICADA']:isAdvance?['VALE','ADIANTAMENTO']:['ADICIONAL','DESCONTO'];
 const filtered=()=>db.eventos.filter(x=>isAbs?x.tipo.startsWith('FALTA'):isAdvance?['VALE','ADIANTAMENTO'].includes(x.tipo):['ADICIONAL','DESCONTO'].includes(x.tipo));
 body.innerHTML=`<div class="rh-form">${sel('etype','TIPO DE LANÇAMENTO',tipos)}${inp('edate','DATA','date')}${isAbs?inp('edays','DIAS DE FALTA','number','min="0" step="0.5"'):''}${inp('eamount','VALOR (R$)','number','min="0" step="0.01"')}${!isExtra?sel('ediscount','DESCONTAR DO SALÁRIO?',['SIM','NÃO']):''}${inp('enote','MOTIVO / OBSERVAÇÕES')}${isAbs?'<label class="rh-field">ANEXAR ATESTADO (PDF / IMAGEM)<input type="file" id="rh-efile" accept="application/pdf,image/*"></label>':''}${isAdvance?`<label class="rh-field">FORMA DE PAGAMENTO<select id="rh-payment-form"><option value="">SELECIONE A FORMA DE PAGAMENTO</option></select></label>`:''}<label class="rh-field">USUÁRIO RESPONSÁVEL<input id="rh-user" readonly value="${esc(currentOperator())}"></label></div><div class="rh-actions rh-event-actions">${button('GRAVAR LANÇAMENTO','rh-add','green')}${button('ALTERAR','rh-update','slate')}</div><div id="ll-search-filters" class="rh-form" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.25fr) auto;align-items:end;gap:12px;margin-top:14px">${inp('from','DATA INICIAL','date')}${inp('to','DATA FINAL','date')}${rhEmployeeFilterHTML()}${button('PESQUISAR','rh-search-events','blue')}</div><div class="rh-scroll"><table class="rh-table"><thead><tr><th>DATA</th><th>TIPO</th>${isAbs?'<th>DIAS</th>':''}<th>VALOR</th>${!isExtra?'<th>DESCONTAR</th>':''}<th>OBSERVAÇÕES</th>${isAdvance?'<th>FORMA DE PAGAMENTO</th>':''}${isAbs?'<th>ANEXO</th>':''}<th>USUÁRIO</th><th>AÇÕES</th></tr></thead><tbody id="ll-event-rows"></tbody></table></div>`;
 let editing=null, searched=false, allowEdit=false;
 rhBindEmployeeFilter();
 const openEventHistory=()=>{
  const event=editing?filtered().find(x=>String(x.id)===String(editing)):null;
  if(!event){aviso('HISTÓRICO DO LANÇAMENTO','SELECIONE UM LANÇAMENTO EM ALTERAR PARA CONSULTAR SEU HISTÓRICO.');return}
  const records=Array.isArray(event.historicoOperacoes)?event.historicoOperacoes:[];
  const fields={tipo:'TIPO DE LANÇAMENTO',data:'DATA',dias:'DIAS DE FALTA',valor:'VALOR',descontar:'DESCONTAR DO SALÁRIO',obs:'MOTIVO / OBSERVAÇÕES',conta:'CONTA FINANCEIRA',formaPagamentoId:'FORMA DE PAGAMENTO',anexo:'ATESTADO'};
  const details=records.slice().reverse().map(e=>{
   const changes=(Array.isArray(e.alteracoes)?e.alteracoes:[]).filter(c=>Object.hasOwn(fields,c.campo));
   return `<div style="padding:11px 0;border-bottom:1px solid #dce5f2"><b>${esc(e.acao||'ALTERAÇÃO')} — ${esc(e.usuario||'NÃO INFORMADO')}</b><div style="font-size:12px;color:#64758b">${esc(e.data?new Date(e.data).toLocaleString('pt-BR'):'')}</div>${changes.map(c=>`<div style="font-size:12px;margin-top:6px"><b>${fields[c.campo]}:</b> ${esc(c.campo==='valor'?brl(c.anterior):String(c.anterior??''))} → ${esc(c.campo==='valor'?brl(c.novo):String(c.novo??''))}</div>`).join('')}</div>`;
  }).join('');
  const layer=document.createElement('div');layer.className='rh-event-history-overlay';layer.style.cssText='position:fixed;inset:0;z-index:999999;background:#071d3b99;display:flex;align-items:center;justify-content:center;padding:15px';
  layer.innerHTML=`<section role="dialog" aria-modal="true" style="width:min(650px,95vw);max-height:85vh;background:#fff;border-radius:9px;overflow:hidden;display:flex;flex-direction:column;color:#183b69"><header style="background:#173e77;color:white;padding:15px 18px;display:flex;justify-content:space-between;align-items:center"><b>HISTÓRICO DE ALTERAÇÕES — LANÇAMENTO</b><button type="button" data-close style="background:#2360ab;color:white;border:1px solid #9ebee8;border-radius:5px;padding:9px 13px;cursor:pointer">FECHAR</button></header><div style="padding:18px;overflow:auto"><p><b>LANÇAMENTO:</b> ${esc(event.tipo)} — ${esc(event.data)}</p><p><b>ÚLTIMO USUÁRIO:</b> ${esc(event.alteradoPor||event.usuario||'NÃO INFORMADO')}</p>${details||'<p>Este lançamento ainda não possui alterações registradas.</p>'}</div></section>`;
  const close=()=>{document.removeEventListener('keydown',onKey,true);layer.remove()};const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
  layer.querySelector('[data-close]').onclick=close;layer.onclick=e=>{if(e.target===layer)close()};document.addEventListener('keydown',onKey,true);document.body.append(layer);
 };
 $('rh-user').dataset.auditUser='1';$('rh-user').title='Clique para ver o histórico do lançamento selecionado';$('rh-user').style.cursor='pointer';$('rh-user').addEventListener('click',openEventHistory);
 const selectEvent=(id)=>{const x=filtered().find(v=>String(v.id)===String(id));if(!x)return;selected=x.funcionario;editing=x.id;$('rh-etype').value=x.tipo;$('rh-edate').value=x.data;$('rh-eamount').value=x.valor;$('rh-enote').value=x.obs||'';if(isAbs)$('rh-edays').value=x.dias||'';if(!isExtra)$('rh-ediscount').value=x.descontar||'NÃO';if(isAdvance)$('rh-payment-form').value=x.formaPagamentoId||'';$('rh-user').value=x.alteradoPor||x.usuario||currentOperator();body.querySelectorAll('#ll-event-rows tr').forEach(tr=>tr.style.background=tr.dataset.eventId===String(id)?'#e4f0ff':'');body.scrollIntoView({block:'start',behavior:'smooth'})};
 const draw=()=>{const from=$('rh-from')?.value||'',to=$('rh-to')?.value||'',who=$('rh-search-employee-id')?.value||'';const rows=$('ll-event-rows');if(!searched){rows.innerHTML=`<tr><td colspan="12" style="padding:15px">INFORME AS DATAS E CLIQUE EM PESQUISAR PARA EXIBIR OS LANÇAMENTOS.</td></tr>`;return}rows.innerHTML=filtered().filter(x=>(!from||x.data>=from)&&(!to||x.data<=to)&&(!who||String(x.funcionario)===who)).map(x=>`<tr data-event-id="${esc(x.id)}" title="DUPLO CLIQUE PARA SELECIONAR O LANÇAMENTO" style="cursor:pointer"><td>${esc(x.data)}</td><td>${esc(x.tipo)}</td>${isAbs?`<td>${esc(x.dias||'')}</td>`:''}<td>${brl(x.valor)}</td>${!isExtra?`<td>${esc(x.descontar||'')}</td>`:''}<td>${esc(x.obs||'')}</td>${isAdvance?`<td>${esc(x.formaPagamento||'—')}</td>`:''}${isAbs?`<td>${x.anexo?`<button type="button" data-file="${esc(x.id)}" style="background:#1d5eb4;color:#fff;border:0;border-radius:4px;padding:7px 12px;cursor:pointer;font-weight:700">ABRIR</button>`:'-'}</td>`:''}<td>${esc(x.usuario||'-')}</td><td><button type="button" data-del="${esc(x.id)}" style="background:#dc263b;color:#fff;border:0;border-radius:4px;padding:7px 12px;cursor:pointer">EXCLUIR</button></td></tr>`).join('')||'<tr><td colspan="12">NENHUM LANÇAMENTO ENCONTRADO.</td></tr>';
  rows.querySelectorAll('tr[data-event-id]').forEach(tr=>tr.ondblclick=e=>{if(e.target.closest('button'))return;selectEvent(tr.dataset.eventId)});
  body.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{const x=filtered().find(v=>v.id===b.dataset.del);if(!x)return;const ok=await janela({titulo:'EXCLUIR LANÇAMENTO',mensagem:'CONFIRMA A EXCLUSÃO?',confirmar:'EXCLUIR'});if(!ok)return;const old=db.eventos.slice();db.eventos=db.eventos.filter(v=>v.id!==x.id);if(!persist()){db.eventos=old;return}if(isAdvance&&!syncAdvance(x,true)){db.eventos=old;persist();return}draw()});
  body.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>openAttachment(b.dataset.file));
 };
 if(isAdvance){
  const paymentSelect=$('rh-payment-form');
  rhPaymentForms().forEach(f=>paymentSelect.add(new Option(f.descricao+' — '+f.tipo,String(f.id))));
  // Preserve previously selected payment forms for historical editing.
  entries().filter(e=>e.formaPagamentoId).forEach(e=>{
   if(![...paymentSelect.options].some(o=>o.value===String(e.formaPagamentoId)))paymentSelect.add(new Option(e.formaPagamento||'FORMA INATIVA',String(e.formaPagamentoId)));
  });
 }
 $('rh-edate').value=today();if(!isExtra)$('rh-ediscount').value=isAbs?'SIM':'SIM';
 $('rh-search-events').onclick=()=>{searched=true;draw()};
 $('rh-update').onclick=()=>{if(!editing)return aviso('ALTERAR LANÇAMENTO','DÊ DOIS CLIQUES EM UM LANÇAMENTO DA LISTA PARA SELECIONÁ-LO.');allowEdit=true;$('rh-add').click();allowEdit=false};
 $('rh-add').onclick=async()=>{if(!employee())return aviso('FUNCIONÁRIO','SELECIONE UM FUNCIONÁRIO NO CABEÇALHO PARA GRAVAR.');
  if(editing&&!allowEdit)return aviso('ALTERAR LANÇAMENTO','UTILIZE O BOTÃO ALTERAR PARA SALVAR AS MODIFICAÇÕES.');
  const tipo=$('rh-etype').value,valor=n($('rh-eamount').value),dias=isAbs?n($('rh-edays').value):0,file=isAbs?$('rh-efile').files[0]:null;
  if(isAbs&&!dias)return aviso('VALIDAÇÃO','INFORME OS DIAS DE FALTA.');
  if(!isAbs&&!valor)return aviso('VALIDAÇÃO','INFORME O VALOR.');
  const formaPagamentoId=isAdvance?$('rh-payment-form').value.trim():'';
  const forma=isAdvance?rhPaymentForms().find(f=>String(f.id)===formaPagamentoId):null;
  if(isAdvance&&!forma)return aviso('VALIDAÇÃO','SELECIONE UMA FORMA DE PAGAMENTO ATIVA CADASTRADA.');
  const conta=isAdvance?rhPaymentAccount(forma)?.id:'';
  if(isAdvance&&!conta)return aviso('VALIDAÇÃO','A FORMA DE PAGAMENTO PRECISA TER UMA CONTA FINANCEIRA ATIVA VINCULADA NO CADASTRO.');
  const old=editing?db.eventos.find(x=>x.id===editing):null;
  const ev={...old,id:old?.id||uid(),funcionario:selected,tipo,data:$('rh-edate').value||today(),valor,dias,descontar:isExtra?(tipo==='DESCONTO'?'SIM':'NÃO'):$('rh-ediscount').value,obs:$('rh-enote').value,conta,formaPagamentoId:formaPagamentoId||'',formaPagamento:forma?.descricao||'',usuario:old?.usuario||currentOperator(),alteradoPor:old?currentOperator():'',anexo:file?file.name:old?.anexo||''};
  // Auditoria exclusiva de cada lançamento (falta, vale ou adicional).
  const auditFields=['tipo','data','dias','valor','descontar','obs','conta','formaPagamentoId','anexo'];
  const changes=old?auditFields.filter(k=>String(old[k]??'')!==String(ev[k]??'')).map(k=>({campo:k,anterior:old[k]??'',novo:ev[k]??''})):[];
  const history=Array.isArray(old?.historicoOperacoes)?old.historicoOperacoes.slice():[];
  if(!old||changes.length)history.push({acao:old?'ALTERAÇÃO':'CADASTRO',data:new Date().toISOString(),usuario:currentOperator(),alteracoes:changes});
  ev.historicoOperacoes=history;
  if(file){if(file.size>8*1024*1024)return aviso('ANEXO','LIMITE DE 8 MB.');try{await putAttachment(ev.id,file)}catch{return aviso('ERRO','FALHA AO GRAVAR ANEXO.')}}
  const snapshot=db.eventos.slice();if(old)db.eventos[db.eventos.indexOf(old)]=ev;else db.eventos.push(ev);
  if(!persist()){db.eventos=snapshot;return}if(isAdvance&&!syncAdvance(ev)){db.eventos=snapshot;persist();return}renderTab();aviso('SUCESSO',old?'LANÇAMENTO ALTERADO.':'LANÇAMENTO GRAVADO.');
 };
 draw();
}
function idb(){return new Promise((resolve,reject)=>{const req=indexedDB.open('erp_matriz_anexos_rh',1);req.onupgradeneeded=()=>req.result.createObjectStore('anexos');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function putAttachment(id,file){const db=await idb();await new Promise((resolve,reject)=>{const t=db.transaction('anexos','readwrite');t.objectStore('anexos').put(file,id);t.oncomplete=resolve;t.onerror=()=>reject(t.error)});db.close()}
async function openAttachment(id){
 try{
  const d=await idb();
  const file=await new Promise((resolve,reject)=>{const t=d.transaction('anexos','readonly');const r=t.objectStore('anexos').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  d.close();
  if(!file)return aviso('ANEXO','ARQUIVO NÃO ENCONTRADO NESTE NAVEGADOR.');
  const mime=String(file.type||'').toLowerCase();
  const name=String(file.name||'ANEXO');
  const pdf=mime==='application/pdf'||/\.pdf$/i.test(name);
  const picture=mime.startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(name);
  if(!pdf&&!picture)return aviso('ANEXO','FORMATO NÃO SUPORTADO PARA VISUALIZAÇÃO INTERNA.');
  document.querySelector('.rh-attachment-preview')?.remove();
  const url=URL.createObjectURL(file);
  const cover=document.createElement('div');cover.className='rh-attachment-preview';
  cover.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(5,22,48,.72);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box';
  const dialog=document.createElement('section');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','VISUALIZAÇÃO DO ANEXO');
  dialog.style.cssText='width:min(1050px,96vw);height:min(780px,92vh);background:white;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 15px 50px #0006';
  const header=document.createElement('header');header.style.cssText='background:#173e77;color:#fff;padding:15px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px';
  const heading=document.createElement('strong');heading.textContent='VISUALIZAÇÃO DO ANEXO — '+name;heading.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.textContent='FECHAR';closeBtn.style.cssText='background:#e8f1ff;color:#174a86;border:1px solid #b7d3fa;border-radius:5px;padding:9px 17px;font-weight:bold;cursor:pointer';
  const printBtn=document.createElement('button');printBtn.type='button';printBtn.textContent='IMPRIMIR';printBtn.style.cssText='background:#1765d1;color:white;border:1px solid #1765d1;border-radius:5px;padding:9px 17px;font-weight:bold;cursor:pointer';
  const saveBtn=document.createElement('button');saveBtn.type='button';saveBtn.textContent='SALVAR';saveBtn.style.cssText='background:#079b70;color:white;border:1px solid #079b70;border-radius:5px;padding:9px 17px;font-weight:bold;cursor:pointer';
  const actions=document.createElement('div');actions.style.cssText='display:flex;align-items:center;gap:8px;flex-shrink:0';actions.append(printBtn,saveBtn,closeBtn);
  header.append(heading,actions);
  const content=document.createElement('div');content.style.cssText='flex:1;min-height:0;background:#edf2f9;display:flex;align-items:center;justify-content:center;overflow:auto';
  if(pdf){const frame=document.createElement('iframe');frame.title='PDF ANEXADO';frame.src=url+'#toolbar=1&navpanes=0';frame.style.cssText='width:100%;height:100%;border:0;background:white';content.append(frame)}
  else{const img=document.createElement('img');img.alt=name;img.src=url;img.style.cssText='display:block;max-width:100%;max-height:100%;object-fit:contain';content.append(img)}
  dialog.append(header,content);cover.append(dialog);document.body.append(cover);
  const previousFocus=document.activeElement;
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
  function close(){document.removeEventListener('keydown',onKey,true);cover.remove();URL.revokeObjectURL(url);previousFocus?.focus?.()}
  // Imprime somente o arquivo anexado, sem menus ou botões do sistema.
  printBtn.onclick=()=>{
   if(pdf){
    const frame=document.createElement('iframe');frame.title='IMPRESSÃO DO ANEXO';frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';frame.src=url;
    document.body.append(frame);
    frame.onload=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch{window.open(url,'_blank')}setTimeout(()=>frame.remove(),60000)};
   }else{
    const frame=document.createElement('iframe');frame.title='IMPRESSÃO DO ANEXO';frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';document.body.append(frame);
    const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><head><title>IMPRIMIR ANEXO</title><style>@page{margin:10mm}html,body{margin:0;width:100%;height:100%}body{display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100%;object-fit:contain}</style></head><body><img id="print-image"></body></html>');doc.close();
    const im=doc.getElementById('print-image');im.onload=()=>{frame.contentWindow.focus();frame.contentWindow.print();setTimeout(()=>frame.remove(),60000)};im.src=url;
   }
  };
  saveBtn.onclick=async()=>{
   // O seletor nativo permite escolher pasta e nome; navegadores sem suporte usam download.
   if(typeof window.showSaveFilePicker==='function'){
    try{const handle=await window.showSaveFilePicker({suggestedName:name});const writable=await handle.createWritable();await writable.write(file);await writable.close();return}catch(e){if(e?.name==='AbortError')return}
   }
   const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  };
  closeBtn.onclick=close;cover.onclick=e=>{if(e.target===cover)close()};document.addEventListener('keydown',onKey,true);closeBtn.focus();
 }catch(err){aviso('ANEXO','NÃO FOI POSSÍVEL VISUALIZAR O ARQUIVO.')}
}
function salesCommission(f,comp){let op={},vendors={vendedores:[]};try{op=JSON.parse(localStorage.getItem(OPER)||'{}')}catch{};try{vendors=JSON.parse(localStorage.getItem('erp_matriz_vendedores_v1')||'{}')}catch{};const seller=(vendors.vendedores||[]).find(s=>Number(s.funcionarioId)===Number(f.id));const vendas=Array.isArray(op.vendas)?op.vendas:[];const total=vendas.filter(v=>String(v.situacao||'').toUpperCase()==='BAIXADA'&&String(v.dataBaixa||v.data||'').slice(0,7)===comp&&([v.vendedorId,v.codigoVendedor,v.vendedorCodigo,v.funcionarioId].some(x=>x!==undefined&&((seller&&Number(x)===Number(seller.id))||String(x)==='F-'+f.id||Number(x)===Number(f.id)))||String(v.vendedor||'').toUpperCase()===String(f.nome||'').toUpperCase()&&!!v.vendedor)).reduce((a,v)=>a+n(v.total??v.valorTotal??v.valor),0);return total*n(f.comissao??seller?.percentual??0)/100}
function calc(f,comp){const ev=db.eventos.filter(x=>x.funcionario===f.id&&String(x.data||'').slice(0,7)===comp);const fixo=n(f.salario),comissao=salesCommission(f,comp)+ev.filter(x=>x.tipo==='AJUSTE DE COMISSÃO').reduce((a,x)=>a+n(x.valor),0);const base=f.tipo==='VENDEDOR (COMISSÃO)'?Math.max(fixo,comissao):fixo;const adicionais=ev.filter(x=>x.tipo==='ADICIONAL').reduce((a,x)=>a+n(x.valor),0);const descontos=ev.filter(x=>x.tipo==='DESCONTO').reduce((a,x)=>a+n(x.valor),0);const faltas=ev.filter(x=>x.tipo.startsWith('FALTA')&&x.descontar==='SIM').reduce((a,x)=>a+(n(x.valor)||fixo/30*n(x.dias)),0);const vales=ev.filter(x=>['VALE','ADIANTAMENTO'].includes(x.tipo)&&x.descontar==='SIM').reduce((a,x)=>a+n(x.valor),0);const total=Math.max(0,base+adicionais-faltas-vales-descontos);return {fixo,comissao,base,adicionais,faltas,vales,descontos,total}}
function payroll(){return db.folhas[competencia]}
function screenPayroll(){screen='FOLHA DE PAGAMENTO';root().innerHTML=`<section class="rh-page"><h1>▤ FOLHA DE PAGAMENTO</h1><div class="rh-panel"><div class="rh-actions"><label class="rh-field">COMPETÊNCIA<input type="month" id="rh-comp" value="${competencia}"></label>${button('GERAR / ATUALIZAR FOLHA','rh-generate','green')}${button('IMPRIMIR DEMONSTRATIVO','rh-print','blue')}${button('VOLTAR (F1)','rh-return','red')}</div><p id="rh-state"></p><div id="rh-summary" class="rh-summary"></div><div class="rh-scroll"><table class="rh-table"><thead><tr><th>FUNCIONÁRIO</th><th>FIXO</th><th>COMISSÃO</th><th>ADICIONAIS</th><th>DESCONTOS</th><th>LÍQUIDO PREVISTO</th><th>PAGO</th><th>SALDO</th><th>SITUAÇÃO</th></tr></thead><tbody id="rh-payrows"></tbody></table></div></div><div class="rh-panel"><h2>DEMONSTRATIVO INDIVIDUAL</h2><div id="rh-detail">SELECIONE UM FUNCIONÁRIO NA LISTA.</div></div></section>`;active('ADMINISTRATIVO');$('rh-comp').onchange=()=>{competencia=$('rh-comp').value;renderPayroll()};$('rh-generate').onclick=generate;$('rh-return').onclick=screenEmployee;$('rh-print').onclick=()=>window.print();renderPayroll()}
function generate(){if(!competencia)return;const allowed=new Date(competencia+'-01T12:00:00');allowed.setMonth(allowed.getMonth()+1);if(new Date()<allowed)return aviso('FOLHA','A COMPETÊNCIA SÓ PODE SER FECHADA A PARTIR DO DIA 1º DO MÊS SEGUINTE.');const previous=payroll();if(previous&&previous.itens.some(x=>x.pagamentos?.length))return aviso('FOLHA','EXISTEM PAGAMENTOS REGISTRADOS. NÃO É POSSÍVEL RECALCULAR SEM CONCILIAÇÃO.');db.folhas[competencia]={criada:today(),itens:db.funcionarios.filter(f=>f.situacao==='ATIVO'||f.desligamento&&f.desligamento.slice(0,7)>=competencia).map(f=>({id:f.id,nome:f.nome,calc:calc(f,competencia),pagamentos:[]}))};persist();renderPayroll();aviso('FOLHA','FOLHA GERADA PARA CONFERÊNCIA. OS VALORES NÃO INCLUEM ENCARGOS LEGAIS AUTOMÁTICOS.')}
function renderPayroll(){if(!$('rh-payrows'))return;const folha=payroll();$('rh-state').textContent=folha?`FOLHA GERADA EM ${folha.criada} — CONFERIR ANTES DE PAGAR`:'SEM FOLHA GERADA PARA ESTA COMPETÊNCIA.';$('rh-payrows').replaceChildren();if(!folha){$('rh-summary').textContent='';$('rh-detail').textContent='GERAR A FOLHA PARA CONSULTAR OS FUNCIONÁRIOS.';return}const total=folha.itens.reduce((a,x)=>a+x.calc.total,0),pago=folha.itens.reduce((a,x)=>a+x.pagamentos.reduce((b,p)=>b+n(p.valor),0),0);$('rh-summary').innerHTML=`<div>FUNCIONÁRIOS <b>${folha.itens.length}</b></div><div>LÍQUIDO PREVISTO <b>${brl(total)}</b></div><div>TOTAL PAGO <b>${brl(pago)}</b></div><div>SALDO <b>${brl(Math.max(0,total-pago))}</b></div>`;for(const x of folha.itens){const p=x.pagamentos.reduce((a,v)=>a+n(v.valor),0),saldo=Math.max(0,x.calc.total-p);const tr=document.createElement('tr');[x.nome,brl(x.calc.fixo),brl(x.calc.comissao),brl(x.calc.adicionais),brl(x.calc.faltas+x.calc.vales),brl(x.calc.total),brl(p),brl(saldo),saldo<0.005?'PAGO':p?'PARCIAL':'PENDENTE'].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});tr.ondblclick=()=>detail(x.id);tr.title='DUPLO CLIQUE PARA ABRIR';$('rh-payrows').append(tr)}}
function detail(id){const x=payroll()?.itens.find(x=>Number(x.id)===Number(id));if(!x)return;const c=x.calc,p=x.pagamentos.reduce((a,v)=>a+n(v.valor),0),saldo=Math.max(0,c.total-p);$('rh-detail').innerHTML=`<div class="rh-paper"><h2>LUCAS LIMA — DEMONSTRATIVO DE PAGAMENTO</h2><p>COMPETÊNCIA: ${esc(competencia)} | FUNCIONÁRIO: <b>${esc(x.nome)}</b> | CÓDIGO: ${x.id}</p><table class="rh-table"><tr><th>VENCIMENTOS</th><th>VALOR</th><th>DESCONTOS</th><th>VALOR</th></tr><tr><td>REMUNERAÇÃO-BASE (FIXO OU COMISSÃO)</td><td>${brl(c.base)}</td><td>FALTAS DESCONTÁVEIS</td><td>${brl(c.faltas)}</td></tr><tr><td>ADICIONAIS</td><td>${brl(c.adicionais)}</td><td>VALES / ADIANTAMENTOS</td><td>${brl(c.vales)}</td></tr></table><p>FIXO: ${brl(c.fixo)} | COMISSÃO APURADA: ${brl(c.comissao)}</p><h3>LÍQUIDO PREVISTO: ${brl(c.total)} | PAGO: ${brl(p)} | SALDO: ${brl(saldo)}</h3><h3>PAGAMENTOS REGISTRADOS</h3><table class="rh-table"><tr><th>DATA</th><th>CONTA / FORMA</th><th>VALOR</th></tr>${x.pagamentos.map(v=>`<tr><td>${esc(v.data)}</td><td>${esc(v.conta)}</td><td>${brl(v.valor)}</td></tr>`).join('')}</table></div><div class="rh-actions rh-no-print">${button('PAGAR FUNCIONÁRIO','rh-pay','green')}${button('IMPRIMIR DEMONSTRATIVO','rh-print-one','blue')}</div>`;$('rh-pay').onclick=()=>pay(id);$('rh-print-one').onclick=()=>window.print()}
function pay(id){const x=payroll()?.itens.find(x=>Number(x.id)===Number(id));if(!x)return;const paid=x.pagamentos.reduce((a,p)=>a+n(p.valor),0),remaining=Math.max(0,x.calc.total-paid);if(remaining<0.005)return aviso('FOLHA','FUNCIONÁRIO JÁ ESTÁ PAGO.');if(document.querySelector('.rh-overlay'))return;const overlay=document.createElement('div');overlay.className='rh-overlay';overlay.innerHTML=`<section class="rh-dialog"><h2>PAGAR FUNCIONÁRIO</h2><p>${esc(x.nome)} — SALDO: ${brl(remaining)}</p><label>DATA <input type="date" id="rh-pdate" value="${today()}"></label><label>VALOR (R$) <input type="number" min="0.01" step="0.01" max="${remaining}" value="${remaining.toFixed(2)}" id="rh-pvalue"></label><label>CONTA / FORMA <input id="rh-paccount" placeholder="PIX, DINHEIRO, BANCO..."></label><div class="rh-actions">${button('CONFIRMAR PAGAMENTO','rh-pconfirm','green')}${button('CANCELAR','rh-pcancel','slate')}</div></section>`;document.body.append(overlay);$('rh-pcancel').onclick=()=>overlay.remove();$('rh-pconfirm').onclick=async()=>{const value=n($('rh-pvalue').value),account=$('rh-paccount').value.trim();if(value<=0||value>remaining+0.001||!account)return aviso('VALIDAÇÃO','INFORME VALOR VÁLIDO E CONTA / FORMA.');const ok=await janela({titulo:'CONFIRMAR PAGAMENTO',mensagem:`REGISTRAR PAGAMENTO DE ${brl(value)} PARA ${x.nome}?`,confirmar:'CONFIRMAR'});if(ok===null||ok===false)return;const payment={id:uid(),data:$('rh-pdate').value||today(),valor:value,conta:account};x.pagamentos.push(payment);if(!persist()){x.pagamentos.pop();return}overlay.remove();renderPayroll();detail(id);aviso('PAGAMENTO','PAGAMENTO REGISTRADO NA FOLHA. CONFIRA A CONCILIAÇÃO NO FINANCEIRO.')}}
function screenLancamentos(){
 screen='LANÇAMENTOS DE FUNCIONÁRIOS';selected=null;
 const choices=[
 ['FALTAS / ATESTADOS','Registrar faltas, atestados<br>e controlar descontos.','📅','red'],
 ['VALES / ADIANTAMENTOS','Registrar vales, adiantamentos<br>e outros descontos.','▣','green'],
 ['ADICIONAIS / DESCONTOS','Adicionar ou descontar<br>valores do salário.','+','orange'],
 ['COMISSÕES','Consultar comissões<br>das vendas baixadas.','%','purple'],
 ['PAGAMENTOS','Consultar pagamentos<br>da folha de pagamento.','▣','blue']

 ];
 root().innerHTML=`<section class="rh-page ll-page">
 <div class="ll-head"><h1>♟ LANÇAMENTOS DE FUNCIONÁRIOS</h1><button id="ll-shortcuts" type="button">⌂ &nbsp; ATALHOS</button></div>
 <div class="ll-panel"><h2>SELECIONAR FUNCIONÁRIO</h2>
 <div class="ll-select-row"><label>CÓDIGO<input id="ll-code" type="number" min="1" placeholder="CÓDIGO"></label><button class="ll-search-icon" id="ll-lookup" title="LOCALIZAR POR CÓDIGO" hidden style="display:none" aria-hidden="true" tabindex="-1">⌕</button><label class="ll-name">NOME DO FUNCIONÁRIO<input id="ll-name" readonly placeholder="SELECIONE UM FUNCIONÁRIO"></label><button class="ll-search-button" id="ll-find">⌕ &nbsp; PESQUISAR FUNCIONÁRIO</button></div>
 <div class="ll-details"><label>CARGO / FUNÇÃO<input id="ll-cargo" readonly></label><label>DEPARTAMENTO<input id="ll-dept" readonly></label><label>SITUAÇÃO<input id="ll-status" readonly></label></div></div>
 <div class="ll-panel ll-launch-panel"><h2>LANÇAMENTOS DO FUNCIONÁRIO</h2><div class="ll-card-grid">${choices.map(([t,d,i,c])=>`<button type="button" class="ll-card" data-tab="${t}"><span class="ll-icon ${c}">${i}</span><span class="ll-card-text"><strong>${t}</strong><small>${d}</small></span><span class="ll-chevron">›</span></button>`).join('')}</div>
 <div id="ll-content" hidden><h2 id="ll-title"></h2><div id="rh-tab-body"></div></div></div>
 <div class="ll-footer"><button type="button" id="ll-back">← &nbsp; VOLTAR</button></div></section>`;
 active('ADMINISTRATIVO');
 const pick=f=>{selected=f.id;$('ll-code').value=f.id;$('ll-name').value=f.nome||'';$('ll-cargo').value=f.cargo||'';$('ll-dept').value=f.departamento||'';$('ll-status').value=f.situacao||'ATIVO';$('ll-content').hidden=true;document.querySelectorAll('.ll-card').forEach(x=>x.classList.remove('selected'))};
 const f12=document.createElement('button');f12.id='ll-f12';f12.hidden=true;root().append(f12);
 f12.onclick=()=>{
  if(document.getElementById('ll-f12-overlay'))return;
  const d=document.createElement('div');d.className='rh-overlay';d.id='ll-f12-overlay';
  d.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="ll-f12-title" style="width:min(475px,94vw);background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 18px 55px #001b3b65;color:#153b6d;font-family:Arial,sans-serif">
   <header style="background:#1c528e;color:white;padding:19px 22px;display:flex;align-items:center;justify-content:space-between"><strong id="ll-f12-title" style="font-size:17px">▣ LUCAS LIMA — LOCALIZAR</strong><button type="button" id="ll-f12-x" aria-label="Fechar" style="border:0;background:transparent;color:white;font-size:24px;cursor:pointer">×</button></header>
   <div style="padding:26px 22px 22px"><div style="font-size:14px;margin:3px 0 18px">CÓDIGO DO FUNCIONÁRIO:</div><label for="ll-f12-value" style="display:block;font-weight:700;font-size:12px;margin-bottom:8px">INFORME O VALOR</label><input id="ll-f12-value" type="text" inputmode="numeric" autocomplete="off" placeholder="DIGITE AQUI..." style="width:100%;box-sizing:border-box;border:1px solid #9abef5;border-radius:7px;padding:12px 10px;font-size:14px;outline-color:#2475ee"><p id="ll-f12-error" role="alert" style="color:#bd1f36;font-size:12px;min-height:16px;margin:7px 0 0"></p><div style="display:flex;justify-content:center;gap:10px;margin-top:14px"><button type="button" id="ll-f12-go" style="background:#19599f;border:1px solid #19599f;color:white;border-radius:7px;padding:12px 20px;font-weight:700;cursor:pointer">CONFIRMAR</button><button type="button" id="ll-f12-close" style="background:#edf4ff;border:1px solid #b9d1f6;color:#19599f;border-radius:7px;padding:12px 20px;font-weight:700;cursor:pointer">CANCELAR</button></div></div></section>`;
  document.body.append(d);
  const close=()=>{d.remove();document.removeEventListener('keydown',key,true)};
  const go=()=>{const v=$('ll-f12-value').value.trim();db=load();const f=/^\d+$/.test(v)?db.funcionarios.find(x=>Number(x.id)===Number(v)):null;if(f){pick(f);close()}else $('ll-f12-error').textContent='FUNCIONÁRIO NÃO ENCONTRADO.'};
  const key=e=>{if(e.key==='Escape'||e.key==='Enter'||e.key==='F12'){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Enter')go();else close()}};
  $('ll-f12-close').onclick=close;$('ll-f12-x').onclick=close;$('ll-f12-go').onclick=go;
  d.addEventListener('mousedown',e=>{if(e.target===d)close()});document.addEventListener('keydown',key,true);$('ll-f12-value').focus();
 };
 $('ll-lookup').onclick=()=>{const f=db.funcionarios.find(x=>Number(x.id)===Number($('ll-code').value)&&$('ll-code').value);if(f)pick(f);else aviso('PESQUISA','FUNCIONÁRIO NÃO ENCONTRADO.')};
 // Atualiza os dados do funcionário assim que o código é digitado, sem exigir Enter.
 const llClearEmployee=()=>{selected=null;for(const id of ['ll-name','ll-cargo','ll-dept','ll-status'])$(id).value='';$('ll-content').hidden=true;document.querySelectorAll('.ll-card').forEach(x=>x.classList.remove('selected'))};
 const llResolveCode=(notify=false)=>{
  const code=$('ll-code').value.trim();
  if(!code){llClearEmployee();return}
  // Lê a base mais recente, inclusive após um cadastro em outra tela/aba.
  db=load();
  const f=/^\d+$/.test(code)?db.funcionarios.find(x=>String(Number(x.id))===String(Number(code))):null;
  if(f){pick(f);return}
  llClearEmployee();
  if(notify)aviso('PESQUISA','FUNCIONÁRIO NÃO ENCONTRADO.');
 };
 $('ll-code').addEventListener('input',()=>llResolveCode(false));
 $('ll-code').addEventListener('change',()=>llResolveCode(Boolean($('ll-code').value.trim())));
 $('ll-code').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();llResolveCode(true)}};
 $('ll-find').onclick=()=>{
  if(document.getElementById('ll-employee-search-overlay'))return;
  db=load();
  const cover=document.createElement('div');cover.className='rh-overlay';cover.id='ll-employee-search-overlay';
  cover.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="ll-picker-title" style="background:#fff;width:min(960px,96vw);max-height:86vh;display:flex;flex-direction:column;border-radius:11px;overflow:hidden;box-shadow:0 20px 60px #001a3e66;font-family:Arial,sans-serif;color:#153b6d">
   <header style="background:#205995;color:white;min-height:79px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box"><strong id="ll-picker-title" style="font-size:17px">SELECIONE O FUNCIONÁRIO</strong><button type="button" id="ll-picker-x" aria-label="Fechar" style="border:1px solid #a7c6ee;border-radius:5px;background:transparent;color:#fff;font-size:22px;width:35px;height:35px;cursor:pointer">×</button></header>
   <div style="padding:18px 20px 20px;overflow:auto">
    <div style="display:grid;grid-template-columns:110px minmax(0,1fr) 95px 150px;gap:7px;align-items:end;margin-bottom:12px">
     <label style="font-size:11px;font-weight:bold">PESQUISAR POR<select id="ll-picker-by" style="display:block;width:100%;height:44px;margin-top:6px;border:1px solid #bdd4f8;border-radius:6px;background:white;color:#153b6d;padding:8px"><option value="nome">NOME</option><option value="codigo">CÓDIGO</option></select></label>
     <label style="font-size:11px;font-weight:bold;min-width:0">TEXTO DA PESQUISA<input id="ll-picker-query" type="text" placeholder="DIGITE PARA PESQUISAR..." style="box-sizing:border-box;width:100%;height:44px;margin-top:6px;border:1px solid #77a7fa;border-radius:6px;padding:11px;color:#153b6d;outline-color:#2674e8"></label>
     <button id="ll-picker-go" type="button" style="height:40px;border:0;border-radius:5px;background:#1d579a;color:white;font-size:11px;font-weight:bold;cursor:pointer">PESQUISAR</button>
     <button id="ll-picker-new" type="button" style="height:40px;border:0;border-radius:5px;background:#069966;color:white;font-size:11px;font-weight:bold;cursor:pointer">+ NOVO FUNCIONÁRIO</button>
    </div>
    <div style="max-height:40vh;overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left"><thead style="position:sticky;top:0;background:#173e77;color:#fff"><tr><th style="padding:13px 10px">CÓDIGO</th><th style="padding:13px 10px">NOME DO FUNCIONÁRIO</th><th style="padding:13px 10px">CARGO / FUNÇÃO</th><th style="padding:13px 10px">SITUAÇÃO</th></tr></thead><tbody id="ll-picker-rows"></tbody></table></div>
    <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #d6e2f4;margin-top:18px;padding-top:15px;gap:12px"><span style="font-size:11px">DÊ DOIS CLIQUES PARA SELECIONAR.</span><button id="ll-picker-cancel" type="button" style="background:#eaf2ff;border:1px solid #b8d1fa;border-radius:5px;color:#1b5599;padding:12px 17px;cursor:pointer">CANCELAR</button></div>
   </div></section>`;
  document.body.append(cover);
  const close=()=>{cover.remove();document.removeEventListener('keydown',onKey,true)};
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}};
  document.addEventListener('keydown',onKey,true);
  const render=()=>{db=load();const by=$('ll-picker-by').value,q=$('ll-picker-query').value.trim().toLocaleUpperCase('pt-BR');const matches=db.funcionarios.filter(f=>!q||(by==='codigo'?String(f.id).includes(q):String(f.nome||'').toLocaleUpperCase('pt-BR').includes(q)));const body=$('ll-picker-rows');body.replaceChildren();if(!matches.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=4;td.textContent='NENHUM FUNCIONÁRIO ENCONTRADO.';td.style.padding='18px 10px';tr.append(td);body.append(tr);return}matches.forEach((f,i)=>{const tr=document.createElement('tr');tr.style.cssText=`cursor:pointer;background:${i%2?'#fff':'#f5f9ff'};border-bottom:1px solid #cbdcf4`;[f.id,f.nome||'',f.cargo||'',f.situacao||'ATIVO'].forEach((v,j)=>{const td=document.createElement('td');td.style.padding='12px 10px';if(j===3){const tag=document.createElement('span');tag.textContent=v;tag.style.cssText='background:#bdf0d3;color:#126341;border-radius:15px;padding:5px 12px;font-weight:bold';td.append(tag)}else td.textContent=v;tr.append(td)});tr.ondblclick=()=>{pick(f);close()};body.append(tr)})};
  $('ll-picker-go').onclick=render;
  $('ll-picker-query').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();render()}};
  $('ll-picker-by').onchange=()=>{};
  $('ll-picker-cancel').onclick=close;$('ll-picker-x').onclick=close;
  $('ll-picker-new').onclick=()=>{close();screenEmployee()};
  render();$('ll-picker-query').focus();
 };
 document.querySelectorAll('.ll-card').forEach(b=>b.onclick=()=>{tab=b.dataset.tab==='HISTÓRICO DE LANÇAMENTOS'?'HISTÓRICO':b.dataset.tab;$('ll-content').hidden=false;$('ll-title').textContent=b.dataset.tab;document.querySelectorAll('.ll-card').forEach(x=>x.classList.toggle('selected',x===b));renderTab();$('ll-content').scrollIntoView({behavior:'smooth',block:'nearest'})});
 $('ll-shortcuts').onclick=()=>{if(document.getElementById('ll-shortcut-overlay'))return;const d=document.createElement('div');d.id='ll-shortcut-overlay';d.className='rh-overlay';d.innerHTML=`<section class="rh-dialog" role="dialog" aria-modal="true" aria-label="ATALHOS — LANÇAMENTOS DE FUNCIONÁRIOS" style="width:min(475px,95vw);max-width:475px;padding:0;overflow:hidden;border-radius:12px"><div style="display:flex;align-items:center;justify-content:space-between;background:#1e5797;color:white;padding:19px 22px;font-weight:800;font-size:17px"><span>⌂ ATALHOS — LANÇAMENTOS DE FUNCIONÁRIOS</span><button type="button" id="ll-shortcut-x" aria-label="Fechar" style="border:0;background:transparent;color:white;font-size:23px;cursor:pointer">×</button></div><div style="padding:18px 22px 0"><div style="display:flex;align-items:center;gap:15px;padding:10px 0;border-bottom:1px solid #dbe5f1"><strong style="min-width:54px;text-align:center;background:#eaf2ff;border:1px solid #bfd6ff;border-radius:5px;padding:8px;color:#103d76">F1</strong><span>Abrir esta janela de atalhos</span></div><div style="display:flex;align-items:center;gap:15px;padding:10px 0"><strong style="min-width:54px;text-align:center;background:#eaf2ff;border:1px solid #bfd6ff;border-radius:5px;padding:8px;color:#103d76">F12</strong><span>Localizar funcionário por código</span></div></div><div style="border-top:1px solid #dbe5f1;margin-top:10px;padding:12px 20px;display:flex;justify-content:flex-end"><button type="button" id="ll-shortcut-close" style="background:#1e5797;color:white;border:0;border-radius:5px;padding:11px 21px;cursor:pointer;font-size:15px">FECHAR</button></div></section>`;document.body.append(d);$('ll-shortcut-close').onclick=()=>d.remove();$('ll-shortcut-x').onclick=()=>d.remove();d.onclick=e=>{if(e.target===d)d.remove()}};
 $('ll-back').onclick=()=>category('ADMINISTRATIVO');
}
// Navegação pelo identificador persistido da movimentação de RH.
window.LL_openRhMovement=function(m){
 const id=String(m.origemId||String(m.id||'').replace(/^RH-/,''));db=load();
 const ev=db.eventos.find(x=>String(x.id)===id);if(!ev)return false;
 const f=db.funcionarios.find(x=>String(x.id)===String(ev.funcionario));if(!f)return false;
 screenLancamentos();$('ll-code').value=f.id;$('ll-lookup').click();
 const type=['VALE','ADIANTAMENTO'].includes(ev.tipo)?'VALES / ADIANTAMENTOS':ev.tipo.startsWith('FALTA')?'FALTAS / ATESTADOS':'ADICIONAIS / DESCONTOS';
 const card=[...document.querySelectorAll('.ll-card')].find(x=>x.dataset.tab===type);if(!card)return false;card.click();
 const edit=[...document.querySelectorAll('#rh-tab-body [data-edit]')].find(x=>String(x.dataset.edit)===id);if(!edit)return false;edit.click();
 const back=document.createElement('button');back.type='button';back.className='action-button blue';back.textContent='← VOLTAR AO EXTRATO BANCÁRIO';back.onclick=()=>open('FINANCEIRO');
 document.querySelector('#rh-tab-body .rh-actions')?.append(back);return true;
};
const previousOpen=open;open=function(name){if(name==='FUNCIONÁRIOS')return screenEmployee();if(name==='LANÇAMENTOS DE FUNCIONÁRIOS')return screenLancamentos();if(name==='FOLHA DE PAGAMENTO')return screenPayroll();return previousOpen(name)};
document.addEventListener('keydown',ev=>{if(!['FUNCIONÁRIOS','LANÇAMENTOS DE FUNCIONÁRIOS','FOLHA DE PAGAMENTO'].includes(screen)||document.querySelector('.rh-overlay')||document.querySelector('.erp-modal-overlay')||document.querySelector('.ax-overlay'))return;if(screen==='FOLHA DE PAGAMENTO'&&['F1','F5','F12'].includes(ev.key)){ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat){const frame=document.querySelector('iframe[src="folha-pagamento/index.html"]');frame?.contentWindow?.postMessage({type:'LL_FOLHA_ATALHO',key:ev.key},'*')}return;}const map=screen==='FUNCIONÁRIOS'?{'F1':'rh-shortcuts','F12':'rh-lookup'}:screen==='LANÇAMENTOS DE FUNCIONÁRIOS'?{'F1':'ll-shortcuts','F12':'ll-f12'}:{'F1':'rh-return'};if(!map[ev.key])return;ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat){if(screen==='FUNCIONÁRIOS'&&ev.key==='F12')lookup();else $(map[ev.key])?.click()}},true);
})();

// Consulta em janela própria, sem destruir a pesquisa ou criar novos lançamentos.
window.LL_abrirPagamentoConsulta=function(reg){
 if(document.getElementById('ll-consulta-pagamento'))return;
 const paths={'FOLHA DE PAGAMENTO':'folha-pagamento/index.html','FÉRIAS':'ferias/index.html','RESCISÃO':'rescisoes/index.html'};
 const path=paths[reg.origem];if(!path)return;
 const scroll=window.scrollY;
 const layer=document.createElement('div');layer.id='ll-consulta-pagamento';layer.style.cssText='position:fixed;inset:0;z-index:999990;background:#001c3a99;display:flex;justify-content:center;align-items:center;padding:15px;box-sizing:border-box';
 const panel=document.createElement('section');panel.style.cssText='width:min(1180px,98vw);height:94vh;background:white;border-radius:9px;overflow:hidden;display:flex;flex-direction:column';
 const header=document.createElement('header');header.style.cssText='background:#17447d;color:white;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;font-weight:bold';
 const caption=document.createElement('span');caption.textContent=reg.origem+' — Nº '+reg.documentoNumero+' — CONSULTA';
 const close=document.createElement('button');close.type='button';close.textContent='VOLTAR À PESQUISA';close.style.cssText='background:#eaf2ff;color:#17447d;border:1px solid #a9c8ed;padding:10px 15px;border-radius:5px;cursor:pointer;font-weight:bold';
 const frame=document.createElement('iframe');frame.src=path;frame.title='CONSULTA — '+reg.origem;frame.style.cssText='width:100%;flex:1;border:0';
 const done=()=>{window.removeEventListener('message',onMessage);layer.remove();window.scrollTo(0,scroll)};
 const onMessage=e=>{if(e.source===frame.contentWindow&&['LL_FOLHA_VOLTAR_ADMINISTRATIVO','LL_FERIAS_VOLTAR_ADMINISTRATIVO','LL_RESCISOES_VOLTAR_ADMINISTRATIVO'].includes(e.data?.type)){e.stopImmediatePropagation();done()}};
 window.addEventListener('message',onMessage,true);close.onclick=done;
 frame.addEventListener('load',()=>frame.contentWindow.postMessage({type:'LL_PAGAMENTO_CONSULTA',numero:reg.documentoNumero,funcionarioId:reg.funcionarioId},'*'));
 header.append(caption,close);panel.append(header,frame);layer.append(panel);document.body.append(layer);
};
