// EDIT ONLY THIS PART
const CONFIG = {
  leetcode: "your-leetcode-username",
  github: "your-github-username",
  linkedin: "https://www.linkedin.com/in/your-linkedin-id",
  email: "your-email@gmail.com",
  projects: [
    {
      name: "GLA ExamPrep",
      type: "Quiz Website",
      desc: "Free quiz platform for GLA University students to practise for exams.",
      tech: "HTML, CSS, JavaScript, Firebase",
      live: "#",
      code: "#"
    },
    {
      name: "Wallora",
      type: "Wallpaper Website",
      desc: "Discover and upload wallpapers in one place.",
      tech: "HTML, CSS, JavaScript",
      live: "#",
      code: "#"
    }
  ]
};

// Small helper
function $(id) {
  return document.getElementById(id);
}

// Links
$("lcLink").href = "https://leetcode.com/u/" + CONFIG.leetcode;
$("liLink").href = CONFIG.linkedin;
$("liLink2").href = CONFIG.linkedin;
$("ghLink").href = "https://github.com/" + CONFIG.github;
$("ghLink").textContent = "github.com/" + CONFIG.github;
$("mailLink").href = "mailto:" + CONFIG.email;
$("mailLink").textContent = CONFIG.email;

// Projects
CONFIG.projects.forEach(function (p) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML =
    "<h3>" + p.name + "</h3>" +
    "<b>" + p.type + "</b>" +
    "<p>" + p.desc + "</p>" +
    "<p class='tech'>" + p.tech + "</p>" +
    "<div class='links'><a href='" + p.live + "' target='_blank' rel='noopener'>Live</a>" +
    "<a href='" + p.code + "' target='_blank' rel='noopener'>Code</a></div>";
  $("projectCards").appendChild(card);
});

// LeetCode stats (third-party public API, can be down sometimes)
fetch("https://leetcode-stats-api.herokuapp.com/" + CONFIG.leetcode)
  .then(function (res) { return res.json(); })
  .then(function (d) {
    if (d.status !== "success") {
      $("lcMsg").textContent = "Could not load stats. Check your LeetCode username in script.js.";
      return;
    }
    $("lcTotal").textContent = d.totalSolved;
    $("lcEasy").textContent = d.easySolved;
    $("lcMedium").textContent = d.mediumSolved;
    $("lcHard").textContent = d.hardSolved;
    $("lcMsg").textContent = "Global ranking: " + d.ranking;
  })
  .catch(function () {
    $("lcMsg").textContent = "Stats are unavailable right now. Try again later.";
  });

// GitHub stats
fetch("https://api.github.com/users/" + CONFIG.github)
  .then(function (res) { return res.json(); })
  .then(function (u) {
    if (u.message) {
      $("ghMsg").textContent = "Could not load stats. Check your GitHub username in script.js.";
      return;
    }
    $("ghRepos").textContent = u.public_repos;
    $("ghFollowers").textContent = u.followers;
    $("ghMsg").textContent = u.bio || "GitHub profile loaded";
    $("ghGraph").src = "https://ghchart.rshah.org/" + CONFIG.github;
  })
  .catch(function () {
    $("ghMsg").textContent = "GitHub stats unavailable.";
  });

// Streak (localStorage)
(function () {
  var key = "lc-streak-days";
  var days = JSON.parse(localStorage.getItem(key) || "[]");
  var today = new Date().toISOString().slice(0, 10);
  function render() {
    var dots = $("streakDots");
    if (!dots) return;
    dots.innerHTML = "";
    for (var i = 0; i < 30; i++) {
      var s = document.createElement("span");
      if (days.indexOf(i) >= 0 || (days.length && days.includes(today))) s.className = "on";
      dots.appendChild(s);
    }
    $("streakNum").textContent = days.length;
  }
  render();
  $("solvedBtn").addEventListener("click", function () {
    if (days.indexOf(today) === -1) {
      days.push(today);
      localStorage.setItem(key, JSON.stringify(days));
      render();
    }
  });
})();
