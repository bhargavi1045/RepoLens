'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, FileText, Lightbulb, Code2, GitBranch, Zap, Loader2, Bot, BarChart2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { FileItem } from './FileTree';

interface AiPanelProps { repoUrl: string; selectedFile: FileItem | null; }
type Feature = 'explain' | 'architecture' | 'workflow' | 'tests' | 'improvements' | 'analyze';
interface Message { id: number; role: 'assistant' | 'user'; content: string; contentType?: 'markdown' | 'mermaid' | 'code' | 'plain'; }

let msgId = 0;
const newMsg = (role: Message['role'], content: string, contentType?: Message['contentType']): Message =>
  ({ id: ++msgId, role, content, contentType });

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="md text-[15px]">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith('## '))  return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith('# '))   return <h1 key={i}>{line.slice(2)}</h1>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} style={{ marginLeft: '1rem', color: '#999', fontSize: '0.9375rem', lineHeight: 1.6 }}>{line.slice(2)}</li>;
        if (line.trim() === '') return <br key={i} />;
        const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((p, j) => {
              if (p.startsWith('`') && p.endsWith('`')) return <code key={j} style={{ color: '#bbb' }}>{p.slice(1, -1)}</code>;
              if (p.startsWith('**') && p.endsWith('**')) return <strong key={j} style={{ color: '#fff' }}>{p.slice(2, -2)}</strong>;
              return p;
            })}
          </p>
        );
      })}
    </div>
  );
}

function MermaidBlock({ content }: { content: string }) {
  const raw = content.replace(/```mermaid|```/g, '').trim();
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>
        Mermaid Diagram — paste at mermaid.live
      </p>
      <pre style={{ fontSize: 13, overflowX: 'auto', padding: 16, borderRadius: 6, background: '#0d0d0d', border: '1px solid #222', color: '#ccc', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre' }}>
        {raw}
      </pre>
    </div>
  );
}

function CodeBlock({ content }: { content: string }) {
  const raw = content.replace(/```typescript|```ts|```/g, '').trim();
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Generated Tests</p>
      <pre style={{ fontSize: 13, overflowX: 'auto', padding: 16, borderRadius: 6, background: '#0d0d0d', border: '1px solid #222', color: '#ccc', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre' }}>
        {raw}
      </pre>
    </div>
  );
}

const FEATURES: { id: Feature; label: string; icon: React.ReactNode; needsFile?: boolean }[] = [
  { id: 'explain',      label: 'Explain file',  icon: <FileText size={14} />,  needsFile: true },
  { id: 'architecture', label: 'Architecture',  icon: <GitBranch size={14} /> },
  { id: 'workflow',     label: 'Workflow',       icon: <Zap size={14} /> },
  { id: 'tests',        label: 'Unit Tests',     icon: <Code2 size={14} />,     needsFile: true },
  { id: 'improvements', label: 'Improvements',  icon: <Lightbulb size={14} /> },
  { id: 'analyze',      label: 'Analyze Repo',  icon: <BarChart2 size={14} /> },
];

const USER_LABELS: Record<Feature, (f?: string) => string> = {
  explain:      (f) => `Explain \`${f || 'this file'}\``,
  architecture: ()  => 'Generate architecture diagram',
  workflow:     ()  => 'Explain execution workflow',
  tests:        (f) => `Generate unit tests for \`${f || 'this file'}\``,
  improvements: (f) => f ? `Suggest improvements for \`${f}\`` : 'Suggest repo-wide improvements',
  analyze:      ()  => 'Analyze repository code quality',
};

export default function AiPanel({ repoUrl, selectedFile }: AiPanelProps) {
  const repoShort = repoUrl.replace('https://github.com/', '');
  const [messages, setMessages] = useState<Message[]>([
    newMsg('assistant', `Hi! I'm your AI assistant for the **${repoShort}** repository.\n\nSelect a file from the tree and click a feature button below.`, 'markdown'),
  ]);
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const add = (msg: Message) => setMessages(prev => [...prev, msg]);

  const runFeature = async (feature: Feature) => {
    if (loading) return;
    if ((feature === 'explain' || feature === 'tests') && !selectedFile) {
      add(newMsg('assistant', 'Please select a file from the file tree first.', 'plain')); return;
    }
    setActiveFeature(feature); setLoading(true);
    add(newMsg('user', USER_LABELS[feature](selectedFile?.path), 'plain'));
    try {
      let content = '';
      let contentType: Message['contentType'] = 'markdown';
      switch(feature) {
        case 'explain':      { const r = await api.explainFile(repoUrl, selectedFile!.path); content = r.explanation; break; }
        case 'architecture': { const r = await api.architecture(repoUrl); content = r.mermaidDiagram; contentType = 'mermaid'; break; }
        case 'workflow':     { const r = await api.workflow(repoUrl); content = r.workflow; break; }
        case 'tests':        { const r = await api.unitTests(repoUrl, selectedFile!.path); content = r.tests; contentType = 'code'; break; }
        case 'improvements': { const r = await api.improvements(repoUrl, selectedFile?.path); content = r.improvements; break; }
        case 'analyze':      { const r = await api.analyze(repoUrl); content = `### Health Score: ${r.healthScore}/100\n\n${r.summary}\n\n**Suggestions**\n${r.suggestions.map((s: string) => `- ${s}`).join('\n')}`; break; }
      }
      add(newMsg('assistant', content, contentType));
    } catch (err: any) {
      add(newMsg('assistant', `Error: ${err.message}`, 'plain'));
    } finally { setLoading(false); setActiveFeature(null); }
  };

  const handleAskRepo = async () => {
    if (loading || !promptInput.trim()) return;
    setLoading(true);
    add(newMsg('user', promptInput, 'plain'));
    try {
      const res = await api.askRepo(repoUrl, promptInput);
      const content = !res ? 'No response from server.' : typeof (res as any).answer === 'string' ? (res as any).answer : JSON.stringify((res as any).answer, null, 2);
      add(newMsg('assistant', content, 'markdown'));
    } catch (err: any) {
      add(newMsg('assistant', `Error: ${err.message}`, 'plain'));
    } finally { setLoading(false); setPromptInput(''); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #1e1e1e', flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={20} style={{ color: '#aaa' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1, marginBottom: 4 }}>AI Assistant</p>
          <p style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repoShort}</span>
          </p>
        </div>
        <button onClick={() => setMessages([newMsg('assistant', `Hi! I'm your AI assistant for **${repoShort}**.\n\nSelect a file and use the buttons below.`, 'markdown')])}
          style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#555', borderRadius: 6 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 28, height: 28, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <Bot size={14} style={{ color: '#888' }} />
              </div>
            )}
            <div style={{
              maxWidth: '88%', borderRadius: 10, padding: '10px 14px',
              background: msg.role === 'user' ? '#161616' : '#111',
              border: `1px solid ${msg.role === 'user' ? '#2a2a2a' : '#1e1e1e'}`,
            }}>
              {msg.contentType === 'mermaid' ? <MermaidBlock content={msg.content} /> :
               msg.contentType === 'code'    ? <CodeBlock content={msg.content} /> :
               msg.contentType === 'markdown' ? <MarkdownText content={msg.content} /> :
               <p style={{ fontSize: 14, color: '#aaa' }}>{msg.content}</p>}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={14} style={{ color: '#888' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#111', border: '1px solid #1e1e1e' }}>
              <Loader2 size={15} className="animate-spin" style={{ color: '#666' }} />
              <span style={{ fontSize: 13, color: '#666' }}>Analyzing with AI...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid #1e1e1e', padding: '12px 14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {FEATURES.map(f => (
            <button key={f.id} onClick={() => runFeature(f.id)} disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                background: activeFeature === f.id ? '#222' : '#111',
                border: `1px solid ${activeFeature === f.id ? '#444' : '#222'}`,
                color: f.needsFile && !selectedFile ? '#444' : activeFeature === f.id ? '#ddd' : '#888',
                opacity: loading && activeFeature !== f.id ? 0.4 : 1,
                transition: 'all 0.15s',
              }}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#111', border: '1px solid #222' }}>
          <input
            type="text" placeholder="Ask about this repository..."
            value={promptInput} onChange={e => setPromptInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAskRepo(); } }}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#ccc', fontFamily: "'JetBrains Mono', monospace" }}
            disabled={loading}
          />
          <button onClick={handleAskRepo} disabled={loading || !promptInput.trim()}
            style={{ background: 'transparent', border: 'none', cursor: promptInput.trim() ? 'pointer' : 'not-allowed', padding: 0, opacity: promptInput.trim() ? 1 : 0.2 }}>
            <Send size={16} style={{ color: '#888' }} />
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, marginTop: 10, color: '#444' }}>
          AI can make mistakes. Review generated code before use.
        </p>
      </div>
    </div>
  );
}