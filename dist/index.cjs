"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Camera: () => Camera,
  Canvas: () => Canvas,
  Character: () => Character_default,
  GameObject: () => GameObject
});
module.exports = __toCommonJS(index_exports);

// src/Character.tsx
var import_react = require("react");

// src/utils.ts
var basicGravity = 9.8;
var basicJumpHeight = 9;

// src/Character.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  const aLeft = ax, aRight = ax + aw;
  const aBottom = ay, aTop = ay + ah;
  const bLeft = bx, bRight = bx + bw;
  const bBottom = by, bTop = by + bh;
  return aLeft < bRight && aRight > bLeft && aBottom < bTop && aTop > bBottom;
}
var Character = (0, import_react.forwardRef)(function Character2({
  gravity = basicGravity,
  jumpHeight = basicJumpHeight,
  controls = ["KeyW", "KeyA", "KeyD", "ShiftLeft"],
  sprint = true,
  sprintMultiplier = 1.4,
  speed = 5,
  jump = true,
  lockControls = false,
  onAction,
  objects = [],
  children,
  ...rest
}, externalRef) {
  const keysPressed = (0, import_react.useRef)(/* @__PURE__ */ new Set());
  const velocityY = (0, import_react.useRef)(0);
  const groundedRef = (0, import_react.useRef)(true);
  const lastAction = (0, import_react.useRef)("idle");
  const [action, setAction] = (0, import_react.useState)("idle");
  const [pos, setPos] = (0, import_react.useState)({ x: 0, y: 0 });
  const [facing, setFacing] = (0, import_react.useState)(1);
  const nodeRef = (0, import_react.useRef)(null);
  const setRefs = (el) => {
    nodeRef.current = el;
    if (typeof externalRef === "function") externalRef(el);
    else if (externalRef) externalRef.current = el;
  };
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
    if (!onAction) return;
    if (action !== lastAction.current) {
      onAction(action, { x: pos.x, y: pos.y, vy: velocityY.current, grounded: groundedRef.current });
      lastAction.current = action;
    }
  }, [action, pos, onAction]);
  (0, import_react.useEffect)(() => {
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
          if (jump && groundedRef.current && keysPressed.current.has(controls[0])) {
            velocityY.current = jumpHeight;
            groundedRef.current = false;
            startedJump = true;
          }
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
          groundedRef.current = landed;
          if (dx < 0) setFacing(-1);
          else if (dx > 0) setFacing(1);
          let nextAction = "idle";
          if (startedJump) nextAction = "jump";
          else if (!groundedRef.current) nextAction = "inair";
          else if (dx !== 0) nextAction = isSprint ? dx > 0 ? "sprintRight" : "sprintLeft" : dx > 0 ? "walkRight" : "walkLeft";
          setAction(nextAction);
          return { x: candX, y: candY };
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [controls, sprint, sprintMultiplier, speed, jump, gravity, lockControls]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function Canvas(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { id: "canvas", ...props, children: props.children });
}

// src/Camera.tsx
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function Camera({
  children,
  parentRef,
  characterRef
}) {
  (0, import_react3.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, { children });
}

// src/Object.tsx
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function GameObject({
  id,
  x: initialX,
  y: initialY,
  gravity = false,
  children,
  ...props
}) {
  const [position, setPosition] = (0, import_react4.useState)({ x: initialX, y: initialY });
  const velocityY = (0, import_react4.useRef)(0);
  const delta = 1 / 60;
  (0, import_react4.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Camera,
  Canvas,
  Character,
  GameObject
});
//# sourceMappingURL=index.cjs.map