// Live slab playground. Loads the real slab.js, the only JS on the page.
// Renders the same headline twice: a plain CSS heading, then the hypertype slab.
import { slabify } from '/hypertype/slab.js';

const input = document.getElementById('ht-input');
const fontSel = document.getElementById('ht-font');
const modeSel = document.getElementById('ht-mode');
const out = document.getElementById('ht-out');
const plain = document.getElementById('ht-plain');
const hint = document.getElementById('ht-hint');

if (!input.value.trim()) input.value = 'Designing\nat the\nspeed of thought';

let dispose;

async function render() {
  if (dispose) {
    dispose();
    dispose = undefined;
  }
  const text = input.value || ' ';

  // Plain CSS: an ordinary heading, ragged right edge.
  plain.className = fontSel.value + ' ht-plain';
  plain.textContent = text;

  // hypertype: every line sized to fill the column.
  out.className = fontSel.value;
  out.dataset.slabSource = text;
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  dispose = slabify(out, { mode: modeSel.value });

  hint.textContent = "slabify(el, { mode: '" + modeSel.value + "' })";
}

input.addEventListener('input', render);
fontSel.addEventListener('change', render);
modeSel.addEventListener('change', render);
render();
