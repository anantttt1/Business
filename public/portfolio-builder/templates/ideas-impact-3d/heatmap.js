(function () {
  'use strict';

  function renderHeatmap(activity) {
    activity = activity || [];
    var heatmap = document.getElementById('leetcodeHeatmap');
    if (!heatmap) return;
    var byDate = {};
    activity.forEach(function (item) {
      if (item && item.date) byDate[item.date] = Number(item.count) || 0;
    });
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));
    var start = new Date(end);
    start.setDate(end.getDate() - 363);
    start.setDate(start.getDate() - start.getDay());
    var total = 0;
    var html = '';
    for (var i = 0; i < 364; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      var key =
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0');
      var count = byDate[key] || 0;
      total += count;
      var level = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4;
      html +=
        '<div class="heat-cell" data-level="' +
        level +
        '" title="' +
        key +
        ': ' +
        count +
        ' submissions"></div>';
    }
    heatmap.innerHTML = html;
    var ht = document.getElementById('heatmapTotal');
    if (ht) ht.textContent = total + ' contributions';
  }

  function loadHeatmapActivity(username) {
    if (!username) {
      renderHeatmap([]);
      return;
    }
    var urls = [
      'https://alfa-leetcode-api.onrender.com/' + encodeURIComponent(username) + '/calendar',
      'https://leetcode-api-faisalshohag.vercel.app/' + encodeURIComponent(username)
    ];
    function tryUrl(i) {
      if (i >= urls.length) {
        renderHeatmap([]);
        return;
      }
      fetch(urls[i], { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('bad');
          return r.json();
        })
        .then(function (data) {
          var activity = [];
          var cal = (data && data.submissionCalendar) || (data && data.calendar) || null;
          if (typeof cal === 'string') {
            try {
              cal = JSON.parse(cal);
            } catch (e) {
              cal = {};
            }
          }
          if (cal && typeof cal === 'object') {
            Object.keys(cal).forEach(function (ts) {
              var d = new Date(Number(ts) * (String(ts).length > 11 ? 1 : 1000));
              if (isNaN(d.getTime())) return;
              var key =
                d.getFullYear() +
                '-' +
                String(d.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(d.getDate()).padStart(2, '0');
              activity.push({ date: key, count: Number(cal[ts]) || 0 });
            });
          }
          renderHeatmap(activity);
        })
        .catch(function () {
          tryUrl(i + 1);
        });
    }
    tryUrl(0);
  }

  function boot() {
    try {
      var cfg = typeof CONFIG !== 'undefined' ? CONFIG : {};
      var url = (cfg.social && cfg.social.leetcode) || '';
      var m = String(url).match(/leetcode\.com\/(?:u\/)?([A-Za-z0-9_-]+)/i);
      var user = m ? m[1] : cfg.leetcodeUsername || '';
      if (user) loadHeatmapActivity(user);
      else renderHeatmap([]);
    } catch (e) {
      renderHeatmap([]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 600);
    });
  } else {
    setTimeout(boot, 600);
  }
})();
