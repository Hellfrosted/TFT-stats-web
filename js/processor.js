import { OCR } from './ocr.js';
import { Recognizer } from './recognizer.js';

export class Processor {
    constructor() {
        this.ocr = new OCR();
        this.recognizer = new Recognizer();
    }

    async processFiles(files, onProgress) {
        const fileList = Array.from(files);
        fileList.sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0));

        const games = this.identifyGames(fileList);
        const processedGames = [];

        for (let i = 0; i < games.length; i++) {
            const gameType = games[i][0].name.toLowerCase().includes('pbe') ? 'pbe' : 'live';
            const session = {
                id: `game_${Date.now()}_${i}`,
                type: gameType,
                startTime: games[i][0].lastModified,
                screenshots: games[i],
                placement: 4, // Default placement
                augments: [],
                group: this.getGroup(games[i][0].lastModified, gameType)
            };

            // Extract augments from screenshots in the session
            for (const screenshot of session.screenshots) {
                const stage = await this.ocr.recognizeStage(screenshot);
                if (stage === '4-3' || stage === '4-5' || stage === '5-1') {
                    const icons = await this.recognizer.extractAugmentIcons(screenshot);
                    // Update session augments if we found new ones
                    session.augments = icons.map(ic => ic.name || 'Unknown Augment');
                }
            }

            processedGames.push(session);

            onProgress(((i + 1) / games.length) * 100);
        }

        return processedGames;
    }

    getGroup(timestamp, type) {
        const date = new Date(timestamp);
        if (type === 'pbe') {
            // Group by day, split at noon
            const isAfterNoon = date.getHours() >= 12;
            const groupDate = new Date(date);
            if (!isAfterNoon) groupDate.setDate(date.getDate() - 1);
            groupDate.setHours(12, 0, 0, 0);
            return `PBE_${groupDate.toISOString().split('T')[0]}`;
        } else {
            // Group by 2-week Tuesday start
            // Set a reference Tuesday (e.g., Dec 24, 2024 is a Tuesday)
            const refTuesday = new Date('2024-12-24T00:00:00Z');
            const diffMs = date - refTuesday;
            const diffWeeks = Math.floor(diffMs / (14 * 24 * 60 * 60 * 1000));
            const groupStart = new Date(refTuesday.getTime() + diffWeeks * 14 * 24 * 60 * 60 * 1000);
            return `Live_${groupStart.toISOString().split('T')[0]}`;
        }
    }

    identifyGames(fileList) {
        const games = [];
        let currentGame = [];
        const GAP_THRESHOLD = 3 * 60 * 1000; // 3 minutes

        fileList.forEach((file, index) => {
            if (currentGame.length === 0) {
                currentGame.push(file);
            } else {
                const prevFile = currentGame[currentGame.length - 1];
                const timeDiff = file.lastModified - prevFile.lastModified;

                if (timeDiff > GAP_THRESHOLD) {
                    games.push(currentGame);
                    currentGame = [file];
                } else {
                    currentGame.push(file);
                }
            }
        });

        if (currentGame.length > 0) games.push(currentGame);
        return games;
    }
}
