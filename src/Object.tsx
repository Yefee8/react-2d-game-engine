// GameObject.tsx
"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export interface GameObjectProps {
  id: string;
  x: number;
  y: number;
  gravity?: boolean;
  children: ReactNode;
  [key: string]: any; // For additional props like ref
}

export default function GameObject({
  id,
  x: initialX,
  y: initialY,
  gravity = false,
  children,
  ...props
}: GameObjectProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const velocityY = useRef(0);
  const delta = 1 / 60;

  useEffect(() => {
    if (!gravity) return;

    let frame: number;
    const loop = () => {
      velocityY.current -= 9.8 * delta;
      setPosition((prev) => {
        let newY = prev.y + velocityY.current;
        if (newY < 0) {
          newY = 0;
          velocityY.current = 0;
        }
        return { ...prev, y: newY };
      });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [gravity]);

  return (
    <div
      {...props}
      data-id={id}
      style={{
        position: "absolute",
        left: position.x,
        bottom: position.y,
        ...props.style,
      }}
    >
      {children}
    </div>
  );
}
