import React, { useEffect, useState } from 'react';
import { usePhysics } from '../../physics/Physics';
import { usePhysicsCanvas } from '../../physics/PhysicsCanvas';
import renderCueStick from './CueStick';
import { createPortal } from 'react-dom';

function getBilliardsCoordsFromCanvasCoords(canvasX: number, canvasY: number) {
    const canvas = document.querySelector('.physics-canvas') as HTMLElement;
    const billiards = document.getElementById('billiards') as HTMLElement;
    if (!canvas || !billiards) return { x: canvasX, y: canvasY };

    const canvasRect = canvas.getBoundingClientRect();
    const billiardsRect = billiards.getBoundingClientRect();

    return {
        x: canvasX + canvasRect.left - billiardsRect.left,
        y: canvasY + canvasRect.top - billiardsRect.top,
    };
}


const CUESTICK_LIFETIME = 1500;

export default function CanvasOverlay() {
    const { setObjects } = usePhysics();
    const { canvasToSim, simToCanvas } = usePhysicsCanvas() ?? {};
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [cueState, setCueState] = useState<{
        position: { x: number, y: number } | null,
        rotation: number
    } | null>(null);
    const [cueStickMoving, setCueStickMoving] = useState(false);


    // 마우스가 캔버스 위에 있을 때의 위치
    const [mouseSimPos, setMouseSimPos] = useState<{ x: number, y: number } | null>(null);

    // 캔버스 내 마우스 위치 추적
    useEffect(() => {
        if (cueStickMoving ||dragStart) return; // 드래그 중엔 무시

        const handleMouseMove = (e: MouseEvent) => {
            const canvas = document.querySelector('.physics-canvas') as HTMLElement;
            if (!canvas || !canvasToSim) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // 캔버스 영역 밖이면 무시
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                setMouseSimPos(null);
                return;
            }
            setMouseSimPos(canvasToSim({ x, y }));
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [dragStart, canvasToSim]);


    const mouseEventToSim = (e: MouseEvent | React.MouseEvent) => {
        const canvas = document.querySelector('.physics-canvas') as HTMLElement;
        if (!canvas || !canvasToSim) return null;
        const rect = canvas.getBoundingClientRect();
        const x = (e as MouseEvent).clientX - rect.left;
        const y = (e as MouseEvent).clientY - rect.top;
        return canvasToSim({ x, y });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const startSim = mouseEventToSim(e);
        if (!startSim) return;

        setDragStart(startSim);
        setCueState({
            position: startSim,
            rotation: 0
        });
    };

    useEffect(() => {
        if (!dragStart) return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            const mousePos = mouseEventToSim(e);
            if (!dragStart || !mousePos) return;

            const direction = {
                x: mousePos.x - dragStart.x,
                y: mousePos.y - dragStart.y,
            };

            const angle = Math.atan2(direction.y, direction.x);
            setCueState({
                position: dragStart,
                rotation: angle * 180 / Math.PI
            });
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        return () => window.removeEventListener('mousemove', handleWindowMouseMove);
    }, [dragStart, canvasToSim]);

    useEffect(() => {
        if (!dragStart) return;

        const handleWindowMouseUp = (e: MouseEvent) => {
            if (!canvasToSim) return;
            const canvas = document.querySelector('.physics-canvas') as HTMLElement;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const dragEnd = canvasToSim({ x, y });

            if (!dragEnd) {
                setDragStart(null);
                setCueState(null);
                return;
            }

            const direction = {
                x: dragEnd.x - dragStart.x,
                y: dragEnd.y - dragStart.y,
            };

            const angle = Math.atan2(direction.y, direction.x);
            const rotation = angle * 180 / Math.PI;

            setObjects?.(prev => {
                const filtered = prev.filter(obj => obj.id !== "cue-stick");
                const maxNorm = 300;
                const norm = Math.hypot(direction.x, direction.y);
                let vx = direction.x, vy = direction.y;
                if (norm > maxNorm) {
                    vx = (direction.x / norm) * maxNorm;
                    vy = (direction.y / norm) * maxNorm;
                }
                const velocity = { x: vx * 10, y: vy * 10 };

                return [
                    ...filtered,
                    {
                        id: "cue-stick",
                        type: "cue-stick",
                        mass: Infinity,
                        radius: 7,
                        position: { x: dragStart.x, y: dragStart.y },
                        rotation: rotation,
                        velocity: velocity,
                        render: (obj) => {
                            // obj.canvas는 PhysicsCanvas 기준 좌표
                            const billiardsPos = getBilliardsCoordsFromCanvasCoords(obj.canvas.x, obj.canvas.y);
                            return renderCueStick({
                                ...obj,
                                canvas: billiardsPos,
                            });
                        },
                    }
                ];
            });

            setCueStickMoving(true);
            setTimeout(() => {
                setObjects?.(prev => prev.filter(obj => obj.id !== "cue-stick"));
                setCueStickMoving(false);
            }, CUESTICK_LIFETIME);

            setDragStart(null);
            setCueState(null);
        };

        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => window.removeEventListener('mouseup', handleWindowMouseUp);
    }, [dragStart, setObjects, canvasToSim]);

    // cueState가 있을 때(드래그 중) cue-stick 렌더링
    let cueStickView = null;
    if (cueState && cueState.position && simToCanvas) {
        const canvasPos = simToCanvas(cueState.position);
        const billiardsPos = getBilliardsCoordsFromCanvasCoords(canvasPos.x, canvasPos.y);
        cueStickView = renderCueStick({
            position: cueState.position,
            rotation: cueState.rotation,
            canvas: billiardsPos,
        });
    } 
    else if (!cueStickMoving && mouseSimPos && simToCanvas) {
        const canvasPos = simToCanvas(mouseSimPos);
        const billiardsPos = getBilliardsCoordsFromCanvasCoords(canvasPos.x, canvasPos.y);
        cueStickView = renderCueStick({
            position: mouseSimPos,
            rotation: 45,
            canvas: billiardsPos,
        },
        { opacity: 0.5 });
    }

    return (
        <div
            className="canvas-overlay"
            onMouseDown={handleMouseDown}
            style={{ pointerEvents: "auto", zIndex: 10 }}
        >
            {cueStickView}
        </div>
    );
}