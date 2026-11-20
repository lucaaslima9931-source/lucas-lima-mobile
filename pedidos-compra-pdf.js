/* Exportação local da entrada de estoque para PDF, sem abrir a impressão. */
window.LucasPedidoCompraPDF=async function(data){
 const landscape=data.orientation==='landscape',w=landscape?297:210,h=landscape?210:297,m=12,unit=96/25.4*2;
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*unit);canvas.height=Math.round(h*unit);
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Não foi possível gerar o PDF.');
 const pages=[];let y=0;const blue='#153f79',cw=w-2*m;
 const font=(sz,bold=false)=>{ctx.font=`${bold?'bold ':''}${sz*unit}px Arial`;ctx.fillStyle=blue;ctx.textBaseline='top'};
 function lines(s,max,sz,bold=false){font(sz,bold);const words=String(s??'').split(/\s+/);const out=[];let cur='';for(const word of words){const next=cur?cur+' '+word:word;if(ctx.measureText(next).width>max*unit&&cur){out.push(cur);cur=word}else cur=next}if(cur)out.push(cur);return out}
 function text(s,x,yy,sz=3,bold=false,max=cw){const ls=lines(s,max,sz,bold);ls.forEach((l,i)=>ctx.fillText(l,x*unit,(yy+i*(sz+1))*unit));return ls.length*(sz+1)}
 function rule(yy){ctx.strokeStyle='#c5d8f0';ctx.lineWidth=.25*unit;ctx.beginPath();ctx.moveTo(m*unit,yy*unit);ctx.lineTo((w-m)*unit,yy*unit);ctx.stroke()}
 function page(){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);y=m}
 function savePage(){const bin=atob(canvas.toDataURL('image/jpeg',.9).split(',')[1]);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);pages.push(bytes)}
 function need(n){if(y+n>h-m){savePage();page();text('PEDIDO DE COMPRA — CONTINUAÇÃO',m,y,3.4,true);y+=10}}
 function heading(s){need(13);y+=4;text(s,m,y,3.5,true);y+=7;rule(y);y+=3}
 function row(values,widths,header=false){const prepared=values.map((v,i)=>lines(v,widths[i]-2,header?2.4:2.7,header));const ht=Math.max(...prepared.map(a=>a.length))*3.8+3;need(ht+2);if(header){ctx.fillStyle='#e9eff7';ctx.fillRect(m*unit,(y-1)*unit,cw*unit,ht*unit)}let x=m;prepared.forEach((ls,i)=>{font(header?2.4:2.7,header);ls.forEach((s,j)=>ctx.fillText(s,(x+1)*unit,(y+j*3.8)*unit));x+=widths[i]});y+=ht;rule(y);y+=1}
 page();let logo=data.logo;if(logo){try{const img=new Image();img.src=logo;await img.decode();const iw=Math.min(34,img.naturalWidth/img.naturalHeight*24);ctx.drawImage(img,m*unit,y*unit,iw*unit,24*unit)}catch{logo=null}}
 const start=m+(logo?39:0);text(data.company||'LOJA NÃO CADASTRADA',start,y+1,4.5,true,w-m-start);let detailsY=y+8;for(const s of data.details||[])if(s)detailsY+=text(s,start,detailsY,2.6,false,w-m-start);y=Math.max(y+27,detailsY+3);rule(y);y+=5;
 ctx.fillStyle='#e5effc';ctx.fillRect(m*unit,y*unit,cw*unit,10*unit);font(4.2,true);ctx.textAlign='center';ctx.fillText('PEDIDO DE COMPRA',w/2*unit,(y+2.3)*unit);ctx.textAlign='left';y+=16;
 y+=text('Nº DO PEDIDO: '+data.number+'       DATA: '+data.date,m,y,3.1,true)+2;
 y+=text('FORNECEDOR: '+data.supplier,m,y,3.1,false)+2;
 y+=text('SITUAÇÃO: '+data.status,m,y,3.1,false)+2;
 y+=text('USUÁRIO: '+data.user,m,y,3,false)+3;
 if(data.showItems){heading('PRODUTOS DO PEDIDO');const widths=[cw*.15,cw*.70,cw*.15];row(['CÓD.','DESCRIÇÃO','QTD.'],widths,true);for(const r of data.items)row(r,widths)}
 if(data.showNotes){heading('OBSERVAÇÕES');need(10);y+=text(data.notes||'—',m,y,3,false)+5}
 if(data.showSignature){need(35);y+=22;ctx.strokeStyle='#333';ctx.lineWidth=.3*unit;ctx.beginPath();ctx.moveTo((w/2-42)*unit,y*unit);ctx.lineTo((w/2+42)*unit,y*unit);ctx.stroke();font(3,true);ctx.textAlign='center';ctx.fillText('RESPONSÁVEL PELO PEDIDO',w/2*unit,(y+3)*unit);ctx.textAlign='left'}
 need(15);y+=9;font(2.7,true);ctx.textAlign='right';ctx.fillText('EMITIDO EM '+(data.issuedAt||new Date().toLocaleDateString('pt-BR'))+', POR '+(data.issuedBy||'USUÁRIO NÃO IDENTIFICADO')+'.',(w-m)*unit,y*unit);ctx.textAlign='left';
 savePage();
 const enc=new TextEncoder(),parts=[],offsets=[0];let len=0;function add(v){const b=typeof v==='string'?enc.encode(v):v;parts.push(b);len+=b.length}function obj(n,s){offsets[n]=len;add(`${n} 0 obj\n${s}\nendobj\n`)}
 add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>3+i*3+' 0 R').join(' ')}] /Count ${pages.length} >>`);
 const pw=w*72/25.4,ph=h*72/25.4;
 pages.forEach((jpeg,i)=>{const pn=3+i*3,im=pn+1,ct=pn+2;obj(pn,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(3)} ${ph.toFixed(3)}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>`);offsets[im]=len;add(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');const cmd=`q ${pw.toFixed(3)} 0 0 ${ph.toFixed(3)} 0 0 cm /Im${i} Do Q\n`;obj(ct,`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`)});
 const xref=len;add(`xref\n0 ${3+pages.length*3}\n0000000000 65535 f \n`);for(let i=1;i<3+pages.length*3;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${3+pages.length*3} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 const blob=new Blob(parts,{type:'application/pdf'}),filename='PEDIDO_COMPRA_'+String(data.number).replace(/[^\w-]/g,'_')+'.pdf';
 if(typeof window.showSaveFilePicker==='function'){try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const writable=await handle.createWritable();await writable.write(blob);await writable.close();return 'saved'}catch(e){if(e.name==='AbortError')return 'cancelled';throw e}}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return 'downloaded';
};
