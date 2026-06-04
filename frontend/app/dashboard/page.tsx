'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FileTree, { FileItem } from '@/components/dashboard/FileTree';
import CodeViewer from '@/components/dashboard/CodeViewer';
import AiPanel from '@/components/dashboard/AiPanel';
import { api } from '@/lib/api';
import { Loader2, AlertCircle, Home, RefreshCw } from 'lucide-react';

const MIN_FILE_TREE_PCT = 15;
const MIN_CODE_PCT = 30;
const MIN_AI_PANEL_PCT = 20;

const DEFAULT_FILE_TREE = 20;
const DEFAULT_CODE = 50;
const DEFAULT_AI_PANEL = 30;

/* ---------------- RESIZE HANDLE ---------------- */

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
        position: 'relative',
        zIndex: 10,
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
          background: active ? '#888' : '#222',
        }}
      />
    </div>
  );
}

/* ---------------- RESIZABLE PANELS ---------------- */

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
    left: DEFAULT_FILE_TREE,
    center: DEFAULT_CODE,
    right: DEFAULT_AI_PANEL,
  });

  const dragging = useRef<null | 'left' | 'right'>(null);
  const startX = useRef(0);
  const startSizes = useRef(sizes);

  const [activeDrag, setActiveDrag] = useState<null | 'left' | 'right'>(null);

  const onMouseDownLeft = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = 'left';
      startX.current = e.clientX;
      startSizes.current = sizes;
      setActiveDrag('left');
    },
    [sizes]
  );

  const onMouseDownRight = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = 'right';
      startX.current = e.clientX;
      startSizes.current = sizes;
      setActiveDrag('right');
    },
    [sizes]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;

      const totalW = containerRef.current.offsetWidth;
      const deltaPct = ((e.clientX - startX.current) / totalW) * 100;
      const s = startSizes.current;

      if (dragging.current === 'left') {
        const newLeft = Math.max(
          MIN_FILE_TREE_PCT,
          Math.min(s.left + deltaPct, 100 - MIN_CODE_PCT - s.right)
        );
        const newCenter = s.left + s.center - newLeft;
        if (newCenter < MIN_CODE_PCT) return;
        setSizes({ left: newLeft, center: newCenter, right: s.right });
      }

      if (dragging.current === 'right') {
        const newCenter = Math.max(
          MIN_CODE_PCT,
          Math.min(s.center + deltaPct, 100 - s.left - MIN_AI_PANEL_PCT)
        );
        const newRight = s.center + s.right - newCenter;
        if (newRight < MIN_AI_PANEL_PCT) return;
        setSizes({ left: s.left, center: newCenter, right: newRight });
      }
    };

    const onUp = () => {
      dragging.current = null;
      setActiveDrag(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        userSelect: activeDrag ? 'none' : 'auto',
        cursor: activeDrag ? 'col-resize' : 'auto',
      }}
    >
      <div style={{ width: `${sizes.left}%`, overflow: 'hidden' }}>{leftPanel}</div>
      <ResizeHandle onMouseDown={onMouseDownLeft} isDragging={activeDrag === 'left'} />
      <div style={{ width: `${sizes.center}%`, overflow: 'hidden' }}>{centerPanel}</div>
      <ResizeHandle onMouseDown={onMouseDownRight} isDragging={activeDrag === 'right'} />
      <div style={{ width: `${sizes.right}%`, overflow: 'hidden' }}>{rightPanel}</div>
    </div>
  );
}

/* ---------------- DASHBOARD CONTENT ---------------- */

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const repoUrl = searchParams.get('repo') || '';

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [status, setStatus] =
    useState<'ingesting' | 'fetching' | 'ready' | 'error'>('ingesting');

  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  /* ---------------- MOBILE DETECT ---------------- */

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ---------------- INIT ---------------- */

  const init = useCallback(
    async (force = false) => {
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setStatus('error');
      }
    },
    [repoUrl]
  );

  /* ---------------- EFFECT ---------------- */

  useEffect(() => {
    if (!repoUrl) {
      router.push('/');
      return;
    }
    init();
  }, [repoUrl, router, init]);

  /* ---------------- UI HELPERS ---------------- */

  const repoName = repoUrl.replace('https://github.com/', '');
  const [owner, repo] = repoName.split('/');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  /* ---------------- LOADING ---------------- */

  if (status === 'ingesting' || status === 'fetching') {
    return (
      <div
        style={{
          background: '#0a0a0a',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Loader2 className="animate-spin" />
        <p style={{ marginLeft: 10 }}>{statusMsg}</p>
      </div>
    );
  }

  /* ---------------- ERROR ---------------- */

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', paddingTop: 100 }}>
        <AlertCircle />
        <p>{error}</p>
        <button onClick={() => router.push('/')}>Home</button>
        <button onClick={() => init(true)}>Retry</button>
      </div>
    );
  }

  /* ---------------- MAIN UI ---------------- */

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 10, borderBottom: '1px solid #222' }}>
        <button onClick={() => router.push('/')}>
          <Home size={12} /> Home
        </button>

        <span>
          {owner} / {repo}
        </span>

        <button onClick={() => init(true)}>
          <RefreshCw size={12} /> Re-ingest
        </button>

        <button onClick={handleLogout}>Logout</button>
      </div>

      <div style={{ flex: 1 }}>
        {isMobile ? (
          <div>
            <FileTree
              files={files}
              selectedFile={selectedFile?.path ?? null}
              onSelect={setSelectedFile}
              repoName={repoUrl}
            />
            <CodeViewer file={selectedFile} />
            <AiPanel repoUrl={repoUrl} selectedFile={selectedFile} />
          </div>
        ) : (
          <ResizablePanels
            leftPanel={
              <FileTree
                files={files}
                selectedFile={selectedFile?.path ?? null}
                onSelect={setSelectedFile}
                repoName={repoUrl}
              />
            }
            centerPanel={<CodeViewer file={selectedFile} />}
            rightPanel={<AiPanel repoUrl={repoUrl} selectedFile={selectedFile} />}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- EXPORT ---------------- */

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff' }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}