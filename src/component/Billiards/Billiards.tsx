import { Physics } from '../../physics/Physics';
import { PhysicsCanvas } from '../../physics/PhysicsCanvas';
import { balls, walls, holes, BALL_RADIUS } from '././BilliardsObject';
import CanvasOverlay from './CanvasOverlay';
import type { PhysicsObjectState } from '../../physics/Physics';

import './Billiards.css'

export type Action = { type: string, payload?: any };

interface BilliardsProps {
    dispatch?: (action: Action) => void;
    timeStep?: number;
};

function computeCollisionTimeError(obj1: PhysicsObjectState, obj2: PhysicsObjectState) {
    const dx = obj2.position.x - obj1.position.x;
    const dy = obj2.position.y - obj1.position.y;
    const dvx = (obj2.velocity.x ?? 0) - (obj1.velocity.x ?? 0);
    const dvy = (obj2.velocity.y ?? 0) - (obj1.velocity.y ?? 0);
    const r = (obj1.radius ?? 0) + (obj2.radius ?? 0);

    const a = dvx * dvx + dvy * dvy;
    const b = -2 * (dx * dvx + dy * dvy);
    const c = dx * dx + dy * dy - r * r;

    if (a === 0) return 0; // 상대 속도가 없으면 충돌 없음

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return 0; // 허수해, 충돌 없음

    const sqrtD = Math.sqrt(discriminant);
    return (-b + sqrtD) / (2 * a);
}

export default function Billiards({ dispatch, timeStep=0.016 }: BilliardsProps) {
    return (
        <div className='billiards-container' id='billiards'>
            <Physics
                timeStep={timeStep}
                velocityThreshold={5}
                force={(self: PhysicsObjectState, objects: PhysicsObjectState[], frame?: number, setObjects?: React.Dispatch<React.SetStateAction<PhysicsObjectState[]>>) => {
                    let fx = 0, fy = 0;
                    const k = 500;
                    const restitution = 0.2; // 반발계수(1이면 완전탄성, 0이면 완전비탄성)

                    if (self.type === "wall") return { x: 0, y: 0 }; // 벽은 힘 없음
                    else if (self.type === "ball") {
                        self.rotation = (self.rotation ?? 0) + (self.velocity.x / BALL_RADIUS) * 180 / Math.PI * 0.016;

                        for (const obj of objects) {
                            if (obj.id === self.id) continue;

                            if (obj.type === "ball") { // 공-공 충돌
                                const dx = obj.position.x - self.position.x;
                                const dy = obj.position.y - self.position.y;
                                const distSq = dx * dx + dy * dy;
                                const dist = Math.sqrt(distSq) + 1e-6;
                                const minDist = (self.radius ?? 0) + (obj.radius ?? 0);

                                if (dist < minDist) {
                                    // 반발력
                                    const f = k * (minDist - dist);
                                    fx -= f * (dx / dist);
                                    fy -= f * (dy / dist);

                                    // --- 에너지 손실(속도 감쇠) 적용 ---
                                    // 충돌 방향 단위벡터
                                    const nx = dx / dist;
                                    const ny = dy / dist;
                                    // 상대속도
                                    const rvx = self.velocity.x - obj.velocity.x;
                                    const rvy = self.velocity.y - obj.velocity.y;
                                    // 충돌 방향 상대속도 크기
                                    const relVel = rvx * nx + rvy * ny;
                                    if (relVel > 0) continue; // 이미 멀어지는 중이면 무시

                                    // 반발계수 적용: 충돌 방향 속도를 줄임
                                    const impulse = -(1 + restitution) * relVel;
                                    // 질량 고려(단순화: 자기만 반영)
                                    fx -= (impulse * nx) / self.mass;
                                    fy -= (impulse * ny) / self.mass;

                                    // 충돌 이벤트 디스패치
                                    dispatch && dispatch({ type: "collision", payload: {target: [self.id, obj.id].sort(), frame: frame} });
                                }
                            }

                            else if (obj.type === "wall") { // 공-벽 충돌
                                // 벽의 법선 벡터
                                let nx = 0, ny = 0;
                                if (obj.id === "wall-top") { nx = 0; ny = -1; }
                                else if (obj.id === "wall-bottom") { nx = 0; ny = 1; }
                                else if (obj.id === "wall-left") { nx = 1; ny = 0; }
                                else if (obj.id === "wall-right") { nx = -1; ny = 0; }

                                // 공과 벽의 거리 계산
                                const dx = self.position.x - obj.position.x;
                                const dy = self.position.y - obj.position.y;
                                const dist = dx * nx + dy * ny;

                                if (dist < (self.radius ?? 0)) {
                                    // 반발력
                                    const f = k * ((self.radius ?? 0) - dist);
                                    fx += f * nx;
                                    fy += f * ny;

                                    // --- 에너지 손실(속도 감쇠) 적용 ---
                                    // 충돌 방향 상대속도 크기
                                    const relVel = self.velocity.x * nx + self.velocity.y * ny;
                                    if (relVel > 0) continue; // 이미 멀어지는 중이면 무시

                                    // 반발계수 적용: 충돌 방향 속도를 줄임
                                    const impulse = -(1 + restitution) * relVel;
                                    fx += (impulse * nx) / self.mass;
                                    fy += (impulse * ny) / self.mass;
                                }
                            }

                            else if (obj.type === "hole") { // 공-홀 충돌
                                const dx = obj.position.x - self.position.x;
                                const dy = obj.position.y - self.position.y;
                                const distSq = dx * dx + dy * dy;
                                const dist = Math.sqrt(distSq) + 1e-6;
                                const holeRadius = (obj.radius ?? 0);

                                if (dist < holeRadius) {
                                    // 제거 이벤트 디스패치
                                    dispatch && dispatch({ type: "potted", payload: { ball: self.id, frame: frame } });

                                    self.excluded = true; // 비활성화
                                    setTimeout(() => {
                                        setObjects?.(prev => prev.filter(o => o.id !== self.id));
                                    }, 300);

                                    return { x: 0, y: 0 }; // 힘 없음
                                }
                            }
                        }

                        // 구름 마찰력
                        const frictionForce = 40;
                        const v = Math.hypot(self.velocity.x, self.velocity.y) + 1e-6;
                        fx -= frictionForce * (self.velocity.x / v);
                        fy -= frictionForce * (self.velocity.y / v);

                        return { x: fx, y: fy };
                    }
                    // cue-stick이 힘을 주는 쪽(큐대 입장)
                    else if (self.type === "cue-stick") {
                        for (const obj of objects) {
                            if (obj.type !== "ball") continue;
                            const dx = obj.position.x - self.position.x;
                            const dy = obj.position.y - self.position.y;
                            const dist = Math.sqrt(dx * dx + dy * dy) + 1e-6;
                            const minDist = (self.radius ?? 0) + (obj.radius ?? 0);

                            if (dist < minDist && self.velocity) {
                                // 큐대의 속도를 공에 전달
                                const impulseX = self.velocity.x;
                                const impulseY = self.velocity.y;
                                const impulseMag = Math.hypot(impulseX, impulseY) + 1e-6;

                                self.excluded = true; // 큐대 비활성화
                                
                                const deltaT = computeCollisionTimeError(self, obj);
                                console.log("collision error=", deltaT);

                                const direction = { 
                                    x: (dx - deltaT*(obj.velocity.x - impulseX)), 
                                    y: (dy - deltaT*(obj.velocity.y - impulseY)) 
                                };
                                const directionMag = Math.hypot(direction.x, direction.y) + 1e-6;
                                const cosine = (impulseX * direction.x + impulseY * direction.y) / (impulseMag * directionMag);

                                // 공에 힘을 가함
                                setObjects?.(prev =>
                                    prev.map(o =>
                                        o.id === obj.id ? {
                                                ...o,
                                                velocity: {
                                                    x: (o.velocity?.x ?? 0) + direction.x * cosine * impulseMag / directionMag,
                                                    y: (o.velocity?.y ?? 0) + direction.y * cosine * impulseMag / directionMag,
                                                }
                                            } : o
                                    )
                                );

                                setTimeout(() => {
                                    setObjects?.(prev => prev.filter(o => o.id !== self.id));
                                }, 100);
                            }
                        }

                        return { x: 0, y: 0 };
                    }
                    return { x: 0, y: 0 };
                }}
            >
                <PhysicsCanvas
                    width={800}
                    height={400}
                    offsetTopLeft={{ x: -400, y: 200 }}
                    offsetBottomRight={{ x: 400, y: -200 }}
                >
                    {[...balls, ...walls, ...holes]}
                    <CanvasOverlay />
                </PhysicsCanvas>
            </Physics>
        </div>
    );
}