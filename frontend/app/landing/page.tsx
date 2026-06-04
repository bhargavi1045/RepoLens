'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, GitBranch, Zap, Code2, Lightbulb, BarChart2 } from 'lucide-react';
import PixelGame from '../../components/PixelGame';

const FEATURES = [
  { icon: <Eye size={18} />, title: 'Explain File', desc: 'Understand what any file does, its role, and how it connects to the rest of the codebase.' },
  { icon: <GitBranch size={18} />, title: 'Architecture Diagram', desc: 'Auto-generate a Mermaid.js diagram of module relationships and data flow.' },
  { icon: <Zap size={18} />, title: 'Workflow Analysis', desc: 'Step-by-step breakdown of how the repo executes from entry point to response.' },
  { icon: <Code2 size={18} />, title: 'Unit Test Generator', desc: 'Generate comprehensive Jest tests for any file with mocks and edge cases covered.' },
  { icon: <Lightbulb size={18} />, title: 'Improvements', desc: 'Actionable suggestions for performance, security, and code quality improvements.' },
  { icon: <BarChart2 size={18} />, title: 'Code Analysis', desc: 'ESLint-powered static analysis with a health score and prioritised issue list.' },
];

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const trimmed = repoUrl.trim();
    if (!trimmed) { setError('error: --repo flag is required'); return; }
    const match = trimmed.match(/(?:https?:\/\/)?github\.com\/([^/\s]+)\/([^/\s]+)/);
    if (!match) { setError('error: invalid GitHub URL format'); return; }
    const full = `https://github.com/${match[1]}/${match[2]}`;
    router.push(`/dashboard?repo=${encodeURIComponent(full)}`);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'JetBrains Mono', monospace", color: '#e0e0e0' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #0d0d0d 2px, #0d0d0d 4px)', zIndex: 0 }} />

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: '#111', borderBottom: '1px solid #222', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, background: '#1a1a1a', border: '1px solid #444', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🔍</div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>RepoLens</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="#features" style={{ color: '#555', fontSize: 12, textDecoration: 'none' }}>--features</a>
          <a href="/dashboard" style={{ color: '#555', fontSize: 12, textDecoration: 'none' }}>--dashboard</a>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 12, padding: '4px 12px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>$ logout</button>
        </div>
      </nav>

      <section style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '120px 24px 80px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, padding: '4px 12px', fontSize: 11, color: '#888', marginBottom: 24, letterSpacing: '0.05em' }}>
          <span style={{ color: '#555' }}>$</span> repolens --version 1.0.0 --status ready
        </div>

        <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 20, color: '#fff' }}>
          Decode Github<br />
          <span style={{ color: '#bbb' }}>repositories</span><br />
          in seconds
        </h1>

        <p style={{ fontSize: 14, color: '#555', marginBottom: 32, maxWidth: 480, lineHeight: 1.7 }}>
          Transform any GitHub repository into actionable insights instantly with AI
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 600 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: 14 }}>›</span>
            <input
              type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
              placeholder="github.com/username/repository"
              style={{ width: '100%', padding: '12px 14px 12px 32px', background: '#111', border: `1px solid ${error ? '#773333' : '#2a2a2a'}`, borderRadius: 4, color: '#e0e0e0', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#666'}
              onBlur={e => { if (!error) e.target.style.borderColor = '#2a2a2a'; }}
            />
          </div>
          <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#fff', border: 'none', borderRadius: 4, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
            $ analyze <ArrowRight size={14} />
          </button>
        </form>
        {error && <p style={{ marginTop: 8, fontSize: 12, color: '#e05555' }}>{error}</p>}
        <p style={{ marginTop: 8, fontSize: 11, color: '#333' }}>e.g. github.com/expressjs/express</p>

        <div style={{ marginTop: 40 }}>
          <PixelGame />
        </div>
      </section>

      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '60px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ color: '#555', fontSize: 11, marginBottom: 8 }}>$ repolens --list-features</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#fff' }}>Everything you need to understand a codebase</h2>
          <p style={{ color: '#555', fontSize: 13, marginTop: 8 }}>Six AI-powered features, all in one dashboard</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title}
              style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 6, padding: 20, transition: 'border-color 0.15s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#555')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}>
              <div style={{ color: '#888', marginBottom: 10 }}>{icon}</div>
              <div style={{ color: '#ddd', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{title}</div>
              <div style={{ color: '#555', fontSize: 12, lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}