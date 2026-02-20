'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Github, Zap, Eye, Code2, GitBranch, BarChart2, Lightbulb } from 'lucide-react';

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = repoUrl.trim();
    if (!trimmed) { setError('Please enter a GitHub repository URL'); return; }
    const match = trimmed.match(/(?:https?:\/\/)?github\.com\/([^/\s]+)\/([^/\s]+)/);
    if (!match) { setError('Enter a valid GitHub URL — e.g. github.com/owner/repo'); return; }
    const full = `https://github.com/${match[1]}/${match[2]}`;
    router.push(`/dashboard?repo=${encodeURIComponent(full)}`);
  };

  const FEATURES = [
    { icon: <Eye size={16} />, title: 'Explain File', desc: 'Understand what any file does, its role, and how it connects to the rest of the codebase.', color: '#3b82f6' },
    { icon: <GitBranch size={16} />, title: 'Architecture Diagram', desc: 'Auto-generate a Mermaid.js diagram of module relationships and data flow.', color: '#7c3aed' },
    { icon: <Zap size={16} />, title: 'Workflow Analysis', desc: 'Step-by-step breakdown of how the repo executes from entry point to response.', color: '#10b981' },
    { icon: <Code2 size={16} />, title: 'Unit Test Generator', desc: 'Generate comprehensive Jest tests for any file with mocks and edge cases covered.', color: '#f59e0b' },
    { icon: <Lightbulb size={16} />, title: 'Improvements', desc: 'Actionable suggestions for performance, security, and code quality improvements.', color: '#ef4444' },
    { icon: <BarChart2 size={16} />, title: 'Code Analysis', desc: 'ESLint-powered static analysis with a health score and prioritised issue list.', color: '#8b5cf6' },
  ];

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: '#07090f' }}>

      <div className="pointer-events-none fixed inset-0 z-0">
        <div style={{ position: 'absolute', top: '-10%', left: '15%', width: 700, height: 600, background: 'radial-gradient(ellipse, rgba(59,130,246,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '-5%', right: '10%', width: 500, height: 450, background: 'radial-gradient(ellipse, rgba(124,58,237,0.14) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '40%', width: 400, height: 350, background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.028) 1px,transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(ellipse 90% 70% at 50% 20%, black 20%, transparent 75%)' } as React.CSSProperties} />
      </div>

      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 h-[60px]"
        style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/" className="flex items-center gap-2 no-underline">
          <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-[13px]"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)' }}>🔍</div>
          <span className="font-bold text-white text-[15px]">RepoLens</span>
        </a>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-[13px] transition-colors hover:text-white" style={{ color: '#7c8db0' }}>Features</a>
          <a href="https://github.com" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-[13px] transition-colors hover:text-white" style={{ color: '#7c8db0' }}>
            <Github size={13} /> GitHub
          </a>
          <a href="/dashboard"
            className="text-[13px] font-semibold text-white px-4 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)' }}>
            Dashboard
          </a>
        </div>
      </nav>

      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-44 pb-32">
        <div className="afi inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-8"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)', color: '#60a5fa', opacity: 0 }}>
          <Zap size={10} /> AI-powered code understanding · RAG + Pinecone + Groq
        </div>

        <h1 className="afu text-[56px] sm:text-[68px] md:text-[80px] font-bold leading-[1.08] mb-6 max-w-4xl"
          style={{ opacity: 0, animationDelay: '0.08s' }}>
          <span style={{ background: 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 50%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Understand Github<br />repositories<br />in seconds
          </span>
        </h1>

        <p className="afu text-[16px] sm:text-[17px] font-medium mb-12 max-w-lg leading-relaxed"
          style={{ color: '#7c8db0', opacity: 0, animationDelay: '0.18s' }}>
          Instantly analyze, understand, and improve any GitHub project with AI-powered insights.
        </p>

        <form onSubmit={handleSubmit} className="afu flex gap-3 w-full max-w-[640px]"
          style={{ opacity: 0, animationDelay: '0.28s' }}>
          <input
            suppressHydrationWarning
            type="text"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="github.com/username/repository"
            className="flex-1 px-5 py-3.5 rounded-xl text-[15px] text-white placeholder-[#3d4a63] outline-none transition-all"
            style={{
              background: 'rgba(0,0,0,0.55)',
              border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : focused ? 'rgba(59,130,246,0.65)' : 'rgba(16,185,129,0.45)'}`,
              boxShadow: focused ? '0 0 24px rgba(59,130,246,0.12)' : 'none',
            }}
          />
          <button
            suppressHydrationWarning
            type="submit"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white text-[15px] transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.97] whitespace-nowrap shrink-0"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 24px rgba(124,58,237,0.38)' }}>
            Analyze Repository <ArrowRight size={15} />
          </button>
        </form>

        {error && <p className="afi mt-3 text-[13px] text-red-400" style={{ opacity: 0 }}>{error}</p>}

        <p className="afu mt-4 text-[12px]" style={{ color: '#3d4a63', opacity: 0, animationDelay: '0.36s' }}>
          Example: github.com/expressjs/express
        </p>
      </section>

      <section id="features" className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-28">
        <div className="text-center mb-12">
          <h2 className="text-[26px] font-bold text-white mb-3">Everything you need to understand a codebase</h2>
          <p className="text-[14px]" style={{ color: '#7c8db0' }}>Six AI-powered features, all in one dashboard</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, desc, color }) => (
            <div key={title}
              className="rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] group"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ background: `${color}18`, color }}>
                {icon}
              </div>
              <h3 className="font-semibold text-white text-[13px] mb-1.5">{title}</h3>
              <p className="text-[12px] leading-relaxed" style={{ color: '#7c8db0' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}