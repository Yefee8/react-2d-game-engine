"use client";

import React, {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from "react";
import { basicGravity, basicJumpHeight } from "./utils.ts";

interface CharacterProps {
  gravity?: number; // Gravity force (positive = downward in world)
  jumpHeight?: number; // Initial jump velocity
  controls?: string[]; // ["KeyW","KeyA","KeyD","ShiftLeft"]
  sprint?: boolean; // Enable sprint
  sprintMultiplier?: number; // Sprint speed multiplier
  speed?: number; // Base speed in px/frame
  jump?: boolean; // Enable jump
  jumpCount?: number; // How many jumps allowed (1=normal, 2=double jump, etc.)
  lockControls?: boolean; // Disable movement
  onAction?: (action: string, payload?: any) => void;
  objects?: { x: number; y: number; width: number; height: number }[]; // Collidable objects
  movingPlatforms?: {
    x: number;
    y: number;
    width: number;
    height: number;
    deltaX?: number;
    deltaY?: number;
  }[];
  children?: ReactNode;
  [key: string]: any;
}

// Simple AABB (Axis-Aligned Bounding Box) overlap check
function aabbOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  const aLeft = ax,
    aRight = ax + aw;
  const aBottom = ay,
    aTop = ay + ah;
  const bLeft = bx,
    bRight = bx + bw;
  const bBottom = by,
    bTop = by + bh;
  return aLeft < bRight && aRight > bLeft && aBottom < bTop && aTop > bBottom;
}

const Character = forwardRef<HTMLDivElement, CharacterProps>(function Character(
  {
    gravity = basicGravity,
    jumpHeight = basicJumpHeight,
    controls = ["KeyW", "KeyA", "KeyD", "ShiftLeft"],
    sprint = true,
    sprintMultiplier = 1.4,
    speed = 5,
    jump = true,
    jumpCount = 1,
    lockControls = false,
    onAction,
    objects = [],
    children,
    movingPlatforms = [],
    ...rest
  },
  externalRef
) {
  const keysPressed = useRef<Set<string>>(new Set());
  const velocityY = useRef(0);
  const groundedRef = useRef(true); // Is the player on the ground?
  const lastAction = useRef<string>("idle");

  const [action, setAction] = useState<string>("idle");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState<1 | -1>(1);

  // Combine external ref (from parent) with internal ref (for size & collision)
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const currentJumps = useRef(0);
  const jumpPressedLastFrame = useRef(false);

  const setRefs = (el: HTMLDivElement | null) => {
    nodeRef.current = el;
    if (typeof externalRef === "function") externalRef(el);
    else if (externalRef)
      (externalRef as React.MutableRefObject<HTMLDivElement | null>).current =
        el;
  };

  // Keyboard input handling
  useEffect(() => {
    const down = (e: KeyboardEvent) => keysPressed.current.add(e.code);
    const up = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
    const blur = () => keysPressed.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  // Notify parent when action changes
  useEffect(() => {
    if (!onAction) return;
    if (action !== lastAction.current) {
      onAction(action, {
        x: pos.x,
        y: pos.y,
        vy: velocityY.current,
        grounded: groundedRef.current,
      });
      lastAction.current = action;
    }
  }, [action, pos, onAction]);

  // Main physics loop
  useEffect(() => {
    let raf: number;
    const dt = 1 / 60;

    const loop = () => {
      if (!lockControls) {
        setPos((prev) => {
          // Character dimensions (fallback: 50x50 if unknown)
          const rect = nodeRef.current?.getBoundingClientRect();
          const cw = Math.max(1, rect?.width ?? 50);
          const ch = Math.max(1, rect?.height ?? 50);

          // Movement base speed (with sprinting)
          const isSprint =
            sprint &&
            (keysPressed.current.has(controls[3]) ||
              keysPressed.current.has("ShiftRight"));
          const base = speed * (isSprint ? sprintMultiplier : 1);

          // Horizontal movement
          let dx = 0;
          if (keysPressed.current.has(controls[1])) dx -= base; // Left
          if (keysPressed.current.has(controls[2])) dx += base; // Right

          // Jumping only if grounded
          let startedJump = false;
          const isJumpPressed = keysPressed.current.has(controls[0]);

          if (
            jump &&
            isJumpPressed &&
            !jumpPressedLastFrame.current &&
            ((jumpCount && jumpCount > 1 && currentJumps.current < jumpCount) ||
              (jumpCount === 1 && groundedRef.current))
          ) {
            velocityY.current = jumpHeight;
            groundedRef.current = false;
            currentJumps.current += 1;
            startedJump = true;
          }

          jumpPressedLastFrame.current = isJumpPressed;

          // Apply gravity
          velocityY.current -= gravity * dt;

          // --- Horizontal collision check (sweep X) ---
          let candX = prev.x + dx;
          if (dx !== 0 && objects.length) {
            for (const o of objects) {
              if (
                aabbOverlap(candX, prev.y, cw, ch, o.x, o.y, o.width, o.height)
              ) {
                if (dx > 0) candX = o.x - cw; // Hitting wall from left
                else candX = o.x + o.width; // Hitting wall from right
                onAction?.("collide", { with: o }); // Notify collision
              }
            }
          }

          // --- Vertical collision check (sweep Y) ---
          const vy = velocityY.current;
          let candY = prev.y + vy;
          let landed = false;

          if (objects.length) {
            for (const o of objects) {
              if (
                aabbOverlap(candX, candY, cw, ch, o.x, o.y, o.width, o.height)
              ) {
                if (vy < 0) {
                  // Falling down → land on top of object
                  candY = o.y + o.height;
                  landed = true;
                  velocityY.current = 0;
                  onAction?.("collide", { with: o });
                } else if (vy > 0) {
                  // Going up → hit underside
                  candY = o.y - ch;
                  velocityY.current = 0;
                  onAction?.("collide", { with: o });
                }
              }
            }
          }

          // Ground level (y=0)
          if (candY < 0) {
            candY = 0;
            velocityY.current = 0;
            landed = true;
          }

          if (landed) currentJumps.current = 0;
          groundedRef.current = landed;

          if (groundedRef.current && movingPlatforms?.length) {
            for (const p of movingPlatforms) {
              const isOnPlatform =
                candX + cw > p.x &&
                candX < p.x + p.width &&
                Math.abs(candY - (p.y + p.height)) < 2;

              if (isOnPlatform) {
                if (p.deltaX) candX += p.deltaX;
                if (p.deltaY) candY += p.deltaY;
              }
            }
          }

          // Facing direction
          if (dx < 0) setFacing(-1);
          else if (dx > 0) setFacing(1);

          // Select action state
          let nextAction = "idle";
          if (startedJump) nextAction = "jump";
          else if (!groundedRef.current) nextAction = "inair";
          else if (dx !== 0)
            nextAction = isSprint
              ? dx > 0
                ? "sprintRight"
                : "sprintLeft"
              : dx > 0
              ? "walkRight"
              : "walkLeft";

          setAction(nextAction);

          return { x: candX, y: candY };
        });
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [controls, sprint, sprintMultiplier, speed, jump, gravity, lockControls]);

  return (
    <div
      ref={setRefs}
      {...rest}
      style={{
        transform: `translate3d(${pos.x}px, ${-pos.y}px, 0) scaleX(${facing})`,
        willChange: "transform",
        display: "inline-block",
        width: "auto",
        ...(rest.style || {}),
      }}
    >
      {children}
    </div>
  );
});

export default Character;