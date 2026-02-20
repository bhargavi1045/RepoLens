'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, FileText, Lightbulb, Code2, GitBranch, Zap, Loader2, Bot, BarChart2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { FileItem } from './FileTree';

interface AiPanelProps {
  repoUrl: string;
  selectedFile: FileItem | null;
}

type Feature = 'explain' | 'architecture' | 'workflow' | 'tests' | 'improvements' | 'analyze';

interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  contentType?: 'markdown' | 'mermaid' | 'code' | 'plain';
}

let msgId = 0;
const newMsg = (role: Message['role'], content: string, contentType?: Message['contentType']): Message =>
  ({ id: ++msgId, role, content, contentType });

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="md text-[15px]">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} style={{ marginLeft: '1rem', color: '#a0a0b0', fontSize: '0.9375rem', lineHeight: 1.6 }}>{line.slice(2)}</li>;
        if (line.trim() === '') return <br key={i} />;
        const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((p, j) => {
              if (p.startsWith('`') && p.endsWith('`')) return <code key={j}>{p.slice(1, -1)}</code>;
              if (p.startsWith('**') && p.endsWith('**')) return <strong key={j}>{p.slice(2, -2)}</strong>;
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
      <p className="text-[12px] font-semibold mb-2.5 uppercase tracking-widest" style={{ color: '#505060' }}>
        Mermaid Diagram — paste at mermaid.live
      </p>
      <pre className="text-[14px] overflow-x-auto p-5 rounded-lg leading-relaxed"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)', color: '#b0b0c0', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre' }}>
        {raw}
      </pre>
    </div>
  );
}

function CodeBlock({ content }: { content: string }) {
  const raw = content.replace(/```typescript|```ts|```/g, '').trim();
  return (
    <div>
      <p className="text-[12px] font-semibold mb-2.5 uppercase tracking-widest" style={{ color: '#505060' }}>Generated Tests</p>
      <pre className="text-[14px] overflow-x-auto p-5 rounded-lg leading-relaxed"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)', color: '#c8c8d4', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre' }}>
        {raw}
      </pre>
    </div>
  );
}

const FEATURES: { id: Feature; label: string; icon: React.ReactNode; needsFile?: boolean }[] = [
  { id: 'explain',      label: 'Explain file',   icon: <FileText size={15} />,  needsFile: true },
  { id: 'architecture', label: 'Architecture',   icon: <GitBranch size={15} /> },
  { id: 'workflow',     label: 'Workflow',        icon: <Zap size={15} /> },
  { id: 'tests',        label: 'Unit Tests',      icon: <Code2 size={15} />,     needsFile: true },
  { id: 'improvements', label: 'Improvements',   icon: <Lightbulb size={15} /> },
  { id: 'analyze',      label: 'Analyze Repo',   icon: <BarChart2 size={15} /> },
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const add = (msg: Message) => setMessages(prev => [...prev, msg]);

  const runFeature = async (feature: Feature) => {
    if (loading) return;
    if ((feature === 'explain' || feature === 'tests') && !selectedFile) {
      add(newMsg('assistant', 'Please select a file from the file tree first.', 'plain'));
      return;
    }

    setActiveFeature(feature);
    setLoading(true);
    add(newMsg('user', USER_LABELS[feature](selectedFile?.path), 'plain'));

    try {
      let content = '';
      let contentType: Message['contentType'] = 'markdown';

      switch(feature) {
        case 'explain':
          const resExplain = await api.explainFile(repoUrl, selectedFile!.path);
          content = resExplain.explanation;
          break;
        case 'architecture':
          const resArch = await api.architecture(repoUrl);
          content = resArch.mermaidDiagram;
          contentType = 'mermaid';
          break;
        case 'workflow':
          const resFlow = await api.workflow(repoUrl);
          content = resFlow.workflow;
          break;
        case 'tests':
          const resTests = await api.unitTests(repoUrl, selectedFile!.path);
          content = resTests.tests;
          contentType = 'code';
          break;
        case 'improvements':
          const resImp = await api.improvements(repoUrl, selectedFile?.path);
          content = resImp.improvements;
          break;
        case 'analyze':
          const resAnalyze = await api.analyze(repoUrl);
          content = `### Health Score: ${resAnalyze.healthScore}/100\n\n${resAnalyze.summary}\n\n**Suggestions**\n${resAnalyze.suggestions.map(s => `- ${s}`).join('\n')}`;
          break;
      }

      add(newMsg('assistant', content, contentType));
    } catch (err: any) {
      add(newMsg('assistant', `Error: ${err.message}`, 'plain'));
    } finally {
      setLoading(false);
      setActiveFeature(null);
    }
  };

  const handleAskRepo = async () => {
    if (loading) return;
    if (!promptInput.trim()) return;

    setLoading(true);
    add(newMsg('user', promptInput, 'plain'));

    try {
      const res = await api.askRepo(repoUrl, promptInput);
      let content = '';
      if (!res) content = 'No response from server.';
      else if (typeof (res as any).answer === 'string') content = (res as any).answer;
      else content = JSON.stringify((res as any).answer, null, 2);

      add(newMsg('assistant', content, 'markdown'));
    } catch (err: any) {
      add(newMsg('assistant', `Error: ${err.message}`, 'plain'));
    } finally {
      setLoading(false);
      setPromptInput('');
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0e0d11' }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#7B52AB,#C49CE0)' }}>
          <Bot size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-semibold text-white leading-none mb-1">AI Assistant</p>
          <p className="text-[13px] flex items-center gap-1.5" style={{ color: '#505060' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="truncate">{repoShort}</span>
          </p>
        </div>
        <button onClick={() => setMessages([newMsg('assistant', `Hi! I'm your AI assistant for **${repoShort}**.\n\nSelect a file and use the buttons below.`, 'markdown')])}
          className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#505060' }}>
          <X size={17} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg,#7B52AB,#C49CE0)' }}>
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className="max-w-[88%] rounded-xl px-4 py-3.5"
              style={{
                background: msg.role === 'user' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`
              }}>
              {msg.contentType === 'mermaid' ? <MermaidBlock content={msg.content} /> :
               msg.contentType === 'code' ? <CodeBlock content={msg.content} /> :
               msg.contentType === 'markdown' ? <MarkdownText content={msg.content} /> :
               <p className="text-[15px]" style={{ color: '#a0a0b0' }}>{msg.content}</p>}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#7B52AB,#C49CE0)' }}>
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: '#9B72CF' }} />
              <span className="text-[14px]" style={{ color: '#a0a0b0' }}>Analyzing with AI...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t px-4 pt-4 pb-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex flex-wrap gap-2 mb-4">
          {FEATURES.map(f => (
            <button key={f.id} onClick={() => runFeature(f.id)} disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all disabled:cursor-not-allowed"
              style={{
                background: activeFeature === f.id ? 'rgba(140,100,210,0.22)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeFeature === f.id ? 'rgba(140,100,210,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: f.needsFile && !selectedFile ? '#404050' : activeFeature === f.id ? '#e0d0f8' : '#c0c0cc',
                opacity: loading && activeFeature !== f.id ? 0.5 : 1,
              }}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            type="text"
            placeholder="Ask about this repository..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAskRepo(); } }}
            className="flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: '#c0c0cc' }}
            disabled={loading}
          />
          <button
            onClick={handleAskRepo}
            disabled={loading || !promptInput.trim()}
            className={`transition-opacity ${!promptInput.trim() ? 'opacity-20 cursor-not-allowed' : 'opacity-100'}`}
          >
            <Send size={17} style={{ color: '#9B72CF' }} />
          </button>
        </div>

        <p className="text-center text-[12px] mt-2.5" style={{ color: '#404050' }}>
          AI can make mistakes. Review generated code before use.
        </p>
      </div>
    </div>
  );
}