'use client'
import{useState,useEffect}from 'react'
import{useAccount,useConnect,useDisconnect,useWriteContract,useWaitForTransactionReceipt}from 'wagmi'
import{injected}from 'wagmi/connectors'
import{parseEther}from 'viem'
import{CONTRACT_ADDRESS,RENT_PROOF_ABI,truncateAddress,API_BASE_URL}from '@/lib/contract'
import Navbar from '@/app/components/Navbar'
import{ProgressBar,Card,Btn,Field,UploadZone,ContractData,Phase}from './ui'

// Countdown hook inline
function useCountdown(endDate:string){
  const[left,setLeft]=useState('');const[expired,setExpired]=useState(false)
  useEffect(()=>{
    const tick=()=>{const diff=new Date(endDate).getTime()-Date.now();if(diff<=0){setExpired(true);setLeft('');return};const d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),m=Math.floor((diff%3600000)/60000);setLeft(`${d}d ${h}h ${m}m`)}
    if(endDate){tick();const t=setInterval(tick,30000);return()=>clearInterval(t)}
  },[endDate])
  return{left,expired}
}

const C={blue:'#1D4ED8',green:'#15803D',amber:'#B45309',red:'#B91C1C',purple:'#7C3AED'}

export default function AppPage(){
  const{address,isConnected}=useAccount()
  const{connect}=useConnect()
  const{disconnect}=useDisconnect()
  const{writeContract,data:txHash,isPending}=useWriteContract()
  const{isSuccess:txOk}=useWaitForTransactionReceipt({hash:txHash})

  const[phase,setPhase]=useState<Phase>('wallet')
  const[cd,setCd]=useState<ContractData>({tenant:'',property:'',rent:'0.05',deposit:'0.1',startDate:'',endDate:''})
  const[bf,setBf]=useState<File|null>(null)
  const[af,setAf]=useState<File|null>(null)
  const[uploading,setUploading]=useState(false)
  const[analyzing,setAnalyzing]=useState(false)
  const[result,setResult]=useState<{status:string;score:number;details:string}|null>(null)
  const[al,setAl]=useState<string|null>(null)
  const[msg,setMsg]=useState<{t:string;ok:boolean}|null>(null)
  const{left,expired}=useCountdown(cd.endDate)

  // Persist state
  useEffect(()=>{
    const s=localStorage.getItem('rp_state')
    if(s){const d=JSON.parse(s);setPhase(d.phase||'wallet');setCd(d.cd||cd)}
  },[])
  useEffect(()=>{
    if(phase!=='wallet')localStorage.setItem('rp_state',JSON.stringify({phase,cd}))
  },[phase,cd])
  useEffect(()=>{if(isConnected&&phase==='wallet')setPhase('contract')},[isConnected])
  useEffect(()=>{if(txOk){setMsg({t:'Transaction confirmed!',ok:true});setAl(null)}},[txOk])

  const show=(t:string,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg(null),4000)}

  const createContract=async()=>{
    if(!cd.tenant||!cd.property||!cd.startDate||!cd.endDate)return show('Fill all fields',false)
    try{
      writeContract({address:CONTRACT_ADDRESS,abi:RENT_PROOF_ABI,functionName:'deposit' as any,value:parseEther(cd.deposit)})
      show('Deposit locked on-chain!',true)
      setPhase('before')
    }catch(e:any){show(e?.message?.slice(0,60)??"Failed",false)}
  }

  const uploadImages=async(ep:'upload-before'|'upload-after',file:File)=>{
    setUploading(true)
    try{
      const fd=new FormData();fd.append('file',file)
      const r=await fetch(`${API_BASE_URL}/${ep}`,{method:'POST',body:fd})
      if(!r.ok)throw new Error(r.statusText)
      return true
    }catch(e:any){show(e.message??'Upload failed',false);return false}
    finally{setUploading(false)}
  }

  const doAnalysis=async()=>{
    setAnalyzing(true)
    try{
      const r=await fetch(`${API_BASE_URL}/analyze`,{method:'POST'})
      const d=await r.json();setResult(d)
      show(d.status==='damage'?`Damage detected (${(d.score*100).toFixed(1)}%)`:'No damage found — property is clean!',d.status!=='damage')
      setPhase('done')
    }catch{
      setResult({status:'no_damage',score:0.96,details:'Demo mode — backend not connected'})
      show('Demo mode: using sample result',true);setPhase('done')
    }finally{setAnalyzing(false)}
  }

  const callContract=(fn:string,tag:string)=>{
    if(!isConnected)return show('Connect wallet',false)
    setAl(tag)
    try{writeContract({address:CONTRACT_ADDRESS,abi:RENT_PROOF_ABI,functionName:fn as any})}
    catch(e:any){show(e?.message?.slice(0,60)??"Failed",false);setAl(null)}
  }

  const reset=()=>{localStorage.removeItem('rp_state');setPhase('contract');setCd({tenant:'',property:'',rent:'0.05',deposit:'0.1',startDate:'',endDate:''});setBf(null);setAf(null);setResult(null)}

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        body{background:#F7F6F1!important}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .step-in{animation:fadein 0.4s cubic-bezier(.16,1,.3,1) both}
      `}</style>

      <div className="fixed inset-0" style={{background:'#F7F6F1',zIndex:-2}}/>
      <div className="fixed inset-0 pointer-events-none" style={{backgroundImage:'radial-gradient(circle,#C8C4BC 1px,transparent 1px)',backgroundSize:'32px 32px',opacity:0.22,zIndex:-1}}/>

      <Navbar/>

      <main style={{paddingTop:80,minHeight:'100vh',position:'relative',zIndex:1}}>
        <div className="max-w-3xl mx-auto px-5 py-10">

          {/* Header */}
          <div style={{marginBottom:'2rem'}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:'#A09D97',letterSpacing:'0.18em'}}>RENTPROOF · RAT_CHAIN PROTOCOL</span>
            <h1 style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:'clamp(1.8rem,4vw,2.4rem)',color:'#111110',marginTop:4}}>
              {phase==='wallet'?<>Connect <span style={{color:C.blue,fontStyle:'italic'}}>Wallet</span></>
               :phase==='contract'?<>Create <span style={{color:C.blue,fontStyle:'italic'}}>Contract</span></>
               :phase==='before'?<>Upload <span style={{color:C.amber,fontStyle:'italic'}}>Move-In</span> Photos</>
               :phase==='after'?<>Upload <span style={{color:C.amber,fontStyle:'italic'}}>Move-Out</span> Photos</>
               :phase==='analysis'?<>AI <span style={{color:C.red,fontStyle:'italic'}}>Analysis</span></>
               :<>Contract <span style={{color:C.green,fontStyle:'italic'}}>Complete</span></>}
            </h1>
          </div>

          {phase!=='wallet'&&<ProgressBar phase={phase}/>}

          {/* Toast */}
          {msg&&<div className="step-in" style={{marginBottom:16,padding:'0.75rem 1rem',borderRadius:12,background:msg.ok?'#F0FDF4':'#FEF2F2',border:`1px solid ${msg.ok?'#BBF7D0':'#FCA5A5'}`,fontFamily:"'Outfit',sans-serif",fontSize:'0.82rem',color:msg.ok?C.green:C.red}}>{msg.t}</div>}

          {/* ── STEP: WALLET ── */}
          {phase==='wallet'&&(
            <Card accent={C.blue} className="step-in">
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,padding:'2rem 0',textAlign:'center'}}>
                <div style={{width:64,height:64,borderRadius:18,background:'#EEF2FF',border:'1px solid #C7D2FE',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.4"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 12h.01"/><path d="M2 10h20"/></svg>
                </div>
                <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.9rem',color:'#888580',maxWidth:340,lineHeight:1.7}}>Connect your MetaMask wallet to begin creating a rental contract on the blockchain.</p>
                <Btn onClick={()=>connect({connector:injected()})} accent={C.blue}>⬡ Connect MetaMask</Btn>
              </div>
            </Card>
          )}

          {/* ── STEP: CREATE CONTRACT ── */}
          {phase==='contract'&&(
            <div className="step-in" style={{display:'flex',flexDirection:'column',gap:16}}>
              <Card accent={C.blue}>
                <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.15rem',color:'#111110',marginBottom:'1.25rem'}}>Rental Agreement Details</h2>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div style={{gridColumn:'1/-1'}}>
                    <Field label="TENANT WALLET ADDRESS" value={cd.tenant} onChange={v=>setCd(p=>({...p,tenant:v}))} placeholder="0x..."/>
                  </div>
                  <div style={{gridColumn:'1/-1'}}>
                    <Field label="PROPERTY ADDRESS" value={cd.property} onChange={v=>setCd(p=>({...p,property:v}))} placeholder="123 Main St, City"/>
                  </div>
                  <Field label="MONTHLY RENT (ETH)" value={cd.rent} onChange={v=>setCd(p=>({...p,rent:v}))} type="number" placeholder="0.05"/>
                  <Field label="SECURITY DEPOSIT (ETH)" value={cd.deposit} onChange={v=>setCd(p=>({...p,deposit:v}))} type="number" placeholder="0.1"/>
                  <Field label="TENANCY START DATE" value={cd.startDate} onChange={v=>setCd(p=>({...p,startDate:v}))} type="date"/>
                  <Field label="TENANCY END DATE" value={cd.endDate} onChange={v=>setCd(p=>({...p,endDate:v}))} type="date"/>
                </div>
              </Card>

              <Card accent={C.green}>
                <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1rem',color:'#111110',marginBottom:'0.5rem'}}>Security Deposit Lock</h3>
                <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.8rem',color:'#888580',marginBottom:'1.25rem',lineHeight:1.65}}>
                  Your deposit of <strong>{cd.deposit} ETH</strong> will be locked in the smart contract — not with the landlord.
                </p>
                <Btn onClick={createContract} loading={isPending} accent={C.green} full>🔒 Lock Deposit & Create Contract</Btn>
              </Card>
            </div>
          )}

          {/* ── STEP: UPLOAD BEFORE ── */}
          {phase==='before'&&(
            <div className="step-in" style={{display:'flex',flexDirection:'column',gap:16}}>
              <Card accent={C.amber}>
                <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.1rem',color:'#111110',marginBottom:'0.4rem'}}>Move-In Condition Photos</h2>
                <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.8rem',color:'#888580',marginBottom:'1.5rem',lineHeight:1.65}}>
                  Document the property condition at the start of the tenancy. This will be compared with move-out photos by the AI.
                </p>
                <UploadZone file={bf} onChange={setBf} accent={C.amber}/>
              </Card>
              <Btn onClick={async()=>{if(!bf)return show('Upload an image first',false);const ok=await uploadImages('upload-before',bf);if(ok){show('Move-in photo saved!',true);setPhase('after')}}} loading={uploading} disabled={!bf} accent={C.amber} full>
                Save Move-In Photos & Continue →
              </Btn>
            </div>
          )}

          {/* ── STEP: UPLOAD AFTER ── */}
          {phase==='after'&&(
            <div className="step-in" style={{display:'flex',flexDirection:'column',gap:16}}>
              {!expired&&cd.endDate?(
                <Card accent={C.blue}>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:48,height:48,borderRadius:14,background:'#EEF2FF',border:'1px solid #C7D2FE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}}>🔒</div>
                    <div>
                      <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.65rem',color:C.blue,letterSpacing:'0.1em',marginBottom:4}}>MOVE-OUT UPLOAD LOCKED</p>
                      <p style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.05rem',color:'#111110'}}>{left} until contract end</p>
                      <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.78rem',color:'#888580',marginTop:3}}>Move-out photos can only be uploaded after <strong>{new Date(cd.endDate).toLocaleDateString()}</strong>.</p>
                    </div>
                  </div>
                </Card>
              ):(
                <Card accent={C.amber}>
                  <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.1rem',color:'#111110',marginBottom:'0.4rem'}}>Move-Out Condition Photos</h2>
                  <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.8rem',color:'#888580',marginBottom:'1.5rem',lineHeight:1.65}}>
                    The tenancy period has ended. Upload the current condition of the property for AI comparison.
                  </p>
                  <UploadZone file={af} onChange={setAf} accent={C.amber}/>
                </Card>
              )}
              {expired&&(
                <Btn onClick={async()=>{if(!af)return show('Upload an image first',false);const ok=await uploadImages('upload-after',af);if(ok){show('Move-out photo saved!',true);setPhase('analysis')}}} loading={uploading} disabled={!af} accent={C.amber} full>
                  Save Move-Out Photos & Run Analysis →
                </Btn>
              )}
            </div>
          )}

          {/* ── STEP: AI ANALYSIS ── */}
          {phase==='analysis'&&(
            <div className="step-in" style={{display:'flex',flexDirection:'column',gap:16}}>
              <Card accent={C.red}>
                <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.1rem',color:'#111110',marginBottom:'0.5rem'}}>Phase 2 — AI Damage Detection</h2>
                <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.8rem',color:'#888580',marginBottom:'1.5rem',lineHeight:1.65}}>
                  The AI model will compare your move-in and move-out photos to detect any property damage and generate a confidence score.
                </p>
                <div style={{height:80,borderRadius:12,background:'#FEF2F2',border:'1px solid #FCA5A5',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1.25rem'}}>
                  {analyzing
                    ?<div style={{display:'flex',alignItems:'center',gap:10}}><svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={C.red} strokeWidth="3" opacity=".2"/><path fill={C.red} d="M4 12a8 8 0 018-8v8z"/></svg><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.72rem',color:C.red}}>SCANNING IMAGES...</span></div>
                    :<span style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.85rem',color:'#C8C4BC'}}>Ready to analyze</span>}
                </div>
                <Btn onClick={doAnalysis} loading={analyzing} accent={C.red} full>⬡ Run AI Analysis</Btn>
              </Card>
            </div>
          )}

          {/* ── STEP: DONE / RESULTS ── */}
          {phase==='done'&&result&&(
            <div className="step-in" style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* AI Score */}
              <Card accent={result.status==='damage'?C.red:C.green}>
                <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.1rem',color:'#111110',marginBottom:'0.4rem'}}>AI Analysis Result</h2>
                <div style={{display:'flex',alignItems:'center',gap:16,padding:'1rem',borderRadius:12,background:result.status==='damage'?'#FEF2F2':'#F0FDF4',border:`1px solid ${result.status==='damage'?'#FCA5A5':'#BBF7D0'}`,marginBottom:'1rem'}}>
                  <span style={{fontSize:'2.5rem'}}>{result.status==='damage'?'⚠️':'✅'}</span>
                  <div>
                    <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.8rem',fontWeight:700,color:result.status==='damage'?C.red:C.green}}>{result.status==='damage'?'DAMAGE DETECTED':'NO DAMAGE FOUND'}</p>
                    <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.78rem',color:'#888580',marginTop:3}}>{result.details}</p>
                  </div>
                </div>
                <div style={{marginBottom:6,display:'flex',justifyContent:'space-between',fontFamily:"'JetBrains Mono',monospace",fontSize:'0.65rem'}}>
                  <span style={{color:'#A09D97'}}>CONFIDENCE SCORE</span>
                  <span style={{color:result.status==='damage'?C.red:C.green,fontWeight:700}}>{(result.score*100).toFixed(1)}%</span>
                </div>
                <div style={{height:8,borderRadius:999,background:'#F7F6F1',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${result.score*100}%`,borderRadius:999,background:result.status==='damage'?`linear-gradient(90deg,${C.red},${C.amber})`:`linear-gradient(90deg,${C.green},${C.blue})`,transition:'width 1.2s cubic-bezier(.34,1.56,.64,1)'}}/>
                </div>
              </Card>

              {/* Contract actions */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <Card accent={C.purple} style={{padding:'1.25rem'}}>
                  <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:C.purple,letterSpacing:'0.1em',marginBottom:8}}>LANDLORD</p>
                  <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.78rem',color:'#888580',marginBottom:12,lineHeight:1.6}}>Approve the deposit return to tenant.</p>
                  <Btn onClick={()=>callContract('approveReturn','approve')} loading={al==='approve'&&isPending} disabled={!isConnected} accent={C.purple} full>✓ Approve Return</Btn>
                </Card>
                <Card accent={C.blue} style={{padding:'1.25rem'}}>
                  <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:C.blue,letterSpacing:'0.1em',marginBottom:8}}>TENANT</p>
                  <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.78rem',color:'#888580',marginBottom:12,lineHeight:1.6}}>Claim the deposit back to your wallet.</p>
                  <Btn onClick={()=>callContract('releaseDeposit','release')} loading={al==='release'&&isPending} disabled={!isConnected} accent={C.blue} full>⟳ Release Deposit</Btn>
                </Card>
              </div>

              {txHash&&<div style={{padding:'0.85rem',borderRadius:12,background:'#EEF2FF',border:'1px solid #C7D2FE'}}>
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.7rem',color:C.blue}}>View on Etherscan ↗</a>
              </div>}

              <button onClick={reset} style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.8rem',color:'#A09D97',background:'none',border:'none',cursor:'pointer',textAlign:'left',padding:'0.25rem 0'}}>
                + Start a new contract
              </button>
            </div>
          )}
        </div>
      </main>

      <footer style={{borderTop:'1px solid #ECEAE3',background:'#FFFFFF',padding:'1.5rem',textAlign:'center',marginTop:20}}>
        <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:'#C8C4BC',letterSpacing:'0.15em'}}>RENTPROOF · RAT_CHAIN PROTOCOL · SEPOLIA TESTNET</p>
      </footer>
    </>
  )
}
