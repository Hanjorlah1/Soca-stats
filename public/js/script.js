const leagueSelect = document.getElementById("league");
const leagueForm = document.getElementById("league-form");
const currentPath = window.location.pathname;
const navTabs = document.querySelectorAll(".btn-div .btn");

// Highlight the tab of the page we are on
navTabs.forEach((tab) => {
  if (tab.pathname === currentPath) {
    tab.classList.add("active-tab");
  }
});

// When a new league is picked, send the form.
// The page reloads with ?leagues=XX in the url, and the tabs keep that league
leagueSelect.addEventListener("change", function() {
    leagueForm.submit();
});
