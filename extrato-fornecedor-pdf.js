/* PDF local do Extrato do Fornecedor; sem abrir a janela de impressão. */
window.LucasExtratoFornecedorPDF=async function(data){
 const landscape=data.orientation==='landscape', w=landscape?297:210,h=landscape?210:297, margin=12;
 const dpi=2.2,unit=96/25.4*dpi, cw=Math.round(w*unit),ch=Math.round(h*unit);
 const canvas=document.createElement('canvas');canvas.width=cw;canvas.height=ch;
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Não foi possível gerar o PDF.');
 const pages=[];let y=0;
 const txt=(v,x,yy,size=3,bold=false,max=w-margin*2)=>{ctx.fillStyle='#17365d';ctx.font=`${bold?'bold ':''}${size*unit}px Arial`;ctx.textBaseline='top';const s=String(v??'');ctx.fillText(s,x*unit,yy*unit,max*unit)};
 const line=(yy)=>{ctx.strokeStyle='#d5e0ed';ctx.lineWidth=.18*unit;ctx.beginPath();ctx.moveTo(margin*unit,yy*unit);ctx.lineTo((w-margin)*unit,yy*unit);ctx.stroke()};
 function newPage(){ctx.fillStyle='white';ctx.fillRect(0,0,cw,ch);y=margin;txt('EXTRATO DO FORNECEDOR',margin,y,4.2,true);y+=8;line(y);y+=5;txt('FORNECEDOR: '+data.supplier,margin,y,3.1,true);y+=5;txt('CÓDIGO: '+data.code+'     CPF/CNPJ: '+(data.document||'')+'     TELEFONE: '+(data.phone||''),margin,y,2.7);y+=6;line(y);y+=5;}
 function storePage(){const uri=canvas.toDataURL('image/jpeg',.87);const bin=atob(uri.split(',')[1]),bytes=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)bytes[j]=bin.charCodeAt(j);pages.push(bytes)}
 newPage();txt('RESUMO FINANCEIRO',margin,y,3.4,true);y+=6;
 const stats=data.stats||[];const col=(w-2*margin)/4;
 stats.forEach((p,i)=>{const c=i%4,r=Math.floor(i/4);txt(p[0],margin+c*col,y+r*11,2.5);txt(p[1],margin+c*col,y+r*11+4,3.4,true)});
 y+=Math.ceil(stats.length/4)*11+5;line(y);y+=6;
 txt('MOVIMENTAÇÕES DO FORNECEDOR',margin,y,3.4,true);y+=6;
 txt(data.filter||'TODAS AS MOVIMENTAÇÕES',margin,y,2.5);y+=6;
 const widths=[.11,.105,.18,.24,.12,.12,.125];const contentW=w-2*margin;
 const headers=['DATA','TIPO','DOCUMENTO','DESCRIÇÃO','VALOR','PAGO','SALDO'];
 function header(){let x=margin;headers.forEach((t,i)=>{txt(t,x,y,2.25,true,widths[i]*contentW-1);x+=widths[i]*contentW});y+=5;line(y);y+=2}
 header();
 for(const row of data.rows||[]){if(y+12>h-margin){storePage();newPage();header()}
  let x=margin;const fields=[row.date,row.type,row.doc,row.description,row.amount,row.paid,row.balance];fields.forEach((t,i)=>{const s=String(t??'');const max=widths[i]*contentW-1;ctx.font=`${2.25*unit}px Arial`;let str=s;while(str.length>1&&ctx.measureText(str).width>max*unit)str=str.slice(0,-2)+'…';txt(str,x,y,2.25,false,max);x+=widths[i]*contentW});y+=7;line(y);y+=2;
 }
 if(y+12>h-margin){storePage();newPage()}
 txt('TOTAL COMPRADO NA PESQUISA: '+(data.total||'R$ 0,00'),margin,y+4,3.2,true);
 y+=15;
 if(y+8>h-margin){storePage();newPage()}
 const emission='EMITIDO EM '+(data.issuedAt||new Date().toLocaleDateString('pt-BR'))+', POR '+(data.issuedBy||'USUÁRIO NÃO IDENTIFICADO')+'.';
 ctx.font=`bold ${2.7*unit}px Arial`;
 const emissionWidth=ctx.measureText(emission).width/unit;
 txt(emission,Math.max(margin,w-margin-emissionWidth),y,2.7,true,w-margin*2);
 storePage();
 const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
 function add(v){const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length}
 function obj(n,s){offsets[n]=length;add(`${n} 0 obj\n${s}\nendobj\n`)}
 add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>3+i*3+' 0 R').join(' ')}] /Count ${pages.length} >>`);
 const pw=w*72/25.4,ph=h*72/25.4;
 pages.forEach((jpeg,i)=>{const pn=3+i*3,im=pn+1,ct=pn+2;obj(pn,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(3)} ${ph.toFixed(3)}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>`);offsets[im]=length;add(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${cw} /Height ${ch} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');const cmd=`q ${pw.toFixed(3)} 0 0 ${ph.toFixed(3)} 0 0 cm /Im${i} Do Q\n`;obj(ct,`<< /Length ${enc.encode(cmd).length} >>\nstream\n${cmd}endstream`)});
 const xref=length;add(`xref\n0 ${3+pages.length*3}\n0000000000 65535 f \n`);for(let i=1;i<3+pages.length*3;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${3+pages.length*3} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 const blob=new Blob(parts,{type:'application/pdf'});const filename='EXTRATO_FORNECEDOR_'+String(data.code||'').replace(/[^\w-]/g,'_')+'.pdf';
 if(typeof window.showSaveFilePicker==='function')try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Documento PDF',accept:{'application/pdf':['.pdf']}}]});const stream=await handle.createWritable();await stream.write(blob);await stream.close();return 'saved'}catch(e){if(e.name==='AbortError')return 'cancelled';throw e}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return 'downloaded';
};
