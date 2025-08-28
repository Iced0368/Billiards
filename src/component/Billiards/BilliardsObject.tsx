import React from "react";
import { PhysicsObject } from '../../physics/PhysicsObject';
import './BilliardsObject.css'

export const BALL_RADIUS = 18;
export const BALL_MASS = 1;
const COLORS = [
    "#ff0", "#00f", "#f00", "#a0f", "#fa0", "#5f5", "#a55", "#000",
    "#ff0", "#00f", "#f00", "#a0f", "#fa0", "#5f5", "#a55"
];

export const renderBall = (obj: any) => (
    <div className='ball-container'
         style={{
            left: obj.canvas.x,
            top: obj.canvas.y,
        } as React.CSSProperties}
    >
        <div
            className={`ball ${obj.decoration ?? ""} ${obj.excluded ? "potted" : ""}`}
            data-num={obj.number}
            style={{
                "--color": obj.color,
                transform: `translate(-50%, -50%) rotate(${obj.rotation}deg)`,
            } as React.CSSProperties}
        />
    </div>
);

// 삼각형 형태로 15개 공 배치
export const balls: React.ReactElement[] = [];
let idx = 0;
const startX = 100;
const startY = 0;

for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
        balls.push(
            <PhysicsObject
                key={`ball${idx + 1}`}
                id={`ball${idx + 1}`}
                type="ball"
                decoration={idx >= 8 ? "stripe" : "solid"}
                number={idx + 1}
                rotation={0}
                radius={BALL_RADIUS}
                mass={BALL_MASS}
                color={COLORS[idx % COLORS.length]}
                position={{
                    x: startX + row * BALL_RADIUS * 2 * Math.cos(Math.PI / 6),
                    y: startY + (col - row / 2) * BALL_RADIUS * 2 * 1.05
                }}
                render={renderBall}
            />
        );
        idx++;
    }
}

// 큐볼(흰 공)
balls.push(
    <PhysicsObject
        key="cue"
        id="cue"
        type="ball"
        radius={BALL_RADIUS}
        mass={BALL_MASS}
        color="#fff"
        position={{ x: -300, y: 0 }}
        velocity={{ x: 0, y: 0 }}
        render={renderBall}
    />
);

export const walls: React.ReactElement[] = [
    <PhysicsObject key="wall-top" id="wall-top" type="wall" mass={Infinity} position={{ x: 0, y: 200 }} />,
    <PhysicsObject key="wall-bottom" id="wall-bottom" type="wall" mass={Infinity} position={{ x: 0, y: -200 }} />,
    <PhysicsObject key="wall-left" id="wall-left" type="wall" mass={Infinity} position={{ x: -400, y: 0 }} />,
    <PhysicsObject key="wall-right" id="wall-right" type="wall" mass={Infinity} position={{ x: 400, y: 0 }} />,
];

export const renderHole = (obj: any) => (
    <div className='hole'
         style={{
            left: obj.canvas.x,
            top: obj.canvas.y,
            width: (obj.radius ?? 0) * 2,
            height: (obj.radius ?? 0) * 2,
        } as React.CSSProperties}
    />
);

export const HOLE_RADIUS = BALL_RADIUS * 1.1;

export const holes: React.ReactElement[] = [
    <PhysicsObject key="hole-top-left" id="hole-top-left" type="hole" mass={Infinity} position={{ x: -390, y: 190 }} radius={HOLE_RADIUS} render={renderHole} />,
    <PhysicsObject key="hole-top-right" id="hole-top-right" type="hole" mass={Infinity} position={{ x: 390, y: 190 }} radius={HOLE_RADIUS} render={renderHole} />,
    <PhysicsObject key="hole-bottom-left" id="hole-bottom-left" type="hole" mass={Infinity} position={{ x: -390, y: -190 }} radius={HOLE_RADIUS} render={renderHole} />,
    <PhysicsObject key="hole-bottom-right" id="hole-bottom-right" type="hole" mass={Infinity} position={{ x: 390, y: -190 }} radius={HOLE_RADIUS} render={renderHole} />,
    <PhysicsObject key="hole-left" id="hole-left" type="hole" mass={Infinity} position={{ x: 0, y: 200 }} radius={HOLE_RADIUS} render={renderHole} />,
    <PhysicsObject key="hole-right" id="hole-right" type="hole" mass={Infinity} position={{ x: 0, y: -200 }} radius={HOLE_RADIUS} render={renderHole} />,
];