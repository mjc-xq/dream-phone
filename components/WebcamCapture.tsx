"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
};

export function WebcamCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setStreaming(true);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    }
    start();
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  const snap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    // Brief flash, then deliver
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      onCapture(dataUrl);
    }, 120);
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") onCapture(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dp-card p-3 text-dp-ink"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="dp-chip dp-chip-pink">Take Your Photo</div>
        <button type="button" className="dp-btn dp-btn-purple text-sm py-1 px-3" onClick={onCancel}>
          ✕ Cancel
        </button>
      </div>

      {error ? (
        <div className="text-sm space-y-2 p-2 bg-dp-pink-hot/10 rounded-md">
          <p className="text-dp-magenta font-bold">Camera unavailable.</p>
          <p className="opacity-80 text-xs">{error}</p>
          <button
            type="button"
            className="dp-btn dp-btn-teal w-full"
            onClick={() => fileRef.current?.click()}
          >
            📁 Upload a photo instead
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </div>
      ) : (
        <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden border-4 border-dp-ink bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : undefined }}
          />
          {flash && (
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-white"
            />
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {!error && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button
            type="button"
            className="dp-btn dp-btn-teal text-sm py-1.5 px-2"
            onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
          >
            🔄 Flip
          </button>
          <button
            type="button"
            className="dp-btn dp-btn-pink col-span-2 text-base py-2"
            onClick={snap}
            disabled={!streaming || flash}
          >
            📸 Snap!
          </button>
        </div>
      )}

      <p className="text-[11px] text-center opacity-60 mt-2">
        Tip: face the camera, soft smile. We&apos;ll 90s-ify you.
      </p>
    </motion.div>
  );
}
