# Masan Consumer – Supply Chain Analysis

A static website that analyses the supply chain of **Masan Consumer Corporation (HOSE: MCH)**:
planning, sourcing, manufacturing, distribution and sales. It uses interactive charts and a navy and orange theme.
All charts and text blocks are generated from self-compiled CSV files in [`/data`](data).

## Sections
1. **Overview** – headline KPIs for FY2025
2. **Value chain** – interactive 6-stage flow (Plan → Source → Make → Deliver → Sell → Return)
3. **Performance** – quarterly revenue, revenue by category, gross margin (FY2024/FY2025 toggle)
4. **Distribution** – points of sale by channel, Retail Supreme (ASO) rollout, before/after Direct Coverage
5. **Manufacturing** – production hubs with region filter
6. **Risks** – likelihood × impact matrix linked to a ranked risk list
7. **Recommendations** – five prioritised actions
8. **Data & sources** – browse and download every CSV and see the source list

## Run locally
Browsers block `fetch()` of CSV files from `file://`, so serve the folder over HTTP:

```bash
# from the project folder
python -m http.server 8000
# open http://localhost:8000
```
Or double-click **`start.bat`** (Windows) or run **`./start.sh`** (macOS/Linux).
Chart.js is bundled in `/vendor`, so the site works offline. No login or build step is needed.

## Add the logo
Save the official logo as `assets/images/masan-consumer-logo.png`. Until then a text badge is shown.

## Publish on GitHub Pages (optional)
1. Create a repository and push this folder:
   ```bash
   git init
   git add .
   git commit -m "Masan Consumer supply chain analysis website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. In GitHub, go to **Settings → Pages → Source: Deploy from branch → main / (root)**.

## Project structure
```
├── index.html
├── css/style.css
├── js/
│   ├── csv.js          # tiny CSV parser/loader
│   └── main.js         # renders KPIs, charts, tables from CSV
├── data/               # self-compiled CSV datasets (edit these to update the site)
├── assets/images/      # logo + favicon
├── vendor/             # Chart.js 4 (MIT)
├── start.bat / start.sh
└── README.md
```

## Updating the data
Edit any CSV in `/data` and refresh the page. Inside a field, use `;` to separate list items.
Values marked **Derived** were back-calculated from reported growth rates. The risk scores are the author's assessment.

## Data sources
Masan Consumer 4Q2025 earnings presentation, Annual Report 2024, Sustainability Report 2025, the company's distribution/factories page,
Masan Group press releases and Vietnamese business media. The full list is in `data/sources.csv`.

*For educational purposes only – not investment advice. The Masan Consumer name and logo belong to their owner.*
