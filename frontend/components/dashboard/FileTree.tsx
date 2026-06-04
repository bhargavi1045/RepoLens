'use client';

import { useState } from 'react';
import { FileText, Folder, FolderOpen, Search, ChevronRight } from 'lucide-react';

export interface FileItem {
  path: string;
  content: string;
}

interface FileTreeProps {
  files?: unknown;
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


function isFileItem(obj: any): obj is FileItem {
  return obj && typeof obj === 'object' && typeof obj.path === 'string';
}

function normalizeFiles(raw: unknown): FileItem[] {
  if (!raw || typeof raw !== 'object') return [];

  // direct array
  if (Array.isArray(raw)) {
    return raw.filter(isFileItem);
  }

  const maybe = raw as Record<string, unknown>;

  if (Array.isArray(maybe.files)) {
    return maybe.files.filter(isFileItem);
  }

  if (Array.isArray(maybe.data)) {
    return maybe.data.filter(isFileItem);
  }

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
        if (!isFile && existing.children) {
          current = existing.children;
        }
      } else {
        const node: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          content: isFile ? file.content : undefined,
        };

        current.push(node);

        if (!isFile && node.children) {
          current = node.children;
        }
      }
    }
  }

  return root;
}


function TreeItem({
  node,
  depth,
  selectedFile,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelect: (file: FileItem) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isSelected = node.path === selectedFile;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: `4px 8px 4px ${8 + depth * 16}px`,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#999',
            textAlign: 'left',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <ChevronRight
            size={12}
            style={{
              flexShrink: 0,
              transition: 'transform 0.15s',
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              color: '#555',
            }}
          />
          {open ? (
            <FolderOpen size={14} style={{ color: '#888' }} />
          ) : (
            <Folder size={14} style={{ color: '#888' }} />
          )}
          <span>{node.name}</span>
        </button>

        {open &&
          node.children?.map(child => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  if (!node.content) return null;

  return (
    <button
      onClick={() => onSelect({ path: node.path, content: node.content! })}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: `4px 8px 4px ${8 + depth * 16}px`,
        background: isSelected ? '#1a1a1a' : 'transparent',
        border: 'none',
        borderLeft: isSelected ? '2px solid #888' : '2px solid transparent',
        cursor: 'pointer',
        color: isSelected ? '#fff' : '#666',
        textAlign: 'left',
        fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <FileText size={12} style={{ color: isSelected ? '#bbb' : '#444' }} />
      <span>{node.name}</span>
    </button>
  );
}

export default function FileTree({
  files,
  selectedFile,
  onSelect,
  repoName,
}: FileTreeProps) {
  const [search, setSearch] = useState('');

  const safeFiles = normalizeFiles(files);
  const tree = buildTree(safeFiles);

  const filtered = search.trim()
    ? safeFiles.filter(f =>
        f.path.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const parts = repoName.replace('https://github.com/', '').split('/');
  const owner = parts[0] || '';
  const repo = parts[1] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px' }}>
        <p>
          <span>{owner}</span> / <span>{repo}</span>
        </p>
        <p>{safeFiles.length} files</p>
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={12} />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {safeFiles.length === 0 ? (
          <p>No files loaded</p>
        ) : filtered.length > 0 ? (
          filtered.map(file => (
            <button
              key={file.path}
              onClick={() => onSelect(file)}
            >
              <FileText size={12} />
              <span>{file.path}</span>
            </button>
          ))
        ) : (
          tree.map(node => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}