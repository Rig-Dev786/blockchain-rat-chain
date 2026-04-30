'use client'
import { useState } from 'react'
import { API_BASE_URL } from '@/lib/contract'
import PageShell from '@/app/components/PageShell'

const C = '#B91C1C'
type AR = { status: 'damage' | 'no_damage'; score: number; details: string } | null

export default function AnalysisPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [scan, setScan] = useState(false)
  const [result, setResult] = useState<AR>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const analyze = async () => {
    setAnalyzing(true); setScan(true); setMsg(null)
    try {
      const r = await fetch(`${API_BASE_URL}/analyze`, { method: 'POST' })
      const d: AR = await r.json()
      setResult(d)
      setMsg({ text: d?.status === 'damage' ? `Damage detected! Score: ${((d?.score ?? 0) * 100).toFixed(1)}%` : 'No damage found — property is clean!', ok: d?.status !== 'damage' })
    } catch {
      setResult({ status: 'no_damage', score: 0.96, details: 'Demo result — backend not connected' })
      setMsg({ text: 'Demo mode: backend not connected', ok: true })
    } finally { setAnalyzing(false); setTimeout(() => setScan(false), 2000) }
  }

  return (
    <PageShell title="AI Damage Analysis" subtitle="Run computer vision analysis to compare move-in vs move-out photos." accent={C} watermark="ANALYZE">
      <style>{`@keyframes scan-anim{0%{top:0;opacity:1}100%{top:100%;opacity:0}}.scan-bar{animation:scan-anim 1.8s ease-in-out forwards}`}</style>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner panel */}
        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAE3', borderRadius: 20, padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C},#B45309)`, borderRadius: '20px 20px 0 0' }} />
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.2rem', color: '#111110', marginBottom: '0.4rem' }}>Detection Scanner</h2>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#888580', marginBottom: '1.5rem' }}>AI model compares your uploaded images for damage signatures.</p>

          {/* Scan viewport */}
          <div style={{ position: 'relative', height: 160, borderRadius: 14, background: '#FEF2F2', border: '1px solid #FCA5A5', marginBottom: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {scan && <div className="scan-bar" style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${C},transparent)` }} />}
            {analyzing && (
              <div style={{ textAlign: 'center' }}>
                <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px' }}><circle cx="12" cy="12" r="10" stroke={C} strokeWidth="2" opacity=".2" /><path fill={C} opacity=".8" d="M4 12a8 8 0 018-8v8z" /></svg>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.68rem', color: C }}>SCANNING IMAGES...</p>
              </div>
            )}
            {!analyzing && result && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>{result.status === 'damage' ? '⚠️' : '✅'}</div>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.78rem', fontWeight: 600, color: result.status === 'damage' ? C : '#15803D' }}>
                  {result.status === 'damage' ? 'DAMAGE DETECTED' : 'NO DAMAGE FOUND'}
                </p>
              </div>
            )}
            {!analyzing && !result && (
              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: '#C8C4BC' }}>Ready to scan</p>
            )}
          </div>

          <button onClick={analyze} disabled={analyzing}
            style={{ width: '100%', fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem', borderRadius: 12, background: analyzing ? '#F5F5F4' : C, color: analyzing ? '#A09D97' : '#fff', border: `1px solid ${analyzing ? '#ECEAE3' : C}`, cursor: analyzing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: analyzing ? 'none' : `0 4px 18px ${C}33` }}>
            {analyzing ? 'Analyzing...' : '⬡ Run AI Analysis'}
          </button>
        </div>

        {/* Results panel */}
        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAE3', borderRadius: 20, padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#15803D,#1D4ED8)', borderRadius: '20px 20px 0 0' }} />
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.2rem', color: '#111110', marginBottom: '1.25rem' }}>Analysis Results</h2>

          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Score bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', marginBottom: 8 }}>
                  <span style={{ color: '#A09D97' }}>CONFIDENCE SCORE</span>
                  <span style={{ color: result.status === 'damage' ? C : '#15803D', fontWeight: 600 }}>{(result.score * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: '#F7F6F1', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, width: `${result.score * 100}%`, background: result.status === 'damage' ? `linear-gradient(90deg,${C},#B45309)` : 'linear-gradient(90deg,#15803D,#1D4ED8)', transition: 'width 1.2s cubic-bezier(.34,1.56,.64,1)' }} />
                </div>
              </div>

              {/* Status badge */}
              <div style={{ padding: '1rem', borderRadius: 12, background: result.status === 'damage' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${result.status === 'damage' ? '#FCA5A5' : '#BBF7D0'}` }}>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.1rem', color: result.status === 'damage' ? C : '#15803D', marginBottom: 4 }}>
                  {result.status === 'damage' ? 'Property Damage Found' : 'Property in Good Condition'}
                </p>
                {result.details && <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.78rem', color: result.status === 'damage' ? '#9B1C1C' : '#166534', lineHeight: 1.65 }}>{result.details}</p>}
              </div>

              {/* Next step hint */}
              <div style={{ padding: '0.9rem', borderRadius: 12, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6rem', color: '#1D4ED8', letterSpacing: '0.1em', marginBottom: 4 }}>NEXT STEP</p>
                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.65 }}>
                  Go to <strong>Contract Actions</strong> in the menu to approve the return or dispute the claim.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F7F6F1', border: '1px solid #ECEAE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🤖</div>
              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: '#C8C4BC' }}>Run analysis to see results</p>
            </div>
          )}
        </div>
      </div>

      {msg && (
        <div style={{ marginTop: 20, padding: '0.85rem 1.1rem', borderRadius: 12, background: msg.ok ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${msg.ok ? '#BBF7D0' : '#FCA5A5'}` }}>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: msg.ok ? '#15803D' : C }}>{msg.text}</p>
        </div>
      )}
    </PageShell>
  )
}
