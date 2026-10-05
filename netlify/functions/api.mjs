/*
 * Zerdeli Results — Netlify Function.
 * Данные берутся только из Google Таблицы (лист «Нәтижелер»), базы данных нет.
 * Настройки сайта — необязательный лист «Баптаулар» в той же таблице.
 *
 *   GET /api/tree          — список облыс/аудан/мектеп/сынып + настройки (без имён)
 *   GET /api/oblys?o=...   — все ученики одного облыса (имена и баллы)
 *   ?fresh=1               — без кэша (для кабинета)
 */

const SHEET_ID = process.env.SHEET_ID || '1AvwPYSYBbdhM-VupBbwFYxiRTwXozh_qskbabr3sJs4';
const SHEET_NAME = process.env.SHEET_NAME || 'Нәтижелер';
const SETTINGS_SHEET = process.env.SETTINGS_SHEET || 'Баптаулар';
const BASE = process.env.SHEET_BASE || 'https://docs.google.com';
const MEMO_TTL = 45 * 1000;

/* ------------------------------------------------------------ defaults */
const L = (kk, ru) => ({ kk, ru });
const DEFAULTS = {
  closed: false,
  releaseAt: '',
  title: L('Алтын сақа', 'Алтын сақа'),
  subtitle: L('Республикалық олимпиада', 'Республиканская олимпиада'),
  stage: L('Мектепішілік кезең', 'Школьный этап'),
  labels: {
    b1: L('Балл 1', 'Балл 1'), b2: L('Балл 2', 'Балл 2'), b3: L('Балл 3', 'Балл 3'),
    t: L('Жалпы балл', 'Общий балл'), team: L('Команданың жалпы балы', 'Общий балл команды'),
    st: L('Келесі кезең', 'Следующий этап'),
    place: L('Мектептегі орны', 'Место в школе'),
  },
  show: { b1: true, b2: true, b3: true, st: true },
  max: { b1: null, b2: null, b3: null, t: null },
  statusText: {
    yes: L('Келесі кезеңге өтті', 'Прошли в следующий этап'),
    no: L('Бұл жолы өтпеді', 'В этот раз не прошли'),
    pending: L('Нәтиже кейін жарияланады', 'Результат будет объявлен позже'),
  },
  showRank: false,
  showTeam: false,
  showTeacher: true,
  rankScope: 'audan',
  confetti: true,
  allowDownload: true,
  announcement: L('', ''),
  closedText: L('Нәтижелер жақында жарияланады', 'Результаты скоро будут опубликованы'),
  notFoundText: L('Бұл оқушы бойынша нәтиже әзірге жоқ', 'Результата пока нет'),
  contact: { text: L('', ''), url: '' },
};

/* ------------------------------------------------------------ helpers */
const clean = (v, max = 300) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
function num(v) {
  const s = String(v == null ? '' : v).trim().replace(/\s/g, '').replace(',', '.');
  if (s === '' || s === '-' || s === '—') return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
}
function parseStatus(v) {
  const s = clean(v).toLowerCase();
  if (!s) return 0;
  if (/^(иә|ия|иа|да|yes|y|true|1|\+|✓|✔|өтті|отті|прош(ел|ёл|ла|ли)|passed|pass)$/.test(s)) return 1;
  if (/^(жоқ|жок|нет|no|n|false|0|-|−|✗|✘|өтпеді|отпеди|не прош(ел|ёл|ла|ли)|failed|fail)$/.test(s)) return 2;
  if (/өтпеді|не прош|fail/.test(s)) return 2;
  if (/өтті|прош|pass/.test(s)) return 1;
  return 0;
}
function parsePlace(v) {
  const s = clean(v).toUpperCase().replace(/[^IVX0-9]/g, ' ').trim().split(' ')[0] || '';
  const roman = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
  if (roman[s]) return roman[s];
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 && n < 100 ? n : 0;
}
const absent = (v) => /^(жоқ|жок|нет|no|0|false|қатыспады|не участвовал)/i.test(clean(v));
const yes = (v) => /^(иә|ия|да|yes|true|1|\+|on|қосу|вкл)/i.test(clean(v));

function parseCsv(text) {
  text = String(text || '').replace(/^\uFEFF/, '');
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
    } else if (ch === '"' && cell === '') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const HEADER_RULES = [
  ['st', /келесі|кезеңге|өтті|прош[её]л|следующ|статус|status|passed/],
  ['t', /жалпы|барлығы|итог|общ|сумма|total|всего/],
  ['b1', /(балл|ұпай|упай|score|тур|бал)\D*1|1\D*(балл|ұпай|тур)/],
  ['b2', /(балл|ұпай|упай|score|тур|бал)\D*2|2\D*(балл|ұпай|тур)/],
  ['b3', /(балл|ұпай|упай|score|тур|бал)\D*3|3\D*(балл|ұпай|тур)/],
  ['q', /^қатысты|^қатысу|^участвовал|^присутств|^attend/],
  ['p', /^орын$|^орны$|^место$|^place$|^орын \(|жүлделі орын/],
  ['l', /литер|литера|letter|параллел/],
  ['tch', /мұғалім|муғалім|учитель|педагог|teacher/],
  ['id', /studentid|student id|^id$/],
  ['n', /аты|жөн|фио|ф\.\s*и|оқушы|окушы|ученик|участник|қатысушы|студент|name|тегі/],
  ['o', /облыс|област|oblys|region|өңір/],
  ['a', /аудан|район|audan|district/],
  ['s', /мектеп|школ|mektep|school|білім беру ұйым|организац/],
  ['c', /сынып|класс|synyp|class|grade/],
];
function mapHeaders(header) {
  const map = {};
  header.forEach((h, i) => {
    const n = clean(h).toLowerCase();
    if (!n) return;
    for (const [f, re] of HEADER_RULES) if (map[f] === undefined && re.test(n)) { map[f] = i; return; }
  });
  return map;
}
const letter = (i) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
const quote = (v) => (!v.includes("'") ? `'${v}'` : !v.includes('"') ? `"${v}"` : null);

class SheetError extends Error {}
async function gviz(sheet, tq) {
  const u = new URL(`${BASE}/spreadsheets/d/${SHEET_ID}/gviz/tq`);
  u.searchParams.set('tqx', 'out:csv');
  u.searchParams.set('headers', '1');
  u.searchParams.set('sheet', sheet);
  if (tq) u.searchParams.set('tq', tq);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  let res;
  try { res = await fetch(u, { signal: ctl.signal, redirect: 'follow' }); }
  catch (e) { throw new SheetError(e.name === 'AbortError' ? 'Google Таблица не ответила за 9 секунд' : 'Нет связи с Google Таблицей'); }
  finally { clearTimeout(timer); }
  const type = res.headers.get('content-type') || '';
  const text = await res.text();
  if (res.status === 401 || res.status === 403 || /accounts\.google\.com|ServiceLogin/i.test(text.slice(0, 3000))) {
    throw new SheetError('Таблица закрыта. Откройте доступ: «Настройки доступа → Все, у кого есть ссылка → Читатель».');
  }
  if (!res.ok || /text\/html/i.test(type)) throw new SheetError(`Google вернул ошибку ${res.status}`);
  return parseCsv(text);
}

/* ------------------------------------------------------------ memo (тёплый экземпляр функции) */
const memo = new Map();
async function cached(key, fresh, fn) {
  const hit = memo.get(key);
  if (!fresh && hit && Date.now() - hit.at < MEMO_TTL) return hit.p;
  const p = fn();
  memo.set(key, { at: Date.now(), p });
  p.catch(() => memo.delete(key));
  return p;
}

/* ------------------------------------------------------------ columns */
async function getColumns(fresh) {
  return cached('cols', fresh, async () => {
    const grid = await gviz(SHEET_NAME, 'select * limit 1');
    const header = grid[0] || [];
    const map = mapHeaders(header);
    const missing = ['o', 'a', 's', 'c'].filter((k) => map[k] === undefined);
    if (missing.length) {
      const names = { o: 'Облыс', a: 'Аудан', s: 'Мектеп', c: 'Сынып' };
      throw new SheetError(`На листе «${SHEET_NAME}» нет колонок: ${missing.map((k) => names[k]).join(', ')}. Найдены: ${header.map(clean).filter(Boolean).join(', ') || 'ничего'}`);
    }
    const names = Object.fromEntries(Object.entries(map).map(([k, i]) => [k, clean(header[i])]));
    return { map, names, letters: Object.fromEntries(Object.entries(map).map(([k, i]) => [k, letter(i)])) };
  });
}

/* ------------------------------------------------------------ settings */
const SETTING_KEYS = {
  title: ['title'], subtitle: ['subtitle'], stage: ['stage'], announcement: ['announcement'],
  closed_text: ['closedText'], not_found_text: ['notFoundText'],
  label_b1: ['labels', 'b1'], label_b2: ['labels', 'b2'], label_b3: ['labels', 'b3'], label_total: ['labels', 't'],
  label_team: ['labels', 'team'], label_status: ['labels', 'st'], label_place: ['labels', 'place'],
  status_yes: ['statusText', 'yes'], status_no: ['statusText', 'no'], status_pending: ['statusText', 'pending'],
  contact_text: ['contact', 'text'],
};
const SETTING_FLAGS = {
  closed: (s, v) => { s.closed = yes(v); },
  release_at: (s, v) => { const d = Date.parse(clean(v).replace(' ', 'T')); s.releaseAt = Number.isFinite(d) ? new Date(d).toISOString() : ''; },
  show_b1: (s, v) => { s.show.b1 = yes(v); }, show_b2: (s, v) => { s.show.b2 = yes(v); }, show_b3: (s, v) => { s.show.b3 = yes(v); },
  show_status: (s, v) => { s.show.st = yes(v); }, show_teacher: (s, v) => { s.showTeacher = yes(v); }, show_rank: (s, v) => { s.showRank = yes(v); }, show_team: (s, v) => { s.showTeam = yes(v); },
  confetti: (s, v) => { s.confetti = yes(v); }, download: (s, v) => { s.allowDownload = yes(v); },
  rank_scope: (s, v) => { s.rankScope = /облыс|област|oblys/i.test(v) ? 'oblys' : 'audan'; },
  max_b1: (s, v) => { s.max.b1 = num(v); }, max_b2: (s, v) => { s.max.b2 = num(v); }, max_b3: (s, v) => { s.max.b3 = num(v); }, max_total: (s, v) => { s.max.t = num(v); },
  contact_url: (s, v) => { let u = clean(v, 400); if (u && !/^(https?:\/\/|tel:|mailto:)/i.test(u)) u = 'https://' + u; s.contact.url = u; },
};
async function getSettings(fresh) {
  return cached('settings', fresh, async () => {
    const s = JSON.parse(JSON.stringify(DEFAULTS));
    let grid;
    // limit: если листа нет, Google отдаёт первый лист — не тянем 110k строк
    try { grid = await gviz(SETTINGS_SHEET, 'select A, B, C limit 300'); } catch { return s; }
    // если листа нет, Google молча отдаёт первый лист — проверяем заголовок
    if (!grid.length || !/параметр|parameter|key|баптау|настрой/i.test(clean(grid[0][0]))) return s;
    for (const row of grid.slice(1)) {
      const key = clean(row[0]).toLowerCase();
      if (!key) continue;
      if (SETTING_KEYS[key]) {
        const [a, b] = SETTING_KEYS[key];
        const target = b ? s[a][b] : s[a];
        const kk = clean(row[1], 600), ru = clean(row[2], 600);
        if (kk || ru) { target.kk = kk || ru; target.ru = ru || kk; } else if (key === 'announcement' || key === 'contact_text' || key === 'stage') { target.kk = ''; target.ru = ''; }
      } else if (SETTING_FLAGS[key]) SETTING_FLAGS[key](s, row[1]);
    }
    return s;
  });
}
// класс = сынып + литер: «3 А»
function classOf(grade, litera) {
  const g = clean(grade, 20).replace(/\s*(сынып|класс)\s*/i, '').trim();
  const lt = clean(litera, 10).replace(/[«»"']/g, '').toUpperCase();
  return lt ? `${g} ${lt}` : g;
}
const isOpen = (s) => !s.closed && !(s.releaseAt && Date.now() < Date.parse(s.releaseAt));

/* ------------------------------------------------------------ data */
async function getTree(fresh) {
  return cached('tree', fresh, async () => {
    const cols = await getColumns(fresh);
    const { o, a, s, c, l } = cols.letters;
    const g = [o, a, s, c, l].filter(Boolean).join(',');
    const grid = await gviz(SHEET_NAME, `select ${g},count(${s}) where ${o} <> '' group by ${g}`);
    const dict = []; const di = new Map();
    const d = (str) => { if (!di.has(str)) { di.set(str, dict.length); dict.push(str); } return di.get(str); };
    const merged = new Map(); const variants = new Map();
    for (const row of grid.slice(1)) {
      const raw = row[0];
      const vo = clean(row[0], 200), va = clean(row[1], 200), vs = clean(row[2], 300);
      const vc = classOf(row[3], l ? row[4] : '');
      if (!vo || !va || !vs || !vc) continue;
      if (!variants.has(vo)) variants.set(vo, new Set());
      variants.get(vo).add(raw);
      const k = [vo, va, vs, vc].join('\u0001');
      merged.set(k, (merged.get(k) || 0) + (num(row[l ? 5 : 4]) || 0));
    }
    const k = [];
    for (const [key, count] of merged) { const [vo, va, vs, vc] = key.split('\u0001'); k.push([d(vo), d(va), d(vs), d(vc), count]); }
    return { cols, d: dict, k, variants };
  });
}
async function getOblys(name, fresh) {
  return cached('o:' + name, fresh, async () => {
    // структуру берём из кэша (≤45 с), свежими читаем только строки облыса
    let tree = await getTree(false);
    if (!tree.variants.has(name) && fresh) tree = await getTree(true);
    const cols = tree.cols;
    const raws = [...(tree.variants.get(name) || [])];
    if (!raws.length) return null;
    const L = cols.letters;
    const conds = raws.map(quote);
    let grid; let filterLocally = false;
    if (conds.every(Boolean)) grid = await gviz(SHEET_NAME, `select * where ${conds.map((q) => `${L.o} = ${q}`).join(' or ')}`);
    else { grid = await gviz(SHEET_NAME); filterLocally = true; }
    const m = cols.map;
    const get = (row, f) => (m[f] === undefined ? '' : row[m[f]]);
    const dict = []; const di = new Map();
    const d = (str) => { if (!di.has(str)) { di.set(str, dict.length); dict.push(str); } return di.get(str); };
    const r = [];
    for (const row of grid.slice(1)) {
      const vo = clean(get(row, 'o'), 200);
      if (filterLocally && vo !== name) continue;
      const va = clean(get(row, 'a'), 200), vs = clean(get(row, 's'), 300), vc = classOf(get(row, 'c'), get(row, 'l'));
      if (!va || !vs || !vc) continue;
      const tch = clean(get(row, 'tch'), 120);
      r.push([d(va), d(vs), d(vc), clean(get(row, 'n'), 200),
        num(get(row, 'b1')), num(get(row, 'b2')), num(get(row, 'b3')), num(get(row, 't')), parseStatus(get(row, 'st')),
        parsePlace(get(row, 'p')), tch ? d(tch) : -1, m.q !== undefined && absent(get(row, 'q')) ? 1 : 0]);
    }
    return { o: name, d: dict, r };
  });
}

/* ------------------------------------------------------------ handler */
const JSON_TYPE = 'application/json; charset=utf-8';
function respond(body, status, fresh, seconds = 60) {
  const headers = { 'Content-Type': JSON_TYPE, 'X-Content-Type-Options': 'nosniff' };
  if (fresh || status >= 500) headers['Cache-Control'] = 'no-store';
  else {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    // общий кэш CDN: ученики получают ответ мгновенно, таблица читается не чаще раза в минуту
    headers['Netlify-CDN-Cache-Control'] = `public, durable, s-maxage=${seconds}, stale-while-revalidate=600`;
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default async (req) => {
  const url = new URL(req.url);
  const fresh = url.searchParams.has('fresh');
  try {
    if (url.pathname.endsWith('/api/tree')) {
      const [settings, tree] = await Promise.all([getSettings(fresh), getTree(fresh)]);
      const open = isOpen(settings);
      const body = { v: Date.now(), open, settings, cols: tree.cols.names };
      if (open || fresh) { body.d = tree.d; body.k = tree.k; }
      return respond(body, 200, fresh, open ? 60 : 20);
    }
    if (url.pathname.endsWith('/api/oblys')) {
      const name = clean(url.searchParams.get('o'), 200);
      const settings = await getSettings(fresh);
      if (!isOpen(settings) && !fresh) return respond({ error: 'closed' }, 403, true);
      const data = await getOblys(name, fresh);
      if (!data) return respond({ error: 'not found' }, 404, fresh, 30);
      return respond({ v: Date.now(), ...data }, 200, fresh);
    }
    return respond({ error: 'not found' }, 404, true);
  } catch (e) {
    const msg = e instanceof SheetError ? e.message : 'Ошибка: ' + (e && e.message);
    if (!(e instanceof SheetError)) console.error(e);
    return respond({ error: msg }, 502, true);
  }
};

export const config = { path: ['/api/tree', '/api/oblys'] };
