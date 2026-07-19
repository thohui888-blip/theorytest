// Piano Theory App — hand-drawn notation icon set
// Single consistent visual language: stroke #1f2430, round caps/joins, filled noteheads.
// Two icon kinds:
//   svg  -> raw <svg> markup, viewBox-based, drawn to match standard notation shapes
//   text -> rendered as a styled dynamic-mark (bold italic), matching how dynamics
//           are actually typeset in real scores (more accurate than a drawn image)
const INK = '#1f2430';

// Reusable note template (filled notehead + stem, stem-up so the notehead
// sits at the bottom). Marks are centered on the NOTEHEAD (cx 60), not the
// stem (x 73) — a mark attaches to the notehead, the stem just happens to
// exit near its right edge. Two mark zones:
//   "above" (y 4-28, above the stem tip)   -> fermata only: it always sits
//     above the note regardless of stem direction, unlike other marks.
//   "below" (y 104-130, right under the notehead) -> staccato/accent/tenuto/
//     marcato/staccatissimo/portato: these go on the notehead side OPPOSITE
//     the stem, so for this stem-up template that's below the notehead.
function noteWithMark(markSvg) {
  return `<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="90" rx="14" ry="10" fill="${INK}"/>
    <line x1="73" y1="90" x2="73" y2="35" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    ${markSvg}
  </svg>`;
}

const ICONS = {
  // ── Articulation marks: notehead-side placement (opposite the stem) ──
  staccato: { type: 'svg', svg: noteWithMark(`<circle cx="60" cy="112" r="6" fill="${INK}"/>`) },
  staccatissimo: { type: 'svg', svg: noteWithMark(`<path d="M60 130 L67 108 L53 108 Z" fill="${INK}"/>`) },
  accent: { type: 'svg', svg: noteWithMark(`<path d="M40 108 L80 117 L40 126" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`) },
  marcato: { type: 'svg', svg: noteWithMark(`<path d="M40 108 L60 128 L80 108" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`) },
  tenuto: { type: 'svg', svg: noteWithMark(`<line x1="42" y1="110" x2="78" y2="110" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`) },
  mezzo_staccato: { type: 'svg', svg: noteWithMark(`<circle cx="60" cy="110" r="5" fill="${INK}"/><line x1="42" y1="124" x2="78" y2="124" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`) },
  // Fermata is the one exception: always above the note, never flips with stem direction.
  fermata: { type: 'svg', svg: noteWithMark(`<path d="M30 28 A30 24 0 0 1 90 28" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="60" cy="22" r="5" fill="${INK}"/>`) },

  // ── Free-standing notation symbols ──
  crescendo_sign: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 50 L130 28 M20 50 L130 72" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>` },
  decrescendo_sign: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M140 50 L30 28 M140 50 L30 72" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>` },
  repeat: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="36" y="10" width="6" height="80" fill="${INK}"/>
    <rect x="50" y="10" width="3" height="80" fill="${INK}"/>
    <circle cx="62" cy="38" r="4" fill="${INK}"/><circle cx="62" cy="62" r="4" fill="${INK}"/>
    <circle cx="98" cy="38" r="4" fill="${INK}"/><circle cx="98" cy="62" r="4" fill="${INK}"/>
    <rect x="107" y="10" width="3" height="80" fill="${INK}"/>
    <rect x="118" y="10" width="6" height="80" fill="${INK}"/>
  </svg>` },
  first_time_bar: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 50 L30 28 L130 28" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <text x="78" y="22" font-family="Georgia,serif" font-size="26" font-weight="700" fill="${INK}" text-anchor="middle">1.</text>
  </svg>` },
  second_time_bar: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 50 L30 28 L130 28" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <text x="78" y="22" font-family="Georgia,serif" font-size="26" font-weight="700" fill="${INK}" text-anchor="middle">2.</text>
  </svg>` },
  ottava: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <text x="38" y="62" font-family="Georgia,serif" font-style="italic" font-size="40" font-weight="700" fill="${INK}">8</text>
    <path d="M62 50 L130 50" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="7,6"/>
    <path d="M130 50 L130 72" fill="none" stroke="${INK}" stroke-width="3"/>
  </svg>` },
  slur: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="38" cy="68" rx="11" ry="8" fill="${INK}"/>
    <ellipse cx="122" cy="50" rx="11" ry="8" fill="${INK}"/>
    <path d="M40 54 Q80 28 120 38" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  </svg>` },
  tie: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="38" cy="65" rx="11" ry="8" fill="${INK}"/>
    <ellipse cx="98" cy="65" rx="11" ry="8" fill="${INK}"/>
    <path d="M42 48 Q68 26 94 48" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  </svg>` },
  common_time: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <text x="80" y="76" font-family="Georgia,serif" font-size="70" font-weight="700" fill="${INK}" text-anchor="middle">C</text>
  </svg>` },
  alla_breve: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <text x="80" y="76" font-family="Georgia,serif" font-size="70" font-weight="700" fill="${INK}" text-anchor="middle">C</text>
    <line x1="80" y1="14" x2="80" y2="86" stroke="${INK}" stroke-width="4"/>
  </svg>` },
  multi_bar_rest: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <text x="80" y="26" font-family="Georgia,serif" font-size="26" font-weight="700" fill="${INK}" text-anchor="middle">4</text>
    <line x1="40" y1="38" x2="40" y2="62" stroke="${INK}" stroke-width="4"/>
    <line x1="120" y1="38" x2="120" y2="62" stroke="${INK}" stroke-width="4"/>
    <rect x="40" y="44" width="80" height="12" fill="${INK}"/>
  </svg>` },
  metronome: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="30" cy="68" rx="11" ry="8" fill="${INK}"/>
    <line x1="41" y1="68" x2="41" y2="16" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <text x="62" y="58" font-family="Georgia,serif" font-size="30" font-weight="700" fill="${INK}">=</text>
    <text x="92" y="62" font-family="Georgia,serif" font-size="30" font-weight="700" fill="${INK}">88</text>
  </svg>` },
  dal_segno: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <line x1="35" y1="20" x2="125" y2="80" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="40" cy="80" r="6" fill="${INK}"/>
    <circle cx="120" cy="20" r="6" fill="${INK}"/>
    <path d="M62 38 C84 30, 84 56, 64 56 C44 56, 44 70, 64 64" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
  </svg>` },
  repeated_notes: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="46" cy="72" rx="11" ry="8" fill="${INK}"/>
    <line x1="57" y1="72" x2="57" y2="16" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="42" y1="38" x2="70" y2="28" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <line x1="42" y1="52" x2="70" y2="42" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  </svg>` },
  repeated_bars: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <line x1="38" y1="80" x2="122" y2="20" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="46" cy="34" r="8" fill="${INK}"/>
    <circle cx="114" cy="66" r="8" fill="${INK}"/>
  </svg>` },

  // ── Piano / String Technique symbols ──
  arpeggio: { type: 'svg', svg: `<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="100" cy="90" rx="13" ry="9" fill="${INK}"/>
    <ellipse cx="100" cy="65" rx="13" ry="9" fill="${INK}"/>
    <ellipse cx="100" cy="40" rx="13" ry="9" fill="${INK}"/>
    <line x1="113" y1="90" x2="113" y2="15" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M72 98 Q60 87 72 76 Q84 65 72 54 Q60 43 72 32" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M64 39 L72 30 L80 39" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>` },
  pedal: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="58" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="34" fill="${INK}">Ped.</text>
    <path d="M92 68 L142 68 L142 44" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>` },
  bow_slur: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="38" cy="72" rx="9" ry="7" fill="${INK}"/><line x1="47" y1="72" x2="47" y2="35" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="80" cy="66" rx="9" ry="7" fill="${INK}"/><line x1="89" y1="66" x2="89" y2="29" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="122" cy="60" rx="9" ry="7" fill="${INK}"/><line x1="131" y1="60" x2="131" y2="23" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M33 20 Q80 3 127 13" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  </svg>` },
  down_bow: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 78 L50 28 L110 28 L110 78" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>` },
  up_bow: { type: 'svg', svg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M48 26 L80 78 L112 26" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>` },

  // ── Dynamics: typeset as styled marks, not drawn images ──
  ppp: { type: 'text', text: 'ppp' }, fff: { type: 'text', text: 'fff' },
  pp: { type: 'text', text: 'pp' }, p_dyn: { type: 'text', text: 'p' },
  mp: { type: 'text', text: 'mp' }, mf: { type: 'text', text: 'mf' },
  f_dyn: { type: 'text', text: 'f' }, ff: { type: 'text', text: 'ff' },
  fp: { type: 'text', text: 'fp' }, sf: { type: 'text', text: 'sf' }, sfz: { type: 'text', text: 'sfz' },
};

function renderIcon(key) {
  const icon = ICONS[key];
  if (!icon) return '';
  if (icon.type === 'text') return `<div class="dyn-mark">${icon.text}</div>`;
  return `<div class="icon-svg">${icon.svg}</div>`;
}
