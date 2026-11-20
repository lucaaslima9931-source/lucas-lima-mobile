(()=>{'use strict';
const KEY='erp_systems_backup_historico_v1',PREFIX='erp_',safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function history(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}}
function backupActor(){try{const name=window.LucasLimaAuditoria?.usuarioAtual?.()||window.LUCAS_LIMA_USUARIO_ATUAL||window.usuarioLogado?.nome||JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'null')?.nome||document.querySelector('.top-user strong')?.textContent?.trim();return String(name||'USUÁRIO NÃO IDENTIFICADO').trim()}catch(e){return 'USUÁRIO NÃO IDENTIFICADO'}}
function record(status,detail,fileId){let h=history();h.unshift({date:new Date().toISOString(),status,detail,usuario:backupActor(),...(fileId?{fileId}:{} )});localStorage.setItem(KEY,JSON.stringify(h.slice(0,100)))}
const DB_NAME='lucas_lima_backup_arquivos_v1';
function dbOpen(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(Error('Armazenamento de arquivos indisponível neste navegador'));const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files',{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Falha ao abrir armazenamento'))})}
async function storeBackup(obj,prefix){const db=await dbOpen();const id='bk_'+Date.now()+'_'+Math.random().toString(36).slice(2);const filename=prefix+'_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put({id,filename,content:JSON.stringify(obj,null,2),createdAt:new Date().toISOString()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Espaço insuficiente para armazenar o backup'));tx.onabort=()=>reject(tx.error||Error('Backup não armazenado'))});return id}finally{db.close()}}
async function storedFile(id){const db=await dbOpen();try{return await new Promise((resolve,reject)=>{const req=db.transaction('files','readonly').objectStore('files').get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}finally{db.close()}}
function downloadStored(file){const url=URL.createObjectURL(new Blob([file.content],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=file.filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function snapshot(){const data={};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);if(k!==KEY)data[k]=localStorage.getItem(k)}return {format:'ERP_SYSTEMS_BACKUP_LOCAL_V1',createdAt:new Date().toISOString(),data}}
function download(obj,prefix){const str=JSON.stringify(obj,null,2),blob=new Blob([str],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=prefix+'_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
function screenBackup(){
screen='BACKUP';active('CONFIGURAÇÕES');
try{document.querySelectorAll('#workspace, .content, .main-content, main').forEach(el=>{el.scrollTop=0});window.scrollTo(0,0)}catch(e){}
let cfg={};try{cfg=JSON.parse(localStorage.getItem('ll_backup_email_config_v1')||'{}')}catch{}
let rows=history().map(x=>{let d=new Date(x.date);return `<tr><td>${d.toLocaleDateString('pt-BR')}</td><td>${d.toLocaleTimeString('pt-BR')}</td><td>${x.status==='Restaurado'?'Restauração':'Manual'}</td><td>${safe(x.status)}</td><td>Arquivo local</td><td>${safe(x.usuario||'—')}</td><td>${x.fileId?`<button type="button" class="bk-download" data-file="${safe(x.fileId)}">⇩ BAIXAR</button>`:'—'}</td></tr>`}).join('');
root().innerHTML=`
<style>
.llbk{font:14px Arial,sans-serif;color:#082d60;width:100%;max-width:none;margin:0 auto;padding:0 12px 18px;line-height:1.35}
.llbk *{box-sizing:border-box}.llbk .head{display:flex;align-items:center;gap:18px;margin-bottom:12px;min-height:90px}.llbk .head .crumb{margin-left:auto;align-self:flex-start;background:#f2f7ff;border:1px solid #d8e6fa;border-radius:30px;padding:12px 16px;white-space:nowrap}.llbk h1{font-size:30px;margin:0}.llbk .sub{font-size:16px;margin-top:5px}
.llbk .cols{display:grid;grid-template-columns:1fr 1.48fr;gap:14px;align-items:stretch}.llbk .cols>.panel{min-height:370px}.llbk .panel{background:white;border:1px solid #c8d9f0;border-radius:15px;padding:15px;box-shadow:0 2px 5px #16345a12}
.llbk .bar{background:#e5f0ff;padding:12px 16px;border-radius:12px;display:flex;gap:15px;align-items:center}.llbk .bar.green{background:#e4f7eb}.llbk h2{font-size:20px;margin:0}.llbk .bar p{margin:5px 0 0}
.llbk button{cursor:pointer;border:1px solid #aac5e7;border-radius:9px;padding:13px;font-weight:bold;color:#062c61;background:#f8fbff}.llbk button.primary{background:#0755a8;color:white;border-color:#0755a8}.llbk button.save{background:#008b4b;color:white;border-color:#008b4b}
.llbk .actions{display:flex;gap:12px;justify-content:center;align-items:center;margin:88px 0 35px}.llbk .actions button{height:90px;flex:1;font-size:15px}.llbk label{font-weight:bold;display:block;margin:12px 0 6px}.llbk input,.llbk select{border:1px solid #b5cbe7;border-radius:7px;padding:12px;width:100%;color:#0c2c58;background:white}
.llbk .settings{display:grid;grid-template-columns:1.65fr 1fr .8fr;gap:12px}.llbk .settings label{font-size:12px;min-height:17px}.llbk .settings input,.llbk .settings select{height:43px;padding:9px}.llbk .note{background:#e9f4ff;border:1px solid #c8dff9;padding:12px;border-radius:8px;line-height:1.5}.llbk .hist{margin-top:22px}.llbk .hist h2{font-size:22px}.llbk .hist table{margin-top:10px}
.llbk table{width:100%;border-collapse:collapse;font-size:14px}.llbk th{background:#06498c;color:white;text-align:left;padding:12px}.llbk td{padding:12px;border-bottom:1px solid #d7e3f1}.llbk .warn{color:#865000;background:#fff5df;border:1px solid #e7d19b;padding:11px;border-radius:8px;margin-top:14px}
@media(max-width:950px){.llbk .cols{grid-template-columns:1fr}.llbk .actions{margin:25px 0}.llbk .settings{grid-template-columns:1fr 1fr}}

.llbk .head .crumb{align-self:center;font-size:14px;background:white;box-shadow:0 2px 7px #0b326012}
.llbk .cols>.panel:first-child .actions button{font-size:15px}
.llbk .cols>.panel:first-child .actions button.primary{background:linear-gradient(130deg,#0061ba,#00458e)}
.llbk .bar.green{background:#e3f6e9}
.llbk .hist h2{display:flex;align-items:center;gap:9px;color:#072f66}
.llbk .hist th{background:linear-gradient(180deg,#0960b0,#004386);font-size:14px}
.llbk .hist td{font-size:14px}
.llbk #bk-enabled{appearance:none;width:49px!important;height:27px;position:relative;background:#9eafc0;border-radius:25px;border:0;cursor:pointer;flex-shrink:0;margin:0}
.llbk #bk-enabled:checked{background:#008f4d}
.llbk #bk-enabled:before{content:'';position:absolute;width:21px;height:21px;top:3px;left:3px;border-radius:50%;background:white;box-shadow:0 1px 3px #0003;transition:transform .15s}
.llbk #bk-enabled:checked:before{transform:translateX(22px)}
.llbk .panel{box-shadow:0 2px 5px #17365a12}
.llbk .warn{font-size:12px;margin-top:12px}.llbk .bk-download{padding:6px 12px;font-size:12px;white-space:nowrap}
@media(max-width:1100px){.llbk .cols{grid-template-columns:1fr 1.2fr}.llbk .settings{gap:7px}.llbk .settings label{font-size:11px}}
.llbk .backup-title-strip{background:#193f78;color:#fff;border-radius:8px;min-height:58px;display:flex;align-items:center;gap:12px;padding:12px 18px;margin:0 0 14px;font-size:20px;font-weight:800;letter-spacing:.1px}
.llbk .backup-title-icon{font-size:20px;line-height:1;color:#fff}
.llbk .cols{margin-top:0}
</style>
<section class="llbk">
<div class="backup-title-strip"><span class="backup-title-icon" aria-hidden="true">▤</span><span>BACKUP DO SISTEMA</span></div>
<div class="cols">
<div class="panel"><div class="bar"><span style="font-size:36px;color:#0054a7;width:55px;text-align:center">⇩</span><div><h2>BACKUP MANUAL</h2><p>Gere uma cópia dos dados agora e salve em seu computador.</p></div></div>
<div class="actions"><button class="primary" id="bk-now">⇩ &nbsp; FAZER BACKUP AGORA</button><button id="bk-restore">↶ &nbsp; RESTAURAR BACKUP</button><input id="bk-file" type="file" accept="application/json,.json" hidden></div>
<p id="bk-message" role="status"></p></div>
<div class="panel"><div class="bar green"><span style="font-size:36px;color:#00894e;width:55px;text-align:center">▣</span><div><h2>BACKUP AUTOMÁTICO</h2><p>Envio automático do backup por e-mail.</p></div></div>
<label style="display:flex;gap:10px;align-items:center"><input id="bk-enabled" type="checkbox" style="width:auto" ${cfg.enabled?'checked':''}> Backup automático ${cfg.enabled?'CONFIGURADO — AGUARDANDO SERVIDOR':'DESATIVADO'}</label>
<div class="settings"><div><label>E-MAIL PARA RECEBIMENTO DO BACKUP</label><input id="bk-email" type="email" placeholder="seuemail@gmail.com" value="${safe(cfg.email||'')}"></div><div><label>FREQUÊNCIA</label><select id="bk-frequency"><option value="0" ${cfg.frequency==='0'?'selected':''}>Todos os dias</option><option value="1" ${cfg.frequency==='1'?'selected':''}>Todos os domingos</option><option value="2" ${cfg.frequency==='2'?'selected':''}>Todas as segundas-feiras</option><option value="3" ${cfg.frequency==='3'?'selected':''}>Todas as terças-feiras</option><option value="4" ${cfg.frequency==='4'?'selected':''}>Todas as quartas-feiras</option><option value="5" ${cfg.frequency==='5'?'selected':''}>Todas as quintas-feiras</option><option value="6" ${cfg.frequency==='6'?'selected':''}>Todas as sextas-feiras</option><option value="7" ${cfg.frequency==='7'?'selected':''}>Todos os sábados</option></select></div><div><label>HORÁRIO</label><input id="bk-time" type="time" step="60" value="${/^([01]\d|2[0-3]):[0-5]\d$/.test(String(cfg.time||''))?cfg.time:'06:00'}" aria-label="Horário do backup"></div></div>
<div style="display:grid;grid-template-columns:1fr 1.7fr;gap:12px;align-items:end"><div><label>RETENÇÃO DOS BACKUPS</label><select id="bk-retention">${Array.from({length:12},(_,i)=>{const months=i+1;const days=months*30;return `<option value="${days}" ${Number(cfg.retentionDays||90)===days?'selected':''}>${months} ${months===1?'mês':'meses'} (${days} dias)</option>`}).join('')}</select></div><div class="note" id="bk-schedule-note">ⓘ Programação desejada: domingos às 06h. O envio só será ativado após conectar um servidor seguro e sincronizar os dados.</div></div>
<div style="display:flex;justify-content:center;gap:12px;margin-top:18px"><button class="save" id="bk-save">▣ &nbsp; GRAVAR</button><button class="bk-edit" id="bk-edit" style="background:#e99a16;color:#fff;border-color:#e99a16">✎ &nbsp; ALTERAR</button><button type="button" id="bk-back" style="background:#e8324d;color:#fff;border-color:#e8324d">← &nbsp; VOLTAR</button></div><p id="bk-config-status" role="status"></p>
</div></div>
<div class="panel hist"><h2 style="margin-bottom:14px">☷ &nbsp; HISTÓRICO DE BACKUPS</h2><div style="overflow-x:auto"><table><thead><tr><th>DATA</th><th>HORÁRIO</th><th>TIPO</th><th>SITUAÇÃO</th><th>DESTINO</th><th>USUÁRIO</th><th>AÇÕES</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Nenhum backup registrado.</td></tr>'}</tbody></table></div></div>
</section>`;
const freq=document.getElementById('bk-frequency');
const note=document.getElementById('bk-schedule-note');
const descriptions=['todos os dias','todos os domingos','todas as segundas-feiras','todas as terças-feiras','todas as quartas-feiras','todas as quintas-feiras','todas as sextas-feiras','todos os sábados'];
if(!/^([0-7])$/.test(String(cfg.frequency??'')))freq.value='1';
const refreshNote=()=>{note.textContent='ⓘ Programação desejada: '+descriptions[Number(freq.value)]+' às '+document.getElementById('bk-time').value+'. O envio só será ativado após conectar um servidor seguro e sincronizar os dados.'};
freq.addEventListener('change',refreshNote);document.getElementById('bk-time').addEventListener('input',refreshNote);refreshNote();
const persistBackupConfig=(mode)=>{
const existing=localStorage.getItem('ll_backup_email_config_v1');
const status=document.getElementById('bk-config-status');
if(mode==='gravar' && existing){status.textContent='Já existe uma configuração gravada. Utilize ALTERAR para salvar as modificações.';return}
if(mode==='alterar' && !existing){status.textContent='Ainda não existe uma configuração. Utilize GRAVAR primeiro.';return}

const email=document.getElementById('bk-email').value.trim(),enabled=document.getElementById('bk-enabled').checked;
if(enabled&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){status.textContent='Informe um e-mail válido.';return}
if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(document.getElementById('bk-time').value)){status.textContent='Informe um horário válido entre 00:00 e 23:59.';return}
localStorage.setItem('ll_backup_email_config_v1',JSON.stringify({email,enabled,frequency:document.getElementById('bk-frequency').value,time:document.getElementById('bk-time').value,retentionDays:Number(document.getElementById('bk-retention').value)}));
status.textContent=(mode==='alterar'?'Configuração alterada':'Configuração gravada')+' com sucesso.';
};
document.getElementById('bk-save').onclick=()=>persistBackupConfig('gravar');
document.getElementById('bk-edit').onclick=()=>persistBackupConfig('alterar');
document.getElementById('bk-back').onclick=()=>{if(typeof home==='function')home();else window.open('INÍCIO')};
const msg=document.getElementById('bk-message');
document.querySelectorAll('.llbk .bk-download').forEach(btn=>btn.onclick=async()=>{btn.disabled=true;try{const file=await storedFile(btn.dataset.file);if(!file)throw Error('Arquivo não encontrado neste navegador. Pode ter sido apagado ao limpar os dados do site.');downloadStored(file)}catch(e){alert('Não foi possível baixar este backup: '+e.message)}finally{btn.disabled=false}});
document.getElementById('bk-now').onclick=async()=>{const btn=document.getElementById('bk-now');btn.disabled=true;try{const obj=snapshot();const id=await storeBackup(obj,'LUCAS_LIMA_BACKUP');record('Concluído','Arquivo armazenado para download',id);const file=await storedFile(id);if(file)downloadStored(file);screenBackup()}catch(e){msg.textContent='Não foi possível guardar o arquivo no histórico: '+e.message+'. Nenhum backup foi marcado como concluído.';btn.disabled=false}};
document.getElementById('bk-restore').onclick=()=>document.getElementById('bk-file').click();document.getElementById('bk-file').onchange=async e=>{let file=e.target.files?.[0];if(!file)return;try{if(file.size>20000000)throw Error('Arquivo maior que 20 MB');const obj=JSON.parse(await file.text());if(obj.format!=='ERP_SYSTEMS_BACKUP_LOCAL_V1'||!obj.data||Array.isArray(obj.data)||typeof obj.data!=='object'||Object.values(obj.data).some(v=>typeof v!=='string'))throw Error('Arquivo não é um backup local válido do LUCAS LIMA');if(!confirm('ATENÇÃO: a restauração substituirá dados locais existentes. Continue apenas se você tiver autorização. Deseja continuar?'))return;if(!confirm('Confirma novamente a restauração? Será baixada uma cópia de segurança antes de modificar os dados.'))return;download(snapshot(),'ERP_SYSTEMS_ANTES_DA_RESTAURACAO');let old={};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);if(k!==KEY)old[k]=localStorage.getItem(k)}try{for(let k of Object.keys(old))localStorage.removeItem(k);for(let [k,v] of Object.entries(obj.data))if(k!==KEY)localStorage.setItem(k,v)}catch(err){for(let k of Object.keys(obj.data))if(k!==KEY)localStorage.removeItem(k);for(let [k,v] of Object.entries(old))localStorage.setItem(k,v);throw err}record('Restaurado','Arquivo local');alert('Restauração local concluída. A página será recarregada.');location.reload()}catch(err){record('Falhou',String(err));msg.textContent='Restauração não realizada: '+err.message}};
}
const previous=window.open;window.open=function(name){if(name==='BACKUP')return screenBackup();return previous(name)};
})();