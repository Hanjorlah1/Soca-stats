import express from "express";
import axios from "axios";
import "dotenv/config";
import fs from "fs/promises";

const app = express();
const port = process.env.PORT || 3000;
const key = process.env.FOOTBALL_API_KEY;
let cmpCodes = ["PL", "PD", "BL1", "SA", "FL1", "CL", "PPL", "DED"];



app.set("view engine", "ejs");
app.use(express.static("public"));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get("/", (req, res) => {
    res.redirect("/home");
});

app.get("/home", async (req, res) => {
    let competitionName = [];
    let competitionCountry = [];
    let teamNames = [];

    for (let i = 0; i < cmpCodes.length; i++) {
        // 1. Read League Details
        const leagueFile = `./data/${cmpCodes[i]}-league-details.json`;
        const leagueData = await readFromJson(leagueFile);
        
        if (leagueData && leagueData.competition && leagueData.area) {
            competitionName.push(leagueData.competition.name);
            competitionCountry.push(leagueData.area.name);
        }

        // 2. Read Team Details
        const teamFile = `./data/${cmpCodes[i]}-team-details.json`;
        const teamData = await readFromJson(teamFile);
        
        if (teamData && teamData.teams) {
            teamData.teams.forEach(team => {
                teamNames.push(team.name);
            });
        }
    }

    // Render the view with the populated arrays
    res.render("index", { 
        "cmpName": competitionName, 
        "cmpCountry": competitionCountry, 
        "tName": teamNames 
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
});

async function getLeagueDetails(code){
    try {
        const response = await axios.get(`https://api.football-data.org/v4/competitions/${code}/standings`, {
            headers: { 'X-Auth-Token': key }
        });
        await saveToJson(`./data/${code}-league-details.json`, response.data);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function getScorerDetails(code){
    try {
        const response = await axios.get(`https://api.football-data.org/v4/competitions/${code}/scorers`, {
            headers: { 'X-Auth-Token': key }
        });
        await saveToJson(`./data/${code}-scorer-details.json`, response.data);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function getTeamDetails(code){
    try {
        const response = await axios.get(`https://api.football-data.org/v4/competitions/${code}/teams`, {
            headers: { 'X-Auth-Token': key }
        });
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
