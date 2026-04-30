'use client'
import{useEffect,useRef,useState}from 'react'
import Link from 'next/link'

const C={blue:'#1D4ED8',green:'#15803D',amber:'#B45309',red:'#B91C1C',purple:'#7C3AED'}

function Counter({to,suffix=''}:{to:number;suffix?:string}){
  const[val,setVal]=useState(0)
  useEffect(()=>{let s=0;const step=Math.ceil(to/60);const t=setInterval(()=>{s+=step;if(s>=to){setVal(to);clearInterval(t)}else setVal(s)},16);return()=>clearInterval(t)},[to])
  return<span>{val.toLocaleString()}{suffix}</span>
}

function IBuilding({w,h,color,id,v=0}:{w:number;h:number;color:string;id:string;v?:number}){
  const[hW,setHW]=useState<string|null>(null)
  const[dO,setDO]=useState(false)
  const pH=Math.max(6,Math.round(h*.045)),bH=h-pH
  const dH=Math.max(20,Math.round(h*.14)),dW=Math.max(12,Math.round(w*.28))
  const wW=Math.max(8,Math.round(w*.2)),wH=Math.max(10,Math.round(bH*.075))
  const gX=Math.max(4,Math.round(w*.1)),gY=Math.max(5,Math.round(bH*.04))
  const cols=Math.max(1,Math.floor((w-gX)/(wW+gX)))
  const sX=(w-cols*(wW+gX)+gX)/2
  const avH=bH-dH-14
  const rows=Math.max(2,Math.floor((avH-gY)/(wH+gY)))
  return(
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',overflow:'visible'}}>
      {/* Body */}
      <rect x={0} y={pH} width={w} height={bH} fill={color} fillOpacity={.07} stroke={color} strokeWidth={1} strokeOpacity={.22}/>
      {/* Parapet */}
      <rect x={-2} y={0} width={w+4} height={pH+2} fill={color} fillOpacity={.16} stroke={color} strokeWidth={1} strokeOpacity={.28}/>
      {/* Rooftop detail */}
      {v===0&&<rect x={w*.3} y={-7} width={w*.4} height={7} fill={color} fillOpacity={.18} stroke={color} strokeWidth={.5} strokeOpacity={.25}/>}
      {v===1&&<line x1={w/2} y1={0} x2={w/2} y2={-18} stroke={color} strokeWidth={1} strokeOpacity={.25}/>}
      {v===2&&<><rect x={w*.2} y={-5} width={w*.25} height={5} fill={color} fillOpacity={.15}/><rect x={w*.55} y={-8} width={w*.2} height={8} fill={color} fillOpacity={.15}/></>}
      {/* Facade columns */}
      {v===0&&Array.from({length:cols-1}).map((_,i)=>(
        <line key={i} x1={sX+(i+1)*(wW+gX)-gX/2} y1={pH} x2={sX+(i+1)*(wW+gX)-gX/2} y2={h-dH} stroke={color} strokeWidth={.5} strokeOpacity={.1}/>
      ))}
      {/* Windows */}
      {Array.from({length:rows}).flatMap((_,r)=>
        Array.from({length:cols}).map((_,c)=>{
          const wid=`${id}-${r}-${c}`,hov=hW===wid
          const wx=sX+c*(wW+gX),wy=pH+8+r*(wH+gY)
          if(wy+wH>h-dH-6)return null
          return(
            <g key={wid} style={{cursor:'pointer'}} onMouseEnter={()=>setHW(wid)} onMouseLeave={()=>setHW(null)}>
              <rect x={wx} y={wy} width={wW} height={wH}
                fill={hov?'#FEF3C7':'#BFDBFE'} fillOpacity={hov?.92:.22}
                stroke={color} strokeWidth={hov?1.2:.5} strokeOpacity={hov?.55:.2}/>
              {hov&&<>
                <rect x={wx+1} y={wy+1} width={wW-2} height={wH-2} fill="#FCD34D" fillOpacity={.35}/>
                <rect x={wx} y={wy} width={wW*.22} height={wH} fill={color} fillOpacity={.25}/>
              </>}
              {!hov&&<line x1={wx+2} y1={wy+2} x2={wx+wW*.3} y2={wy+2} stroke="#fff" strokeWidth={.5} opacity={.35}/>}
            </g>
          )
        })
      )}
      {/* Steps */}
      <rect x={w/2-dW/2-3} y={h-4} width={dW+6} height={4} fill={color} fillOpacity={.18}/>
      <rect x={w/2-dW/2-1} y={h-8} width={dW+2} height={4} fill={color} fillOpacity={.12}/>
      {/* Door */}
      <g style={{cursor:'pointer'}} onMouseEnter={()=>setDO(true)} onMouseLeave={()=>setDO(false)}>
        <rect x={w/2-dW/2-3} y={h-dH-5} width={dW+6} height={5} fill={color} fillOpacity={.16} stroke={color} strokeWidth={.5} strokeOpacity={.22} rx={1}/>
        <rect x={w/2-dW/2} y={h-dH} width={dW} height={dH}
          fill={dO?'#ECFDF5':color} fillOpacity={dO?.85:.16}
          stroke={color} strokeWidth={1} strokeOpacity={.3} rx={1}/>
        {dO?<>
          <rect x={w/2-dW/2} y={h-dH} width={dW*.28} height={dH} fill={color} fillOpacity={.35} rx={1}/>
          <circle cx={w/2-dW/2+dW*.22} cy={h-dH/2} r={2} fill={color} fillOpacity={.65}/>
        </>:<>
          <line x1={w/2} y1={h-dH} x2={w/2} y2={h} stroke={color} strokeWidth={.5} strokeOpacity={.28}/>
          <circle cx={w/2+dW/2-4} cy={h-dH/2} r={1.5} fill={color} fillOpacity={.45}/>
        </>}
      </g>
    </svg>
  )
}

export default function LandingPage(){
  const[vis,setVis]=useState(false)
  useEffect(()=>{setTimeout(()=>setVis(true),150)},[])

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes breathe{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes spin-slow{to{transform:rotate(360deg)}}
        .float{animation:float 6s ease-in-out infinite}
        .fadeup{animation:fadeup 0.7s cubic-bezier(.16,1,.3,1) both}
        .breathe{animation:breathe 3s ease-in-out infinite}
        .spin-slow{animation:spin-slow 20s linear infinite}
        body{background:#F7F6F1!important}
      `}</style>

      {/* ── HERO ── */}
      <section style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F6F1',position:'relative',overflow:'hidden',paddingTop:60,textAlign:'center'}}>
        {/* Colour blobs */}
        <div style={{position:'absolute',top:-120,right:-80,width:520,height:520,borderRadius:'50%',background:`radial-gradient(circle,${C.blue}0A 0%,transparent 65%)`,pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-80,left:-60,width:420,height:420,borderRadius:'50%',background:`radial-gradient(circle,${C.green}09 0%,transparent 65%)`,pointerEvents:'none'}}/>
        {/* Dot grid */}
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,#C8C4BC 1px,transparent 1px)',backgroundSize:'28px 28px',opacity:0.28,pointerEvents:'none'}}/>
        {/* Tall buildings — LEFT edge */}
        <div style={{position:'absolute',bottom:0,left:0,display:'flex',alignItems:'flex-end',gap:2,zIndex:0}}>
          {[
            {id:'l1',w:52,h:320,c:C.blue,v:0},{id:'l2',w:38,h:220,c:C.green,v:1},
            {id:'l3',w:64,h:400,c:C.blue,v:2},{id:'l4',w:44,h:260,c:C.purple,v:0},
            {id:'l5',w:56,h:350,c:C.amber,v:1},{id:'l6',w:36,h:195,c:C.blue,v:2},
          ].map(b=><IBuilding key={b.id} id={b.id} w={b.w} h={b.h} color={b.c} v={b.v}/>)}
        </div>
        {/* Tall buildings — RIGHT edge */}
        <div style={{position:'absolute',bottom:0,right:0,display:'flex',alignItems:'flex-end',gap:2,zIndex:0}}>
          {[
            {id:'r1',w:36,h:190,c:C.green,v:2},{id:'r2',w:58,h:360,c:C.blue,v:0},
            {id:'r3',w:42,h:240,c:C.amber,v:1},{id:'r4',w:68,h:420,c:C.blue,v:2},
            {id:'r5',w:40,h:215,c:C.purple,v:0},{id:'r6',w:50,h:300,c:C.green,v:1},
          ].map(b=><IBuilding key={b.id} id={b.id} w={b.w} h={b.h} color={b.c} v={b.v}/>)}
        </div>

        <div className="max-w-3xl mx-auto px-6 w-full" style={{position:'relative',zIndex:1,paddingTop:'6vh',paddingBottom:'22vh'}}>
          {vis&&<div className="fadeup" style={{marginBottom:'1.5rem'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'5px 16px',borderRadius:999,background:'#FFFFFF',border:'1px solid #ECEAE3',boxShadow:'0 2px 10px rgba(0,0,0,0.06)'}}>
              <span className="breathe" style={{width:6,height:6,borderRadius:'50%',background:C.green,display:'inline-block'}}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:'#888580',letterSpacing:'0.1em'}}>LIVE · SEPOLIA TESTNET · RAT_CHAIN PROTOCOL</span>
            </div>
          </div>}
          {vis&&<h1 className="fadeup" style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:'clamp(3.2rem,7vw,5.5rem)',lineHeight:1.02,letterSpacing:'-0.03em',color:'#111110',marginBottom:'1.25rem',animationDelay:'0.1s'}}>
            Rent Smarter.<br/>
            <span style={{color:C.blue}}>Trust</span> the{' '}
            <span style={{fontStyle:'italic',color:C.green}}>Chain.</span>
          </h1>}
          {vis&&<p className="fadeup" style={{fontFamily:"'Outfit',sans-serif",fontSize:'1rem',color:'#888580',lineHeight:1.85,maxWidth:480,margin:'0 auto 2.25rem',animationDelay:'0.2s'}}>
            Blockchain-secured rental deposits. AI-powered damage detection. No middlemen, no disputes — just transparent, automated trust.
          </p>}
          {vis&&<div className="fadeup" style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',justifyContent:'center',animationDelay:'0.3s'}}>
            <Link href="/app" style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:'0.95rem',padding:'0.8rem 2rem',borderRadius:12,background:'#111110',color:'#fff',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,boxShadow:'0 4px 20px rgba(0,0,0,0.18)',transition:'all 0.2s'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 8px 28px rgba(0,0,0,0.22)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='none';(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 4px 20px rgba(0,0,0,0.18)'}}>Launch App →</Link>
            <button onClick={()=>document.querySelector('#features')?.scrollIntoView({behavior:'smooth'})}
              style={{fontFamily:"'Outfit',sans-serif",fontWeight:500,fontSize:'0.9rem',padding:'0.8rem 1.75rem',borderRadius:12,background:'transparent',color:'#5A5750',border:'1.5px solid #ECEAE3',cursor:'pointer',transition:'all 0.18s'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='#C8C4BC';(e.currentTarget as HTMLButtonElement).style.background='#FFFFFF'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='#ECEAE3';(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>How It Works</button>
          </div>}
          {vis&&<div className="fadeup" style={{display:'flex',gap:24,marginTop:'2.75rem',justifyContent:'center',animationDelay:'0.4s'}}>
            {[['🔒','On-Chain Escrow'],['🤖','AI Detection'],['⚡','Instant Release'],['🏠','No Middlemen']].map(([icon,label])=>(
              <div key={label} style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:'0.9rem'}}>{icon}</span>
                <span style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.72rem',color:'#A09D97',fontWeight:500}}>{label}</span>
              </div>
            ))}
          </div>}
        </div>
        {/* Scroll indicator */}
        <div className="breathe" style={{position:'absolute',bottom:28,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.52rem',color:'#C8C4BC',letterSpacing:'0.15em'}}>SCROLL</span>
          <div style={{width:1,height:32,background:'linear-gradient(180deg,#C8C4BC,transparent)'}}/>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{background:'#FFFFFF',borderTop:'1px solid #ECEAE3',borderBottom:'1px solid #ECEAE3'}}>
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[{val:100,suf:'%',label:'On-Chain Transparency',c:C.blue},{val:0,suf:' Disputes',label:'With AI Verification',c:C.green},{val:3,suf:'s',label:'Avg Analysis Time',c:C.amber},{val:100,suf:'%',label:'Non-Custodial',c:C.purple}].map(s=>(
            <div key={s.label} style={{textAlign:'center',padding:'0.75rem',borderRadius:14,background:'#FAFAF8',border:'1px solid #ECEAE3'}}>
              <p style={{fontFamily:"'DM Serif Display',serif",fontSize:'1.9rem',color:s.c,fontWeight:400,marginBottom:4}}><Counter to={s.val} suffix={s.suf}/></p>
              <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.72rem',color:'#A09D97'}}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{padding:'6rem 1.5rem',background:'#F7F6F1',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'10%',right:'5%',opacity:0.04,fontFamily:"'DM Serif Display',serif",fontSize:'10rem',color:C.blue,userSelect:'none',pointerEvents:'none',letterSpacing:'-0.05em'}}>PROOF</div>
        <div className="max-w-5xl mx-auto">
          <div style={{textAlign:'center',marginBottom:'3.5rem'}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.62rem',color:'#A09D97',letterSpacing:'0.18em',display:'block',marginBottom:'0.6rem'}}>CORE FEATURES</span>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:'clamp(1.8rem,3.5vw,2.6rem)',color:'#111110'}}>Built for <span style={{color:C.blue,fontStyle:'italic'}}>trust</span>, not faith</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1.25rem'}}>
            {[
              {icon:'🏛️',title:'Blockchain Escrow',desc:'Security deposits are locked in a verifiable smart contract — not a bank account, not a landlord. Fully transparent and non-custodial.',accent:C.blue},
              {icon:'🤖',title:'AI Damage Analysis',desc:'Computer vision compares move-in and move-out photos automatically, producing an objective damage score free from bias.',accent:C.green},
              {icon:'📸',title:'Photo Evidence Chain',desc:'Timestamped image uploads are cryptographically linked to the contract, creating an immutable record of property condition.',accent:C.amber},
              {icon:'⏱️',title:'Time-Locked Release',desc:'Move-out photos unlock only after the contract end date — preventing premature disputes and ensuring fair timeline.',accent:C.purple},
              {icon:'⚡',title:'Instant Settlement',desc:'Once AI analysis is complete and the landlord approves, funds are released in seconds — no 28-day bank delays.',accent:C.red},
              {icon:'🌐',title:'Fully Decentralised',desc:'No company holds your funds. The RAT_CHAIN protocol operates permissionlessly on Ethereum Sepolia testnet.',accent:C.blue},
            ].map(f=>(
              <div key={f.title} style={{background:'#FFFFFF',border:'1px solid #ECEAE3',borderRadius:20,padding:'1.5rem',transition:'all 0.25s',cursor:'default',position:'relative',overflow:'hidden'}}
                onMouseEnter={e=>{const d=e.currentTarget as HTMLDivElement;d.style.transform='translateY(-4px)';d.style.boxShadow=`0 12px 40px rgba(0,0,0,0.09),0 0 0 1.5px ${f.accent}44`;d.style.borderColor=`${f.accent}44`}}
                onMouseLeave={e=>{const d=e.currentTarget as HTMLDivElement;d.style.transform='none';d.style.boxShadow='none';d.style.borderColor='#ECEAE3'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:2.5,background:`linear-gradient(90deg,${f.accent},${f.accent}44,transparent)`,borderRadius:'20px 20px 0 0'}}/>
                <div style={{width:44,height:44,borderRadius:12,background:`${f.accent}10`,border:`1.5px solid ${f.accent}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem',marginBottom:'1rem'}}>{f.icon}</div>
                <h3 style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:'1.05rem',color:'#111110',marginBottom:'0.4rem'}}>{f.title}</h3>
                <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.82rem',color:'#888580',lineHeight:1.75}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{padding:'6rem 1.5rem',background:'#FFFFFF',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',bottom:'5%',left:'3%',opacity:0.03,fontFamily:"'DM Serif Display',serif",fontSize:'12rem',color:C.green,userSelect:'none',pointerEvents:'none'}}>CHAIN</div>
        <div className="max-w-4xl mx-auto">
          <div style={{textAlign:'center',marginBottom:'3.5rem'}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.62rem',color:'#A09D97',letterSpacing:'0.18em',display:'block',marginBottom:'0.6rem'}}>PROTOCOL FLOW</span>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:'clamp(1.8rem,3.5vw,2.6rem)',color:'#111110'}}>How <span style={{color:C.green,fontStyle:'italic'}}>RentProof</span> works</h2>
          </div>
          <div style={{position:'relative'}}>
            {/* Vertical line */}
            <div style={{position:'absolute',left:20,top:20,bottom:20,width:1.5,background:`linear-gradient(180deg,${C.blue},${C.green},${C.amber},${C.red},${C.purple})`,opacity:0.25,borderRadius:2}}/>
            <div style={{display:'flex',flexDirection:'column',gap:'2rem'}}>
              {[
                {n:'01',icon:'⬡',title:'Connect & Create Contract',desc:'Connect your MetaMask wallet and fill in the rental agreement — tenant address, property details, deposit amount, and tenancy dates. The deposit is locked in the smart contract instantly.',accent:C.blue,phase:'Phase 1'},
                {n:'02',icon:'📸',title:'Upload Move-In Photos',desc:'Immediately after signing the contract, upload photos documenting the property\'s condition at move-in. These are stored as the baseline for AI comparison.',accent:C.green,phase:'Phase 1'},
                {n:'03',icon:'🔒',title:'Time-Locked Move-Out Photos',desc:'Move-out photos are locked until the contract end date. Once the tenancy expires, the tenant can upload the final condition photos. This prevents early disputes.',accent:C.amber,phase:'Phase 1'},
                {n:'04',icon:'🤖',title:'AI Damage Detection',desc:'The AI model compares before and after photos, detecting any property damage and producing a confidence score between 0–100%. Completely objective and tamper-proof.',accent:C.red,phase:'Phase 2'},
                {n:'05',icon:'💸',title:'Automated Settlement',desc:'The landlord reviews the AI report and approves the return. The tenant\'s deposit is released instantly to their wallet — no delays, no disputes, no middlemen.',accent:C.purple,phase:'Phase 2'},
              ].map((s,i)=>(
                <div key={s.n} style={{display:'flex',gap:'1.5rem',paddingLeft:'0.5rem',alignItems:'flex-start'}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:'#FFFFFF',border:`2px solid ${s.accent}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',flexShrink:0,boxShadow:`0 0 0 4px ${s.accent}10`,zIndex:1}}>{s.icon}</div>
                  <div style={{flex:1,background:'#FAFAF8',border:'1px solid #ECEAE3',borderRadius:16,padding:'1.25rem',marginTop:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'0.5rem'}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.58rem',color:'#C8C4BC',letterSpacing:'0.1em'}}>{s.n}</span>
                      <div style={{width:1,height:10,background:'#ECEAE3'}}/>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.58rem',color:s.accent,letterSpacing:'0.1em',background:`${s.accent}12`,padding:'2px 8px',borderRadius:999}}>{s.phase}</span>
                    </div>
                    <h3 style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:'1.05rem',color:'#111110',marginBottom:'0.35rem'}}>{s.title}</h3>
                    <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.82rem',color:'#888580',lineHeight:1.75}}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{padding:'5rem 1.5rem',background:`linear-gradient(135deg,${C.blue}08 0%,#F7F6F1 50%,${C.green}08 100%)`,borderTop:'1px solid #ECEAE3',textAlign:'center',position:'relative',overflow:'hidden'}}>

        <div style={{position:'relative'}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.62rem',color:'#A09D97',letterSpacing:'0.18em',display:'block',marginBottom:'1rem'}}>GET STARTED TODAY</span>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:'clamp(1.8rem,4vw,2.8rem)',color:'#111110',marginBottom:'1rem'}}>
            Ready to <span style={{color:C.blue,fontStyle:'italic'}}>protect</span> your deposit?
          </h2>
          <p style={{fontFamily:"'Outfit',sans-serif",fontSize:'0.92rem',color:'#888580',maxWidth:420,margin:'0 auto 2rem',lineHeight:1.8}}>
            Join the future of rental agreements. Fair, transparent, and automated.
          </p>
          <Link href="/app" style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:'0.95rem',padding:'0.85rem 2.25rem',borderRadius:14,background:'#111110',color:'#fff',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10,boxShadow:'0 6px 24px rgba(0,0,0,0.18)',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 10px 32px rgba(0,0,0,0.22)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='none';(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 6px 24px rgba(0,0,0,0.18)'}}>
            Launch App →
          </Link>
        </div>
      </section>
    </>
  )
}