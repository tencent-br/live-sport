// popup.js
/* v1.11
date picker + pin + league filter (by leagueSlug) + collapsible sections
local-TZ filter · adjacent cache merge · dedupe · pin by eventId
default view: local yesterday + today + tomorrow
score refresh banner when finished badges still need API final status
settings page for competition preferences
multi-highlight support (up to 6)
Optional: Reuse an existing YouTube tab when opening highlights instead of creating a new tab each time.
*/

let timeDrift = 0;
let channels = [];
let currentSport = "football";
let batchInterval;
let timerInterval;
let activeDate = null;

let selectedDate = null;
let userPickedDate = false;

let pinnedMap = {};
const PINNED_STORAGE_KEY = "pinnedEventsBySport";

const LEAGUE_FILTER_KEY = "leagueFilterBySport";
let selectedLeagues = {}; // sport → Set of leagueSlug strings

const SECTION_STATE_KEY = "sectionCollapseBySport";
let sectionCollapsed = {};

// UTILS

function isApiFinishedStatus(apiStatus) {
  if (!apiStatus) return false;
  return [
    "STATUS_FULL_TIME",
    "STATUS_FINAL",
    "STATUS_FINAL_AET",
    "STATUS_FINAL_PEN"
  ].includes(apiStatus);
}

function setScoreRefreshBanner(show) {
  const el = document.getElementById("scoreRefreshBanner");
  if (el) el.classList.toggle("visible", !!show);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getSafeDate = (utcString) =>
  utcString
    ? new Date(utcString.endsWith("Z") ? utcString : utcString + "Z")
    : null;
const getCorrectedNow = () => new Date(Date.now() + timeDrift);

/** Normalize highlight URLs from any shape the cache may have */
function getHighlightUrls(meta) {
  if (!meta) return [];
  let urls = [];
  if (Array.isArray(meta.videos) && meta.videos.length) {
    urls = meta.videos;
  } else if (Array.isArray(meta.video) && meta.video.length) {
    urls = meta.video;                 // legacy array-in-video
  } else if (typeof meta.video === "string" && meta.video) {
    urls = [meta.video];
  }
  return [...new Set(urls)].slice(0, 6); // unique, max 6
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

function parseLocalDateMs(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

function timestampToLocalDateStr(utcString) {
  const d = getSafeDate(utcString);
  if (!d || Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function toIsoDateInput(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function fromIsoDateInput(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}-${m}-${d}`;
}

function formatDateStatus(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const lang = document.getElementById("langSwitcher")?.value || undefined;
  return dt.toLocaleDateString(lang, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getStatus(apiStatus, timestamp) {
  if (!apiStatus && !timestamp)
    return { rank: 10, label: "syncing", class: "badge-syncing" };

  const now = getCorrectedNow();
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

// DEDUPE / LOCAL FILTER

function channelKey(ch) {
  return String(ch.eventId || ch.id || "");
}

function normalizeTeamName(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function teamsMatch(a, b) {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  return !!(na && nb && (na === nb || na.includes(nb) || nb.includes(na)));
}

function matchDisplayRank(ch) {
  const meta = ch.meta || {};
  if (getHighlightUrls(meta).length) return 0;
  const cls = getStatus(meta.status, meta.timestamp).class;
  if (cls === "badge-live") return 1;
  if (cls === "badge-finished") return 2;
  if (cls === "badge-upcoming") return 3;
  if (cls === "badge-postponed") return 4;
  return 5;
}

function mergeChannelsByEventId(lists) {
  const best = new Map();
  lists.flat().forEach((ch) => {
    if (!ch) return;
    const key = channelKey(ch);
    if (!key) return;
    const prev = best.get(key);
    if (!prev || matchDisplayRank(ch) < matchDisplayRank(prev)) {
      best.set(key, ch);
    }
  });
  return Array.from(best.values());
}

function matchIdentityKey(ch) {
  const meta = ch.meta || {};
  if (ch.eventId) return `eid:${ch.eventId}`;
  const day = timestampToLocalDateStr(meta.timestamp) || "";
  const home = normalizeTeamName(meta.homeTeam || "");
  const away = normalizeTeamName(meta.awayTeam || "");
  return `teams:${day}|${home}|${away}`;
}

function dedupeByMatchIdentity(list) {
  const best = new Map();
  list.forEach((ch) => {
    if (!ch) return;
    const key = matchIdentityKey(ch);
    const prev = best.get(key);
    if (!prev || matchDisplayRank(ch) < matchDisplayRank(prev)) {
      best.set(key, ch);
    }
  });
  return Array.from(best.values());
}

function filterChannelsByLocalDate(list, localDateStr) {
  return list.filter(
    (ch) => timestampToLocalDateStr(ch.meta?.timestamp) === localDateStr
  );
}

function filterChannelsByLocalDateRange(list, startLocal, endLocal) {
  const start = parseLocalDateMs(startLocal);
  const end = parseLocalDateMs(endLocal);
  return list.filter((ch) => {
    const day = timestampToLocalDateStr(ch.meta?.timestamp);
    if (!day) return false;
    const t = parseLocalDateMs(day);
    return t >= start && t <= end;
  });
}

function applyLocalDateView(list) {
  if (!Array.isArray(list) || !list.length) return [];

  let out = mergeChannelsByEventId([list]);
  out = dedupeByMatchIdentity(out);

  if (userPickedDate && selectedDate) {
    return filterChannelsByLocalDate(out, selectedDate);
  }

  const center = activeDate || getLocalDateString(0);
  const start = shiftLocalDateString(center, -1);
  const end = shiftLocalDateString(center, 1);
  return filterChannelsByLocalDateRange(out, start, end);
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

async function loadMergedForLocalDate(config, localDateStr, includeAdjacent = false) {
  const utcDates = new Set(localDateToNearbyUtcDates(localDateStr));
  if (includeAdjacent) {
    localDateToNearbyUtcDates(shiftLocalDateString(localDateStr, -1)).forEach(
      (u) => utcDates.add(u)
    );
    localDateToNearbyUtcDates(shiftLocalDateString(localDateStr, 1)).forEach(
      (u) => utcDates.add(u)
    );
  }

  const lists = await Promise.all(
    [...utcDates].map((u) => fetchCacheForDate(config, u))
  );
  let merged = mergeChannelsByEventId(lists);
  merged = dedupeByMatchIdentity(merged);

  if (includeAdjacent) {
    return filterChannelsByLocalDateRange(
      merged,
      shiftLocalDateString(localDateStr, -1),
      shiftLocalDateString(localDateStr, 1)
    );
  }
  return filterChannelsByLocalDate(merged, localDateStr);
}

// SCOREBOARD MERGE

function mergeScoreboardMeta(existingMeta, matchData) {
  const existing = existingMeta || {};
  const incoming = matchData || {};

  // Prefer the richer highlight set
  const existingVideos = getHighlightUrls(existing);
  const incomingVideos = getHighlightUrls(incoming);
  const mergedVideos = [...new Set([...existingVideos, ...incomingVideos])].slice(0, 6);
  const videoField = mergedVideos.length ? mergedVideos[0] : undefined;

  const eHome = existing.homeTeam;
  const eAway = existing.awayTeam;
  const mHome = incoming.homeTeam;
  const mAway = incoming.awayTeam;

  const base = {
    ...(mergedVideos.length ? { videos: mergedVideos, video: videoField } : {})
  };

  if (!eHome && !eAway) {
    return { ...incoming, ...base };
  }

  if (teamsMatch(eHome, mHome) && teamsMatch(eAway, mAway)) {
    return {
      ...existing,
      ...incoming,
      homeTeam: eHome,
      awayTeam: eAway,
      homeBadge: existing.homeBadge || incoming.homeBadge,
      awayBadge: existing.awayBadge || incoming.awayBadge,
      homeScore: incoming.homeScore ?? existing.homeScore,
      awayScore: incoming.awayScore ?? existing.awayScore,
      status: incoming.status ?? existing.status,
      timestamp: incoming.timestamp || existing.timestamp,
      league: existing.league || incoming.league,
      leagueSlug: existing.leagueSlug || incoming.leagueSlug,
      ...base
    };
  }

  if (teamsMatch(eHome, mAway) && teamsMatch(eAway, mHome)) {
    return {
      ...existing,
      ...incoming,
      homeTeam: eHome,
      awayTeam: eAway,
      homeBadge: existing.homeBadge || incoming.awayBadge,
      awayBadge: existing.awayBadge || incoming.homeBadge,
      homeScore: incoming.awayScore ?? existing.homeScore,
      awayScore: incoming.homeScore ?? existing.awayScore,
      status: incoming.status ?? existing.status,
      timestamp: incoming.timestamp || existing.timestamp,
      league: existing.league || incoming.league,
      leagueSlug: existing.leagueSlug || incoming.leagueSlug,
      ...base
    };
  }

  return { ...incoming, ...base };
}

// SECTION COLLAPSE

async function loadSectionState() {
  const res = await chrome.storage.local.get(SECTION_STATE_KEY);
  sectionCollapsed = res[SECTION_STATE_KEY] || {};
}

async function saveSectionState() {
  await chrome.storage.local.set({ [SECTION_STATE_KEY]: sectionCollapsed });
}

function getDefaultCollapsed(key, presentKeys) {
  if (key === "pinned") return false;
  if (presentKeys.length <= 1) return false;
  return true;
}

function isSectionCollapsed(key, presentKeys) {
  const sportState = sectionCollapsed[currentSport] || {};
  if (key in sportState) return sportState[key];
  return getDefaultCollapsed(key, presentKeys || []);
}

function toggleSection(key) {
  if (!sectionCollapsed[currentSport]) sectionCollapsed[currentSport] = {};
  const presentKeys = window.__presentSectionKeys || [];
  const currentlyCollapsed = isSectionCollapsed(key, presentKeys);
  sectionCollapsed[currentSport][key] = !currentlyCollapsed;
  saveSectionState();
  renderList();
}

function makeSectionHeader(title, count, key, presentKeys) {
  const collapsed = isSectionCollapsed(key, presentKeys);
  const header = document.createElement("div");
  header.className = "section-header" + (collapsed ? " collapsed" : "");
  const icons = { pinned: "⭐", live: "🔴", upcoming: "🕒", finished: "✅" };
  const icon = icons[key.toLowerCase()] || "";
  header.innerHTML = `
    <span class="section-title">
      <span class="section-icon">${icon}</span>
      ${title} (${count})
    </span>
    <span class="chevron">${collapsed ? "▸" : "▾"}</span>
  `;
  header.addEventListener("click", () => toggleSection(key));
  return header;
}

function appendSection(list, key, title, items, options = {}) {
  if (!items.length) return;
  const presentKeys = options.presentKeys || [];

  const formatLocalHeader = (utcString) => {
    const d = getSafeDate(utcString);
    if (!d) return "";
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  list.appendChild(makeSectionHeader(title, items.length, key, presentKeys));

  const body = document.createElement("div");
  body.className =
    "section-body" +
    (isSectionCollapsed(key, presentKeys) ? " collapsed" : "");

  let lastDateHeader = "";
  items.forEach((ch) => {
    if (options.showDateHeaders) {
      const currentDateStr = formatLocalHeader(ch.meta?.timestamp);
      if (currentDateStr && currentDateStr !== lastDateHeader) {
        const h = document.createElement("div");
        h.className = "date-group-header";
        h.textContent = currentDateStr;
        body.appendChild(h);
        lastDateHeader = currentDateStr;
      }
    }
    appendEventCard(body, ch);
  });

  list.appendChild(body);
}

// PIN

function pinKey(ch) {
  return String(ch.eventId || ch.id || "");
}

async function loadPinned() {
  const result = await chrome.storage.local.get(PINNED_STORAGE_KEY);
  const raw = result[PINNED_STORAGE_KEY] || {};
  pinnedMap = {};
  for (const sport in raw) {
    const sportData = raw[sport];
    if (Array.isArray(sportData)) {
      pinnedMap[sport] = {};
      continue;
    }
    pinnedMap[sport] = {};
    if (sportData && typeof sportData === "object") {
      for (const date in sportData) {
        pinnedMap[sport][date] = new Set((sportData[date] || []).map(String));
      }
    }
  }
}

async function savePinned() {
  const toSave = {};
  for (const sport in pinnedMap) {
    toSave[sport] = {};
    for (const date in pinnedMap[sport]) {
      const ids = Array.from(pinnedMap[sport][date] || []);
      if (ids.length) toSave[sport][date] = ids;
    }
  }
  await chrome.storage.local.set({ [PINNED_STORAGE_KEY]: toSave });
}

function isPinned(ch) {
  if (!activeDate || !ch) return false;
  return pinnedMap[currentSport]?.[activeDate]?.has(pinKey(ch)) === true;
}

function togglePin(ch) {
  if (!activeDate || !ch) return;
  const sport = currentSport;
  if (!pinnedMap[sport]) pinnedMap[sport] = {};
  if (!pinnedMap[sport][activeDate]) pinnedMap[sport][activeDate] = new Set();

  const key = pinKey(ch);
  if (pinnedMap[sport][activeDate].has(key)) {
    pinnedMap[sport][activeDate].delete(key);
  } else {
    pinnedMap[sport][activeDate].add(key);
  }
  savePinned();
  renderList();
}

// LEAGUE FILTER (by leagueSlug)

function leagueSlugOf(ch) {
  return String(ch.meta?.leagueSlug || ch.leagueSlug || "")
    .trim()
    .toLowerCase();
}

function leagueLabelOf(ch) {
  return (ch.meta?.league || ch.league || leagueSlugOf(ch) || "Unknown").trim();
}

async function loadLeagueFilters() {
  const result = await chrome.storage.local.get(LEAGUE_FILTER_KEY);
  const raw = result[LEAGUE_FILTER_KEY] || {};
  selectedLeagues = {};
  for (const sport in raw) {
    selectedLeagues[sport] = new Set((raw[sport] || []).map(String));
  }
}

async function saveLeagueFilters() {
  const toSave = {};
  for (const sport in selectedLeagues) {
    const arr = Array.from(selectedLeagues[sport] || []);
    if (arr.length) toSave[sport] = arr;
  }
  await chrome.storage.local.set({ [LEAGUE_FILTER_KEY]: toSave });
}

function getActiveLeagueSet() {
  return selectedLeagues[currentSport] || new Set();
}

function passesLeagueFilter(ch) {
  const active = getActiveLeagueSet();
  if (active.size === 0) return true; // empty = show all
  const slug = leagueSlugOf(ch);
  return !!slug && active.has(slug);
}

/** For the in-panel quick filter: group by slug, show display name */
function collectLeaguesFromChannels() {
  const map = new Map(); // slug → { name, count }
  channels.forEach((ch) => {
    const slug = leagueSlugOf(ch);
    if (!slug) return;
    const name = leagueLabelOf(ch);
    const prev = map.get(slug) || { name, count: 0 };
    prev.count += 1;
    if (name && name !== slug) prev.name = name;
    map.set(slug, prev);
  });
  return [...map.entries()]
    .map(([slug, { name, count }]) => [slug, name, count])
    .sort((a, b) => a[1].localeCompare(b[1]));
}

function updateLeagueFilterButton() {
  const btn = document.getElementById("leagueFilterBtn");
  const countEl = document.getElementById("leagueFilterCount");
  if (!btn || !countEl) return;
  const n = getActiveLeagueSet().size;
  btn.classList.toggle("active", n > 0);
  if (n > 0) {
    countEl.hidden = false;
    countEl.textContent = String(n);
  } else {
    countEl.hidden = true;
  }
}

function buildLeagueFilterPanel() {
  const list = document.getElementById("leagueFilterList");
  if (!list) return;
  const leagues = collectLeaguesFromChannels();
  const active = getActiveLeagueSet();
  list.innerHTML = "";
  if (leagues.length === 0) {
    list.innerHTML =
      '<div style="padding:8px;font-size:12px;color:var(--text-muted);">No leagues on this date. Prefer Settings ⚙️ for full list.</div>';
    updateLeagueFilterButton();
    return;
  }
  leagues.forEach(([slug, name, count]) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = slug;
    cb.checked = active.size > 0 && active.has(slug);
    cb.addEventListener("change", () => {
      if (!selectedLeagues[currentSport]) {
        selectedLeagues[currentSport] = new Set();
      }
      if (cb.checked) selectedLeagues[currentSport].add(slug);
      else selectedLeagues[currentSport].delete(slug);
      saveLeagueFilters();
      updateLeagueFilterButton();
      renderList();
    });
    const text = document.createElement("span");
    text.textContent = `${name} (${count})`;
    label.append(cb, text);
    list.appendChild(label);
  });
  updateLeagueFilterButton();
}

function toggleLeaguePanel() {
  const panel = document.getElementById("leagueFilterPanel");
  if (!panel) return;
  const open = panel.hidden;
  panel.hidden = !open;
  if (open) buildLeagueFilterPanel();
}

// DATE PICKER UI

function updateDatePickerUI() {
  const btn = document.getElementById("datePickerBtn");
  const input = document.getElementById("datePickerInput");
  const hint = document.getElementById("dateHint");
  if (!btn || !input || !hint) return;

  const effective = selectedDate || getLocalDateString(0);
  input.value = toIsoDateInput(effective);

  const showing = typeof t === "function" ? t("showing") : "Showing";
  const defaultView =
    typeof t === "function" ? t("reset") : "Default view";

  btn.classList.toggle("active-date", !!userPickedDate);
  btn.title =
    typeof t === "function" ? t("select_date") || "Select a date" : "Select a date";

  if (userPickedDate && selectedDate) {
    hint.innerHTML = `${showing}: <strong>${formatDateStatus(
      selectedDate
    )}</strong> · <button type="button" id="resetDateBtn">${defaultView}</button>`;
    document.getElementById("resetDateBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      resetToAutoDate();
    });
  } else {
    const center = activeDate || getLocalDateString(0);
    const yest = formatDateStatus(shiftLocalDateString(center, -1));
    const tom = formatDateStatus(shiftLocalDateString(center, 1));
    hint.innerHTML = `${showing}: <strong>${yest} – ${tom}</strong>`;
  }
}

function openDatePicker() {
  const input = document.getElementById("datePickerInput");
  if (!input) return;
  input.value = toIsoDateInput(selectedDate || getLocalDateString(0));
  if (typeof input.showPicker === "function") input.showPicker();
  else input.click();
}

async function persistViewState() {
  const payload = {
    currentSport,
    activeDate: activeDate || getLocalDateString(0),
    userPickedDate: !!userPickedDate
  };
  if (userPickedDate && selectedDate) {
    payload.userSelectedDate = selectedDate;
  } else {
    await chrome.storage.local.remove("userSelectedDate");
  }
  await chrome.storage.local.set(payload);
}

async function resetToAutoDate() {
  userPickedDate = false;
  selectedDate = null;
  await chrome.storage.local.remove("userSelectedDate");
  updateDatePickerUI();
  await fetchSportData(currentSport);
}

// DATA LOAD

async function fetchSportData(sport) {
  currentSport = sport;
  await chrome.storage.local.set({ currentSport: sport });

  const loader = document.getElementById("loadingOverlay");
  if (loader) loader.style.display = "flex";
  setScoreRefreshBanner(false);

  channels = [];
  const config = SPORT_CONFIG[sport];

  if (userPickedDate && selectedDate) {
    channels = await loadMergedForLocalDate(config, selectedDate, false);
    activeDate = selectedDate;
  } else {
    const todayLocal = getLocalDateString(0);
    channels = await loadMergedForLocalDate(config, todayLocal, true);
    activeDate = todayLocal;
    selectedDate = null;
  }

  channels = applyLocalDateView(channels);

  if (channels.length && activeDate) {
    await loadFromLocalCache(activeDate);
    channels = applyLocalDateView(channels);
    const cacheKey = `channels_${currentSport}_${activeDate}`;
    await chrome.storage.local.set({
      [cacheKey]: JSON.parse(JSON.stringify(channels))
    });
  }

  await persistViewState();

  if (loader) loader.style.display = "none";
  updateDatePickerUI();
  updateLeagueFilterButton();
  renderList();
  await performBatchFetch(true);

  clearInterval(timerInterval);
  timerInterval = setInterval(updateAllTimers, 1000);
}

async function loadUserDate(dateStr) {
  userPickedDate = true;
  selectedDate = dateStr;
  await chrome.storage.local.set({
    userSelectedDate: dateStr,
    currentSport,
    activeDate: dateStr,
    userPickedDate: true
  });

  const loader = document.getElementById("loadingOverlay");
  if (loader) loader.style.display = "flex";
  setScoreRefreshBanner(false);

  const config = SPORT_CONFIG[currentSport];
  channels = await loadMergedForLocalDate(config, dateStr, false);
  activeDate = dateStr;
  channels = applyLocalDateView(channels);

  if (channels.length) {
    await loadFromLocalCache(activeDate);
    channels = applyLocalDateView(channels);
    const cacheKey = `channels_${currentSport}_${activeDate}`;
    await chrome.storage.local.set({
      [cacheKey]: JSON.parse(JSON.stringify(channels))
    });
  }

  await persistViewState();

  if (loader) loader.style.display = "none";
  updateDatePickerUI();
  updateLeagueFilterButton();
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
      result[cacheKey].map((ch) => [String(ch.eventId || ch.id), ch])
    );

    channels = channels.map((ch) => {
      const cachedItem = cachedMap[String(ch.eventId || ch.id)];
      if (!cachedItem) return ch;

      const mergedMeta = {
        ...(ch.meta || {}),
        ...(cachedItem.meta || {})
      };

      // Keep the best highlight set
      const urls = getHighlightUrls(mergedMeta);
      if (urls.length) {
        mergedMeta.videos = urls;
        mergedMeta.video  = urls[0];
      }

      return { ...ch, meta: mergedMeta };
    });
  }
}

async function performBatchFetch(isInitial = false) {
  const config = SPORT_CONFIG[currentSport];
  if (!config || !config.dataStorage) {
    setScoreRefreshBanner(false);
    return;
  }

  const viewing = userPickedDate && selectedDate ? selectedDate : activeDate;
  const inScoreWindow = !!viewing;

  async function saveToLocal() {
    if (!activeDate) return;
    const cacheKey = `channels_${currentSport}_${activeDate}`;
    await chrome.storage.local.set({
      [cacheKey]: JSON.parse(JSON.stringify(channels))
    });
  }

  if (!inScoreWindow) {
    setScoreRefreshBanner(false);
    channels = applyLocalDateView(channels);
    await saveToLocal();
    renderList();
    await refreshHighlightVideos();
    return;
  }

  let standardChannels = channels.filter((c) => c.apiURL || c.eventId);

  standardChannels = standardChannels.filter((ch) => {
    if (!ch.meta) return false;
    const status = getStatus(ch.meta.status, ch.meta.timestamp);

    if (status.class === "badge-live") return true;
    if (status.class === "badge-postponed") return true;

    if (status.class === "badge-finished") {
      return !isApiFinishedStatus(ch.meta.status);
    }
    return false;
  });

  const refreshingFinished = standardChannels.some((ch) => {
    const st = getStatus(ch.meta?.status, ch.meta?.timestamp);
    return st.class === "badge-finished" && !isApiFinishedStatus(ch.meta?.status);
  });
  setScoreRefreshBanner(refreshingFinished);

  if (standardChannels.length === 0) {
    setScoreRefreshBanner(false);
    channels = applyLocalDateView(channels);
    await saveToLocal();
    renderList();
    await refreshHighlightVideos();
    return;
  }

  const batchSize = 10;
  let allData = [];

  try {
    for (let i = 0; i < standardChannels.length; i += batchSize) {
      const slugs = standardChannels
        .slice(i, i + batchSize)
        .map((ch) => ch.eventId)
        .filter(Boolean)
        .join(",");
      if (!slugs) continue;
      const resp = await fetch(`${config.dataStorage}?ids=${slugs}`);
      const json = await resp.json();
      if (json.serverTime && timeDrift === 0) {
        timeDrift = new Date(json.serverTime).getTime() - Date.now();
        await chrome.storage.local.set({ timeDrift });
      }
      if (json.data && Array.isArray(json.data)) allData.push(...json.data);
    }

    allData.forEach((matchData) => {
      const channel = channels.find(
        (c) => String(c.eventId) === String(matchData.id)
      );
      if (!channel) return;
      channel.meta = mergeScoreboardMeta(channel.meta, matchData);
    });

    channels = applyLocalDateView(channels);
    await saveToLocal();
    renderList();
  } catch (e) {
    /* ignore */
  } finally {
    setScoreRefreshBanner(false);
  }

  await refreshHighlightVideos();
}

async function refreshHighlightVideos() {
  const config = SPORT_CONFIG[currentSport];
  if (!config?.cache || !activeDate) return;

  try {
    const utcDates = new Set();
    if (userPickedDate && selectedDate) {
      localDateToNearbyUtcDates(selectedDate).forEach((u) => utcDates.add(u));
    } else {
      const center = activeDate;
      localDateToNearbyUtcDates(shiftLocalDateString(center, -1)).forEach((u) =>
        utcDates.add(u)
      );
      localDateToNearbyUtcDates(center).forEach((u) => utcDates.add(u));
      localDateToNearbyUtcDates(shiftLocalDateString(center, 1)).forEach((u) =>
        utcDates.add(u)
      );
    }

    const lists = await Promise.all(
      [...utcDates].map((u) => fetchCacheForDate(config, u))
    );
    const remote = mergeChannelsByEventId(lists);

    const videoById = new Map();
    remote.forEach((ch) => {
      const id = String(ch.eventId || ch.id || "");
      const urls = getHighlightUrls(ch.meta);
      if (id && urls.length) videoById.set(id, urls);
    });

    let changed = false;
    channels.forEach((ch) => {
      const id = String(ch.eventId || ch.id || "");
      const remoteUrls = videoById.get(id);
      if (!remoteUrls?.length) return;

      const existing = getHighlightUrls(ch.meta);
      const merged = [...new Set([...existing, ...remoteUrls])].slice(0, 6);

      // only write if something new appeared
      if (merged.join("|") !== existing.join("|")) {
        ch.meta = {
          ...(ch.meta || {}),
          videos: merged,
          video: merged[0]
        };
        changed = true;
      }
    });

    if (changed) {
      channels = applyLocalDateView(channels);
      const cacheKey = `channels_${currentSport}_${activeDate}`;
      await chrome.storage.local.set({
        [cacheKey]: JSON.parse(JSON.stringify(channels))
      });
      renderList();
    }
  } catch (e) {
    /* ignore */
  }
}

// UI CARDS

function buildCenterUI(localTime, homeScore, awayScore, hasAwayTeam, id) {
  const frag = document.createDocumentFragment();
  if (localTime !== null) {
    const timeDiv = document.createElement("div");
    timeDiv.className = "start-time-text";
    timeDiv.textContent = localTime;
    frag.appendChild(timeDiv);
    const timer = document.createElement("div");
    timer.className = "countdown-mini";
    timer.id = `timer-${id}`;
    timer.textContent = "00:00:00";
    frag.appendChild(timer);
  } else {
    const scoreDiv = document.createElement("div");
    scoreDiv.className = "live-score-text";
    if (
      homeScore !== undefined &&
      homeScore !== null &&
      awayScore !== undefined &&
      awayScore !== null
    ) {
      scoreDiv.textContent = `${homeScore} - ${awayScore}`;
    } else if (hasAwayTeam) {
      scoreDiv.textContent = "vs";
    }
    frag.appendChild(scoreDiv);
  }
  return frag;
}

function buildTeamBox(name, badgeUrl, isSyncing) {
  const box = document.createElement("div");
  box.className = "team-box";
  const logoFrame = document.createElement("div");
  logoFrame.className = "logo-frame" + (isSyncing ? " skeleton sk-circle" : "");
  if (!isSyncing && badgeUrl) {
    const img = document.createElement("img");
    img.className = "team-logo";
    img.src = badgeUrl;
    img.onerror = function () {
      this.style.display = "none";
    };
    logoFrame.appendChild(img);
  }
  const nameSpan = document.createElement("span");
  nameSpan.className = "team-name";
  if (isSyncing) {
    const sk = document.createElement("span");
    sk.className = "skeleton sk-text";
    nameSpan.appendChild(sk);
  } else {
    nameSpan.textContent = name || "TBD";
  }
  box.append(logoFrame, nameSpan);
  return box;
}

function appendEventCard(parent, ch) {
  const meta = ch.meta || {};
  const status = getStatus(meta.status, meta.timestamp);
  const isSyncing = status.class === "badge-syncing";
  const localTime =
    getSafeDate(meta.timestamp)?.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }) || "--:--";

  const showTime =
    status.class === "badge-upcoming" ||
    isSyncing ||
    status.class === "badge-postponed";

  // ---------- multi-highlight support ----------
  const highlightUrls = getHighlightUrls(meta);
  const primaryUrl =
    status.class === "badge-finished" && highlightUrls.length
      ? highlightUrls[0]
      : "";

  const eventCard = document.createElement("div");
  eventCard.className = primaryUrl ? "channel clickable-card" : "channel";
  if (primaryUrl) eventCard.setAttribute("data-url", primaryUrl);

  const header = document.createElement("div");
  header.style.cssText =
    "display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;";

  const leagueSpan = document.createElement("span");
  leagueSpan.style.cssText =
    "font-size:10px; color:var(--text-muted); font-weight:bold;";
  leagueSpan.textContent = meta.league || ch.league || "Unknown";

  const rightSide = document.createElement("div");
  rightSide.style.cssText = "display:flex; align-items:center; gap:2px;";

  const badge = document.createElement("span");
  badge.className = `badge ${status.class}`;
  badge.textContent = typeof t === "function" ? t(status.label) : status.label;

  const pinBtn = document.createElement("button");
  pinBtn.className = "pin-btn" + (isPinned(ch) ? " pinned" : "");
  pinBtn.title =
    typeof t === "function"
      ? isPinned(ch)
        ? t("unpin")
        : t("pin_to_top")
      : isPinned(ch)
        ? "Unpin"
        : "Pin to top";
  pinBtn.innerHTML = isPinned(ch) ? "★" : "☆";
  pinBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePin(ch);
  });

  rightSide.append(badge, pinBtn);
  header.append(leagueSpan, rightSide);
  eventCard.appendChild(header);

  const matchRow = document.createElement("div");
  if (!meta.awayTeam) {
    matchRow.className = "match-row";
    matchRow.style.cssText = "justify-content: flex-start; gap: 10px;";
    const nameDiv = document.createElement("div");
    nameDiv.style.cssText =
      "flex: 2; font-weight: bold; font-size: 14px; white-space: normal; text-align: left;";
    if (isSyncing) {
      const sk = document.createElement("span");
      sk.className = "skeleton sk-text";
      sk.style.width = "100%";
      nameDiv.appendChild(sk);
    } else {
      nameDiv.textContent = meta.homeTeam || ch.title || "TBD";
    }
    matchRow.appendChild(nameDiv);
    const isStarted =
      status.class === "badge-live" || status.class === "badge-finished";
    if (!isStarted) {
      const vs = document.createElement("div");
      vs.className = "vs-capsule";
      vs.style.minWidth = "80px";
      vs.appendChild(
        buildCenterUI(
          showTime ? localTime : null,
          meta.homeScore,
          meta.awayScore,
          false,
          ch.id
        )
      );
      matchRow.appendChild(vs);
    }
  } else {
    matchRow.className = "match-row";
    matchRow.appendChild(
      buildTeamBox(meta.homeTeam, meta.homeBadge, isSyncing)
    );
    const vs = document.createElement("div");
    vs.className = "vs-capsule";
    vs.appendChild(
      buildCenterUI(
        showTime ? localTime : null,
        meta.homeScore,
        meta.awayScore,
        true,
        ch.id
      )
    );
    matchRow.appendChild(vs);
    matchRow.appendChild(
      buildTeamBox(meta.awayTeam, meta.awayBadge, isSyncing)
    );
  }
  eventCard.appendChild(matchRow);

  // ---------- HIGHLIGHT LINKS (1, 2 or 3) ----------
  if (status.class === "badge-finished" && highlightUrls.length) {
    const links = document.createElement("div");
    links.className = "links-container";

    highlightUrls.forEach((url, i) => {
      const btn = document.createElement("button");
      btn.className = "stream-link highlight-link";
      btn.setAttribute("data-video", url);
      btn.textContent =
        highlightUrls.length === 1
          ? (typeof t === "function" ? t("highlights") : null) || "Highlights"
          : `${t("highlights")} ${i + 1}`;
      links.appendChild(btn);
    });

    eventCard.appendChild(links);
  }

  parent.appendChild(eventCard);
}

function renderList() {
  const list = document.getElementById("channelList");
  const eventCountEl = document.getElementById("eventCount");
  const searchVal = document.getElementById("search").value.toLowerCase();
  list.innerHTML = "";

  const sportName =
    translations[window.currentLang]?.[currentSport] || currentSport;

  if (channels.length === 0) {
    if (eventCountEl) eventCountEl.textContent = "";
    list.innerHTML =
      '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:14px;">' +
      (userPickedDate
        ? typeof t === "function"
          ? t("no_matches_for_date")
          : "No matches found for this date."
        : typeof t === "function"
          ? t("no_matches_available")
          : "No matches listed right now, please check back later.") +
      "</div>";
    return;
  }

  let filtered = channels.filter((ch) => {
    const meta = ch.meta || {};
    const text =
      `${meta.homeTeam || ""} ${meta.awayTeam || ""} ${meta.league || ""} ${
        ch.title || ""
      }`.toLowerCase();
    if (!text.includes(searchVal)) return false;
    return passesLeagueFilter(ch);
  });

  if (eventCountEl) {
    if (!channels.length) {
      eventCountEl.textContent = "";
    } else {
      const translationKey =
        currentSport === "more_sports" ? "event_count" : "match_count";
      eventCountEl.textContent = translateCount(
        translationKey,
        filtered.length,
        sportName
      );
    }
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:14px;">${
      typeof t === "function"
        ? t("no_matches_for_filters")
        : "No matches match your filters."
    }</div>`;
    return;
  }

  const pinnedList = [];
  const rest = [];
  filtered.forEach((ch) => {
    if (isPinned(ch)) pinnedList.push(ch);
    else rest.push(ch);
  });

  pinnedList.sort((a, b) => {
    const sa = getStatus(a.meta?.status, a.meta?.timestamp);
    const sb = getStatus(b.meta?.status, b.meta?.timestamp);
    if (sa.class === "badge-live" && sb.class !== "badge-live") return -1;
    if (sb.class === "badge-live" && sa.class !== "badge-live") return 1;
    const dateA = getSafeDate(a.meta?.timestamp) || 0;
    const dateB = getSafeDate(b.meta?.timestamp) || 0;
    return dateA - dateB;
  });

  const categories = { live: [], upcoming: [], finished: [] };
  rest.forEach((ch) => {
    const status = getStatus(ch.meta?.status, ch.meta?.timestamp);
    if (status.class === "badge-live") categories.live.push(ch);
    else if (status.class === "badge-finished") categories.finished.push(ch);
    else categories.upcoming.push(ch);
  });

  function sortChrono(arr, isFinished = false) {
    return arr.sort((a, b) => {
      const dateA = getSafeDate(a.meta?.timestamp) || 0;
      const dateB = getSafeDate(b.meta?.timestamp) || 0;
      return isFinished ? dateB - dateA : dateA - dateB;
    });
  }
  sortChrono(categories.live);
  sortChrono(categories.upcoming);
  sortChrono(categories.finished, true);

  const presentKeys = [];
  if (pinnedList.length) presentKeys.push("pinned");
  if (categories.live.length) presentKeys.push("live");
  if (categories.upcoming.length) presentKeys.push("upcoming");
  if (categories.finished.length) presentKeys.push("finished");
  window.__presentSectionKeys = presentKeys;

  const pinnedTitle =
    typeof t === "function" ? t("pinned") || "Pinned" : "Pinned";
  const liveTitle = typeof t === "function" ? t("live") || "Live" : "Live";
  const upTitle =
    typeof t === "function" ? t("upcoming") || "Upcoming" : "Upcoming";
  const finTitle =
    typeof t === "function" ? t("finished") || "Finished" : "Finished";
  const common = { presentKeys };

  appendSection(list, "pinned", pinnedTitle, pinnedList, common);
  appendSection(list, "live", liveTitle, categories.live, common);
  appendSection(list, "upcoming", upTitle, categories.upcoming, {
    ...common,
    showDateHeaders: true
  });
  appendSection(list, "finished", finTitle, categories.finished, {
    ...common,
    showDateHeaders: true
  });
}

function updateAllTimers() {
  channels.forEach((ch) => {
    const el = document.getElementById(`timer-${ch.id}`);
    if (!el || !ch.meta?.timestamp) return;
    const diff = getSafeDate(ch.meta.timestamp) - getCorrectedNow();
    if (diff > 0) {
      const h = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      el.innerText = `${h}:${m}:${s}`;
    } else {
      el.innerText = "00:00:00";
    }
  });
}

// LISTENERS

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== "local") return;

  if (changes[LEAGUE_FILTER_KEY]) {
    loadLeagueFilters().then(() => {
      updateLeagueFilterButton();
      renderList();
    });
  }

  if (!activeDate) return;
  const key = `channels_${currentSport}_${activeDate}`;
  if (!changes[key]) return;
  channels = applyLocalDateView(changes[key].newValue || []);
  renderList();
});

document.getElementById("search").addEventListener("input", renderList);

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    fetchSportData(e.target.dataset.sport);
  });
});

async function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  document.getElementById("themeBtn").innerHTML = isDark ? "☀️" : "🌙";
  await chrome.storage.local.set({ "ext-theme": isDark ? "dark" : "light" });
}
document.getElementById("themeBtn").addEventListener("click", toggleTheme);

document.getElementById("settingsBtn")?.addEventListener("click", () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
  }
});

const HIGHLIGHT_TAB_KEY = "highlightYoutubeTabId";

async function hasTabsPermission() {
  return new Promise((resolve) => {
    chrome.permissions.contains({ permissions: ["tabs"] }, resolve);
  });
}

async function requestTabsPermission() {
  return new Promise((resolve) => {
    chrome.permissions.request({ permissions: ["tabs"] }, resolve);
  });
}

async function openHighlightVideo(url) {
  if (!url) return;

  // If we don't have the tabs permission → just open a normal new tab
  const allowed = await hasTabsPermission();
  if (!allowed) {
    chrome.tabs.create({ url });
    return;
  }

  // We have permission → try to reuse the previous highlight tab
  async function tryReuse(tabId) {
    if (!tabId) return false;
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab) return false;
      await chrome.tabs.update(tabId, { url, active: true });
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  try {
    const stored = await chrome.storage.session.get(HIGHLIGHT_TAB_KEY);
    if (await tryReuse(stored[HIGHLIGHT_TAB_KEY])) return;

    // Optional: reuse any existing YouTube tab
    const ytTabs = await chrome.tabs.query({
      url: ["*://www.youtube.com/*", "*://youtu.be/*", "*://www.youtube-nocookie.com/*"]
    });
    if (ytTabs.length > 0) {
      const tab = ytTabs[0];
      await chrome.tabs.update(tab.id, { url, active: true });
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      await chrome.storage.session.set({ [HIGHLIGHT_TAB_KEY]: tab.id });
      return;
    }

    // Create new tab and remember it
    const newTab = await chrome.tabs.create({ url, active: true });
    await chrome.storage.session.set({ [HIGHLIGHT_TAB_KEY]: newTab.id });
  } catch (e) {
    chrome.tabs.create({ url });
  }
}

// Updated click listener
document.getElementById("channelList").addEventListener("click", (e) => {
  const highlightBtn = e.target.closest(".highlight-link");
  if (highlightBtn) {
    openHighlightVideo(highlightBtn.getAttribute("data-video"));
    return;
  }

  const eventCard = e.target.closest(".clickable-card");
  if (eventCard) {
    openHighlightVideo(eventCard.getAttribute("data-url"));
  }
});

document
  .getElementById("datePickerBtn")
  ?.addEventListener("click", openDatePicker);

document.getElementById("datePickerInput")?.addEventListener("change", (e) => {
  const iso = e.target.value;
  if (!iso) return;
  loadUserDate(fromIsoDateInput(iso));
});

document
  .getElementById("leagueFilterBtn")
  ?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLeaguePanel();
  });

document.getElementById("leagueSelectAll")?.addEventListener("click", () => {
  const all = collectLeaguesFromChannels().map(([slug]) => slug);
  selectedLeagues[currentSport] = new Set(all);
  saveLeagueFilters();
  buildLeagueFilterPanel();
  renderList();
});

document.getElementById("leagueClear")?.addEventListener("click", () => {
  selectedLeagues[currentSport] = new Set();
  saveLeagueFilters();
  buildLeagueFilterPanel();
  renderList();
});

document.addEventListener("click", (e) => {
  const panel = document.getElementById("leagueFilterPanel");
  const btn = document.getElementById("leagueFilterBtn");
  if (!panel || panel.hidden) return;
  if (panel.contains(e.target) || btn?.contains(e.target)) return;
  panel.hidden = true;
});

window.addEventListener("load", async () => {
  const settings = await chrome.storage.local.get([
    "ext-theme",
    "timeDrift",
    "currentSport",
    "userSelectedDate",
    "userPickedDate",
    "activeDate"
  ]);
  if (settings.timeDrift) timeDrift = settings.timeDrift;

  if (settings["ext-theme"] === "dark") {
    document.body.classList.add("dark-mode");
    document.getElementById("themeBtn").innerHTML = "☀️";
  } else {
    document.getElementById("themeBtn").innerHTML = "🌙";
  }

  await loadPinned();
  await loadLeagueFilters();
  await loadSectionState();

  if (settings.userSelectedDate && settings.userPickedDate) {
    userPickedDate = true;
    selectedDate = settings.userSelectedDate;
    activeDate = settings.userSelectedDate;
  } else if (settings.activeDate) {
    activeDate = settings.activeDate;
  }

  const initialSport = settings.currentSport || "football";
  document.querySelectorAll(".tab-btn").forEach((b) => {
    if (b.dataset.sport === initialSport) b.classList.add("active");
    else b.classList.remove("active");
  });

  updateDatePickerUI();
  updateLeagueFilterButton();
  fetchSportData(initialSport);
});

document.querySelectorAll("[data-i18n-title]").forEach(el => {
  const key = el.getAttribute("data-i18n-title");
  el.title = t(key);
});