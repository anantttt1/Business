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

function $(id) { return document.getElementById(id); }

if ($("lcLink")) $("lcLink").href = "https://leetcode.com/u/" + CONFIG.leetcode;
if ($("liLink")) $("liLink").href = CONFIG.linkedin;
if ($("ghLink")) $("ghLink").href = "https://github.com/" + CONFIG.github;
if ($("mailLink")) {
  $("mailLink").href = "mailto:" + CONFIG.email;
  $("mailLink").textContent = CONFIG.email;
}

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
  if ($("projectCards")) $("projectCards").appendChild(card);
});

fetch("https://leetcode-stats-api.herokuapp.com/" + CONFIG.leetcode)
  .then(function (res) { return res.json(); })
  .then(function (d) {
    if (d.status !== "success") {
      if ($("lcMsg")) $("lcMsg").textContent = "Could not load stats.";
      return;
    }
    if ($("lcTotal")) $("lcTotal").textContent = d.totalSolved;
    if ($("lcEasy")) $("lcEasy").textContent = d.easySolved;
    if ($("lcMedium")) $("lcMedium").textContent = d.mediumSolved;
    if ($("lcHard")) $("lcHard").textContent = d.hardSolved;
    if ($("lcMsg")) $("lcMsg").textContent = "Ranking: " + d.ranking;
  })
  .catch(function () {
    if ($("lcMsg")) $("lcMsg").textContent = "Stats unavailable.";
  });

fetch("https://api.github.com/users/" + CONFIG.github)
  .then(function (res) { return res.json(); })
  .then(function (u) {
    if (u.message) {
      if ($("ghMsg")) $("ghMsg").textContent = "Could not load GitHub.";
      return;
    }
    if ($("ghRepos")) $("ghRepos").textContent = u.public_repos;
    if ($("ghFollowers")) $("ghFollowers").textContent = u.followers;
    if ($("ghMsg")) $("ghMsg").textContent = u.bio || "Loaded";
  })
  .catch(function () {
    if ($("ghMsg")) $("ghMsg").textContent = "GitHub unavailable.";
  });
