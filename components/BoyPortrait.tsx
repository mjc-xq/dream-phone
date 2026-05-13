"use client";

import { useState } from "react";
import Image from "next/image";
import { BOYS, imageForBoy } from "@/lib/game/cards";
import { BoyAvatar } from "./BoyAvatar";

type Props = {
  boyId: number;
  size?: number;
  className?: string;
  rounded?: string;
};

export function BoyPortrait({ boyId, size = 64, className, rounded = "rounded-md" }: Props) {
  const [failed, setFailed] = useState(false);
  const boy = BOYS[boyId];
  if (!boy) return null;
  if (failed) {
    return <BoyAvatar boyId={boyId} name={boy.name} size={size} className={className} />;
  }
  return (
    <div
      className={`relative overflow-hidden border-2 border-dp-ink ${rounded} ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={imageForBoy(boy)}
        alt={boy.name}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
