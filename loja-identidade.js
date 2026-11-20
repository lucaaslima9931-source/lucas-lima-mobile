(()=>{'use strict';
const KEY='erp_systems_dados_loja_v1';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function apply(){
 const loja=read();
 const company=document.querySelector('.topbar .store-company');
 if(company)company.textContent=loja.nome||'NOME DA EMPRESA';
 const id=document.querySelector('.topbar .store-name');
 if(id)id.textContent='LOJA: 01 – MATRIZ';
 const loginName=document.getElementById('ls-store-business');
 if(loginName)loginName.textContent=loja.nome||'';
 const loginLogo=document.getElementById('ls-company-logo');
 if(loginLogo&&loja.logo)loginLogo.src=loja.logo;
 const photo=document.querySelector('#ls-login-gate .ls-photo');
 if(photo)photo.style.backgroundImage=loja.fundoLogin?'url('+JSON.stringify(loja.fundoLogin)+')':'';
}
window.addEventListener('lucas-loja-atualizada',apply);
window.addEventListener('storage',e=>{if(e.key===KEY)apply()});
const root=document.getElementById('app');
if(root){const mo=new MutationObserver(()=>{if(document.querySelector('.topbar .store-company')?.textContent!==(read().nome||'NOME DA EMPRESA'))apply()});mo.observe(root,{childList:true,subtree:true})}
document.addEventListener('DOMContentLoaded',apply);
apply();
})();
