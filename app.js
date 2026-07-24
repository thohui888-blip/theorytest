// Piano Theory App — application logic
// Mechanics preserved from v2.0: multi-user localStorage records, flashcard
// display-toggle flip (no CSS 3D — causes mirrored back-face text), quiz
// wrong-answers recycled until all correct, weak-terms book, mastery streaks,
// Daily Review priority order. Audio needs a user gesture before AC.resume().

// ══════════ AUDIO ══════════
const AC = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, delay, dur, type, vol) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.connect(g); g.connect(AC.destination);
  o.type = type; o.frequency.value = freq;
  const t = AC.currentTime + delay;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + .01);
  g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.start(t); o.stop(t + dur + .01);
}

function playSound(type) {
  try {
    if (type === 'correct') { playTone(523, .0, .08, 'sine', .3); playTone(659, .09, .08, 'sine', .3); playTone(784, .18, .15, 'sine', .3); }
    else if (type === 'wrong') { playTone(300, .0, .1, 'sawtooth', .2); playTone(220, .12, .2, 'sawtooth', .15); }
    else if (type === 'complete') { [523, 659, 784, 1047].forEach((f, i) => playTone(f, i * .12, .15, 'sine', .25)); }
  } catch (e) {}
}

function playDemo(termId) {
  AC.resume && AC.resume();
  try {
    const base = 440; // A4 — used for demos that show ONE note's own envelope (fp/sfz/rf/pp..ff)
    const scale = [262, 294, 330, 349, 392]; // C4 D4 E4 F4 G4 — used for phrase-based demos
    switch (termId) {
      // Detached, same pitch, clear gaps — staccatissimo shorter/tighter than staccato.
      case 'staccato': [0, .3, .6].forEach(d => playTone(base, d, .12, 'sine', .45)); break;
      case 'staccatissimo': [0, .22, .44].forEach(d => playTone(base, d, .05, 'sine', .5)); break;
      // Smooth ascending run, notes overlapping slightly — the "connectedness" of legato.
      case 'legato': scale.forEach((f, i) => playTone(f, i * .32, .4, 'sine', .35)); break;
      case 'slur': playTone(330, 0, .45, 'sine', .35); playTone(392, .38, .5, 'sine', .35); break;
      // A tie IS one continuous sound (two written notes, one held pitch) — single note is correct here.
      case 'tie': playTone(base, 0, 1.0, 'sine', .35); break;
      // A short ascending/descending phrase with the volume of each note stepped up/down —
      // this is how a crescendo/decrescendo actually sounds across a passage, not one swelling tone.
      case 'crescendo': scale.forEach((f, i) => playTone(f, i * .32, .38, 'sine', [.08, .18, .3, .45, .62][i])); break;
      case 'decrescendo': [...scale].reverse().forEach((f, i) => playTone(f, i * .32, .38, 'sine', [.62, .45, .3, .18, .08][i])); break;
      // Three same-pitch notes with the middle one emphasized — the emphasis only reads as
      // "accented" in contrast to its (quieter) neighbours, not as an isolated loud beep.
      case 'accent': [0, .32, .64].forEach((d, i) => playTone(349, d, .26, 'sine', i === 1 ? .8 : .28)); break;
      // Marcato: stronger and more detached than accent — louder peak, shorter/clipped marked note.
      case 'marcato': [0, .32, .64].forEach((d, i) => playTone(349, d, i === 1 ? .2 : .22, 'sine', i === 1 ? .95 : .3)); break;
      // Tenuto: outer notes short & gapped; the middle note is held for its FULL value with no
      // gap into the next note — that held-through connection is what "tenuto" sounds like.
      case 'tenuto':
        playTone(349, 0, .18, 'sine', .35);
        playTone(349, .32, .48, 'sine', .45);
        playTone(392, .8, .18, 'sine', .35);
        break;
      case 'portato': [0, .34, .68].forEach(d => playTone(349, d, .24, 'sine', .38)); break;
      case 'fp': {
        const o = AC.createOscillator(), g = AC.createGain();
        o.connect(g); g.connect(AC.destination); o.type = 'sine'; o.frequency.value = base;
        const t = AC.currentTime;
        g.gain.setValueAtTime(0.8, t); g.gain.linearRampToValueAtTime(0.08, t + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.1); o.start(t); o.stop(t + 1.2);
        break;
      }
      case 'sfz': {
        const o = AC.createOscillator(), g = AC.createGain();
        o.connect(g); g.connect(AC.destination); o.type = 'sawtooth'; o.frequency.value = base;
        const t = AC.currentTime;
        g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.start(t); o.stop(t + 0.7);
        break;
      }
      case 'rf': {
        const o = AC.createOscillator(), g = AC.createGain();
        o.connect(g); g.connect(AC.destination); o.type = 'sine'; o.frequency.value = base;
        const t = AC.currentTime;
        g.gain.setValueAtTime(0.75, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        o.start(t); o.stop(t + 0.8);
        break;
      }
      case 'pp': playTone(base, 0, .9, 'sine', .05); break;
      case 'p': playTone(base, 0, .9, 'sine', .12); break;
      case 'mp': playTone(base, 0, .9, 'sine', .2); break;
      case 'mf': playTone(base, 0, .9, 'sine', .3); break;
      case 'f': playTone(base, 0, .9, 'sine', .5); break;
      case 'ff': playTone(base, 0, .9, 'sine', .7); break;
    }
  } catch (e) {}
}

// Map term -> demoId
const DEMO_MAP = {
  'Staccato': 'staccato', 'Staccatissimo': 'staccatissimo',
  'Portato / Portamento': 'portato', 'Legato': 'legato',
  'Slur': 'slur', 'Tie': 'tie',
  'Crescendo': 'crescendo', 'crescendo (cresc.)': 'crescendo',
  'Decrescendo': 'decrescendo', 'decrescendo (decresc.) / diminuendo (dim.)': 'decrescendo',
  'Accent': 'accent', 'Marcato': 'marcato', 'Tenuto': 'tenuto',
  'fp (fortepiano)': 'fp', 'sf, sfz (sforzando, sforzato)': 'sfz',
  'rf, rfz rinforzando (rinf.)': 'rf',
  'pp (pianissimo)': 'pp', 'p (piano)': 'p', 'mp (mezzo piano)': 'mp',
  'mf (mezzo forte)': 'mf', 'f (forte)': 'f', 'ff (fortissimo)': 'ff',
};

// ══════════ USER PROFILES & STORAGE ══════════
// Storage shape unchanged from v2.0 (keeps existing students' progress):
// pianoTheory_users = ["Alice","Ben"]
// pianoTheory_stats_<user> = { "<termKey>": {wrong:0, correctStreak:0, lastSeen:0} }
const LS_USERS = 'pianoTheory_users';
let currentUser = null;

function termKey(item) { return item.type === 'lang' ? item.it : item.term; }

function getUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS)) || []; } catch (e) { return []; }
}
function saveUsers(u) { try { localStorage.setItem(LS_USERS, JSON.stringify(u)); } catch (e) {} }

function getStats() {
  if (!currentUser) return {};
  try { return JSON.parse(localStorage.getItem('pianoTheory_stats_' + currentUser)) || {}; } catch (e) { return {}; }
}
function saveStats(s) {
  if (!currentUser) return;
  try { localStorage.setItem('pianoTheory_stats_' + currentUser, JSON.stringify(s)); } catch (e) {}
}

function recordAnswer(item, correct) {
  const stats = getStats();
  const k = termKey(item);
  if (!stats[k]) stats[k] = { wrong: 0, correctStreak: 0, lastSeen: 0 };
  const st = stats[k];
  st.lastSeen = Date.now();
  if (correct) {
    st.correctStreak = (st.correctStreak || 0) + 1;
    if (st.correctStreak >= 6) st.wrong = 0; // exit weak book after 6 consecutive correct
  } else {
    st.wrong = (st.wrong || 0) + 1;
    st.correctStreak = 0;
  }
  saveStats(stats);
}

function isWeak(item) {
  const st = getStats()[termKey(item)];
  return st && st.wrong >= 2;
}

function isMastered(item) {
  const st = getStats()[termKey(item)];
  return st && (st.correctStreak || 0) >= 3;
}

// ══════════ LESSON PATH (chunks a topic into small unlockable nodes) ══════════
// Computed on the fly from data.js — never persisted, so editing TOPICS content
// doesn't require a migration. Only the progress counters below are stored.
const LESSON_SIZE = 6;
const REVIEW_EVERY = 3; // insert a review node after every N lessons

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function buildPath(topic) {
  const lessonChunks = chunk(topic.items, LESSON_SIZE);
  const nodes = [];
  let sinceReview = [];
  lessonChunks.forEach((items, i) => {
    nodes.push({ type: 'lesson', items });
    sinceReview = sinceReview.concat(items);
    const lessonNumber = i + 1;
    const isLastLesson = i === lessonChunks.length - 1;
    if (lessonNumber % REVIEW_EVERY === 0 || (isLastLesson && sinceReview.length > 0)) {
      nodes.push({ type: 'review', items: sinceReview });
      sinceReview = [];
    }
  });
  return nodes;
}

// pianoTheory_progress_<user> = { "<topicId>": { unlocked:1, completed:[] } }
function getProgress() {
  if (!currentUser) return {};
  try { return JSON.parse(localStorage.getItem('pianoTheory_progress_' + currentUser)) || {}; } catch (e) { return {}; }
}
function saveProgress(p) {
  if (!currentUser) return;
  try { localStorage.setItem('pianoTheory_progress_' + currentUser, JSON.stringify(p)); } catch (e) {}
}
function getTopicProgress(topicId) {
  return getProgress()[topicId] || { unlocked: 1, completed: [] };
}
function completeNode(topic, nodeIndex) {
  const nodes = buildPath(topic);
  const p = getProgress();
  const tp = p[topic.id] || { unlocked: 1, completed: [] };
  tp.completed[nodeIndex] = true;
  tp.unlocked = Math.min(nodes.length, Math.max(tp.unlocked, nodeIndex + 2));
  p[topic.id] = tp;
  saveProgress(p);
}
// Item pool for Daily Review: only items from unlocked *lesson* nodes (review
// nodes resurface the same items, so including them would double-count).
function unlockedItems() {
  return currentModuleTopics().flatMap(topic => {
    const unlocked = getTopicProgress(topic.id).unlocked;
    return buildPath(topic).slice(0, unlocked).filter(n => n.type === 'lesson').flatMap(n => n.items);
  });
}

// ══════════ USER SELECT SCREEN ══════════
function renderUsers() {
  const list = document.getElementById('userList');
  const users = getUsers();
  list.innerHTML = '';
  if (users.length === 0) {
    list.innerHTML = '<div class="empty-hint">No profiles yet — add your name below</div>';
  }
  users.forEach(u => {
    const btn = document.createElement('button');
    btn.className = 'user-btn';
    btn.innerHTML = `<span>👤</span> <span>${u}</span> <span class="user-del" onclick="event.stopPropagation();deleteUser('${u.replace(/'/g, "\\\\'")}')">✕</span>`;
    btn.onclick = () => selectUser(u);
    list.appendChild(btn);
  });
}

function addUser() {
  const input = document.getElementById('newUserName');
  const name = input.value.trim();
  if (!name) return;
  const users = getUsers();
  if (users.includes(name)) { alert('Name already exists!'); return; }
  users.push(name);
  saveUsers(users);
  input.value = '';
  renderUsers();
}

function deleteUser(name) {
  if (!confirm(`Delete profile "${name}" and all records?`)) return;
  saveUsers(getUsers().filter(u => u !== name));
  try { localStorage.removeItem('pianoTheory_stats_' + name); } catch (e) {}
  renderUsers();
}

function selectUser(u) {
  currentUser = u;
  document.getElementById('currentUserName').textContent = u;
  showScreen('main');
}

// ══════════ NAV ══════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  hideFeedback();
  AC.resume && AC.resume();
  if (id === 'topics') renderTopics();
  if (id === 'lessonmap') renderLessonMap();
}

// Active module determines which topic array/screen-title renderTopics() uses.
// Both modules share the same flashcard/quiz/weak-terms/mastery engine below —
// items are only ever looked up through currentModuleTopics(), never TOPICS directly.
let currentModule = 'terms'; // 'terms' | 'instrument'

function currentModuleTopics() { return currentModule === 'terms' ? TOPICS : INSTRUMENT_TOPICS; }

function openTermsSigns() { currentModule = 'terms'; showScreen('topics'); }
function openMusicInstrument() { currentModule = 'instrument'; showScreen('topics'); }

// ══════════ TOPICS LIST (with mastery) ══════════
// Photo credits for the Music Instrument module (data.js `photo` fields).
// [term, author, license, source URL] — all from Wikimedia Commons.
// CC0/Public Domain entries don't legally require attribution but are listed
// anyway for transparency; CC BY / CC BY-SA entries require it.
const PHOTO_CREDITS = [
  ['Violin', 'Just plain Bill', 'CC0', 'https://commons.wikimedia.org/wiki/File:Violin_VL100.png'],
  ['Viola', 'Just plain Bill', 'Public Domain', 'https://commons.wikimedia.org/wiki/File:Bratsche.jpg'],
  ['Cello', 'JøMa', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Cello_unbekannter_Herkunft.jpg'],
  ['Double bass', 'Andrew Kepert', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:AGK_bass1_full.jpg'],
  ['Harp', 'Metropolitan Museum of Art', 'CC0', 'https://commons.wikimedia.org/wiki/File:Pedal_Harp_MET_134276.jpg'],
  ['Flute', 'Petar Milošević', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Western_concert_flute_(Yamaha).jpg'],
  ['Piccolo', 'User:Caesura', 'Public Domain', 'https://commons.wikimedia.org/wiki/File:Piccolo.jpg'],
  ['Oboe', 'Fratelli Patricola (ed. Gisbert K)', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Oboe_Patricola_Artista_PT1.jpg'],
  ['Cor anglais', 'Hustvedt', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:English_Horn_picture.jpg'],
  ['Clarinet', 'mark.drummer', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Clarinet_001.jpg'],
  ['Bassoon', 'Mezzofortist', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Bassoon.jpg'],
  ['Trumpet', 'Yamaha Corporation', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Yamaha_Trumpet_YTR-8335LA_crop.jpg'],
  ['Horn', 'Yamaha Corporation (bg: Habitator terrae)', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Yamaha_Horn_YHR-667V.png'],
  ['Trombone', 'Yamaha Corporation', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Yamaha_Tenor_trombone_YSL-891Z_(re-crop).jpg'],
  ['Tuba', 'Yamaha Corporation', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Yamaha_Bass_tuba_YFB-822.tif'],
  ['Timpani', 'Jorge Royan', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Munich_-_A_standard_set_of_timpani_Percussion_-_5647.jpg'],
  ['Xylophone', 'Daderot', 'CC0', 'https://commons.wikimedia.org/wiki/File:NBC_Xylophone,_c._1930,_gift_of_NBC_Radio_Chicago,_WMAQ_-_Museum_of_Science_and_Industry_(Chicago)_-_DSC06687.JPG'],
  ['Glockenspiel', 'flamurai', 'Public Domain', 'https://commons.wikimedia.org/wiki/File:Glockenspiel-malletech.jpg'],
  ['Snare drum (Side drum)', 'Englishteacher68', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Pearl_Reference_Snare_drum.jpg'],
  ['Bass drum', 'Žiga', 'CC0', 'https://commons.wikimedia.org/wiki/File:Gran_cassa.jpg'],
  ['Triangle', 'Philip.t.day', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Triangle_001.jpg'],
  ['Cymbals', 'Andrewa', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Clash_cymbals.jpg'],
  ['Tambourine', 'muzyczny.pl / Sp5uhe', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Instrument_perkusyjny_pandeiro_PA10ABS-BK-NH_firmy_Meinl.jpg'],
  ['Marimba', 'Marimbaone', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Marimba_One_4000_Series.jpg'],
  ['Vibraphone', 'Cliff (Flickr)', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:RCAStudioB_Vibraphone_1.jpg'],
  ['Celesta', 'Fredamas', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:C%C3%A9lesta_-_F%C3%A9n%C3%A9trange_-_20-09-2009.jpg'],
  ['Tubular bells', 'Xylosmygame', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Yamaha_Deagan_chimes_(from_LA_Percussion_Rentals).jpg'],
  ['Castanets', 'Bemoeial', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Castanets.jpg'],
  ['Tam-tam (gong)', '"っ" (ja.wikipedia)', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Tam-tam001.jpg'],
];

function renderTopics() {
  const titles = { terms: ['Terms & Signs', 'Choose a category'], instrument: ['Music Instrument', 'Choose a family'] };
  document.getElementById('topicsTitle').textContent = titles[currentModule][0];
  document.getElementById('topicsSub').textContent = titles[currentModule][1];
  const list = document.getElementById('topicsList');
  list.innerHTML = '';
  const weakItems = getAllWeakItems();
  if (weakItems.length > 0) {
    const wb = document.createElement('div');
    wb.className = 'weak-banner';
    wb.innerHTML = `<div class="weak-banner-icon">📕</div>
      <div class="weak-banner-text">
        <div class="weak-banner-title">My Weak Terms</div>
        <div class="weak-banner-sub">${weakItems.length} terms need practice</div>
      </div>
      <div class="chevron">›</div>`;
    wb.onclick = () => startWeakQuiz();
    list.appendChild(wb);
  }
  currentModuleTopics().forEach(topic => {
    const mastered = topic.items.filter(isMastered).length;
    const pct = Math.round(mastered / topic.items.length * 100);
    const nodes = buildPath(topic);
    const lessonIndices = nodes.map((n, i) => i).filter(i => nodes[i].type === 'lesson');
    const tp = getTopicProgress(topic.id);
    const doneLessons = lessonIndices.filter(i => tp.completed[i]).length;
    const card = document.createElement('div');
    card.className = 'topic-card';
    card.innerHTML = `
      <div class="topic-icon" style="background:${topic.color}1a;color:${topic.color}">${topic.icon}</div>
      <div class="topic-info">
        <div class="topic-name">${topic.name}</div>
        <div class="topic-count">${topic.items.length} terms · ${mastered} mastered · ${doneLessons}/${lessonIndices.length} lessons</div>
        <div class="mastery-bar"><div class="mastery-fill" style="width:${pct}%;background:${topic.color}"></div></div>
      </div>
      <div class="chevron">›</div>`;
    card.onclick = () => openLessonMap(topic);
    list.appendChild(card);
  });
  if (currentModule === 'instrument') {
    const credits = document.createElement('details');
    credits.className = 'photo-credits';
    credits.innerHTML = `<summary>📷 Photo credits</summary>
      <ul>${PHOTO_CREDITS.map(([term, author, license, url]) =>
        `<li>${term} — ${author}, <a href="${url}" target="_blank" rel="noopener">${license}</a></li>`
      ).join('')}</ul>`;
    list.appendChild(credits);
  }
}

// ══════════ FLASHCARDS (swipe + display toggle) ══════════
let currentTopic = null, learnIndex = 0, cardFlipped = false;
let currentItems = [], currentNodeIndex = 0;
let touchStartX = 0, touchStartY = 0;

// ══════════ LESSON MAP (nodes inside a topic) ══════════
function openLessonMap(topic) {
  currentTopic = topic;
  showScreen('lessonmap');
}

// Duolingo-style zigzag path: nodes offset left/right in a repeating pattern,
// with a dashed guide line behind them and a bouncing "START" badge over the
// one actionable node (unlock is strictly sequential, so there's ever at most one).
const PATH_OFFSETS = [0, 64, 0, -64];

function renderLessonMap() {
  document.getElementById('lessonmapTitle').textContent = currentTopic.name;
  document.getElementById('lessonmapSub').textContent = 'Choose a lesson';
  const nodes = buildPath(currentTopic);
  const tp = getTopicProgress(currentTopic.id);
  const list = document.getElementById('lessonmapList');
  list.innerHTML = '';
  let lessonNumber = 0;
  nodes.forEach((node, i) => {
    const locked = i >= tp.unlocked;
    const completed = !!tp.completed[i];
    const isReview = node.type === 'review';
    const isCurrent = !locked && !completed;
    if (!isReview) lessonNumber++;
    const label = isReview ? 'Review' : `Lesson ${lessonNumber}`;
    const icon = completed ? '✓' : (locked ? '🔒' : (isReview ? '⭐' : currentTopic.icon));
    const btnStyle = (!isReview && !locked && !completed) ? ` style="background:${currentTopic.color}"` : '';

    const wrap = document.createElement('div');
    wrap.className = 'path-node-wrap';
    wrap.style.setProperty('--offset', PATH_OFFSETS[i % PATH_OFFSETS.length] + 'px');
    wrap.innerHTML = `
      ${isCurrent ? '<div class="path-start-badge">START</div>' : ''}
      <button class="path-node${locked ? ' locked' : ''}${completed ? ' completed' : ''}${isReview ? ' review' : ''}"${btnStyle} ${locked ? 'disabled' : ''}>${icon}</button>
      <div class="path-node-label">${label}</div>`;
    if (!locked) wrap.querySelector('.path-node').onclick = () => selectNode(i);
    list.appendChild(wrap);
  });
  drawLessonPathLine();
}

// Smooth quadratic-bezier-through-midpoints curve — connects the *actual*
// rendered centers of each node (post-zigzag-transform), not a straight
// guess. Re-measures via getBoundingClientRect() so it always matches reality.
function smoothPathD(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], next = points[i + 1];
    const midX = (p.x + next.x) / 2, midY = (p.y + next.y) / 2;
    d += ` Q ${p.x},${p.y} ${midX},${midY}`;
  }
  const last = points[points.length - 1], prev = points[points.length - 2];
  d += ` Q ${prev.x},${prev.y} ${last.x},${last.y}`;
  return d;
}

function drawLessonPathLine() {
  const list = document.getElementById('lessonmapList');
  const old = document.getElementById('lessonPathSvg');
  if (old) old.remove();
  const wraps = Array.from(list.querySelectorAll('.path-node-wrap'));
  if (wraps.length < 2) return;
  const listRect = list.getBoundingClientRect();
  const points = wraps.map(w => {
    const r = w.querySelector('.path-node').getBoundingClientRect();
    return { x: r.left + r.width / 2 - listRect.left, y: r.top + r.height / 2 - listRect.top };
  });
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('id', 'lessonPathSvg');
  svg.setAttribute('class', 'lesson-path-svg');
  const path = document.createElementNS(svgNs, 'path');
  path.setAttribute('d', smoothPathD(points));
  path.setAttribute('fill', 'none');
  path.style.stroke = 'var(--line)';
  path.style.strokeWidth = '4';
  path.style.strokeDasharray = '2 12';
  path.style.strokeLinecap = 'round';
  svg.appendChild(path);
  list.insertBefore(svg, list.firstChild);
}
window.addEventListener('resize', () => {
  const el = document.getElementById('lessonmap');
  if (el && el.classList.contains('active')) drawLessonPathLine();
});

function selectNode(nodeIndex) {
  const node = buildPath(currentTopic)[nodeIndex];
  currentNodeIndex = nodeIndex;
  currentItems = node.items;
  if (node.type === 'review') {
    quizMode = 'review';
    beginQuizForCurrentNode();
  } else {
    quizMode = 'lesson';
    learnIndex = 0; cardFlipped = false;
    renderCard(); showScreen('learn');
  }
}

function renderCard() {
  const items = currentItems, total = items.length, item = items[learnIndex];
  const isLast = learnIndex === total - 1;
  const color = currentTopic.color;
  const pct = (learnIndex / total) * 100;
  const prog = document.getElementById('learnProgress');
  prog.style.width = pct + '%'; prog.style.background = color;
  document.getElementById('learnProgressLabel').textContent = `${learnIndex + 1}/${total}`;

  let frontHTML = '', backHTML = '';
  const iconHtml = item.img && ICONS[item.img] ? renderIcon(item.img) : '';
  const demoId = DEMO_MAP[item.term] || null;
  const demoBtn = demoId ? `<button class="demo-btn" onclick="event.stopPropagation();playDemo('${demoId}')">🔊 Play Sound</button>` : '';

  if (item.type === 'imgonly') {
    frontHTML = `
      <div class="card-hint">What is this symbol? Tap to reveal</div>
      ${iconHtml ? `<div class="card-img-wrap">${iconHtml}</div>` : ''}
      ${demoBtn}`;
    backHTML = `
      <div class="card-hint">Name & Meaning</div>
      <div class="card-term-name">${item.term}</div>
      <div class="card-meaning">${item.meaning}</div>`;
  } else if (item.type === 'lang') {
    const rows = [];
    if (item.it) rows.push(`<tr><td>Italian</td><td>${item.it}</td></tr>`);
    if (item.fr) rows.push(`<tr><td>French</td><td>${item.fr}</td></tr>`);
    if (item.de) rows.push(`<tr><td>German</td><td>${item.de}</td></tr>`);
    frontHTML = `
      <div class="card-hint">Tap to reveal meaning</div>
      <table class="card-lang-table">${rows.join('')}</table>`;
    backHTML = `
      <div class="card-hint">Meaning</div>
      <div class="card-term-name" style="font-size:18px;opacity:.85;">${item.it}</div>
      <div class="card-meaning" style="font-size:20px;">${item.meaning}</div>`;
  } else {
    const emojiHtml = item.emoji ? `<div class="card-emoji">${item.emoji}</div>` : '';
    const photoHtml = item.photo ? `<div class="card-img-wrap"><img src="${item.photo}" alt="${item.term}"></div>` : '';
    frontHTML = `
      <div class="card-hint">Tap to reveal</div>
      ${iconHtml ? `<div class="card-img-wrap">${iconHtml}</div>` : ''}
      ${photoHtml}
      ${emojiHtml}
      <div class="card-term">${item.term}</div>
      ${demoBtn}`;
    backHTML = `
      <div class="card-hint">Meaning</div>
      ${photoHtml}
      ${emojiHtml}
      <div class="card-term-name" style="font-size:20px;opacity:.85;">${item.term}</div>
      <div class="card-meaning" style="font-size:20px;">${item.meaning}</div>`;
  }

  document.getElementById('learnContent').innerHTML = `
    <div class="card-counter">${currentTopic.name} · ${learnIndex + 1} of ${total}</div>
    <div class="flashcard-wrap" onclick="flipCard()" id="cardWrap">
      <div class="flashcard" id="flashcard">
        <div class="flashcard-face flashcard-front">${frontHTML}</div>
        <div class="flashcard-face flashcard-back" style="background:${color}">${backHTML}</div>
      </div>
    </div>
    <div class="swipe-hint">← swipe to navigate →</div>
    <div class="flashcard-nav">
      <button class="nav-btn" onclick="prevCard()" ${learnIndex === 0 ? 'disabled' : ''}>← Back</button>
      ${isLast
        ? `<button class="nav-btn next-btn" onclick="startQuiz()" style="background:${color}">Start Quiz 🎯</button>`
        : `<button class="nav-btn next-btn" onclick="nextCard()" style="background:${color}">Next →</button>`
      }
    </div>`;

  const wrap = document.getElementById('cardWrap');
  wrap.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  wrap.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && learnIndex < total - 1) swipeCard('left');
      else if (dx > 0 && learnIndex > 0) swipeCard('right');
    }
  }, { passive: true });
}

function swipeCard(dir) {
  const c = document.getElementById('flashcard');
  if (!c) return;
  c.classList.add(dir === 'left' ? 'slide-left' : 'slide-right');
  setTimeout(() => {
    if (dir === 'left') learnIndex++;
    else learnIndex--;
    cardFlipped = false;
    renderCard();
  }, 200);
}

function flipCard() {
  cardFlipped = !cardFlipped;
  const c = document.getElementById('flashcard');
  if (c) c.classList.toggle('flipped', cardFlipped);
}
function nextCard() { learnIndex++; cardFlipped = false; renderCard(); }
function prevCard() { if (learnIndex > 0) { learnIndex--; cardFlipped = false; renderCard(); } }

// ══════════ QUIZ ══════════
let quizQuestions = [], currentQIndex = 0, correctCount = 0, totalAnswered = 0, answered = false;
let quizMode = 'lesson'; // 'lesson' | 'review' | 'daily' | 'weak'
let quizTotal = 0;
let quizPool = []; // items pool for wrong-option generation

function shuffle(arr) { return [...arr].sort(() => Math.random() - .5); }
function termLabel(item) {
  if (item.type === 'lang') return item.it || (item.fr || item.de);
  return item.term;
}

function allItems() { return currentModuleTopics().flatMap(t => t.items); }
function getAllWeakItems() { return allItems().filter(isWeak); }

function makeQuestion(item, pool) {
  const hasImg = !!(item.img && ICONS[item.img]);
  const others = pool.filter(x => x !== item && x.meaning !== item.meaning && termLabel(x) !== termLabel(item));
  const wrongs = [];
  const seenM = new Set([item.meaning]), seenT = new Set([termLabel(item)]);
  for (const o of shuffle(others)) {
    if (wrongs.length >= 3) break;
    if (seenM.has(o.meaning) || seenT.has(termLabel(o))) continue;
    seenM.add(o.meaning); seenT.add(termLabel(o));
    wrongs.push(o);
  }
  const r = Math.random();
  let qtype;
  if (item.type === 'imgonly') { qtype = 'img_to_name'; }
  else if (hasImg && r < 0.25) { qtype = 'img_to_name'; }
  else if (r < 0.45) { qtype = 'truefalse'; }
  else if (r < 0.75 || pool.length < 4) { qtype = 'term_to_meaning'; }
  else { qtype = 'meaning_to_term'; }

  if (qtype === 'img_to_name') {
    const opts = shuffle([termLabel(item), ...wrongs.map(w => termLabel(w))]);
    return { q: 'What is this symbol called?', img: item.img, answer: termLabel(item), options: opts, type: 'Name this symbol', item };
  } else if (qtype === 'term_to_meaning') {
    const opts = shuffle([item.meaning, ...wrongs.map(w => w.meaning)]);
    return { q: termLabel(item), img: item.type === 'normal' ? (item.img || null) : null, answer: item.meaning, options: opts, type: 'What does this mean?', item };
  } else if (qtype === 'truefalse') {
    const canBeFalse = wrongs.length > 0;
    const showTrue = !canBeFalse || Math.random() < 0.5;
    const shownMeaning = showTrue ? item.meaning : wrongs[0].meaning;
    return {
      q: `${termLabel(item)} means "${shownMeaning}"`,
      img: item.type === 'normal' ? (item.img || null) : null,
      answer: showTrue ? 'True' : 'False', options: ['True', 'False'], type: 'True or False?', item
    };
  } else {
    const opts = shuffle([termLabel(item), ...wrongs.map(w => termLabel(w))]);
    return { q: item.meaning, img: null, answer: termLabel(item), options: opts, type: 'Which term means this?', item };
  }
}

// Batches shuffled items into single questions, occasionally grouping a run of
// 4 into a 'match' round instead (needs >=4 items left to avoid an under-filled round).
function buildQuizQueue(shuffledItems, pool) {
  const queue = [];
  let i = 0;
  while (i < shuffledItems.length) {
    const remaining = shuffledItems.length - i;
    if (remaining >= 4 && Math.random() < 0.25) {
      queue.push({ kind: 'match', items: shuffledItems.slice(i, i + 4) });
      i += 4;
    } else {
      queue.push(makeQuestion(shuffledItems[i], pool));
      i++;
    }
  }
  return queue;
}

// Shared by the flashcard "Start Quiz" button and review nodes (which skip
// flashcards and jump straight into the quiz since it's revision, not new material).
function beginQuizForCurrentNode() {
  quizPool = currentTopic.items;
  const items = shuffle(currentItems);
  quizQuestions = buildQuizQueue(items, quizPool);
  quizTotal = items.length;
  beginQuiz();
}

function startQuiz() { beginQuizForCurrentNode(); }

function startDailyReview() {
  quizMode = 'daily';
  currentModule = 'terms'; // Daily Review banner is on the home screen, always reviews Terms & Signs
  const all = unlockedItems();
  const stats = getStats();
  // Priority: weak terms first, then never-seen, then least-recently-seen
  const scored = all.map(item => {
    const st = stats[termKey(item)] || {};
    let score = 0;
    if ((st.wrong || 0) >= 2) score += 1000 + (st.wrong * 10);
    if (!st.lastSeen) score += 500;
    else score += Math.min(400, (Date.now() - st.lastSeen) / (1000 * 60 * 60));
    return { item, score: score + Math.random() * 50 };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, 10).map(s => s.item);
  quizPool = all;
  quizQuestions = buildQuizQueue(shuffle(picked), quizPool);
  quizTotal = picked.length;
  beginQuiz();
}

function startWeakQuiz() {
  quizMode = 'weak';
  const weak = getAllWeakItems();
  if (weak.length === 0) return;
  quizPool = allItems();
  quizQuestions = buildQuizQueue(shuffle(weak), quizPool);
  quizTotal = weak.length;
  beginQuiz();
}

function beginQuiz() {
  currentQIndex = 0; correctCount = 0; totalAnswered = 0; answered = false;
  showScreen('quiz'); renderQuestion();
}

function quizColor() {
  if (quizMode === 'lesson') return currentTopic.color;
  if (quizMode === 'review' || quizMode === 'daily') return '#f5a524';
  return '#ef4444'; // weak
}

function quizExit() {
  showScreen((quizMode === 'lesson' || quizMode === 'review') ? 'lessonmap' : 'main');
}

function updateQuizProgress() {
  const color = quizColor();
  const prog = document.getElementById('quizProgress');
  prog.style.width = (correctCount / quizTotal * 100) + '%'; prog.style.background = color;
  document.getElementById('quizProgressLabel').textContent = `${correctCount}/${quizTotal}`;
}

function advanceQueue() {
  currentQIndex++;
  if (correctCount >= quizTotal) showResult();
  else renderQuestion();
}

function renderQuestion() {
  hideFeedback(); answered = false;
  const q = quizQuestions[currentQIndex];
  const color = quizColor();
  updateQuizProgress();

  if (q.kind === 'match') { renderMatchRound(q, color); return; }

  const imgHtml = q.img && ICONS[q.img] ? `<div class="question-img">${renderIcon(q.img)}</div>`
    : (q.item && q.item.photo ? `<div class="question-img"><img src="${q.item.photo}" alt=""></div>`
    : (q.item && q.item.emoji ? `<div class="question-img card-emoji" style="margin:12px auto;">${q.item.emoji}</div>` : ''));
  document.getElementById('quizBody').innerHTML = `
    <div class="question-card">
      <div class="question-type-badge" style="background:${color}1a;color:${color}">${q.type}</div>
      ${imgHtml}
      <div class="question-text">${q.q}</div>
    </div>
    <div class="options-grid">
      ${q.options.map(opt => `<button class="option-btn" onclick="selectAnswer(this,'${esc(opt)}','${esc(q.answer)}')">${opt}</button>`).join('')}
    </div>`;
}

// ══════════ MATCHING ROUND (pairs a batch of terms with their meanings) ══════════
let matchItems = [], matchRemaining = [], matchSelLeft = null, matchSelRight = null, matchPendingWrong = null;

function renderMatchRound(q, color) {
  matchItems = q.items;
  matchRemaining = matchItems.map((_, i) => i);
  matchSelLeft = null; matchSelRight = null; matchPendingWrong = null;
  const leftOrder = shuffle(matchItems.map((_, i) => i));
  const rightOrder = shuffle(matchItems.map((_, i) => i));
  document.getElementById('quizBody').innerHTML = `
    <div class="question-card">
      <div class="question-type-badge" style="background:${color}1a;color:${color}">Match the pairs</div>
      <div class="question-text" style="font-size:14px;">Tap a term, then its meaning</div>
    </div>
    <div class="match-grid">
      <svg class="match-lines-svg" id="matchLinesSvg"></svg>
      <div class="match-col" id="matchLeft">
        ${leftOrder.map(i => `<button class="match-btn" data-idx="${i}">${termLabel(matchItems[i])}</button>`).join('')}
      </div>
      <div class="match-col" id="matchRight">
        ${rightOrder.map(i => `<button class="match-btn" data-idx="${i}">${matchItems[i].meaning}</button>`).join('')}
      </div>
    </div>`;
  document.querySelectorAll('#matchLeft .match-btn').forEach(b => b.onclick = () => matchPick('left', b));
  document.querySelectorAll('#matchRight .match-btn').forEach(b => b.onclick = () => matchPick('right', b));
}

// Draws a straight connector between a matched left/right button pair so it's
// visually obvious which term paired with which meaning (not just color).
function drawMatchLine(leftEl, rightEl, strokeColor) {
  const svg = document.getElementById('matchLinesSvg');
  if (!svg) return null;
  const svgRect = svg.getBoundingClientRect();
  const lr = leftEl.getBoundingClientRect(), rr = rightEl.getBoundingClientRect();
  const svgNs = 'http://www.w3.org/2000/svg';
  const line = document.createElementNS(svgNs, 'line');
  line.setAttribute('x1', lr.right - svgRect.left);
  line.setAttribute('y1', lr.top + lr.height / 2 - svgRect.top);
  line.setAttribute('x2', rr.left - svgRect.left);
  line.setAttribute('y2', rr.top + rr.height / 2 - svgRect.top);
  line.style.stroke = strokeColor;
  line.style.strokeWidth = '3';
  line.style.strokeLinecap = 'round';
  svg.appendChild(line);
  return line;
}

function matchPick(side, btn) {
  if (answered || btn.disabled) return;
  if (side === 'left') {
    if (matchSelLeft) matchSelLeft.classList.remove('picked');
    matchSelLeft = btn; btn.classList.add('picked');
  } else {
    if (matchSelRight) matchSelRight.classList.remove('picked');
    matchSelRight = btn; btn.classList.add('picked');
  }
  if (!matchSelLeft || !matchSelRight) return;

  const leftIdx = +matchSelLeft.dataset.idx, rightIdx = +matchSelRight.dataset.idx;
  const item = matchItems[leftIdx];
  const leftEl = matchSelLeft, rightEl = matchSelRight;
  AC.resume && AC.resume();
  totalAnswered++;

  if (leftIdx === rightIdx) {
    leftEl.classList.remove('picked'); rightEl.classList.remove('picked');
    leftEl.classList.add('matched'); rightEl.classList.add('matched');
    leftEl.disabled = true; rightEl.disabled = true;
    recordAnswer(item, true); playSound('correct'); correctCount++;
    drawMatchLine(leftEl, rightEl, 'var(--green)');
    matchRemaining = matchRemaining.filter(i => i !== leftIdx);
    updateQuizProgress();
    matchSelLeft = null; matchSelRight = null;
    if (matchRemaining.length === 0) setTimeout(advanceQueue, 500);
  } else {
    // Pause on a wrong pick — reveal the correct meaning and wait for an
    // explicit "Continue" tap (same feedback-bar pattern as every other
    // question type), instead of auto-fading before it can be read.
    answered = true;
    leftEl.classList.add('wrong'); rightEl.classList.add('wrong');
    leftEl.disabled = true; rightEl.disabled = true;
    recordAnswer(item, false); playSound('wrong');
    const wrongLine = drawMatchLine(leftEl, rightEl, 'var(--red)');
    const correctRight = document.querySelector(`#matchRight .match-btn[data-idx="${leftIdx}"]`);
    let correctLine = null;
    if (correctRight) { correctRight.classList.add('reveal-correct'); correctLine = drawMatchLine(leftEl, correctRight, 'var(--green)'); }
    quizQuestions.push(makeQuestion(item, quizPool));
    matchRemaining = matchRemaining.filter(i => i !== leftIdx);
    matchPendingWrong = { leftEl, rightEl, correctRight, wrongLine, correctLine };
    matchSelLeft = null; matchSelRight = null;
    showFeedback(false, item.meaning, { item });
  }
}

function resumeMatchRound() {
  hideFeedback();
  if (matchPendingWrong) {
    const { leftEl, rightEl, correctRight, wrongLine, correctLine } = matchPendingWrong;
    leftEl.classList.add('gone');
    if (correctRight) correctRight.classList.add('gone');
    rightEl.classList.remove('wrong', 'picked'); rightEl.disabled = false;
    if (wrongLine) wrongLine.remove();
    if (correctLine) correctLine.remove();
    matchPendingWrong = null;
  }
  answered = false;
  if (matchRemaining.length === 0) advanceQueue();
}

function esc(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

function selectAnswer(btn, chosen, correct) {
  if (answered) return;
  answered = true; totalAnswered++; AC.resume && AC.resume();
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  const q = quizQuestions[currentQIndex];
  if (chosen === correct) {
    btn.classList.add('correct'); correctCount++;
    recordAnswer(q.item, true);
    playSound('correct'); showFeedback(true, correct, q);
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('.option-btn').forEach(b => { if (b.textContent.trim() === correct) b.classList.add('correct'); });
    recordAnswer(q.item, false);
    playSound('wrong'); showFeedback(false, correct, q);
    quizQuestions.push(makeQuestion(q.item, quizPool));
  }
}

function showFeedback(ok, correct, q) {
  const bar = document.getElementById('feedbackBar');
  bar.className = 'feedback-bar ' + (ok ? 'correct' : 'wrong');
  document.getElementById('feedbackTitle').textContent = ok ? '✓ Correct!' : '✗ Incorrect';
  document.getElementById('feedbackAnswer').textContent = ok ? 'Well done!' : 'Correct answer: ' + correct;
  const fi = document.getElementById('feedbackImg');
  if (!ok && q.item && q.item.img && ICONS[q.item.img]) {
    fi.innerHTML = renderIcon(q.item.img); fi.style.display = 'block';
  } else if (!ok && q.item && q.item.photo) {
    fi.innerHTML = `<img src="${q.item.photo}" alt="">`; fi.style.display = 'block';
  } else {
    fi.innerHTML = ''; fi.style.display = 'none';
  }
  document.getElementById('feedbackNext').textContent = correctCount >= quizTotal ? 'See Results' : 'Continue';
}

function hideFeedback() { document.getElementById('feedbackBar').className = 'feedback-bar'; }

function nextQuestion() {
  const q = quizQuestions[currentQIndex];
  if (q && q.kind === 'match') { resumeMatchRound(); return; }
  advanceQueue();
}

function showResult() {
  hideFeedback();
  playSound('complete');
  const perfect = totalAnswered === quizTotal;
  document.getElementById('resultEmoji').textContent = perfect ? '🏆' : '🎉';
  document.getElementById('resultTitle').textContent = perfect ? 'Perfect score!' : 'All done!';
  let subName;
  if (quizMode === 'lesson' || quizMode === 'review') {
    subName = quizMode === 'review' ? `${currentTopic.name} · Review` : currentTopic.name;
    completeNode(currentTopic, currentNodeIndex); // reaching results = all items answered correctly at least once
  } else {
    subName = quizMode === 'daily' ? 'Daily Review' : 'Weak Terms';
  }
  document.getElementById('resultSub').textContent = subName + (perfect ? '' : ` · ${totalAnswered - quizTotal} retried`);
  document.getElementById('resultScore').textContent = quizTotal;
  document.getElementById('resultDenom').textContent = '/ ' + quizTotal;
  document.getElementById('retryBtn').style.display = (quizMode === 'lesson' || quizMode === 'review') ? 'block' : 'none';
  document.getElementById('resultHomeBtn').textContent = (quizMode === 'lesson' || quizMode === 'review') ? '📍 Lesson Map' : '🏠 Home';
  showScreen('result');
}

function retryQuiz() { beginQuizForCurrentNode(); }

function resultBack() {
  showScreen((quizMode === 'lesson' || quizMode === 'review') ? 'lessonmap' : 'main');
}

// ══════════ INIT ══════════
renderUsers();
document.getElementById('newUserName').addEventListener('keydown', e => {
  if (e.key === 'Enter') addUser();
});
