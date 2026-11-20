/* Corrige estruturalmente a posição do USUÁRIO em ORÇAMENTOS, inclusive em renderizações posteriores. */
(()=>{'use strict';
function ajustar(){
 const page=document.querySelector('.or-page');if(!page)return;
 const head=page.querySelector('.or-header-grid');if(!head)return;
 let user=page.querySelector('#or-user');
 if(!user){user=document.createElement('input');user.id='or-user';user.readOnly=true;}
 let label=user.closest('label');
 if(!label){label=document.createElement('label');label.className='or-field or-header-user';label.appendChild(document.createTextNode('USUÁRIO'));label.appendChild(user)}
 label.classList.add('or-field','or-header-user');
 if(label.parentElement!==head)head.appendChild(label);
 label.style.cssText='grid-column:3!important;grid-row:2!important;display:flex!important;visibility:visible!important;';
 user.readOnly=true;
 const username=(document.querySelector('.top-user strong')?.textContent||document.querySelector('.top-user')?.textContent||localStorage.getItem('erp_usuario_nome')||'LUCAS').trim();
 if(!user.value)user.value=username;
 page.querySelectorAll('#or-user').forEach((el,i)=>{if(i>0)el.closest('label')?.remove()});
 const innerShortcuts=[...page.querySelectorAll('button')].filter(x=>x.id!=='or-shortcuts' && /ATALHOS/i.test(x.textContent||'') && !x.closest('.or-topbar'));
 innerShortcuts.forEach(x=>x.remove());
}
let pending=false;
const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;ajustar()})};
document.addEventListener('DOMContentLoaded',()=>{ajustar();new MutationObserver(schedule).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});});
})();
