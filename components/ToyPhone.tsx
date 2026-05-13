"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { playClick, playDtmf } from "@/lib/audio/speech";

type Props = {
  expectedPhone?: string;
  hint?: string;
  speakerphonePending?: boolean;
  speakerphoneOn?: boolean;
  onToggleSpeaker?: () => void;
  onSolve?: () => void;
  onRedial?: () => void;
  onNewGame?: () => void;
  onCall: (phone: string) => void;
  disabled?: boolean;
};

const KEYS = ["1","2","3","4","5","6","7","8","9","*","0","#"] as const;

export function ToyPhone({
  expectedPhone,
  hint,
  speakerphonePending,
  speakerphoneOn,
  onToggleSpeaker,
  onSolve,
  onRedial,
  onNewGame,
  onCall,
  disabled,
}: Props) {
  const [dialed, setDialed] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const press = (d: string) => {
    if (/\d/.test(d)) {
      playDtmf(d);
      setDialed((cur) => (cur.length >= 7 ? cur : cur + d));
    } else if (d === "*") {
      playClick();
      setDialed("");
    } else {
      playClick();
    }
    setActive(d);
    setTimeout(() => setActive((cur) => (cur === d ? null : cur)), 140);
  };

  const formatted = formatPhone(dialed);
  const isValid = expectedPhone
    ? formatted === expectedPhone || dialed === expectedPhone.replace(/\D/g, "").slice(3)
    : dialed.length === 7;
  const blockedBySpeaker = !!speakerphonePending && !speakerphoneOn;

  const confirm = () => {
    if (!isValid || disabled || blockedBySpeaker) return;
    onCall(formatted);
    setDialed("");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") setDialed((d) => d.slice(0, -1));
      else if (e.key === "Enter") confirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, formatted, disabled, blockedBySpeaker]);

  return (
    <motion.div
      initial={{ y: 30, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="w-full max-w-[440px] mx-auto select-none"
    >
      <svg
        viewBox="0 0 460 720"
        className="w-full h-auto block drop-shadow-[10px_10px_0_rgba(0,0,0,0.6)]"
        role="application"
        aria-label="Dream Phone keypad"
      >
        <defs>
          <linearGradient id="phone-body" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff5fbf" />
            <stop offset="50%" stopColor="#ff2d8a" />
            <stop offset="100%" stopColor="#c2185b" />
          </linearGradient>
          <linearGradient id="phone-screen" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c0ffd6" />
            <stop offset="100%" stopColor="#9be7ff" />
          </linearGradient>
          <radialGradient id="phone-key-light" cx="0.3" cy="0.2" r="0.9">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <path
          d="M 50 70 Q 50 30 90 30 L 370 30 Q 410 30 410 70 L 410 660 Q 410 700 370 700 L 90 700 Q 50 700 50 660 Z"
          fill="url(#phone-body)"
          stroke="#1c0030"
          strokeWidth="6"
        />

        {/* heart sticker */}
        <motion.g
          transform="translate(230,60)"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "230px 76px" }}
        >
          <path
            d="M 0 8 C -10 -6, -28 -2, -18 14 C -10 26, 0 32, 0 32 C 0 32, 10 26, 18 14 C 28 -2, 10 -6, 0 8 Z"
            fill="#ffd400"
            stroke="#1c0030"
            strokeWidth="3"
          />
        </motion.g>

        {/* earpieces */}
        <g>
          <ellipse cx="120" cy="90" rx="30" ry="14" fill="#1c0030" />
          <ellipse cx="120" cy="88" rx="24" ry="9" fill="#ff8fc7" />
          {Array.from({ length: 5 }).map((_, i) => (
            <circle key={i} cx={100 + i * 10} cy={88} r="1.4" fill="#1c0030" />
          ))}
        </g>
        <g>
          <ellipse cx="340" cy="90" rx="30" ry="14" fill="#1c0030" />
          <ellipse cx="340" cy="88" rx="24" ry="9" fill="#ff8fc7" />
          {Array.from({ length: 5 }).map((_, i) => (
            <circle key={i} cx={320 + i * 10} cy={88} r="1.4" fill="#1c0030" />
          ))}
        </g>

        {/* speaker mesh */}
        <g>
          <rect x="160" y="120" width="140" height="22" rx="6" fill="#1c0030" />
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 14 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={166 + c * 9.5} cy={124 + r * 3} r="1" fill="rgba(255,255,255,0.35)" />
            ))
          )}
        </g>

        {/* LCD screen */}
        <g>
          <rect x="90" y="155" width="280" height="80" rx="10" fill="#1c0030" />
          <rect x="98" y="163" width="264" height="64" rx="6" fill="url(#phone-screen)" stroke="#1c0030" strokeWidth="2" />
          <text x="230" y="183" textAnchor="middle" fill="#0c2a3a" fontFamily="'Courier New', monospace" fontSize="11" letterSpacing="2">
            {(hint ?? "DIAL THE BOY").toUpperCase()}
          </text>
          <text x="230" y="215" textAnchor="middle" fill="#0c2a3a" fontFamily="'Courier New', monospace" fontWeight="bold" fontSize="26" letterSpacing="3">
            {formatted || "555-____"}
          </text>
        </g>

        {/* keypad */}
        <g>
          {KEYS.map((d, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx = 140 + col * 90;
            const cy = 275 + row * 65;
            const isStar = d === "*";
            const isPound = d === "#";
            const isZero = d === "0";
            const bg = isStar || isPound ? "#25e5ff" : isZero ? "#ff8fc7" : "#fff5e1";
            const pressed = active === d;
            return (
              <motion.g
                key={d}
                style={{ cursor: "pointer", transformBox: "fill-box", transformOrigin: "center" }}
                animate={pressed ? { y: 3, scale: 0.94 } : { y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 600, damping: 22 }}
                onClick={() => !disabled && press(d)}
                opacity={disabled ? 0.6 : 1}
              >
                <rect x={cx - 32} y={cy - 22} width="64" height="44" rx="10" fill="#1c0030" />
                <rect x={cx - 30} y={cy - 24} width="60" height="42" rx="9" fill={bg} stroke="#1c0030" strokeWidth="2" />
                <rect x={cx - 28} y={cy - 22} width="56" height="14" rx="5" fill="url(#phone-key-light)" />
                <text x={cx} y={cy + 6} textAnchor="middle" fontFamily="'Trebuchet MS', sans-serif" fontWeight="900" fontSize="22" fill="#1c0030">
                  {d}
                </text>
              </motion.g>
            );
          })}
        </g>

        {/* Function buttons row 1: Speakerphone | Redial */}
        <g>
          {/* Speakerphone */}
          <g
            style={{ cursor: speakerphonePending ? "pointer" : "not-allowed" }}
            onClick={() => speakerphonePending && onToggleSpeaker && onToggleSpeaker()}
            opacity={speakerphonePending ? 1 : 0.55}
          >
            <rect x="80" y="540" width="125" height="38" rx="10" fill="#1c0030" />
            <rect
              x="82"
              y="538"
              width="121"
              height="36"
              rx="9"
              fill={speakerphoneOn ? "#5cffb7" : "#ffd400"}
              stroke="#1c0030"
              strokeWidth="2"
            />
            <text x="142" y="563" textAnchor="middle" fontFamily="'Trebuchet MS', sans-serif" fontWeight="900" fontSize="12" fill="#1c0030">
              📢 SPEAKER
            </text>
          </g>
          {/* Redial */}
          <g
            style={{ cursor: "pointer" }}
            onClick={() => onRedial && onRedial()}
          >
            <rect x="255" y="540" width="125" height="38" rx="10" fill="#1c0030" />
            <rect x="257" y="538" width="121" height="36" rx="9" fill="#25e5ff" stroke="#1c0030" strokeWidth="2" />
            <text x="317" y="563" textAnchor="middle" fontFamily="'Trebuchet MS', sans-serif" fontWeight="900" fontSize="12" fill="#1c0030">
              ↻ REDIAL
            </text>
          </g>
        </g>

        {/* Function buttons row 2: Solve | New Game */}
        <g>
          <g style={{ cursor: "pointer" }} onClick={() => onSolve && onSolve()}>
            <rect x="80" y="590" width="125" height="38" rx="10" fill="#1c0030" />
            <rect x="82" y="588" width="121" height="36" rx="9" fill="#8a2be2" stroke="#1c0030" strokeWidth="2" />
            <text x="142" y="613" textAnchor="middle" fontFamily="'Trebuchet MS', sans-serif" fontWeight="900" fontSize="12" fill="#fff">
              💘 SOLVE
            </text>
          </g>
          <g style={{ cursor: "pointer" }} onClick={() => onNewGame && onNewGame()}>
            <rect x="255" y="590" width="125" height="38" rx="10" fill="#1c0030" />
            <rect x="257" y="588" width="121" height="36" rx="9" fill="#ff8fc7" stroke="#1c0030" strokeWidth="2" />
            <text x="317" y="613" textAnchor="middle" fontFamily="'Trebuchet MS', sans-serif" fontWeight="900" fontSize="12" fill="#1c0030">
              ✨ NEW GAME
            </text>
          </g>
        </g>

        {/* CALL button — green */}
        <g
          style={{ cursor: isValid && !disabled && !blockedBySpeaker ? "pointer" : "not-allowed" }}
          onClick={confirm}
          opacity={isValid && !disabled && !blockedBySpeaker ? 1 : 0.55}
        >
          <rect x="80" y="640" width="300" height="44" rx="22" fill="#1c0030" />
          <rect x="82" y="638" width="296" height="42" rx="21" fill="#5cffb7" stroke="#1c0030" strokeWidth="2" />
          <text x="230" y="666" textAnchor="middle" fontFamily="'Trebuchet MS', sans-serif" fontWeight="900" fontSize="16" fill="#1c0030">
            📞 CALL
          </text>
        </g>

        {/* coiled cord */}
        <g stroke="#1c0030" strokeWidth="3" fill="none">
          <path d="M 410 580 Q 440 570 440 590 Q 440 610 410 605 Q 380 600 410 595" />
        </g>
      </svg>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <motion.button
          whileTap={{ scale: 0.94 }}
          type="button"
          className="dp-btn"
          onClick={() => { playClick(); setDialed((d) => d.slice(0, -1)); }}
        >
          ⌫ Back
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.94 }}
          type="button"
          className="dp-btn dp-btn-purple"
          onClick={() => { playClick(); setDialed(""); }}
        >
          ✕ Clear
        </motion.button>
      </div>
    </motion.div>
  );
}

export function formatPhone(d: string): string {
  if (!d) return "";
  const digits = d.replace(/\D/g, "").slice(0, 7);
  if (digits.length <= 3) return `555-${digits}`.replace(/-$/, "");
  return `555-${digits}`;
}
