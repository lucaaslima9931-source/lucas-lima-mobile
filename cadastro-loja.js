(()=>{'use strict';
const KEY='erp_systems_dados_loja_v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
let draft={...saved};
const rows=[[['codigo','CÓDIGO'],['ident','IDENTIFICAÇÃO'],['nome','NOME FANTASIA *']],[['razao','RAZÃO SOCIAL'],['cnpj','CPF / CNPJ'],['ie','INSCRIÇÃO ESTADUAL']],[['rua','ENDEREÇO'],['numero','NÚMERO'],['bairro','BAIRRO']],[['cidade','CIDADE'],['uf','ESTADO (UF)'],['cep','CEP']],[['telefone','TELEFONE / WHATSAPP'],['email','E-MAIL'],['usuario','USUÁRIO']]];
const css=`<style id="ls-loja-style">.ls-loja{max-width:1400px;margin:6px auto;background:white;border:1px solid #c7daf1;border-radius:10px;padding:10px;color:#093c78;font:13px Arial,sans-serif}.ls-loja *{box-sizing:border-box}.ls-loja .ls-head{background:#123f78;color:white;padding:10px 14px;border-radius:7px;display:flex;justify-content:space-between;align-items:center;gap:12px}.ls-loja .ls-head h1{font-size:19px;margin:0}.ls-loja .ls-shortcut{background:#195399;border:1px solid #9ec5f4;color:#fff;padding:7px 12px;border-radius:6px;font-weight:bold;cursor:pointer}.ls-loja .ls-sub{background:#e6f0fc;padding:7px 10px;font-weight:bold;margin:8px 0}.ls-loja .ls-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px 11px}.ls-loja label{display:flex;flex-direction:column;gap:3px;font-weight:bold}.ls-loja input:not([type=file]),.ls-loja textarea{width:100%;padding:7px 9px;border:1px solid #b9d1ef;border-radius:5px;color:#123f78;font:inherit}.ls-loja input:disabled,.ls-loja input:read-only{background:#e8eef6}.ls-loja input[data-ls-loja="usuario"]{cursor:pointer;text-decoration:underline;text-underline-offset:2px}.ls-loja .ls-images{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ls-loja .ls-img{position:relative;border:1px solid #d3e2f3;border-radius:6px;padding:8px}.ls-loja .ls-img img{display:block;max-width:100%;height:60px;object-fit:contain;margin:10px auto}.ls-loja .ls-actions{display:flex;gap:8px;margin-top:8px}.ls-loja .ls-actions button{flex:1;color:white;border:0;border-radius:6px;padding:9px;font-weight:bold;cursor:pointer}.ls-loja .ls-actions button:nth-child(1){background:#1357b6}.ls-loja .ls-actions button:nth-child(2){background:#079354}.ls-loja .ls-actions button:nth-child(3){background:#d64550}.ls-loja .ls-actions button:nth-child(4){background:#64748b}.ls-loja .ls-actions button:nth-child(5){background:#d72238}.ls-loja .ls-pick{background:#1159b2;color:#fff;border:0;padding:6px 9px;font-size:10px;line-height:1.15;white-space:nowrap;border-radius:5px;cursor:pointer;vertical-align:middle}.ls-loja .ls-img input[type=file]{max-width:calc(100% - 165px);font-size:11px}.ls-loja .ls-file-row{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}.ls-loja .ls-file-row input[type=file]{flex:1;min-width:0;max-width:none}.ls-loja .ls-file-row .ls-pick{flex:none;margin-left:auto}@media(max-width:1100px){.ls-loja .ls-file-row{flex-wrap:wrap}.ls-loja .ls-file-row .ls-pick{margin-left:auto}}.ls-loja .ls-note{color:#65798c;font-size:12px}.ls-loja #ls-loja-msg{font-weight:bold;min-height:18px}@media(max-width:750px){.ls-loja .ls-grid{grid-template-columns:1fr}.ls-loja .ls-images{grid-template-columns:1fr}.ls-loja .ls-actions{flex-wrap:wrap}.ls-loja .ls-actions button{min-width:110px}}
/* Ajuste vertical para notebooks e monitores com altura de 768px. */
@media (min-width:751px) and (max-height:900px){
.ls-loja{margin:2px auto!important;padding:5px 9px!important;font-size:11px!important;line-height:1.12!important}
.ls-loja .ls-head{padding:5px 9px!important;min-height:29px!important}
.ls-loja .ls-head h1{font-size:15px!important}
.ls-loja .ls-shortcut{padding:4px 8px!important;font-size:10px!important}
.ls-loja .ls-sub{padding:4px 8px!important;margin:4px 0!important;font-size:11px!important}
.ls-loja .ls-grid{gap:3px 9px!important}
.ls-loja label{gap:1px!important;font-size:10px!important}
.ls-loja input:not([type=file]){height:27px!important;min-height:27px!important;padding:3px 7px!important;font-size:11px!important}
.ls-loja .ls-images{gap:8px!important}
.ls-loja .ls-img{padding:5px 7px!important;min-height:95px!important}
.ls-loja .ls-img b{font-size:11px!important}
.ls-loja .ls-img .ls-note{font-size:9px!important;margin:2px 0 4px!important}
.ls-loja .ls-file-row{gap:4px!important}
.ls-loja .ls-img input[type=file]{font-size:9px!important}
.ls-loja .ls-img img{height:38px!important;margin:2px auto!important}
.ls-loja .ls-pick{padding:4px 6px!important;font-size:9px!important}
.ls-loja label[style*="margin-top"]{margin-top:3px!important}
.ls-loja #ls-loja-obs{height:30px!important;min-height:30px!important;padding:4px 7px!important;font-size:11px!important;resize:none!important}
.ls-loja .ls-actions{margin-top:4px!important;gap:7px!important}
.ls-loja .ls-actions button{padding:6px!important;font-size:11px!important;min-height:27px!important}
.ls-loja #ls-loja-msg{min-height:0!important;margin:3px 0!important;font-size:10px!important}
.ls-loja > .ls-note{margin:2px 0!important;font-size:9px!important}
}
</style>`;

/* O formulário se ajusta ao espaço REAL disponível na janela do Chrome. */
function ajustarCadastroNaTela(){
 const sec=document.querySelector('.ls-loja');
 if(!sec||window.screen!=='CADASTRO DA LOJA')return;
 if(window.innerWidth<751){sec.style.zoom='';sec.style.width='';return;}
 sec.style.zoom='1';sec.style.width='';
 const area=sec.parentElement;
 const topo=sec.getBoundingClientRect().top;
 const livre=Math.max(250,window.innerHeight-topo-7);
 const altura=sec.scrollHeight;
 const fator=Math.min(1,livre/Math.max(altura,1));
 // A largura é compensada para não encolher as três colunas.
 if(fator<0.999){
   sec.style.zoom=String(fator);
   sec.style.width=(Math.floor(area.clientWidth/fator)-2)+'px';
   sec.style.maxWidth='none';
 }else{
   sec.style.zoom='1';sec.style.width='';sec.style.maxWidth='';
 }
}
window.addEventListener('resize',()=>requestAnimationFrame(ajustarCadastroNaTela));

function userName(){try{const session=JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'null');return session?.nome?.trim()||null}catch{return null}}
function field(k,label){let disabled=k==='codigo'||k==='ident';let readonly=k==='usuario';let val=k==='codigo'?'1':k==='ident'?'MATRIZ':k==='usuario'?(draft.usuario||draft.alteradoPor||draft.criadoPor||''):draft[k]||'';return `<label>${label}<input data-ls-loja="${k}" value="${esc(val)}" ${disabled?'disabled':readonly?'readonly title="Clique para consultar o histórico"':''} maxlength="150"></label>`}
function changes(before,after){const ignore=new Set(['usuario','alteradoPor','alteradoEm','criadoPor','criadoEm','historicoOperacoes']);return [...new Set([...Object.keys(before||{}),...Object.keys(after||{})])].filter(k=>!ignore.has(k)&&JSON.stringify(before?.[k]??'')!==JSON.stringify(after?.[k]??'')).map(k=>({campo:k,anterior:['logo','fundoLogin'].includes(k)?(before?.[k]?'[IMAGEM]':''):before?.[k]??'',novo:['logo','fundoLogin'].includes(k)?(after?.[k]?'[IMAGEM]':''):after?.[k]??''}));}
function storeComparable(obj){const ignored=new Set(['usuario','alteradoPor','alteradoEm','criadoPor','criadoEm','historicoOperacoes']);return JSON.stringify(Object.keys(obj||{}).filter(k=>!ignored.has(k)).sort().map(k=>[k,obj[k]]))}
function notify(t,error=false){const el=document.getElementById('ls-loja-msg');if(el){el.textContent=t;el.style.color=error?'#c21b30':'#168347'}}
const lojaDigits=v=>String(v||'').replace(/\D/g,'');
function lojaFormat(k,v){
 const n=lojaDigits(v);
 if(k==='cep'){const d=n.slice(0,8);return d.length>5?d.slice(0,5)+'-'+d.slice(5):d}
 if(k==='cnpj'){
  const d=n.slice(0,14);
  if(d.length<=11)return d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  return d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');
 }
 if(k==='telefone'){
  const d=n.slice(0,11);if(d.length<=2)return d.length?'('+d:'';
  const ddd='('+d.slice(0,2)+') ',rest=d.slice(2),split=d.length===11?5:4;
  return ddd+rest.slice(0,split)+(rest.length>split?'-'+rest.slice(split):'');
 }
 return String(v||'').toLocaleUpperCase('pt-BR');
}
function lojaFormatExisting(){
 for(const k of ['cnpj','telefone','cep','email']){const el=document.querySelector('[data-ls-loja="'+k+'"]');if(el)el.value=lojaFormat(k,el.value)}
}
let lojaCepRequest=0;
async function lojaBuscarCep(cep){
 const token=++lojaCepRequest;
 if(cep.length!==8)return;
 try{
  const response=await fetch('https://viacep.com.br/ws/'+cep+'/json/');
  if(!response.ok)throw new Error('CEP indisponível');
  const data=await response.json();if(data.erro||token!==lojaCepRequest)return;
  const cepEl=document.querySelector('[data-ls-loja="cep"]');if(!cepEl||lojaDigits(cepEl.value)!==cep)return;
  const mapping={rua:data.logradouro,bairro:data.bairro,cidade:data.localidade,uf:data.uf};
  for(const [key,val] of Object.entries(mapping)){
   const el=document.querySelector('[data-ls-loja="'+key+'"]');
   if(el&&val&&(!el.value.trim()||el.dataset.cepAutofill==='1')){el.value=String(val).toLocaleUpperCase('pt-BR');el.dataset.cepAutofill='1'}
  }
 }catch{/* Sem internet ou CEP desconhecido: preenchimento manual permanece liberado. */}
}
function lojaInstalarMascaras(){
 lojaFormatExisting();
 for(const el of document.querySelectorAll('[data-ls-loja]:not(:disabled):not([readonly])')){
  const key=el.dataset.lsLoja;
  el.addEventListener('input',()=>{
   if(key==='cep'){
    const digits=lojaDigits(el.value);el.value=lojaFormat(key,el.value);
    ++lojaCepRequest;
    if(digits.length===8)lojaBuscarCep(digits);
   }else el.value=lojaFormat(key,el.value);
   if(['rua','bairro','cidade','uf'].includes(key))delete el.dataset.cepAutofill;
  });
 }
}
function sync(){document.querySelectorAll('[data-ls-loja]:not(:disabled)').forEach(el=>draft[el.dataset.lsLoja]=el.value.trim());draft.obs=document.getElementById('ls-loja-obs')?.value||''}
function show(){screen='CADASTRO DA LOJA';window.screen='CADASTRO DA LOJA';try{active('CADASTROS')}catch{};draft={...saved};root().innerHTML=css+`<section class="ls-loja"><div class="ls-head"><h1>▣ CADASTRO DA LOJA</h1></div><div class="ls-sub">DADOS DA LOJA</div><div class="ls-grid">${rows.flat().map(([k,l])=>field(k,l)).join('')}</div><div class="ls-sub">IMAGENS DO SISTEMA</div><div class="ls-images"><div class="ls-img"><b>LOGOMARCA DA LOJA</b><p class="ls-note">Usada no sistema e nas impressões.</p><div class="ls-file-row"><input id="ls-logo-file" type="file" accept="image/png,image/jpeg,image/webp"><button class="ls-pick" id="ls-logo-remove">REMOVER LOGOMARCA</button></div><img id="ls-logo-preview" src="${esc(draft.logo||'')}" style="${draft.logo?'':'display:none'}"></div><div class="ls-img"><b>IMAGEM DE FUNDO DO LOGIN</b><p class="ls-note">Aparecerá na tela de acesso ao sistema.</p><div class="ls-file-row"><input id="ls-fundo-file" type="file" accept="image/png,image/jpeg,image/webp"><button class="ls-pick" id="ls-fundo-remove">REMOVER FOTO DE FUNDO</button></div><img id="ls-fundo-preview" src="${esc(draft.fundoLogin||'')}" style="${draft.fundoLogin?'':'display:none'}"></div></div><label style="margin-top:7px">OBSERVAÇÕES<textarea id="ls-loja-obs" rows="2">${esc(draft.obs||'')}</textarea></label><div class="ls-actions"><button id="ls-loja-save">GRAVAR</button><button id="ls-loja-edit">ALTERAR</button><button id="ls-loja-back">VOLTAR</button></div><p id="ls-loja-msg" role="status"></p><p class="ls-note">Nesta versão de testes, os dados são armazenados neste navegador. A loja 1 – MATRIZ é a única loja cadastrada.</p></section>`;
 lojaInstalarMascaras();
 // Elimina controles repetidos inseridos por integrações antigas, mantendo os originais.
 const cleanDuplicates=()=>{
   const section=document.querySelector('.ls-loja');if(!section)return;
   const head=section.querySelector('.ls-head');
   if(head){
     // Preserve exclusively the page title and the original right-side shortcut button.
     [...head.children].forEach(el=>{if(el.tagName!=='H1')el.remove()});
   }
   const correct=section.querySelector('.ls-grid [data-ls-loja="usuario"]');
   // No user field may be injected outside the three-column form grid.
   const app=document.querySelector('#app');
   app?.querySelectorAll('.pc-userline,[data-user-audit],.vt-user-field,.erp-user-next-to-field').forEach(el=>{if(!el.contains(correct))el.remove()});
   section.querySelectorAll('label,.pc-userline,[data-user-audit],.vt-user-field,.erp-user-next-to-field').forEach(el=>{
     if(el.contains(correct))return;
     const own=(el.childNodes[0]?.textContent||'').trim().toUpperCase();
     if(/^USUÁRIO\b/.test(own)||el.matches('.pc-userline,[data-user-audit],.vt-user-field,.erp-user-next-to-field')&&/USUÁRIO/i.test(el.textContent))el.remove();
   });
 };
 cleanDuplicates();
 requestAnimationFrame(()=>requestAnimationFrame(ajustarCadastroNaTela));
 if(window.__lucasLojaObserver)window.__lucasLojaObserver.disconnect();
 let cleaning=false;
 window.__lucasLojaObserver=new MutationObserver(()=>{if(cleaning)return;cleaning=true;try{cleanDuplicates()}finally{cleaning=false}});
 window.__lucasLojaObserver.observe(root(),{childList:true,subtree:true});
 const userField=document.querySelector('[data-ls-loja="usuario"]');
 if(userField){
  userField.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showHistory()});
  userField.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showHistory()}});
 }

 document.getElementById('ls-loja-back').onclick=()=>{screen='CADASTROS';window.screen='CADASTROS';category('CADASTROS');};

 const save=()=>{sync();if(!draft.nome){notify('Informe o nome fantasia da loja.',true);document.querySelector('[data-ls-loja="nome"]').focus();return}try{const changed=storeComparable(saved)!==storeComparable(draft);if(changed){const who=userName();if(!who){notify('Entre com seu usuário para registrar alterações.',true);return}const now=new Date().toISOString();const hist=Array.isArray(saved.historicoOperacoes)?saved.historicoOperacoes.slice(-99):[];hist.push({acao:saved.criadoPor?'ALTERAÇÃO':'CADASTRO',usuario:who,data:now,alteracoes:changes(saved,draft)});draft={...draft,usuario:who,alteradoPor:who,alteradoEm:now,criadoPor:saved.criadoPor||who,criadoEm:saved.criadoEm||now,historicoOperacoes:hist};localStorage.setItem(KEY,JSON.stringify(draft));saved={...draft};const field=document.querySelector('[data-ls-loja="usuario"]');if(field)field.value=who;}window.dispatchEvent(new CustomEvent('lucas-loja-atualizada',{detail:{nome:saved.nome}}));notify(changed?'Cadastro da loja gravado com sucesso.':'Nenhuma alteração realizada; usuário preservado.')}catch{notify('Não foi possível gravar. Reduza o tamanho das imagens.',true)}};
 document.getElementById('ls-loja-save').onclick=save;document.getElementById('ls-loja-edit').onclick=save;

 for(const [kind,key,preview,max] of [['logo','logo','ls-logo-preview',15000000],['fundo','fundoLogin','ls-fundo-preview',15000000]]){
  document.getElementById('ls-'+kind+'-remove').onclick=()=>{draft[key]='';document.getElementById(preview).style.display='none';notify('Imagem retirada do formulário. Clique em GRAVAR para salvar.')};
  document.getElementById('ls-'+kind+'-file').onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>max){notify('Escolha uma imagem PNG, JPG ou WEBP de até 15 MB.',true);return}const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const c=document.createElement('canvas');const scale=Math.min(1,(kind==='logo'?500:1200)/img.width,(kind==='logo'?400:750)/img.height);c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);draft[key]=kind==='logo'?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.58);const p=document.getElementById(preview);p.src=draft[key];p.style.display='block';URL.revokeObjectURL(url);requestAnimationFrame(ajustarCadastroNaTela);notify('Imagem selecionada. Clique em GRAVAR para salvar.')};img.onerror=()=>{URL.revokeObjectURL(url);notify('Não foi possível abrir a imagem.',true)};img.src=url}
 }
}
function showHistory(){
 const events=Array.isArray(saved.historicoOperacoes)?saved.historicoOperacoes:[];
 const labels=Object.fromEntries(rows.flat().concat([['obs','OBSERVAÇÕES'],['logo','LOGOMARCA'],['fundoLogin','IMAGEM DE FUNDO']]));
 const safeValue=(v,k)=>k==='logo'||k==='fundoLogin'?'[IMAGEM]':typeof v==='object'?JSON.stringify(v):String(v??'');
 const entries=events.length?events.slice().reverse().map((event,i)=>{
  const dt=event.data?new Date(event.data):null;
  const time=dt&&!Number.isNaN(dt.getTime())?dt.toLocaleString('pt-BR'):esc(event.data||'');
  const diffs=Array.isArray(event.alteracoes)?event.alteracoes:[];
  const detail=diffs.length?diffs.map(x=>`<div style="margin:6px 0;font-size:12px"><b>${esc(labels[x.campo]||x.campo)}</b>: ${esc(safeValue(x.anterior,x.campo))} → ${esc(safeValue(x.novo,x.campo))}</div>`).join(''):'<div style="font-size:12px;color:#60738c;margin-top:5px">Os detalhes desta operação não foram registrados na versão anterior.</div>';
  return `<div style="border-bottom:1px solid #dbe7f5;padding:11px 0"><b>${esc(event.acao||'ALTERAÇÃO')}</b> — ${esc(event.usuario||'NÃO INFORMADO')}<div style="color:#65798c;font-size:12px">${esc(time)}</div>${detail}</div>`;
 }).join(''):'<p style="color:#65798c">Não há histórico registrado para esta loja. As próximas alterações serão registradas automaticamente.</p>';
 const d=dialog('HISTÓRICO DE ALTERAÇÕES — CADASTRO DA LOJA',`<div style="max-height:55vh;overflow:auto"><p><b>ÚLTIMO USUÁRIO:</b> ${esc(saved.usuario||saved.alteradoPor||saved.criadoPor||'NÃO INFORMADO')}</p>${entries}</div><div style="display:flex;justify-content:flex-end;margin-top:15px"><button id="ls-history-close" style="background:#1357a6;color:white;border:0;border-radius:5px;padding:10px 18px;cursor:pointer">FECHAR</button></div>`);
 const close=()=>{d.remove();document.removeEventListener('keydown',onKey,true)};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};
 document.addEventListener('keydown',onKey,true);
 d.querySelector('#ls-history-close').onclick=close;
 d.addEventListener('click',e=>{if(e.target===d)close()});
}
function dialog(title,content){document.getElementById('ls-loja-modal')?.remove();const overlay=document.createElement('div');overlay.id='ls-loja-modal';overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#001b3aa8;display:grid;place-items:center;padding:15px';overlay.innerHTML=`<div role="dialog" aria-modal="true" style="width:min(440px,100%);background:white;border-radius:12px;overflow:hidden;box-shadow:0 16px 60px #001a3a80;font:14px Arial"><div style="background:#103e78;color:white;padding:17px;font-weight:bold">${title}</div><div style="padding:20px">${content}</div></div>`;document.body.append(overlay);return overlay}
function locate(){const d=dialog('LOCALIZAR LOJA — F12',`<label style="display:block;color:#123f78;font-weight:bold">DIGITE O CÓDIGO DA LOJA<input id="ls-code" type="text" inputmode="numeric" autocomplete="off" style="display:block;width:100%;padding:12px;margin-top:9px;border:1px solid #b9d1ef;border-radius:5px"></label><p id="ls-code-error" style="color:#b91c1c;min-height:17px"></p><div style="display:flex;justify-content:flex-end;gap:10px"><button id="ls-code-cancel" style="padding:10px">CANCELAR</button><button id="ls-code-ok" style="padding:10px;background:#1456a0;color:white;border:0;border-radius:5px">CONFIRMAR</button></div>`);const close=()=>{d.remove();document.removeEventListener('keydown',keys,true)};const ok=()=>{if(document.getElementById('ls-code').value.trim()!=='1'){document.getElementById('ls-code-error').textContent='Código não encontrado. Nesta versão, a loja cadastrada é 1 – MATRIZ.';return}close();show();notify('Loja 1 – MATRIZ localizada.')};const keys=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();ok()}};document.addEventListener('keydown',keys,true);document.getElementById('ls-code-cancel').onclick=close;document.getElementById('ls-code-ok').onclick=ok;d.addEventListener('click',e=>{if(e.target===d)close()});document.getElementById('ls-code').focus()}
function shortcuts(){const d=dialog('⌂ ATALHOS — CADASTRO DA LOJA',`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #dbe7f6;border-radius:6px"><b>Localizar loja pelo código</b><kbd style="background:#e8f1fb;padding:6px 12px">F12</kbd></div><p style="color:#667">F1 abre esta janela. Esc fecha.</p><div style="text-align:right"><button id="ls-short-close" style="padding:10px 20px">FECHAR</button></div>`);const close=()=>{d.remove();document.removeEventListener('keydown',keys,true)};const keys=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};document.addEventListener('keydown',keys,true);document.getElementById('ls-short-close').onclick=close;d.addEventListener('click',e=>{if(e.target===d)close()})}
const original=window.open;window.open=function(name){if(name==='CADASTRO DA LOJA')return show();return original.apply(this,arguments)};
document.addEventListener('keydown',e=>{if(window.screen!=='CADASTRO DA LOJA'||document.getElementById('erp-demo-gate'))return;if(document.getElementById('ls-loja-modal'))return;if(e.key==='F1'||e.key==='F12'){e.preventDefault();e.stopImmediatePropagation()}},true);
function printHead(){let o;try{o=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return}if(!o?.nome)return;const x=document.createElement('div');x.id='erp-loja-print-head';x.innerHTML=`${o.logo?`<img src="${o.logo}" style="max-height:65px;max-width:170px;display:block;margin:auto">`:''}<strong>${esc(o.nome)}</strong><div>${esc([o.razao,o.cnpj].filter(Boolean).join(' · '))}</div><div>${esc([o.rua,o.numero,o.bairro,o.cidade,o.uf,o.cep].filter(Boolean).join(' · '))}</div><div>${esc([o.telefone,o.email].filter(Boolean).join(' · '))}</div>`;x.style.cssText='display:none;text-align:center;padding:10px;font:12px Arial';document.body.prepend(x);const st=document.createElement('style');st.id='ls-print-style';st.textContent='@media print{#erp-loja-print-head{display:block!important;color:black!important;background:white!important}}';document.head.append(st)}
window.addEventListener('beforeprint',printHead);window.addEventListener('afterprint',()=>{document.getElementById('erp-loja-print-head')?.remove();document.getElementById('ls-print-style')?.remove()});
})();
