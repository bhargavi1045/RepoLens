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
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      router.push('/login');
    } catch {
      // fail silently or show toast if you want later
      router.push('/login');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = repoUrl.trim();

    if (!trimmed) {
      setError('error: --repo flag is required');
      return;
    }

    const match = trimmed.match(
      /(?:https?:\/\/)?github\.com\/([^/\s]+)\/([^/\s]+)/
    );

    if (!match) {
      setError('error: invalid GitHub URL format');
      return;
    }

    const full = `https://github.com/${match[1]}/${match[2]}`;
    router.push(`/dashboard?repo=${encodeURIComponent(full)}`);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#e0e0e0',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, #0d0d0d 2px, #0d0d0d 4px)',
          zIndex: 0,
        }}
      />

      {/* NAV */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: '#111',
          borderBottom: '1px solid #222',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
            RepoLens
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="#features" style={{ color: '#555', fontSize: 12 }}>
            --features
          </a>
          <a href="/dashboard" style={{ color: '#555', fontSize: 12 }}>
            --dashboard
          </a>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 4,
              color: '#888',
              fontSize: 12,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            $ logout
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '120px 24px 80px',
        }}
      >
        <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', color: '#fff' }}>
          Decode Github <br />
          <span style={{ color: '#bbb' }}>repositories</span>
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: 8,
            width: '100%',
            maxWidth: 600,
          }}
        >
          <input
            type="text"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            placeholder="github.com/username/repository"
            style={{
              flex: 1,
              padding: '12px',
              background: '#111',
              border: `1px solid ${error ? '#773333' : '#2a2a2a'}`,
              color: '#fff',
            }}
          />

          <button type="submit" style={{ background: '#fff', color: '#000' }}>
            $ analyze <ArrowRight size={14} />
          </button>
        </form>

        {error && (
          <p style={{ marginTop: 8, fontSize: 12, color: '#e05555' }}>
            {error}
          </p>
        )}

        <PixelGame />
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: 60, maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ color: '#fff' }}>
            Everything you need to understand a codebase
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: '#111', padding: 20 }}>
              <div>{f.icon}</div>
              <div style={{ color: '#ddd' }}>{f.title}</div>
              <div style={{ color: '#555' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}