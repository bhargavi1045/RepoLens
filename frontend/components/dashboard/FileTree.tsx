'use client';

import { useState } from 'react';
import { FileText, Folder, FolderOpen, Search, ChevronRight } from 'lucide-react';

export interface FileItem {
  path: string;
  content: string;
}

interface FileTreeProps {
  files?: FileItem[] | null | any;
  selectedFile: string | null;
  onSelect: (file: FileItem) => void;
  repoName: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  content?: string;
}

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
      if (existing) {
        if (!isFile && existing.children) current = existing.children;
      } else {
        const node: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          content: isFile ? file.content : undefined,
        };
        current.push(node);
        if (!isFile && node.children) current = node.children;
      }
    }
  }
  return root;
}

function getFileColor(name: string): string {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return '#a0a0b0';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return '#a0a0b0';
  if (name.endsWith('.json')) return '#909090';
  if (name.endsWith('.md')) return '#909090';
  if (name.endsWith('.css')) return '#a0a0b0';
  return '#707080';
}

function TreeItem({
  node, depth, selectedFile, onSelect,
}: {
  node: TreeNode; depth: number; selectedFile: string | null; onSelect: (file: FileItem) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isSelected = node.path === selectedFile;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-1.5 py-1 rounded text-left transition-colors hover:bg-white/[0.04] text-[14px]"
          style={{ paddingLeft: `${8 + depth * 16}px`, color: '#c0c0cc' }}
        >
          <ChevronRight size={12} className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
          {open ? <FolderOpen size={15} style={{ color: '#d0d0e0' }} /> : <Folder size={15} style={{ color: '#d0d0e0' }} />}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {open && node.children?.map(child => (
          <TreeItem key={child.path} node={child} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  if (!node.content) return null;

  return (
    <button
      onClick={() => onSelect({ path: node.path, content: node.content! })}
      className="w-full flex items-center gap-1.5 py-1 rounded text-left text-[14px] transition-all"
      style={{
        paddingLeft: `${8 + depth * 16}px`,
        color: isSelected ? '#ffffff' : '#909099',
        background: isSelected ? 'rgba(140,100,210,0.18)' : 'transparent',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <FileText size={13} className="shrink-0" style={{ color: getFileColor(node.name) }} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export default function FileTree({ files, selectedFile, onSelect, repoName }: FileTreeProps) {
  const [search, setSearch] = useState('');

  const safeFiles = normalizeFiles(files);
  const tree = buildTree(safeFiles);
  const filtered = search.trim()
    ? safeFiles.filter(f => f.path.toLowerCase().includes(search.toLowerCase()))
    : [];

  const parts = repoName.replace('https://github.com/', '').split('/');
  const owner = parts[0] || '';
  const repo  = parts[1] || '';

  return (
    <div className="flex flex-col h-full select-none" style={{ background: '#0e0d11' }}>
      <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="text-[15px] font-medium truncate">
          <span style={{ color: '#9B72CF' }}>{owner}</span>
          <span style={{ color: '#505060' }}> / </span>
          <span className="text-white font-semibold">{repo}</span>
        </p>
        <p className="text-[13px] mt-0.5" style={{ color: '#606070' }}>{safeFiles.length} files</p>
      </div>

      <div className="px-2.5 py-2.5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <Search size={13} style={{ color: '#606070' }} />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-[13px] outline-none flex-1"
            style={{ color: '#c0c0cc' }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5 px-1.5">
        {safeFiles.length === 0 ? (
          <p className="text-[13px] text-center mt-6" style={{ color: '#505060' }}>No files loaded</p>
        ) : filtered.length > 0 ? (
          filtered.map(file => (
            <button
              key={file.path}
              onClick={() => onSelect(file)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[13px] rounded transition-colors hover:bg-white/[0.04]"
              style={{ color: file.path === selectedFile ? '#ffffff' : '#909099' }}
            >
              <FileText size={13} style={{ color: getFileColor(file.path) }} />
              <span className="truncate">{file.path}</span>
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