/**
 * TFT Augment Stats - Main Application
 * Orchestrates the UI, file processing, and data management
 */
import { Processor } from './processor.js';
import { Database } from './database.js';

class App {
    constructor() {
        this.processor = new Processor();
        this.database = new Database();
        this.pendingSessions = [];
        
        this.initEventListeners();
        this.updateDashboard();
    }

    initEventListeners() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        // File upload handlers
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', e => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            this.handleFileUpload(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', e => this.handleFileUpload(e.target.files));

        // Dashboard controls
        document.getElementById('db-selector').addEventListener('change', e => {
            this.updateDashboard(e.target.value);
        });
        document.getElementById('btn-export').addEventListener('click', () => {
            this.database.exportCSV(document.getElementById('db-selector').value);
        });

        // Navigation
        document.getElementById('btn-dashboard').addEventListener('click', () => this.showSection('dashboard'));
        document.getElementById('btn-history').addEventListener('click', () => this.showSection('history'));
        document.getElementById('btn-database').addEventListener('click', () => this.showSection('database'));
        document.getElementById('btn-settings').addEventListener('click', () => this.showSection('settings'));

        // Settings actions
        document.getElementById('btn-clear-all-data')?.addEventListener('click', () => {
            if (confirm('Are you sure? This will delete ALL your stats data.')) {
                localStorage.clear();
                location.reload();
            }
        });
        document.getElementById('btn-clear-augments')?.addEventListener('click', () => {
            if (confirm('Clear all learned augment icons?')) {
                localStorage.removeItem('tft_augment_icons');
                this.showSection('database');
            }
        });

        // Augment DB import/export
        document.getElementById('btn-export-augments')?.addEventListener('click', () => this.exportAugmentDB());
        document.getElementById('btn-import-augments')?.addEventListener('click', () => {
            document.getElementById('import-augments-input').click();
        });
        document.getElementById('import-augments-input')?.addEventListener('change', e => {
            this.importAugmentDB(e.target.files[0]);
        });
    }

    exportAugmentDB() {
        const icons = localStorage.getItem('tft_augment_icons') || '{}';
        const blob = new Blob([icons], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tft_augment_db_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importAugmentDB(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                const count = Object.keys(data).length;
                if (confirm(`Import ${count} augments? This will merge with your existing database.`)) {
                    const existing = JSON.parse(localStorage.getItem('tft_augment_icons') || '{}');
                    const merged = { ...existing, ...data };
                    localStorage.setItem('tft_augment_icons', JSON.stringify(merged));
                    alert(`Successfully imported ${count} augments!`);
                    this.showSection('database');
                }
            } catch (err) {
                alert('Invalid file format. Please select a valid augment database JSON file.');
            }
        };
        reader.readAsText(file);
    }

    removeSession(index) {
        this.pendingSessions.splice(index, 1);
        this.renderSessionReview();
    }

    showSection(section) {
        const sections = ['stats-dashboard', 'game-history', 'augment-db', 'settings-section'];
        const buttons = ['btn-dashboard', 'btn-history', 'btn-database', 'btn-settings'];
        
        sections.forEach(id => document.getElementById(id).classList.add('hidden'));
        buttons.forEach(id => document.getElementById(id).classList.remove('active'));

        const sectionMap = {
            dashboard: { section: 'stats-dashboard', btn: 'btn-dashboard' },
            history: { section: 'game-history', btn: 'btn-history', render: () => this.renderHistory() },
            database: { section: 'augment-db', btn: 'btn-database', render: () => this.renderAugmentDB() },
            settings: { section: 'settings-section', btn: 'btn-settings' }
        };

        const config = sectionMap[section];
        document.getElementById(config.section).classList.remove('hidden');
        document.getElementById(config.btn).classList.add('active');
        config.render?.();
    }

    renderHistory() {
        const historyList = document.getElementById('history-list');
        const games = [...this.database.data.live, ...this.database.data.pbe]
            .sort((a, b) => b.date - a.date);

        if (games.length === 0) {
            historyList.innerHTML = '<p class="empty-message">No games recorded yet.</p>';
            return;
        }

        historyList.innerHTML = games.map(game => `
            <div class="history-card">
                <div class="history-info">
                    <span class="placement">#${game.placement}</span>
                    <span class="date">${new Date(game.date).toLocaleDateString()}</span>
                </div>
                <div class="augments">${game.augments.join(', ') || 'No augments'}</div>
            </div>
        `).join('');
    }

    renderAugmentDB() {
        const dbList = document.getElementById('augment-db-list');
        const icons = JSON.parse(localStorage.getItem('tft_augment_icons')) || {};
        const names = Object.keys(icons);

        if (names.length === 0) {
            dbList.innerHTML = '<p class="empty-message">No augments learned yet.</p>';
            return;
        }

        dbList.innerHTML = names.map(name => `
            <div class="augment-db-item">
                <img src="${icons[name]}" alt="${name}" class="augment-icon">
                <span>${name}</span>
            </div>
        `).join('');
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const processingBar = document.getElementById('processing-status');
        processingBar.classList.remove('hidden');

        try {
            this.pendingSessions = await this.processor.processFiles(files, progress => {
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

        reviewSection.classList.remove('hidden');
        document.getElementById('stats-dashboard').classList.add('hidden');

        sessionList.innerHTML = this.pendingSessions.map((session, idx) => `
            <div class="session-card" data-index="${idx}">
                <div class="session-card-header">
                    <div class="session-info">
                        <h4>Game ${idx + 1} (${session.type.toUpperCase()})</h4>
                        <p>${new Date(session.startTime).toLocaleString()}</p>
                        <p>${session.screenshots.length} Screenshots</p>
                    </div>
                    <button class="remove-game-btn" onclick="window.app.removeSession(${idx})">✕ Remove</button>
                </div>
                <div class="augments-list">
                    <h5>Augments:</h5>
                    <div class="augment-icons">
                        ${session.augments.map((aug, i) => `
                            <div class="augment-item">
                                <span class="aug-name">${aug}</span>
                                ${aug === 'Unknown Augment' ? `
                                    <input type="text" placeholder="Enter Name" 
                                           onchange="window.app.nameAugment(${idx}, ${i}, this.value)">
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="placement-input">
                    <label>Placement:</label>
                    <input type="number" min="1" max="8" value="${session.placement}" 
                           onchange="window.app.updateSessionPlacement(${idx}, this.value)">
                </div>
            </div>
        `).join('');

        document.getElementById('btn-save-sessions').onclick = () => this.saveSessions();
    }

    updateSessionPlacement(index, value) {
        this.pendingSessions[index].placement = parseInt(value) || 4;
    }

    nameAugment(sessionIndex, augIndex, name) {
        this.pendingSessions[sessionIndex].augments[augIndex] = name;
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
        document.getElementById('progress-fill').style.width = `${progress.percent}%`;
        document.getElementById('progress-percent').textContent = `${Math.round(progress.percent)}%`;
        document.getElementById('progress-text').textContent = 
            `${progress.current}/${progress.total} files • ${progress.stage}`;
    }

    updateDashboard(dbType = 'live') {
        const stats = this.database.getStats(dbType);
        this.renderStats(stats, dbType);
    }

    renderStats(stats, dbType) {
        const statsBody = document.getElementById('stats-body');
        
        if (!stats || stats.length === 0) {
            statsBody.innerHTML = '<tr class="empty-row"><td colspan="5">No data available</td></tr>';
            document.getElementById('stat-total-games').textContent = '0';
            document.getElementById('stat-avg-place').textContent = '0.00';
            document.getElementById('stat-win-rate').textContent = '0%';
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

        document.getElementById('stat-total-games').textContent = this.database.getTotalGames(dbType);
        document.getElementById('stat-avg-place').textContent = this.database.getOverallAvgPlace(dbType).toFixed(2);
        document.getElementById('stat-win-rate').textContent = `${(this.database.getOverallWinRate(dbType) * 100).toFixed(1)}%`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
