import './LogBoard.css';

interface LogBoardProps {
    logs: string[];
}

export default function LogBoard({logs}: LogBoardProps) {
    return (
        <div className="log-board">
            <h3>Log Board</h3>
            <div id="log-entries" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {
                    logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))
                }
            </div>
        </div>
    );
}