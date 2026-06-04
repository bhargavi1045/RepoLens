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

/* ---------------- SAFE TYPE GUARD ---------------- */
function isFileItem(obj: unknown): obj is FileItem {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof (obj as Record<string, unknown>).path === 'string' &&
    typeof (obj as Record<string, unknown>).content === 'string'
  );
}

/* ---------------- NORMALIZE INPUT ---------------- */
function normalizeFiles(raw: unknown): FileItem[] {
  if (!raw || typeof raw !== 'object') return [];

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

/* ---------------- BUILD TREE ---------------- */
function buildTree(files: FileItem[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    if (!file?.path) continue;

    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;

      let existing = current.find(n => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          content: isFile ? file.content : undefined,
        };

        current.push(existing);
      }

      if (!isFile && existing.children) {
        current = existing.children;
      }
    });
  }

  return root;
}

/* ---------------- TREE ITEM ---------------- */
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
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
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
      onClick={() =>
        onSelect({ path: node.path, content: node.content! })
      }
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

/* ---------------- MAIN COMPONENT ---------------- */
export default function FileTree({
  files,
  selectedFile,
  onSelect,
  repoName,
}: FileTreeProps) {
  const [search, setSearch] = useState('');

  const safeFiles = normalizeFiles(files);
  const tree = buildTree(safeFiles);

  const filteredFiles =
    search.trim().length > 0
      ? safeFiles.filter(f =>
          f.path.toLowerCase().includes(search.toLowerCase())
        )
      : [];

  const parts = repoName
    ?.replace('https://github.com/', '')
    ?.split('/') ?? [];

  const owner = parts[0] || '';
  const repo = parts[1] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEADER */}
      <div style={{ padding: '14px' }}>
        <p style={{ color: '#aaa' }}>
          <span style={{ color: '#fff' }}>{owner}</span> /{' '}
          <span style={{ color: '#fff' }}>{repo}</span>
        </p>
        <p style={{ fontSize: 12, color: '#555' }}>{safeFiles.length} files</p>
      </div>

      {/* SEARCH */}
      <div style={{ padding: '8px 10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #222',
            padding: '6px 8px',
            borderRadius: 4,
          }}
        >
          <Search size={12} color="#666" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ccc',
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </div>
      </div>

      {/* TREE */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {safeFiles.length === 0 ? (
          <p style={{ padding: 12, color: '#555' }}>No files loaded</p>
        ) : search.trim() ? (
          filteredFiles.length > 0 ? (
            filteredFiles.map(file => (
              <button
                key={file.path}
                onClick={() => onSelect(file)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  background: '#111',
                  border: 'none',
                  color: '#ccc',
                  cursor: 'pointer',
                }}
              >
                <FileText size={12} /> {file.path}
              </button>
            ))
          ) : (
            <p style={{ padding: 12, color: '#555' }}>No matching files</p>
          )
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