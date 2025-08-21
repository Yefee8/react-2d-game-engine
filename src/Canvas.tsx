import { type ReactNode } from "react";
import "./globals.css"

interface canvasProps {
  children: ReactNode;
  [key: string]: any;
}

export default function Canvas(props: canvasProps) {
  return (
    <div id="canvas" {...props}>
      {props.children}
    </div>
  );
}
