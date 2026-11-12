const leagueSelect = document.getElementById("league")

leagueSelect.addEventListener("change", async function() {
    const selectedLeague = this.value;
    console.log(selectedLeague);
    try {
        const response = await fetch(`/home/team?leagues=${selectedLeague}`);
        const data = await response.json();

        document.getElementById("comp-name").textContent = data.cmpName;
        document.getElementById("comp-country").textContent = data.cmpCountry;

        const teamList = document.getElementById("team-list");
        teamList.innerHTML = '';

        data.tName.forEach((team) => {
            const li = document.createElement("li");
            li.textContent = team;
            teamList.appendChild(li);
        });
    } catch (error) {
        console.error(`error fetcing league data: ${error}`)
    }
})