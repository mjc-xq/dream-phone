"use client";

type Props = {
  boyId: number;
  name: string;
  size?: number;
  className?: string;
};

const SKIN_TONES = ["#f3c89a", "#e0a87c", "#c98863", "#9a6243", "#6b4226", "#b88161", "#cf9c80", "#4d2d1a"];
const HAIR_COLORS = ["#1c0a02", "#3a1f0a", "#6b3a14", "#a86523", "#d9b95a", "#dadada", "#0a0a0a"];
const SHIRT_COLORS = [
  "#ff2d8a", "#00d4d0", "#ffd400", "#8a2be2", "#25e5ff", "#5cffb7", "#ff8a00",
  "#1ec9a0", "#ff5fbf", "#7a1cad",
];
const HAIR_STYLES = ["flattop", "spike", "mop", "bowl", "fade", "side-part", "tipped", "bangs"];
const ACCENTS = ["none", "shades", "snapback", "headband", "bandana", "scrunchie"];

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function BoyAvatar({ boyId, name, size = 96, className }: Props) {
  const h = hash(`${boyId}::${name}`);
  const skin = SKIN_TONES[h % SKIN_TONES.length];
  const hair = HAIR_COLORS[(h >> 3) % HAIR_COLORS.length];
  const shirt = SHIRT_COLORS[(h >> 5) % SHIRT_COLORS.length];
  const altShirt = SHIRT_COLORS[(h >> 9) % SHIRT_COLORS.length];
  const hairStyle = HAIR_STYLES[(h >> 7) % HAIR_STYLES.length];
  const accent = ACCENTS[(h >> 11) % ACCENTS.length];
  const eyeY = 44 + ((h >> 13) % 5);
  const browTilt = ((h >> 15) % 7) - 3;
  const mouthCurve = ((h >> 17) % 9) - 3;
  const freckles = (h & 1) === 1;
  const pattern = ["solid", "zigzag", "dots", "stripes"][(h >> 19) % 4];

  const bgA = ["#ff2d8a", "#00d4d0", "#8a2be2", "#ffd400", "#ff5fbf", "#25e5ff"][(h >> 21) % 6];
  const bgB = ["#5cffb7", "#ff8a00", "#ffd400", "#c2185b", "#0a0a0a", "#fff5fb"][(h >> 23) % 6];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${name} avatar`}
    >
      <defs>
        <linearGradient id={`bg-${boyId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bgA} />
          <stop offset="100%" stopColor={bgB} />
        </linearGradient>
        <pattern id={`pat-${boyId}-zig`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 8 L5 3 L10 8" stroke="rgba(255,255,255,0.5)" fill="none" strokeWidth="1.5" />
        </pattern>
        <pattern id={`pat-${boyId}-dot`} width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.2" fill="rgba(255,255,255,0.5)" />
        </pattern>
        <pattern id={`pat-${boyId}-str`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect x="0" y="3" width="8" height="2" fill="rgba(255,255,255,0.45)" />
        </pattern>
      </defs>

      {/* background */}
      <rect x="0" y="0" width="100" height="100" fill={`url(#bg-${boyId})`} />
      {pattern === "zigzag" && <rect x="0" y="0" width="100" height="100" fill={`url(#pat-${boyId}-zig)`} />}
      {pattern === "dots" && <rect x="0" y="0" width="100" height="100" fill={`url(#pat-${boyId}-dot)`} />}
      {pattern === "stripes" && <rect x="0" y="0" width="100" height="100" fill={`url(#pat-${boyId}-str)`} />}

      {/* shoulders / shirt with collar */}
      <path
        d="M 5 100 L 5 86 Q 30 70 50 70 Q 70 70 95 86 L 95 100 Z"
        fill={shirt}
        stroke="#1c0030"
        strokeWidth="1.5"
      />
      {/* collar accent */}
      <path
        d="M 35 78 L 50 88 L 65 78"
        fill="none"
        stroke={altShirt}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* neck */}
      <rect x="44" y="60" width="12" height="14" fill={skin} stroke="#1c0030" strokeWidth="1" />

      {/* head */}
      <ellipse cx="50" cy="44" rx="20" ry="22" fill={skin} stroke="#1c0030" strokeWidth="1.5" />

      {/* hair styles */}
      {hairStyle === "flattop" && (
        <path
          d="M 30 36 Q 30 22 50 22 Q 70 22 70 36 L 70 32 L 30 32 Z"
          fill={hair}
          stroke="#1c0030"
          strokeWidth="1.5"
        />
      )}
      {hairStyle === "spike" && (
        <g fill={hair} stroke="#1c0030" strokeWidth="1.5">
          <path d="M 32 32 L 36 18 L 40 30 L 44 16 L 48 30 L 52 14 L 56 30 L 60 18 L 64 30 L 68 32 Z" />
        </g>
      )}
      {hairStyle === "mop" && (
        <path
          d="M 28 38 Q 28 18 50 18 Q 72 18 72 38 Q 65 30 50 30 Q 35 30 28 38 Z"
          fill={hair}
          stroke="#1c0030"
          strokeWidth="1.5"
        />
      )}
      {hairStyle === "bowl" && (
        <path
          d="M 28 40 Q 28 22 50 22 Q 72 22 72 40 L 70 38 L 30 38 Z"
          fill={hair}
          stroke="#1c0030"
          strokeWidth="1.5"
        />
      )}
      {hairStyle === "fade" && (
        <path
          d="M 32 36 Q 36 24 50 24 Q 64 24 68 36 Q 60 28 50 28 Q 40 28 32 36 Z"
          fill={hair}
          stroke="#1c0030"
          strokeWidth="1.5"
        />
      )}
      {hairStyle === "side-part" && (
        <g fill={hair} stroke="#1c0030" strokeWidth="1.5">
          <path d="M 28 38 Q 30 22 50 22 Q 72 24 72 36 Q 60 30 50 32 Q 42 26 28 38 Z" />
          <path d="M 40 30 L 30 38" stroke="#1c0030" strokeWidth="1" />
        </g>
      )}
      {hairStyle === "tipped" && (
        <g>
          <path
            d="M 28 38 Q 28 20 50 20 Q 72 20 72 38 Q 64 30 50 30 Q 36 30 28 38 Z"
            fill={hair}
            stroke="#1c0030"
            strokeWidth="1.5"
          />
          <path
            d="M 34 28 Q 50 20 66 28"
            stroke="#fff5e1"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
      {hairStyle === "bangs" && (
        <g fill={hair} stroke="#1c0030" strokeWidth="1.5">
          <path d="M 30 38 Q 30 22 50 22 Q 70 22 70 38 L 64 34 Q 60 40 50 40 Q 40 40 36 34 Z" />
        </g>
      )}

      {/* eyebrows */}
      <g stroke="#1c0030" strokeWidth="1.8" strokeLinecap="round">
        <line x1="40" y1={eyeY - 6 + browTilt} x2="46" y2={eyeY - 7 - browTilt} />
        <line x1="54" y1={eyeY - 7 - browTilt} x2="60" y2={eyeY - 6 + browTilt} />
      </g>

      {/* eyes */}
      <g fill="#1c0030">
        <circle cx="43" cy={eyeY} r="1.7" />
        <circle cx="57" cy={eyeY} r="1.7" />
      </g>

      {/* freckles */}
      {freckles && (
        <g fill="rgba(28,0,48,0.45)">
          <circle cx="42" cy="51" r="0.9" />
          <circle cx="46" cy="53" r="0.7" />
          <circle cx="54" cy="53" r="0.7" />
          <circle cx="58" cy="51" r="0.9" />
        </g>
      )}

      {/* mouth */}
      <path
        d={`M 44 ${56 + mouthCurve / 2} Q 50 ${58 + mouthCurve} 56 ${56 + mouthCurve / 2}`}
        stroke="#1c0030"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* accents */}
      {accent === "shades" && (
        <g>
          <rect x="36" y={eyeY - 4} width="12" height="6" rx="1.5" fill="#1c0030" />
          <rect x="52" y={eyeY - 4} width="12" height="6" rx="1.5" fill="#1c0030" />
          <line x1="48" y1={eyeY - 1} x2="52" y2={eyeY - 1} stroke="#1c0030" strokeWidth="1" />
        </g>
      )}
      {accent === "snapback" && (
        <g>
          <path d="M 28 30 Q 28 22 50 22 Q 72 22 72 30 L 72 34 L 28 34 Z" fill="#1c0030" />
          <path d="M 28 34 L 78 34 L 78 38 L 26 38 Z" fill="#ffd400" stroke="#1c0030" strokeWidth="1" />
        </g>
      )}
      {accent === "headband" && (
        <rect x="28" y="32" width="44" height="4" fill="#ff2d8a" stroke="#1c0030" strokeWidth="1" />
      )}
      {accent === "bandana" && (
        <g>
          <path
            d="M 28 34 Q 50 24 72 34 L 76 40 L 70 40 Q 50 32 30 40 L 24 40 Z"
            fill="#ff2d8a"
            stroke="#1c0030"
            strokeWidth="1.5"
          />
          <circle cx="38" cy="36" r="1" fill="#fff5e1" />
          <circle cx="50" cy="34" r="1" fill="#fff5e1" />
          <circle cx="62" cy="36" r="1" fill="#fff5e1" />
        </g>
      )}
      {accent === "scrunchie" && (
        <g>
          <rect x="50" y="24" width="14" height="6" rx="3" fill={altShirt} stroke="#1c0030" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
