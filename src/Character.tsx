"use client";

import { basicGravity, basicJumpHeight } from "./utils.ts";
import { type ReactNode, useEffect, useRef, useState } from "react";

interface CharacterProps {
  gravity?: number;
  jumpHeight?: number;
  controls?: string[]; // ["KeyW", "KeyA", "KeyD", "ShiftLeft"]
  sprint?: boolean;
  children?: ReactNode;
  sprintMultiplier?: number;
  speed?: number;
  jump?: boolean;
  lockControls?: boolean;
  onAction?: (action: string, payload?: any) => void;
  [key: string]: any; // For additional props like ref
}

export default function Character({
  gravity = basicGravity,
  jumpHeight = basicJumpHeight,
  controls = ["KeyW", "KeyA", "KeyD", "ShiftLeft"],
  sprint = true,
  jump = true,
  children,
  sprintMultiplier = 1.4,
  speed = 5, // in pixels
  onAction,
  lockControls = false,
  ...props
}: CharacterProps) {
  const keysPressed: any = useRef<Set<string>>(new Set());
  const velocityY = useRef(0);
  const lastAction = useRef<string>("idle");
  const [action, setAction] = useState<string>("idle");
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [facing, setFacing] = useState<1 | -1>(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };
    const handleBlur = () => {
      keysPressed.current.clear();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (onAction) {
      if (action !== lastAction.current) {
        onAction(action);
        lastAction.current = action;
      }
    }
  }, [position, action, onAction]);

  useEffect(() => {
    let animationFrame: number;
    const delta = 1 / 60;
    const loop = () => {
      let isSprinting =
        sprint &&
        (keysPressed.current.has(controls[3]) ||
          keysPressed.current.has("ShiftRight"));

      if (lockControls) {
        keysPressed.current.clear();
      } else {
        setPosition((prev) => {
          let newX = prev.x;
          let newY = prev.y;

          // Jump
          if (jump && keysPressed.current.has(controls[0]) && newY === 0) {
            velocityY.current = jumpHeight;
            setAction("jump");
          }

          // Gravity effect (m/s²)
          velocityY.current -= gravity * delta;

          let candidateY = prev.y + velocityY.current;
          if (newY > 0) setAction("inair");

          // Ground collision
          if (candidateY < 0) {
            candidateY = 0;
            velocityY.current = 0;
          }

          newY = candidateY;
          // Moving left
          if (keysPressed.current.has(controls[1])) {
            newX = prev.x - speed * (isSprinting ? sprintMultiplier : 1);
            setFacing(-1);
            setAction(isSprinting ? "sprintLeft" : "walkLeft");
          }
          // Moving right
          if (keysPressed.current.has(controls[2])) {
            newX = prev.x + speed * (isSprinting ? sprintMultiplier : 1);
            setFacing(1);
            setAction(isSprinting ? "sprintRight" : "walkRight");
          }
          return { x: newX, y: newY };
        });
        setAction("idle");
      }

      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [
    controls,
    sprint,
    speed,
    sprintMultiplier,
    jumpHeight,
    lockControls,
    setFacing,
  ]);

  return (
    <div
      {...props}
      style={{
        transform: `translate3d(${
          position.x
        }px, ${-position.y}px, 0) scaleX(${facing})`,
        willChange: "transform",
        display: "inline-block",
        width: "auto",
      }}
    >
      {children}
    </div>
  );
}
