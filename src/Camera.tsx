"use client";

import { useEffect, type RefObject, type ReactNode } from "react";

interface CameraProps {
  children: ReactNode;
  parentRef: RefObject<any>;
  characterRef: RefObject<any>;
}

export default function Camera({
  children,
  parentRef,
  characterRef,
}: CameraProps) {
  useEffect(() => {
    let frame: number;

    const track = () => {
      const parent = parentRef.current;
      const character = characterRef.current;
      if (!parent || !character) return;

      const parentRect = parent.getBoundingClientRect();
      const charRect = character.getBoundingClientRect();

      // Get the character's absolute position within the canvas
      const charX = charRect.left - parentRect.left + parent.scrollLeft;
      const charY = charRect.top - parentRect.top + parent.scrollTop;

      // Center the character on the screen
      const targetScrollLeft = charX - parent.clientWidth / 2;
      const targetScrollTop = charY - parent.clientHeight / 2;

      // Prevent scrolling beyond boundaries
      parent.scrollLeft = Math.max(
        0,
        Math.min(parent.scrollWidth - parent.clientWidth, targetScrollLeft)
      );
      parent.scrollTop = Math.max(
        0,
        Math.min(parent.scrollHeight - parent.clientHeight, targetScrollTop)
      );

      frame = requestAnimationFrame(track);
    };

    frame = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frame);
  }, [parentRef, characterRef]);

  return <>{children}</>;
}
