'use client';

import { useRef, useState, useEffect } from 'react';

export default function SignaturePad({
  onSave,
  saving,
}: {
  onSave: (dataUrl: string) => void;
  saving: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const setupCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1a1a1a';
    };
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    hasDrawn.current = true;
    setIsEmpty(false);
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    setIsEmpty(true);
  };

  const submit = () => {
    if (isEmpty) return;
    const src = canvasRef.current!;
    const out = document.createElement('canvas');
    out.width = src.width;
    out.height = src.height;
    const octx = out.getContext('2d')!;
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(src, 0, 0);
    onSave(out.toDataURL('image/png'));
  };

  return (
    <div>
      <style>{`
        .sigpad-canvas {
          width: 100%;
          height: 260px;
          border: 2px dashed #ccc;
          border-radius: 10px;
          touch-action: none;
          background: #fff;
          display: block;
        }
        @media (min-width: 480px) {
          .sigpad-canvas { height: 220px; }
        }
        .sigpad-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        .sigpad-btn {
          padding: 14px 18px;
          font-size: 16px;
          border-radius: 8px;
          cursor: pointer;
          min-height: 48px;
        }
        .sigpad-btn.clear {
          border: 1px solid #ccc;
          background: #fff;
          flex: 0 0 auto;
        }
        .sigpad-btn.submit {
          border: none;
          color: #fff;
          flex: 1;
          font-weight: 600;
        }
      `}</style>
      <canvas
        ref={canvasRef}
        className="sigpad-canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
      />
      <div className="sigpad-actions">
        <button onClick={clear} type="button" className="sigpad-btn clear">
          Clear
        </button>
        <button
          onClick={submit}
          type="button"
          disabled={isEmpty || saving}
          className="sigpad-btn submit"
          style={{ background: isEmpty || saving ? '#999' : '#111', cursor: isEmpty || saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving...' : 'Submit signature'}
        </button>
      </div>
    </div>
  );
}
