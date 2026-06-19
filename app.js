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
    const base = 440; // A4
    switch (termId) {
      case 'staccato': [0, .25, .5].forEach(d => playTone(base, d, .06, 'sine', .4)); break;
      case 'staccatissimo': [0, .18, .36].forEach(d => playTone(base, d, .03, 'sine', .45)); break;
      case 'legato': { [440, 494, 523, 587].forEach((f, i) => playTone(f, i * .28, .35, 'sine', .3)); break; }
      case 'slur': playTone(440, 0, .4, 'sine', .3); playTone(523, .35, .4, 'sine', .3); break;
      case 'tie': playTone(440, 0, .8, 'sine', .3); break;
      case 'crescendo': {
        const o = AC.createOscillator(), g = AC.createGain();
        o.connect(g); g.connect(AC.destination); o.type = 'sine'; o.frequency.value = 440;
        const t = AC.currentTime;
        g.gain.setValueAtTime(0.02, t); g.gain.linearRampToValueAtTime(0.5, t + 1.2);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.3); o.start(t); o.stop(t + 1.4);
        break;
      }
      case 'decrescendo': {
        const o = AC.createOscillator(), g = AC.createGain();
        o.connect(g); g.connect(AC.destination); o.type = 'sine'; o.frequency.value = 440;
        const t = AC.currentTime;
        g.gain.setValueAtTime(0.5, t); g.gain.linearRampToValueAtTime(0.02, t + 1.2);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.3); o.start(t); o.stop(t + 1.4);
        break;
      }
      case 'accent': playTone(440, 0, .5, 'sine', .7); break;
      case 'marcato': playTone(440, 0, .3, 'sine', .85); break;
      case 'tenuto': playTone(440, 0, .7, 'sine', .4); break;
      case 'portato': [0, .3, .6].forEach(d => playTone(440, d, .2, 'sine', .35)); break;
      case 'fp': {
        const o = AC.createOscillator(), g = AC.createGain();
        o.connect(g); g.connect(AC.destination); o.type = 'sine'; o.frequency.value = 440;
        const t = AC.currentTime;
        g.gain.setValueAtTime(0.8, t); g.gain.linearRampToValueAtTime(0.05, t + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8); o.start(t); o.stop(t + 0.9);
        break;
      }
      case 'sfz': {
        const o = AC.createOscillator(), g = AC.createGain();
        o.connect(g); g.connect(AC.destination); o.type = 'sawtooth'; o.frequency.value = 440;
        const t = AC.currentTime;
        g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.start(t); o.stop(t + 0.4);
        break;
      }
      case 'rf': {
        const o = AC.createOscillator(), g = AC.createGain();
        o.connect(g); g.connect(AC.destination); o.type = 'sine'; o.frequency.value = 440;
        const t = AC.currentTime;
        g.gain.setValueAtTime(0.75, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.start(t); o.stop(t + 0.5);
        break;
      }
      case 'pp': playTone(440, 0, .6, 'sine', .05); break;
      case 'p': playTone(440, 0, .6, 'sine', .12); break;
      case 'mp': playTone(440, 0, .6, 'sine', .2); break;
      case 'mf': playTone(440, 0, .6, 'sine', .3); break;
      case 'f': playTone(440, 0, .6, 'sine', .5); break;
      case 'ff': playTone(440, 0, .6, 'sine', .7); break;
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
}

// Active module determines which topic array/screen-title renderTopics() uses.
// Both modules share the same flashcard/quiz/weak-terms/mastery engine below —
// items are only ever looked up through currentModuleTopics(), never TOPICS directly.
let currentModule = 'terms'; // 'terms' | 'instrument'

function currentModuleTopics() { return currentModule === 'terms' ? TOPICS : INSTRUMENT_TOPICS; }

function openTermsSigns() { currentModule = 'terms'; showScreen('topics'); }
function openMusicInstrument() { currentModule = 'instrument'; showScreen('topics'); }

// ══════════ TOPICS LIST (with mastery) ══════════
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
    const card = document.createElement('div');
    card.className = 'topic-card';
    card.innerHTML = `
      <div class="topic-icon" style="background:${topic.color}1a;color:${topic.color}">${topic.icon}</div>
      <div class="topic-info">
        <div class="topic-name">${topic.name}</div>
        <div class="topic-count">${topic.items.length} terms · ${mastered} mastered</div>
        <div class="mastery-bar"><div class="mastery-fill" style="width:${pct}%;background:${topic.color}"></div></div>
      </div>
      <div class="chevron">›</div>`;
    card.onclick = () => selectTopic(topic);
    list.appendChild(card);
  });
}

// ══════════ FLASHCARDS (swipe + display toggle) ══════════
let currentTopic = null, learnIndex = 0, cardFlipped = false;
let touchStartX = 0, touchStartY = 0;

function selectTopic(t) {
  currentTopic = t; learnIndex = 0; cardFlipped = false;
  renderCard(); showScreen('learn');
}

function renderCard() {
  const items = currentTopic.items, total = items.length, item = items[learnIndex];
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
    frontHTML = `
      <div class="card-hint">Tap to reveal</div>
      ${iconHtml ? `<div class="card-img-wrap">${iconHtml}</div>` : ''}
      ${emojiHtml}
      <div class="card-term">${item.term}</div>
      ${demoBtn}`;
    backHTML = `
      <div class="card-hint">Meaning</div>
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
let quizMode = 'topic'; // 'topic' | 'daily' | 'weak'
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
  else if (hasImg && r < 0.3) { qtype = 'img_to_name'; }
  else if (r < 0.65 || pool.length < 4) { qtype = 'term_to_meaning'; }
  else { qtype = 'meaning_to_term'; }

  if (qtype === 'img_to_name') {
    const opts = shuffle([termLabel(item), ...wrongs.map(w => termLabel(w))]);
    return { q: 'What is this symbol called?', img: item.img, answer: termLabel(item), options: opts, type: 'Name this symbol', item };
  } else if (qtype === 'term_to_meaning') {
    const opts = shuffle([item.meaning, ...wrongs.map(w => w.meaning)]);
    return { q: termLabel(item), img: item.type === 'normal' ? (item.img || null) : null, answer: item.meaning, options: opts, type: 'What does this mean?', item };
  } else {
    const opts = shuffle([termLabel(item), ...wrongs.map(w => termLabel(w))]);
    return { q: item.meaning, img: null, answer: termLabel(item), options: opts, type: 'Which term means this?', item };
  }
}

function startQuiz() {
  quizMode = 'topic';
  quizPool = currentTopic.items;
  const items = shuffle(currentTopic.items);
  quizQuestions = items.map(i => makeQuestion(i, quizPool));
  quizTotal = items.length;
  beginQuiz();
}

function startDailyReview() {
  quizMode = 'daily';
  currentModule = 'terms'; // Daily Review banner is on the home screen, always reviews Terms & Signs
  const all = allItems();
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
  quizQuestions = shuffle(picked).map(i => makeQuestion(i, quizPool));
  quizTotal = picked.length;
  beginQuiz();
}

function startWeakQuiz() {
  quizMode = 'weak';
  const weak = getAllWeakItems();
  if (weak.length === 0) return;
  quizPool = allItems();
  quizQuestions = shuffle(weak).map(i => makeQuestion(i, quizPool));
  quizTotal = weak.length;
  beginQuiz();
}

function beginQuiz() {
  currentQIndex = 0; correctCount = 0; totalAnswered = 0; answered = false;
  showScreen('quiz'); renderQuestion();
}

function quizColor() {
  if (quizMode === 'topic') return currentTopic.color;
  if (quizMode === 'daily') return '#f5a524';
  return '#ef4444';
}

function quizExit() {
  showScreen(quizMode === 'topic' ? 'topics' : 'main');
}

function renderQuestion() {
  hideFeedback(); answered = false;
  const q = quizQuestions[currentQIndex];
  const color = quizColor();
  const prog = document.getElementById('quizProgress');
  prog.style.width = (correctCount / quizTotal * 100) + '%'; prog.style.background = color;
  document.getElementById('quizProgressLabel').textContent = `${correctCount}/${quizTotal}`;

  const imgHtml = q.img && ICONS[q.img] ? `<div class="question-img">${renderIcon(q.img)}</div>`
    : (q.item && q.item.emoji ? `<div class="question-img card-emoji" style="margin:12px auto;">${q.item.emoji}</div>` : '');
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
  } else {
    fi.innerHTML = ''; fi.style.display = 'none';
  }
  document.getElementById('feedbackNext').textContent = correctCount >= quizTotal ? 'See Results' : 'Continue';
}

function hideFeedback() { document.getElementById('feedbackBar').className = 'feedback-bar'; }

function nextQuestion() {
  currentQIndex++;
  if (correctCount >= quizTotal) showResult();
  else renderQuestion();
}

function showResult() {
  hideFeedback();
  playSound('complete');
  const perfect = totalAnswered === quizTotal;
  document.getElementById('resultEmoji').textContent = perfect ? '🏆' : '🎉';
  document.getElementById('resultTitle').textContent = perfect ? 'Perfect score!' : 'All done!';
  const subName = quizMode === 'topic' ? currentTopic.name : (quizMode === 'daily' ? 'Daily Review' : 'Weak Terms');
  document.getElementById('resultSub').textContent = subName + (perfect ? '' : ` · ${totalAnswered - quizTotal} retried`);
  document.getElementById('resultScore').textContent = quizTotal;
  document.getElementById('resultDenom').textContent = '/ ' + quizTotal;
  document.getElementById('retryBtn').style.display = quizMode === 'topic' ? 'block' : 'none';
  showScreen('result');
}

function retryQuiz() { startQuiz(); }

// ══════════ INIT ══════════
renderUsers();
document.getElementById('newUserName').addEventListener('keydown', e => {
  if (e.key === 'Enter') addUser();
});
