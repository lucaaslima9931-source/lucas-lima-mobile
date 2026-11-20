/* V566 — Janelas de Férias e Rescisões no documento principal.
   O diálogo real continua no módulo, preservando handlers e validações.
   Uma cópia visual é projetada no viewport principal e encaminha os eventos. */
(function(){'use strict';
const selector='iframe[src*="ferias/"],iframe[src*="rescisoes/"]';
let active=null;
function descendants(node){return [node,...node.querySelectorAll('*')];}
function close(){if(!active)return;const a=active;active=null;a.observer.disconnect();a.overlay.remove();document.removeEventListener('keydown',key,true);}
function key(e){if(!active)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();const d=active.dialog;if(d.open)d.close();close();}}
function getPath(root,node){const p=[];while(node&&node!==root){const par=node.parentElement;if(!par)return null;p.unshift(Array.prototype.indexOf.call(par.children,node));node=par;}return p;}
function atPath(root,path){let n=root;for(const i of path||[])n=n?.children[i];return n;}
function copyVisual(source,clone){const orig=descendants(source),dest=descendants(clone);for(let i=0;i<orig.length&&i<dest.length;i++){
 const c=source.ownerDocument.defaultView.getComputedStyle(orig[i]);const st=dest[i].style;
 for(let j=0;j<c.length;j++){const prop=c[j];if(prop==='position'||prop==='top'||prop==='left'||prop==='right'||prop==='bottom'||prop==='transform'||prop==='margin')continue;st.setProperty(prop,c.getPropertyValue(prop));}
 if(orig[i].matches('input,textarea,select')){dest[i].value=orig[i].value;if(orig[i].type==='checkbox'||orig[i].type==='radio')dest[i].checked=orig[i].checked;}
 }
}
function render(){const a=active;if(!a)return;const {dialog,overlay,frame}=a;if(!dialog.isConnected||!dialog.open||!frame.isConnected){close();return;}
 const prev=overlay.querySelector('[data-ll-dialog]');const focusPath=prev&&prev.contains(document.activeElement)?getPath(prev,document.activeElement):null;
 const clone=document.createElement('section');clone.dataset.llDialog='1';clone.setAttribute('role','dialog');clone.setAttribute('aria-modal','true');
 clone.innerHTML=dialog.innerHTML;copyVisual(dialog,clone);
 clone.style.setProperty('position','relative','important');clone.style.setProperty('inset','auto','important');clone.style.setProperty('transform','none','important');clone.style.setProperty('margin','0','important');clone.style.setProperty('width','min(720px,calc(100vw - 32px))','important');clone.style.setProperty('max-width','calc(100vw - 32px)','important');clone.style.setProperty('max-height','calc(100dvh - 32px)','important');clone.style.setProperty('overflow','auto','important');clone.style.setProperty('background','#fff','important');clone.style.setProperty('box-sizing','border-box','important');
 if(prev)prev.replaceWith(clone);else overlay.appendChild(clone);
 function relay(e){const path=getPath(clone,e.target),original=atPath(dialog,path);if(!original)return;
 if(e.type==='input'||e.type==='change'){original.value=e.target.value;if(original.type==='checkbox'||original.type==='radio')original.checked=e.target.checked;original.dispatchEvent(new Event(e.type,{bubbles:true}));}
 else if(e.type==='click'||e.type==='dblclick'){
 // Keep input state in sync before triggering the original action.
 for(const item of clone.querySelectorAll('input,select,textarea')){const p=getPath(clone,item),o=atPath(dialog,p);if(o&&'value'in o)o.value=item.value;}
 original.dispatchEvent(new MouseEvent(e.type,{bubbles:true,cancelable:true,view:frame.contentWindow,detail:e.type==='dblclick'?2:1}));
 if(e.type==='click'&&original.matches('button')&&original.type==='submit')original.click();
 }
 }
 clone.addEventListener('click',relay);clone.addEventListener('dblclick',relay);clone.addEventListener('input',relay);clone.addEventListener('change',relay);
 clone.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input')){e.preventDefault();const orig=atPath(dialog,getPath(clone,e.target));if(orig){orig.value=e.target.value;orig.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));}}});
 if(focusPath){const n=atPath(clone,focusPath);if(n?.focus)n.focus({preventScroll:true});}
 else{const focus=clone.querySelector('[autofocus],input:not([type=hidden]),button');if(focus)focus.focus({preventScroll:true});}
}
function start(frame,dialog){close();const overlay=document.createElement('div');overlay.id='ll-admin-dialog-viewport';overlay.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:2147483647!important;background:rgba(4,24,55,.65)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;box-sizing:border-box!important;';document.body.appendChild(overlay);
 active={frame,dialog,overlay,observer:null};overlay.addEventListener('click',e=>{if(e.target===overlay){dialog.close();close();}});
 const obs=new MutationObserver(()=>{if(active?.dialog===dialog)queueMicrotask(render);});obs.observe(dialog,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['value','disabled','style','class']});active.observer=obs;
 dialog.addEventListener('close',()=>{if(active?.dialog===dialog)close();},{once:true});document.addEventListener('keydown',key,true);render();}
function scan(){for(const frame of document.querySelectorAll(selector)){let dialog;try{dialog=frame.contentDocument?.querySelector('dialog[open]');}catch(_){continue;}if(dialog){if(active?.dialog!==dialog)start(frame,dialog);return;}}if(active)close();}
setInterval(scan,75);
})();