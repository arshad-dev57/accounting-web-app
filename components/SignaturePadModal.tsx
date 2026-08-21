'use client';

import { useEffect, useRef, useState } from 'react';
import { Eraser, PenLine, Upload, X, Check } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (file: File, previewUrl: string) => void;
  initialPreview?: string;
  dark?: boolean;
};

export default function SignaturePadModal({
  open,
  onClose,
  onSave,
  initialPreview = '',
  dark = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode('draw');
    setUploadPreview(initialPreview || '');
    setUploadFile(null);
    setHasInk(false);
    const t = setTimeout(() => resetCanvas(), 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
    setHasInk(false);
  };

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPickFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    if (mode === 'upload') {
      if (!uploadFile && !uploadPreview) return;
      if (uploadFile) {
        onSave(uploadFile, uploadPreview);
        onClose();
        return;
      }
      // existing remote preview kept — convert via fetch if needed
      onClose();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (!blob) return;
    const file = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' });
    const url = URL.createObjectURL(file);
    onSave(file, url);
    onClose();
  };

  if (!open) return null;

  const panel = dark
    ? 'bg-[#1a1a2e] border-white/10 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const tabActive = dark ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-700';
  const tabIdle = dark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${panel}`}>
        <div className="flex items-center justify-between border-b border-inherit px-4 py-3">
          <div>
            <p className="text-sm font-bold">Company signature</p>
            <p className={`text-xs ${muted}`}>Draw with mouse/touch or upload an image</p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-lg p-2 ${tabIdle}`}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className={`inline-flex rounded-xl p-1 ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                mode === 'draw' ? tabActive : tabIdle
              }`}
            >
              <PenLine className="h-3.5 w-3.5" /> Draw
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                mode === 'upload' ? tabActive : tabIdle
              }`}
            >
              <Upload className="h-3.5 w-3.5" /> Upload
            </button>
          </div>
        </div>

        <div className="p-4">
          {mode === 'draw' ? (
            <div>
              <canvas
                ref={canvasRef}
                className="h-44 w-full touch-none rounded-xl border border-gray-200 bg-white cursor-crosshair"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              />
              <button
                type="button"
                onClick={resetCanvas}
                className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${muted}`}
              >
                <Eraser className="h-3.5 w-3.5" /> Clear pad
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed ${
                  dark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-50'
                }`}
              >
                {uploadPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={uploadPreview} alt="Signature" className="max-h-36 object-contain" />
                ) : (
                  <>
                    <Upload className={`h-6 w-6 ${muted}`} />
                    <span className={`text-xs ${muted}`}>Click to upload signature image</span>
                  </>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-inherit px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${tabIdle}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={mode === 'draw' ? !hasInk : !uploadFile && !uploadPreview}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1088dd] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Use signature
          </button>
        </div>
      </div>
    </div>
  );
}
