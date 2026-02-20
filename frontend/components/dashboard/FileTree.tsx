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
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return '#3b82f6';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return '#f59e0b';
  if (name.endsWith('.json')) return '#10b981';
  if (name.endsWith('.md')) return '#8b5cf6';
  if (name.endsWith('.css')) return '#ec4899';
  return '#6b7280';
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
          className="w-full flex items-center gap-1.5 py-[3px] rounded text-left transition-colors hover:bg-white/[0.04] text-[12px]"
          style={{ paddingLeft: `${6 + depth * 14}px`, color: '#7c8db0' }}
        >
          <ChevronRight size={9} className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
          {open ? <FolderOpen size={12} style={{ color: '#f59e0b' }} /> : <Folder size={12} style={{ color: '#f59e0b' }} />}
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
      className="w-full flex items-center gap-1.5 py-[3px] rounded text-left text-[12px] transition-all"
      style={{
        paddingLeft: `${6 + depth * 14}px`,
        color: isSelected ? '#93c5fd' : '#6b7280',
        background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <FileText size={11} className="shrink-0" style={{ color: getFileColor(node.name) }} />
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
    <div className="flex flex-col h-full select-none" style={{ background: '#080c15' }}>
      <div className="px-3 pt-3 pb-2.5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-[12px] font-medium truncate">
          <span style={{ color: '#10b981' }}>{owner}</span>
          <span style={{ color: '#3d4a63' }}> / </span>
          <span className="text-white font-semibold">{repo}</span>
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: '#3d4a63' }}>{safeFiles.length} files</p>
      </div>

      <div className="px-2 py-2 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <Search size={10} style={{ color: '#3d4a63' }} />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-[11px] outline-none flex-1"
            style={{ color: '#7c8db0' }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1 px-1">
        {safeFiles.length === 0 ? (
          <p className="text-[11px] text-center mt-6" style={{ color: '#3d4a63' }}>No files loaded</p>
        ) : filtered.length > 0 ? (
          filtered.map(file => (
            <button
              key={file.path}
              onClick={() => onSelect(file)}
              className="w-full flex items-center gap-2 px-2 py-1 text-left text-[11px] rounded transition-colors hover:bg-white/[0.04]"
              style={{ color: file.path === selectedFile ? '#93c5fd' : '#6b7280' }}
            >
              <FileText size={10} style={{ color: getFileColor(file.path) }} />
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