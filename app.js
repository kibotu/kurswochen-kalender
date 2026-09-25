/* Kurswoche Kalender
 * "Kurswoche" is implemented as ISO-8601 week number (KW).
 * Any year works; today's date decides the default view.
 */

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtDate(d) {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function toISODateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ISO weekday: Mon=1..Sun=7
function isoWeekday(d) {
  const dow = d.getDay(); // Sun=0..Sat=6
  return dow === 0 ? 7 : dow;
}

// Returns { weekYear, week } according to ISO-8601.
function isoWeek(d) {
  const date = startOfDay(d);

  // Move to Thursday of this week to determine the ISO week-year.
  const weekday = isoWeekday(date); // 1..7
  const thursday = addDays(date, 4 - weekday);
  const weekYear = thursday.getFullYear();

  // Week 1 is the week with Jan 4th in it. Find Thursday of week 1.
  const jan4 = new Date(weekYear, 0, 4);
  const jan4Weekday = isoWeekday(jan4);
  const week1Thursday = addDays(jan4, 4 - jan4Weekday);

  const diffDays = Math.round((startOfDay(thursday) - startOfDay(week1Thursday)) / 86400000);
  const week = 1 + Math.floor(diffDays / 7);
  return { weekYear, week };
}

function isoWeekStart(d) {
  const date = startOfDay(d);
  const weekday = isoWeekday(date);
  return addDays(date, 1 - weekday); // Monday
}

function isoWeekRangeForWeek(weekYear, week) {
  // Find Monday of ISO week 1, then add (week-1)*7
  const jan4 = new Date(weekYear, 0, 4);
  const week1Monday = isoWeekStart(jan4);
  const monday = addDays(week1Monday, (week - 1) * 7);
  const sunday = addDays(monday, 6);
  return { start: monday, end: sunday };
}

function buildWeeksForYear(year) {
  // Start at KW1 Monday, then iterate until ISO week-year changes.
  const week1Monday = isoWeekStart(new Date(year, 0, 4));
  const weeks = [];
  let cursor = week1Monday;
  // Hard cap to be safe.
  for (let i = 0; i < 60; i++) {
    const { weekYear, week } = isoWeek(cursor);
    if (weekYear !== year) break;
    const start = cursor;
    const end = addDays(cursor, 6);
    weeks.push({
      weekYear,
      week,
      start,
      end,
      id: `${weekYear}-KW${String(week).padStart(2, "0")}`,
    });
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

function monthGridWeeks(year, monthIndex) {
  // Return array of week blocks: { weekYear, week, days: [Date x7] } where days cover the visible grid.
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  // Grid starts on Monday of the week containing the 1st.
  let gridStart = isoWeekStart(firstOfMonth);
  // Grid ends on Sunday of the week containing the last day.
  const gridEnd = addDays(isoWeekStart(lastOfMonth), 6);

  const weeks = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const { weekYear, week } = isoWeek(cursor);
    const days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(cursor, i));
    weeks.push({ weekYear, week, days, key: `${weekYear}-${week}-${monthIndex}-${toISODateKey(cursor)}` });
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderTodayCard(today, weeks) {
  const kwValue = document.getElementById("todayKwValue");
  const kwMeta = document.getElementById("todayKwMeta");

  const { weekYear, week } = isoWeek(today);
  const range = isoWeekRangeForWeek(weekYear, week);

  kwValue.textContent = `KW ${week} (${weekYear})`;
  const selectedYear = state.year;
  const inView = today.getFullYear() === selectedYear;
  const inSelectedYearWeeks = weeks.some((w) => w.week === week && w.weekYear === selectedYear);

  const parts = [
    `${fmtDate(today)}`,
    `Range: ${fmtDate(range.start)} – ${fmtDate(range.end)}`,
    inView
      ? `In the ${selectedYear} calendar view.`
      : `Outside the ${selectedYear} view (card still shows your real KW).`,
  ];

  if (weekYear === selectedYear && inSelectedYearWeeks) {
    parts.push("Tip: use “Jump to today (in year)” to highlight the current KW in the year view.");
  }

  kwMeta.textContent = parts.join(" · ");
}

function renderKwList(weeks, today) {
  const list = document.getElementById("kwList");
  list.textContent = "";

  const todayIso = isoWeek(today);

  for (const w of weeks) {
    const item = el("div", "kwitem");
    item.setAttribute("role", "listitem");
    item.dataset.week = String(w.week);
    item.dataset.weekyear = String(w.weekYear);

    if (todayIso.weekYear === w.weekYear && todayIso.week === w.week) {
      item.classList.add("kwitem--today");
    }

    const top = el("div", "kwitem__top");
    top.appendChild(el("div", "kwitem__kw", `KW ${w.week}`));
    top.appendChild(el("div", "kwitem__range", `${fmtDate(w.start)}\n–\n${fmtDate(w.end)}`));
    item.appendChild(top);

    item.appendChild(el("div", "kwitem__meta", `Mon–Sun · ${w.weekYear}`));

    item.addEventListener("click", () => {
      setActiveWeek(w.weekYear, w.week, { scroll: true });
    });

    list.appendChild(item);
  }
}

function renderMonths(year, today) {
  const monthsEl = document.getElementById("months");
  monthsEl.textContent = "";

  for (let m = 0; m < 12; m++) {
    const month = el("section", "month");
    month.id = `month-${m + 1}`;

    const head = el("div", "month__head");
    head.appendChild(el("div", "month__name", MONTH_NAMES[m]));
    head.appendChild(el("div", "month__meta", String(year)));
    month.appendChild(head);

    const grid = el("div", "grid");
    // Header row
    grid.appendChild(el("div", "grid__cell grid__cell--head grid__cell--kwhead", "KW"));
    for (const wd of WEEKDAY_LABELS) {
      grid.appendChild(el("div", "grid__cell grid__cell--head", wd));
    }

    const weeks = monthGridWeeks(year, m);
    for (const w of weeks) {
      const kwCell = el("div", "grid__cell grid__cell--kw", String(w.week));
      kwCell.dataset.weekyear = String(w.weekYear);
      kwCell.dataset.week = String(w.week);
      kwCell.dataset.weekcell = "true";
      grid.appendChild(kwCell);

      for (const day of w.days) {
        const inMonth = day.getMonth() === m;
        const cell = el("div", "grid__cell");
        cell.dataset.weekyear = String(w.weekYear);
        cell.dataset.week = String(w.week);
        cell.dataset.date = toISODateKey(day);

        if (!inMonth) cell.classList.add("grid__cell--muted");
        if (isSameDate(day, today)) cell.classList.add("grid__cell--today");

        const row = el("div", "day");
        row.appendChild(el("div", "day__num", String(day.getDate())));
        if (day.getDate() === 1 || isSameDate(day, today)) {
          row.appendChild(el("div", "day__hint", `${pad2(day.getMonth() + 1)}`));
        } else {
          row.appendChild(el("div", "day__hint", ""));
        }
        cell.appendChild(row);

        grid.appendChild(cell);
      }
    }

    month.appendChild(grid);
    monthsEl.appendChild(month);
  }
}

function clearActiveWeek() {
  document.querySelectorAll(".kwitem--active").forEach((x) => x.classList.remove("kwitem--active"));
  document.querySelectorAll(".grid__cell--weekactive").forEach((x) =>
    x.classList.remove("grid__cell--weekactive"),
  );
}

function setActiveWeek(weekYear, week, opts = { scroll: false }) {
  clearActiveWeek();

  // Sidebar
  const sidebarItem = document.querySelector(
    `.kwitem[data-weekyear="${weekYear}"][data-week="${week}"]`,
  );
  if (sidebarItem) {
    sidebarItem.classList.add("kwitem--active");
    if (opts.scroll) sidebarItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  // Month grids
  const matches = document.querySelectorAll(
    `.grid__cell[data-weekyear="${weekYear}"][data-week="${week}"]`,
  );
  matches.forEach((n) => n.classList.add("grid__cell--weekactive"));

  if (opts.scroll && matches.length > 0) {
    // Prefer scrolling to a day cell that's inside the selected year (avoid muted neighbors)
    const selectedYear = state.year;
    const target =
      Array.from(matches).find(
        (n) => n.dataset.date && n.dataset.date.startsWith(`${selectedYear}-`),
      ) || matches[0];
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  state.activeWeekYear = weekYear;
  state.activeWeek = week;
}

function scrollToTodayInView(today) {
  const selectedYear = state.year;
  if (today.getFullYear() !== selectedYear) return false;
  const { weekYear, week } = isoWeek(today);
  if (weekYear !== selectedYear) return false;

  setActiveWeek(weekYear, week, { scroll: true });
  return true;
}

function wireActions(today) {
  const jumpToTodayBtn = document.getElementById("jumpToTodayBtn");
  const jumpToTodayInYearBtn = document.getElementById("jumpToTodayInYearBtn");
  const yearInput = document.getElementById("yearInput");
  const prevYearBtn = document.getElementById("prevYearBtn");
  const nextYearBtn = document.getElementById("nextYearBtn");

  jumpToTodayBtn.addEventListener("click", () => {
    const elToday = document.querySelector(`.grid__cell--today`);
    if (elToday) elToday.scrollIntoView({ block: "center", behavior: "smooth" });
    else document.getElementById("todayCard").scrollIntoView({ block: "start", behavior: "smooth" });
  });

  jumpToTodayInYearBtn.addEventListener("click", () => {
    const ok = scrollToTodayInView(today);
    if (!ok) {
      // Fallback: show KW in list if it's in the selected year, else scroll to top.
      document.getElementById("todayCard").scrollIntoView({ block: "start", behavior: "smooth" });
    }
  });

  function clampYear(y) {
    if (!Number.isFinite(y)) return new Date().getFullYear();
    return Math.max(1900, Math.min(2100, y));
  }

  function parseYearFromInput() {
    return clampYear(Number(yearInput.value));
  }

  function setYearAndSync(y, source = "input") {
    const next = clampYear(y);
    if (state.year === next && source !== "force") return;

    state.year = next;
    yearInput.value = String(next);
    persistSelectedYear(next);
    renderAll(today);
  }

  yearInput.addEventListener("change", () => setYearAndSync(parseYearFromInput(), "input"));
  yearInput.addEventListener("blur", () => setYearAndSync(parseYearFromInput(), "input"));
  yearInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") setYearAndSync(parseYearFromInput(), "input");
  });

  prevYearBtn.addEventListener("click", () => setYearAndSync(state.year - 1, "btn"));
  nextYearBtn.addEventListener("click", () => setYearAndSync(state.year + 1, "btn"));
}

function persistSelectedYear(year) {
  try {
    localStorage.setItem("kwCalendarYear", String(year));
  } catch {
    // ignore
  }
  const url = new URL(window.location.href);
  url.searchParams.set("year", String(year));
  window.history.replaceState({}, "", url.toString());
}

function readSelectedYear() {
  const url = new URL(window.location.href);
  const fromUrl = Number(url.searchParams.get("year"));
  if (Number.isFinite(fromUrl) && fromUrl >= 1900 && fromUrl <= 2100) return fromUrl;
  try {
    const fromLs = Number(localStorage.getItem("kwCalendarYear"));
    if (Number.isFinite(fromLs) && fromLs >= 1900 && fromLs <= 2100) return fromLs;
  } catch {
    // ignore
  }
  return new Date().getFullYear();
}

function updateTitle(year) {
  const title = document.getElementById("calendarTitle");
  if (title) title.textContent = String(year);
  const kwListTitle = document.getElementById("kwListTitle");
  if (kwListTitle) kwListTitle.textContent = `Kurswochen (${year})`;
  document.title = `Kurswoche Kalender ${year}`;
}

function renderAll(today) {
  const year = state.year;
  const weeks = buildWeeksForYear(year);

  updateTitle(year);
  renderTodayCard(today, weeks);
  renderKwList(weeks, today);
  renderMonths(year, today);

  // Restore highlight if possible; otherwise highlight today if it belongs to this year.
  const maxWeek = weeks.length > 0 ? weeks[weeks.length - 1].week : 52;
  if (state.activeWeekYear === year && typeof state.activeWeek === "number") {
    const wk = Math.max(1, Math.min(maxWeek, state.activeWeek));
    setActiveWeek(year, wk, { scroll: false });
  } else {
    scrollToTodayInView(today);
  }
}

const state = {
  year: new Date().getFullYear(),
  activeWeekYear: null,
  activeWeek: null,
};

function main() {
  const today = startOfDay(new Date());
  state.year = readSelectedYear();

  const yearInput = document.getElementById("yearInput");
  if (yearInput) yearInput.value = String(state.year);

  renderAll(today);
  wireActions(today);
}

main();


