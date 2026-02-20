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

function ResizeHandle({
  onMouseDown,
  isDragging,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const active = isDragging || hovered;

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '5px',
        flexShrink: 0,
        cursor: 'col-resize',
        background: 'transparent',
        position: 'relative',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: '1px',
          transform: 'translateX(-50%)',
          background: active ? '#3b82f6' : 'rgba(255,255,255,0.06)',
          boxShadow: active ? '0 0 8px 2px rgba(59,130,246,0.55)' : 'none',
          transition: 'background 0.15s, box-shadow 0.15s',
        }}
      />
    </div>
  );
}

function ResizablePanels({
  leftPanel,
  centerPanel,
  rightPanel,
}: {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState({
    left:   DEFAULT_FILE_TREE,
    center: DEFAULT_CODE,
    right:  DEFAULT_AI_PANEL,
  });

  const dragging      = useRef<null | 'left' | 'right'>(null);
  const startX        = useRef(0);
  const startSizes    = useRef(sizes);
  const [activeDrag, setActiveDrag] = useState<null | 'left' | 'right'>(null);

  const onMouseDownLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current   = 'left';
    startX.current     = e.clientX;
    startSizes.current = sizes;
    setActiveDrag('left');
  }, [sizes]);

  const onMouseDownRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current   = 'right';
    startX.current     = e.clientX;
    startSizes.current = sizes;
    setActiveDrag('right');
  }, [sizes]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const totalW   = containerRef.current.offsetWidth;
      const deltaPct = ((e.clientX - startX.current) / totalW) * 100;
      const s        = startSizes.current;

      if (dragging.current === 'left') {
        const newLeft   = Math.max(MIN_FILE_TREE_PCT, Math.min(s.left + deltaPct, 100 - MIN_CODE_PCT - s.right));
        const newCenter = s.left + s.center - newLeft;
        if (newCenter < MIN_CODE_PCT) return;
        setSizes({ left: newLeft, center: newCenter, right: s.right });
      }

      if (dragging.current === 'right') {
        const newCenter = Math.max(MIN_CODE_PCT, Math.min(s.center + deltaPct, 100 - s.left - MIN_AI_PANEL_PCT));
        const newRight  = s.center + s.right - newCenter;
        if (newRight < MIN_AI_PANEL_PCT) return;
        setSizes({ left: s.left, center: newCenter, right: newRight });
      }
    };

    const onUp = () => {
      dragging.current = null;
      setActiveDrag(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display:    'flex',
        width:      '100%',
        height:     '100%',
        overflow:   'hidden',
        userSelect: activeDrag ? 'none' : 'auto',
        cursor:     activeDrag ? 'col-resize' : 'auto',
      }}
    >
      <div style={{ width: `${sizes.left}%`, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {leftPanel}
      </div>

      <ResizeHandle onMouseDown={onMouseDownLeft} isDragging={activeDrag === 'left'} />

      <div style={{ width: `${sizes.center}%`, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {centerPanel}
      </div>

      <ResizeHandle onMouseDown={onMouseDownRight} isDragging={activeDrag === 'right'} />

      <div style={{ width: `${sizes.right}%`, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {rightPanel}
      </div>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const repoUrl      = searchParams.get('repo') || '';

  const [files,        setFiles]        = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [status,       setStatus]       = useState<'ingesting' | 'fetching' | 'ready' | 'error'>('ingesting');
  const [statusMsg,    setStatusMsg]    = useState('');
  const [error,        setError]        = useState('');
  const [isMobile,     setIsMobile]     = useState(false);

  useEffect(() => {
    const mq      = window.matchMedia('(max-width: 768px)');
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
    setStatus('ingesting');
    setError('');
    try {
      setStatusMsg('Ingesting repository into vector store...');
      const ingestRes = await api.ingest(repoUrl, force);
      setStatusMsg(
        ingestRes.message?.includes('already')
          ? 'Repository already ingested.'
          : `Ingested ${ingestRes.chunkCount ?? 0} chunks.`
      );
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

  const repoName    = repoUrl.replace('https://github.com/', '');
  const [owner, repo] = repoName.split('/');

  if (status === 'ingesting' || status === 'fetching') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#07090f' }}>
        <div className="pointer-events-none fixed inset-0">
          <div style={{ position: 'absolute', top: '20%', left: '30%', width: 500, height: 400, background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 65%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '25%', width: 400, height: 350, background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 65%)', filter: 'blur(50px)' }} />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 8px 32px rgba(124,58,237,0.35)' }}>
              🔍
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#07090f' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: '#60a5fa' }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg mb-1">{repoName}</p>
            <p className="text-[13px]" style={{ color: '#7c8db0' }}>{statusMsg}</p>
          </div>
          <div className="w-52 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: status === 'fetching' ? '75%' : '35%', background: 'linear-gradient(90deg,#3b82f6,#7c3aed)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#07090f' }}>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={20} />
          <span className="font-semibold">Failed to load repository</span>
        </div>
        <p className="text-sm max-w-md text-center" style={{ color: '#7c8db0' }}>{error}</p>
        <div className="flex gap-3">
          <button onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: '#7c8db0', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Home size={14} /> Home
          </button>
          <button onClick={() => init(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: 'white' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#07090f' }}>

      <div className="flex items-center justify-between px-4 shrink-0"
        style={{ background: '#060910', borderBottom: '1px solid rgba(255,255,255,0.06)', height: '44px' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-[12px] px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#7c8db0' }}>
            <Home size={12} /> Home
          </button>
          <span style={{ color: 'rgba(255,255,255,0.08)', fontSize: '16px' }}>·</span>
          <div className="flex items-center gap-1.5 text-[12px]">
            <span style={{ color: '#10b981' }}>{owner}</span>
            <span style={{ color: '#2a3347' }}>/</span>
            <span className="font-semibold text-white">{repo}</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', color: '#10b981' }}>
            {files.length} files
          </span>
        </div>
        <button onClick={() => init(true)}
          className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: '#3d4a63' }}>
          <RefreshCw size={11} /> Re-ingest
        </button>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {isMobile ? (
          <div className="flex flex-col h-full overflow-y-auto">
            <div style={{ minHeight: '220px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <FileTree files={files} selectedFile={selectedFile?.path ?? null} onSelect={setSelectedFile} repoName={repoUrl} />
            </div>
            <div style={{ minHeight: '300px', flex: '1 1 auto', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <CodeViewer file={selectedFile} />
            </div>
            <div style={{ minHeight: '320px' }}>
              <AiPanel repoUrl={repoUrl} selectedFile={selectedFile} />
            </div>
          </div>
        ) : (
          <ResizablePanels
            leftPanel={
              <FileTree files={files} selectedFile={selectedFile?.path ?? null} onSelect={setSelectedFile} repoName={repoUrl} />
            }
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07090f' }}>
        <Loader2 size={22} className="animate-spin" style={{ color: '#60a5fa' }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}