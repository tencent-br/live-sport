// background.js

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

  const standardChannels = channels.filter(c => c.apiURL || c.eventId);
  if (standardChannels.length === 0) return;

  const batchSize = 5;
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
