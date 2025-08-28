import { type PhysicsObjectProps } from '../../physics/PhysicsObject';
import './CueStick.css'

const renderCueStick = (obj: PhysicsObjectProps) => (
    <div
        className={`cue-stick-container ${obj.excluded ? "disabled" : ""}`}
        style={{
            left: obj.canvas.x,
            top: obj.canvas.y,
            position: "absolute",
            width: "14px",
            height: "14px",
            transform: `rotate(${-obj.rotation}deg)`,
            zIndex: 10,
        }}
    >
        <div className="cue-ferrule"></div>
        <div className="cue-stick">
            <div className="cue-butt"></div>
            <div className="cue-wrap"></div>
        </div>
    </div>
)

export default renderCueStick;