'use strict';
/* My Plum Routine v1.1.1 — Rishikanta | Browser-persistent (localStorage + shadow copy) | Starts Mon 9 Nov 2026 IST */
const APP_VERSION = '1.1.1';
const START = '2026-11-09';
const STORE_KEY = 'myPlumRoutine.v1';
const SHADOW_KEY = STORE_KEY + '.shadow';
const PRODUCTS = [
  { e: '🧼', n: 'Face Wash — Rice Water & 2% Niacinamide Simply Bright', s: '100 ml · AM + PM cleanser' },
  { e: '💧', n: 'Toner — Rice Water & 3% Niacinamide', s: '150 ml · From Stage B, pat with palms' },
  { e: '✨', n: 'Serum — 5% Niacinamide with Rice Water', s: '30 ml · From Stage C, PM only' },
  { e: '🧴', n: 'Gel Cream — Rice Water & 2% Niacinamide Clear Moisture', s: '50 g · AM + PM moisturizer' },
  { e: '☀️', n: 'Sunscreen — Rice Water & 2% Niacinamide Hybrid SPF 50 PA++++', s: '50 g · AM last step, daily' }
];
const FW = { id: 'facewash', n: 'Face Wash 2%', note: 'Coin-size, lukewarm water, 30 seconds, pat dry' };
const FW_PM = { id: 'facewash', n: 'Face Wash 2%', note: '40–60 seconds at night to remove sunscreen properly' };
const TONER = { id: 'toner', n: 'Toner 3%', note: 'Pat on with palms — no cotton rubbing. Wait 30 seconds' };
const SERUM = { id: 'serum', n: 'Serum 5%', note: '2–3 drops, whole face. Avoid eyes, lips, cuts. Wait 1 minute' };
const GEL = { id: 'gelcream', n: 'Gel Cream 2%', note: 'Pea-to-blueberry size, face + neck' };
const GEL_PM = { id: 'gelcream', n: 'Gel Cream 2%', note: 'Slightly thicker layer at night' };
const SPF = { id: 'sunscreen', n: 'Sunscreen SPF 50 PA++++', note: '2 finger lengths, face + neck, 15 min before going out' };
const DEFAULT_SETTINGS = { morning: '05:00', midday: '12:00', evening: '18:00', shaveWeekday: null };

function blankStore() { return { version: 1, days: {}, logs: {}, settings: { ...DEFAULT_SETTINGS }, hold: null, holdDismissedFor: null, tourSeen: false, installDismissed: false }; }
function normalise(data) {
  const s = blankStore();
  if (data && typeof data === 'object') {
    if (data.days && typeof data.days === 'object') s.days = data.days;
    if (data.logs && typeof data.logs === 'object') s.logs = data.logs;
    if (data.settings && typeof data.settings === 'object') s.settings = { ...DEFAULT_SETTINGS, ...data.settings };
    s.hold = data.hold || null; s.holdDismissedFor = data.holdDismissedFor || null;
    s.tourSeen = !!data.tourSeen; s.installDismissed = !!data.installDismissed;
  }
  return s;
}
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return normalise(JSON.parse(raw)); } catch (e) { /* fall through to shadow */ }
  try { const sh = JSON.parse(localStorage.getItem(SHADOW_KEY)); if (sh && sh.data) return normalise(sh.data); } catch (e) { /* fresh start */ }
  return blankStore();
}
function save(s) {
  const txt = JSON.stringify(s);
  try { localStorage.setItem(STORE_KEY, txt); } catch (e) { /* storage full/blocked */ }
  try { localStorage.setItem(SHADOW_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data: s })); } catch (e) { /* ignore */ }
}
let store = load();
if (navigator.storage && navigator.storage.persist) { navigator.storage.persist().catch(() => {}); }

function istNow() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })); }
function fmtDate(d) { const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
function dateOf(iso) { const a = iso.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
function addDays(iso, n) { const d = dateOf(iso); d.setDate(d.getDate() + n); return fmtDate(d); }
function dayNum(iso) { return Math.round((dateOf(iso) - dateOf(START)) / 86400000) + 1; }
function rawStage(day) { return day <= 4 ? 'A' : day <= 11 ? 'B' : 'C'; }
function stageFor(day) {
  if (store.hold && day <= store.hold.untilDay && day >= store.hold.fromDay) return store.hold.stage;
  return rawStage(day);
}
function serumTonight(day) { if (stageFor(day) !== 'C') return false; if (day >= 19) return true; const cDay = Math.max(12, store.hold && store.hold.stage === 'C' ? day : day); return cDay >= 12 && (day - 12) % 2 === 0; }
function toMins(hhmm) { const a = String(hhmm || '00:00').split(':'); return (+a[0]) * 60 + (+a[1] || 0); }
function slotFor(now) {
  const m = now.getHours() * 60 + now.getMinutes(); const s = store.settings;
  if (m >= toMins(s.evening)) return 'evening';
  if (m >= toMins(s.midday)) return 'midday';
  if (m >= toMins(s.morning)) return 'morning';
  return 'late';
}
function greetingFor(h) {
  if (h >= 5 && h < 12) return ['Good Morning, Rishikanta ☀️', "Fresh start — let's do your morning routine for smooth, even skin."];
  if (h >= 12 && h < 17) return ['Good Afternoon, Rishikanta 🌤️', 'Halfway there — protect that progress with sunscreen.'];
  if (h >= 17 && h < 21) return ['Good Evening, Rishikanta 🌇', 'Day is winding down — your night routine will do the repair work.'];
  return ['Good Night, Rishikanta 🌙', 'Finish your night routine, then rest — skin repairs while you sleep.'];
}
function isAutoShave(iso) { return store.settings.shaveWeekday !== null && store.settings.shaveWeekday !== '' && dateOf(iso).getDay() === Number(store.settings.shaveWeekday); }
function dayRec(iso) { if (!store.days[iso]) store.days[iso] = { am: {}, pm: {}, midday: {}, shave: isAutoShave(iso), photo: false }; return store.days[iso]; }
function pct(done, total) { return total ? Math.round(done / total * 100) : 0; }
function realSteps(steps) { return steps.filter(s => !s.rest); }
function countDone(rec, steps, bucket) { return steps.filter(s => !s.rest && rec[bucket][s.id]).length; }
function timeStr(isoTs) { if (!isoTs) return ''; const d = new Date(isoTs); let h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0'); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + m + ' ' + ap; }

function amSteps(day, shave) {
  if (shave) return [
    { id: 'facewash', n: 'Face Wash 2% (warm water)', note: 'Warm water softens stubble before shaving' },
    { id: 'shave', n: 'Shave — with the grain', note: 'Use your usual shaving gel/foam, rinse blade often' },
    { id: 'rinse', n: 'Cool rinse', note: 'Rinse with cool water, pat dry gently' },
    { id: 'gelcream', n: 'Gel Cream 2% — double layer', note: 'Two thin layers, 5 minutes apart' },
    SPF];
  return stageFor(day) === 'A' ? [FW, GEL, SPF] : [FW, TONER, GEL, SPF];
}
function pmSteps(day, shave) {
  if (shave) return [FW_PM, GEL_PM];
  const s = stageFor(day);
  if (s === 'A') return [FW_PM, GEL_PM];
  if (s === 'B') return [FW_PM, TONER, GEL_PM];
  const arr = [FW_PM, TONER];
  if (serumTonight(day)) arr.push(SERUM); else arr.push({ id: 'serumrest', n: 'Serum — rest night', note: 'Alternate nights in Stage C week 1. No serum tonight.', rest: true });
  arr.push(GEL_PM); return arr;
}

const state = { log: { redness: null, smooth: null, tone: null, burn: null } };
function stepEl(iso, bucket, step, disabled) {
  const rec = dayRec(iso); const doneTs = rec[bucket][step.id];
  const div = document.createElement('label');
  div.className = 'step' + (doneTs ? ' done' : '') + (step.rest ? ' skipped' : '');
  const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!doneTs; cb.disabled = disabled || !!step.rest;
  cb.addEventListener('change', () => { const r = dayRec(iso); if (cb.checked) r[bucket][step.id] = new Date().toISOString(); else delete r[bucket][step.id]; save(store); render(); });
  const body = document.createElement('div');
  body.innerHTML = '<div class="name"></div><div class="note"></div>' + (doneTs ? '<div class="time">Done at ' + timeStr(doneTs) + '</div>' : '');
  body.querySelector('.name').textContent = step.n; body.querySelector('.note').textContent = step.note;
  div.appendChild(cb); div.appendChild(body); return div;
}
function checklist(iso, bucket, steps, disabled) { const w = document.createElement('div'); steps.forEach(s => w.appendChild(stepEl(iso, bucket, s, disabled))); return w; }

function render() {
  const now = istNow(); const todayIso = fmtDate(now); const h = now.getHours();
  document.body.classList.toggle('dark', h >= 19 || h < 5);
  const slot = slotFor(now);
  const preview = todayIso < START;
  const effIso = preview ? START : (slot === 'late' ? addDays(todayIso, -1) : todayIso);
  const effDay = Math.max(1, dayNum(effIso));
  const started = !preview && effIso >= START;
  const rec = dayRec(effIso); const shave = !!rec.shave;
  const [greet, wish] = greetingFor(h);

  document.getElementById('greeting').textContent = greet;
  document.getElementById('wish').textContent = wish;
  document.getElementById('todayLabel').textContent = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const holdNote = store.hold && effDay >= store.hold.fromDay && effDay <= store.hold.untilDay ? ' · Stage held at ' + store.hold.stage : '';
  document.getElementById('dayChip').textContent = preview ? 'Starts tomorrow · Mon 9 Nov' : 'Day ' + effDay + ' · Stage ' + stageFor(effDay) + holdNote;
  document.getElementById('slotChip').textContent = { morning: 'Morning · AM routine time', midday: 'Midday · Sunscreen check', evening: 'Evening · Night routine time', late: 'Late night' }[slot];
  document.getElementById('clockChip').textContent = timeStr(now.toISOString());
  document.getElementById('previewBanner').classList.toggle('hidden', !preview);
  document.getElementById('reorderBanner').classList.toggle('hidden', !(started && effDay >= 20 && effDay <= 34));
  document.getElementById('tourOverlay').classList.toggle('hidden', !!store.tourSeen);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  document.getElementById('installBanner').classList.toggle('hidden', !!(store.installDismissed || standalone));

  // Stage safety gate
  const hb = document.getElementById('stageHoldBanner');
  const prev1 = store.logs[addDays(effIso, -1)] || {}, prev2 = store.logs[addDays(effIso, -2)] || {};
  const highRed = prev1.redness >= 2 && prev2.redness >= 2;
  const isTransition = [5, 6, 12, 13].includes(effDay);
  if (started && isTransition && highRed && !store.hold && store.holdDismissedFor !== effDay) {
    hb.innerHTML = '⚠️ <b>Stage hold suggestion:</b> your redness was high (2+) for the last 2 days, right as a new stage begins. Safer for sensitive skin: hold the current stage 3 more days. <div style="margin-top:8px"><button class="mini" id="holdBtn">Hold stage 3 days</button> <button class="mini" id="proceedBtn">Proceed anyway</button></div>';
    hb.classList.remove('hidden');
    document.getElementById('holdBtn').addEventListener('click', () => { store.hold = { fromDay: effDay, untilDay: effDay + 2, stage: rawStage(effDay - 1) }; save(store); render(); });
    document.getElementById('proceedBtn').addEventListener('click', () => { store.holdDismissedFor = effDay; save(store); render(); });
  } else if (store.hold && effDay >= store.hold.fromDay && effDay <= store.hold.untilDay) {
    hb.innerHTML = '⏸️ Stage held at <b>Stage ' + store.hold.stage + '</b> until Day ' + store.hold.untilDay + ' to protect your skin barrier. New steps unlock after that if redness settles.';
    hb.classList.remove('hidden');
  } else { hb.classList.add('hidden'); hb.innerHTML = ''; }

  const am = amSteps(effDay, shave), pm = pmSteps(effDay, shave);
  const doNow = document.getElementById('doNowBody'); doNow.innerHTML = '';
  const title = document.getElementById('doNowTitle'); const other = document.getElementById('otherRoutine'); other.innerHTML = '';
  const dis = preview;
  function summaryCard(heading, iso2, bucket, steps) { const c = document.createElement('div'); c.className = 'card'; const rec2 = dayRec(iso2); c.innerHTML = '<h3></h3>'; c.querySelector('h3').textContent = heading + ' — ' + countDone(rec2, steps, bucket) + '/' + realSteps(steps).length + ' done'; c.appendChild(checklist(iso2, bucket, steps, dis)); return c; }

  if (slot === 'morning') {
    title.textContent = '☀️ Do Now — Morning Routine' + (preview ? ' (Day 1 preview)' : '');
    doNow.appendChild(checklist(effIso, 'am', am, dis));
    if (effDay <= 4) { const p = document.createElement('p'); p.className = 'small'; p.textContent = effDay <= 2 ? 'Patch test: Toner on a small jaw area today.' : 'Patch test: Serum on a small jaw area today.'; doNow.appendChild(p); }
    other.appendChild(summaryCard('🌙 Up Next — Tonight', effIso, 'pm', pm));
  } else if (slot === 'midday') {
    title.textContent = '🌤️ Do Now — Midday Check' + (preview ? ' (preview)' : '');
    const missed = realSteps(am).filter(s => !rec.am[s.id]);
    if (started && missed.length && !shave) {
      const rp = document.createElement('p'); rp.className = 'small'; rp.innerHTML = '<b>Rescue routine</b> — morning was missed, do this short version now instead of skipping the day:'; doNow.appendChild(rp);
      const rescue = missed.map(s => s.id === 'facewash' ? { id: 'facewash', n: 'Rescue: Face Wash 2% (quick)', note: 'A short gentle wash now is fine — this replaces the missed morning wash' } : s);
      doNow.appendChild(checklist(effIso, 'am', rescue, dis));
    } else {
      const p = document.createElement('p'); p.className = 'small'; p.textContent = missed.length ? 'Some morning steps were missed.' : 'Morning routine complete 🎉 — good work.'; doNow.appendChild(p);
    }
    doNow.appendChild(stepEl(effIso, 'midday', { id: 'reapply', n: 'Sunscreen reapplied', note: 'Tick if you are outdoors / in bright light and reapplied SPF' }, dis));
    const t = document.createElement('p'); t.className = 'small'; t.textContent = 'Midday tips: do not wash your face again (unless doing the rescue wash), do not touch/pick your face, drink water.'; doNow.appendChild(t);
    other.appendChild(summaryCard('☀️ Morning — Today', effIso, 'am', am));
    other.appendChild(summaryCard('🌙 Up Next — Tonight', effIso, 'pm', pm));
  } else if (slot === 'evening') {
    title.textContent = '🌙 Do Now — Night Routine' + (preview ? ' (Day 1 preview)' : '');
    doNow.appendChild(checklist(effIso, 'pm', pm, dis));
    other.appendChild(summaryCard('☀️ Morning — Today', effIso, 'am', am));
  } else {
    const pmDoneFull = countDone(rec, pm, 'pm') >= realSteps(pm).length;
    if (!pmDoneFull && started) {
      title.textContent = '🌙 Do Now — Night Routine (still pending)';
      doNow.appendChild(checklist(effIso, 'pm', pm, dis));
    } else {
      title.textContent = '😴 All Done — Rest Well';
      const p = document.createElement('p'); p.className = 'small'; p.textContent = preview ? 'Your routine starts tomorrow, Mon 9 Nov — Day 1, Stage A.' : 'Next routine: Day ' + Math.max(1, dayNum(todayIso)) + ', Stage ' + stageFor(Math.max(1, dayNum(todayIso))) + ' morning. Sleep well, Rishikanta.'; doNow.appendChild(p);
    }
    other.appendChild(summaryCard('☀️ Morning', effIso, 'am', am));
    if (pmDoneFull || preview) other.appendChild(summaryCard('🌙 Night', effIso, 'pm', pm));
  }
  const nextStep = doNow.querySelector('.step:not(.done):not(.skipped)');
  if (nextStep) nextStep.classList.add('next');
  document.getElementById('logDetails').open = (slot === 'evening' || slot === 'late');

  const shaveT = document.getElementById('shaveToggle'); shaveT.checked = shave; shaveT.disabled = preview;

  const amDone = countDone(rec, am, 'am'), pmDoneC = countDone(rec, pm, 'pm');
  const amP = pct(amDone, realSteps(am).length), pmP = pct(pmDoneC, realSteps(pm).length);
  const dP = pct(amDone + pmDoneC, realSteps(am).length + realSteps(pm).length);
  [['amPct', amP, 'amBar'], ['pmPct', pmP, 'pmBar'], ['dayPct', dP, 'dayBar']].forEach(([l, v, b]) => { document.getElementById(l).textContent = v + '%'; document.getElementById(b).style.width = v + '%'; });
  document.getElementById('ringText').textContent = dP + '%';
  document.getElementById('ringVal').style.strokeDashoffset = String(226.2 * (1 - dP / 100));

  const tl = [];
  const firstAm = Object.values(rec.am).sort()[0], firstPm = Object.values(rec.pm).sort()[0];
  if (firstAm) tl.push('☀️ Morning — first step at ' + timeStr(firstAm));
  if (rec.midday.reapply) tl.push('🌤️ Sunscreen reapplied at ' + timeStr(rec.midday.reapply));
  if (firstPm) tl.push('🌙 Night — first step at ' + timeStr(firstPm));
  if (shave) tl.push('🪒 Shave day');
  document.getElementById('timeline').textContent = tl.length ? tl.join('  ·  ') : (preview ? 'Tracking begins Mon 9 Nov.' : 'No steps ticked yet today.');

  const spfEl = document.getElementById('spfTimer');
  if (rec.am.sunscreen) {
    const applied = new Date(rec.am.sunscreen); const reAt = new Date(applied.getTime() + 3 * 3600000);
    const diffM = Math.round((reAt - new Date()) / 60000);
    spfEl.textContent = '☀️ Sunscreen applied ' + timeStr(rec.am.sunscreen) + ' — reapply around ' + timeStr(reAt.toISOString()) + ' if outdoors' + (diffM > 0 ? ' (in ' + Math.floor(diffM / 60) + 'h ' + (diffM % 60) + 'm).' : ' (that time has passed — reapply now if you are still out).');
  } else spfEl.textContent = '';

  const log = store.logs[effIso] || {};
  if (state.log.redness === null && log.redness !== undefined) { state.log = { redness: log.redness, smooth: log.smooth, tone: log.tone, burn: log.burn }; document.getElementById('logNotes').value = log.notes || ''; }
  buildSeg('rednessSeg', [0, 1, 2, 3], 'redness'); buildSeg('smoothSeg', [1, 2, 3, 4, 5], 'smooth'); buildSeg('toneSeg', [1, 2, 3, 4, 5], 'tone'); buildSeg('burnSeg', ['No', 'Yes'], 'burn');
  document.getElementById('logSavedAt').textContent = log.savedAt ? 'Last saved at ' + timeStr(log.savedAt) : '';

  const rf = document.getElementById('redFlag'); const yLog = store.logs[addDays(effIso, -1)] || {};
  let flag = '';
  if (log.burn === 'Yes' || (log.redness === 3 && yLog.redness === 3)) flag = '⚠️ Red flag: burning or high redness — go back to Stage A basics (Face Wash + Gel Cream + Sunscreen) for 3 days and stop the newest product.';
  else if (shave && log.redness >= 2) flag = '🪒 Post-shave redness: do one more basics-only day tomorrow (no toner, no serum).';
  rf.textContent = flag; rf.classList.toggle('hidden', !flag);

  document.getElementById('photoStatus').textContent = rec.photo ? 'Photo marked done ✓' : (now.getDay() === 0 ? 'Today is Sunday — photo day!' : 'Next photo: coming Sunday.');
  renderProgress(todayIso, started);
  renderPhotos();
}

function buildSeg(id, vals, key) {
  const w = document.getElementById(id); w.innerHTML = '';
  vals.forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.textContent = v; if (state.log[key] === v) b.className = 'sel'; b.addEventListener('click', () => { state.log[key] = v; buildSeg(id, vals, key); }); w.appendChild(b); });
}
function isFullDay(dIso) { const r = store.days[dIso]; if (!r) return false; const d = dayNum(dIso); return countDone(r, amSteps(d, r.shave), 'am') >= realSteps(amSteps(d, r.shave)).length && countDone(r, pmSteps(d, r.shave), 'pm') >= realSteps(pmSteps(d, r.shave)).length; }
function renderProgress(todayIso, started) {
  let streak = 0, full = 0;
  if (started) {
    let iso = todayIso; if (!isFullDay(iso)) iso = addDays(iso, -1);
    while (iso >= START && isFullDay(iso)) { streak++; iso = addDays(iso, -1); }
    for (let d = START; d <= todayIso; d = addDays(d, 1)) if (isFullDay(d)) full++;
  }
  document.getElementById('streak').textContent = streak;
  document.getElementById('fullDays').textContent = full;
  document.getElementById('currentDay').textContent = todayIso < START ? 'Starts 9 Nov' : 'Day ' + dayNum(todayIso);
  const stages = [['A', 'Days 1–4 · 9–12 Nov', 'Basics: Face Wash + Gel Cream + Sunscreen'], ['B', 'Days 5–11 · 13–19 Nov', '+ Toner AM & PM'], ['C', 'Day 12+ · from 20 Nov', '+ Serum PM only']];
  const curDay = todayIso < START ? 0 : dayNum(todayIso);
  document.getElementById('stageTimeline').innerHTML = stages.map(([s, d, desc]) => '<div class="stage-row' + (curDay > 0 && stageFor(curDay) === s ? ' cur' : '') + '"><span class="dot"></span><div>Stage ' + s + ' — ' + d + '<br><span class="small">' + desc + '</span></div></div>').join('');

  // 7-day chart
  const chart = document.getElementById('chart'); chart.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const iso = addDays(todayIso, -i); const lg = store.logs[iso];
    const col = document.createElement('div'); col.className = 'col';
    if (lg) {
      col.innerHTML = '<div class="bars"><div class="b1" style="height:' + (lg.smooth / 5 * 88) + 'px"></div><div class="b2" style="height:' + (lg.tone / 5 * 88) + 'px"></div></div><div class="rdot" title="Redness ' + lg.redness + '/3"></div><div class="clab">' + iso.slice(8) + '/' + iso.slice(5, 7) + '</div>';
    } else col.innerHTML = '<div class="bars"></div><div class="clab">' + iso.slice(8) + '/' + iso.slice(5, 7) + '<br>no log</div>';
    chart.appendChild(col);
  }
  // Weekly summary (last 7 days)
  const ws = document.getElementById('weeklySummary');
  if (started) {
    let pcts = [], logs7 = [];
    for (let i = 6; i >= 0; i--) { const iso = addDays(todayIso, -i); if (iso < START) continue; const r = store.days[iso]; if (r) { const d = dayNum(iso); pcts.push(pct(countDone(r, amSteps(d, r.shave), 'am') + countDone(r, pmSteps(d, r.shave), 'pm'), realSteps(amSteps(d, r.shave)).length + realSteps(pmSteps(d, r.shave)).length)); } if (store.logs[iso]) logs7.push(store.logs[iso]); }
    const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length) : 0;
    const avgP = Math.round(avg(pcts));
    let tip = 'Keep going — consistency is what makes niacinamide + sunscreen work.';
    if (logs7.length && avg(logs7.map(l => l.redness)) >= 2) tip = 'Redness was high this week — focus on barrier basics, consider holding your current stage a few extra days.';
    else if (logs7.length && avg(logs7.map(l => l.smooth)) >= 4) tip = 'Smoothness is trending well — stay on this stage, do not add new products yet.';
    ws.innerHTML = 'Last 7 days: routine completion <b>' + avgP + '%</b>' + (logs7.length ? ' · avg smoothness <b>' + avg(logs7.map(l => l.smooth)).toFixed(1) + '/5</b> · avg tone <b>' + avg(logs7.map(l => l.tone)).toFixed(1) + '/5</b> · avg redness <b>' + avg(logs7.map(l => l.redness)).toFixed(1) + '/3</b>' : ' · no logs yet') + '<br>Tip: ' + tip + '<br>📦 Sunday habit: take your progress photo + Export a backup below.';
  }
  // History
  const hist = document.getElementById('history'); hist.innerHTML = '';
  if (!started) hist.innerHTML = '<p class="small">History starts Mon 9 Nov 2026.</p>';
  else for (let i = 0; i < 14; i++) {
    const iso = addDays(todayIso, -i); if (iso < START) break;
    const r = store.days[iso]; const d = dayNum(iso); const lg = store.logs[iso];
    if (!r && !lg) { hist.innerHTML += '<div class="hist-row"><b>' + iso + ' · Day ' + d + '</b> — no data</div>'; continue; }
    const rr = r || { am: {}, pm: {}, midday: {}, shave: false };
    const aP = pct(countDone(rr, amSteps(d, rr.shave), 'am'), realSteps(amSteps(d, rr.shave)).length);
    const pP = pct(countDone(rr, pmSteps(d, rr.shave), 'pm'), realSteps(pmSteps(d, rr.shave)).length);
    hist.innerHTML += '<div class="hist-row"><b>' + iso + ' · Day ' + d + ' · Stage ' + stageFor(d) + (rr.shave ? ' · 🪒 Shave' : '') + '</b><br>AM ' + aP + '% · PM ' + pP + '%' + (lg ? ' · Redness ' + lg.redness + ' · Smooth ' + lg.smooth + '/5 · Tone ' + lg.tone + '/5' : ' · No log') + '</div>';
  }
  // Settings fields (only fill when not being edited)
  const sm = document.getElementById('setMorning'); if (document.activeElement !== sm) sm.value = store.settings.morning;
  const sd = document.getElementById('setMidday'); if (document.activeElement !== sd) sd.value = store.settings.midday;
  const se = document.getElementById('setEvening'); if (document.activeElement !== se) se.value = store.settings.evening;
  const sv = document.getElementById('setShaveDay'); if (document.activeElement !== sv) sv.value = store.settings.shaveWeekday === null ? '' : String(store.settings.shaveWeekday);
  // Storage info
  const info = document.getElementById('storageInfo');
  if (navigator.storage && navigator.storage.estimate) {
    Promise.all([navigator.storage.estimate(), navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false)]).then(([est, persisted]) => {
      info.textContent = 'Storage used on this device: ~' + Math.max(1, Math.round((est.usage || 0) / 1024)) + ' KB · Protected from auto-clear: ' + (persisted ? 'yes' : 'requested — export backups to be safe') + '.';
    }).catch(() => {});
  }
}

/* ===== Progress photos in IndexedDB (device only) ===== */
function idbOpen() { return new Promise((res, rej) => { const r = indexedDB.open('myPlumPhotos', 1); r.onupgradeneeded = () => { r.result.createObjectStore('photos', { keyPath: 'iso' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function idbPut(rec) { const db = await idbOpen(); return new Promise((res, rej) => { const t = db.transaction('photos', 'readwrite'); t.objectStore('photos').put(rec); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function idbAll() { const db = await idbOpen(); return new Promise((res, rej) => { const rq = db.transaction('photos').objectStore('photos').getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error); }); }
let photoUrls = [];
async function renderPhotos() {
  const gal = document.getElementById('photoGallery'); const cmp = document.getElementById('photoCompare');
  let photos = []; try { photos = await idbAll(); } catch (e) { return; }
  photos.sort((a, b) => a.iso < b.iso ? -1 : 1);
  photoUrls.forEach(u => URL.revokeObjectURL(u)); photoUrls = [];
  gal.innerHTML = '';
  photos.forEach(p => { const u = URL.createObjectURL(p.blob); photoUrls.push(u); const f = document.createElement('figure'); const img = document.createElement('img'); img.src = u; img.alt = 'Progress photo ' + p.iso; const c = document.createElement('figcaption'); c.textContent = p.iso; f.appendChild(img); f.appendChild(c); gal.appendChild(f); });
  if (photos.length >= 2) {
    cmp.classList.remove('hidden');
    const uOld = URL.createObjectURL(photos[0].blob), uNew = URL.createObjectURL(photos[photos.length - 1].blob); photoUrls.push(uOld, uNew);
    document.getElementById('cmpOld').src = uOld; document.getElementById('cmpNew').src = uNew;
  } else cmp.classList.add('hidden');
}

/* ===== Safe backup export / import ===== */
function downloadBackup(data, label) {
  const payload = { app: 'my-plum-routine', version: 1, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-plum-routine-' + label + '-' + fmtDate(istNow()) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function validateImport(data) {
  if (!data || typeof data !== 'object') return null;
  const inner = data.data && data.app === 'my-plum-routine' ? data.data : data;
  if (!inner || typeof inner !== 'object' || typeof inner.days !== 'object' || typeof inner.logs !== 'object') return null;
  const clean = normalise(inner);
  Object.values(clean.logs).forEach(l => {
    l.redness = Math.min(3, Math.max(0, Number(l.redness) || 0)); l.smooth = Math.min(5, Math.max(1, Number(l.smooth) || 1));
    l.tone = Math.min(5, Math.max(1, Number(l.tone) || 1)); l.burn = l.burn === 'Yes' ? 'Yes' : 'No';
    l.notes = String(l.notes || '').slice(0, 500);
  });
  return clean;
}

/* ===== Events ===== */
document.getElementById('productList').innerHTML = PRODUCTS.map(p => '<div class="product"><div class="emoji">' + p.e + '</div><div><b>' + p.n + '</b><span>' + p.s + '</span></div></div>').join('');
document.querySelectorAll('.bottom-nav button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.bottom-nav button').forEach(x => x.classList.remove('active')); b.classList.add('active');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); document.getElementById('tab-' + b.dataset.tab).classList.add('active');
  window.scrollTo({ top: 0 });
}));
document.getElementById('tourDone').addEventListener('click', () => { store.tourSeen = true; save(store); render(); });
document.getElementById('installDismiss').addEventListener('click', e => { e.stopPropagation(); store.installDismissed = true; save(store); render(); });
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
document.getElementById('installBanner').addEventListener('click', () => { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } });
document.getElementById('shaveToggle').addEventListener('change', e => { const now = istNow(); let iso = fmtDate(now); if (slotFor(now) === 'late') iso = addDays(iso, -1); dayRec(iso).shave = e.target.checked; save(store); render(); });
document.getElementById('saveLog').addEventListener('click', () => {
  const now = istNow(); let iso = fmtDate(now); if (slotFor(now) === 'late') iso = addDays(iso, -1);
  if (iso < START) { document.getElementById('logSavedAt').textContent = 'Preview only — logs start Mon 9 Nov.'; return; }
  if (state.log.redness === null || state.log.smooth === null || state.log.tone === null || state.log.burn === null) { document.getElementById('logSavedAt').textContent = 'Please select Redness, Smoothness, Tone and Burning first.'; return; }
  store.logs[iso] = { redness: state.log.redness, smooth: state.log.smooth, tone: state.log.tone, burn: state.log.burn, notes: document.getElementById('logNotes').value.trim(), savedAt: new Date().toISOString() };
  save(store); render();
});
document.getElementById('saveSettings').addEventListener('click', () => {
  store.settings.morning = document.getElementById('setMorning').value || '05:00';
  store.settings.midday = document.getElementById('setMidday').value || '12:00';
  store.settings.evening = document.getElementById('setEvening').value || '18:00';
  const sv = document.getElementById('setShaveDay').value; store.settings.shaveWeekday = sv === '' ? null : Number(sv);
  save(store); document.getElementById('settingsMsg').textContent = 'Settings saved ✓ — Do Now, time slots and shave day now follow your timings.'; render();
});
document.getElementById('photoBtn').addEventListener('click', () => { const iso = fmtDate(istNow()); if (iso < START) { document.getElementById('photoStatus').textContent = 'Photos start after Day 1 — first Sunday photo is 15 Nov. You can still add a baseline photo with "Add progress photo".'; return; } dayRec(iso).photo = true; save(store); render(); });
document.getElementById('photoFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(); const url = URL.createObjectURL(f);
  img.onload = async () => {
    const scale = Math.min(1, 900 / Math.max(img.width, img.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
    cv.toBlob(async blob => { const iso = fmtDate(istNow()); await idbPut({ iso, blob, addedAt: new Date().toISOString() }); if (iso >= START) dayRec(iso).photo = true; save(store); render(); }, 'image/jpeg', 0.82);
  };
  img.src = url;
});
document.getElementById('cmpSlider').addEventListener('input', e => { document.getElementById('cmpTopWrap').style.width = e.target.value + '%'; });
document.getElementById('exportBtn').addEventListener('click', () => { downloadBackup(store, 'backup'); document.getElementById('backupMsg').textContent = 'Backup file downloaded — keep it somewhere safe.'; });
document.getElementById('importFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return; const r = new FileReader();
  r.onload = () => {
    let clean = null; try { clean = validateImport(JSON.parse(r.result)); } catch (err) { clean = null; }
    if (!clean) { document.getElementById('backupMsg').textContent = 'That file is not a valid My Plum Routine backup — nothing was changed.'; return; }
    downloadBackup(store, 'before-import');
    if (!window.confirm('Import will REPLACE all current tracking data with the backup file. A copy of your current data was just downloaded as safety. Continue?')) { document.getElementById('backupMsg').textContent = 'Import cancelled — nothing was changed.'; return; }
    store = clean; save(store); state.log = { redness: null, smooth: null, tone: null, burn: null }; render();
    document.getElementById('backupMsg').textContent = 'Backup imported ✓';
  };
  r.readAsText(f);
});

/* ===== Service worker + update notice ===== */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    /* Auto-update: actively check GitHub for a newer sw.js on every open,
       whenever the app comes back to the foreground, and hourly while open.
       sw.js installs with skipWaiting + clients.claim, and the
       controllerchange handler below then reloads the page — so a version
       pushed to GitHub applies itself with no user action. */
    const checkForUpdate = () => { reg.update().catch(() => {}); };
    checkForUpdate();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });
    setInterval(checkForUpdate, 60 * 60 * 1000);
    function watch(w) { if (!w) return; w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) document.getElementById('updateBanner').classList.remove('hidden'); }); }
    watch(reg.waiting); reg.addEventListener('updatefound', () => watch(reg.installing));
    document.getElementById('updateReload').addEventListener('click', () => { if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING'); window.location.reload(); });
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
  }).catch(() => {});
}

render();
setInterval(render, 60000);
