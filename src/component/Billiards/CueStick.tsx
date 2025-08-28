import { createPortal } from 'react-dom';
import { type PhysicsObjectProps } from '../../physics/PhysicsObject';
import './CueStick.css'

const renderCueStick = (obj: PhysicsObjectProps, style?: React.CSSProperties) =>
    createPortal((
        <div
            className={`cue-stick-container ${obj.excluded ? "disabled" : ""}`}
            style={{
                left: obj.canvas.x,
                top: obj.canvas.y,
                position: "absolute",
                width: "14px",
                height: "14px",
                transform: `translate(-50%, -50%) rotate(${-obj.rotation}deg)`,
                zIndex: 10,
                ...style,
            }}
        >
            <div className="cue-ferrule"></div>
            <div className="cue-stick">
                <div className="cue-butt"></div>
                <div className="cue-wrap"></div>
            </div>
        </div>
    ), document.getElementById('billiards')!)

export default renderCueStick;