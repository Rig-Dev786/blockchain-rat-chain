'use client'
// app/page.tsx
// Fonts: Add to app/layout.tsx -> import { Syne, Space_Mono } from 'next/font/google'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther, formatEther } from 'viem'
import { CONTRACT_ADDRESS, RENT_PROOF_ABI, truncateAddress, API_BASE_URL } from '@/lib/contract'

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
type AnalysisResult = {
  status: 'damage' | 'no_damage'
  score: number
  details: string
} | null

type ToastType = { msg: string; type: 'success' | 'error' | 'info' } | null

// ─────────────────────────────────────────────
//  3D Tilt Hook
// ─────────────────────────────────────────────
function useTilt(strength = 12) {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -strength
      ref.current.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) translateZ(16px)`
      ref.current.style.transition = 'transform 0.1s ease'
    },
    [strength]
  )

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform =
      'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    ref.current.style.transition = 'transform 0.4s ease'
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}

// ─────────────────────────────────────────────
//  GlowCard
// ─────────────────────────────────────────────
function GlowCard({
  children,
  className = '',
  accent = '#00e5ff',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  accent?: string
  delay?: number
}) {
  const tilt = useTilt()
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`relative rounded-2xl p-6 card-enter ${className}`}
      style={{
        background: 'rgba(6, 12, 28, 0.88)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${accent}28`,
        boxShadow: `0 0 60px ${accent}0d, 0 20px 60px #00000066, inset 0 1px 0 ${accent}18`,
        animationDelay: `${delay}ms`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Animated top shimmer */}
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-2xl shimmer-line"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}99, transparent)` }}
      />
      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-tr-2xl opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accent}55, transparent 70%)` }}
      />
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
//  GlowButton
// ─────────────────────────────────────────────
function GlowBtn({
  onClick,
  loading,
  disabled,
  children,
  accent = '#00e5ff',
  variant = 'primary',
}: {
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  accent?: string
  variant?: 'primary' | 'ghost'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="relative font-mono text-sm font-semibold rounded-xl px-5 py-2.5 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group"
      style={
        variant === 'primary'
          ? {
            background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
            border: `1px solid ${accent}55`,
            color: accent,
            boxShadow: `0 0 20px ${accent}22`,
          }
          : {
            background: 'transparent',
            border: `1px solid #ffffff18`,
            color: '#94a3b8',
          }
      }
    >
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${accent}18, transparent)` }}
      />
      <span className="relative flex items-center gap-2">
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {children}
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────
//  StatusBadge
// ─────────────────────────────────────────────
function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full"
      style={{
        background: active ? '#00e5ff14' : '#ffffff0a',
        border: `1px solid ${active ? '#00e5ff44' : '#ffffff18'}`,
        color: active ? '#00e5ff' : '#64748b',
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? 'animate-pulse' : ''}`}
        style={{ background: active ? '#00e5ff' : '#475569' }}
      />
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────
//  Toast
// ─────────────────────────────────────────────
function Toast({ toast }: { toast: ToastType }) {
  if (!toast) return null
  const colors = {
    success: { border: '#00ff9f44', bg: '#00ff9f0d', text: '#00ff9f' },
    error: { border: '#ff445544', bg: '#ff44550d', text: '#ff7070' },
    info: { border: '#00e5ff44', bg: '#00e5ff0d', text: '#00e5ff' },
  }[toast.type]

  return (
    <div
      className="fixed bottom-6 right-6 z-50 font-mono text-sm px-5 py-3 rounded-xl shadow-xl toast-enter"
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
    >
      {toast.msg}
    </div>
  )
}

// ─────────────────────────────────────────────
//  Upload Zone
// ─────────────────────────────────────────────
function UploadZone({
  label,
  file,
  onChange,
  accent,
}: {
  label: string
  file: File | null
  onChange: (f: File) => void
  accent: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const preview = file ? URL.createObjectURL(file) : null

  return (
    <div
      className="relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden"
      style={{
        border: `1.5px dashed ${dragging ? accent : accent + '44'}`,
        background: dragging ? `${accent}0a` : 'rgba(0,0,0,0.2)',
        minHeight: 130,
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) onChange(f)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
      {preview ? (
        <img
          src={preview}
          alt={label}
          className="w-full h-32 object-cover rounded-xl opacity-80"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="font-mono text-xs" style={{ color: accent + 'aa' }}>
            {label}
          </p>
          <p className="font-mono text-[10px] text-slate-600">drag & drop or click</p>
        </div>
      )}
      {file && (
        <div
          className="absolute bottom-2 left-2 right-2 font-mono text-[10px] px-2 py-1 rounded-lg truncate"
          style={{ background: '#00000066', color: accent }}
        >
          ✓ {file.name}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
//  Particles Background
// ─────────────────────────────────────────────
function Particles() {
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; y: number; size: number; delay: number; duration: number;
  }>>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 6,
        duration: Math.random() * 8 + 6,
      }))
    )
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full particle-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0 ? '#00e5ff' : p.id % 3 === 1 ? '#00ff9f' : '#7c3aed',
            opacity: 0.4,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: `0 0 ${p.size * 3}px currentColor`,
          }}
        />
      ))}
    </div>
  )
}
// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────
export default function RentProofApp() {
  const { address, isConnected, chain } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract, data: txHash, isPending: txPending } = useWriteContract()
  const { isLoading: txConfirming, isSuccess: txSuccess } =
    useWaitForTransactionReceipt({ hash: txHash })

  // State
  const [depositAmount, setDepositAmount] = useState('0.01')
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState({ before: false, after: false })
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult>(null)
  const [toast, setToast] = useState<ToastType>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [scanActive, setScanActive] = useState(false)

  const showToast = (msg: string, type: ToastType['type'] = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Reflect tx success
  useEffect(() => {
    if (txSuccess) {
      showToast('Transaction confirmed on chain!', 'success')
      setActionLoading(null)
    }
  }, [txSuccess])

  // ── Contract Calls ──────────────────────────
  const handleDeposit = async () => {
    if (!isConnected) return showToast('Connect wallet first', 'error')
    setActionLoading('deposit')
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: RENT_PROOF_ABI,
        functionName: 'deposit',
        value: parseEther(depositAmount),
      })
      showToast('Deposit transaction sent!', 'info')
    } catch (e: any) {
      showToast(e?.message?.slice(0, 60) ?? 'Transaction failed', 'error')
      setActionLoading(null)
    }
  }

  const handleApproveReturn = async () => {
    if (!isConnected) return showToast('Connect wallet first', 'error')
    setActionLoading('approve')
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: RENT_PROOF_ABI,
        functionName: 'approveReturn',
      })
      showToast('Approve return tx sent!', 'info')
    } catch (e: any) {
      showToast(e?.message?.slice(0, 60) ?? 'Failed', 'error')
      setActionLoading(null)
    }
  }

  const handleReleaseDeposit = async () => {
    if (!isConnected) return showToast('Connect wallet first', 'error')
    setActionLoading('release')
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: RENT_PROOF_ABI,
        functionName: 'releaseDeposit',
      })
      showToast('Release deposit tx sent!', 'info')
    } catch (e: any) {
      showToast(e?.message?.slice(0, 60) ?? 'Failed', 'error')
      setActionLoading(null)
    }
  }

  // ── Upload Handlers ─────────────────────────
  const uploadImage = async (file: File, endpoint: 'upload-before' | 'upload-after') => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE_URL}/${endpoint}`, { method: 'POST', body: formData })
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)
    return res.json()
  }

  const handleUpload = async () => {
    if (!beforeFile || !afterFile) return showToast('Select both images first', 'error')
    setUploading(true)
    try {
      await Promise.all([
        uploadImage(beforeFile, 'upload-before'),
        uploadImage(afterFile, 'upload-after'),
      ])
      setUploadDone({ before: true, after: true })
      showToast('Images uploaded successfully!', 'success')
    } catch (e: any) {
      showToast(e.message ?? 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  // ── AI Analysis ─────────────────────────────
  const handleAnalyze = async () => {
    if (!uploadDone.before || !uploadDone.after) return showToast('Upload images first', 'error')
    setAnalyzing(true)
    setScanActive(true)
    try {
      const res = await fetch(`${API_BASE_URL}/analyze`, { method: 'POST' })
      const data: AnalysisResult = await res.json()
      setResult(data)
      showToast(
        data?.status === 'damage' ? `Damage detected (score: ${data.score})` : 'No damage found!',
        data?.status === 'damage' ? 'error' : 'success'
      )
    } catch (e: any) {
      // Demo fallback if backend not ready
      setResult({ status: 'no_damage', score: 0.96, details: 'Demo result – backend not connected' })
      showToast('Demo mode: backend not connected', 'info')
    } finally {
      setAnalyzing(false)
      setTimeout(() => setScanActive(false), 2000)
    }
  }

  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');

        * { font-family: 'Space Mono', monospace; box-sizing: border-box; }
        h1, h2, h3 { font-family: 'Syne', sans-serif; }

        @keyframes card-enter {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .card-enter { animation: card-enter 0.6s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes shimmer {
          0%  { transform: translateX(-100%); }
          100%{ transform: translateX(100%); }
        }
        .shimmer-line { animation: shimmer 3s ease-in-out infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-18px); }
        }
        .particle-float { animation: float linear infinite; }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        .glow-pulse { animation: glow-pulse 2.5s ease-in-out infinite; }

        @keyframes scan {
          0%  { top: 0%;   opacity: 1; }
          100%{ top: 100%; opacity: 0; }
        }
        .scan-line { animation: scan 1.8s ease-in-out forwards; }

        @keyframes toast-enter {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .toast-enter { animation: toast-enter 0.3s ease; }

        @keyframes orbit {
          from { transform: rotate(0deg)   translateX(120px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }
        .orbit { animation: orbit 12s linear infinite; }

        @keyframes data-flow {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .data-flow {
          background: linear-gradient(90deg, transparent 0%, #00e5ff44 50%, transparent 100%);
          background-size: 200% 100%;
          animation: data-flow 2s ease-in-out infinite;
        }

        ::-webkit-scrollbar { width: 4px; background: #0a1628; }
        ::-webkit-scrollbar-thumb { background: #00e5ff33; border-radius: 4px; }

        .score-bar { transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      {/* ── Background ── */}
      <div className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 10% 20%, #0d1f3c 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 80%, #0d2030 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 50% 50%, #0a0f1e 0%, transparent 80%),
            #030712
          `,
        }}
      />

      {/* Grid texture overlay */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(#00e5ff 1px, transparent 1px),
            linear-gradient(90deg, #00e5ff 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <Particles />
      <Toast toast={toast} />

      {/* ─── HEADER ─────────────────────────────── */}
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(3,7,18,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,229,255,0.1)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00e5ff22, #7c3aed22)', border: '1px solid #00e5ff44' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 glow-pulse"
              style={{ boxShadow: '0 0 8px #00e5ff' }} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">
              RENT<span style={{ color: '#00e5ff' }}>PROOF</span>
            </h1>
            <p className="text-[9px] font-mono text-slate-500 tracking-widest">RAT_CHAIN PROTOCOL</p>
          </div>
        </div>

        {/* Network + Wallet */}
        <div className="flex items-center gap-3">
          <Badge label={chain?.name ?? 'Not Connected'} active={isConnected} />

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block font-mono text-xs px-3 py-1.5 rounded-lg"
                style={{ background: '#00e5ff0a', border: '1px solid #00e5ff22', color: '#00e5ff' }}
              >
                {truncateAddress(address!)}
              </span>
              <GlowBtn onClick={() => disconnect()} accent="#ff4455" variant="ghost">
                Disconnect
              </GlowBtn>
            </div>
          ) : (
            <GlowBtn
              onClick={() => connect({ connector: injected() })}
              accent="#00e5ff"
            >
              ⬡ Connect Wallet
            </GlowBtn>
          )}
        </div>
      </header>

      {/* ─── HERO ───────────────────────────────── */}
      <div className="text-center pt-12 pb-8 px-6 card-enter" style={{ animationDelay: '100ms' }}>
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full font-mono text-xs"
          style={{ background: '#00e5ff0a', border: '1px solid #00e5ff22', color: '#00e5ff99' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Live on {chain?.name ?? 'Sepolia Testnet'}
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight">
          Decentralized{' '}
          <span style={{
            background: 'linear-gradient(90deg, #00e5ff, #00ff9f)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Rental Escrow
          </span>
          <br />+ AI Damage Detection
        </h2>
        <p className="font-mono text-sm text-slate-400 max-w-lg mx-auto">
          Lock deposits on-chain. Prove property condition with computer vision. No disputes.
        </p>
      </div>

      {/* ─── MAIN GRID ──────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* ── 1. WALLET CARD ── */}
        <GlowCard accent="#00e5ff" delay={200} className="md:col-span-2 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white">Wallet Overview</h3>
            <Badge label={isConnected ? 'Connected' : 'Disconnected'} active={isConnected} />
          </div>
          {isConnected ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'ADDRESS', val: truncateAddress(address!), full: address },
                { label: 'NETWORK', val: chain?.name ?? '—' },
                { label: 'CONTRACT', val: truncateAddress(CONTRACT_ADDRESS) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-3"
                  style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.1)' }}
                >
                  <p className="text-[9px] font-mono text-slate-500 mb-1 tracking-widest">{item.label}</p>
                  <p className="font-mono text-xs text-cyan-300 truncate" title={item.full}>{item.val}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: '#00e5ff0a', border: '1px dashed #00e5ff33' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff66" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 12h.01" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <p className="font-mono text-sm text-slate-500">Connect MetaMask to get started</p>
              <GlowBtn onClick={() => connect({ connector: injected() })} accent="#00e5ff">
                ⬡ Connect MetaMask
              </GlowBtn>
            </div>
          )}
        </GlowCard>

        {/* ── 2. TX STATUS CARD ── */}
        <GlowCard accent="#7c3aed" delay={250}>
          <h3 className="text-base font-bold text-white mb-4">Tx Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Hash', val: txHash ? truncateAddress(txHash) : '—', active: !!txHash },
              { label: 'Pending', val: txPending ? 'Awaiting sign…' : '—', active: txPending },
              { label: 'Confirming', val: txConfirming ? 'On-chain…' : '—', active: txConfirming },
              { label: 'Confirmed', val: txSuccess ? '✓ Success' : '—', active: txSuccess },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">{row.label}</span>
                <span style={{ color: row.active ? '#a78bfa' : '#334155' }}>{row.val}</span>
              </div>
            ))}
          </div>
          {txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-1.5 text-xs font-mono"
              style={{ color: '#7c3aed' }}
            >
              View on Etherscan ↗
            </a>
          )}
        </GlowCard>

        {/* ── 3. DEPOSIT CARD ── */}
        <GlowCard accent="#00ff9f" delay={300}>
          <h3 className="text-base font-bold text-white mb-4">
            Pay Deposit
          </h3>
          <div className="mb-4">
            <label className="text-[10px] font-mono text-slate-500 tracking-widest mb-1.5 block">
              AMOUNT (ETH)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                step="0.001"
                min="0"
                className="flex-1 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-1"
                style={{
                  background: '#00ff9f0a',
                  border: '1px solid #00ff9f33',
                  color: '#00ff9f',
                  focusRing: '#00ff9f44',
                }}
              />
              <span className="font-mono text-xs text-slate-500 self-center">ETH</span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-5">
            {['0.01', '0.05', '0.1'].map((v) => (
              <button key={v} onClick={() => setDepositAmount(v)}
                className="flex-1 text-xs font-mono py-1.5 rounded-lg transition-all"
                style={{
                  background: depositAmount === v ? '#00ff9f22' : 'transparent',
                  border: `1px solid ${depositAmount === v ? '#00ff9f55' : '#ffffff11'}`,
                  color: depositAmount === v ? '#00ff9f' : '#475569',
                }}
              >
                {v}
              </button>
            ))}
          </div>

          <GlowBtn
            onClick={handleDeposit}
            loading={actionLoading === 'deposit' || (txPending && actionLoading === 'deposit')}
            disabled={!isConnected}
            accent="#00ff9f"
          >
            Lock Deposit →
          </GlowBtn>
        </GlowCard>

        {/* ── 4. UPLOAD CARD ── */}
        <GlowCard accent="#f59e0b" delay={350} className="xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white">Property Images</h3>
            <div className="flex gap-2">
              <Badge label={uploadDone.before ? 'Before ✓' : 'Before'} active={uploadDone.before} />
              <Badge label={uploadDone.after ? 'After ✓' : 'After'} active={uploadDone.after} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] font-mono text-slate-500 tracking-widest mb-2">MOVE-IN IMAGE</p>
              <UploadZone
                label="Upload Before"
                file={beforeFile}
                onChange={setBeforeFile}
                accent="#f59e0b"
              />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-500 tracking-widest mb-2">MOVE-OUT IMAGE</p>
              <UploadZone
                label="Upload After"
                file={afterFile}
                onChange={setAfterFile}
                accent="#f59e0b"
              />
            </div>
          </div>

          <GlowBtn
            onClick={handleUpload}
            loading={uploading}
            disabled={!beforeFile || !afterFile}
            accent="#f59e0b"
          >
            {uploading ? 'Uploading...' : 'Upload Both Images →'}
          </GlowBtn>
        </GlowCard>

        {/* ── 5. AI ANALYSIS CARD ── */}
        <GlowCard accent="#ff4455" delay={400}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white">AI Analysis</h3>
            {analyzing && (
              <span className="text-[10px] font-mono text-red-400 animate-pulse">SCANNING...</span>
            )}
          </div>

          {/* Scan animation container */}
          <div className="relative mb-5 rounded-xl overflow-hidden"
            style={{
              height: 100,
              background: 'rgba(255,68,85,0.05)',
              border: '1px solid rgba(255,68,85,0.15)',
            }}
          >
            {scanActive && (
              <div className="scan-line absolute left-0 right-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, #ff4455, transparent)' }}
              />
            )}
            {result ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
                <div className="text-3xl">
                  {result.status === 'damage' ? '⚠️' : '✅'}
                </div>
                <p className="font-mono text-xs font-bold"
                  style={{ color: result.status === 'damage' ? '#ff7070' : '#00ff9f' }}
                >
                  {result.status === 'damage' ? 'DAMAGE DETECTED' : 'NO DAMAGE FOUND'}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="font-mono text-xs text-slate-600">Awaiting analysis...</p>
              </div>
            )}
          </div>

          {result && (
            <div className="mb-5 space-y-3">
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-1.5">
                  <span className="text-slate-500">CONFIDENCE SCORE</span>
                  <span style={{ color: result.status === 'damage' ? '#ff7070' : '#00ff9f' }}>
                    {(result.score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,68,85,0.1)' }}>
                  <div
                    className="h-full rounded-full score-bar"
                    style={{
                      width: `${result.score * 100}%`,
                      background: result.status === 'damage'
                        ? 'linear-gradient(90deg, #ff4455, #ff7070)'
                        : 'linear-gradient(90deg, #00e5ff, #00ff9f)',
                    }}
                  />
                </div>
              </div>
              {result.details && (
                <p className="text-[10px] font-mono text-slate-500 italic">{result.details}</p>
              )}
            </div>
          )}

          <GlowBtn
            onClick={handleAnalyze}
            loading={analyzing}
            disabled={!uploadDone.before || !uploadDone.after}
            accent="#ff4455"
          >
            {analyzing ? 'Analyzing...' : '⬡ Analyze Damage'}
          </GlowBtn>
        </GlowCard>

        {/* ── 6. CONTRACT ACTIONS CARD ── */}
        <GlowCard accent="#7c3aed" delay={450}>
          <h3 className="text-base font-bold text-white mb-2">Contract Actions</h3>
          <p className="font-mono text-[10px] text-slate-500 mb-5 leading-relaxed">
            Landlord approves return based on AI result. Funds auto-release to tenant.
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <p className="text-[10px] font-mono text-purple-400 mb-2 tracking-widest">LANDLORD ACTION</p>
              <GlowBtn
                onClick={handleApproveReturn}
                loading={actionLoading === 'approve'}
                disabled={!isConnected || !result}
                accent="#a78bfa"
              >
                ✓ Approve Return
              </GlowBtn>
              <p className="text-[9px] font-mono text-slate-600 mt-2">
                Requires AI analysis to be complete
              </p>
            </div>

            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.1)' }}>
              <p className="text-[10px] font-mono text-cyan-400 mb-2 tracking-widest">RELEASE FUNDS</p>
              <GlowBtn
                onClick={handleReleaseDeposit}
                loading={actionLoading === 'release'}
                disabled={!isConnected}
                accent="#00e5ff"
              >
                ⟳ Release Deposit
              </GlowBtn>
              <p className="text-[9px] font-mono text-slate-600 mt-2">
                Transfers ETH back to tenant
              </p>
            </div>
          </div>
        </GlowCard>

        {/* ── 7. FLOW DIAGRAM ── */}
        <GlowCard accent="#00e5ff" delay={500} className="md:col-span-2 xl:col-span-3">
          <h3 className="text-base font-bold text-white mb-5">Protocol Flow</h3>
          <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2">
            {[
              { icon: '⬡', label: 'Connect\nWallet', color: '#00e5ff' },
              { icon: '🔒', label: 'Lock\nDeposit', color: '#00ff9f' },
              { icon: '📸', label: 'Upload\nImages', color: '#f59e0b' },
              { icon: '🤖', label: 'AI\nAnalysis', color: '#ff4455' },
              { icon: '✓', label: 'Approve\nReturn', color: '#a78bfa' },
              { icon: '💸', label: 'Release\nFunds', color: '#00e5ff' },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${step.color}14`, border: `1px solid ${step.color}33` }}
                  >
                    {step.icon}
                  </div>
                  <p className="font-mono text-[9px] text-center whitespace-pre-line text-slate-500 leading-tight">
                    {step.label}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-8 h-px data-flow flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </GlowCard>

      </main>

      {/* ─── FOOTER ─────────────────────────────── */}
      <footer className="text-center py-6 font-mono text-[10px] text-slate-700 tracking-widest">
        RENTPROOF · RAT_CHAIN PROTOCOL · SEPOLIA TESTNET ·{' '}
        <span style={{ color: '#00e5ff33' }}>{CONTRACT_ADDRESS.slice(0, 10)}…</span>
      </footer>
    </>
  )
}
