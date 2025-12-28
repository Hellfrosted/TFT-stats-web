/**
 * TFT Augment Stats - Icon Recognizer Module
 * Extracts and matches augment icons from screenshot left panel
 */
export class Recognizer {
    constructor() {
        this.referenceIcons = JSON.parse(localStorage.getItem('tft_augment_icons')) || {};
    }

    async extractAugmentIcons(imageFile, slotCount = 3) {
        // Left panel augment slot positions (percentage-based for resolution independence)
        const slotPositions = [
            { x: 0.05, y: 0.30 },
            { x: 0.05, y: 0.38 },
            { x: 0.05, y: 0.46 },
            { x: 0.05, y: 0.54 },
            { x: 0.05, y: 0.62 }
        ];

        const icons = [];
        for (let i = 0; i < slotCount; i++) {
            const iconData = await this.cropIcon(imageFile, slotPositions[i]);
            const match = this.findMatch(iconData);
            icons.push(match || { id: 'unknown', icon: iconData });
        }
        return icons;
    }

    async cropIcon(file, pos) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = img.width * 0.03;
                canvas.width = 64;
                canvas.height = 64;

                ctx.drawImage(img,
                    pos.x * img.width - size / 2, 
                    pos.y * img.height - size / 2, 
                    size, size,
                    0, 0, 64, 64
                );
                
                // Clean up object URL
                URL.revokeObjectURL(img.src);
                resolve(canvas.toDataURL());
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    findMatch(iconData) {
        for (const [name, refData] of Object.entries(this.referenceIcons)) {
            if (this.isSimilar(iconData, refData)) {
                return { name, icon: refData };
            }
        }
        return null;
    }

    isSimilar(d1, d2) {
        // Basic string comparison - could be enhanced with image hashing
        return d1.length === d2.length && d1.substring(0, 100) === d2.substring(0, 100);
    }

    saveReference(name, iconData) {
        this.referenceIcons[name] = iconData;
        localStorage.setItem('tft_augment_icons', JSON.stringify(this.referenceIcons));
    }
}
