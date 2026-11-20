/* V395 — PDF local do Caixa, sem impressão intermediária. */
window.LucasCaixaSalvarPDF=async function(html,orientation,filename){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const landscape=orientation==='landscape',w=landscape?297:210,h=landscape?210:297,margin=10,scale=4;
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas indisponível');
 const pages=[];let y=0;const maxY=h-margin-9;
 function txt(t,x,yy,size=2.4,bold=false,maxWidth=w-2*margin,align='left'){
  ctx.fillStyle='#111';ctx.font=`${bold?'bold ':''}${size*scale}px Arial`;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(String(t||''),x*scale,yy*scale,maxWidth*scale);ctx.textAlign='left';
 }
 function line(yy){ctx.strokeStyle='#bbb';ctx.lineWidth=.18*scale;ctx.beginPath();ctx.moveTo(margin*scale,yy*scale);ctx.lineTo((w-margin)*scale,yy*scale);ctx.stroke()}
 function page(){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);y=margin;}
 function store(){const footer=doc.querySelector('footer')?.textContent||'';line(h-margin-5);txt(footer,w-margin,h-margin-3,2.2,false,w-2*margin,'right');const data=canvas.toDataURL('image/jpeg',.87).split(',')[1],binary=atob(data),arr=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)arr[i]=binary.charCodeAt(i);pages.push(arr)}
 function ensure(height){if(y+height>maxY){store();page()}}
 function row(label,value,bold=false){ensure(5);txt(label,margin+2,y,2.6,bold,w*.64);txt(value,w-margin-2,y,2.6,bold,w*.30,'right');y+=5;line(y)}
 page();const header=doc.querySelector('header');if(header){for(const el of header.children){const sz=el.tagName==='H1'?4.4:el.tagName==='H2'?3.8:2.4;txt(el.textContent,w/2,y,sz,true,w-2*margin,'center');y+=sz+2}}y+=4;
 for(const group of doc.querySelectorAll('.payment')){
  ensure(22);txt(group.querySelector('h3')?.textContent||'',margin,y,3.3,true);y+=6;line(y);y+=2;
  const trs=[...group.querySelectorAll('table tr')];const fractions=[.095,.075,.105,.025,.245,.09,.065,.095,.10,.105];const avail=w-2*margin;
  for(const [idx,tr] of trs.entries()){
   const cells=[...tr.querySelectorAll('th,td')].map(e=>e.textContent.trim());
   const isHead=idx===0;const size=landscape?2.25:1.75;
   const desc=cells[4]||'';const lines=Math.max(1,Math.ceil(desc.length/(landscape?36:23)));
   const rh=isHead?6:Math.max(5,lines*3.1+1);ensure(rh);
   let x=margin;cells.forEach((v,i)=>{const cw=avail*fractions[i];if(i===4&&lines>1){const width=landscape?36:23;for(let j=0;j<lines;j++)txt(v.slice(j*width,(j+1)*width),x+.5,y+j*3.1,size,isHead,cw-1)}else txt(v,x+.5,y,size,isHead,cw-1);x+=cw});y+=rh;line(y);
  }
  for(const t of group.querySelectorAll('.totals div')){const match=t.textContent.match(/^(ENTRADAS|SAÍDAS):\s*(.*)$/i);if(match){ensure(5);txt(match[1]+':',w-margin-34,y,2.6,true,25);txt(match[2],w-margin,y,2.6,true,26,'right');y+=5}}
  y+=8;
 }
 ensure(38);const summaries=[...doc.querySelectorAll('.summaries section')];
 for(let i=0;i<summaries.length;i++){
  const x=margin+i*(w-2*margin)/2,sw=(w-2*margin)/2-3;
  txt(summaries[i].querySelector('h3')?.textContent||'',x+sw/2,y,3,true,sw,'center');
  [...summaries[i].querySelectorAll('tr')].forEach((tr,j)=>{const cells=[...tr.querySelectorAll('td')].map(t=>t.textContent);txt(cells[0],x+2,y+7+j*5,2.5,j===4,sw*.7);txt(cells[1],x+sw,y+7+j*5,2.5,j===4,sw*.3,'right')});
 }
 store();
 const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
 function add(v){const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length}
 function obj(n,s){offsets[n]=length;add(`${n} 0 obj\n${s}\nendobj\n`)}
 add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>3+i*3+' 0 R').join(' ')}] /Count ${pages.length} >>`);
 const pw=w*72/25.4,ph=h*72/25.4;
 pages.forEach((jpeg,i)=>{const n=3+i*3;obj(n,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(3)} ${ph.toFixed(3)}] /Resources << /XObject << /Im${i} ${n+1} 0 R >> >> /Contents ${n+2} 0 R >>`);offsets[n+1]=length;add(`${n+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');const cmd=`q ${pw.toFixed(3)} 0 0 ${ph.toFixed(3)} 0 0 cm /Im${i} Do Q\n`;obj(n+2,`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`)});
 const xref=length;add(`xref\n0 ${3+pages.length*3}\n0000000000 65535 f \n`);for(let i=1;i<3+pages.length*3;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${3+pages.length*3} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 const blob=new Blob(parts,{type:'application/pdf'});
 if(typeof window.showSaveFilePicker==='function'){
  try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Arquivo PDF',accept:{'application/pdf':['.pdf']}}]});const stream=await handle.createWritable();await stream.write(blob);await stream.close();return}catch(e){if(e.name==='AbortError')return; if(e.name!=='SecurityError'&&e.name!=='NotAllowedError')throw e}
 }
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
};
