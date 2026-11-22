# SOCA Stats

SOCA Stats is a responsive football statistics dashboard built with Node.js, Express, and EJS. It displays current and recent seasons across several major leagues and competitions.

**Live demo:** [https://soca-stats.onrender.com](https://soca-stats.onrender.com)

## Features

- Browse teams, top scorers, and league tables
- Switch between eight supported leagues and competitions
- Navigate through the current season and up to five previous seasons
- View competition and team logos
- Automatic background data refresh every six hours
- Cached JSON responses for faster repeat visits
- Responsive interface for desktop and mobile

## Supported competitions

| Code | Competition |
| --- | --- |
| `PL` | Premier League |
| `PD` | La Liga |
| `BL1` | Bundesliga |
| `SA` | Serie A |
| `FL1` | Ligue 1 |
| `CL` | UEFA Champions League |
| `PPL` | Primeira Liga |
| `DED` | Eredivisie |

## Pages

| Route | Description |
| --- | --- |
| `/home` | Teams in the selected competition |
| `/home/scorer` | Ranked top scorers |
| `/home/table` | Standings and competition group tables |

Use query parameters to select a league or season:

```text
/home?leagues=PL&season=2025
/home/scorer?leagues=SA
/home/table?leagues=PD&season=2024
```

## Tech stack

- Node.js
- Express
- EJS
- Axios
- Bootstrap
- football-data.org API

## Getting started

### Prerequisites

- Node.js 18 or newer
- An API key from [football-data.org](https://www.football-data.org/)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Soca-stats
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   FOOTBALL_API_KEY=your_api_key
   PORT=3000
   ```

   `PORT` is optional and defaults to `3000`.

4. Start the server:

   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000).

On startup, the app creates a `data/` directory and begins downloading standings, scorers, and team details for each supported competition. It repeats this synchronization every six hours.

## Data caching

Football data is stored as JSON files in `data/`. The directory is generated locally and ignored by Git.

- Current-season data is saved in files such as `data/PL-league-details.json`
- Historical-season data is saved in files such as `data/PL-2025-league-details.json`
- Historical seasons are available for up to five years before the current season
- Data unavailable under the configured API plan is shown with an empty-state message

## Deploying to Render

1. Create a new Render Web Service from this repository.
2. Use `npm install` as the build command.
3. Use `npm start` as the start command.
4. Add `FOOTBALL_API_KEY` in the Render environment settings.
5. Deploy the service.

No database or external storage service is required. Render's ephemeral filesystem may clear downloaded JSON data during restarts or deploys, so the app downloads it again automatically.

## Project structure

```text
Soca-stats/
├── index.js                 # Express server, API requests, and caching
├── views/
│   ├── index.ejs            # Teams page
│   ├── scorers.ejs          # Top scorers page
│   ├── table.ejs            # League table page
│   └── partials/            # Shared header and competition heading
├── public/
│   ├── js/script.js         # League and tab interactions
│   └── styles/stylesheet.css
├── data/                    # Generated API cache (ignored by Git)
└── package.json
```

## License

This project is licensed under the ISC License.
