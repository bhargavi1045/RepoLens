'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  FileText,
  Lightbulb,
  Code2,
  GitBranch,
  Zap,
  Loader2,
  Bot,
  BarChart2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { FileItem } from './FileTree';

interface AiPanelProps {
  repoUrl: string;
  selectedFile: FileItem | null;
}

type Feature =
  | 'explain'
  | 'architecture'
  | 'workflow'
  | 'tests'
  | 'improvements'
  | 'analyze';

interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  contentType?: 'markdown' | 'mermaid' | 'code' | 'plain';
}

let msgId = 0;
const newMsg = (
  role: Message['role'],
  content: string,
  contentType?: Message['contentType']
): Message => ({
  id: ++msgId,
  role,
  content,
  contentType,
});

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="text-[15px]">
      {lines.map((line, i) => {
        if (line.startsWith('### '))
          return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith('## '))
          return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith('# '))
          return <h1 key={i}>{line.slice(2)}</h1>;

        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} style={{ marginLeft: '1rem', color: '#999' }}>
              {line.slice(2)}
            </li>
          );

        if (!line.trim()) return <br key={i} />;

        const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

        return (
          <p key={i}>
            {parts.map((p, j) => {
              if (p.startsWith('`') && p.endsWith('`'))
                return <code key={j}>{p.slice(1, -1)}</code>;
              if (p.startsWith('**') && p.endsWith('**'))
                return <strong key={j}>{p.slice(2, -2)}</strong>;
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
    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
      {raw}
    </pre>
  );
}

function CodeBlock({ content }: { content: string }) {
  const raw = content.replace(/```typescript|```ts|```/g, '').trim();

  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
      {raw}
    </pre>
  );
}

const FEATURES: {
  id: Feature;
  label: string;
  icon: React.ReactNode;
  needsFile?: boolean;
}[] = [
  { id: 'explain', label: 'Explain file', icon: <FileText size={14} />, needsFile: true },
  { id: 'architecture', label: 'Architecture', icon: <GitBranch size={14} /> },
  { id: 'workflow', label: 'Workflow', icon: <Zap size={14} /> },
  { id: 'tests', label: 'Unit Tests', icon: <Code2 size={14} />, needsFile: true },
  { id: 'improvements', label: 'Improvements', icon: <Lightbulb size={14} /> },
  { id: 'analyze', label: 'Analyze Repo', icon: <BarChart2 size={14} /> },
];

const USER_LABELS: Record<Feature, (f?: string) => string> = {
  explain: (f) => `Explain \`${f || 'this file'}\``,
  architecture: () => 'Generate architecture diagram',
  workflow: () => 'Explain execution workflow',
  tests: (f) => `Generate unit tests for \`${f || 'this file'}\``,
  improvements: (f) =>
    f ? `Suggest improvements for \`${f}\`` : 'Suggest repo-wide improvements',
  analyze: () => 'Analyze repository code quality',
};

export default function AiPanel({ repoUrl, selectedFile }: AiPanelProps) {
  const repoShort = repoUrl?.replace('https://github.com/', '') || repoUrl;

  const [messages, setMessages] = useState<Message[]>([
    newMsg(
      'assistant',
      `Hi! I'm your AI assistant for **${repoShort}** repository.`,
      'markdown'
    ),
  ]);

  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
  const [promptInput, setPromptInput] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const add = (msg: Message) =>
    setMessages((prev) => [...prev, msg]);

  const runFeature = async (feature: Feature) => {
    if (loading) return;

    if (
      (feature === 'explain' || feature === 'tests') &&
      !selectedFile
    ) {
      add(
        newMsg(
          'assistant',
          'Please select a file first.',
          'plain'
        )
      );
      return;
    }

    setLoading(true);
    setActiveFeature(feature);

    add(
      newMsg(
        'user',
        USER_LABELS[feature](selectedFile?.path),
        'plain'
      )
    );

    try {
      let content = '';
      let contentType: Message['contentType'] = 'markdown';

      switch (feature) {
        case 'explain': {
          const r = await api.explainFile(
            repoUrl,
            selectedFile!.path
          );
          content = r.explanation;
          break;
        }

        case 'architecture': {
          const r = await api.architecture(repoUrl);
          content = r.mermaidDiagram;
          contentType = 'mermaid';
          break;
        }

        case 'workflow': {
          const r = await api.workflow(repoUrl);
          content = r.workflow;
          break;
        }

        case 'tests': {
          const r = await api.unitTests(
            repoUrl,
            selectedFile!.path
          );
          content = r.tests;
          contentType = 'code';
          break;
        }

        case 'improvements': {
          const r = await api.improvements(
            repoUrl,
            selectedFile?.path
          );
          content = r.improvements;
          break;
        }

        case 'analyze': {
          const r = await api.analyze(repoUrl);

          content = `### Health Score: ${
            r.healthScore
          }/100\n\n${r.summary}\n\nSuggestions:\n${r.suggestions
            .map((s: string) => `- ${s}`)
            .join('\n')}`;

          break;
        }
      }

      add(newMsg('assistant', content, contentType));
    } catch (err: any) {
      add(
        newMsg(
          'assistant',
          err?.message || 'Error occurred',
          'plain'
        )
      );
    } finally {
      setLoading(false);
      setActiveFeature(null);
    }
  };

  const handleAskRepo = async () => {
    if (loading || !promptInput.trim()) return;

    const question = promptInput;
    setPromptInput('');
    setLoading(true);

    add(newMsg('user', question, 'plain'));

    try {
      const res = await api.askRepo(repoUrl, question);

      const content =
        res?.answer ??
        'No response from server.';

      add(newMsg('assistant', content, 'markdown'));
    } catch (err: any) {
      add(
        newMsg(
          'assistant',
          err?.message || 'Error occurred',
          'plain'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEADER */}
      <div style={{ padding: 12, borderBottom: '1px solid #222' }}>
        <div style={{ color: '#fff' }}>AI Assistant</div>
        <div style={{ fontSize: 12, color: '#666' }}>
          {repoShort}
        </div>
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 12 }}>
            <div style={{ color: msg.role === 'user' ? '#aaa' : '#fff' }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && <Loader2 className="animate-spin" />}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: 12, borderTop: '1px solid #222' }}>
        <input
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === 'Enter' && handleAskRepo()
          }
          placeholder="Ask..."
          style={{ width: '100%', padding: 10 }}
        />
      </div>
    </div>
  );
}