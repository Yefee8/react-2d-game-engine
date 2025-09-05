// src/Character.tsx
import {
  useEffect,
  useRef,
  useState,
  forwardRef
} from "react";

// src/utils.ts
var basicGravity = 9.8;
var basicJumpHeight = 9;

// src/Character.tsx
import { jsx } from "react/jsx-runtime";
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  const aLeft = ax, aRight = ax + aw;
  const aBottom = ay, aTop = ay + ah;
  const bLeft = bx, bRight = bx + bw;
  const bBottom = by, bTop = by + bh;
  return aLeft < bRight && aRight > bLeft && aBottom < bTop && aTop > bBottom;
}
var Character = forwardRef(function Character2({
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
  ...rest
}, externalRef) {
  const keysPressed = useRef(/* @__PURE__ */ new Set());
  const velocityY = useRef(0);
  const groundedRef = useRef(true);
  const lastAction = useRef("idle");
  const [action, setAction] = useState("idle");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState(1);
  const nodeRef = useRef(null);
  const currentJumps = useRef(0);
  const jumpPressedLastFrame = useRef(false);
  const setRefs = (el) => {
    nodeRef.current = el;
    if (typeof externalRef === "function") externalRef(el);
    else if (externalRef)
      externalRef.current = el;
  };
  useEffect(() => {
    const down = (e) => keysPressed.current.add(e.code);
    const up = (e) => keysPressed.current.delete(e.code);
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
  useEffect(() => {
    if (!onAction) return;
    if (action !== lastAction.current) {
      onAction(action, {
        x: pos.x,
        y: pos.y,
        vy: velocityY.current,
        grounded: groundedRef.current
      });
      lastAction.current = action;
    }
  }, [action, pos, onAction]);
  useEffect(() => {
    let raf;
    const dt = 1 / 60;
    const loop = () => {
      if (!lockControls) {
        setPos((prev) => {
          const rect = nodeRef.current?.getBoundingClientRect();
          const cw = Math.max(1, rect?.width ?? 50);
          const ch = Math.max(1, rect?.height ?? 50);
          const isSprint = sprint && (keysPressed.current.has(controls[3]) || keysPressed.current.has("ShiftRight"));
          const base = speed * (isSprint ? sprintMultiplier : 1);
          let dx = 0;
          if (keysPressed.current.has(controls[1])) dx -= base;
          if (keysPressed.current.has(controls[2])) dx += base;
          let startedJump = false;
          const isJumpPressed = keysPressed.current.has(controls[0]);
          if (jump && isJumpPressed && !jumpPressedLastFrame.current && (jumpCount && jumpCount > 1 && currentJumps.current < jumpCount || jumpCount === 1 && groundedRef.current)) {
            velocityY.current = jumpHeight;
            groundedRef.current = false;
            currentJumps.current += 1;
            startedJump = true;
          }
          jumpPressedLastFrame.current = isJumpPressed;
          velocityY.current -= gravity * dt;
          let candX = prev.x + dx;
          if (dx !== 0 && objects.length) {
            for (const o of objects) {
              if (aabbOverlap(candX, prev.y, cw, ch, o.x, o.y, o.width, o.height)) {
                if (dx > 0) candX = o.x - cw;
                else candX = o.x + o.width;
                onAction?.("collide", { with: o });
              }
            }
          }
          const vy = velocityY.current;
          let candY = prev.y + vy;
          let landed = false;
          if (objects.length) {
            for (const o of objects) {
              if (aabbOverlap(candX, candY, cw, ch, o.x, o.y, o.width, o.height)) {
                if (vy < 0) {
                  candY = o.y + o.height;
                  landed = true;
                  velocityY.current = 0;
                  onAction?.("collide", { with: o });
                } else if (vy > 0) {
                  candY = o.y - ch;
                  velocityY.current = 0;
                  onAction?.("collide", { with: o });
                }
              }
            }
          }
          if (candY < 0) {
            candY = 0;
            velocityY.current = 0;
            landed = true;
          }
          if (landed) currentJumps.current = 0;
          groundedRef.current = landed;
          if (dx < 0) setFacing(-1);
          else if (dx > 0) setFacing(1);
          let nextAction = "idle";
          if (startedJump) nextAction = "jump";
          else if (!groundedRef.current) nextAction = "inair";
          else if (dx !== 0)
            nextAction = isSprint ? dx > 0 ? "sprintRight" : "sprintLeft" : dx > 0 ? "walkRight" : "walkLeft";
          setAction(nextAction);
          return { x: candX, y: candY };
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [controls, sprint, sprintMultiplier, speed, jump, gravity, lockControls]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: setRefs,
      ...rest,
      style: {
        transform: `translate3d(${pos.x}px, ${-pos.y}px, 0) scaleX(${facing})`,
        willChange: "transform",
        display: "inline-block",
        width: "auto",
        ...rest.style || {}
      },
      children
    }
  );
});
var Character_default = Character;

// src/Canvas.tsx
import "react";
import { jsx as jsx2 } from "react/jsx-runtime";
function Canvas(props) {
  return /* @__PURE__ */ jsx2("div", { id: "canvas", ...props, children: props.children });
}

// src/Camera.tsx
import { useEffect as useEffect2 } from "react";
import { Fragment, jsx as jsx3 } from "react/jsx-runtime";
function Camera({
  children,
  parentRef,
  characterRef
}) {
  useEffect2(() => {
    let frame;
    const track = () => {
      const parent = parentRef.current;
      const character = characterRef.current;
      if (!parent || !character) return;
      const parentRect = parent.getBoundingClientRect();
      const charRect = character.getBoundingClientRect();
      const charX = charRect.left - parentRect.left + parent.scrollLeft;
      const charY = charRect.top - parentRect.top + parent.scrollTop;
      const targetScrollLeft = charX - parent.clientWidth / 2;
      const targetScrollTop = charY - parent.clientHeight / 2;
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
  return /* @__PURE__ */ jsx3(Fragment, { children });
}

// src/Object.tsx
import { useEffect as useEffect3, useRef as useRef2, useState as useState2 } from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
function GameObject({
  id,
  x: initialX,
  y: initialY,
  gravity = false,
  children,
  ...props
}) {
  const [position, setPosition] = useState2({ x: initialX, y: initialY });
  const velocityY = useRef2(0);
  const delta = 1 / 60;
  useEffect3(() => {
    if (!gravity) return;
    let frame;
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
  return /* @__PURE__ */ jsx4(
    "div",
    {
      ...props,
      "data-id": id,
      style: {
        position: "absolute",
        left: position.x,
        bottom: position.y,
        ...props.style
      },
      children
    }
  );
}
export {
  Camera,
  Canvas,
  Character_default as Character,
  GameObject
};
//# sourceMappingURL=index.js.map