'use client';

import { useState } from 'react';
import { FileText, Folder, FolderOpen, Search, ChevronRight } from 'lucide-react';

export interface FileItem { path: string; content: string; }

interface FileTreeProps { files?: FileItem[] | null | any; selectedFile: string | null; onSelect: (file: FileItem) => void; repoName: string; }
interface TreeNode { name: string; path: string; type: 'file' | 'folder'; children?: TreeNode[]; content?: string; }

function normalizeFiles(raw: any): FileItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(f => f?.path);
  if (Array.isArray(raw.files)) return raw.files.filter((f: any) => f?.path);
  if (Array.isArray(raw.data))  return raw.data.filter((f: any) => f?.path);
  return [];
}

function buildTree(files: FileItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    if (!file?.path) continue;
    const parts = file.path.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existing = current.find(n => n.name === part);
      if (existing) { if (!isFile && existing.children) current = existing.children; }
      else {
        const node: TreeNode = { name: part, path: parts.slice(0, i + 1).join('/'), type: isFile ? 'file' : 'folder', children: isFile ? undefined : [], content: isFile ? file.content : undefined };
        current.push(node);
        if (!isFile && node.children) current = node.children;
      }
    }
  }
  return root;
}

function TreeItem({ node, depth, selectedFile, onSelect }: { node: TreeNode; depth: number; selectedFile: string | null; onSelect: (file: FileItem) => void }) {
  const [open, setOpen] = useState(depth < 1);
  const isSelected = node.path === selectedFile;

  if (node.type === 'folder') {
    return (
      <div>
        <button onClick={() => setOpen(!open)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: `4px 8px 4px ${8 + depth * 16}px`, background: 'transparent', border: 'none', cursor: 'pointer', color: '#999', textAlign: 'left', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}
          onMouseEnter={e => e.currentTarget.style.background = '#111'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ChevronRight size={12} style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: '#555' }} />
          {open ? <FolderOpen size={14} style={{ color: '#888' }} /> : <Folder size={14} style={{ color: '#888' }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{node.name}</span>
        </button>
        {open && node.children?.map(child => (
          <TreeItem key={child.path} node={child} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  if (!node.content) return null;

  return (
    <button onClick={() => onSelect({ path: node.path, content: node.content! })}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
        padding: `4px 8px 4px ${8 + depth * 16}px`,
        background: isSelected ? '#1a1a1a' : 'transparent',
        border: 'none', borderLeft: isSelected ? '2px solid #888' : '2px solid transparent',
        cursor: 'pointer', color: isSelected ? '#fff' : '#666', textAlign: 'left', fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#111'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
      <FileText size={12} style={{ flexShrink: 0, color: isSelected ? '#bbb' : '#444' }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
    </button>
  );
}

export default function FileTree({ files, selectedFile, onSelect, repoName }: FileTreeProps) {
  const [search, setSearch] = useState('');
  const safeFiles = normalizeFiles(files);
  const tree = buildTree(safeFiles);
  const filtered = search.trim() ? safeFiles.filter(f => f.path.toLowerCase().includes(search.toLowerCase())) : [];
  const parts = repoName.replace('https://github.com/', '').split('/');
  const owner = parts[0] || '';
  const repo  = parts[1] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', userSelect: 'none', background: '#0a0a0a' }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#aaa' }}>{owner}</span>
          <span style={{ color: '#444' }}> / </span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{repo}</span>
        </p>
        <p style={{ fontSize: 12, marginTop: 2, color: '#444' }}>{safeFiles.length} files</p>
      </div>

      <div style={{ padding: '8px 10px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#111', border: '1px solid #1e1e1e', borderRadius: 6 }}>
          <Search size={12} style={{ color: '#555', flexShrink: 0 }} />
          <input suppressHydrationWarning type="text" placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#ccc', flex: 1, fontFamily: "'JetBrains Mono', monospace" }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 4px' }}>
        {safeFiles.length === 0 ? (
          <p style={{ fontSize: 12, textAlign: 'center', marginTop: 24, color: '#444' }}>No files loaded</p>
        ) : filtered.length > 0 ? (
          filtered.map(file => (
            <button key={file.path} onClick={() => onSelect(file)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
                background: file.path === selectedFile ? '#1a1a1a' : 'transparent',
                border: 'none', borderLeft: file.path === selectedFile ? '2px solid #888' : '2px solid transparent',
                cursor: 'pointer', color: file.path === selectedFile ? '#fff' : '#666', textAlign: 'left', fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
              }}
              onMouseEnter={e => { if (file.path !== selectedFile) e.currentTarget.style.background = '#111'; }}
              onMouseLeave={e => { if (file.path !== selectedFile) e.currentTarget.style.background = 'transparent'; }}>
              <FileText size={12} style={{ color: '#444', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</span>
            </button>
          ))
        ) : (
          tree.map(node => (
            <TreeItem key={node.path} node={node} depth={0} selectedFile={selectedFile} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  );
}