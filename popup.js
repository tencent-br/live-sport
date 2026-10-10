// popup.js

let timeDrift = 0;
let channels = [];
let currentSport = "football"; 
let batchInterval;
let timerInterval;
let activeDate = null; // Tracks current active cache date string (YYYY-M-D)

// ────────────────────────────────────────────────
// UTILS & STATUS
// ────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getSafeDate = (utcString) => utcString ? new Date(utcString.endsWith('Z') ? utcString : utcString + 'Z') : null;
const getCorrectedNow = () => new Date(Date.now() + timeDrift);

function getFormattedDate(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setUTCDate(d.getUTCDate() + offsetDays);
  }
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

// Match Status
function getStatus(apiStatus, timestamp) {
  if (!apiStatus && !timestamp)
    return { rank: 10, label: 'syncing', class: 'badge-syncing' };

  const now = getCorrectedNow();
  const startTime = getSafeDate(timestamp);
  const diffMin = (now - startTime) / 60000;

  // Football
  if (startTime && currentSport == "football") {

    if (diffMin > 190 && !["Match Postponed", "PST", "POST", "STATUS_POSTPONED", "Match Suspended", "SUSP", "S", "STATUS_SUSPENDED", "Match Cancelled", "CANC", "STATUS_CANCELED", "STATUS_DELAYED", "ABD", "INT", "INTR", "AWD", "AW", "WO", "STATUS_FORFEIT"].includes(apiStatus))
      return { rank: 6, label: 'finished', class: 'badge-finished' };

    if (diffMin > 125 && !["STATUS_EXTRA_TIME", "ET", "BT", "Match Postponed", "PST", "POST", "STATUS_POSTPONED", "Match Suspended", "SUSP", "S", "STATUS_SUSPENDED", "Match Cancelled", "CANC", "STATUS_CANCELED", "STATUS_DELAYED", "P", "PT", "STATUS_PENALTY_SHOOTOUT", "STATUS_SHOOTOUT", "ABD", "INT", "INTR", "AWD", "AW", "WO", "STATUS_FORFEIT"].includes(apiStatus))
      return { rank: 6, label: 'finished', class: 'badge-finished' };

    if (diffMin > 125 && diffMin < 135 &&
        (apiStatus === "P" || apiStatus === "PT" || apiStatus === "PEN" ||
         apiStatus === "STATUS_PENALTY_SHOOTOUT" || apiStatus === "STATUS_SHOOTOUT"))
      return { rank: 6, label: 'finished', class: 'badge-finished' };

    if (apiStatus === "STATUS_EXTRA_TIME" || apiStatus === "ET")
      return { rank: 4, label: 'extra_time', class: 'badge-live' };

    if (apiStatus === "STATUS_PENALTY_SHOOTOUT" ||
        apiStatus === "STATUS_SHOOTOUT" ||
        apiStatus === "P" ||
        apiStatus === "PT")
      return { rank: 5, label: 'penalties', class: 'badge-live' };

    if (apiStatus === "STATUS_HALFTIME")
      return { rank: 4, label: 'halftime', class: 'badge-live' };

    if (apiStatus === "STATUS_IN_PROGRESS")
      return { rank: 1, label: 'live', class: 'badge-live' };

    if (apiStatus === "Match Finished" ||
        apiStatus === "F" ||
        apiStatus === "FT" ||
        apiStatus === "STATUS_FULL_TIME" ||
        apiStatus === "STATUS_FINAL")
      return { rank: 6, label: 'finished', class: 'badge-finished' };

    if (apiStatus === "AET" || apiStatus === "STATUS_FINAL_AET")
      return { rank: 6, label: 'finished_aet', class: 'badge-finished' };

    if (apiStatus === "PEN" || apiStatus === "STATUS_FINAL_PEN")
      return { rank: 6, label: 'finished', class: 'badge-finished' };

    if (apiStatus === "Match Postponed" ||
        apiStatus === "PST" ||
        apiStatus === "POST" ||
        apiStatus === "STATUS_POSTPONED")
      return { rank: 3, label: 'postponed', class: 'badge-postponed' };

    if (apiStatus === "Match Suspended" ||
        apiStatus === "SUSP" ||
        apiStatus === "S" ||
        apiStatus === "STATUS_SUSPENDED")
      return { rank: 3, label: 'suspended', class: 'badge-postponed' };

    if (apiStatus === "STATUS_DELAYED")
      return { rank: 3, label: 'delayed', class: 'badge-postponed' };

    if (apiStatus === "Match Cancelled" ||
        apiStatus === "CANC" ||
        apiStatus === "STATUS_CANCELED")
      return { rank: 3, label: 'cancelled', class: 'badge-postponed' };

    if (apiStatus === "INT" || apiStatus === "INTR")
      return { rank: 3, label: 'interrupted', class: 'badge-postponed' };

    if (apiStatus === "Match Abandoned" ||
        apiStatus === "ABD" ||
        apiStatus === "STATUS_ABANDONED")
      return { rank: 3, label: 'abandoned', class: 'badge-postponed' };

    if (apiStatus === "AWD" ||
        apiStatus === "AW" ||
        apiStatus === "STATUS_FORFEIT")
      return { rank: 3, label: 'awarded', class: 'badge-postponed' };

    if (apiStatus === "WO")
      return { rank: 3, label: 'walkover', class: 'badge-postponed' };

    if (diffMin > 0 && ![
      "STATUS_DELAYED",
      "Match Postponed",
      "PST",
      "POST",
      "STATUS_POSTPONED",
      "Match Suspended",
      "SUSP",
      "S",
      "STATUS_SUSPENDED",
      "Match Cancelled",
      "CANC",
      "STATUS_CANCELED",
      "ET",
      "P",
      "PEN",
      "Match Finished",
      "F",
      "FT",
      "STATUS_FULL_TIME",
      "STATUS_FINAL",
      "STATUS_FINAL_AET",
      "STATUS_FINAL_PEN",
      "ABD",
      "INT",
      "INTR",
      "WO",
      "AWD",
      "AW",
      "STATUS_FORFEIT"
    ].includes(apiStatus))
      return { rank: 1, label: 'live', class: 'badge-live' };
  }

  // Other Sports
  if (startTime &&
      ["basketball", "hockey", "baseball", "american_football", "more_sports"].includes(currentSport)) {

    if (diffMin > 180 && ![
      "STATUS_DELAYED",
      "STATUS_EXTRA_TIME",
      "ET",
      "BT",
      "Match Postponed",
      "PST",
      "POST",
      "STATUS_POSTPONED",
      "Match Cancelled",
      "CANC",
      "STATUS_CANCELED",
      "Match Suspended",
      "STATUS_SUSPENDED",
      "SUSP",
      "S",
      "ABD",
      "INT",
      "INTR",
      "AWD",
      "AW",
      "WO",
      "STATUS_FORFEIT"
    ].includes(apiStatus))
      return { rank: 4, label: 'finished', class: 'badge-finished' };

    if (apiStatus === "STATUS_HALFTIME")
      return { rank: 4, label: 'halftime', class: 'badge-live' };

    if (apiStatus === "STATUS_IN_PROGRESS" ||
        apiStatus === "STATUS_FIRST_HALF" ||
        apiStatus === "STATUS_SECOND_HALF")
      return { rank: 1, label: 'live', class: 'badge-live' };

    if (apiStatus === "Match Finished" ||
        apiStatus === "Final" ||
        apiStatus === "Game Finished" ||
        apiStatus === "F" ||
        apiStatus === "FT" ||
        apiStatus === "AOT" ||
        apiStatus === "STATUS_FINAL" ||
        apiStatus === "STATUS_FULL_TIME")
      return { rank: 4, label: 'finished', class: 'badge-finished' };

    if (apiStatus === "AOT")
      return { rank: 4, label: 'finished_aot', class: 'badge-finished' };

    if (apiStatus === "AP")
      return { rank: 4, label: 'finished', class: 'badge-finished' };

    if (apiStatus === "RET")
      return { rank: 4, label: 'retired', class: 'badge-finished' };

    if (apiStatus === "DEF")
      return { rank: 4, label: 'defaulted', class: 'badge-finished' };

    if (apiStatus === "STATUS_OVERTIME")
      return { rank: 1, label: 'overtime', class: 'badge-live' };

    if (apiStatus === "STATUS_SHOOTOUT")
      return { rank: 1, label: 'shootout', class: 'badge-live' };

    if (apiStatus === "STATUS_RAIN_DELAY")
      return { rank: 1, label: 'delayed', class: 'badge-live' };

    if (apiStatus === "Match Postponed" ||
        apiStatus === "PST" ||
        apiStatus === "POST" ||
        apiStatus === "STATUS_POSTPONED" ||
        apiStatus === "STATUS_RESCHEDULED")
      return { rank: 3, label: 'postponed', class: 'badge-postponed' };

    if (apiStatus === "Match Suspended" ||
        apiStatus === "SUSP" ||
        apiStatus === "S" ||
        apiStatus === "STATUS_SUSPENDED")
      return { rank: 3, label: 'suspended', class: 'badge-postponed' };

    if (apiStatus === "STATUS_DELAYED")
      return { rank: 3, label: 'delayed', class: 'badge-postponed' };

    if (apiStatus === "Match Cancelled" ||
        apiStatus === "CANC" ||
        apiStatus === "STATUS_CANCELED")
      return { rank: 3, label: 'cancelled', class: 'badge-postponed' };

    if (apiStatus === "INTR")
      return { rank: 3, label: 'interrupted', class: 'badge-postponed' };

    if (apiStatus === "Match Abandoned" ||
        apiStatus === "ABD" ||
        apiStatus === "STATUS_ABANDONED" ||
        apiStatus === "STATUS_FINAL_ABANDONED")
      return { rank: 3, label: 'abandoned', class: 'badge-postponed' };

    if (apiStatus === "AWD" ||
        apiStatus === "AW" ||
        apiStatus === "STATUS_FORFEIT")
      return { rank: 3, label: 'awarded', class: 'badge-postponed' };

    if (apiStatus === "WO")
      return { rank: 3, label: 'walkover', class: 'badge-postponed' };

    if (diffMin > 0 && ![
      "STATUS_DELAYED",
      "Match Postponed",
      "PST",
      "POST",
      "STATUS_POSTPONED",
      "Match Cancelled",
      "CANC",
      "STATUS_CANCELED",
      "Match Suspended",
      "STATUS_SUSPENDED",
      "SUSP",
      "S",
      "Match Finished",
      "F",
      "FT",
      "STATUS_FINAL",
      "STATUS_FULL_TIME",
      "ABD",
      "STATUS_ABANDONED",
      "INT",
      "INTR",
      "WO",
      "AWD",
      "AW",
      "STATUS_FORFEIT"
    ].includes(apiStatus))
      return { rank: 1, label: 'live', class: 'badge-live' };
  }

  if (apiStatus === "Not Started" ||
      apiStatus === "NS" ||
      apiStatus === "STATUS_SCHEDULED")
    return { rank: 2, label: 'upcoming', class: 'badge-upcoming' };
}

const SPORT_CONFIG = {
  "football": {
    cache: "https://football-automator2.sportyreplays.workers.dev/",
    dataStorage: "https://football-main2.sportyreplays.workers.dev/"
  },
  "basketball": {
    cache: "https://basketball-automator.sportyreplays.workers.dev/",
    dataStorage: "https://basketball-main.sportyreplays.workers.dev/"
  },
  "baseball": { 
    cache: "https://baseball-hockey-automator.sportyreplays.workers.dev/", 
    dataStorage: "https://baseball-main.sportyreplays.workers.dev/" 
  },
  "american_football": { 
    cache: "https://american-football-automator.sportyreplays.workers.dev/", 
    dataStorage: "https://american-football-main.sportyreplays.workers.dev/" 
  },
  "hockey": { 
    cache: "https://hockey-automator.sportyreplays.workers.dev/", 
    dataStorage: "https://hockey-main.sportyreplays.workers.dev/" 
  },
  "more_sports": { 
    cache: "https://special-events-automator.sportyreplays.workers.dev/", 
    dataStorage: "https://special-events-main.sportyreplays.workers.dev/" 
  }
};

// ────────────────────────────────────────────────
// DATA FETCHING
// ────────────────────────────────────────────────

async function fetchSportData(sportId) {
  currentSport = sportId;
  await chrome.storage.local.set({ currentSport });

  const config = SPORT_CONFIG[currentSport];
  const loader = document.getElementById('loadingOverlay');
  if (loader) loader.style.display = 'flex';

  channels = [];
  activeDate = null;

  const todayDate = getFormattedDate(0);
  const yesterdayDate = getFormattedDate(-1);

  // 1. Immediately load local storage first for fast tab-switching UI
  const todayKey = `channels_${currentSport}_${todayDate}`;
  const yesterdayKey = `channels_${currentSport}_${yesterdayDate}`;
  const localResult = await chrome.storage.local.get([todayKey, yesterdayKey]);

  if (localResult?.[todayKey]?.length) {
    channels = localResult[todayKey];
    activeDate = todayDate;
  } else if (localResult?.[yesterdayKey]?.length) {
    channels = localResult[yesterdayKey];
    activeDate = yesterdayDate;
  }

  // Render instantly if local cached data exists
  if (channels.length) {
    renderList();
  }

  // 2. Fetch latest remote channels layout
  let remoteChannels = [];
  let remoteDate = null;

  if (config?.cache) {
    try {
      const resp = await fetch(`${config.cache}?date=${todayDate}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          remoteChannels = data;
          remoteDate = todayDate;
        }
      }
    } catch (e) {
      console.warn(`Today's cache fetch failed for ${currentSport}.`);
    }

    if (!remoteChannels.length) {
      try {
        const resp = await fetch(`${config.cache}?date=${yesterdayDate}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0) {
            remoteChannels = data;
            remoteDate = yesterdayDate;
          }
        }
      } catch (e) {
        console.warn(`Yesterday's cache fetch failed for ${currentSport}.`);
      }
    }
  }

  // 3. Update active channels and consolidate with stored metadata
  if (remoteChannels.length) {
    channels = remoteChannels;
    activeDate = remoteDate;
    await loadFromLocalCache(activeDate);

    const cacheKey = `channels_${currentSport}_${activeDate}`;
    await chrome.storage.local.set({ [cacheKey]: JSON.parse(JSON.stringify(channels)) });
  }

  if (loader) loader.style.display = 'none';

  renderList();
  await performBatchFetch(true);

  clearInterval(timerInterval);
  timerInterval = setInterval(updateAllTimers, 1000);
}


async function loadFromLocalCache(targetDate) {
  if (!targetDate) return;
  const cacheKey = `channels_${currentSport}_${targetDate}`;
  const result = await chrome.storage.local.get([cacheKey]);

  if (result?.[cacheKey] && Array.isArray(result[cacheKey])) {
    const cachedMap = Object.fromEntries(
      result[cacheKey].map(ch => [ch.id, ch])
    );

    channels = channels.map(ch => {
      const cachedItem = cachedMap[ch.id];
      if (!cachedItem) return ch;

      // FIX: Spread cachedItem.meta over ch.meta so updated score, status, video highlights are retained
      return {
        ...ch,
        meta: cachedItem.meta ? { ...ch.meta, ...cachedItem.meta } : ch.meta
      };
    });
  }
}


async function performBatchFetch(isInitial = false) {
  const config = SPORT_CONFIG[currentSport];
  if (!config || !config.dataStorage) return;

  let standardChannels = channels.filter(c => c.apiURL || c.eventId); 
  
  if (!isInitial) {
    standardChannels = standardChannels.filter(ch => {
      if (!ch.meta) return false;
      const label = getStatus(ch.meta.status, ch.meta.timestamp).label;
      // return ["LIVE", "EXTRA TIME", "PENALTIES", "FINISHED"].includes(label);
      return ['live', 'extra_time', 'halftime', 'penalties', 'delayed', 'finished', 'finished_aet', 'finished_aot'].includes(label);
    });
  }


  async function saveToLocal() {
    if (!activeDate) return;
    const cacheKey = `channels_${currentSport}_${activeDate}`;
    // Use structured clone or JSON parse/stringify to break mutated memory references
    const cleanData = JSON.parse(JSON.stringify(channels));
    await chrome.storage.local.set({ [cacheKey]: cleanData });
  }

  if (standardChannels.length === 0) {
    await saveToLocal(); 
    renderList(); 
    return;
  }

  const batchSize = 25;
  let allData = [];

  try {
    for (let i = 0; i < standardChannels.length; i += batchSize) {
      const slugs = standardChannels.slice(i, i + batchSize).map(ch => ch.eventId).filter(Boolean).join(',');
      const resp = await fetch(`${config.dataStorage}?ids=${slugs}`);
      const json = await resp.json();
      
      if (json.serverTime && timeDrift === 0) {
        timeDrift = new Date(json.serverTime).getTime() - Date.now();
        await chrome.storage.local.set({ timeDrift });
      }
      if (json.data && Array.isArray(json.data)) allData.push(...json.data);
    }

    allData.forEach(matchData => {
      const channel = channels.find(c => String(c.eventId) === String(matchData.id));
      if (channel) channel.meta = matchData;
    });
    
    await saveToLocal();
    renderList();
  } catch (e) {
    // console.error("Batch fetch error:", e);
  }
}


// ────────────────────────────────────────────────
// UI RENDERING
// ────────────────────────────────────────────────
function renderList() {
  const list = document.getElementById("channelList");
  const eventCountEl = document.getElementById("eventCount");
  const searchVal = document.getElementById("search").value.toLowerCase();
  
  list.innerHTML = "";
  
  const sportName = translations[window.currentLang]?.[currentSport] || currentSport;

  if (eventCountEl) {
    if (!channels.length) {
      eventCountEl.textContent = "";
    } else {
      const translationKey = currentSport === "more_sports" ? "event_count" : "match_count";
      eventCountEl.textContent = translateCount(translationKey, channels.length, sportName);
    }
  }

  if (channels.length === 0) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:14px;">No matches listed right now, please check back later.</div>';
    return;
  }
  
  let filtered = channels.filter(ch => {
    const meta = ch.meta || {};
    return `${meta.homeTeam||''} ${meta.awayTeam||''} ${meta.league||''} ${ch.title||''}`.toLowerCase().includes(searchVal);
  });
  
  const categories = { live: [], upcoming: [], finished: [] };
  
  filtered.forEach(ch => {
    const status = getStatus(ch.meta?.status, ch.meta?.timestamp);
    if (status.class === 'badge-live') categories.live.push(ch);
    else if (status.class === 'badge-finished') categories.finished.push(ch);
    else categories.upcoming.push(ch);
  });
  
  categories.upcoming.sort((a, b) => getSafeDate(a.meta?.timestamp) - getSafeDate(b.meta?.timestamp));
  categories.finished.sort((a, b) => getSafeDate(b.meta?.timestamp) - getSafeDate(a.meta?.timestamp));
  
  const formatDate = (dateStr) => getSafeDate(dateStr)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) || "";
  
  [ { type: 'live', data: categories.live }, { type: 'upcoming', data: categories.upcoming }, { type: 'finished', data: categories.finished } ].forEach(group => {
    let lastDateHeader = "";
    
    group.data.forEach(ch => {
      const meta = ch.meta || {};
      const status = getStatus(meta.status, meta.timestamp);
      const isSyncing = status.class === 'badge-syncing';
      const localTime = getSafeDate(meta.timestamp)?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) || "--:--";
      
      if (group.type !== 'live') {
        const currentDateStr = formatDate(meta.timestamp);
        if (currentDateStr && currentDateStr !== lastDateHeader) {
          const h = document.createElement("div");
          h.className = "date-group-header";
          h.innerText = currentDateStr;
          list.appendChild(h);
          lastDateHeader = currentDateStr;
        }
      }

      let centerUI = "";
      // if (status.label === "UPCOMING" || isSyncing || status.label === "POSTPONED" || status.label === "SUSPENDED" || status.label === "CANCELLED") {
      if (status.class === 'badge-upcoming' || isSyncing || status.class === 'badge-postponed') {
        centerUI = `<div class="start-time-text">${localTime}</div><div class="countdown-mini" id="timer-${ch.id}">00:00:00</div>`;
      } else {
        if (meta.homeScore !== undefined && meta.awayScore !== undefined && meta.homeScore !== null && meta.awayScore !== null) {
          centerUI = `<div class="live-score-text">${meta.homeScore} - ${meta.awayScore}</div>`;
        } else if (meta.awayTeam) {
          centerUI = `<div class="live-score-text">vs</div>`;
        }
      }

      let innerContent = "";
      if (!meta.awayTeam) {
        const isStarted = (status.class === 'badge-live' || status.class === 'badge-finished');
        innerContent = `
          <div class="match-row" style="justify-content: flex-start; gap: 10px;">
             <div style="flex: 2; font-weight: bold; font-size: 14px; white-space: normal; text-align: left;">
                ${isSyncing ? '<span class="skeleton sk-text" style="width:100%"></span>' : (meta.homeTeam || ch.title || 'TBD')}
             </div>
             ${!isStarted ? `<div class="vs-capsule" style="min-width: 80px;">${centerUI}</div>` : ''}
          </div>
        `;
      } else {
        innerContent = `
          <div class="match-row">
            <div class="team-box">
              <div class="logo-frame ${isSyncing?'skeleton sk-circle':''}">
                <img class="team-logo" src="${meta.homeBadge||''}" style="${isSyncing?'display:none':''}" onerror="this.style.display='none'">
              </div>
              <span class="team-name">${isSyncing ? '<span class="skeleton sk-text"></span>' : (meta.homeTeam || 'TBD')}</span>
            </div>
            <div class="vs-capsule">${centerUI}</div>
            <div class="team-box">
              <div class="logo-frame ${isSyncing?'skeleton sk-circle':''}">
                <img class="team-logo" src="${meta.awayBadge||''}" style="${isSyncing?'display:none':''}" onerror="this.style.display='none'">
              </div>
              <span class="team-name">${isSyncing ? '<span class="skeleton sk-text"></span>' : (meta.awayTeam || 'TBD')}</span>
            </div>
          </div>`;
      }

      const showLinks = (status.class === 'badge-finished' && meta.video);
      const matchName = `${meta.homeTeam || ''} vs ${meta.awayTeam || ''}`.trim();

      let targetUrl = "";
      if (group.type === 'finished' && meta.video) {
        targetUrl = meta.video;
      } else if (currentSport == "football") {
        targetUrl = "https://tinyurl.com/yzn79kut";
      } else if (currentSport == "basketball") {
        targetUrl = "https://tinyurl.com/44cepna6";
      } else if (currentSport == "baseball") {
        targetUrl = "https://tinyurl.com/45ezwfz8";
      } else if (currentSport == "hockey") {
        targetUrl = "https://tinyurl.com/4rdfy6jm";
      } else if (currentSport == "american_football") {
        targetUrl = "https://tinyurl.com/mws7ydkr";
      } else if (currentSport == "more_sports") {
        targetUrl = "https://tinyurl.com/4jmhw9bb";
      }

      const card = document.createElement("div");
      card.className = targetUrl ? "channel clickable-card" : "channel";
      if (targetUrl) {
        card.setAttribute("data-url", targetUrl);
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
          <span style="font-size:10px; color:var(--text-muted); font-weight:bold;">${meta.league || ch.league || 'Unknown'}</span>
          <span class="badge ${status.class}">${t(status.label)}</span>
        </div>
        
        ${innerContent}
        
        ${showLinks ? `
            <div class="links-container">
              <button class="stream-link highlight-link" data-video="${meta.video}" data-title="${matchName} - Highlights">
                "Highlights"
              </button>
            </div>
          ` : ''}
      `;
      list.appendChild(card);
    });
  });
}

function updateAllTimers() {
  channels.forEach(ch => {
    const el = document.getElementById(`timer-${ch.id}`);
    if (!el || !ch.meta?.timestamp) return;
    const diff = getSafeDate(ch.meta.timestamp) - getCorrectedNow();
    if (diff > 0) {
      const h = Math.floor(diff/3600000).toString().padStart(2,'0');
      const m = Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
      const s = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
      el.innerText = `${h}:${m}:${s}`;
    } else {
      el.innerText = "00:00:00";
    }
  });
}

// ────────────────────────────────────────────────
// EVENT LISTENERS & STORAGE SYNC
// ────────────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && activeDate) {
    const key = `channels_${currentSport}_${activeDate}`;
    if (changes[key]) {
      channels = changes[key].newValue || [];
      renderList();
    }
  }
});

document.getElementById("search").addEventListener("input", renderList);

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    fetchSportData(e.target.dataset.sport);
  });
});

async function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  document.getElementById('themeBtn').innerHTML = isDark ? "☀️" : "🌙";
  await chrome.storage.local.set({ 'ext-theme': isDark ? 'dark' : 'light' });
}
document.getElementById('themeBtn').addEventListener('click', toggleTheme);

const minimizeBtn = document.getElementById('minimizeBtn');
if (minimizeBtn) {
  minimizeBtn.addEventListener('click', () => {
    window.close();
  });
}

document.getElementById('channelList').addEventListener('click', (e) => {
  const highlightBtn = e.target.closest('.highlight-link');
  if (highlightBtn) {
    const videoUrl = highlightBtn.getAttribute('data-video');
    chrome.tabs.create({ url: videoUrl });
    return;
  }

  const card = e.target.closest('.clickable-card');
  if (card) {
    const targetUrl = card.getAttribute('data-url');
    chrome.tabs.create({ url: targetUrl });
  }
});

window.addEventListener('load', async () => {
  const settings = await chrome.storage.local.get(['ext-theme', 'timeDrift', 'currentSport']);
  if (settings.timeDrift) timeDrift = settings.timeDrift;

  if (settings['ext-theme'] === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('themeBtn').innerHTML = "☀️";
  } else {
    document.getElementById('themeBtn').innerHTML = "🌙";
  }

  const initialSport = settings.currentSport || "football";
  
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.dataset.sport === initialSport) b.classList.add('active');
    else b.classList.remove('active');
  });

  fetchSportData(initialSport);
});