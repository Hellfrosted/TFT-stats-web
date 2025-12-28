import { Processor } from './processor.js';
import { Database } from './database.js';

class App {
    constructor() {
        this.processor = new Processor();
        this.database = new Database();

        this.initEventListeners();
        this.updateDashboard();
    }

    initEventListeners() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            this.handleFileUpload(files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        document.getElementById('db-selector').addEventListener('change', (e) => {
            this.updateDashboard(e.target.value);
        });

        document.getElementById('btn-export').addEventListener('click', () => {
            const dbType = document.getElementById('db-selector').value;
            this.database.exportCSV(dbType);
        });
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const processingBar = document.getElementById('processing-status');
        processingBar.classList.remove('hidden');

        try {
            this.pendingSessions = await this.processor.processFiles(files, (progress) => {
                this.updateProgressBar(progress);
            });
            this.renderSessionReview();
        } catch (error) {
            console.error('Processing failed:', error);
            alert('Error processing files. See console for details.');
        } finally {
            processingBar.classList.add('hidden');
        }
    }

    renderSessionReview() {
        const reviewSection = document.getElementById('session-review');
        const sessionList = document.getElementById('session-list');
        const statsDashboard = document.getElementById('stats-dashboard');

        reviewSection.classList.remove('hidden');
        statsDashboard.classList.add('hidden');

        sessionList.innerHTML = this.pendingSessions.map((session, index) => `
            <div class="session-card" data-index="${index}">
                <div class="session-info">
                    <h4>Game ${index + 1} (${session.type.toUpperCase()})</h4>
                    <p>${new Date(session.startTime).toLocaleString()}</p>
                    <p>${session.screenshots.length} Screenshots</p>
                </div>
                <div class="augments-list">
                    <h5>Augments:</h5>
                    <div class="augment-icons">
                        ${session.augments.map((aug, i) => `
                            <div class="augment-item">
                                <span class="aug-name">${aug}</span>
                                ${aug === 'Unknown Augment' ? `
                                    <input type="text" placeholder="Enter Name" 
                                           onchange="window.app.nameAugment(${index}, ${i}, this.value)">
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="placement-input">
                    <label>Placement:</label>
                    <input type="number" min="1" max="8" value="${session.placement}" 
                           onchange="window.app.updateSessionPlacement(${index}, this.value)">
                </div>
            </div>
        `).join('');

        document.getElementById('btn-save-sessions').onclick = () => this.saveSessions();
    }

    updateSessionPlacement(index, value) {
        this.pendingSessions[index].placement = parseInt(value);
    }

    nameAugment(sessionIndex, augIndex, name) {
        const session = this.pendingSessions[sessionIndex];
        session.augments[augIndex] = name;

        // Save to reference database (icons are stored in the session/recognizer objects)
        // Note: For now we'll just name it in the session
        // A more advanced version would use the icon data from recognizer.js
        console.log(`Named augment ${augIndex} in session ${sessionIndex}: ${name}`);
    }

    saveSessions() {
        this.pendingSessions.forEach(session => {
            this.database.addGame({
                date: session.startTime,
                placement: session.placement,
                augments: session.augments,
                group: session.group
            }, session.type);
        });

        document.getElementById('session-review').classList.add('hidden');
        document.getElementById('stats-dashboard').classList.remove('hidden');
        this.updateDashboard();
        this.pendingSessions = [];
    }

    updateProgressBar(progress) {
        const fill = document.getElementById('progress-fill');
        const text = document.getElementById('progress-percent');
        fill.style.width = `${progress}%`;
        text.textContent = `${Math.round(progress)}%`;
    }

    updateDashboard(dbType = 'live') {
        const stats = this.database.getStats(dbType);
        this.renderStats(stats);
    }

    renderStats(stats) {
        // Implementation for rendering stats into the table and summary items
        const statsBody = document.getElementById('stats-body');
        if (!stats || stats.length === 0) {
            statsBody.innerHTML = '<tr class="empty-row"><td colspan="5">No data available for the selected period</td></tr>';
            return;
        }

        statsBody.innerHTML = stats.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.count}</td>
                <td>${item.avgPlace.toFixed(2)}</td>
                <td>${(item.winRate * 100).toFixed(1)}%</td>
                <td>${(item.pickRate * 100).toFixed(1)}%</td>
            </tr>
        `).join('');

        // Update summary cards
        document.getElementById('stat-total-games').textContent = this.database.getTotalGames();
        document.getElementById('stat-avg-place').textContent = this.database.getOverallAvgPlace().toFixed(2);
        document.getElementById('stat-win-rate').textContent = `${(this.database.getOverallWinRate() * 100).toFixed(1)}%`;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
