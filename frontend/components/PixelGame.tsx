'use client';
import { useEffect, useRef } from 'react';

export default function PixelGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    const ground = H - 14;
    let px = 20, py = ground, jumping = false, vy = 0;
    let frame = 0, anim = 0, score = 0;
    const obstacles: { x: number; h: number }[] = [{ x: W + 80, h: 10 }, { x: W + 220, h: 14 }];
    let rafId: number;

    const drawCreature = (x: number, y: number, f: number) => {
      // body
      ctx.fillStyle = '#ff6b00';
      ctx.fillRect(x + 4, y - 12, 8, 8); // head
      ctx.fillStyle = '#cc4400';
      ctx.fillRect(x + 4, y - 12, 2, 2); // left eye bg
      ctx.fillRect(x + 10, y - 12, 2, 2); // right eye bg
      ctx.fillStyle = '#ffe0c0';
      ctx.fillRect(x + 5, y - 11, 1, 1); // left eye
      ctx.fillRect(x + 11, y - 11, 1, 1); // right eye
      ctx.fillStyle = '#ff6b00';
      ctx.fillRect(x + 2, y - 6, 12, 6); // torso
      ctx.fillStyle = '#cc4400';
      ctx.fillRect(x + 2, y - 8, 12, 2); // neck
      // legs
      if (f % 2 === 0) {
        ctx.fillStyle = '#ff6b00'; ctx.fillRect(x + 2, y, 4, 4);
        ctx.fillStyle = '#cc4400'; ctx.fillRect(x + 2, y + 2, 4, 2);
        ctx.fillStyle = '#ff6b00'; ctx.fillRect(x + 10, y, 4, 4);
        ctx.fillStyle = '#cc4400'; ctx.fillRect(x + 10, y + 2, 4, 2);
      } else {
        ctx.fillStyle = '#ff6b00'; ctx.fillRect(x + 4, y, 4, 4);
        ctx.fillStyle = '#cc4400'; ctx.fillRect(x + 4, y + 2, 4, 2);
        ctx.fillStyle = '#ff6b00'; ctx.fillRect(x + 8, y, 4, 4);
        ctx.fillStyle = '#cc4400'; ctx.fillRect(x + 8, y + 2, 4, 2);
      }
    };

    const loop = () => {
      frame++; if (frame % 4 === 0) anim++;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
      // ground
      ctx.fillStyle = '#1e1e1e'; ctx.fillRect(0, ground + 14, W, 1);
      ctx.fillStyle = '#2a2a2a';
      for (let i = (score % 40 === 0 ? 0 : -(score % 40)); i < W; i += 40)
        ctx.fillRect(i, ground + 15, 20, 1);

      // auto-jump logic
      const nearest = obstacles.reduce((a, o) => o.x < a.x && o.x > px ? o : a, { x: W + 999, h: 0 });
      if (!jumping && nearest.x - px < 60 && nearest.x - px > 0) {
        jumping = true; vy = -7;
      }
      if (jumping) { vy += 0.42; py += vy; if (py >= ground) { py = ground; jumping = false; vy = 0; } }

      // obstacles
      obstacles.forEach(o => {
        o.x -= 2; if (o.x < -20) o.x = W + Math.random() * 100 + 60;
        ctx.fillStyle = '#ff6b00'; ctx.fillRect(o.x, ground - o.h + 14, 6, o.h);
        ctx.fillStyle = '#cc4400'; ctx.fillRect(o.x, ground - o.h + 14, 6, 2);
      });

      drawCreature(px, py, anim);

      // score
      score++;
      ctx.fillStyle = '#ff6b00'; ctx.font = '10px monospace';
      ctx.fillText(`score: ${Math.floor(score / 6)}`, W - 80, 14);

      rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, color: '#333', marginBottom: 4 }}>* running pixel_creature.exe</div>
      <canvas ref={canvasRef} width={400} height={64} style={{ display: 'block', imageRendering: 'pixelated' }} />
    </div>
  );
}