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

        // Stage region: top-center
        const w = img.width * 0.15;
        const h = img.height * 0.05;
        const x = img.width * 0.425;
        const y = img.height * 0.01;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

        const { data: { text } } = await this.worker.recognize(canvas);
        return text.trim().match(/\d-\d/)?.[0] || null;
    }

    loadImage(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
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
