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
      <div className="flex flex-col items-center justify-center h-full gap-3" style={{ background: '#060910', color: '#3d4a63' }}>
        <div className="text-5xl opacity-30 font-mono">{'< />'}</div>
        <p className="text-[13px] font-medium" style={{ color: '#3d4a63' }}>Select a file to view</p>
        <p className="text-[11px]" style={{ color: '#2a3347' }}>Pick any file from the tree on the left</p>
      </div>
    );
  }

  const lines = file.content.split('\n');
  const fileName = file.path.split('/').pop() || file.path;
  const ext = file.path.split('.').pop() || 'txt';

  return (
    <div className="flex flex-col h-full" style={{ background: '#060910' }}>
      <div className="flex items-center justify-between px-3 shrink-0"
        style={{ background: '#07090f', borderBottom: '1px solid rgba(255,255,255,0.06)', height: '38px' }}>
        <div className="flex items-center gap-2 px-3 py-1 text-[12px] rounded-t-md -mb-[1px]"
          style={{ background: '#060910', border: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid #060910', color: '#93c5fd', fontFamily: 'JetBrains Mono, monospace' }}>
          {fileName}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: '#2a3347' }}>{ext}</span>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded transition-all hover:bg-white/5"
            style={{ color: copied ? '#10b981' : '#3d4a63' }}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px', lineHeight: '1.7' }}>
        <table className="w-full border-collapse min-w-full">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.018)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td className="text-right pr-4 pl-5 select-none sticky left-0 w-10"
                  style={{ color: '#2a3347', background: '#060910', minWidth: '3.2rem', userSelect: 'none', borderRight: '1px solid rgba(255,255,255,0.035)' }}>
                  {i + 1}
                </td>
                <td className="pl-5 pr-8 whitespace-pre" style={{ color: '#c9d1d9' }}>
                  {line || '\u00a0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#050709', height: '24px' }}>
        <span className="text-[10px] font-mono" style={{ color: '#2a3347' }}>{file.path}</span>
        <span className="text-[10px] font-mono" style={{ color: '#2a3347' }}>{lines.length} lines</span>
      </div>
    </div>
  );
}