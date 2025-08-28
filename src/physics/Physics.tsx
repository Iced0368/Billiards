import React, { useEffect, useState, createContext, useContext, useRef } from "react";
import type { PhysicsObjectProps } from "./PhysicsObject";

export interface Vector2D {
    x: number;
    y: number;
}

export interface PhysicsObjectState {
    id: string;
    mass: number;
    position: Vector2D;
    velocity: Vector2D;
    excluded?: boolean;
    render?: (state: any) => React.ReactNode;
    [key: string]: any;
}

export interface PhysicsProps {
    timeStep?: number;
    force: (
        self: PhysicsObjectState,
        objects: PhysicsObjectState[],
        order?: number,
        setObjects?: React.Dispatch<React.SetStateAction<PhysicsObjectState[]>>
    ) => Vector2D;
    velocityThreshold?: number; // 추가: 속도 임계값 옵션
    children: React.ReactNode;
}

interface PhysicsContextValue {
    objects: PhysicsObjectState[];
    setObjects?: React.Dispatch<React.SetStateAction<PhysicsObjectState[]>>;
}

const PhysicsContext = createContext<PhysicsContextValue | null>(null);
export const usePhysics = () => {
    const ctx = useContext(PhysicsContext);
    if (!ctx) throw new Error("usePhysics must be used inside <Physics>");
    return ctx;
};

export const Physics: React.FC<PhysicsProps> = ({
    timeStep = 0.016,
    force,
    velocityThreshold = 0.5, // 기본값: 0.5
    children,
}) => {
    // 자식에서 PhysicsObject의 props를 수집
    const initialObjects = React.Children.toArray(children)
        .flatMap((child: any) =>
            child.type && child.type.isPhysicsCanvas
                    ? React.Children.toArray(child.props.children)
                        .filter((c: any) => c.type && c.type.isPhysicsObject)
                        .map((c: any, idx: number) => ({
                            id: c.props.id ?? `obj${idx}`,
                            mass: c.props.mass,
                            position: c.props.position,
                            velocity: c.props.velocity ?? { x: 0, y: 0 },
                            render: c.props.render,
                            ...c.props, // 추가: 임의의 props 포함
                        }))
                : []
        );

    const [objects, setObjects] = useState<PhysicsObjectState[]>(initialObjects);
    const order = useRef<number>(0);

    const runPhysicsTime = (deltaT: number) => {
        setObjects(prevObjects => {
            let nextObjects = prevObjects.map((obj, _, arr) => {
                if (obj.excluded) return obj; // 비활성화된 객체는 무시
                const result = force(obj, arr.filter(o => !o.excluded), order.current, setObjects);

                const f = { x: result.x ?? 0, y: result.y ?? 0 };
                const ax = f.x / obj.mass;
                const ay = f.y / obj.mass;
                let newVx = (obj.velocity?.x ?? 0) + ax * deltaT;
                let newVy = (obj.velocity?.y ?? 0) + ay * deltaT;
                // 속도 임계값 적용
                if (Math.hypot(newVx, newVy) < velocityThreshold) {
                    newVx = 0;
                    newVy = 0;
                }
                const newX = obj.position.x + newVx * deltaT;
                const newY = obj.position.y + newVy * deltaT;
                return {
                    ...obj,
                    ...result,
                    velocity: { x: newVx, y: newVy },
                    position: { x: newX, y: newY },
                };
            });

            return nextObjects;
        });
    }

    useEffect(() => {
        const interval = setInterval(() => {
            runPhysicsTime(timeStep);
            order.current += 1;
            
        }, timeStep * 1000);
        return () => clearInterval(interval);
    }, [force, timeStep, velocityThreshold]);

    return (
        <PhysicsContext.Provider value={{ objects, setObjects }}>
            {children}
        </PhysicsContext.Provider>
    );
};