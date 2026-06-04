'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FileTree, { FileItem } from '@/components/dashboard/FileTree';
import CodeViewer from '@/components/dashboard/CodeViewer';
import AiPanel from '@/components/dashboard/AiPanel';
import { api } from '@/lib/api';
import { Loader2, AlertCircle, Home, RefreshCw } from 'lucide-react';

const MIN_FILE_TREE_PCT = 15;
const MIN_CODE_PCT      = 30;
const MIN_AI_PANEL_PCT  = 20;
const DEFAULT_FILE_TREE = 20;
const DEFAULT_CODE      = 50;
const DEFAULT_AI_PANEL  = 30;

function ResizeHandle({ onMouseDown, isDragging }: { onMouseDown: (e: React.MouseEvent) => void; isDragging: boolean }) {
  const [hovered, setHovered] = useState(false);
  const active = isDragging || hovered;
  return (
    <div onMouseDown={onMouseDown} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: '5px', flexShrink: 0, cursor: 'col-resize', background: 'transparent', position: 'relative', zIndex: 10, userSelect: 'none' }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', transform: 'translateX(-50%)', background: active ? '#888' : '#222', transition: 'background 0.15s' }} />
    </div>
  );
}

function ResizablePanels({ leftPanel, centerPanel, rightPanel }: { leftPanel: React.ReactNode; centerPanel: React.ReactNode; rightPanel: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState({ left: DEFAULT_FILE_TREE, center: DEFAULT_CODE, right: DEFAULT_AI_PANEL });
  const dragging   = useRef<null | 'left' | 'right'>(null);
  const startX     = useRef(0);
  const startSizes = useRef(sizes);
  const [activeDrag, setActiveDrag] = useState<null | 'left' | 'right'>(null);

  const onMouseDownLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = 'left'; startX.current = e.clientX; startSizes.current = sizes; setActiveDrag('left');
  }, [sizes]);

  const onMouseDownRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = 'right'; startX.current = e.clientX; startSizes.current = sizes; setActiveDrag('right');
  }, [sizes]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const totalW = containerRef.current.offsetWidth;
      const deltaPct = ((e.clientX - startX.current) / totalW) * 100;
      const s = startSizes.current;
      if (dragging.current === 'left') {
        const newLeft = Math.max(MIN_FILE_TREE_PCT, Math.min(s.left + deltaPct, 100 - MIN_CODE_PCT - s.right));
        const newCenter = s.left + s.center - newLeft;
        if (newCenter < MIN_CODE_PCT) return;
        setSizes({ left: newLeft, center: newCenter, right: s.right });
      }
      if (dragging.current === 'right') {
        const newCenter = Math.max(MIN_CODE_PCT, Math.min(s.center + deltaPct, 100 - s.left - MIN_AI_PANEL_PCT));
        const newRight = s.center + s.right - newCenter;
        if (newRight < MIN_AI_PANEL_PCT) return;
        setSizes({ left: s.left, center: newCenter, right: newRight });
      }
    };
    const onUp = () => { dragging.current = null; setActiveDrag(null); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', userSelect: activeDrag ? 'none' : 'auto', cursor: activeDrag ? 'col-resize' : 'auto' }}>
      <div style={{ width: `${sizes.left}%`, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{leftPanel}</div>
      <ResizeHandle onMouseDown={onMouseDownLeft} isDragging={activeDrag === 'left'} />
      <div style={{ width: `${sizes.center}%`, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{centerPanel}</div>
      <ResizeHandle onMouseDown={onMouseDownRight} isDragging={activeDrag === 'right'} />
      <div style={{ width: `${sizes.right}%`, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{rightPanel}</div>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const repoUrl = searchParams.get('repo') || '';

  const [files,        setFiles]        = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [status,       setStatus]       = useState<'ingesting' | 'fetching' | 'ready' | 'error'>('ingesting');
  const [statusMsg,    setStatusMsg]    = useState('');
  const [error,        setError]        = useState('');
  const [isMobile,     setIsMobile]     = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!repoUrl) { router.push('/'); return; }
    init();
  }, [repoUrl]);

  const init = async (force = false) => {
    setStatus('ingesting'); setError('');
    try {
      setStatusMsg('Ingesting repository into vector store...');
      const ingestRes = await api.ingest(repoUrl, force);
      setStatusMsg(ingestRes.message?.includes('already') ? 'Repository already ingested.' : `Ingested ${ingestRes.chunkCount ?? 0} chunks.`);
      setStatus('fetching');
      setStatusMsg('Fetching repository files...');
      const fileList = await api.getFiles(repoUrl);
      setFiles(fileList);
      setStatus('ready');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
      setStatus('error');
    }
  };

  const repoName = repoUrl.replace('https://github.com/', '');
  const [owner, repo] = repoName.split('/');

  if (status === 'ingesting' || status === 'fetching') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#0a0a0a' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 64, height: 64, background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔍</div>
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, background: '#0a0a0a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: '#888' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 17, marginBottom: 4 }}>{repoName}</p>
            <p style={{ fontSize: 13, color: '#555' }}>{statusMsg}</p>
          </div>
          <div style={{ width: 200, height: 3, background: '#1a1a1a', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: '#fff', width: status === 'fetching' ? '75%' : '35%', transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e05555' }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 600 }}>Failed to load repository</span>
        </div>
        <p style={{ fontSize: 13, maxWidth: 400, textAlign: 'center', color: '#555' }}>{error}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', border: '1px solid #333', borderRadius: 6, color: '#aaa', fontSize: 13, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
            <Home size={14} /> Home
          </button>
          <button onClick={() => init(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: 'none', borderRadius: 6, color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#111', borderBottom: '1px solid #222', height: 44, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          <button onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'transparent', border: 'none', borderRadius: 4, color: '#888', cursor: 'pointer', fontSize: 12, fontFamily: "'JetBrains Mono', monospace' " }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Home size={12} /> Home
          </button>
          <span style={{ color: '#333' }}>·</span>
          <span style={{ color: '#aaa' }}>{owner}</span>
          <span style={{ color: '#444' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{repo}</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#666' }}>{files.length} files</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => init(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 4, color: '#888', fontSize: 11, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <RefreshCw size={11} /> Re-ingest
          </button>
          <button onClick={handleLogout}
            style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 11, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {isMobile ? (
          <div className="flex flex-col h-full overflow-y-auto">
            <div style={{ minHeight: 220, borderBottom: '1px solid #222' }}>
              <FileTree files={files} selectedFile={selectedFile?.path ?? null} onSelect={setSelectedFile} repoName={repoUrl} />
            </div>
            <div style={{ minHeight: 300, flex: '1 1 auto', borderBottom: '1px solid #222' }}>
              <CodeViewer file={selectedFile} />
            </div>
            <div style={{ minHeight: 320 }}>
              <AiPanel repoUrl={repoUrl} selectedFile={selectedFile} />
            </div>
          </div>
        ) : (
          <ResizablePanels
            leftPanel={<FileTree files={files} selectedFile={selectedFile?.path ?? null} onSelect={setSelectedFile} repoName={repoUrl} />}
            centerPanel={<CodeViewer file={selectedFile} />}
            rightPanel={<AiPanel repoUrl={repoUrl} selectedFile={selectedFile} />}
          />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <Loader2 size={22} className="animate-spin" style={{ color: '#888' }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}