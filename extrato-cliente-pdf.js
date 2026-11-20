/* Geração local de PDF do Extrato do Cliente, sem abrir a impressão. */
window.LucasExtratoClientePDF=async function(data){
 const landscape=data.orientation==='landscape',w=landscape?297:210,h=landscape?210:297,m=12;
 const scale=96/25.4*2.2,cw=Math.round(w*scale),ch=Math.round(h*scale);
 const canvas=document.createElement('canvas');canvas.width=cw;canvas.height=ch;
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas indisponível');
 const pages=[];let y=0;
 function txt(v,x,yy,size=2.7,bold=false,max=w-2*m){ctx.fillStyle='#17365d';ctx.font=`${bold?'bold ':''}${size*scale}px Arial`;ctx.textBaseline='top';ctx.fillText(String(v??''),x*scale,yy*scale,max*scale)}
 function line(){ctx.strokeStyle='#d5e0ed';ctx.lineWidth=.2*scale;ctx.beginPath();ctx.moveTo(m*scale,y*scale);ctx.lineTo((w-m)*scale,y*scale);ctx.stroke()}
 function page(){ctx.fillStyle='white';ctx.fillRect(0,0,cw,ch);y=m;txt('EXTRATO DO CLIENTE',m,y,4.5,true);y+=9;line();y+=5;txt('CLIENTE: '+data.client,m,y,3.2,true);y+=6;txt('CÓDIGO: '+data.code+'     CPF/CNPJ: '+data.document+'     TELEFONE: '+data.phone,m,y,2.6);y+=7;line();y+=5}
 function store(){const b64=canvas.toDataURL('image/jpeg',.87).split(',')[1],bin=atob(b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);pages.push(bytes)}
 function ensure(n){if(y+n>h-m){store();page()}}
 function heading(v){ensure(14);y+=2;ctx.fillStyle='#e4eefb';ctx.fillRect(m*scale,y*scale,(w-2*m)*scale,7*scale);txt(v,m+2,y+1.6,3,true);y+=11}
 function fitted(v,max,size=2.35){let t=String(v??'');ctx.font=`${size*scale}px Arial`;while(t.length>1&&ctx.measureText(t).width>max*scale)t=t.slice(0,-2)+'…';return t}
 page();heading('RESUMO FINANCEIRO');const col=(w-2*m)/3;
 (data.stats||[]).forEach((pair,i)=>{if(i%3===0)ensure(13);let x=m+(i%3)*col;txt(fitted(pair[0],col-2,2.2),x,y,2.2);txt(fitted(pair[1],col-2,3.2),x,y+4,3.2,true);if(i%3===2||i==data.stats.length-1)y+=12});
 const names=['MOVIMENTAÇÕES DO CLIENTE','RECEBIMENTOS','VALORES EM ABERTO'];
 (data.tables||[]).forEach((table,index)=>{
  heading(names[index]||'MOVIMENTAÇÕES');const heads=table.headers||[],rows=table.rows||[],n=Math.max(heads.length,1),width=(w-2*m)/n;
  const header=()=>{ensure(8);heads.forEach((v,i)=>txt(fitted(v,width-1,2.15),m+i*width,y,2.15,true,width-1));y+=6;line();y+=2};header();
  for(const row of rows){if(y+9>h-m){store();page();heading(names[index]||'MOVIMENTAÇÕES');header()}
   row.forEach((v,i)=>txt(fitted(v,width-1,2.2),m+i*width,y,2.2,false,width-1));y+=6;line();y+=2;
  }
 });
 heading('OBSERVAÇÕES');const obs=String(data.observations||'-');for(let i=0;i<obs.length;i+=110){ensure(7);txt(obs.slice(i,i+110),m,y,2.7);y+=6}
 ensure(30);y+=14;txt('ASSINATURA DO RESPONSÁVEL',w/2-24,y,2.5);y+=12;
 const emission='Emitido em '+(data.issuedAt||new Date().toLocaleDateString('pt-BR'))+', por '+(data.issuedBy||'USUÁRIO NÃO IDENTIFICADO')+'.';
 ensure(8);ctx.font=`bold ${2.6*scale}px Arial`;const ew=ctx.measureText(emission).width/scale;txt(emission,Math.max(m,w-m-ew),y,2.6,true);store();
 const enc=new TextEncoder(),parts=[],offsets=[0];let len=0;
 function add(v){const b=typeof v==='string'?enc.encode(v):v;parts.push(b);len+=b.length}
 function obj(n,s){offsets[n]=len;add(`${n} 0 obj\n${s}\nendobj\n`)}
 add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>3+i*3+' 0 R').join(' ')}] /Count ${pages.length} >>`);
 const pw=w*72/25.4,ph=h*72/25.4;
 pages.forEach((jpg,i)=>{const pn=3+i*3,im=pn+1,ct=pn+2;obj(pn,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(3)} ${ph.toFixed(3)}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>`);offsets[im]=len;add(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${cw} /Height ${ch} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);add(jpg);add('\nendstream\nendobj\n');const cmd=`q ${pw.toFixed(3)} 0 0 ${ph.toFixed(3)} 0 0 cm /Im${i} Do Q\n`;obj(ct,`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`)});
 const xref=len;add(`xref\n0 ${3+pages.length*3}\n0000000000 65535 f \n`);for(let i=1;i<3+pages.length*3;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${3+pages.length*3} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 const blob=new Blob(parts,{type:'application/pdf'}),filename='EXTRATO_CLIENTE_'+String(data.code||'').replace(/[^\w-]/g,'_')+'.pdf';
 if(typeof window.showSaveFilePicker==='function')try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const stream=await handle.createWritable();await stream.write(blob);await stream.close();return 'saved'}catch(e){if(e.name==='AbortError')return 'cancelled';throw e}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return 'downloaded';
};
