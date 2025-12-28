/**
 * TFT Augment Stats - Processor Module
 * Handles batch file processing, game identification, and grouping logic
 */
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
        const totalFiles = fileList.length;
        let filesProcessed = 0;

        for (let i = 0; i < games.length; i++) {
            const gameFiles = games[i];
            const gameType = gameFiles[0].name.toLowerCase().includes('pbe') ? 'pbe' : 'live';
            
            const session = {
                id: `game_${Date.now()}_${i}`,
                type: gameType,
                startTime: gameFiles[0].lastModified,
                screenshots: gameFiles,
                placement: 4,
                augments: [],
                group: this.getGroup(gameFiles[0].lastModified, gameType)
            };

            for (const screenshot of session.screenshots) {
                filesProcessed++;
                onProgress({
                    current: filesProcessed,
                    total: totalFiles,
                    percent: (filesProcessed / totalFiles) * 100,
                    stage: `Processing game ${i + 1}/${games.length}`,
                    file: screenshot.name
                });

                const stage = await this.ocr.recognizeStage(screenshot);
                if (['4-3', '4-5', '5-1'].includes(stage)) {
                    const icons = await this.recognizer.extractAugmentIcons(screenshot);
                    session.augments = icons.map(ic => ic.name || 'Unknown Augment');
                }
            }

            processedGames.push(session);
        }

        return processedGames;
    }

    getGroup(timestamp, type) {
        const date = new Date(timestamp);
        
        if (type === 'pbe') {
            // PBE: Group by day, split at noon
            const groupDate = new Date(date);
            if (date.getHours() < 12) {
                groupDate.setDate(date.getDate() - 1);
            }
            groupDate.setHours(12, 0, 0, 0);
            return `PBE_${groupDate.toISOString().split('T')[0]}`;
        }
        
        // Live: Group by 2-week periods starting on Tuesday
        const refTuesday = new Date('2024-12-24T00:00:00Z');
        const diffMs = date - refTuesday;
        const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
        const periods = Math.floor(diffMs / twoWeeksMs);
        const groupStart = new Date(refTuesday.getTime() + periods * twoWeeksMs);
        return `Live_${groupStart.toISOString().split('T')[0]}`;
    }

    identifyGames(fileList) {
        const games = [];
        let currentGame = [];
        const GAP_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

        for (const file of fileList) {
            if (currentGame.length === 0) {
                currentGame.push(file);
                continue;
            }

            const prevFile = currentGame[currentGame.length - 1];
            const timeDiff = file.lastModified - prevFile.lastModified;

            if (timeDiff > GAP_THRESHOLD_MS) {
                games.push(currentGame);
                currentGame = [file];
            } else {
                currentGame.push(file);
            }
        }

        if (currentGame.length > 0) {
            games.push(currentGame);
        }
        
        return games;
    }
}
