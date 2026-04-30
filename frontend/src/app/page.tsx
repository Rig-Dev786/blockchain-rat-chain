'use client'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'

function Particles() {
  const [pts, setPts] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; dur: number }>>([])
  useEffect(() => {
    setPts(Array.from({ length: 18 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 3 + 1.5, delay: Math.random() * 6, dur: Math.random() * 8 + 8,
    })))
  }, [])
  const colors = ['#1D4ED8', '#15803D', '#B45309', '#7C3AED', '#B91C1C']
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {pts.map(p => (
        <div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: colors[p.id % colors.length], opacity: 0.07, animation: `pfloat ${p.dur}s ease-in-out ${p.delay}s infinite` }} />
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        body { background: #F7F6F1 !important; color: #111110; }
        @keyframes pfloat { 0%,100%{transform:translateY(0) scale(1);opacity:0.07} 50%{transform:translateY(-20px) scale(1.1);opacity:0.12} }
      `}</style>

      <div className="fixed inset-0" style={{ background: '#F7F6F1', zIndex: -2 }} />
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #C8C4BC 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.28, zIndex: -1 }} />
      {/* Global watermark */}
      <div className="fixed pointer-events-none select-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-12deg)', fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(5rem,18vw,14rem)', color: '#1D4ED8', opacity: 0.025, whiteSpace: 'nowrap', zIndex: 0, userSelect: 'none' }}>
        RENTPROOF
      </div>
      <Particles />
      <Navbar />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <LandingPage />
        <footer style={{ borderTop: '1px solid #ECEAE3', background: '#FFFFFF', padding: '2.5rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: -10, right: 20, fontFamily: "'DM Serif Display',serif", fontSize: '5rem', color: '#1D4ED8', opacity: 0.04, userSelect: 'none', pointerEvents: 'none' }}>PROOF</div>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', color: '#C8C4BC', letterSpacing: '0.18em', position: 'relative' }}>
            RENTPROOF · RAT_CHAIN PROTOCOL · SEPOLIA TESTNET · © 2025
          </p>
        </footer>
      </div>
    </>
  )
}
