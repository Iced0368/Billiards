import './App.css'
import { Physics } from './physics/Physics'
import { PhysicsCanvas } from './physics/PhysicsCanvas'
import { PhysicsObject } from './physics/PhysicsObject'

const renderPlanet = (obj: any) => {
	return (
		<div
			className="obj"
			style={{
				left: obj.canvas.x,
				top: obj.canvas.y,
				width: obj.radius * 2,
				height: obj.radius * 2,
				borderRadius: `${obj.radius}px`,
				position: "absolute",
				background: obj.color,
                transform: "translate(-50%, -50%)", // 중앙 정렬
			}}
		/>
	);
}

function App() {
    return (
        <Physics
            timeStep={0.0016}
            force={(self, objects) => {
                // 중력
                const G = 10000;
                let fx = 0, fy = 0;
                for (const obj of objects) {
                    if (obj.id === self.id) continue;
                    const dx = obj.position.x - self.position.x;
                    const dy = obj.position.y - self.position.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq) + 1e-6;
                    const f = (G * self.mass * obj.mass) / distSq;
                    fx += f * (dx / dist);
                    fy += f * (dy / dist);
                }

                // 반발력 (radius 고려)
                const k = 10000;
                for (const obj of objects) {
                    if (obj.id === self.id) continue;
                    const dx = obj.position.x - self.position.x;
                    const dy = obj.position.y - self.position.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq) + 1e-6;
                    const minDist = (self.radius ?? 0) + (obj.radius ?? 0);

                    if (dist < minDist) { // 두 반지름의 합보다 가까우면
                        const f = k * (minDist - dist);
                        fx -= f * (dx / dist);
                        fy -= f * (dy / dist);
                    }
                }

                return { x: fx, y: fy };
            }}
        >
            <PhysicsCanvas
                width={800}
                height={600}
                offsetTopLeft={{ x: -400, y: 300 }}
                offsetBottomRight={{ x: 400, y: -300 }}
            >
                <PhysicsObject
                    id="sun"
                    radius={10}
                    mass={100}
                    color='red'
                    position={{ x: 0, y: 0 }}
                    render={renderPlanet}
                />
                <PhysicsObject
                    id="b"
                    radius={5}
                    mass={1}
                    color='blue'
                    position={{ x: 100, y: 0 }}
					velocity={{ x: 0, y: 100 }}
                    render={renderPlanet}
                />
				<PhysicsObject
                    id="c"
                    radius={5}
                    mass={1}
                    color='green'
                    position={{ x: -100, y: 0 }}
					velocity={{ x: 0, y: -100 }}
                    render={renderPlanet}
                />
				<PhysicsObject
                    id="d"
                    radius={5}
                    mass={1}
                    color='purple'
                    position={{ x: 50, y: 0 }}
					velocity={{ x: 0, y: 100 }}
                    render={renderPlanet}
                />
				<PhysicsObject
                    id="e"
                    radius={5}
                    mass={1}
                    color='pink'
                    position={{ x: 150, y: -100 }}
					velocity={{ x: -10, y: 70 }}
                    render={renderPlanet}
                />
            </PhysicsCanvas>
        </Physics>
    );
}

export default App;
