/* Integração visual: Folha no padrão compacto de Lançamentos de Funcionários */
(()=>{'use strict';const anterior=open;open=function(nome){if(nome==='FOLHA DE PAGAMENTO'){screen=nome;active('ADMINISTRATIVO');root().innerHTML='<iframe title="FOLHA DE PAGAMENTO" src="folha-pagamento/index.html" style="display:block;width:100%;height:650px;min-height:0;border:0;background:#f5f8fe;border-radius:9px;overflow:hidden" scrolling="no"></iframe>';return}if(nome==='FÉRIAS'){screen=nome;active('ADMINISTRATIVO');root().innerHTML='<iframe title="FÉRIAS" src="ferias/index.html" style="display:block;width:100%;height:650px;min-height:0;border:0;background:#f5f8fe;overflow:hidden" scrolling="no"></iframe>';return}if(nome==='RESCISÕES'){screen=nome;active('ADMINISTRATIVO');root().innerHTML='<iframe title="RESCISÕES" src="rescisoes/index.html" style="display:block;width:100%;height:650px;min-height:0;border:0;background:#f5f8fe;overflow:hidden" scrolling="no"></iframe>';return}return anterior(nome)}})();

/* Folha de pagamento: o documento pai é o único responsável pela rolagem.
   O iframe acompanha a altura real do conteúdo, sem barra vertical própria. */
window.addEventListener('message',function(ev){
  if(!ev.data || ev.data.type!=='LL_FOLHA_ALTURA') return;
  var frame=document.querySelector('.workspace iframe[src="folha-pagamento/index.html"]');
  if(!frame || ev.source!==frame.contentWindow) return;
  var h=Number(ev.data.height);
  if(!Number.isFinite(h) || h<150 || h>100000) return;
  frame.style.height=Math.ceil(h+2)+'px';
});

// A pesquisa da Folha consulta o mesmo cadastro de funcionários usado no módulo
// CADASTROS → FUNCIONÁRIOS, sem duplicar nem modificar registros.
window.addEventListener('message',function(event){
  if(!event.data||event.data.type!=='LL_RH_DADOS_PEDIDO')return;
  var frame=document.querySelector('iframe[src="folha-pagamento/index.html"]');
  if(!frame||event.source!==frame.contentWindow)return;
  var rh={funcionarios:[],eventos:[]};
  try{var stored=JSON.parse(localStorage.getItem('erp_matriz_rh_v1')||'{}');
      if(Array.isArray(stored.funcionarios))rh.funcionarios=stored.funcionarios;
      if(Array.isArray(stored.eventos))rh.eventos=stored.eventos;}catch(e){}
  frame.contentWindow.postMessage({type:'LL_RH_DADOS_RESPOSTA',requestId:event.data.requestId,rh:rh},'*');
});

window.addEventListener('message',function(ev){if(ev.data?.type!=='LL_RESCISAO_ALTURA')return;var f=document.querySelector('iframe[src="rescisoes/index.html"]');if(f&&ev.source===f.contentWindow&&Number.isFinite(Number(ev.data.height)))f.style.height=Math.ceil(Number(ev.data.height)+2)+'px'});
window.addEventListener('message',function(ev){if(ev.data?.type!=='LL_RH_DADOS_PEDIDO')return;var f=document.querySelector('iframe[src="rescisoes/index.html"]');if(!f||ev.source!==f.contentWindow)return;var rh={funcionarios:[],eventos:[]};try{var x=JSON.parse(localStorage.getItem('erp_matriz_rh_v1')||'{}');rh.funcionarios=x.funcionarios||[];rh.eventos=x.eventos||[]}catch(e){}f.contentWindow.postMessage({type:'LL_RH_DADOS_RESPOSTA',requestId:ev.data.requestId,rh:rh},'*')});

window.addEventListener('message',function(ev){if(ev.data?.type!=='LL_RESCISAO_LOJA_PEDIDO')return;var fr=document.querySelector('iframe[src="rescisoes/index.html"]');if(!fr||ev.source!==fr.contentWindow)return;var loja={};try{loja=JSON.parse(localStorage.getItem('erp_systems_dados_loja_v1')||'{}')||{}}catch(e){}fr.contentWindow.postMessage({type:'LL_RESCISAO_LOJA_RESPOSTA',loja:loja},'*')});

window.addEventListener('message',function(ev){var f=document.querySelector('iframe[src="ferias/index.html"]');if(!f||ev.source!==f.contentWindow)return;if(ev.data?.type==='LL_FERIAS_ALTURA'){var h=Number(ev.data.height);if(Number.isFinite(h)&&h>100&&h<100000)f.style.height=Math.ceil(h+3)+'px'}if(ev.data?.type==='LL_FERIAS_RH_PEDIDO'){var rh={funcionarios:[]};try{rh=JSON.parse(localStorage.getItem('erp_matriz_rh_v1')||'{}')}catch(e){}f.contentWindow.postMessage({type:'LL_FERIAS_RH_RESPOSTA',rh:rh},'*')}});

// Identidade do usuário: o documento principal mantém a sessão do login.
window.addEventListener('message',function(ev){
 if(ev.data?.type!=='LL_FOLHA_USUARIO_PEDIDO')return;
 const frame=document.querySelector('iframe[src="folha-pagamento/index.html"]');
 if(!frame||ev.source!==frame.contentWindow)return;
 let nome='';
 try{const s=JSON.parse(sessionStorage.getItem('erp_systems_demo_session')||'null');nome=String(s?.nome||'').trim()}catch(e){}
 frame.contentWindow.postMessage({type:'LL_FOLHA_USUARIO_RESPOSTA',requestId:ev.data.requestId,nome:nome},'*');
});

// Navegacao da folha para o menu ADMINISTRATIVO, sem abrir a tela INICIO.
window.addEventListener('message',function(event){
 if(!event.data||event.data.type!=='LL_FOLHA_VOLTAR_ADMINISTRATIVO')return;
 const frame=document.querySelector('iframe[src="folha-pagamento/index.html"]');
 if(!frame||event.source!==frame.contentWindow)return;
 category('ADMINISTRATIVO');
 window.scrollTo(0,0);
});

// Retorno de FERIAS ao menu principal ADMINISTRATIVO.
window.addEventListener('message',function(event){
 if(!event.data||event.data.type!=='LL_FERIAS_VOLTAR_ADMINISTRATIVO')return;
 const frame=document.querySelector('iframe[src="ferias/index.html"]');
 if(!frame||event.source!==frame.contentWindow)return;
 category('ADMINISTRATIVO');
 window.scrollTo(0,0);
});

// Retorno de RESCISOES ao menu principal ADMINISTRATIVO.
window.addEventListener('message',function(event){
 if(!event.data||event.data.type!=='LL_RESCISOES_VOLTAR_ADMINISTRATIVO')return;
 const frame=document.querySelector('iframe[src="rescisoes/index.html"]');
 if(!frame||event.source!==frame.contentWindow)return;
 category('ADMINISTRATIVO');
 window.scrollTo(0,0);
});

/* F1 da página principal: encaminhar ao módulo Rescisões antes do atalho genérico. */
window.addEventListener('keydown',function(e){
 if(e.key!=='F1'||e.ctrlKey||e.altKey||e.metaKey)return;
 const fr=document.querySelector('iframe[src="rescisoes/index.html"]');
 if(!fr||!fr.getClientRects().length)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(!e.repeat)fr.contentWindow.postMessage({type:'LL_RESCISAO_ATALHO',key:'F1'},'*');
},true);

/* F12 em Rescisões: captura também no documento principal, antes dos
   atalhos gerais. Quando o foco está no iframe, o próprio módulo encaminha
   o pedido de localização via postMessage. */
window.addEventListener('keydown',function(e){
 if(e.key!=='F12'||e.ctrlKey||e.altKey||e.metaKey)return;
 const fr=document.querySelector('iframe[src="rescisoes/index.html"]');
 if(!fr||!fr.isConnected||!fr.getClientRects().length)return;
 if(document.getElementById('ll-rescisoes-f12-viewport')){e.preventDefault();e.stopImmediatePropagation();return;}
 e.preventDefault();e.stopImmediatePropagation();
 if(!e.repeat)fr.contentWindow.postMessage({type:'LL_RESCISAO_ATALHO',key:'F12'},'*');
},true);

/* Rescisões: janela F1 posicionada no viewport principal, não dentro do iframe. */
(function(){
'use strict';
let overlay=null;
function close(){if(!overlay)return;overlay.remove();overlay=null;document.removeEventListener('keydown',key,true)}
function key(e){if(e.key==='Escape'||e.key==='F1'){e.preventDefault();e.stopImmediatePropagation();close()}}
window.addEventListener('message',function(e){
 if(e.data?.type!=='LL_RESCISOES_ATALHOS_CENTRO_CHROME')return;
 const frame=document.querySelector('iframe[src="rescisoes/index.html"]');
 if(!frame||e.source!==frame.contentWindow)return;
 close();overlay=document.createElement('div');overlay.id='ll-resc-atalhos-viewport';
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(13,31,62,.59);padding:18px;box-sizing:border-box';
 const rows=[['F1','Abrir esta janela de atalhos'],['F12','Localizar rescisão pelo número'],['F5','Gerar rescisão']].map(function(x){return '<div style="display:flex;align-items:center;gap:16px;padding:10px 0;border-bottom:1px solid #d8e4f3;font-size:13px"><strong style="display:flex;align-items:center;justify-content:center;width:54px;height:36px;flex-shrink:0;border:1px solid #bcd5ff;border-radius:6px;background:#eaf2ff;color:#124a94">'+x[0]+'</strong><span>'+x[1]+'</span></div>'}).join('');
 overlay.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="ll-resc-title" style="width:min(475px,100%);background:#fff;border-radius:13px;overflow:hidden;box-shadow:0 20px 55px rgba(0,0,0,.3);font-family:Arial,sans-serif;color:#174477"><header id="ll-resc-title" style="padding:19px 22px;background:#245a99;color:#fff;font-size:15px;font-weight:bold">⌂ ATALHOS — RESCISÕES</header><div style="padding:17px 22px 0">'+rows+'</div><footer style="display:flex;justify-content:flex-end;padding:15px 20px 16px"><button type="button" id="ll-resc-fechar" style="padding:11px 22px;border:2px solid #07192e;border-radius:6px;background:#0754a5;color:#fff;font-size:13px;cursor:pointer">FECHAR</button></footer></section>';
 document.body.appendChild(overlay);
 overlay.querySelector('#ll-resc-fechar').addEventListener('click',close);
 overlay.addEventListener('click',function(ev){if(ev.target===overlay)close()});
 document.addEventListener('keydown',key,true);overlay.querySelector('button').focus();
});
window.addEventListener('message',function(e){if(e.data?.type==='LL_RESCISOES_VOLTAR_ADMINISTRATIVO')close()});
})();

/* F12 Rescisões: modal no centro da janela principal, mesmo padrão da Folha. */
(function(){
 'use strict';
 let overlay=null;
 function close(){if(!overlay)return;overlay.remove();overlay=null;document.removeEventListener('keydown',onKey,true)}
 function onKey(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(e.key==='F12'){e.preventDefault();e.stopImmediatePropagation()}else if(e.key==='Enter'&&overlay){e.preventDefault();e.stopImmediatePropagation();find()}}
 function frame(){return document.querySelector('iframe[src="rescisoes/index.html"]')}
 function find(){if(!overlay)return;const input=overlay.querySelector('#ll-resc-find-num'),n=input.value.trim();if(!n||!/^\d+$/.test(n)||Number(n)<1){overlay.querySelector('#ll-resc-find-error').textContent='INFORME O NÚMERO DA RESCISÃO.';input.focus();return}const fr=frame();if(!fr){close();return}fr.contentWindow.postMessage({type:'LL_RESCISOES_LOCALIZAR_RESULTADO',numero:n},'*');}
 window.addEventListener('message',function(e){
  if(e.data?.type==='LL_RESCISOES_LOCALIZAR_NAO_ENCONTRADA'){if(overlay&&frame()?.contentWindow===e.source){overlay.querySelector('#ll-resc-find-error').textContent='RESCISÃO NÃO ENCONTRADA.';overlay.querySelector('#ll-resc-find-num').focus()}return}
  if(e.data?.type!=='LL_RESCISOES_LOCALIZAR_CENTRO_CHROME'||frame()?.contentWindow!==e.source)return;
  close();overlay=document.createElement('div');overlay.id='ll-rescisoes-f12-viewport';
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(9,28,57,.66);padding:16px;box-sizing:border-box;font-family:Arial,sans-serif';
  overlay.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="ll-resc-f12-title" style="width:min(475px,100%);background:white;border-radius:13px;overflow:hidden;box-shadow:0 15px 45px rgba(0,0,0,.28);color:#25466e">'
   +'<header id="ll-resc-f12-title" style="padding:24px 21px;background:#285c99;color:#fff;font-size:17px;font-weight:bold">▣ LUCAS LIMA — LOCALIZAR</header>'
   +'<div style="padding:28px 21px 20px"><div style="font-size:13px;margin-bottom:18px">NÚMERO DA RESCISÃO:</div><label for="ll-resc-find-num" style="display:block;font-weight:bold;font-size:12px;margin-bottom:6px">INFORME O NÚMERO DA RESCISÃO</label>'
   +'<input id="ll-resc-find-num" inputmode="numeric" autocomplete="off" placeholder="DIGITE AQUI..." style="width:100%;height:48px;box-sizing:border-box;border:1px solid #75a8ed;border-radius:9px;padding:10px 12px;outline:2px solid #d5e6ff;font-size:14px;color:#25466e">'
   +'<div id="ll-resc-find-error" role="alert" style="min-height:18px;color:#b32222;font-size:12px;margin-top:7px"></div>'
   +'<div style="display:flex;gap:10px;justify-content:center;margin-top:21px"><button type="button" id="ll-resc-find-go" style="background:#1760af;color:white;border:0;border-radius:6px;padding:13px 20px;font-weight:bold;cursor:pointer">LOCALIZAR</button><button type="button" id="ll-resc-find-cancel" style="background:#eaf2ff;color:#16539c;border:1px solid #bad1f7;border-radius:6px;padding:12px 20px;cursor:pointer">CANCELAR</button></div></div></section>';
  document.body.appendChild(overlay);
  overlay.querySelector('#ll-resc-find-go').addEventListener('click',find);
  overlay.querySelector('#ll-resc-find-cancel').addEventListener('click',close);
  overlay.addEventListener('click',function(ev){if(ev.target===overlay)close()});
  document.addEventListener('keydown',onKey,true);overlay.querySelector('#ll-resc-find-num').focus();
 });
 window.addEventListener('message',function(e){if(e.data?.type==='LL_RESCISOES_LOCALIZAR_RESULTADO_OK'&&e.source===frame()?.contentWindow)close();if(e.data?.type==='LL_RESCISOES_VOLTAR_ADMINISTRATIVO')close()});
})();

/* V650: somente o histórico de alterações de Rescisões fora do iframe. */
(function(){
 'use strict';
 let overlay=null;
 function frame(){return document.querySelector('iframe[src="rescisoes/index.html"]')}
 function close(){if(!overlay)return;overlay.remove();overlay=null;document.removeEventListener('keydown',key,true)}
 function key(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}}
 window.addEventListener('message',function(e){
  if(e.data?.type==='LL_RESCISOES_VOLTAR_ADMINISTRATIVO'){close();return}
  if(e.data?.type!=='LL_RESCISOES_HISTORICO_CENTRO_CHROME'||!frame()||e.source!==frame().contentWindow)return;
  close();overlay=document.createElement('div');overlay.id='ll-resc-historico-viewport';
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(7,22,48,.59);padding:20px;box-sizing:border-box;font-family:Arial,sans-serif';
  const section=document.createElement('section');section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');section.setAttribute('aria-labelledby','ll-resc-hist-title');
  section.style.cssText='width:min(440px,100%);max-height:calc(100dvh - 40px);display:flex;flex-direction:column;background:#fff;border:0;border-radius:11px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.28);color:#15345c;box-sizing:border-box';
  const header=document.createElement('header');header.id='ll-resc-hist-title';header.textContent='HISTÓRICO DE ALTERAÇÕES — RESCISÃO';header.style.cssText='background:#1b447b;color:#fff;padding:14px 16px;font-size:16px;font-weight:700;flex-shrink:0';
  const body=document.createElement('div');body.style.cssText='padding:15px 16px;overflow-y:auto;min-height:0;line-height:1.55;font-size:13px;flex:1';
  // Conteúdo gerado exclusivamente pelo módulo e escapado na origem.
  body.innerHTML=String(e.data.html||'');
  const footer=document.createElement('footer');footer.style.cssText='padding:12px 16px;display:flex;justify-content:flex-end;border-top:1px solid #d7e3f2;flex-shrink:0';
  const button=document.createElement('button');button.type='button';button.textContent='FECHAR';button.style.cssText='background:#07539e;color:#fff;border:0;border-radius:5px;padding:10px 17px;font-weight:700;cursor:pointer';button.onclick=close;
  footer.appendChild(button);section.append(header,body,footer);overlay.appendChild(section);document.body.appendChild(overlay);
  overlay.addEventListener('click',function(ev){if(ev.target===overlay)close()});document.addEventListener('keydown',key,true);button.focus();
 });
})();

/* V654: avisos de Rescisões centralizados no Chrome, modelo da Folha de Pagamento. */
(function(){'use strict';
 let overlay=null;
 const frame=()=>document.querySelector('iframe[src="rescisoes/index.html"]');
 function close(){if(!overlay)return;overlay.remove();overlay=null;document.removeEventListener('keydown',onKey,true)}
 function onKey(e){if(overlay&&(e.key==='Enter'||e.key==='Escape')){e.preventDefault();e.stopImmediatePropagation();close()}}
 window.addEventListener('message',function(e){
  if(e.data?.type==='LL_RESCISOES_VOLTAR_ADMINISTRATIVO'){close();return}
  if(e.data?.type!=='LL_RESCISOES_AVISO_CENTRO_CHROME'||!frame()||e.source!==frame().contentWindow)return;
  close();overlay=document.createElement('div');overlay.id='ll-rescisoes-aviso-viewport';
  overlay.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:2147483647!important;background:rgba(4,24,55,.65)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;box-sizing:border-box!important;font-family:Arial,sans-serif';
  const box=document.createElement('section');box.setAttribute('role','alertdialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','ll-resc-aviso-title');
  box.style.cssText='width:min(475px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:white;border-radius:10px;box-shadow:0 18px 48px #001a3955;color:#173c6d;font-size:14px;box-sizing:border-box';
  const head=document.createElement('header');head.id='ll-resc-aviso-title';head.textContent=String(e.data.title||'AVISO — RESCISÕES');head.style.cssText='background:#1e477c;color:#fff;padding:18px 20px;font-size:16px;font-weight:800';
  const body=document.createElement('div');body.textContent=String(e.data.message||'');body.style.cssText='padding:23px 20px;line-height:1.5;white-space:pre-line';
  const footer=document.createElement('div');footer.style.cssText='display:flex;justify-content:flex-end;padding:0 20px 20px';
  const ok=document.createElement('button');ok.type='button';ok.textContent='OK';ok.style.cssText='background:#195ca6;color:#fff;border:1px solid #195ca6;border-radius:6px;padding:11px 20px;font-weight:bold;cursor:pointer';ok.addEventListener('click',close);
  footer.appendChild(ok);box.append(head,body,footer);overlay.appendChild(box);document.body.appendChild(overlay);document.addEventListener('keydown',onKey,true);ok.focus();
 });
})();

/* V657 — Confirmações Rescisões no centro do Chrome, visual e texto do padrão Folha. */
(function(){
 'use strict';
 let overlay=null,requestId=null,previousFocus=null;
 const frame=()=>document.querySelector('iframe[src="rescisoes/index.html"]');
 function finish(confirmed){
   if(!overlay)return;
   const id=requestId,fr=frame();
   overlay.remove();overlay=null;requestId=null;
   document.removeEventListener('keydown',onKey,true);
   if(fr?.contentWindow&&id)fr.contentWindow.postMessage({type:'LL_RESCISOES_CONFIRMACAO_RESPOSTA',requestId:id,confirmed:confirmed===true},'*');
   try{previousFocus?.focus()}catch{}previousFocus=null;
 }
 function onKey(e){
   if(!overlay)return;
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish(false)}
   else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();finish(document.activeElement?.dataset?.rescConfirm==='yes')}
 }
 function presentation(message){
   const m=String(message||'');
   if(m.startsWith('REABRIR RESCISÃO'))return {title:'REABRIR RESCISÃO',paragraphs:[
     'DESEJA REABRIR A RESCISÃO Nº '+(m.match(/Nº\s*(\d+)/)?.[1]||'')+'?',
     'AO CONFIRMAR, O CONTAS A PAGAR VINCULADO SERÁ EXCLUÍDO E A RESCISÃO VOLTARÁ PARA A SITUAÇÃO PENDENTE.',
     'O USUÁRIO RESPONSÁVEL E A DATA DA REABERTURA SERÃO REGISTRADOS NO HISTÓRICO.'
   ]};
   if(m.startsWith('GERAR RESCISÃO'))return {title:'GERAR RESCISÃO',paragraphs:[
     'DESEJA CONFIRMAR A GERAÇÃO DA RESCISÃO?',
     'AO CONFIRMAR, A RESCISÃO SERÁ GERADA E O CONTAS A PAGAR CORRESPONDENTE SERÁ CRIADO AUTOMATICAMENTE.',
     'OS VALORES SÃO ESTIMATIVOS PARA REGISTRO INTERNO. CONFIRA AS INFORMAÇÕES ANTES DE CONFIRMAR. O USUÁRIO RESPONSÁVEL E A DATA DA GERAÇÃO SERÃO REGISTRADOS NO HISTÓRICO.'
   ]};
   if(m.startsWith('EXCLUIR RESCISÃO'))return {title:'EXCLUIR RESCISÃO',paragraphs:[m,'ESTA OPERAÇÃO EXCLUIRÁ O REGISTRO E, QUANDO EXISTIR, O CONTAS A PAGAR VINCULADO. DESEJA CONTINUAR?']};
   if(m.startsWith('CONFIRMAR PAGAMENTO'))return {title:'PAGAR RESCISÃO',paragraphs:[m,'O PAGAMENTO SERÁ REGISTRADO NO FINANCEIRO E NO HISTÓRICO DA RESCISÃO. DESEJA CONTINUAR?']};
   return {title:'CONFIRMAÇÃO — RESCISÕES',paragraphs:[m]};
 }
 window.addEventListener('message',function(e){
   if(e.data?.type==='LL_RESCISOES_VOLTAR_ADMINISTRATIVO'){finish(false);return}
   const fr=frame();
   if(e.data?.type!=='LL_RESCISOES_CONFIRMACAO_CENTRO_CHROME'||!fr||e.source!==fr.contentWindow)return;
   if(overlay)finish(false);
   requestId=String(e.data.requestId||'');previousFocus=document.activeElement;
   const content=presentation(e.data.message);
   overlay=document.createElement('div');overlay.id='ll-resc-confirmacao-viewport';
   overlay.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:2147483647!important;background:rgba(6,25,55,.66)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;box-sizing:border-box!important;font-family:Arial,sans-serif';
   const box=document.createElement('section');box.setAttribute('role','alertdialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','ll-resc-confirm-title');
   box.style.cssText='width:min(475px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:#fff;border-radius:11px;box-shadow:0 18px 45px rgba(0,0,0,.3);color:#183d6b;font-size:14px;box-sizing:border-box';
   const head=document.createElement('header');head.id='ll-resc-confirm-title';head.textContent=content.title;head.style.cssText='background:#204879;color:#fff;padding:19px 20px;font-size:16px;font-weight:800';
   const body=document.createElement('div');body.style.cssText='padding:24px 20px 8px;line-height:1.5';
   content.paragraphs.forEach((line,i)=>{const para=document.createElement('p');para.textContent=line;para.style.cssText='margin:0 0 '+(i===content.paragraphs.length-1?'12px':'22px')+';white-space:pre-line';body.appendChild(para)});
   const footer=document.createElement('footer');footer.style.cssText='display:flex;justify-content:flex-end;gap:10px;padding:0 20px 20px';
   const cancel=document.createElement('button');cancel.type='button';cancel.textContent='CANCELAR';cancel.style.cssText='background:#edf4ff;color:#195495;border:1px solid #b9d4fa;border-radius:6px;padding:12px 20px;font-size:13px;font-weight:bold;cursor:pointer';cancel.addEventListener('click',()=>finish(false));
   const yes=document.createElement('button');yes.type='button';yes.textContent='CONFIRMAR';yes.dataset.rescConfirm='yes';yes.style.cssText='background:#195ba6;color:#fff;border:1px solid #195ba6;border-radius:6px;padding:12px 20px;font-size:13px;font-weight:bold;cursor:pointer';yes.addEventListener('click',()=>finish(true));
   footer.append(cancel,yes);box.append(head,body,footer);overlay.appendChild(box);document.body.appendChild(overlay);
   document.addEventListener('keydown',onKey,true);cancel.focus();
 });
})();

/* V659 — Rescisões: garantir acesso ao formulário inteiro mesmo quando a
   altura enviada pelo iframe não é atualizada (ex.: após diálogos). */
(function(){
 'use strict';
 function ajustarRolagemRescisoes(){
  var f=document.querySelector('.workspace iframe[src="rescisoes/index.html"]');
  if(!f)return;
  f.setAttribute('scrolling','no');
  f.style.overflow='hidden';
  f.style.overflowY='hidden';
  f.style.maxHeight='none';
  try{
   var doc=f.contentDocument;
   if(!doc||!doc.documentElement)return;
   var h=Math.max(doc.documentElement.scrollHeight,doc.body?doc.body.scrollHeight:0);
   if(h>150&&h<100000)f.style.height=Math.ceil(h+24)+'px';
  }catch(e){}
  var ws=f.closest('.workspace');
  if(ws){ws.style.overflowY='auto';ws.style.overscrollBehaviorY='auto';}
 }
 window.addEventListener('load',ajustarRolagemRescisoes);
 document.addEventListener('load',function(e){if(e.target&&e.target.matches&&e.target.matches('iframe[src="rescisoes/index.html"]'))ajustarRolagemRescisoes()},true);
 window.addEventListener('message',function(e){if(e.data&&e.data.type==='LL_RESCISAO_ALTURA')requestAnimationFrame(ajustarRolagemRescisoes)});
 var observer=new MutationObserver(ajustarRolagemRescisoes);
 function iniciar(){var ws=document.querySelector('.workspace');if(ws)observer.observe(ws,{childList:true,subtree:false});ajustarRolagemRescisoes()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();

/* V681 — altura real de Rescisões: medir o conteúdo do iframe,
   não a altura da janela interna. A rolagem fica na área principal. */
(function(){
 'use strict';
 var lastFrame=null, lastHeight=0;
 function sync(){
  var frame=document.querySelector('.workspace iframe[src="rescisoes/index.html"]');
  if(!frame){lastFrame=null;lastHeight=0;return}
  if(frame!==lastFrame){lastFrame=frame;lastHeight=0}
  try{
   var doc=frame.contentDocument;
   if(!doc||!doc.body)return;
   var main=doc.querySelector('main');
   if(!main)return;
   var rect=main.getBoundingClientRect();
   var bodyRect=doc.body.getBoundingClientRect();
   var height=Math.ceil(Math.max(main.scrollHeight+Math.max(0,rect.top),rect.bottom,bodyRect.bottom,doc.body.scrollHeight)+32);
   if(height<200||height>100000)return;
   frame.setAttribute('scrolling','no');
   frame.style.setProperty('overflow','hidden','important');
   frame.style.setProperty('max-height','none','important');
   if(Math.abs(height-lastHeight)>2){frame.style.setProperty('height',height+'px','important');lastHeight=height}
  }catch(e){}
 }
 window.addEventListener('message',function(e){if(e.data&&e.data.type==='LL_RESCISAO_ALTURA')requestAnimationFrame(sync)});
 document.addEventListener('load',function(e){if(e.target&&e.target.matches&&e.target.matches('iframe[src="rescisoes/index.html"]'))sync()},true);
 setInterval(sync,350);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
})();
