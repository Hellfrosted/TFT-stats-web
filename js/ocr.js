/**
 * TFT Augment Stats - OCR Module
 * Handles Tesseract.js integration for reading stage numbers from screenshots
 */
export class OCR {
    constructor() {
        this.worker = null;
    }

    async init() {
        if (this.worker) return;
        this.worker = await Tesseract.createWorker('eng');
    }

    async recognizeStage(imageFile) {
        await this.init();
        const img = await this.loadImage(imageFile);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Stage region: top-center (calibrated for standard TFT UI)
        const w = img.width * 0.15;
        const h = img.height * 0.05;
        const x = img.width * 0.425;
        const y = img.height * 0.01;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

        const { data: { text } } = await this.worker.recognize(canvas);
        
        // Clean up the object URL to prevent memory leaks
        URL.revokeObjectURL(img.src);
        
        return text.trim().match(/\d-\d/)?.[0] || null;
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}
