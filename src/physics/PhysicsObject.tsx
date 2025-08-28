import React from "react";
import { type Vector2D } from "./Physics";

export interface PhysicsObjectProps {
    id?: string;
    mass?: number;
    position?: Vector2D;
    velocity?: Vector2D;
    render?: (state: any) => React.ReactNode;
    [key: string]: any; // 추가: 임의의 props 허용
}

export const PhysicsObject: React.FC<PhysicsObjectProps> & { isPhysicsObject?: boolean } = () => null;
PhysicsObject.isPhysicsObject = true;