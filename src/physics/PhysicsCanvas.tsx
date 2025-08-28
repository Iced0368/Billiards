import React, { createContext, useContext } from "react";
import { usePhysics } from "./Physics";

interface PhysicsCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
    width: number;
    height: number;
    offsetTopLeft: { x: number; y: number };
    offsetBottomRight: { x: number; y: number };
    children: React.ReactNode;
}

interface PhysicsCanvasComponent extends React.FC<PhysicsCanvasProps> {
    isPhysicsCanvas?: boolean;
}

interface PhysicsCanvasContextValue {
    simToCanvas: (pos: { x: number; y: number }) => { x: number; y: number };
    canvasToSim: (pos: { x: number; y: number }) => { x: number; y: number }; // 추가
    width: number;
    height: number;
    offsetTopLeft: { x: number; y: number };
    offsetBottomRight: { x: number; y: number };
}

const PhysicsCanvasContext = createContext<PhysicsCanvasContextValue | null>(null);
export const usePhysicsCanvas = () => useContext(PhysicsCanvasContext);

export const PhysicsCanvas: PhysicsCanvasComponent = ({
    width,
    height,
    offsetTopLeft,
    offsetBottomRight,
    children,
    ...rest
}) => {
    const { objects } = usePhysics();

    // 시뮬레이션 좌표 → 캔버스 좌표 변환 함수
    const simToCanvas = (pos: { x: number; y: number }) => ({
        x:
            ((pos.x - offsetTopLeft.x) /
                (offsetBottomRight.x - offsetTopLeft.x)) *
            width,
        y:
            ((pos.y - offsetTopLeft.y) /
                (offsetBottomRight.y - offsetTopLeft.y)) *
            height,
    });

    // 캔버스 좌표 → 시뮬레이션 좌표 변환 함수
    const canvasToSim = (pos: { x: number; y: number }) => ({
        x:
            offsetTopLeft.x +
            (pos.x / width) * (offsetBottomRight.x - offsetTopLeft.x),
        y:
            offsetTopLeft.y +
            (pos.y / height) * (offsetBottomRight.y - offsetTopLeft.y),
    });

    return (
        <PhysicsCanvasContext.Provider value={{
            simToCanvas,
            canvasToSim, // 추가
            width,
            height,
            offsetTopLeft,
            offsetBottomRight,
        }}>
            <div
                className="physics-canvas"
                style={{
                    position: "relative",
                    width,
                    height,
                    overflow: "hidden",
                }}
                {...rest}
            >
                {children}
                {objects.map((obj) =>
                    obj.render ? (
                        <React.Fragment key={obj.id}>
                            {obj.render({
                                ...obj,
                                canvas: simToCanvas(obj.position),
                            })}
                        </React.Fragment>
                    ) : null
                )}
            </div>
        </PhysicsCanvasContext.Provider>
    );
};
PhysicsCanvas.isPhysicsCanvas = true;