const leagueSelect = document.getElementById("league");
const teamBtn = document.getElementById("teamBtn");
const scorerBtn = document.getElementById("scorerBtn");
const tableBtn = document.getElementById("tableBtn");
const currentPath = window.location.pathname;
const navTabs = document.querySelectorAll(".btn-div .btn");

navTabs.forEach((tab) => {
  if (tab.getAttribute("href") === currentPath) {
    tab.classList.add("active-tab");
  }
});


leagueSelect.addEventListener("change", async function() {
    const selectedLeague = this.value;
    try {
        const response = await fetch(`/home/team?leagues=${selectedLeague}`);
        const data = await response.json();

        document.getElementById("comp-name").textContent = data.cmpName;
        document.getElementById("comp-country").textContent = data.cmpCountry;
        document.querySelector(".competition-logo").setAttribute("src", data.cmpLogo);
        document.querySelector(".team-logo").setAttribute("src", data.tLogo);

        const teamList = document.getElementById("team-list");
        teamList.innerHTML = "";

        data.tName.forEach((team, index) => {
        const li = document.createElement("li");
        li.classList.add("container-fluid", "team-name-div", "team-name");
        li.style.animationDelay = `${index * 0.03}s`;

        const img = document.createElement("img");
        img.setAttribute("src", data.tLogo[index]);
        img.setAttribute("alt", `${team} logo`);
        img.classList.add("team-logo");

        const span = document.createElement("span");
        span.textContent = team;

        li.appendChild(img);
        li.appendChild(span);
        teamList.appendChild(li);
        });

    } catch (error) {
        console.error(`error fetcing league data: ${error}`)
    }
})

teamBtn.addEventListener("click", async function() {
    try {
        const response = await fetch(`home/scorer/`)
    } catch (error) {
        
    }
})

tableBtn.addEventListener("click", async function() {
    try {
        const response = await fetch(`home/table/`)
    } catch (error) {
        
    }
})

scorerBtn.addEventListener("click", async function() {
    try {
        const response = await fetch(`home/scorer/`)
    } catch (error) {
        
    }
})