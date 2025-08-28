import { useEffect, useRef, useState } from 'react';
import './App.css'
import Billiards, { type Action } from './component/Billiards/Billiards';
import LogBoard from './component/LogBoard';

function App() {
    const [logVisible, setLogVisible] = useState(false);
    const [logs, setLogs] = useState(['App started']);
    const logBufferRef = useRef<string[]>([]);

    const lastFramesRef = useRef<Record<string, Action>>({});
    
    const handleDispatch = (action: Action) => {
        const { type, payload } = action;
        if (!payload) return;

        if (type === "collision") {

            const { target, frame } = payload;

            const key = `${type}_${target[0]}_${target[1]}`;
            const lastAction = lastFramesRef.current[key];

            if (lastAction && lastAction.payload) {
                const lastFrame = lastAction.payload.frame!;
                // frame이 1 차이면 이전 액션만 출력
                if (frame <= lastFrame + 1) {
                    lastFramesRef.current[key] = action; // 현재 액션 기록
                    return; // 현재 액션은 무시
                }
            }

            // 일반 출력
            logBufferRef.current.push(`Collision: ${target[0]} and ${target[1]} at frame ${frame}`);
            lastFramesRef.current[key] = action;
        }
        else if (type === "potted") {
            const { ball, frame } = payload;
            logBufferRef.current.push(`Potted: ${ball} at frame ${frame}`);
        }
    };

    useEffect(() => {
        const updateLogs = () => {
            if (logBufferRef.current.length > 0) {
                setLogs(prevLogs => [
                    ...logBufferRef.current.slice(0, 32),
                    ...prevLogs
                ].slice(0, 32));
                logBufferRef.current = [];
            }
        };

        const updateLogsInterval = setInterval(updateLogs, 300); // 0.3초마다 로그 업데이트
        return () => clearInterval(updateLogsInterval);
    }, []);

    return (
        <div className="App-container">
            <Billiards dispatch={handleDispatch}></Billiards>
            {logVisible && <LogBoard logs={logs}></LogBoard>}
            {<button onClick={() => setLogVisible(prev => !prev)}>로그</button>}
        </div>
    );
}

export default App;
