
(()=>{'use strict';
if('serviceWorker' in navigator && location.protocol==='https:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function snapshot(){
 const data={};
 for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(k.startsWith('erp_')||k.startsWith('lucas_lima_')))data[k]=localStorage.getItem(k)}
 return {format:'LUCAS_LIMA_IPHONE_LOCAL_V1',createdAt:new Date().toISOString(),data};
}
function exportData(){
 const blob=new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='LUCAS_LIMA_BACKUP_IPHONE_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function importData(file){
 if(!file)return;
 file.text().then(text=>{
  const obj=JSON.parse(text);
  if(obj.format!=='LUCAS_LIMA_IPHONE_LOCAL_V1'||!obj.data||typeof obj.data!=='object'||Array.isArray(obj.data))throw Error('Arquivo de backup incompatível');
  if(!confirm('Restaurar este backup? Os registros locais atuais serão substituídos.'))return;
  for(const key of Object.keys(localStorage))if(key.startsWith('erp_')||key.startsWith('lucas_lima_'))localStorage.removeItem(key);
  for(const [key,value] of Object.entries(obj.data)){
    if((key.startsWith('erp_')||key.startsWith('lucas_lima_'))&&typeof value==='string')localStorage.setItem(key,value);
  }
  alert('Backup restaurado. O aplicativo será recarregado.');location.reload();
 }).catch(e=>alert('Falha ao restaurar: '+e.message));
}
function setup(){
 if(document.getElementById('ll-iphone-tools'))return;
 const el=document.createElement('aside');el.id='ll-iphone-tools';
 el.style.cssText='position:fixed;bottom:12px;right:12px;z-index:2147483645;font:12px Arial,sans-serif';
 el.innerHTML='<button id="ll-backup-toggle" style="background:#103e79;color:#fff;border:0;border-radius:22px;padding:11px 14px;box-shadow:0 2px 8px #0004">Backup iPhone</button><div id="ll-backup-panel" hidden style="margin-top:6px;background:#fff;border:1px solid #abc;border-radius:9px;padding:12px;max-width:270px;box-shadow:0 2px 12px #0003;color:#173b70"><strong>Dados somente neste iPhone</strong><p>Exporte um backup regularmente. Apagar dados do Safari pode eliminar seus registros.</p><button id="ll-export">Salvar backup</button> <button id="ll-import">Restaurar backup</button><input id="ll-import-file" type="file" accept=".json,application/json" hidden><p style="font-size:11px">Versão de testes: não use para operações reais sem validar os módulos.</p></div>';
 document.body.appendChild(el);
 el.querySelector('#ll-backup-toggle').onclick=()=>{const p=el.querySelector('#ll-backup-panel');p.hidden=!p.hidden};
 el.querySelector('#ll-export').onclick=exportData;
 el.querySelector('#ll-import').onclick=()=>el.querySelector('#ll-import-file').click();
 el.querySelector('#ll-import-file').onchange=e=>importData(e.target.files[0]);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
