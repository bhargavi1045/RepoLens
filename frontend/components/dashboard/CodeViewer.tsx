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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0a0a0a', gap: 12 }}>
        <div style={{ fontSize: 56, opacity: 0.15, fontFamily: 'monospace', color: '#fff' }}>{'< />'}</div>
        <p style={{ fontSize: 15, color: '#555' }}>Select a file to view</p>
        <p style={{ fontSize: 12, color: '#333' }}>Pick any file from the tree on the left</p>
      </div>
    );
  }

  const lines = file.content.split('\n');
  const fileName = file.path.split('/').pop() || file.path;
  const ext = file.path.split('.').pop() || 'txt';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#111', borderBottom: '1px solid #1e1e1e', height: 48, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '4px 12px', background: '#0a0a0a', border: '1px solid #1e1e1e', borderBottom: '1px solid #0a0a0a', borderRadius: '4px 4px 0 0', color: '#ddd', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
          {fileName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#444' }}>{ext}</span>
          <button onClick={handleCopy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 10px', borderRadius: 4, border: 'none', background: 'transparent', color: copied ? '#4ade80' : '#666', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}
                onMouseEnter={e => e.currentTarget.style.background = '#111'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ textAlign: 'right', paddingRight: 18, paddingLeft: 20, color: '#444', background: '#0a0a0a', minWidth: '3.5rem', userSelect: 'none', borderRight: '1px solid #1a1a1a', position: 'sticky', left: 0 }}>
                  {i + 1}
                </td>
                <td style={{ paddingLeft: 20, paddingRight: 40, whiteSpace: 'pre', color: '#c0c0c0' }}>
                  {line || '\u00a0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderTop: '1px solid #1a1a1a', background: '#0d0d0d', height: 30, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>{file.path}</span>
        <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>{lines.length} lines</span>
      </div>
    </div>
  );
}