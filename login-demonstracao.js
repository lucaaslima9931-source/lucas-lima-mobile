/* LUCAS LIMA — login visual de demonstração. NÃO oferece autenticação segura. */
(()=>{'use strict';
const SESSION='erp_systems_demo_session',LOJA='erp_systems_dados_loja_v1',USERS='erp_matriz_usuarios_v1',INITIALIZED='ll_users_configured_v797';
const registeredUsers=()=>{const db=read(USERS);return Array.isArray(db.usuarios)?db.usuarios:[]};
const isConfigured=()=>{
 const users=registeredUsers();
 if(users.length){try{localStorage.setItem(INITIALIZED,'1')}catch{};return true}
 return localStorage.getItem(INITIALIZED)==='1';
};
const validSession=(session)=>{
 if(!session?.id)return false;
 const u=registeredUsers().find(x=>String(x.id)===String(session.id));
 return !!u&&String(u.situacao||'ATIVO').toUpperCase()==='ATIVO';
};

const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k){try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{return {}}}
const style=`<style id="ls-login-css">
#ls-login-gate{position:fixed;inset:0;z-index:2147483640;font:15px Arial,sans-serif;background:linear-gradient(110deg,#071d3e,#0b4d8b);display:flex;align-items:center;justify-content:center;overflow:auto;color:#102d54}
#ls-login-gate *{box-sizing:border-box}
#ls-login-gate .ls-photo{position:absolute;inset:0;background-position:center;background-size:cover;filter:brightness(.58);opacity:.85}
#ls-login-gate .ls-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,24,59,.92),rgba(5,35,77,.52) 54%,rgba(4,30,68,.25))}
#ls-login-gate .ls-wrap{position:relative;z-index:1;width:min(1150px,95vw);display:grid;grid-template-columns:1fr minmax(330px,490px);align-items:center;gap:45px;padding:35px 0}
#ls-login-gate .ls-brand{color:white;text-shadow:0 3px 15px #001a38}
#ls-login-gate .ls-logo{max-width:155px;max-height:145px;object-fit:contain;margin-bottom:25px}
#ls-login-gate .ls-brand h1{font-size:clamp(42px,5vw,70px);margin:0;font-weight:800;letter-spacing:-2px}
#ls-login-gate .ls-brand p{letter-spacing:3px;font-size:14px;margin:5px 0 30px}
#ls-login-gate .ls-features{display:flex;flex-wrap:wrap;gap:18px;font-size:12px;font-weight:bold;opacity:.92}
#ls-login-gate .ls-feature{padding:9px 11px;border:1px solid #ffffff44;border-radius:12px;background:#ffffff12}
#ls-login-gate .ls-panel{padding:34px 37px;border-radius:25px;background:linear-gradient(145deg,rgba(255,255,255,.94),rgba(223,235,253,.92));box-shadow:0 24px 75px #00133199;border:1px solid #ffffffcc;backdrop-filter:blur(18px)}
#ls-login-gate .ls-panel h2{font-size:19px;font-weight:500;text-align:center;margin:0}
#ls-login-gate .ls-panel h3{font-size:34px;text-align:center;margin:4px 0;color:#0861c9;letter-spacing:-1px}
#ls-login-gate .ls-sub{text-align:center;letter-spacing:2px;font-size:11px;margin:0 0 22px;color:#43617e}
#ls-login-gate .ls-store{text-align:center;font-weight:bold;margin-bottom:22px}
#ls-login-gate label{font-weight:700;display:block;margin:14px 0 7px;font-size:13px}
#ls-login-gate input{width:100%;padding:13px;border:1px solid #c5d5ea;border-radius:8px;font:16px Arial,sans-serif;background:white;color:#132b4c}
#ls-login-gate input:focus{outline:2px solid #2a81e6}
#ls-login-gate .ls-person{display:flex;align-items:center;gap:13px;background:#dce8f7;border:1px solid #c6d8ee;border-radius:10px;padding:13px;margin-top:10px;min-height:72px}
#ls-login-gate .ls-avatar{border-radius:50%;background:#8aa7c8;padding:10px;font-size:20px;color:white}
#ls-login-gate .ls-person strong{display:block;font-size:17px}
#ls-login-gate .ls-person small{color:#54708d}
#ls-login-gate .ls-pass-wrap{display:flex;position:relative}
#ls-login-gate .ls-pass-wrap input{padding-right:58px}
#ls-login-gate .ls-eye{position:absolute;right:4px;top:4px;width:43px;height:38px;background:transparent;border:0;cursor:pointer;font-size:19px;color:#2a578c}
#ls-login-gate .ls-submit{width:100%;margin-top:18px;border:0;border-radius:10px;padding:16px;background:linear-gradient(110deg,#0756d9,#0874e5);color:white;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 8px 15px #0b65b03b}
#ls-login-gate .ls-close{display:block;width:100%;margin-top:10px;border:1px solid #b3c7e0;border-radius:10px;padding:13px;background:#f5f8fe;color:#194d83;font-weight:800;font-size:14px;cursor:pointer}
#ls-login-gate .ls-close:hover{background:#e4eefb}
#ls-login-gate .ls-close-help{font-size:12px;color:#8a421b;background:#fff4e8;border:1px solid #f0d5b6;border-radius:7px;padding:10px;margin-top:10px;display:none}
#ls-login-gate .ls-error{color:#b32525;min-height:19px;font-weight:bold;font-size:12px}
#ls-login-gate .ls-foot{display:flex;justify-content:space-around;border-top:1px solid #bed0e4;margin-top:25px;padding-top:18px;color:#37618b;font-size:11px;font-weight:bold}
#ls-login-gate .ls-warning{font-size:11px;line-height:1.5;color:#61768a;margin-top:15px}
@media(max-width:820px){#ls-login-gate .ls-wrap{grid-template-columns:1fr;width:min(490px,92vw);gap:20px;padding:22px 0}#ls-login-gate .ls-brand{text-align:center}#ls-login-gate .ls-brand h1{font-size:36px}#ls-login-gate .ls-brand p{font-size:10px;margin-bottom:10px}#ls-login-gate .ls-features{display:none}#ls-login-gate .ls-logo{max-height:75px;margin-bottom:0}#ls-login-gate .ls-panel{padding:25px}}

/* V794: login cabe na altura da janela, com fundo integral. */
html:has(#ls-login-gate),body:has(#ls-login-gate){overflow:hidden!important}
#ls-login-gate{height:100dvh;max-height:100dvh;overflow:hidden;background:#071d3e}
#ls-login-gate .ls-photo{position:absolute;inset:0;background-size:cover;background-position:center center}
#ls-login-gate .ls-wrap{width:min(1150px,95vw);height:100%;min-height:0;max-height:100%;padding:12px 0;gap:clamp(16px,3vw,45px);grid-template-columns:minmax(0,1fr) minmax(320px,455px);align-items:center}
#ls-login-gate .ls-panel{padding:clamp(12px,2vh,22px) 28px;max-height:calc(100dvh - 24px);overflow-y:auto;scrollbar-width:thin;border-radius:20px}
#ls-login-gate .ls-panel h2{font-size:17px}
#ls-login-gate .ls-panel h3{font-size:30px;margin:1px 0}
#ls-login-gate .ls-sub{margin:0 0 12px}
#ls-login-gate .ls-store{margin-bottom:12px}
#ls-login-gate label{margin:9px 0 5px}
#ls-login-gate input{padding:10px 12px}
#ls-login-gate .ls-person{padding:9px;min-height:58px;margin-top:7px}
#ls-login-gate .ls-avatar{padding:7px}
#ls-login-gate .ls-person strong{font-size:15px}
#ls-login-gate .ls-error{min-height:14px;margin:5px 0}
#ls-login-gate .ls-submit{padding:12px;margin-top:8px}
#ls-login-gate .ls-close{padding:10px;margin-top:8px}
#ls-login-gate .ls-foot{margin-top:12px;padding-top:10px}
#ls-login-gate .ls-warning{font-size:10px;line-height:1.3;margin:9px 0 0}
#ls-login-gate .ls-logo{max-height:105px;margin-bottom:14px}
#ls-login-gate .ls-brand h1{font-size:clamp(38px,4.6vw,64px)}
#ls-login-gate .ls-brand p{margin:4px 0 18px}
@media(max-height:750px) and (min-width:821px){
 #ls-login-gate .ls-panel{padding:11px 24px}
 #ls-login-gate .ls-panel h2{font-size:15px}
 #ls-login-gate .ls-panel h3{font-size:27px}
 #ls-login-gate .ls-sub{margin-bottom:7px}
 #ls-login-gate .ls-store{margin-bottom:7px}
 #ls-login-gate label{margin:6px 0 4px}
 #ls-login-gate input{padding:8px 10px}
 #ls-login-gate .ls-person{min-height:50px;padding:7px}
 #ls-login-gate .ls-submit{padding:10px;margin-top:5px}
 #ls-login-gate .ls-close{padding:8px;margin-top:6px}
 #ls-login-gate .ls-foot{margin-top:8px;padding-top:7px}
 #ls-login-gate .ls-warning{font-size:9px;margin-top:6px}
}
@media(max-width:820px){
 #ls-login-gate .ls-wrap{grid-template-columns:1fr;width:min(490px,94vw);gap:8px;padding:10px 0;overflow-y:auto;align-content:start}
 #ls-login-gate .ls-brand{text-align:center}
 #ls-login-gate .ls-brand h1{font-size:30px}
 #ls-login-gate .ls-logo{max-height:55px;margin-bottom:3px}
 #ls-login-gate .ls-brand p{margin-bottom:5px}
 #ls-login-gate .ls-features{display:none}
 #ls-login-gate .ls-panel{max-height:none;overflow:visible;padding:15px 20px}
}

/* V795: imagem de fundo cobre integralmente o login, sem bordas azuis. */
#ls-login-gate{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;overflow:hidden!important;isolation:isolate}
#ls-login-gate .ls-photo{position:absolute!important;inset:-4%!important;width:108%!important;height:108%!important;max-width:none!important;max-height:none!important;background-size:cover!important;background-position:50% 50%!important;background-repeat:no-repeat!important;transform:none!important}
#ls-login-gate .ls-shade{position:absolute!important;inset:0!important}
#ls-login-gate .ls-wrap{position:relative!important;z-index:1!important}

/* V796: login travado ao viewport, sem barra de rolagem nem margem. */
html:has(#ls-login-gate),body:has(#ls-login-gate){
 width:100%!important;height:100%!important;max-height:100%!important;
 margin:0!important;padding:0!important;overflow:hidden!important;
 overscroll-behavior:none!important;
}
#ls-login-gate{
 position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
 width:100%!important;height:100%!important;max-height:100%!important;
 overflow:hidden!important;margin:0!important;padding:0!important;
 display:flex!important;align-items:center!important;justify-content:center!important;
}
#ls-login-gate .ls-photo{
 position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
 background-size:cover!important;background-position:center center!important;
 background-repeat:no-repeat!important;
}
#ls-login-gate .ls-wrap{
 position:relative!important;width:min(1150px,94%)!important;height:100%!important;
 min-height:0!important;max-height:100%!important;padding:10px 0!important;
 overflow:hidden!important;align-items:center!important;
}
#ls-login-gate .ls-panel{
 max-height:calc(100% - 8px)!important;overflow:hidden!important;
 padding:clamp(8px,1.3vh,16px) 25px!important;
}
#ls-login-gate .ls-panel h2{font-size:clamp(13px,1.9vh,17px)!important}
#ls-login-gate .ls-panel h3{font-size:clamp(23px,3.3vh,30px)!important}
#ls-login-gate .ls-sub{margin-bottom:clamp(3px,.9vh,10px)!important}
#ls-login-gate .ls-store{margin-bottom:clamp(3px,.9vh,10px)!important}
#ls-login-gate label{margin:clamp(3px,.8vh,8px) 0 4px!important}
#ls-login-gate input{padding:clamp(6px,1.05vh,10px) 10px!important}
#ls-login-gate .ls-person{min-height:0!important;padding:clamp(5px,.9vh,9px)!important;margin-top:5px!important}
#ls-login-gate .ls-submit{padding:clamp(8px,1.2vh,12px)!important;margin-top:5px!important}
#ls-login-gate .ls-close{padding:clamp(7px,1vh,10px)!important;margin-top:5px!important}
#ls-login-gate .ls-foot{margin-top:clamp(5px,1vh,10px)!important;padding-top:clamp(5px,.9vh,9px)!important}
#ls-login-gate .ls-warning{font-size:9px!important;line-height:1.25!important;margin-top:5px!important}
#ls-login-gate .ls-logo{max-height:clamp(55px,13vh,105px)!important}
@media(max-width:820px){
 #ls-login-gate .ls-wrap{width:96%!important;grid-template-columns:1fr!important;gap:4px!important;align-content:center!important;overflow:hidden!important}
 #ls-login-gate .ls-brand h1{font-size:clamp(20px,4vh,30px)!important}
 #ls-login-gate .ls-brand p{margin-bottom:2px!important}
 #ls-login-gate .ls-logo{max-height:40px!important;margin-bottom:0!important}
 #ls-login-gate .ls-panel{padding:8px 15px!important}
}
@media(max-height:590px){
 #ls-login-gate .ls-warning{display:none!important}
 #ls-login-gate .ls-brand .ls-features{display:none!important}
 #ls-login-gate .ls-panel{padding:6px 18px!important}
}
</style>`;
async function verify(pass,u){if(!u.senhaHash)return false;return await window.LL_SHA256(u.senhaSalt+':'+pass)===u.senhaHash}
function lookup(code){
 const users=read(USERS).usuarios||[];
 const u=users.find(u=>String(Number(u.id))===String(Number(code))&&String(u.situacao||'ATIVO').toUpperCase()==='ATIVO');
 if(u)return {name:u.nome||u.login||'USUÁRIO',role:u.perfil||'USUÁRIO',id:String(u.id)};
 return null;
}
function welcomeNotification(name){
 const first=String(name||'USUÁRIO').trim().split(/\s+/)[0]||'USUÁRIO';
 const title='LUCAS LIMA';
 const body='Seja bem-vindo, '+first.toUpperCase()+', ao sistema de gestão empresarial!';
 // Somente notificação nativa do Windows. Não exibir toast dentro do sistema.
 document.getElementById('ll-welcome-toast-v799')?.remove();
 try{
   if(!('Notification' in window) || Notification.permission!=='granted')return;
   const nativeNotice=new Notification(title,{body,tag:'ll-boas-vindas',requireInteraction:false});
   nativeNotice.onerror=()=>console.warn('Notificação nativa indisponível');
 }catch(e){console.warn('Não foi possível enviar a notificação nativa:',e)}
}
function show(){
 if(document.getElementById('ls-login-gate'))return;
 document.documentElement.style.setProperty('overflow','hidden','important');
 document.body.style.setProperty('overflow','hidden','important');
 const loja=read(LOJA),logo=typeof loja.logo==='string'&&loja.logo.startsWith('data:image/')?loja.logo:'',photo=typeof loja.fundoLogin==='string'&&loja.fundoLogin.startsWith('data:image/')?loja.fundoLogin:'';
 document.body.insertAdjacentHTML('beforeend',style+`<div id="ls-login-gate" role="dialog" aria-modal="true" aria-label="Entrar no LUCAS LIMA"><div class="ls-photo"></div><div class="ls-shade"></div><div class="ls-wrap"><section class="ls-brand">${logo?'<img id="ls-company-logo" class="ls-logo" alt="Logomarca da loja">':'<div style="font-size:75px;margin-bottom:18px">▣</div>'}<h1>LUCAS LIMA</h1><p>SISTEMA DE GESTÃO EMPRESARIAL</p><div class="ls-features"><span class="ls-feature">▥ VENDAS</span><span class="ls-feature">▣ ESTOQUE</span><span class="ls-feature">▤ FINANCEIRO</span><span class="ls-feature">♙ CADASTROS</span><span class="ls-feature">⚙ RELATÓRIOS</span></div></section><form id="ls-login-form" class="ls-panel" autocomplete="off"><h2>BEM-VINDO AO</h2><h3>LUCAS LIMA</h3><p class="ls-sub">SISTEMA DE GESTÃO EMPRESARIAL</p><div class="ls-store">LOJA 01 – MATRIZ <div id="ls-store-business" style="font-size:15px;color:#14518b;margin-top:5px"></div></div><label for="ls-code">USUÁRIO (CÓDIGO)</label><input id="ls-code" inputmode="numeric" pattern="[0-9]+" placeholder="Digite seu código" required autocomplete="username"><div class="ls-person"><span class="ls-avatar">●</span><div><strong id="ls-name">Informe o código do usuário</strong><small id="ls-role">O nome aparecerá automaticamente</small></div></div><label for="ls-password">SENHA</label><div class="ls-pass-wrap"><input id="ls-password" type="password" required placeholder="Digite sua senha" autocomplete="current-password"><button class="ls-eye" id="ls-eye" type="button" aria-label="Mostrar senha">◉</button></div><p id="ls-error" class="ls-error" aria-live="polite"></p><button class="ls-submit" type="submit">↪ &nbsp; ENTRAR NO SISTEMA</button><button class="ls-close" id="ls-close-app" type="button">⏻ &nbsp; FECHAR O SISTEMA</button><p id="ls-close-help" class="ls-close-help" role="status">O Chrome não permite que esta aba seja fechada automaticamente. Feche a aba pelo X ou use Ctrl+W. Quando o LUCAS LIMA for um aplicativo instalado, o botão poderá encerrar a janela.</p><div class="ls-foot"><span>♙ USUÁRIOS</span><span>▤ GESTÃO</span></div><p class="ls-warning">Acesso disponível somente para usuários cadastrados e ativos. Este sistema utiliza armazenamento local e não substitui autenticação segura em servidor.</p></form></div></div>`);
 if(photo)document.querySelector('#ls-login-gate .ls-photo').style.backgroundImage=`url("${photo}")`;
 const business=document.getElementById('ls-store-business');if(business)business.textContent=loja.nome||'';
 if(logo)document.getElementById('ls-company-logo').src=logo;
 const code=document.getElementById('ls-code'),name=document.getElementById('ls-name'),role=document.getElementById('ls-role');
 const update=()=>{const u=lookup(code.value.trim());name.textContent=u?u.name:'Usuário não encontrado';role.textContent=u?u.role:'Confira o código informado'};
 code.addEventListener('input',update);
 document.getElementById('ls-close-app').onclick=()=>{window.close();document.getElementById('ls-close-help').style.display='block'};
 document.getElementById('ls-eye').onclick=()=>{const pass=document.getElementById('ls-password');pass.type=pass.type==='password'?'text':'password'};
 document.getElementById('ls-login-form').onsubmit=async e=>{e.preventDefault();const u=lookup(code.value.trim());const pass=document.getElementById('ls-password').value;
 // Permissão de notificação só pode ser solicitada em uma ação direta do usuário.
 if(u && 'Notification' in window && Notification.permission==='default'){try{Notification.requestPermission().catch(()=>{})}catch(e){}}
 const registered=(read(USERS).usuarios||[]).find(x=>String(x.id)===String(u?.id));const valid=registered?await verify(pass,registered):false;if(!u||!valid){document.getElementById('ls-error').textContent='Código ou senha incorretos.';const senhaCampo=document.getElementById('ls-password');senhaCampo.value='';senhaCampo.focus();return}
 sessionStorage.setItem(SESSION,JSON.stringify({id:u.id,nome:u.name,perfil:u.role}));document.querySelectorAll('.top-user strong').forEach(el=>el.textContent=u.name);document.getElementById('ls-login-gate').remove();document.getElementById('ls-login-css')?.remove();
 document.documentElement.style.removeProperty('overflow');
 document.body.style.removeProperty('overflow');
 try{if(typeof home==='function')home()}catch{};
 welcomeNotification(u.name);
 };
 code.focus();
}
window.lucasLimaSair=()=>{
 sessionStorage.removeItem(SESSION);
 document.querySelectorAll('.top-user strong').forEach(el=>el.textContent='SEM USUÁRIO');
 if(isConfigured())show();else try{if(typeof home==='function')home()}catch{}
};
const boot=()=>{
 let user=null;try{user=JSON.parse(sessionStorage.getItem(SESSION)||'null')}catch{};
 if(!isConfigured()){
   sessionStorage.removeItem(SESSION);
   document.querySelectorAll('.top-user strong').forEach(el=>el.textContent='CONFIGURAÇÃO INICIAL');
   return;
 }
 if(!validSession(user)){sessionStorage.removeItem(SESSION);show()}
 else document.querySelectorAll('.top-user strong').forEach(el=>el.textContent=user.nome||'USUÁRIO');
};
// Ativa a tela de login logo após o primeiro cadastro, mesmo sem recarregar a página.
window.addEventListener('storage',e=>{if(e.key===USERS&&isConfigured())boot()});
const originalSetItem=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){
 const result=originalSetItem.call(this,k,v);
 if(this===localStorage&&k===USERS&&isConfigured()&&!document.getElementById('ls-login-gate')){
   const current=(()=>{try{return JSON.parse(sessionStorage.getItem(SESSION)||'null')}catch{return null}})();
   if(!validSession(current))queueMicrotask(boot);
 }
 return result;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
