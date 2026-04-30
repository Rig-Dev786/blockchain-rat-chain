'use client'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { truncateAddress } from '@/lib/contract'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { address, isConnected, chain } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const pathname = usePathname()
  const isApp = pathname.startsWith('/app')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>
      <header
        className="fixed top-0 left-0 right-0 z-50 px-6 flex items-center justify-between transition-all duration-300"
        style={{
          height: 60,
          background: scrolled ? 'rgba(247,246,241,0.94)' : 'rgba(247,246,241,0.7)',
          backdropFilter: 'blur(18px)',
          borderBottom: scrolled ? '1px solid #ECEAE3' : '1px solid transparent',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#1D4ED8,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.15rem', color: '#111110', letterSpacing: '-0.02em' }}>
            RENT<span style={{ color: '#1D4ED8' }}>PROOF</span>
          </span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Show "Back to Home" link when in app */}
          {isApp && (
            <Link href="/" style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: '#888580', textDecoration: 'none', padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid #ECEAE3', background: 'transparent', transition: 'all 0.18s' }}>
              ← Home
            </Link>
          )}

          {isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.3rem 0.75rem', borderRadius: 8, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803D', display: 'inline-block', boxShadow: '0 0 0 2px #15803D33' }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.72rem', color: '#1D4ED8' }}>{truncateAddress(address!)}</span>
              </div>
              <button onClick={() => disconnect()} style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.78rem', fontWeight: 500, padding: '0.32rem 0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid #FCA5A5', color: '#B91C1C', cursor: 'pointer' }}>
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={() => connect({ connector: injected() })} style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', fontWeight: 600, padding: '0.45rem 1.1rem', borderRadius: 9, background: '#111110', color: '#FFFFFF', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2D2D2C' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#111110' }}>
              ⬡ Connect Wallet
            </button>
          )}
        </div>
      </header>
    </>
  )
}
