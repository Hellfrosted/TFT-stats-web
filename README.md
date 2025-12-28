# 📊 TFT OCR Augment Stats Tool

A powerful, browser-based tool for tracking your personal Teamfight Tactics (TFT) augment statistics. Designed to be hostable on **GitHub Pages**, this tool processes your gameplay screenshots locally on your machine using OCR, ensuring complete privacy.

## ✨ Features

- **🚀 100% Client-Side**: No server required. Your screenshots and data stay on your computer.
- **📁 Batch Folder Processing**: Drag and drop an entire folder of screenshots.
- **🕒 Game Boundary Logic**: Automatically separates game sessions based on a 3-minute gap between screenshots.
- **🔍 Intelligent OCR**:
  - Automatically identifies game stages (4-3, 4-5, 5-1).
  - Extracts picked augment icons from the left-side panel.
- **🌍 PBE vs. Live Support**:
  - Automatically detects "PBE" in filenames.
  - Groups PBE data daily (split at noon).
  - Groups Live data in 2-week "patches" starting on Tuesdays.
- **📈 Advanced Stats**: Track Average Placement, Win Rate, and Pick Frequency per augment.
- **📥 CSV Export**: Export your data to Excel or Google Sheets for deeper analysis.

## 🛠️ Getting Started

### Hosting on GitHub Pages

1. Push this folder to a new repository on your GitHub account.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, set the source to `Deploy from a branch` and select `main` (or your default branch).
4. Your tool will be live at `https://your-username.github.io/your-repo-name/`.

### Local Usage

Simply open `index.html` in any modern web browser.

## 🕹️ How to Use

1. **Capture Screenshots**: During your games, take screenshots at stages **4-3, 4-5, or 5-1**.
2. **Upload**: Drag and drop your screenshot folder into the dashboard.
3. **Review**:
   - Confirm your **final placement** (1st-8th) for each detected game.
   - If an augment icon is new, the tool will ask you to name it. This saves it to your local database!
4. **Analyze**: View your personal stats in the sortable table.

## 🏗️ Project Structure

```
TFT stats/
├── index.html           # Main application interface
├── css/styles.css       # Premium dark theme
├── js/
│   ├── app.js           # Main orchestrator
│   ├── processor.js     # Handles game session logic
│   ├── ocr.js           # Tesseract.js wrapper
│   ├── recognizer.js    # Augment icon extraction
│   └── database.js      # LocalStorage manager
└── README.md
```

## 📝 Updating for New Sets

The tool is designed to be future-proof. When a new set releases, simply continue using the tool. As you "Name" unknown augments in the review screen, your personal database will grow with the new icons!

---

_Created for TFT enthusiasts who want better insights into their own gameplay._
