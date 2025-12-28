/**
 * TFT Augment Stats - Database Module
 * Handles localStorage persistence for game stats and augment data
 */
export class Database {
    constructor() {
        this.data = JSON.parse(localStorage.getItem('tft_stats_data')) || {
            live: [],
            pbe: []
        };
    }

    save() {
        localStorage.setItem('tft_stats_data', JSON.stringify(this.data));
    }

    addGame(game, type = 'live') {
        this.data[type].push(game);
        this.save();
    }

    getStats(type = 'live') {
        const games = this.data[type];
        const augmentStats = {};

        games.forEach(game => {
            game.augments.forEach(aug => {
                if (!augmentStats[aug]) {
                    augmentStats[aug] = { name: aug, count: 0, totalPlace: 0, wins: 0 };
                }
                augmentStats[aug].count++;
                augmentStats[aug].totalPlace += game.placement;
                if (game.placement === 1) augmentStats[aug].wins++;
            });
        });

        return Object.values(augmentStats).map(stat => ({
            ...stat,
            avgPlace: stat.count > 0 ? stat.totalPlace / stat.count : 0,
            winRate: stat.count > 0 ? stat.wins / stat.count : 0,
            pickRate: games.length > 0 ? stat.count / games.length : 0
        }));
    }

    getTotalGames(type = 'live') {
        return this.data[type].length;
    }

    getOverallAvgPlace(type = 'live') {
        const games = this.data[type];
        if (games.length === 0) return 0;
        return games.reduce((acc, g) => acc + g.placement, 0) / games.length;
    }

    getOverallWinRate(type = 'live') {
        const games = this.data[type];
        if (games.length === 0) return 0;
        return games.filter(g => g.placement === 1).length / games.length;
    }

    exportCSV(type = 'live') {
        const stats = this.getStats(type);
        if (stats.length === 0) {
            alert('No data to export.');
            return;
        }

        const headers = ['Augment', 'Games', 'Avg Placement', 'Win Rate', 'Pick Rate'];
        const rows = stats.map(s => [
            s.name,
            s.count,
            s.avgPlace.toFixed(2),
            (s.winRate * 100).toFixed(1) + '%',
            (s.pickRate * 100).toFixed(1) + '%'
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tft_augment_stats_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
