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

$("lcLink").href = "https://leetcode.com/u/" + CONFIG.leetcode;
$("liLink").href = CONFIG.linkedin;
$("ghLink").href = "https://github.com/" + CONFIG.github;
$("mailLink").href = "mailto:" + CONFIG.email;
$("mailLink").textContent = CONFIG.email;

CONFIG.projects.forEach(function (p) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = "<h3>" + p.name + "</h3><b>" + p.type + "</b><p>" + p.desc + "</p><p class='tech'>" + p.tech + "</p><div class='links'><a href='" + p.live + "' target='_blank' rel='noopener'>Live</a><a href='" + p.code + "' target='_blank' rel='noopener'>Code</a></div>";
  $("projectCards").appendChild(card);
});

fetch("https://leetcode-stats-api.herokuapp.com/" + CONFIG.leetcode)
  .then(function (res) { return res.json(); })
  .then(function (d) {
    if (d.status !== "success") { $("lcMsg").textContent = "Could not load stats."; return; }
    $("lcTotal").textContent = d.totalSolved;
    $("lcEasy").textContent = d.easySolved;
    $("lcMedium").textContent = d.mediumSolved;
    $("lcHard").textContent = d.hardSolved;
    $("lcMsg").textContent = "Ranking: " + d.ranking;
  })
  .catch(function () { $("lcMsg").textContent = "Stats unavailable."; });

fetch("https://api.github.com/users/" + CONFIG.github)
  .then(function (res) { return res.json(); })
  .then(function (u) {
    if (u.message) { $("ghMsg").textContent = "Could not load GitHub."; return; }
    $("ghRepos").textContent = u.public_repos;
    $("ghFollowers").textContent = u.followers;
    $("ghMsg").textContent = u.bio || "Loaded";
  })
  .catch(function () { $("ghMsg").textContent = "GitHub unavailable."; });
