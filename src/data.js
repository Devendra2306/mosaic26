window.CAPTURE_TYPES = {
    "N1": { name: "Dim Street", contrastRange: [60, 75], thresholdRange: [80, 110], requiresDenoise: false, maxConfidence: 96 },
    "N2": { name: "Headlight Glare", contrastRange: [35, 50], thresholdRange: [150, 180], requiresDenoise: false, maxConfidence: 96 },
    "N3": { name: "Rain Blur", contrastRange: [55, 65], thresholdRange: [100, 130], requiresDenoise: true, maxConfidence: 96 },
    "N4": { name: "Dirty Plate", contrastRange: [70, 85], thresholdRange: [70, 95], requiresDenoise: false, maxConfidence: 96 },
    "N5": { name: "Heavy Motion Blur", contrastRange: [55, 65], thresholdRange: [100, 130], requiresDenoise: true, maxConfidence: 84 }
};

window.QUESTIONS = [
    { id: "A1", module: "A", text: "What is the primary function of ANPR in this context?", options: ["Speed tracking", "Reading number plates", "Traffic light control", "Driver facial recognition"], correct: "Reading number plates" },
    { id: "A2", module: "A", text: "Which condition generally requires image denoising before thresholding?", options: ["Clear night", "Rain or heavy motion blur", "Overcast day", "Light wind"], correct: "Rain or heavy motion blur" },
    { id: "A3", module: "A", text: "What does 'threshold' adjust in plate processing?", options: ["Image brightness", "Binarization cutoff (black/white limit)", "Color saturation", "Camera focus"], correct: "Binarization cutoff (black/white limit)" },
    { id: "A4", module: "A", text: "How is radar effective speed calculated?", options: ["Distance / Time", "Distance * Time", "(Distance / Time) * 3.6 - 5", "Time / Distance"], correct: "(Distance / Time) * 3.6 - 5" },
    { id: "A5", module: "A", text: "Which scenario causes the highest glare on plates?", options: ["Dim street light", "Headlight glare", "Dirty plate", "Motion blur"], correct: "Headlight glare" },

    { id: "B1", module: "B", type: "diagnosis", captureType: "N1", plateText: "MH12AB4721", faultOptions: ["Dim Street", "Headlight Glare", "Motion Blur"], correctFault: "Dim Street" },
    { id: "B2", module: "B", type: "diagnosis", captureType: "N2", plateText: "GJ01XY9988", faultOptions: ["Rain Blur", "Headlight Glare", "Dirty Plate"], correctFault: "Headlight Glare" },
    { id: "B3", module: "B", type: "diagnosis", captureType: "N3", plateText: "KA05CD1234", faultOptions: ["Rain Blur", "Dim Street", "Motion Blur"], correctFault: "Rain Blur" },
    { id: "B4", module: "B", type: "diagnosis", captureType: "N4", plateText: "DL04ZA5678", faultOptions: ["Dirty Plate", "Heavy Motion Blur", "Headlight Glare"], correctFault: "Dirty Plate" },
    { id: "B5", module: "B", type: "diagnosis", captureType: "N5", plateText: "RJ14MN5566", faultOptions: ["Dim Street", "Heavy Motion Blur", "Rain Blur"], correctFault: "Heavy Motion Blur" },

    { id: "C1", module: "C", type: "protocol", captureType: "N1", plateText: "TN09FG3344", secondCameraMatches: true, distance: 100, time: 4.5, zone: "School", level: "L1", beacon: false },
    { id: "C2", module: "C", type: "protocol", captureType: "N2", plateText: "WB02XY8899", secondCameraMatches: true, distance: 200, time: 7.2, zone: "Highway", level: "L2", beacon: false },
    { id: "C3", module: "C", type: "protocol", captureType: "N3", plateText: "UP16KL1122", secondCameraMatches: true, distance: 150, time: 7.2, zone: "Urban", level: "L3", beacon: false },
    { id: "C4", module: "C", type: "protocol", captureType: "N4", plateText: "MH43ZZ9900", secondCameraMatches: true, distance: 120, time: 6.0, zone: "Residential", level: "L1", beacon: true },
    { id: "C5", module: "C", type: "protocol", captureType: "N5", plateText: "RJ1M5566", secondCameraMatches: false, distance: 300, time: 10.0, zone: "Highway", level: "L3", beacon: false }
];

window.ZONES = {
    "School": { limit: 30, letter: "S" },
    "Residential": { limit: 40, letter: "R" },
    "Urban": { limit: 60, letter: "U" },
    "Highway": { limit: 80, letter: "H" }
};

window.SLABS = [
    { max: 10, letter: "A", fine: 500 },
    { max: 20, letter: "B", fine: 1000 },
    { max: 30, letter: "C", fine: 2000 },
    { max: Infinity, letter: "D", fine: 4000 }
];
