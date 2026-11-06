// background.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.runtime.setUninstallURL("https://docs.google.com/forms/d/e/1FAIpQLSd-m_RrJhgOOWEHBZMGMXhTwO7x57g7tfM5s-d6InzUF_DOkA/viewform");
});


const HIGHLIGHT_REFRESH_MS = 2 * 60 * 1000; // 2 minutes
const HIGHLIGHT_REFRESH_KEY = "lastHighlightCacheRefresh";

const SPORT_CONFIG = {
  football: {
    cache: "https://football-automator2.sportyreplays.workers.dev/",
    dataStorage: "https://football-main20.sportyreplays.workers.dev/"
  },
  basketball: {
    cache: "https://basketball-automator.sportyreplays.workers.dev/",
    dataStorage: "https://basketball-main.sportyreplays.workers.dev/"
  },
  baseball: {
    cache: "https://baseball-hockey-automator.sportyreplays.workers.dev/",
    dataStorage: "https://baseball-main.sportyreplays.workers.dev/"
  },
  american_football: {
    cache: "https://american-football-automator.sportyreplays.workers.dev/",
    dataStorage: "https://american-football-main.sportyreplays.workers.dev/"
  },
  hockey: {
    cache: "https://hockey-automator.sportyreplays.workers.dev/",
    dataStorage: "https://hockey-main.sportyreplays.workers.dev/"
  },
  more_sports: {
    cache: "https://special-events-automator.sportyreplays.workers.dev/",
    dataStorage: "https://special-events-main.sportyreplays.workers.dev/"
  }
};

// UTILS
/** Normalize highlight URLs from any shape the cache may have */
function getHighlightUrls(meta) {
  if (!meta) return [];
  let urls = [];
  if (Array.isArray(meta.videos) && meta.videos.length) {
    urls = meta.videos;
  } else if (Array.isArray(meta.video) && meta.video.length) {
    urls = meta.video;
  } else if (typeof meta.video === "string" && meta.video) {
    urls = [meta.video];
  }
  return [...new Set(urls)].slice(0, 6);
}

/** True when the raw API status is a definitive final result. */
function isApiFinishedStatus(apiStatus) {
  if (!apiStatus) return false;
  return [
    // Common / football
    "STATUS_FULL_TIME",
    "STATUS_FINAL",
    "STATUS_FINAL_AET",
    "STATUS_FINAL_PEN",
  ].includes(apiStatus);
}

function getLocalDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function shiftLocalDateString(dateStr, days) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
}

function localDateToNearbyUtcDates(localDateStr) {
  const [y, m, d] = String(localDateStr).split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  const set = new Set();
  set.add(
    `${start.getUTCFullYear()}-${start.getUTCMonth() + 1}-${start.getUTCDate()}`
  );
  set.add(
    `${end.getUTCFullYear()}-${end.getUTCMonth() + 1}-${end.getUTCDate()}`
  );
  return [...set];
}

const getSafeDate = (utcString) =>
  utcString
    ? new Date(utcString.endsWith("Z") ? utcString : utcString + "Z")
    : null;

function getCorrectedNow(timeDrift = 0) {
  return new Date(Date.now() + timeDrift);
}

function getStatus(apiStatus, timestamp, currentSport = "football", timeDrift = 0) {
  if (!apiStatus && !timestamp)
    return { rank: 10, label: "syncing", class: "badge-syncing" };

  const now = getCorrectedNow(timeDrift);
  const startTime = getSafeDate(timestamp);
  const diffMin = (now - startTime) / 60000;

  if (startTime && currentSport == "football") {
    if (
      diffMin > 190 &&
      ![
        "Match Postponed", "PST", "POST", "STATUS_POSTPONED",
        "Match Suspended", "SUSP", "S", "STATUS_SUSPENDED",
        "Match Cancelled", "CANC", "STATUS_CANCELED", "STATUS_DELAYED",
        "ABD", "INT", "INTR", "AWD", "AW", "WO", "STATUS_FORFEIT"
      ].includes(apiStatus)
    )
      return { rank: 6, label: "finished", class: "badge-finished" };

    if (
      diffMin > 125 &&
      ![
        "STATUS_EXTRA_TIME", "ET", "BT",
        "Match Postponed", "PST", "POST", "STATUS_POSTPONED",
        "Match Suspended", "SUSP", "S", "STATUS_SUSPENDED",
        "Match Cancelled", "CANC", "STATUS_CANCELED", "STATUS_DELAYED",
        "P", "PT", "STATUS_PENALTY_SHOOTOUT", "STATUS_SHOOTOUT",
        "ABD", "INT", "INTR", "AWD", "AW", "WO", "STATUS_FORFEIT"
      ].includes(apiStatus)
    )
      return { rank: 6, label: "finished", class: "badge-finished" };

    if (
      diffMin > 125 &&
      diffMin < 135 &&
      (apiStatus === "P" ||
        apiStatus === "PT" ||
        apiStatus === "PEN" ||
        apiStatus === "STATUS_PENALTY_SHOOTOUT" ||
        apiStatus === "STATUS_SHOOTOUT")
    )
      return { rank: 6, label: "finished", class: "badge-finished" };

    if (apiStatus === "STATUS_EXTRA_TIME" || apiStatus === "ET")
      return { rank: 4, label: "extra_time", class: "badge-live" };

    if (
      apiStatus === "STATUS_PENALTY_SHOOTOUT" ||
      apiStatus === "STATUS_SHOOTOUT" ||
      apiStatus === "P" ||
      apiStatus === "PT"
    )
      return { rank: 5, label: "penalties", class: "badge-live" };

    if (apiStatus === "STATUS_HALFTIME")
      return { rank: 4, label: "halftime", class: "badge-live" };

    if (apiStatus === "STATUS_IN_PROGRESS")
      return { rank: 1, label: "live", class: "badge-live" };

    if (
      ["Match Finished", "F", "FT", "STATUS_FULL_TIME", "STATUS_FINAL"].includes(
        apiStatus
      )
    )
      return { rank: 6, label: "finished", class: "badge-finished" };

    if (apiStatus === "AET" || apiStatus === "STATUS_FINAL_AET")
      return { rank: 6, label: "finished_aet", class: "badge-finished" };

    if (apiStatus === "PEN" || apiStatus === "STATUS_FINAL_PEN")
      return { rank: 6, label: "finished", class: "badge-finished" };

    if (
      ["Match Postponed", "PST", "POST", "STATUS_POSTPONED"].includes(apiStatus)
    )
      return { rank: 3, label: "postponed", class: "badge-postponed" };

    if (
      ["Match Suspended", "SUSP", "S", "STATUS_SUSPENDED"].includes(apiStatus)
    )
      return { rank: 3, label: "suspended", class: "badge-postponed" };

    if (apiStatus === "STATUS_DELAYED")
      return { rank: 3, label: "delayed", class: "badge-postponed" };

    if (["Match Cancelled", "CANC", "STATUS_CANCELED"].includes(apiStatus))
      return { rank: 3, label: "cancelled", class: "badge-postponed" };

    if (apiStatus === "INT" || apiStatus === "INTR")
      return { rank: 3, label: "interrupted", class: "badge-postponed" };

    if (["Match Abandoned", "ABD", "STATUS_ABANDONED"].includes(apiStatus))
      return { rank: 3, label: "abandoned", class: "badge-postponed" };

    if (["AWD", "AW", "STATUS_FORFEIT"].includes(apiStatus))
      return { rank: 3, label: "awarded", class: "badge-postponed" };

    if (apiStatus === "WO")
      return { rank: 3, label: "walkover", class: "badge-postponed" };

    if (
      diffMin > 0 &&
      ![
        "STATUS_DELAYED", "Match Postponed", "PST", "POST", "STATUS_POSTPONED",
        "Match Suspended", "SUSP", "S", "STATUS_SUSPENDED",
        "Match Cancelled", "CANC", "STATUS_CANCELED",
        "ET", "P", "PEN", "Match Finished", "F", "FT",
        "STATUS_FULL_TIME", "STATUS_FINAL", "STATUS_FINAL_AET", "STATUS_FINAL_PEN",
        "ABD", "INT", "INTR", "WO", "AWD", "AW", "STATUS_FORFEIT"
      ].includes(apiStatus)
    )
      return { rank: 1, label: "live", class: "badge-live" };
  }

  if (
    startTime &&
    ["basketball", "hockey", "baseball", "american_football", "more_sports"].includes(
      currentSport
    )
  ) {
    if (
      diffMin > 180 &&
      ![
        "STATUS_DELAYED", "STATUS_EXTRA_TIME", "ET", "BT",
        "Match Postponed", "PST", "POST", "STATUS_POSTPONED",
        "Match Cancelled", "CANC", "STATUS_CANCELED",
        "Match Suspended", "STATUS_SUSPENDED", "SUSP", "S",
        "ABD", "INT", "INTR", "AWD", "AW", "WO", "STATUS_FORFEIT"
      ].includes(apiStatus)
    )
      return { rank: 4, label: "finished", class: "badge-finished" };

    if (apiStatus === "STATUS_HALFTIME")
      return { rank: 4, label: "halftime", class: "badge-live" };

    if (
      ["STATUS_IN_PROGRESS", "STATUS_FIRST_HALF", "STATUS_SECOND_HALF"].includes(
        apiStatus
      )
    )
      return { rank: 1, label: "live", class: "badge-live" };

    if (
      [
        "Match Finished", "Final", "Game Finished", "F", "FT", "AOT",
        "STATUS_FINAL", "STATUS_FULL_TIME"
      ].includes(apiStatus)
    )
      return { rank: 4, label: "finished", class: "badge-finished" };

    if (apiStatus === "AOT")
      return { rank: 4, label: "finished_aot", class: "badge-finished" };

    if (apiStatus === "AP")
      return { rank: 4, label: "finished", class: "badge-finished" };

    if (apiStatus === "RET")
      return { rank: 4, label: "retired", class: "badge-finished" };

    if (apiStatus === "DEF")
      return { rank: 4, label: "defaulted", class: "badge-finished" };

    if (apiStatus === "STATUS_OVERTIME")
      return { rank: 1, label: "overtime", class: "badge-live" };

    if (apiStatus === "STATUS_SHOOTOUT")
      return { rank: 1, label: "shootout", class: "badge-live" };

    if (apiStatus === "STATUS_RAIN_DELAY")
      return { rank: 1, label: "delayed", class: "badge-live" };

    if (
      [
        "Match Postponed", "PST", "POST", "STATUS_POSTPONED", "STATUS_RESCHEDULED"
      ].includes(apiStatus)
    )
      return { rank: 3, label: "postponed", class: "badge-postponed" };

    if (
      ["Match Suspended", "SUSP", "S", "STATUS_SUSPENDED"].includes(apiStatus)
    )
      return { rank: 3, label: "suspended", class: "badge-postponed" };

    if (apiStatus === "STATUS_DELAYED")
      return { rank: 3, label: "delayed", class: "badge-postponed" };

    if (["Match Cancelled", "CANC", "STATUS_CANCELED"].includes(apiStatus))
      return { rank: 3, label: "cancelled", class: "badge-postponed" };

    if (apiStatus === "INTR")
      return { rank: 3, label: "interrupted", class: "badge-postponed" };

    if (
      ["Match Abandoned", "ABD", "STATUS_ABANDONED", "STATUS_FINAL_ABANDONED"].includes(
        apiStatus
      )
    )
      return { rank: 3, label: "abandoned", class: "badge-postponed" };

    if (["AWD", "AW", "STATUS_FORFEIT"].includes(apiStatus))
      return { rank: 3, label: "awarded", class: "badge-postponed" };

    if (apiStatus === "WO")
      return { rank: 3, label: "walkover", class: "badge-postponed" };

    if (
      diffMin > 0 &&
      ![
        "STATUS_DELAYED", "Match Postponed", "PST", "POST", "STATUS_POSTPONED",
        "Match Cancelled", "CANC", "STATUS_CANCELED",
        "Match Suspended", "STATUS_SUSPENDED", "SUSP", "S",
        "Match Finished", "F", "FT", "STATUS_FINAL", "STATUS_FULL_TIME",
        "ABD", "STATUS_ABANDONED", "INT", "INTR", "WO", "AWD", "AW", "STATUS_FORFEIT"
      ].includes(apiStatus)
    )
      return { rank: 1, label: "live", class: "badge-live" };
  }

  if (["Not Started", "NS", "STATUS_SCHEDULED"].includes(apiStatus))
    return { rank: 2, label: "upcoming", class: "badge-upcoming" };

  return { rank: 10, label: "syncing", class: "badge-syncing" };
}

async function fetchCacheForDate(config, dateStr) {
  if (!config?.cache || !dateStr) return [];
  try {
    const resp = await fetch(`${config.cache}?date=${dateStr}`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

// HIGHLIGHT CACHE MERGE

async function refreshHighlightVideos(
  currentSport,
  channelsKey,
  channels,
  activeDate,
  userPicked
) {
  const config = SPORT_CONFIG[currentSport];
  if (!config?.cache || !activeDate || !Array.isArray(channels) || !channels.length)
    return channels;

  try {
    const stored = await chrome.storage.local.get(HIGHLIGHT_REFRESH_KEY);
    const last = stored[HIGHLIGHT_REFRESH_KEY] || 0;
    if (Date.now() - last < HIGHLIGHT_REFRESH_MS) return channels;

    const utcDates = new Set();
    if (userPicked) {
      localDateToNearbyUtcDates(activeDate).forEach((u) => utcDates.add(u));
    } else {
      localDateToNearbyUtcDates(shiftLocalDateString(activeDate, -1)).forEach(
        (u) => utcDates.add(u)
      );
      localDateToNearbyUtcDates(activeDate).forEach((u) => utcDates.add(u));
      localDateToNearbyUtcDates(shiftLocalDateString(activeDate, 1)).forEach(
        (u) => utcDates.add(u)
      );
    }

    const lists = await Promise.all(
      [...utcDates].map((u) => fetchCacheForDate(config, u))
    );
    const remote = lists.flat().filter(Boolean);

    const videoById = new Map();
    remote.forEach((ch) => {
      const id = String(ch.eventId ?? ch.id ?? "");
      const urls = getHighlightUrls(ch.meta);
      if (id && urls.length) videoById.set(id, urls);
    });

    let changed = false;
    channels.forEach((ch) => {
      const id = String(ch.eventId ?? ch.id ?? "");
      const remoteUrls = videoById.get(id);
      if (!remoteUrls?.length) return;

      const existing = getHighlightUrls(ch.meta);
      const merged = [...new Set([...existing, ...remoteUrls])].slice(0, 6);

      if (merged.join("|") !== existing.join("|")) {
        ch.meta = {
          ...(ch.meta || {}),
          videos: merged,
          video: merged[0]
        };
        changed = true;
      }
    });

    await chrome.storage.local.set({ [HIGHLIGHT_REFRESH_KEY]: Date.now() });

    if (changed) {
      await chrome.storage.local.set({ [channelsKey]: channels });
    }
  } catch (e) {
    // ignore network errors
  }
  return channels;
}

// INITIALIZATION & ALARMS

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting side panel behavior:", error));

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("fetchMatchData", { periodInMinutes: 0.5 }); // 0.5 minute
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "fetchMatchData") {
    await performBackgroundBatchFetch();
  }
});

// BACKGROUND DATA FETCHING

async function performBackgroundBatchFetch() {
  let currentSport = "football";
  let timeDrift = 0;
  let channelsKey = "";
  let channels = [];
  let activeDate = null;
  let userPicked = false;

  try {
    const storage = await chrome.storage.local.get([
      "currentSport",
      "timeDrift",
      "activeDate",
      "userSelectedDate",
      "userPickedDate"
    ]);
    currentSport = storage.currentSport || "football";
    timeDrift = storage.timeDrift || 0;
    userPicked = !!storage.userPickedDate && !!storage.userSelectedDate;

    activeDate =
      (userPicked && storage.userSelectedDate) ||
      storage.activeDate ||
      getLocalDateString(0);

    channelsKey = `channels_${currentSport}_${activeDate}`;
    const data = await chrome.storage.local.get([channelsKey]);

    if (
      data?.[channelsKey] &&
      Array.isArray(data[channelsKey]) &&
      data[channelsKey].length > 0
    ) {
      channels = data[channelsKey];
    } else {
      const todayLocal = getLocalDateString(0);
      const yesterdayLocal = getLocalDateString(-1);
      const tomorrowLocal = getLocalDateString(1);
      for (const d of [todayLocal, yesterdayLocal, tomorrowLocal]) {
        const key = `channels_${currentSport}_${d}`;
        const fallback = await chrome.storage.local.get([key]);
        if (fallback?.[key]?.length) {
          channelsKey = key;
          channels = fallback[key];
          activeDate = d;
          break;
        }
      }
    }
  } catch (e) {
    return;
  }

  if (!channels || channels.length === 0 || !channelsKey || !activeDate) return;

  const config = SPORT_CONFIG[currentSport];
  if (!config || !config.dataStorage) return;

  // Only poll scores for local yesterday / today / tomorrow
  const todayLocal = getLocalDateString(0);
  const yesterdayLocal = getLocalDateString(-1);
  const tomorrowLocal = getLocalDateString(1);
  const inScoreWindow = !!activeDate; // any loaded day in storage

  /* deprecated
  // to poll for only yesterday, today, tomorrow
  const inScoreWindow =
    activeDate === todayLocal ||
    activeDate === yesterdayLocal ||
    activeDate === tomorrowLocal;
  */

  /* deprecated 
  // to always poll for whatever is on screen (including any picked date)
  inScoreWindow = true;
  */

  let standardChannels = [];

  if (inScoreWindow) {
    standardChannels = channels.filter((c) => c.apiURL || c.eventId);

    standardChannels = standardChannels.filter((ch) => {
      if (!ch.meta) return false;

      const status = getStatus(
        ch.meta.status,
        ch.meta.timestamp,
        currentSport,
        timeDrift
      );

      if (status.class === "badge-live") return true;

      if (status.class === "badge-postponed") {   // includes delayed, interrupted matches etc
        return true;
      }

      // Finished badge, but API status is not a true final → still needs update
      if (status.class === "badge-finished") {
        return !isApiFinishedStatus(ch.meta.status);
      }

      return false;
    });
  }

  if (standardChannels.length > 0) {
    const batchSize = 10;
    let allData = [];

    for (let i = 0; i < standardChannels.length; i += batchSize) {
      const slugs = standardChannels
        .slice(i, i + batchSize)
        .map((ch) => ch.eventId)
        .filter(Boolean)
        .join(",");
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
        // continue next batch
      }
    }

    if (allData.length > 0) {
      allData.forEach((matchData) => {
        const channel = channels.find(
          (c) => String(c.eventId) === String(matchData.id)
        );
        if (!channel) return;

        // Preserve any existing highlight videos
        const existingUrls = getHighlightUrls(channel.meta);
        const incomingUrls = getHighlightUrls(matchData);
        const mergedUrls = [...new Set([...existingUrls, ...incomingUrls])].slice(0, 6);

        channel.meta = {
          ...matchData,
          ...(mergedUrls.length
            ? { videos: mergedUrls, video: mergedUrls[0] }
            : {})
        };
      });

      try {
        await chrome.storage.local.set({ [channelsKey]: channels });
      } catch (e) {
        // ignore storage errors
      }
    }
  }

  await refreshHighlightVideos(
    currentSport,
    channelsKey,
    channels,
    activeDate,
    userPicked
  );
}