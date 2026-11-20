/* Exportação local PDF para bobinas 40, 56 e 80 mm; sem bibliotecas externas. */
window.LucasTrocaSalvarPDF=async function(html,filename){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const widthMM=[40,56,80].includes(Number(doc.querySelector('meta[name="receipt-width-mm"]')?.content))?Number(doc.querySelector('meta[name="receipt-width-mm"]')?.content):80,scale=5,margin=1.5,usable=widthMM-2*margin;
 const content=[];
 const push=(t,bold=false,center=false)=>content.push({text:String(t||'').trim(),bold,center});
 const loja=doc.querySelector('.loja');if(loja)push(loja.textContent,true,true);
 const titulo=doc.querySelector('.titulo');if(titulo)push(titulo.textContent,true,true);
 for(const section of doc.querySelectorAll('section')){
  push('--------------------------------');
  for(const el of section.children){
   if(el.matches('h2'))push(el.textContent,true);
   else if(el.matches('.linha'))push(el.textContent.replace(/\s+/g,' '));
   else if(el.matches('.destaque'))push(el.textContent,true);
   else if(el.matches('.item')){
    const children=el.children;
    for(const c of children)push(c.textContent.replace(/\s+/g,' '));
   }
  }
 }
 const footer=doc.querySelector('footer');if(footer){push('--------------------------------');push(footer.textContent,false,true)}
 const lineHeight=3.2, fontSize=2.05;
 const measure=document.createElement('canvas').getContext('2d');measure.font=`${fontSize*scale}px Arial`;
 const wrapped=[];
 for(const row of content){
  const words=row.text.split(/\s+/);let line='';
  for(const word of words){const candidate=line?line+' '+word:word;
   if(measure.measureText(candidate).width>usable*scale&&line){wrapped.push({...row,text:line});line=word}
   else line=candidate;
  }
  if(line)wrapped.push({...row,text:line});
 }
 const heightMM=Math.max(25,wrapped.length*lineHeight+margin*2+2);
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(widthMM*scale);canvas.height=Math.ceil(heightMM*scale);
 const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#111';ctx.textBaseline='top';
 wrapped.forEach((row,i)=>{ctx.font=`${row.bold?'bold ':''}${fontSize*scale}px Arial`;ctx.textAlign=row.center?'center':'left';ctx.fillText(row.text,(row.center?widthMM/2:margin)*scale,(margin+i*lineHeight)*scale,usable*scale)});
 const raw=atob(canvas.toDataURL('image/jpeg',.95).split(',')[1]);const jpeg=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)jpeg[i]=raw.charCodeAt(i);
 const encoder=new TextEncoder(),parts=[],offsets=[0];let length=0;
 const add=v=>{const b=typeof v==='string'?encoder.encode(v):v;parts.push(b);length+=b.length};
 const obj=(n,v)=>{offsets[n]=length;add(`${n} 0 obj\n${v}\nendobj\n`)};
 const pw=widthMM*72/25.4,ph=heightMM*72/25.4;
 add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(3)} ${ph.toFixed(3)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
 offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');
 const cmd=`q ${pw.toFixed(3)} 0 0 ${ph.toFixed(3)} 0 0 cm /Im0 Do Q\n`;obj(5,`<< /Length ${encoder.encode(cmd).length} >>\nstream\n${cmd}endstream`);
 const xref=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 const blob=new Blob(parts,{type:'application/pdf'});
 if(typeof window.showSaveFilePicker==='function'){
  try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Arquivo PDF',accept:{'application/pdf':['.pdf']}}]});const stream=await handle.createWritable();await stream.write(blob);await stream.close();return}
  catch(e){if(e.name==='AbortError')return;if(e.name!=='SecurityError'&&e.name!=='NotAllowedError')throw e}
 }
 // Em páginas file://, Chrome pode impedir o seletor de arquivos. Neste caso, usa o download nativo.
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
};
