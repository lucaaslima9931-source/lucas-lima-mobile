/* LUCAS LIMA V233 — Exportação da ficha de produto para PDF local. */
window.LucasFichaProdutoPDF=async function(info){
 const landscape=!!info.landscape,w=landscape?297:210,h=landscape?210:297,m=13,scale=96/25.4*2;
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Não foi possível gerar o PDF.');
 let y=m;const pages=[];
 function text(s,x,yy,sz=3,bold=false,max=w-m*2){ctx.fillStyle='#12345a';ctx.font=(bold?'bold ':'')+(sz*scale)+'px Arial';ctx.textBaseline='top';ctx.fillText(String(s??''),x*scale,yy*scale,max*scale)}
 function line(){ctx.strokeStyle='#d2dfec';ctx.lineWidth=.2*scale;ctx.beginPath();ctx.moveTo(m*scale,y*scale);ctx.lineTo((w-m)*scale,y*scale);ctx.stroke()}
 function page(){ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);y=m;text('LOJA 01 – MATRIZ',m,y,5,true);y+=7;text(info.company||'NOME DA LOJA NÃO CADASTRADO',m,y,3.5,true);y+=7;text('FICHA DO PRODUTO',m,y,4,true);y+=6;line();y+=5;text(info.description||'',m,y,4,true);y+=9}
 function store(){const footer=String(info.emission||'EMITIDO EM '+new Date().toLocaleDateString('pt-BR')+', POR USUÁRIO NÃO IDENTIFICADO.');ctx.font='bold '+(2.7*scale)+'px Arial';ctx.fillStyle='#12345a';ctx.textAlign='right';ctx.fillText(footer,(w-m)*scale,(h-m+3)*scale);ctx.textAlign='left';const uri=canvas.toDataURL('image/jpeg',.9),bin=atob(uri.split(',')[1]),b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);pages.push(b)}
 function ensure(space){if(y+space>h-m){store();page()}}
 page();let photoHeight=0;const rows=info.rows||[];
 if(typeof info.image==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/i.test(info.image)){
  try{const photo=new Image();photo.src=info.image;await photo.decode();const maxW=48,maxH=48;const ratio=Math.min(maxW/photo.naturalWidth,maxH/photo.naturalHeight);const dw=photo.naturalWidth*ratio,dh=photo.naturalHeight*ratio;ensure(dh+7);ctx.drawImage(photo,(w-m-dw)*scale,y*scale,dw*scale,dh*scale);photoHeight=dh+7;}catch(e){/* foto inválida não impede salvar */}
 }
 const initialY=y;const col=(w-m*2)/2;
 for(let i=0;i<rows.length;i+=2){ensure(13);const besidePhoto=photoHeight>0&&y<initialY+photoHeight;const available=besidePhoto?w-m*2-52:w-m*2;const localCol=available/2;
  for(let j=0;j<2;j++){const item=rows[i+j];if(!item)continue;const x=m+j*localCol;text(item[0],x,y,2.6,true,localCol-5);text(item[1],x,y+4,3,false,localCol-5)}y+=12;line();y+=2}
 y=Math.max(y,initialY+photoHeight);
 if(info.barcode){ensure(12);text('CÓDIGO DE BARRAS: '+info.barcode,m,y,3);y+=9}
 if(info.history&&info.history.length){ensure(14);text('HISTÓRICO DE ALTERAÇÕES',m,y,3.7,true);y+=8;for(const item of info.history){ensure(10);text(item.join('  |  '),m,y,2.6,false,w-m*2);y+=7;line();y+=2}}
 store();
 const enc=new TextEncoder(),parts=[],offsets=[0];let len=0;
 const add=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);len+=b.length};
 const obj=(n,s)=>{offsets[n]=len;add(`${n} 0 obj\n${s}\nendobj\n`)};
 add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>3+i*3+' 0 R').join(' ')}] /Count ${pages.length} >>`);
 const pw=w*72/25.4,ph=h*72/25.4;
 pages.forEach((jpeg,i)=>{const n=3+i*3;obj(n,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(3)} ${ph.toFixed(3)}] /Resources << /XObject << /Im${i} ${n+1} 0 R >> >> /Contents ${n+2} 0 R >>`);offsets[n+1]=len;add(`${n+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');const cmd=`q ${pw.toFixed(3)} 0 0 ${ph.toFixed(3)} 0 0 cm /Im${i} Do Q\n`;obj(n+2,`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`)});
 const xref=len;add(`xref\n0 ${3+pages.length*3}\n0000000000 65535 f \n`);for(let i=1;i<3+pages.length*3;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${3+pages.length*3} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 const blob=new Blob(parts,{type:'application/pdf'}),filename='FICHA_PRODUTO_'+String(info.code||'').replace(/[^\w-]/g,'_')+'.pdf';
 if(typeof window.showSaveFilePicker==='function')try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const stream=await handle.createWritable();await stream.write(blob);await stream.close();return 'saved'}catch(e){if(e.name==='AbortError')return 'cancelled';throw e}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return 'downloaded';
};
