export class Recognizer {
    constructor() {
        this.referenceIcons = JSON.parse(localStorage.getItem('tft_augment_icons')) || {};
    }

    async extractAugmentIcons(imageFile, slotCount = 3) {
        // Left panel augment slots locations (approximate percentages)
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
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = img.width * 0.03; // Approx icon size
                canvas.width = 64;
                canvas.height = 64;

                ctx.drawImage(img,
                    pos.x * img.width - size / 2, pos.y * img.height - size / 2, size, size,
                    0, 0, 64, 64
                );
                resolve(canvas.toDataURL());
            };
            img.src = URL.createObjectURL(file);
        });
    }

    findMatch(iconData) {
        const refs = Object.entries(this.referenceIcons);
        for (const [name, refData] of refs) {
            if (this.isSimilar(iconData, refData)) {
                return { name, icon: refData };
            }
        }
        return null;
    }

    isSimilar(d1, d2) {
        // Very basic comparison for now - would benefit from more robust CV in future
        return d1.length === d2.length && d1.substring(0, 100) === d2.substring(0, 100);
    }

    saveReference(name, iconData) {
        this.referenceIcons[name] = iconData;
        localStorage.setItem('tft_augment_icons', JSON.stringify(this.referenceIcons));
    }
}
