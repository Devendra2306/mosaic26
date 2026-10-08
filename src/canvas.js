class PlateCanvas {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.width = 600;
        this.canvas.height = 150;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.container.appendChild(this.canvas);
        
        this.baseImageData = null;
        this.currentConfig = { contrast: 50, threshold: 128, denoise: false };
        this.captureType = null;
        
        this.plateText = "";
    }

    loadPlate(plateText, captureTypeId) {
        this.plateText = plateText;
        this.captureType = window.CAPTURE_TYPES[captureTypeId];
        
        // Procedurally draw plate
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ddd';
        this.ctx.font = 'bold 80px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this._drawTextWithEffects(captureTypeId);
        
        this.baseImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.applyProcessing();
    }

    _drawTextWithEffects(typeId) {
        let alpha = 1;
        let shadowBlur = 0;
        let shadowColor = 'transparent';

        if (typeId === 'N1') { alpha = 0.5; } 
        if (typeId === 'N2') { shadowBlur = 20; shadowColor = 'white'; } 
        if (typeId === 'N3') { shadowBlur = 10; shadowColor = '#999'; } 
        if (typeId === 'N4') { this.ctx.fillStyle = '#888'; }
        if (typeId === 'N5') { this.ctx.filter = 'blur(4px)'; }

        this.ctx.globalAlpha = alpha;
        this.ctx.shadowBlur = shadowBlur;
        this.ctx.shadowColor = shadowColor;
        this.ctx.fillText(this.plateText, this.canvas.width / 2, this.canvas.height / 2 + 10);
        
        this.ctx.filter = 'none';
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        
        const imgData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
        for(let i=0; i<imgData.data.length; i+=4) {
            let noise = (Math.random() - 0.5) * 30;
            if(typeId === 'N3' || typeId === 'N5') noise = (Math.random() - 0.5) * 80;
            imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
            imgData.data[i+1] = Math.min(255, Math.max(0, imgData.data[i+1] + noise));
            imgData.data[i+2] = Math.min(255, Math.max(0, imgData.data[i+2] + noise));
        }
        this.ctx.putImageData(imgData, 0, 0);
    }

    updateConfig(config) {
        this.currentConfig = { ...this.currentConfig, ...config };
        requestAnimationFrame(() => this.applyProcessing());
    }

    applyProcessing() {
        if (!this.baseImageData) return;
        
        const imgData = new ImageData(
            new Uint8ClampedArray(this.baseImageData.data),
            this.baseImageData.width,
            this.baseImageData.height
        );
        
        const data = imgData.data;
        const { contrast, threshold, denoise } = this.currentConfig;
        
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i+1], b = data[i+2];
            let gray = 0.299*r + 0.587*g + 0.114*b;
            
            if (denoise) {
                gray = gray > 128 ? Math.max(128, gray - 20) : Math.min(128, gray + 20);
            }
            
            gray = factor * (gray - 128) + 128;
            let val = gray >= threshold ? 255 : 0;
            
            data[i] = data[i+1] = data[i+2] = val;
            data[i+3] = 255;
        }
        
        this.ctx.putImageData(imgData, 0, 0);
        this.calculateOCR();
    }

    calculateOCR() {
        if (!this.captureType) return;
        let score = 96;
        
        const { contrastRange, thresholdRange, requiresDenoise, maxConfidence } = this.captureType;
        const { contrast, threshold, denoise } = this.currentConfig;
        
        let distC = 0;
        if (contrast < contrastRange[0]) distC = contrastRange[0] - contrast;
        if (contrast > contrastRange[1]) distC = contrast - contrastRange[1];
        score -= Math.min(45, distC * 1.2);
        
        let distT = 0;
        if (threshold < thresholdRange[0]) distT = thresholdRange[0] - threshold;
        if (threshold > thresholdRange[1]) distT = threshold - thresholdRange[1];
        score -= Math.min(50, distT * 0.6);
        
        if (requiresDenoise && !denoise) {
            score -= 15;
        }
        
        score = Math.max(0, Math.min(score, maxConfidence));
        
        if (this.onOCRUpdate) {
            this.onOCRUpdate(score, this.garbleText(score));
        }
    }

    garbleText(score) {
        if (score >= 90) return this.plateText;
        const chars = this.plateText.split('');
        const confusables = {'0':'O', 'O':'0', '1':'I', 'I':'1', '8':'B', 'B':'8', '5':'S', 'S':'5', '2':'Z', 'Z':'2'};
        
        let errChance = (90 - score) / 100; 
        
        for (let i = 0; i < chars.length; i++) {
            if (Math.random() < errChance) {
                if (confusables[chars[i]]) {
                    chars[i] = confusables[chars[i]];
                } else {
                    chars[i] = '#'; 
                }
            }
        }
        return chars.join('');
    }
}
window.PlateCanvas = PlateCanvas;
