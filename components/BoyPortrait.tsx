"use client";

import { useState } from "react";
import Image from "next/image";
import { BOYS, displayImage, displayName } from "@/lib/game/cards";
import type { GameMode } from "@/lib/game/types";
import { BoyAvatar } from "./BoyAvatar";

type Props = {
  boyId: number;
  size?: number;
  className?: string;
  rounded?: string;
  mode?: GameMode;
};

export function BoyPortrait({ boyId, size = 64, className, rounded = "rounded-md", mode = "boys" }: Props) {
  const [failed, setFailed] = useState(false);
  const boy = BOYS[boyId];
  if (!boy) return null;
  const name = displayName(boy, mode);
  if (failed) {
    return <BoyAvatar boyId={boyId} name={name} size={size} className={className} />;
  }
  return (
    <div
      className={`relative overflow-hidden border-2 border-dp-ink ${rounded} ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={displayImage(boy, mode)}
        alt={name}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
