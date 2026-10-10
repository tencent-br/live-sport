// background.js

const SPORT_CONFIG = {
  "football": {
    cache: "https://football-automator2.sportyreplays.workers.dev/",
    dataStorage: "https://football-main20.sportyreplays.workers.dev/"
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
// UTILS
// ────────────────────────────────────────────────
function getFormattedDate(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setUTCDate(d.getUTCDate() + offsetDays);
  }
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

// ────────────────────────────────────────────────
// UTILS (needed for live-match filtering)
// ────────────────────────────────────────────────
const getSafeDate = (utcString) => utcString ? new Date(utcString.endsWith('Z') ? utcString : utcString + 'Z') : null;

function getCorrectedNow(timeDrift = 0) {
  return new Date(Date.now() + timeDrift);
}

function getStatus(apiStatus, timestamp, currentSport = "football", timeDrift = 0) {
  if (!apiStatus && !timestamp)
    return { rank: 10, label: 'syncing', class: 'badge-syncing' };

  const now = getCorrectedNow(timeDrift);
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

  // Fallback so .label is never undefined
  return { rank: 10, label: 'syncing', class: 'badge-syncing' };
}

// ────────────────────────────────────────────────
// INITIALIZATION & ALARMS
// ────────────────────────────────────────────────
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting side panel behavior:", error));

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("fetchMatchData", { periodInMinutes: 0.5 }); // 30 seconds
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "fetchMatchData") {
    await performBackgroundBatchFetch();
  }
});

// ────────────────────────────────────────────────
// BACKGROUND DATA FETCHING
// ────────────────────────────────────────────────

async function performBackgroundBatchFetch() {
  let currentSport = "football";
  let timeDrift = 0;
  let channelsKey = "";
  let channels = [];

  try {
    const storage = await chrome.storage.local.get(["currentSport", "timeDrift"]);
    currentSport = storage.currentSport || "football";
    timeDrift = storage.timeDrift || 0;

    const todayDate = getFormattedDate(0);
    const yesterdayDate = getFormattedDate(-1);

    // 1. Check for today's cache key first
    const todayKey = `channels_${currentSport}_${todayDate}`;
    const todayData = await chrome.storage.local.get([todayKey]);

    if (todayData?.[todayKey] && todayData[todayKey].length > 0) {
      channelsKey = todayKey;
      channels = todayData[todayKey];
    } else {
      // 2. Fall back to yesterday's cache key if today's is not present/populated
      const yesterdayKey = `channels_${currentSport}_${yesterdayDate}`;
      const yesterdayData = await chrome.storage.local.get([yesterdayKey]);

      if (yesterdayData?.[yesterdayKey] && yesterdayData[yesterdayKey].length > 0) {
        channelsKey = yesterdayKey;
        channels = yesterdayData[yesterdayKey];
      }
    }
  } catch (e) {
    return;
  }

  if (!channels || channels.length === 0 || !channelsKey) return;

  const config = SPORT_CONFIG[currentSport];
  if (!config || !config.dataStorage) return;

  let standardChannels = channels.filter(c => c.apiURL || c.eventId);
  // Only fetch:
  // 1. Live / in-progress matches
  // 2. Finished matches that still don't have a final score
  standardChannels = standardChannels.filter(ch => {
    if (!ch.meta) return false;

    const status = getStatus(ch.meta.status, ch.meta.timestamp, currentSport, timeDrift);
    const label = status.label;

    // Always keep truly live / in-progress states
    if (['live', 'extra_time', 'halftime', 'penalties', 'delayed'].includes(label)) {
      return true;
    }

    // For finished matches: keep fetching ONLY until both scores exist
    if (['finished', 'finished_aet', 'finished_aot'].includes(label)) {
      const hasFinalScore =
        typeof ch.meta.homeScore === 'number' &&
        typeof ch.meta.awayScore === 'number';

      // Still missing the final score → keep requesting this match
      return !hasFinalScore;
    }

    return false;
  });



  if (standardChannels.length === 0) return;

  const batchSize = 10;
  let allData = [];

  for (let i = 0; i < standardChannels.length; i += batchSize) {
    const slugs = standardChannels.slice(i, i + batchSize).map(ch => ch.eventId).filter(Boolean).join(',');
    if (!slugs) continue;

    try {
      const resp = await fetch(`${config.dataStorage}?ids=${slugs}`);
      const json = await resp.json();

      if (json.serverTime && timeDrift === 0) {
        timeDrift = new Date(json.serverTime).getTime() - Date.now();
        await chrome.storage.local.set({ timeDrift }); 
      }

      if (json.data && Array.isArray(json.data)) {
        allData.push(...json.data);
      }
    } catch (e) {
      // Continue next batch if one fails
    }
  }

  if (allData.length > 0) {
    allData.forEach(matchData => {
      const channel = channels.find(c => String(c.eventId) === String(matchData.id));
      if (channel) {
        channel.meta = matchData;
      }
    });

    try {
      // Save updated channel data back to whichever key (today's or yesterday's) was active
      await chrome.storage.local.set({ [channelsKey]: channels });
    } catch (e) {
      // Handle storage write error silently
    }
  }
}
