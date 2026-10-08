class Station {
    constructor(container, config) {
        this.container = container;
        this.config = config;
        
        this.score = 0;
        this.timeRemaining = config.timeLimitSec || 720;
        this.timerInterval = null;
        this.currentModule = 'A';
        this.questions = this.pickQuestions();
        this.currentQuestionIndex = 0;
        
        this.plateCanvas = null;
        this.ocrScore = 0;
        
        this.buildUI();
        this.startTimer();
        this.renderCurrentQuestion();
    }
    
    pickQuestions() {
        const getMod = (mod, count) => window.QUESTIONS.filter(q => q.module === mod).sort(() => 0.5 - Math.random()).slice(0, count);
        return [...getMod('A', 2), ...getMod('B', 2), ...getMod('C', 3)];
    }

    buildUI() {
        this.container.innerHTML = `
            <div class="header">
                <div>Team: ${this.config.teamId} | Score: <span id="score-display">0</span></div>
                <div class="timer" id="timer-display">12:00</div>
                <div id="module-display">Module A</div>
            </div>
            
            <div class="ocr-panel hidden" id="ocr-panel">
                <div>OCR Confidence:</div>
                <div class="gauge"><div class="gauge-fill" id="ocr-gauge-fill"></div></div>
                <div class="readout" id="ocr-readout">--</div>
            </div>
            
            <div class="content" id="content-area"></div>
        `;
        
        this.contentArea = this.container.querySelector('#content-area');
        this.scoreDisplay = this.container.querySelector('#score-display');
        this.timerDisplay = this.container.querySelector('#timer-display');
        this.moduleDisplay = this.container.querySelector('#module-display');
        
        this.ocrPanel = this.container.querySelector('#ocr-panel');
        this.ocrGaugeFill = this.container.querySelector('#ocr-gauge-fill');
        this.ocrReadout = this.container.querySelector('#ocr-readout');
    }

    startTimer() {
        this.updateTimerUI();
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerUI();
            
            if (this.config.onProgress) {
                this.config.onProgress(this.score, this.currentModule);
            }
            
            if (this.timeRemaining <= 0) {
                this.finishStation();
            }
        }, 1000);
    }
    
    updateTimerUI() {
        const m = Math.floor(Math.max(0, this.timeRemaining) / 60).toString().padStart(2, '0');
        const s = (Math.max(0, this.timeRemaining) % 60).toString().padStart(2, '0');
        this.timerDisplay.innerText = `${m}:${s}`;
    }

    renderCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            return this.finishStation(true);
        }
        
        const q = this.questions[this.currentQuestionIndex];
        this.currentModule = q.module;
        this.moduleDisplay.innerText = `Module ${q.module} (${this.currentQuestionIndex + 1}/${this.questions.length})`;
        
        this.contentArea.innerHTML = '';
        this.ocrPanel.classList.add('hidden');
        
        if (q.module === 'A') this.renderModuleA(q);
        if (q.module === 'B') this.renderModuleB(q);
        if (q.module === 'C') this.renderModuleC(q);
    }

    renderModuleA(q) {
        const div = document.createElement('div');
        div.className = 'question-card';
        div.innerHTML = `<h3>${q.text}</h3><div class="options-grid"></div>`;
        
        const grid = div.querySelector('.options-grid');
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.onclick = () => this.handleAnswerA(opt === q.correct, btn);
            grid.appendChild(btn);
        });
        this.contentArea.appendChild(div);
    }
    
    handleAnswerA(isCorrect, btnElement) {
        if (isCorrect) {
            this.addScore(5);
            this.nextQuestion();
        } else {
            this.addScore(-2);
            btnElement.style.background = 'var(--danger)';
            btnElement.disabled = true;
        }
    }

    renderModuleB(q) {
        this.ocrPanel.classList.remove('hidden');
        
        const html = `
            <div class="image-workspace">
                <div class="canvas-container" id="canvas-host"></div>
                <div class="controls">
                    <div class="control-group">
                        <label>Diagnosis 
                            <select id="fault-select">
                                <option value="">--Select Fault--</option>
                                ${q.faultOptions.map(f => `<option value="${f}">${f}</option>`).join('')}
                            </select>
                        </label>
                    </div>
                    <div class="control-group">
                        <label>Contrast <span id="val-contrast">50</span></label>
                        <input type="range" id="slider-contrast" min="0" max="100" value="50">
                    </div>
                    <div class="control-group">
                        <label>Threshold <span id="val-threshold">128</span></label>
                        <input type="range" id="slider-threshold" min="0" max="255" value="128">
                    </div>
                    <div class="control-group">
                        <label><input type="checkbox" id="toggle-denoise"> Enable Denoise</label>
                    </div>
                    <button class="primary" id="btn-submit-b" style="margin-top:auto">Submit & Verify</button>
                </div>
            </div>
        `;
        this.contentArea.innerHTML = html;
        
        this.setupCanvas(q);
        
        const faultSelect = document.getElementById('fault-select');
        let diagnosisScoreAwarded = false;
        
        document.getElementById('btn-submit-b').onclick = () => {
            if (faultSelect.value !== q.correctFault) {
                this.addScore(-2);
                alert("Incorrect diagnosis.");
                return;
            } else if (!diagnosisScoreAwarded) {
                this.addScore(5);
                diagnosisScoreAwarded = true;
                faultSelect.disabled = true;
            }
            
            if (this.ocrScore >= 90) {
                this.addScore(10);
                this.nextQuestion();
            } else {
                this.addScore(-2);
                alert("Image tuning is insufficient. OCR confidence must be >= 90.");
            }
        };
    }

    setupCanvas(q) {
        this.plateCanvas = new window.PlateCanvas(document.getElementById('canvas-host'));
        
        this.plateCanvas.onOCRUpdate = (score, text) => {
            this.ocrScore = score;
            this.ocrGaugeFill.style.width = `${score}%`;
            this.ocrGaugeFill.style.background = score >= 90 ? 'var(--success)' : (score >= 75 ? 'orange' : 'var(--danger)');
            this.ocrReadout.innerText = text;
        };
        
        this.plateCanvas.loadPlate(q.plateText, q.captureType);
        
        const bindSlider = (id, key) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(`val-${key}`);
            el.oninput = (e) => {
                const val = parseInt(e.target.value);
                if (valEl) valEl.innerText = val;
                this.plateCanvas.updateConfig({ [key]: val });
            };
        };
        
        bindSlider('slider-contrast', 'contrast');
        bindSlider('slider-threshold', 'threshold');
        
        const denoise = document.getElementById('toggle-denoise');
        denoise.onchange = (e) => this.plateCanvas.updateConfig({ denoise: e.target.checked });
    }

    renderModuleC(q) {
        this.ocrPanel.classList.remove('hidden');
        
        const html = `
            <div class="image-workspace" style="height: 250px;">
                <div class="canvas-container" id="canvas-host"></div>
                <div class="controls" style="width: 300px; justify-content: center;">
                    <div class="control-group">
                        <label>Contrast</label><input type="range" id="slider-contrast" min="0" max="100" value="50">
                    </div>
                    <div class="control-group">
                        <label>Threshold</label><input type="range" id="slider-threshold" min="0" max="255" value="128">
                    </div>
                    <div class="control-group" style="margin-top: 10px;">
                        <label><input type="checkbox" id="toggle-denoise"> Enable Denoise</label>
                    </div>
                </div>
            </div>
            
            <div class="question-card" style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 250px; background: #222; padding: 15px; border-radius: 4px;">
                    <h4 style="margin-top:0;">Radar Data</h4>
                    <p>Distance: <strong>${q.distance} m</strong></p>
                    <p>Time: <strong>${q.time} s</strong></p>
                    <p>Second Camera Match: <strong style="color:${q.secondCameraMatches ? 'var(--success)' : 'var(--danger)'}">${q.secondCameraMatches ? 'YES' : 'NO'}</strong></p>
                </div>
                <div style="flex: 2; min-width: 300px; display: flex; flex-direction: column; gap: 10px;">
                    <select id="sel-zone"><option value="">Select Zone</option>${Object.keys(window.ZONES).map(z => `<option value="${z}">${z} (${window.ZONES[z].limit} km/h)</option>`).join('')}</select>
                    <select id="sel-level"><option value="">Officer Level</option><option value="1">L1 (Slabs A-B)</option><option value="2">L2 (Slabs A-C)</option><option value="3">L3 (All)</option></select>
                    <label><input type="checkbox" id="chk-exempt"> Emergency Exemption (EX-1)</label>
                    <input type="text" id="inp-passcode" placeholder="Enter Passcode (e.g. UA211) or EX-1" style="padding:8px; border-radius:4px; border:1px solid #555; background:#111; color:white;">
                    <button class="primary" id="btn-submit-c">Issue Challan / Exempt</button>
                </div>
            </div>
        `;
        this.contentArea.innerHTML = html;
        this.setupCanvas(q);
        
        document.getElementById('btn-submit-c').onclick = () => this.verifyModuleC(q);
    }
    
    verifyModuleC(q) {
        const zoneInput = document.getElementById('sel-zone').value;
        const levelInput = document.getElementById('sel-level').value;
        const exemptInput = document.getElementById('chk-exempt').checked;
        const passcodeInput = document.getElementById('inp-passcode').value.trim().toUpperCase();
        
        // 1. Calculate Fine
        const speed = (q.distance / q.time) * 3.6;
        const effective = speed - 5;
        const limit = window.ZONES[q.zone].limit;
        const excess = effective - limit;
        
        let requiredSlab = null;
        if (excess > 0) {
            requiredSlab = window.SLABS.find(s => excess <= s.max);
        }
        
        // Exemption override
        if (q.beacon) {
            if (!exemptInput || passcodeInput !== 'EX-1') {
                this.addScore(-2);
                alert("Incorrect. Ambulance with beacon ON is exempt (Code: EX-1).");
                return;
            } else {
                this.addScore(20);
                return this.nextQuestion();
            }
        } else if (exemptInput) {
            this.addScore(-2);
            alert("No exemption applies for this vehicle.");
            return;
        }
        
        if (excess <= 0) {
            alert("No fine required. Proceeding...");
            this.addScore(20);
            return this.nextQuestion();
        }
        
        if (zoneInput !== q.zone) {
            this.addScore(-2);
            alert("Incorrect Zone Selected.");
            return;
        }
        
        const officerLvl = parseInt(q.level.replace('L',''));
        if (parseInt(levelInput) !== officerLvl) {
            this.addScore(-2);
            alert("Incorrect Officer Level Selected.");
            return;
        }
        
        // Check Passcode
        const last2 = q.plateText.slice(-2);
        const expectedPasscode = `${window.ZONES[q.zone].letter}${requiredSlab.letter}${last2}${officerLvl}`;
        
        if (passcodeInput !== expectedPasscode) {
            this.addScore(-2);
            alert(`Incorrect Passcode.`);
            return;
        }
        
        // Check OCR rules
        if (this.ocrScore < 75) {
            this.addScore(-2);
            alert("OCR Confidence too low (<75). You must re-tune the image to at least 75.");
            return;
        }
        
        if (this.ocrScore < 90) {
            // 75-89 manual bypass allowed IF valid format, second camera matches, and L2/L3 passcode
            const plateRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
            const isValidFormat = plateRegex.test(q.plateText);
            
            if (!isValidFormat) {
                this.addScore(-2);
                alert("Bypass denied. Plate format is invalid.");
                return;
            }
            if (!q.secondCameraMatches) {
                this.addScore(-2);
                alert("Bypass denied. Second camera angle does not match.");
                return;
            }
            if (officerLvl < 2) {
                this.addScore(-2);
                alert("Bypass denied. Requires L2/L3 authority for manual bypass.");
                return;
            }
        }
        
        this.addScore(20);
        this.nextQuestion();
    }

    addScore(pts) {
        this.score += pts;
        this.scoreDisplay.innerText = this.score;
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.renderCurrentQuestion();
    }

    finishStation(completedAll = false) {
        clearInterval(this.timerInterval);
        
        if (completedAll) {
            const timeBonus = Math.floor(Math.max(0, this.timeRemaining) * 0.5);
            this.score += timeBonus;
        }
        
        this.container.innerHTML = `
            <div class="header">
                <div>Team: ${this.config.teamId}</div>
                <div>Status: Complete</div>
            </div>
            <div class="content" style="align-items:center; justify-content:center; text-align:center;">
                <h2>Station Complete</h2>
                <p>Final Score: <strong style="font-size:24px; color:var(--accent);">${this.score}</strong></p>
                <p>Time Remaining: ${Math.max(0, this.timeRemaining)}s</p>
                <p>The results have been submitted to the Tech Head.</p>
            </div>
        `;
        
        if (this.config.onComplete) {
            this.config.onComplete({
                teamId: this.config.teamId,
                score: this.score,
                timeRemainingSec: Math.max(0, this.timeRemaining),
                completed: completedAll
            });
        }
    }
}
window.Station = Station;
