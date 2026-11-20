/* V388: salvar comprovante de estorno em PDF diretamente, sem chamar window.print. */
window.LucasEstornoPDF=async function(data){
 const landscape=!!data.landscape,w=landscape?297:210,h=landscape?210:297,m=13,scale=96/25.4*2;
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas indisponível.');
 const pages=[];let y=m;const cw=w-2*m;
 function font(sz,bold){ctx.font=(bold?'bold ':'')+(sz*scale)+'px Arial';ctx.fillStyle='#173b6b';ctx.textBaseline='top'}
 function lines(value,max,sz,bold){font(sz,bold);const result=[];let cur='';for(const word of String(value??'—').split(/\s+/)){const next=cur?cur+' '+word:word;if(ctx.measureText(next).width>max*scale&&cur){result.push(cur);cur=word}else cur=next}if(cur)result.push(cur);return result.length?result:['']}
 function text(value,x,yy,sz=3,bold=false,max=cw){const ls=lines(value,max,sz,bold);font(sz,bold);ls.forEach((v,i)=>ctx.fillText(v,x*scale,(yy+i*(sz+1))*scale));return ls.length*(sz+1)}
 function rule(){ctx.strokeStyle='#c9d8e9';ctx.lineWidth=.25*scale;ctx.beginPath();ctx.moveTo(m*scale,y*scale);ctx.lineTo((w-m)*scale,y*scale);ctx.stroke()}
 function page(){ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);y=m;text(data.company||'LUCAS LIMA',m,y,5,true);y+=8;text('COMPROVANTE DE ESTORNO',m,y,4,true);y+=7;rule();y+=6}
 function store(){font(2.6,true);ctx.textAlign='right';ctx.fillText(String(data.emission||''),(w-m)*scale,(h-m+3)*scale);ctx.textAlign='left';const bin=atob(canvas.toDataURL('image/jpeg',.88).split(',')[1]);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);pages.push(bytes)}
 function need(space){if(y+space>h-m-12){store();page()}}
 function field(label,value){const ht=Math.max(5,lines(label+': '+value,cw,3,false).length*4);need(ht+1);y+=text(label+': '+value,m,y,3,false);y+=2}
 function heading(label){need(13);y+=5;text(label,m,y,3.8,true);y+=7;rule();y+=4}
 function tableRow(values,widths,header=false){const arr=values.map((v,i)=>lines(v,widths[i]-2,header?2.5:2.7,header));const ht=Math.max(...arr.map(x=>x.length))*3.8+3;need(ht+2);if(header){ctx.fillStyle='#eaf1fc';ctx.fillRect(m*scale,(y-1)*scale,cw*scale,ht*scale)}let x=m;arr.forEach((ls,i)=>{font(header?2.5:2.7,header);ls.forEach((v,j)=>ctx.fillText(v,(x+1)*scale,(y+j*3.8)*scale));x+=widths[i]});y+=ht;rule();y+=2}
 page();need(12);ctx.fillStyle=data.realized?'#e0f3e8':'#fff0d8';ctx.fillRect(m*scale,y*scale,cw*scale,10*scale);font(4.2,true);ctx.textAlign='center';ctx.fillText(data.realized?'ESTORNO REALIZADO':'NENHUM ESTORNO REALIZADO',w/2*scale,(y+2)*scale);ctx.textAlign='left';y+=17;
 field('TIPO',data.kind);field('Nº DO DOCUMENTO',data.number);if(data.original)field('VENDA ORIGINAL',data.original);field('CLIENTE',data.customer);field('SITUAÇÃO DO DOCUMENTO',data.status);
 if(data.showPayments){heading('RESUMO POR FORMA DE PAGAMENTO');const widths=[cw*.43,cw*.19,cw*.19,cw*.19];tableRow(['FORMA','RECEBIDO','ESTORNADO','PENDENTE'],widths,true);for(const row of data.payments||[])tableRow(row,widths)}
 heading('ESTORNOS REALIZADOS');const widths=data.showOperators?[cw*.22,cw*.28,cw*.17,cw*.19,cw*.14]:[cw*.30,cw*.45,cw*.25];tableRow(data.showOperators?['DATA','FORMA','VALOR','OPERADOR','CAIXA']:['DATA','FORMA','VALOR'],widths,true);
 if(!(data.history||[]).length)tableRow(data.showOperators?['NENHUM','—','—','—','—']:['NENHUM ESTORNO','—','—'],widths);
 else for(const row of data.history)tableRow(data.showOperators?row:row.slice(0,3),widths);
 need(15);y+=7;text('TOTAL ESTORNADO: '+data.total,m,y,4.2,true);store();
 const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;function add(v){const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length}function obj(n,v){offsets[n]=length;add(n+' 0 obj\n'+v+'\nendobj\n')}
 add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] /Count '+pages.length+' >>');
 const pw=w*72/25.4,ph=h*72/25.4;
 pages.forEach((jpeg,i)=>{const n=3+i*3;obj(n,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pw.toFixed(3)+' '+ph.toFixed(3)+'] /Resources << /XObject << /Im'+i+' '+(n+1)+' 0 R >> >> /Contents '+(n+2)+' 0 R >>');offsets[n+1]=length;add((n+1)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+canvas.width+' /Height '+canvas.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');add(jpeg);add('\nendstream\nendobj\n');const cmd='q '+pw.toFixed(3)+' 0 0 '+ph.toFixed(3)+' 0 0 cm /Im'+i+' Do Q\n';obj(n+2,'<< /Length '+enc.encode(cmd).length+' >>\nstream\n'+cmd+'endstream')});
 const xref=length;add('xref\n0 '+(3+pages.length*3)+'\n0000000000 65535 f \n');for(let i=1;i<3+pages.length*3;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size '+(3+pages.length*3)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
 const blob=new Blob(parts,{type:'application/pdf'}),filename='ESTORNO_'+String(data.kind||'DOCUMENTO').replace(/[^\w-]/g,'_')+'_'+String(data.number||'').replace(/[^\w-]/g,'_')+'.pdf';
 if(typeof window.showSaveFilePicker==='function')try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const stream=await handle.createWritable();await stream.write(blob);await stream.close();return 'saved'}catch(e){if(e.name==='AbortError')return 'cancelled';throw e}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return 'downloaded';
};
