window.Station3 = {
    _instance: null,
    
    init: (containerElement, config = { teamId: "TEST", timeLimitSec: 720 }) => {
        if (window.Station3._instance) {
            window.Station3.destroy();
        }
        window.Station3._instance = new window.Station(containerElement, config);
    },
    
    onProgress: (callback) => {
        if (window.Station3._instance) {
            window.Station3._instance.config.onProgress = callback;
        }
    },
    
    onComplete: (callback) => {
        if (window.Station3._instance) {
            window.Station3._instance.config.onComplete = callback;
        }
    },
    
    destroy: () => {
        if (window.Station3._instance) {
            clearInterval(window.Station3._instance.timerInterval);
            window.Station3._instance.container.innerHTML = '';
            window.Station3._instance = null;
        }
    }
};
