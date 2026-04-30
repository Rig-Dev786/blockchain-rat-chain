'use client'
import{useState,useRef,useEffect}from 'react'

export type ContractData={tenant:string;property:string;rent:string;deposit:string;startDate:string;endDate:string}
export type Phase='wallet'|'contract'|'before'|'after'|'analysis'|'done'

const C={blue:'#1D4ED8',green:'#15803D',amber:'#B45309',red:'#B91C1C',purple:'#7C3AED'}

export function ProgressBar({phase}:{phase:Phase}){
  const steps:[Phase,string,string][]=[['contract','1','Create Contract'],['before','2','Move-In Photos'],['after','3','Move-Out Photos'],['analysis','4','AI Analysis'],['done','5','Complete']]
  const idx=steps.findIndex(s=>s[0]===phase)
  return(
    <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:'2.5rem',overflowX:'auto',paddingBottom:4}}>
      {steps.map(([p,n,label],i)=>{
        const active=i===idx,done=i<idx
        const col=done||active?C.blue:'#ECEAE3'
        return(
          <div key={p} style={{display:'flex',alignItems:'center',flexShrink:0}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:done?C.blue:active?C.blue:'#F7F6F1',border:`2px solid ${col}`,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.3s'}}>
                {done?<span style={{color:'#fff',fontSize:'0.75rem'}}>✓</span>:<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.7rem',color:active?'#fff':'#A09D97'}}>{n}</span>}
              </div>
              <span style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.62rem',color:active?C.blue:done?'#A09D97':'#C8C4BC',whiteSpace:'nowrap',fontWeight:active?600:400}}>{label}</span>
            </div>
            {i<steps.length-1&&<div style={{width:48,height:2,background:done?C.blue:'#ECEAE3',margin:'0 4px',marginBottom:20,transition:'all 0.3s',flexShrink:0}}/>}
          </div>
        )
      })}
    </div>
  )
}

export function Card({children,accent=C.blue,style={}}:{children:React.ReactNode;accent?:string;style?:React.CSSProperties}){
  return(
    <div style={{background:'#FFFFFF',border:'1px solid #ECEAE3',borderRadius:20,padding:'1.75rem',position:'relative',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.04)',...style}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${accent},${accent}88)`,borderRadius:'20px 20px 0 0'}}/>
      {children}
    </div>
  )
}

export function Btn({onClick,loading,disabled,children,accent=C.blue,ghost=false,full=false}:{onClick?:()=>void;loading?:boolean;disabled?:boolean;children:React.ReactNode;accent?:string;ghost?:boolean;full?:boolean}){
  const s:React.CSSProperties=ghost
    ?{background:'transparent',border:`1.5px solid ${accent}55`,color:accent}
    :{background:accent,color:'#fff',border:'none',boxShadow:`0 4px 14px ${accent}33`}
  return(
    <button onClick={onClick} disabled={disabled||loading}
      style={{...s,fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:'0.85rem',padding:'0.6rem 1.25rem',borderRadius:10,cursor:disabled||loading?'not-allowed':'pointer',opacity:disabled?0.5:1,display:'inline-flex',alignItems:'center',gap:6,width:full?'100%':'auto',justifyContent:full?'center':'flex-start',transition:'all 0.18s'}}
      onMouseEnter={e=>{if(!disabled&&!loading)(e.currentTarget as HTMLButtonElement).style.filter='brightness(1.08)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.filter='none'}}>
      {loading&&<svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8v8z"/></svg>}
      {children}
    </button>
  )
}

export function Field({label,value,onChange,type='text',placeholder=''}:{label:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string}){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:'#A09D97',letterSpacing:'0.12em'}}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{background:'#FAFAF8',border:'1px solid #ECEAE3',borderRadius:9,padding:'0.55rem 0.85rem',fontFamily:"'Outfit',sans-serif",fontSize:'0.85rem',color:'#111110',outline:'none',transition:'border 0.18s',width:'100%'}}
        onFocus={e=>{e.target.style.border='1px solid #C7D2FE';e.target.style.background='#FFF'}}
        onBlur={e=>{e.target.style.border='1px solid #ECEAE3';e.target.style.background='#FAFAF8'}}/>
    </div>
  )
}

export function UploadZone({file,onChange,accent=C.amber}:{file:File|null;onChange:(f:File)=>void;accent?:string}){
  const inp=useRef<HTMLInputElement>(null)
  const[drag,setDrag]=useState(false)
  return(
    <div onClick={()=>inp.current?.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)onChange(f)}}
      style={{border:`2px dashed ${drag?accent:accent+'55'}`,borderRadius:14,minHeight:140,background:drag?`${accent}08`:'#FAFAF8',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,position:'relative',overflow:'hidden',transition:'all 0.18s'}}>
      <input ref={inp} type="file" accept="image/*" hidden onChange={e=>e.target.files?.[0]&&onChange(e.target.files[0])}/>
      {file
        ?<><img src={URL.createObjectURL(file)} alt="" style={{width:'100%',height:120,objectFit:'cover',borderRadius:12,opacity:0.88}}/>
           <div style={{position:'absolute',bottom:6,left:6,right:6,background:'rgba(255,255,255,0.92)',borderRadius:6,padding:'3px 8px',fontFamily:"'JetBrains Mono',monospace",fontSize:'0.62rem',color:accent}}>✓ {file.name}</div></>
        :<><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
           <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.78rem',color:accent+'bb',fontWeight:500}}>Drop or click to upload</p></>}
    </div>
  )
}

export function Countdown({endDate}:{endDate:string}){
  const[left,setLeft]=useState('')
  const[expired,setExpired]=useState(false)
  useEffect(()=>{
    const tick=()=>{
      const diff=new Date(endDate).getTime()-Date.now()
      if(diff<=0){setExpired(true);setLeft('');return}
      const d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),m=Math.floor((diff%3600000)/60000)
      setLeft(`${d}d ${h}h ${m}m remaining`)
    }
    tick();const t=setInterval(tick,60000);return()=>clearInterval(t)
  },[endDate])
  return{left,expired}
}
