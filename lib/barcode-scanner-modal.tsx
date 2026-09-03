'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Loader2, X } from 'lucide-react';

export type BarcodeScannerModalProps = {
  onScan: (value: string) => void;
  onClose: () => void;
  title?: string;
};

function pickCameraDeviceId(devices: Array<{ deviceId: string; label: string }>): string | undefined {
  if (!devices.length) return undefined;
  if (devices.length === 1) return devices[0].deviceId;

  const backCamera = devices.find((d) =>
    /back|rear|environment|trás|arrière|wide/i.test(d.label)
  );
  if (backCamera?.deviceId) return backCamera.deviceId;

  // Let ZXing pick the environment-facing camera when labels are hidden.
  return undefined;
}

export function BarcodeScannerModal({
  onScan,
  onClose,
  title = 'Scan QR / barcode',
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  onScanRef.current = onScan;

  useEffect(() => {
    let active = true;

    const startScanner = async () => {
      try {
        setScanning(true);

        // Wait until the modal video element is mounted.
        for (let i = 0; i < 20 && !videoRef.current; i += 1) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        if (!videoRef.current) {
          setError('Camera preview failed to start');
          setScanning(false);
          return;
        }

        const video = videoRef.current;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.playsInline = true;

        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const { DecodeHintType, BarcodeFormat } = await import('@zxing/library');
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_39,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const codeReader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 150,
          delayBetweenScanSuccess: 400,
        });

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices.length) {
          setError('No camera found');
          setScanning(false);
          return;
        }

        const deviceId = pickCameraDeviceId(devices);
        const controls = await codeReader.decodeFromVideoDevice(
          deviceId ?? null,
          video,
          (result) => {
            if (result && active) {
              active = false;
              const text = result.getText?.() ?? String(result);
              if (text.trim()) onScanRef.current(text.trim());
            }
          }
        );
        stopRef.current = () => controls.stop();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Camera access denied';
        setError(message);
        setScanning(false);
      }
    };

    void startScanner();

    return () => {
      active = false;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, []);

  const handleManualSubmit = () => {
    const value = manualInput.trim();
    if (!value) return;
    stopRef.current?.();
    onScanRef.current(value);
  };

  const handleClose = () => {
    stopRef.current?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#014582]" />
            <h3 className="text-base font-bold text-gray-800">{title}</h3>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg" type="button">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-h-[min(70vw,320px)] mx-auto">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 border-2 border-[#014582] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
              </div>
              {scanning && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" /> Scanning...
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400">
              <span className="bg-white px-2">or enter manually</span>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type QR / barcode..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
            />
            <button
              type="button"
              onClick={handleManualSubmit}
              className="px-4 py-2 bg-[#014582] text-white text-sm font-medium rounded-lg hover:bg-[#01366a] transition-all"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
