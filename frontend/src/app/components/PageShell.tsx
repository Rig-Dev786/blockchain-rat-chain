'use client'
import Navbar from '@/app/components/Navbar'
import { ReactNode } from 'react'

export default function PageShell({ children, title, subtitle, accent = '#1D4ED8', watermark }: {
  children: ReactNode; title: string; subtitle: string; accent?: string; watermark?: string
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        body { background: #F7F6F1 !important; color: #111110; }
      `}</style>
      <div className="fixed inset-0" style={{ background: '#F7F6F1', zIndex: -2 }} />
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle,#C8C4BC 1px,transparent 1px)', backgroundSize: '32px 32px', opacity: 0.25, zIndex: -1 }} />
      {watermark && (
        <div className="fixed pointer-events-none select-none" style={{ bottom: '5%', right: '-2%', fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(4rem,14vw,10rem)', color: accent, opacity: 0.04, userSelect: 'none', zIndex: 0, letterSpacing: '-0.04em' }}>
          {watermark}
        </div>
      )}

      <Navbar />

      <main style={{ paddingTop: 80, paddingBottom: 60, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <div className="max-w-5xl mx-auto px-5">
          {/* Page header */}
          <div style={{ marginBottom: '2.5rem', paddingTop: '1.5rem', borderBottom: '1px solid #ECEAE3', paddingBottom: '1.5rem' }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.62rem', color: '#A09D97', letterSpacing: '0.18em', display: 'block', marginBottom: '0.5rem' }}>
              RENTPROOF · RAT_CHAIN
            </span>
            <h1 style={{ fontFamily: "'DM Serif Display',serif", fontWeight: 400, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#111110', letterSpacing: '-0.02em' }}>
              {title.split(' ').slice(0, -1).join(' ')}{' '}
              <span style={{ color: accent, fontStyle: 'italic' }}>{title.split(' ').slice(-1)}</span>
            </h1>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', color: '#888580', marginTop: '0.4rem' }}>{subtitle}</p>
          </div>
          {children}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #ECEAE3', background: '#FFFFFF', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6rem', color: '#C8C4BC', letterSpacing: '0.15em' }}>
          RENTPROOF · RAT_CHAIN PROTOCOL · SEPOLIA TESTNET
        </p>
      </footer>
    </>
  )
}
