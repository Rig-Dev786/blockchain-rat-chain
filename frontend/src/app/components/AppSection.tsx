'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther } from 'viem'
import { CONTRACT_ADDRESS, RENT_PROOF_ABI, truncateAddress, API_BASE_URL } from '@/lib/contract'

type AR = { status: 'damage'|'no_damage'; score: number; details: string }|null
type Toast = { msg: string; type: 'success'|'error'|'info' }|null

const C = { blue:'#1D4ED8', green:'#15803D', amber:'#B45309', red:'#B91C1C', purple:'#7C3AED' }

function useTilt(s=8){
  const r=useRef<HTMLDivElement>(null)
  const mm=useCallback((e:React.MouseEvent<HTMLDivElement>)=>{
    if(!r.current)return
    const b=r.current.getBoundingClientRect()
    const x=((e.clientX-b.left)/b.width-.5)*s
    const y=((e.clientY-b.top)/b.height-.5)*-s
    r.current.style.transform=`perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateZ(8px)`
    r.current.style.transition='transform 0.1s ease'
  },[s])
  const ml=useCallback(()=>{
    if(!r.current)return
    r.current.style.transform='perspective(800px) rotateX(0) rotateY(0) translateZ(0)'
    r.current.style.transition='transform 0.4s ease'
  },[])
  return {ref:r,onMouseMove:mm,onMouseLeave:ml}
}

function Card({children,accent=C.blue,className=''}:{children:React.ReactNode;accent?:string;className?:string}){
  const t=useTilt()
  return(
    <div ref={t.ref} onMouseMove={t.onMouseMove} onMouseLeave={t.onMouseLeave}
      className={`relative rounded-2xl p-6 transition-shadow duration-200 ${className}`}
      style={{background:'#FFFFFF',border:'1px solid #ECEAE3',boxShadow:'0 1px 8px rgba(0,0,0,0.04)',transformStyle:'preserve-3d'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=`0 8px 32px rgba(0,0,0,0.09), 0 0 0 1.5px ${accent}44`}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 8px rgba(0,0,0,0.04)'}}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{background:`linear-gradient(90deg,transparent,${accent}66,transparent)`}}/>
      {children}
    </div>
  )
}

function Btn({onClick,loading,disabled,children,accent=C.blue,ghost=false}:{onClick?:()=>void;loading?:boolean;disabled?:boolean;children:React.ReactNode;accent?:string;ghost?:boolean}){
  const base:React.CSSProperties=ghost
    ?{background:'transparent',border:`1.5px solid ${accent}44`,color:accent}
    :{background:accent,color:'#fff',border:'none',boxShadow:`0 4px 14px ${accent}33`}
  return(
    <button onClick={onClick} disabled={disabled||loading}
      style={{...base,fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:'0.82rem',padding:'0.55rem 1.1rem',borderRadius:10,cursor:'pointer',transition:'all 0.18s',opacity:disabled?0.45:1,display:'inline-flex',alignItems:'center',gap:6}}
      onMouseEnter={e=>{if(!disabled&&!loading)(e.currentTarget as HTMLButtonElement).style.filter='brightness(1.1)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.filter='none'}}>
      {loading&&<svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8v8z"/></svg>}
      {children}
    </button>
  )
}

function Pill({label,active,accent=C.blue}:{label:string;active:boolean;accent?:string}){
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:'0.7rem',fontFamily:"'JetBrains Mono',monospace",padding:'0.25rem 0.65rem',borderRadius:999,background:active?`${accent}12`:'#F7F6F1',border:`1px solid ${active?accent+'33':'#ECEAE3'}`,color:active?accent:'#A09D97'}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:active?accent:'#C8C4BC',display:'inline-block'}}/>
      {label}
    </span>
  )
}

function ToastEl({t}:{t:Toast}){
  if(!t)return null
  const map={success:{bg:'#F0FDF4',border:'#BBF7D0',color:C.green},error:{bg:'#FEF2F2',border:'#FCA5A5',color:C.red},info:{bg:'#EEF2FF',border:'#C7D2FE',color:C.blue}}[t.type]
  return <div style={{position:'fixed',bottom:24,right:24,zIndex:999,background:map.bg,border:`1px solid ${map.border}`,color:map.color,fontFamily:"'JetBrains Mono',monospace",fontSize:'0.78rem',padding:'0.7rem 1.1rem',borderRadius:12,boxShadow:'0 4px 20px rgba(0,0,0,0.08)',animation:'fadein 0.3s ease'}}>{t.msg}</div>
}

function Upload({label,file,onChange,accent}:{label:string;file:File|null;onChange:(f:File)=>void;accent:string}){
  const inp=useRef<HTMLInputElement>(null)
  const [drag,setDrag]=useState(false)
  return(
    <div onClick={()=>inp.current?.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)onChange(f)}}
      style={{border:`1.5px dashed ${drag?accent:accent+'55'}`,borderRadius:12,minHeight:110,background:drag?`${accent}08`:'#FAFAF8',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,position:'relative',overflow:'hidden',transition:'all 0.18s'}}>
      <input ref={inp} type="file" accept="image/*" hidden onChange={e=>e.target.files?.[0]&&onChange(e.target.files[0])}/>
      {file
        ?<img src={URL.createObjectURL(file)} alt={label} style={{width:'100%',height:100,objectFit:'cover',borderRadius:10,opacity:0.85}}/>
        :<><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.75rem',color:accent+'bb'}}>{label}</p>
        <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:'#C8C4BC'}}>drag & drop or click</p></>}
      {file&&<div style={{position:'absolute',bottom:6,left:6,right:6,background:'rgba(255,255,255,0.9)',borderRadius:6,padding:'2px 6px',fontSize:'0.65rem',fontFamily:"'JetBrains Mono',monospace",color:accent,truncate:true}}>✓ {file.name}</div>}
    </div>
  )
}

export default function AppSection(){
  const {address,isConnected,chain}=useAccount()
  const {connect}=useConnect()
  const {disconnect}=useDisconnect()
  const {writeContract,data:txHash,isPending:txPending}=useWriteContract()
  const {isLoading:txConf,isSuccess:txOk}=useWaitForTransactionReceipt({hash:txHash})
  const [amt,setAmt]=useState('0.01')
  const [bf,setBf]=useState<File|null>(null)
  const [af,setAf]=useState<File|null>(null)
  const [uploading,setUploading]=useState(false)
  const [done,setDone]=useState({before:false,after:false})
  const [analyzing,setAnalyzing]=useState(false)
  const [result,setResult]=useState<AR>(null)
  const [toast,setToast]=useState<Toast>(null)
  const [al,setAl]=useState<string|null>(null)
  const [scan,setScan]=useState(false)

  const show=(msg:string,type:Toast['type']='info')=>{setToast({msg,type});setTimeout(()=>setToast(null),3500)}
  useEffect(()=>{if(txOk){show('Transaction confirmed!','success');setAl(null)}},[txOk])

  const call=(fn:string,val?:bigint,tag='')=>{
    if(!isConnected)return show('Connect wallet first','error')
    setAl(tag)
    try{writeContract({address:CONTRACT_ADDRESS,abi:RENT_PROOF_ABI,functionName:fn as any,...(val?{value:val}:{})}as any);show('Transaction sent!','info')}
    catch(e:any){show(e?.message?.slice(0,60)??"Failed",'error');setAl(null)}
  }

  const handleUpload=async()=>{
    if(!bf||!af)return show('Select both images','error')
    setUploading(true)
    try{
      const up=(f:File,ep:string)=>{const fd=new FormData();fd.append('file',f);return fetch(`${API_BASE_URL}/${ep}`,{method:'POST',body:fd}).then(r=>{if(!r.ok)throw new Error(r.statusText);return r.json()})}
      await Promise.all([up(bf,'upload-before'),up(af,'upload-after')])
      setDone({before:true,after:true});show('Images uploaded!','success')
    }catch(e:any){show(e.message??'Upload failed','error')}
    finally{setUploading(false)}
  }

  const handleAnalyze=async()=>{
    if(!done.before||!done.after)return show('Upload images first','error')
    setAnalyzing(true);setScan(true)
    try{
      const r=await fetch(`${API_BASE_URL}/analyze`,{method:'POST'})
      const d:AR=await r.json();setResult(d)
      show(d?.status==='damage'?`Damage detected (${d?.score})`:'No damage!',d?.status==='damage'?'error':'success')
    }catch{setResult({status:'no_damage',score:0.96,details:'Demo – backend not connected'});show('Demo mode','info')}
    finally{setAnalyzing(false);setTimeout(()=>setScan(false),2000)}
  }

  const lbl:{[k:string]:string}={blue:'Blockchain Blue',green:'Forest Green',amber:'Amber',red:'Red',purple:'Purple'}

  return(
    <section id="app" className="py-20 px-4" style={{background:'#F7F6F1',position:'relative',overflow:'hidden'}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scan{0%{top:0%;opacity:1}100%{top:100%;opacity:0}}
        .scan-bar{animation:scan 1.8s ease-in-out forwards}
      `}</style>

      {/* Section watermark */}
      <div style={{position:'absolute',top:'50%',right:-40,transform:'translateY(-50%) rotate(90deg)',fontFamily:"'DM Serif Display',serif",fontSize:'8rem',color:C.blue,opacity:0.03,userSelect:'none',pointerEvents:'none',whiteSpace:'nowrap'}}>
        RAT_CHAIN
      </div>

      <ToastEl t={toast}/>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.65rem',color:'#A09D97',letterSpacing:'0.18em',display:'block',marginBottom:'0.6rem'}}>LIVE APPLICATION</span>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:'clamp(1.8rem,4vw,2.4rem)',color:'#111110'}}>
            Start Using <span style={{color:C.blue,fontStyle:'italic'}}>RentProof</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* Wallet */}
          <Card accent={C.blue} className="md:col-span-2 xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.1rem',color:'#111110'}}>Wallet Overview</h3>
              <Pill label={isConnected?'Connected':'Disconnected'} active={isConnected} accent={C.green}/>
            </div>
            {isConnected?(
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[{l:'ADDRESS',v:truncateAddress(address!)},{l:'NETWORK',v:chain?.name??'—'},{l:'CONTRACT',v:truncateAddress(CONTRACT_ADDRESS)}].map(x=>(
                  <div key={x.l} style={{background:'#EEF2FF',border:'1px solid #C7D2FE',borderRadius:10,padding:'0.65rem 0.85rem'}}>
                    <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.58rem',color:'#A09D97',letterSpacing:'0.12em',marginBottom:3}}>{x.l}</p>
                    <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.75rem',color:C.blue}}>{x.v}</p>
                  </div>
                ))}
              </div>
            ):(
              <div className="flex flex-col items-center py-8 gap-4">
                <div style={{width:56,height:56,borderRadius:14,background:'#EEF2FF',border:'1px solid #C7D2FE',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 12h.01"/><path d="M2 10h20"/></svg>
                </div>
                <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.85rem',color:'#888580'}}>Connect MetaMask to get started</p>
                <Btn onClick={()=>connect({connector:injected()})} accent={C.blue}>⬡ Connect MetaMask</Btn>
              </div>
            )}
          </Card>

          {/* Tx Status */}
          <Card accent={C.purple}>
            <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.05rem',color:'#111110',marginBottom:'1rem'}}>Tx Status</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[{l:'Hash',v:txHash?truncateAddress(txHash):'—',a:!!txHash},{l:'Pending',v:txPending?'Awaiting…':'—',a:txPending},{l:'Confirming',v:txConf?'On-chain…':'—',a:txConf},{l:'Confirmed',v:txOk?'✓ Done':'—',a:txOk}].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem',fontFamily:"'JetBrains Mono',monospace"}}>
                  <span style={{color:'#A09D97'}}>{r.l}</span>
                  <span style={{color:r.a?C.purple:'#ECEAE3'}}>{r.v}</span>
                </div>
              ))}
            </div>
            {txHash&&<a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{display:'block',marginTop:'0.85rem',fontFamily:"'JetBrains Mono',monospace",fontSize:'0.72rem',color:C.purple}}>View on Etherscan ↗</a>}
          </Card>

          {/* Deposit */}
          <Card accent={C.green}>
            <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.05rem',color:'#111110',marginBottom:'1rem'}}>Pay Deposit</h3>
            <label style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:'#A09D97',letterSpacing:'0.12em',display:'block',marginBottom:6}}>AMOUNT (ETH)</label>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <input type="number" value={amt} onChange={e=>setAmt(e.target.value)} step="0.001" min="0"
                style={{flex:1,background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:8,padding:'0.5rem 0.75rem',fontFamily:"'JetBrains Mono',monospace",fontSize:'0.85rem',color:C.green,outline:'none'}}/>
              <span style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.75rem',color:'#A09D97',alignSelf:'center'}}>ETH</span>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {['0.01','0.05','0.1'].map(v=>(
                <button key={v} onClick={()=>setAmt(v)} style={{flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:'0.72rem',padding:'0.4rem',borderRadius:8,background:amt===v?'#F0FDF4':'transparent',border:`1px solid ${amt===v?C.green+'55':'#ECEAE3'}`,color:amt===v?C.green:'#A09D97',cursor:'pointer'}}>{v}</button>
              ))}
            </div>
            <Btn onClick={()=>call('deposit',parseEther(amt),'deposit')} loading={al==='deposit'} disabled={!isConnected} accent={C.green}>Lock Deposit →</Btn>
          </Card>

          {/* Upload */}
          <Card accent={C.amber} className="xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.05rem',color:'#111110'}}>Property Images</h3>
              <div style={{display:'flex',gap:6}}><Pill label={done.before?'Before ✓':'Before'} active={done.before} accent={C.amber}/><Pill label={done.after?'After ✓':'After'} active={done.after} accent={C.amber}/></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.58rem',color:'#A09D97',letterSpacing:'0.12em',marginBottom:6}}>MOVE-IN IMAGE</p><Upload label="Upload Before" file={bf} onChange={setBf} accent={C.amber}/></div>
              <div><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.58rem',color:'#A09D97',letterSpacing:'0.12em',marginBottom:6}}>MOVE-OUT IMAGE</p><Upload label="Upload After" file={af} onChange={setAf} accent={C.amber}/></div>
            </div>
            <Btn onClick={handleUpload} loading={uploading} disabled={!bf||!af} accent={C.amber}>{uploading?'Uploading...':'Upload Both Images →'}</Btn>
          </Card>

          {/* AI Analysis */}
          <Card accent={C.red}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.05rem',color:'#111110'}}>AI Analysis</h3>
              {analyzing&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:C.red}}>SCANNING...</span>}
            </div>
            <div style={{position:'relative',height:96,borderRadius:12,background:'#FEF2F2',border:'1px solid #FCA5A5',marginBottom:16,overflow:'hidden'}}>
              {scan&&<div className="scan-bar" style={{position:'absolute',left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${C.red},transparent)`}}/>}
              {result
                ?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:6}}>
                  <span style={{fontSize:'1.8rem'}}>{result.status==='damage'?'⚠️':'✅'}</span>
                  <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.7rem',fontWeight:600,color:result.status==='damage'?C.red:C.green}}>{result.status==='damage'?'DAMAGE DETECTED':'NO DAMAGE FOUND'}</p>
                </div>
                :<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}><p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.8rem',color:'#C8C4BC'}}>Awaiting analysis...</p></div>}
            </div>
            {result&&(
              <div style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',fontFamily:"'JetBrains Mono',monospace",fontSize:'0.65rem',marginBottom:5}}>
                  <span style={{color:'#A09D97'}}>CONFIDENCE</span>
                  <span style={{color:result.status==='damage'?C.red:C.green}}>{(result.score*100).toFixed(1)}%</span>
                </div>
                <div style={{height:5,borderRadius:999,background:'#FEF2F2',border:'1px solid #FCA5A5'}}>
                  <div style={{height:'100%',borderRadius:999,width:`${result.score*100}%`,background:result.status==='damage'?C.red:C.green,transition:'width 1s cubic-bezier(.34,1.56,.64,1)'}}/>
                </div>
                {result.details&&<p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.72rem',color:'#A09D97',marginTop:6,fontStyle:'italic'}}>{result.details}</p>}
              </div>
            )}
            <Btn onClick={handleAnalyze} loading={analyzing} disabled={!done.before||!done.after} accent={C.red}>{analyzing?'Analyzing...':'⬡ Analyze Damage'}</Btn>
          </Card>

          {/* Contract Actions */}
          <Card accent={C.purple}>
            <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.05rem',color:'#111110',marginBottom:4}}>Contract Actions</h3>
            <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.78rem',color:'#A09D97',marginBottom:16,lineHeight:1.6}}>Landlord approves return. Funds auto-release to tenant.</p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{background:'#F5F3FF',border:'1px solid #DDD6FE',borderRadius:12,padding:'0.85rem'}}>
                <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:C.purple,letterSpacing:'0.1em',marginBottom:8}}>LANDLORD ACTION</p>
                <Btn onClick={()=>call('approveReturn',undefined,'approve')} loading={al==='approve'} disabled={!isConnected||!result} accent={C.purple}>✓ Approve Return</Btn>
              </div>
              <div style={{background:'#EEF2FF',border:'1px solid #C7D2FE',borderRadius:12,padding:'0.85rem'}}>
                <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:C.blue,letterSpacing:'0.1em',marginBottom:8}}>RELEASE FUNDS</p>
                <Btn onClick={()=>call('releaseDeposit',undefined,'release')} loading={al==='release'} disabled={!isConnected} accent={C.blue}>⟳ Release Deposit</Btn>
              </div>
            </div>
          </Card>

          {/* Protocol Flow */}
          <Card accent={C.blue} className="md:col-span-2 xl:col-span-3">
            <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.05rem',color:'#111110',marginBottom:'1.25rem'}} id="protocol">Protocol Flow</h3>
            <div style={{display:'flex',alignItems:'center',gap:8,overflowX:'auto',paddingBottom:6}}>
              {[{icon:'⬡',label:'Connect\nWallet',c:C.blue},{icon:'🔒',label:'Lock\nDeposit',c:C.green},{icon:'📸',label:'Upload\nImages',c:C.amber},{icon:'🤖',label:'AI\nAnalysis',c:C.red},{icon:'✓',label:'Approve\nReturn',c:C.purple},{icon:'💸',label:'Release\nFunds',c:C.blue}].map((s,i,arr)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <div style={{width:42,height:42,borderRadius:12,background:`${s.c}12`,border:`1px solid ${s.c}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>{s.icon}</div>
                    <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.55rem',textAlign:'center',whiteSpace:'pre-line',color:'#A09D97',lineHeight:1.4}}>{s.label}</p>
                  </div>
                  {i<arr.length-1&&<div style={{width:28,height:1,flexShrink:0,background:`linear-gradient(90deg,${s.c}66,${arr[i+1].c}66)`}}/>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
