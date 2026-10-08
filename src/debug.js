document.addEventListener('keydown', (e) => {
    // Ctrl + Shift + D
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        toggleDebugPanel();
    }
});

function toggleDebugPanel() {
    let panel = document.getElementById('debug-panel');
    if (panel) {
        panel.remove();
        return;
    }
    
    panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.innerHTML = `
        <strong>[DEBUG PANEL]</strong><br><br>
        <button id="dbg-next">Skip Question</button><br><br>
        <button id="dbg-time-sub">-1 Min</button>
        <button id="dbg-time-add">+1 Min</button>
    `;
    document.body.appendChild(panel);
    
    document.getElementById('dbg-next').onclick = () => {
        if (window.Station3._instance) window.Station3._instance.nextQuestion();
    };
    document.getElementById('dbg-time-sub').onclick = () => {
        if (window.Station3._instance) window.Station3._instance.timeRemaining -= 60;
    };
    document.getElementById('dbg-time-add').onclick = () => {
        if (window.Station3._instance) window.Station3._instance.timeRemaining += 60;
    };
}
