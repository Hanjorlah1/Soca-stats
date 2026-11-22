import express from "express";
import axios from "axios";
import "dotenv/config";
import fs from "fs/promises";

const app = express();
const port = process.env.PORT || 3000;
const key = process.env.FOOTBALL_API_KEY;
let cmpCodes = ["PL", "PD", "BL1", "SA", "FL1", "CL", "PPL", "DED"];

const leagueNames = {
  PL: "Premier League",
  PD: "La Liga",
  BL1: "Bundesliga",
  SA: "Serie A",
  FL1: "Ligue 1",
  CL: "UEFA Champions League",
  PPL: "Primeira Liga",
  DED: "Eredivisie",
};

const maxSeasonsBack = 5;

const endpoints = {
  league: "standings",
  scorer: "scorers",
  team: "teams",
};

app.set("view engine", "ejs");
app.locals.leagueNames = leagueNames;
app.use(express.static("public"));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get("/", (req, res) => {
  res.redirect("/home");
});

function getLeagueFromQuery(req) {
  const league = req.query.leagues;
  if (cmpCodes.includes(league)) {
    return league;
  }
  return "PL";
}

app.get("/home", async (req, res) => {
  const league = getLeagueFromQuery(req);
  const { pastYear, seasonYear, prevYear, nextYear, seasonText } =
    await getSeasonInfo(req, league);
  const {
    competitionCountry,
    competitionName,
    teamNames,
    competitionLogo,
    teamLogo,
    season,
  } = await getSpecificDetsFromJson(league, pastYear);
  res.render("index", {
    league: league,
    season: season || seasonText,
    seasonYear: seasonYear,
    prevYear: prevYear,
    nextYear: nextYear,
    cmpName: competitionName,
    cmpCountry: competitionCountry,
    tName: teamNames,
    cmpLogo: competitionLogo,
    tLogo: teamLogo,
  });
});

app.get(`/home/team`, async (req, res) => {
  const selectedLeague = req.query.leagues;
  if (!cmpCodes.includes(selectedLeague)) {
    return res.status(400).json({ error: "Invalid league code" });
  }
  const {
    competitionCountry,
    competitionName,
    teamNames,
    competitionLogo,
    teamLogo,
  } = await getSpecificDetsFromJson(selectedLeague);
  console.log(competitionCountry);
  res.json({
    cmpName: competitionName,
    cmpCountry: competitionCountry,
    tName: teamNames,
    cmpLogo: competitionLogo,
    tLogo: teamLogo,
  });
});

app.get(`/home/scorer`, async (req, res) => {
  const league = getLeagueFromQuery(req);
  const { pastYear, seasonYear, prevYear, nextYear, seasonText } =
    await getSeasonInfo(req, league);
  const { competitionCountry, competitionName, competitionLogo, season } =
    await getHeadingFromJson(league, pastYear);
  const scorers = await getScorersFromJson(league, pastYear);
  res.render("scorers.ejs", {
    league: league,
    season: season || seasonText,
    seasonYear: seasonYear,
    prevYear: prevYear,
    nextYear: nextYear,
    cmpName: competitionName,
    cmpCountry: competitionCountry,
    cmpLogo: competitionLogo,
    scorers: scorers,
  });
});

app.get(`/home/table`, async (req, res) => {
  const league = getLeagueFromQuery(req);
  const { pastYear, seasonYear, prevYear, nextYear, seasonText } =
    await getSeasonInfo(req, league);
  const { competitionCountry, competitionName, competitionLogo, season } =
    await getHeadingFromJson(league, pastYear);
  const tables = await getTableFromJson(league, pastYear);
  res.render("table.ejs", {
    league: league,
    season: season || seasonText,
    seasonYear: seasonYear,
    prevYear: prevYear,
    nextYear: nextYear,
    cmpName: competitionName,
    cmpCountry: competitionCountry,
    cmpLogo: competitionLogo,
    tables: tables,
  });
});

// 2. Background Sync Function
async function syncFootballData() {
  try {
    console.log("Starting background data sync...");
    await fs.mkdir("./data", { recursive: true });

    for (let i = 0; i < cmpCodes.length; i++) {
      const code = cmpCodes[i];
      console.log(`Syncing ${code}...`);

      try {
        await getLeagueDetails(code);
        await delay(6500);

        await getScorerDetails(code);
        await delay(6500);

        await getTeamDetails(code);

        if (i < cmpCodes.length - 1) {
          await delay(6500);
        }
      } catch (err) {
        console.error(`Skipping remaining requests for ${code}:`, err.message);
        await delay(10000); // extra cooling period on error
      }
    }
    console.log("Background data sync complete!");
  } catch (error) {
    console.error("Critical background sync error:", error);
  }
}

// Start the server
app.listen(port, () => {
  console.log(`App running on port: ${port}`);
  syncFootballData();
  setInterval(syncFootballData, 6 * 60 * 60 * 1000);
});

async function getLeagueDetails(code) {
  try {
    const response = await axios.get(
      `https://api.football-data.org/v4/competitions/${code}/standings`,
      {
        headers: { "X-Auth-Token": key },
      },
    );
    await saveToJson(`./data/${code}-league-details.json`, response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function getScorerDetails(code) {
  try {
    const response = await axios.get(
      `https://api.football-data.org/v4/competitions/${code}/scorers`,
      {
        headers: { "X-Auth-Token": key },
      },
    );
    await saveToJson(`./data/${code}-scorer-details.json`, response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function getTeamDetails(code) {
  try {
    const response = await axios.get(
      `https://api.football-data.org/v4/competitions/${code}/teams`,
      {
        headers: { "X-Auth-Token": key },
      },
    );
    await saveToJson(`./data/${code}-team-details.json`, response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function saveToJson(filename, data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filename, jsonString, "utf-8");
  } catch (error) {
    console.error(`Failed to save ${filename}:`, error.message);
  }
}

async function readFromJson(filename) {
  try {
    const jsonString = await fs.readFile(filename, "utf-8");
    const data = JSON.parse(jsonString);
    return data;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
  }
}

async function fileExists(filename) {
  try {
    await fs.access(filename);
    return true;
  } catch (err) {
    return false;
  }
}

async function getSeasonInfo(req, league) {
  // the sync always saves the CURRENT season, so we read the year from that file
  const leagueData = await readFromJson(`./data/${league}-league-details.json`);

  if (!leagueData || !leagueData.season) {
    // no data downloaded yet, so we can't know the season
    return {
      pastYear: null,
      seasonYear: null,
      prevYear: null,
      nextYear: null,
      seasonText: "",
    };
  }

  const currentYear = parseInt(leagueData.season.startDate.slice(0, 4));
  let seasonYear = currentYear;
  let pastYear = null; // stays null when we are showing the current season

  // ?season=2024 in the url. We only accept older seasons that are not too far back
  const requestedYear = parseInt(req.query.season);
  if (
    requestedYear < currentYear &&
    requestedYear >= currentYear - maxSeasonsBack
  ) {
    seasonYear = requestedYear;
    pastYear = requestedYear;
  }

  // null means the arrow has nowhere to go, so it gets greyed out
  let prevYear = null;
  if (seasonYear > currentYear - maxSeasonsBack) {
    prevYear = seasonYear - 1;
  }
  let nextYear = null;
  if (seasonYear < currentYear) {
    nextYear = seasonYear + 1;
  }

  return {
    pastYear,
    seasonYear,
    prevYear,
    nextYear,
    seasonText: `${seasonYear}/${seasonYear + 1}`,
  };
}

async function loadLeagueJson(league, type, year) {
  if (!year) {
    return await readFromJson(`./data/${league}-${type}-details.json`);
  }

  const filename = `./data/${league}-${year}-${type}-details.json`;

  if (await fileExists(filename)) {
    return await readFromJson(filename);
  }

  try {
    console.log(`Downloading ${league} ${type} data for season ${year}...`);
    const response = await axios.get(
      `https://api.football-data.org/v4/competitions/${league}/${endpoints[type]}`,
      {
        headers: { "X-Auth-Token": key },
        params: { season: year },
      },
    );
    await fs.mkdir("./data", { recursive: true });
    await saveToJson(filename, response.data);
    return response.data;
  } catch (error) {
    console.error(
      `Could not get ${league} ${type} for season ${year}:`,
      error.message,
    );
  }
}

async function getHeadingFromJson(league, year) {
  let competitionName = "";
  let competitionCountry = "";
  let competitionLogo = "";
  let season = "";

  const leagueData = await loadLeagueJson(league, "league", year);

  if (leagueData && leagueData.competition && leagueData.area) {
    competitionName = leagueData.competition.name;
    competitionCountry = leagueData.area.name;
    competitionLogo = leagueData.competition.emblem;
  }

  if (leagueData && leagueData.season) {
    // startDate looks like "2026-08-15", so the first 4 letters are the year
    const startYear = leagueData.season.startDate.slice(0, 4);
    const endYear = leagueData.season.endDate.slice(0, 4);
    season = `${startYear}/${endYear}`;
  }

  return { competitionName, competitionCountry, competitionLogo, season };
}

async function getSpecificDetsFromJson(league, year) {
  let teamNames = [];
  let teamLogo = [];

  const { competitionName, competitionCountry, competitionLogo, season } =
    await getHeadingFromJson(league, year);

  const teamData = await loadLeagueJson(league, "team", year);

  if (teamData && teamData.teams) {
    teamData.teams.forEach((team) => {
      teamNames.push(team.name);
      teamLogo.push(team.crest);
    });
  }

  return {
    competitionCountry,
    competitionName,
    teamNames,
    competitionLogo,
    teamLogo,
    season,
  };
}

// Gets the list of top scorers (the api already sorts it by goals)
async function getScorersFromJson(league, year) {
  const scorerData = await loadLeagueJson(league, "scorer", year);

  if (scorerData && scorerData.scorers) {
    return scorerData.scorers;
  }
  return [];
}

// Gets the league table. Most leagues have one table, but some competitions have more (like groups)
async function getTableFromJson(league, year) {
  const leagueData = await loadLeagueJson(league, "league", year);

  if (leagueData && leagueData.standings) {
    // the api also sends "HOME" and "AWAY" tables, we only want the "TOTAL" one
    return leagueData.standings.filter((standing) => standing.type === "TOTAL");
  }
  return [];
}
