import React, { ReactNode, RefObject } from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';

interface CharacterProps {
    gravity?: number;
    jumpHeight?: number;
    controls?: string[];
    sprint?: boolean;
    sprintMultiplier?: number;
    speed?: number;
    jump?: boolean;
    jumpCount?: number;
    lockControls?: boolean;
    onAction?: (action: string, payload?: any) => void;
    objects?: {
        x: number;
        y: number;
        width: number;
        height: number;
    }[];
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
declare const Character: React.ForwardRefExoticComponent<Omit<CharacterProps, "ref"> & React.RefAttributes<HTMLDivElement>>;

interface canvasProps {
    children: ReactNode;
    [key: string]: any;
}
declare function Canvas(props: canvasProps): react_jsx_runtime.JSX.Element;

interface CameraProps {
    children: ReactNode;
    parentRef: RefObject<any>;
    characterRef: RefObject<any>;
}
declare function Camera({ children, parentRef, characterRef, }: CameraProps): react_jsx_runtime.JSX.Element;

interface GameObjectProps {
    id: string;
    x: number;
    y: number;
    gravity?: boolean;
    children: ReactNode;
    [key: string]: any;
}
declare function GameObject({ id, x: initialX, y: initialY, gravity, children, ...props }: GameObjectProps): react_jsx_runtime.JSX.Element;

export { Camera, Canvas, Character, GameObject };
