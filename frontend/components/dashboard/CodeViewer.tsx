'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { FileItem } from './FileTree';

export default function CodeViewer({ file }: { file: FileItem | null }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!file) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" style={{ background: '#0e0d11', color: '#505060' }}>
        <div className="text-7xl opacity-30 font-mono">{'< />'}</div>
        <p className="text-[16px] font-medium" style={{ color: '#606070' }}>Select a file to view</p>
        <p className="text-[13px]" style={{ color: '#404050' }}>Pick any file from the tree on the left</p>
      </div>
    );
  }

  const lines = file.content.split('\n');
  const fileName = file.path.split('/').pop() || file.path;
  const ext = file.path.split('.').pop() || 'txt';

  return (
    <div className="flex flex-col h-full" style={{ background: '#0e0d11' }}>
      <div className="flex items-center justify-between px-4 shrink-0"
        style={{ background: '#111014', borderBottom: '1px solid rgba(255,255,255,0.07)', height: '48px' }}>
        <div className="flex items-center gap-2 px-4 py-1.5 text-[14px] rounded-t-md -mb-[1px]"
          style={{ background: '#0e0d11', border: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid #0e0d11', color: '#e0e0ea', fontFamily: 'JetBrains Mono, monospace' }}>
          {fileName}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12px] uppercase tracking-widest font-mono" style={{ color: '#404050' }}>{ext}</span>
          <button onClick={handleCopy}
            className="flex items-center gap-2 text-[13px] px-3 py-1.5 rounded transition-all hover:bg-white/5"
            style={{ color: copied ? '#10b981' : '#606070' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', lineHeight: '1.8' }}>
        <table className="w-full border-collapse min-w-full">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td className="text-right pr-5 pl-6 select-none sticky left-0 w-10"
                  style={{ color: '#404050', background: '#0e0d11', minWidth: '3.8rem', userSelect: 'none', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  {i + 1}
                </td>
                <td className="pl-6 pr-10 whitespace-pre" style={{ color: '#c8c8d4' }}>
                  {line || '\u00a0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0c0c0f', height: '32px' }}>
        <span className="text-[12px] font-mono" style={{ color: '#404050' }}>{file.path}</span>
        <span className="text-[12px] font-mono" style={{ color: '#404050' }}>{lines.length} lines</span>
      </div>
    </div>
  );
}