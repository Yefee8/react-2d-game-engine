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
  onAction?: (action: string, payload?: any) => void;
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
}: CharacterProps) {
  const keysPressed: any = useRef<Set<string>>(new Set());
  const velocityY = useRef(0);
  const lastAction = useRef<string>("idle");

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

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
    let animationFrame: number;
    const delta = 1 / 60;
    const loop = () => {
      let currentAction = "idle";
      let isSprinting =
        sprint &&
        (keysPressed.current.has(controls[3]) ||
          keysPressed.current.has("ShiftRight"));

      setPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        // Jump
        if (jump && keysPressed.current.has(controls[0]) && newY === 0) {
          velocityY.current = jumpHeight;
          currentAction = "jump";
        }

        // Gravity effect (m/s²)
        velocityY.current -= gravity * delta;

        let candidateY = prev.y + velocityY.current;
        if (newY > 0) currentAction = "inair";

        // Ground collision
        if (candidateY < 0) {
          candidateY = 0;
          velocityY.current = 0;
        }

        newY = candidateY;
        // Moving left
        if (keysPressed.current.has(controls[1])) {
          newX = prev.x - speed * (isSprinting ? sprintMultiplier : 1);
          currentAction = isSprinting ? "sprintLeft" : "walkLeft";
        }
        // Moving right
        if (keysPressed.current.has(controls[2])) {
          newX = prev.x + speed * (isSprinting ? sprintMultiplier : 1);
          currentAction = isSprinting ? "sprintRight" : "walkRight";
        }

        if (onAction) {
          if (
            currentAction === "idle" &&
            currentAction === lastAction.current
          ) {
          } else {
            onAction(currentAction, {
              x: newX,
              y: newY,
              velocityY: velocityY.current,
            });
            lastAction.current = currentAction;
          }
        }
        return { x: newX, y: newY };
      });

      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [controls, sprint, speed, sprintMultiplier, jumpHeight, onAction]);

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${-position.y}px, 0)`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
