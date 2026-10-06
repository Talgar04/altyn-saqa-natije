(() => {
  'use strict';
  const DEFAULT_SHEET = 'https://docs.google.com/spreadsheets/d/1AvwPYSYBbdhM-VupBbwFYxiRTwXozh_qskbabr3sJs4/edit';
  const app = document.getElementById('app');

  /* ================================================================ helpers */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (k === 'selected') el.selected = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  let toastT = 0;
  function toast(msg, bad) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, bad ? 5000 : 2400);
  }
  const clean = (v, max = 300) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
  const num = (v) => { if (v === null || v === undefined) return null; if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null; const s = String(v).trim().replace(/\s/g, '').replace(',', '.'); if (!s || s === '-' || s === '—') return null; const n = Number(s); return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : NaN; };
  const fmt = (n) => (n === null || n === undefined ? '' : String(Math.round(n * 1000) / 1000));
  const int = (n) => Number(n || 0).toLocaleString('ru-RU');
  const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[әа]/g, 'а').replace(/ғ/g, 'г').replace(/қ/g, 'к').replace(/ң/g, 'н').replace(/ө/g, 'о').replace(/[ұү]/g, 'у').replace(/һ/g, 'х').replace(/[іи]/g, 'и');
  const collator = new Intl.Collator(['kk', 'ru'], { numeric: true, sensitivity: 'base', ignorePunctuation: true });
  const uniq = (arr) => [...new Set(arr)].filter(Boolean).sort(collator.compare);
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } };

  /* ================================================================ api */
  let token = '';
  try { token = localStorage.getItem('as_admin') || ''; } catch (e) { /* ignore */ }
  const setToken = (t) => { token = t; try { localStorage.setItem('as_admin', t); } catch (e) { /* ignore */ } };
  async function gz(text) {
    if (typeof CompressionStream === 'undefined') return null;
    const cs = new CompressionStream('gzip');
    const stream = new Blob([text]).stream().pipeThrough(cs);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function api(path, opts = {}) {
    const headers = { Authorization: 'Bearer ' + token };
    let body;
    if (opts.body !== undefined) {
      const text = JSON.stringify(opts.body);
      const packed = text.length > 50000 ? await gz(text) : null;
      if (packed) { body = packed; headers['X-Gz'] = '1'; headers['Content-Type'] = 'application/octet-stream'; }
      else { body = text; headers['Content-Type'] = 'application/json'; }
    }
    let res;
    try { res = await fetch('/api/admin/' + path, { method: opts.method || 'GET', headers, body, cache: 'no-store' }); }
    catch (e) { throw new Error('Нет связи с сервером. Проверьте интернет.'); }
    if (opts.raw && res.ok) return res.text();
    let data = {};
    try { data = await res.json(); } catch (e) { /* not json */ }
    if (res.status === 401 && !['login', 'setup'].includes(path)) { showLogin(); throw new Error('Нужно войти'); }
    if (!res.ok) throw new Error(data.error || 'Ошибка ' + res.status);
    return data;
  }

  /* ================================================================ state */
  const S = { meta: null };
  const V = { tab: 'rows', oi: -1, shard: null, rows: [], a: '', s: '', c: '', q: '', st: 'all', sort: 'place', page: 0, per: 100, selected: new Set(), dirty: false };

  /* ================================================================ login / setup */
  async function start() {
    if (token) { try { await loadMeta(); renderShell(); return; } catch (e) { /* fallthrough */ } }
    showLogin();
  }
  async function showLogin() {
    let setup = false;
    try { setup = (await api('status')).setup; } catch (e) { /* ignore */ }
    const inp = h('input', { type: 'password', placeholder: setup ? 'Придумайте пароль (от 8 символов)' : 'Пароль', autocomplete: setup ? 'new-password' : 'current-password', required: true });
    const inp2 = setup ? h('input', { type: 'password', placeholder: 'Повторите пароль', autocomplete: 'new-password', required: true }) : null;
    const err = h('div', { class: 'err' });
    const btn = h('button', { class: 'btn primary', type: 'submit' }, setup ? 'Создать пароль и войти' : 'Войти');
    const form = h('form', { onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      if (setup && inp.value !== inp2.value) { err.textContent = 'Пароли не совпадают'; return; }
      btn.disabled = true;
      try { const d = await api(setup ? 'setup' : 'login', { method: 'POST', body: { password: inp.value } }); setToken(d.token); await loadMeta(); renderShell(); }
      catch (er) { err.textContent = er.message; inp.select(); }
      finally { btn.disabled = false; }
    } }, h('h1', null, 'Кабинет «Алтын сақа»'),
    setup ? h('p', null, 'Первый вход: придумайте пароль администратора. Запомните его — восстановить нельзя (можно только задать ADMIN_PASSWORD в настройках Netlify).') : h('p', null, 'Вход только для администратора'),
    inp, inp2, btn, err);
    app.replaceChildren(h('div', { class: 'login' }, form));
    inp.focus();
  }
  async function loadMeta() { S.meta = await api('meta'); }

  /* ================================================================ shell */
  const TABS = [['rows', 'Ученики'], ['import', 'Загрузка данных'], ['settings', 'Настройки сайта'], ['log', 'Журнал и пароль']];
  let body;
  function renderShell() {
    const m = S.meta;
    const pill = h('span', { class: 'pill ' + (m.open ? 'open' : 'closed') }, !m.dataId ? 'Нет данных' : m.open ? 'Сайт открыт' : 'Результаты скрыты');
    const bar = h('div', { class: 'bar' },
      h('div', { class: 'bar-in' },
        h('h1', null, 'Кабинет «Алтын сақа»', pill),
        h('a', { class: 'btn', href: '/', target: '_blank', rel: 'noopener' }, 'Открыть сайт'),
        h('button', { class: 'btn', onclick: () => { setToken(''); showLogin(); } }, 'Выйти')),
      h('div', { class: 'tabs', role: 'tablist' }, TABS.map(([k, l]) => h('button', { role: 'tab', 'aria-selected': String(V.tab === k), onclick: () => {
        if (V.dirty && !confirm('В настройках есть несохранённые изменения. Уйти без сохранения?')) return;
        V.dirty = false; V.tab = k; renderShell();
      } }, l))));
    body = h('div', { class: 'wrap' });
    app.replaceChildren(bar, body);
    ({ rows: renderRows, import: renderImport, settings: renderSettings, log: renderLog })[V.tab]();
  }

  /* ================================================================ rows */
  function decode(sh) {
    const d = sh.d || [];
    return (sh.r || []).map((x) => ({ a: d[x[0]], s: d[x[1]], c: d[x[2]], n: x[3], b1: x[4], b2: x[5], b3: x[6], t: x[7], place: x[8] || 0, st: x[9] || 0, absent: x[10] ? 1 : 0, teacher: x[11] >= 0 ? d[x[11]] : '', lang: x[12] >= 0 ? d[x[12]] : '', id: String(x[13]) }));
  }
  const total = (r) => (r.t !== null && r.t !== undefined ? r.t : [r.b1, r.b2, r.b3].some((x) => x !== null && x !== undefined) ? [r.b1, r.b2, r.b3].reduce((a, b) => a + (b || 0), 0) : null);
  async function loadOblys(i) {
    V.oi = i; V.shard = null; V.rows = []; V.selected.clear(); V.page = 0;
    if (i < 0) return;
    V.loading = true;
    try { const sh = await api('oblys?i=' + i); V.rows = decode(sh); }
    catch (e) { toast(e.message, true); }
    V.loading = false;
  }
  let tableHost, pagerHost, bulkHost, statsHost;
  function renderRows() {
    const m = S.meta;
    if (!m.dataId) {
      body.append(h('div', { class: 'card' }, h('h2', null, 'Данных пока нет'), h('p', { class: 'sub' }, 'Загрузите результаты во вкладке «Загрузка данных» — из Google Таблицы или из Excel-файла.'),
        h('button', { class: 'btn primary', onclick: () => { V.tab = 'import'; renderShell(); } }, 'Перейти к загрузке')));
      return;
    }
    const total = m.oblys.reduce((a, o) => a + o.n, 0);
    const oSel = h('select', { onchange: async (e) => { await loadOblys(Number(e.target.value)); V.a = V.s = V.c = ''; renderShell(); } },
      h('option', { value: -1 }, `— Выберите облыс (всего ${int(total)} учеников) —`),
      m.oblys.map((o, i) => h('option', { value: i, selected: i === V.oi }, `${o.o} — ${int(o.n)}`)));
    const searchAll = h('button', { class: 'btn', onclick: () => globalSearch() }, 'Поиск по всем облысам');
    body.append(h('div', { class: 'oblys-bar' }, oSel, searchAll,
      V.oi >= 0 ? h('button', { class: 'btn primary', onclick: () => studentModal(null) }, '+ Добавить ученика') : null,
      h('span', { class: 'spacer' }), h('button', { class: 'btn', onclick: exportExcel }, 'Скачать Excel (все данные)')));
    if (V.oi < 0) {
      body.append(h('div', { class: 'card' }, h('h2', null, 'Выберите облыс'), h('p', { class: 'sub' }, 'Изменения сохраняются сразу и появляются на сайте в течение ~20 секунд.')));
      body.append(overviewCard());
      return;
    }
    statsHost = h('div', { class: 'stats' });
    const rows = V.rows;
    const aSel = h('select', { onchange: (e) => { V.a = e.target.value; V.s = V.c = ''; V.page = 0; renderShell(); } }, h('option', { value: '' }, 'Все аудандары'), uniq(rows.map((r) => r.a)).map((v) => h('option', { value: v, selected: v === V.a }, v)));
    const sSel = h('select', { onchange: (e) => { V.s = e.target.value; V.page = 0; drawTable(); } }, h('option', { value: '' }, 'Все мектептер'), uniq(rows.filter((r) => !V.a || r.a === V.a).map((r) => r.s)).map((v) => h('option', { value: v, selected: v === V.s }, v.length > 60 ? v.slice(0, 60) + '…' : v)));
    const cSel = h('select', { onchange: (e) => { V.c = e.target.value; V.page = 0; drawTable(); } }, h('option', { value: '' }, 'Все сыныптар'), uniq(rows.map((r) => r.c)).map((v) => h('option', { value: v, selected: v === V.c }, v)));
    const stSel = h('select', { onchange: (e) => { V.st = e.target.value; V.page = 0; drawTable(); } }, [['all', 'Любой статус'], ['1', 'Өтті'], ['2', 'Өтпеді'], ['0', 'Статус пуст'], ['abs', 'Қатыспады']].map(([v, l]) => h('option', { value: v, selected: v === V.st }, l)));
    const q = h('input', { type: 'search', placeholder: 'Поиск: ФИО, школа…', value: V.q });
    let tmr = 0; q.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => { V.q = q.value; V.page = 0; drawTable(); }, 160); });
    const sortSel = h('select', { onchange: (e) => { V.sort = e.target.value; drawTable(); } }, [['place', 'По школе и баллу'], ['t', 'По баллу ↓'], ['n', 'По ФИО']].map(([v, l]) => h('option', { value: v, selected: v === V.sort }, l)));
    tableHost = h('div', { class: 'tbl-wrap' }); pagerHost = h('div', { class: 'pager' }); bulkHost = h('div', { class: 'bulkhost' });
    body.append(statsHost, h('div', { class: 'filters' }, q, aSel, sSel, cSel, stSel, sortSel), tableHost, pagerHost, bulkHost);
    drawTable();
  }
  function overviewCard() {
    const m = S.meta;
    return h('div', { class: 'card' }, h('h2', null, 'По облысам'),
      h('div', { class: 'tbl-wrap' }, h('table', { style: 'min-width:500px' },
        h('thead', null, h('tr', null, ['Облыс', 'Учеников', 'Классов', 'Школ'].map((x) => h('th', { class: 'nosort' }, x)))),
        h('tbody', null, m.oblys.map((o, i) => { const c = m.cls[i] || []; return h('tr', { style: 'cursor:pointer', onclick: async () => { await loadOblys(i); renderShell(); } }, h('td', null, h('b', null, o.o)), h('td', null, int(o.n)), h('td', null, int(c.length)), h('td', null, int(new Set(c.map((x) => x[0] + '|' + x[1])).size))); })))));
  }
  function filtered() {
    const words = norm(V.q).split(/\s+/).filter(Boolean);
    let list = V.rows.filter((r) => {
      if (V.a && r.a !== V.a) return false;
      if (V.s && r.s !== V.s) return false;
      if (V.c && r.c !== V.c) return false;
      if (V.st === 'abs' && !r.absent) return false;
      if (['0', '1', '2'].includes(V.st) && (r.absent || String(r.st) !== V.st)) return false;
      if (words.length) { const hay = r._h || (r._h = norm(`${r.n} ${r.s} ${r.a} ${r.c}`)); for (const w of words) if (!hay.includes(w)) return false; }
      return true;
    });
    if (V.sort === 't') list.sort((x, y) => (total(y) ?? -1) - (total(x) ?? -1));
    else if (V.sort === 'n') list.sort((x, y) => collator.compare(x.n, y.n));
    else list.sort((x, y) => collator.compare(x.a, y.a) || collator.compare(x.s, y.s) || collator.compare(x.c, y.c) || (x.absent - y.absent) || ((total(y) ?? -1) - (total(x) ?? -1)));
    return list;
  }
  function drawStats() {
    const rows = V.rows;
    const yes = rows.filter((r) => r.st === 1).length;
    const stat = (b, s) => h('div', { class: 'stat' }, h('b', null, b), h('span', null, s));
    statsHost.replaceChildren(stat(int(rows.length), 'учеников'), stat(int(new Set(rows.map((r) => r.a)).size), 'аудандар'), stat(int(new Set(rows.map((r) => r.a + '|' + r.s)).size), 'мектептер'),
      stat(int(yes), 'өтті'), stat(int(rows.filter((r) => r.absent).length), 'қатыспады'));
  }
  function drawTable() {
    drawStats();
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / V.per));
    if (V.page >= pages) V.page = pages - 1;
    const pageRows = list.slice(V.page * V.per, V.page * V.per + V.per);
    const allOn = pageRows.length > 0 && pageRows.every((r) => V.selected.has(r.id));
    const head = h('tr', null,
      h('th', { class: 'nosort' }, h('input', { type: 'checkbox', checked: allOn, onchange: (e) => { pageRows.forEach((r) => (e.target.checked ? V.selected.add(r.id) : V.selected.delete(r.id))); drawTable(); } })),
      ['Аудан', 'Мектеп', 'Сынып', 'Оқушы', 'Б1', 'Б2', 'Б3', 'Жалпы', 'Орын', 'Статус', 'Қатыспады', ''].map((x) => h('th', { class: 'nosort' }, x)));
    const tb = h('tbody');
    if (!pageRows.length) tb.append(h('tr', { class: 'empty-row' }, h('td', { colspan: 13 }, 'Ничего не найдено')));
    for (const r of pageRows) tb.append(rowEl(r));
    tableHost.replaceChildren(h('table', null, h('thead', null, head), tb));
    pagerHost.replaceChildren(
      h('span', null, list.length ? `${V.page * V.per + 1}–${V.page * V.per + pageRows.length} из ${int(list.length)}` : '0'),
      h('button', { class: 'btn sm', disabled: V.page === 0, onclick: () => { V.page--; drawTable(); } }, '‹ Назад'),
      h('button', { class: 'btn sm', disabled: V.page >= pages - 1, onclick: () => { V.page++; drawTable(); } }, 'Вперёд ›'));
    drawBulk(list);
  }
  function rowEl(r) {
    const tr = h('tr', { class: V.selected.has(r.id) ? 'sel' : '' });
    const cb = h('input', { type: 'checkbox', checked: V.selected.has(r.id), onchange: (e) => { e.target.checked ? V.selected.add(r.id) : V.selected.delete(r.id); tr.className = e.target.checked ? 'sel' : ''; drawBulk(); } });
    const field = (k, cls, w) => {
      const isNum = ['b1', 'b2', 'b3', 't'].includes(k);
      const inp = h('input', { class: cls, type: 'text', inputmode: isNum || k === 'place' ? 'decimal' : 'text', value: k === 'place' ? (r.place || '') : isNum ? fmt(r[k]) : r[k], style: w ? `width:${w}px` : undefined });
      if (k === 't' && (r.t === null || r.t === undefined)) { const a = total(r); inp.placeholder = a === null ? '' : fmt(a); inp.title = 'Пусто — сайт считает сумму баллов'; }
      const commit = async () => {
        let v = inp.value;
        if (isNum) { const n = num(v); if (Number.isNaN(n)) { inp.classList.add('flash-bad'); toast('Балл должен быть числом', true); return; } if (n === r[k]) return; v = n; }
        else if (k === 'place') { const n = parseInt(v, 10) || 0; if (n === (r.place || 0)) return; v = n; }
        else { v = clean(v, 200); if (!v || v === r[k]) { inp.value = r[k]; return; } }
        await save(r, { [k]: v }, inp);
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } else if (e.key === 'Escape') { inp.value = k === 'place' ? (r.place || '') : isNum ? fmt(r[k]) : r[k]; inp.blur(); } });
      inp.addEventListener('change', commit);
      return h('td', null, inp);
    };
    const st = h('select', { class: 'st ' + (r.st === 1 ? 'yes' : r.st === 2 ? 'no' : ''), onchange: async (e) => { await save(r, { st: Number(e.target.value) }, st); st.className = 'st ' + (r.st === 1 ? 'yes' : r.st === 2 ? 'no' : ''); } },
      [['0', '—'], ['1', 'Өтті'], ['2', 'Өтпеді']].map(([v, l]) => h('option', { value: v, selected: String(r.st) === v }, l)));
    const ab = h('input', { type: 'checkbox', checked: !!r.absent, title: 'Не участвовал', onchange: async (e) => { await save(r, { absent: e.target.checked ? 1 : 0 }, ab); } });
    tr.append(h('td', null, cb), h('td', { class: 'txt', title: r.a }, r.a), h('td', { class: 'txt', title: r.s }, r.s), h('td', null, r.c),
      field('n', 'nm'), field('b1', 'n'), field('b2', 'n'), field('b3', 'n'), field('t', 'n'), field('place', 'pl'), h('td', null, st), h('td', { class: 'chk-cell' }, ab),
      h('td', null, h('div', { class: 'row', style: 'flex-wrap:nowrap;gap:6px' },
        h('a', { class: 'btn sm', href: `/s/${V.oi}/${r.id}`, target: '_blank', rel: 'noopener', title: 'Страница ребёнка' }, '↗'),
        h('button', { class: 'btn sm', onclick: () => studentModal(r) }, 'Изменить'),
        h('button', { class: 'btn sm danger', onclick: async () => {
          if (!confirm(`Удалить ученика?\n${r.n} — ${r.s}, ${r.c}`)) return;
          try { await api('student', { method: 'DELETE', body: { i: V.oi, id: r.id } }); V.rows = V.rows.filter((x) => x !== r); V.selected.delete(r.id); bumpMeta(); drawTable(); toast('Удалено'); }
          catch (e) { toast(e.message, true); }
        } }, '✕'))));
    return tr;
  }
  function bumpMeta() { const o = S.meta.oblys[V.oi]; if (o) o.n = V.rows.length; }
  async function save(r, patch, elx) {
    elx.disabled = true;
    try {
      const d = await api('student', { method: 'POST', body: { i: V.oi, id: r.id, row: { ...rowPayload(r), ...patch } } });
      delete r._h; Object.assign(r, d.row);
      elx.classList.remove('flash-bad', 'flash-ok'); void elx.offsetWidth; elx.classList.add('flash-ok');
      if (elx.tagName === 'INPUT' && elx.type === 'text') { const k = Object.keys(patch)[0]; elx.value = k === 'place' ? (r.place || '') : ['b1', 'b2', 'b3', 't'].includes(k) ? fmt(r[k]) : r[k]; }
      const tIn = elx.closest('tr') && elx.closest('tr').querySelectorAll('input.n')[3];
      if (tIn && (r.t === null || r.t === undefined)) { const a = total(r); tIn.placeholder = a === null ? '' : fmt(a); }
      drawStats();
    } catch (e) {
      elx.classList.add('flash-bad'); toast(e.message, true);
      if (elx.tagName === 'SELECT') elx.value = String(r.st); else if (elx.type === 'checkbox') elx.checked = !!r.absent;
    } finally { elx.disabled = false; }
  }
  const rowPayload = (r) => ({ a: r.a, s: r.s, c: r.c, n: r.n, b1: r.b1, b2: r.b2, b3: r.b3, t: r.t, place: r.place, st: r.st, absent: r.absent, teacher: r.teacher, lang: r.lang });
  function drawBulk(list) {
    const n = V.selected.size;
    if (!n) { bulkHost.replaceChildren(); return; }
    const run = async (st, label) => {
      if (!confirm(`${label} для ${n} учеников?`)) return;
      try {
        await api('bulk', { method: 'POST', body: { i: V.oi, ids: [...V.selected], st } });
        for (const r of V.rows) if (V.selected.has(r.id)) r.st = st;
        V.selected.clear(); drawTable(); toast('Готово');
      } catch (e) { toast(e.message, true); }
    };
    const fl = list || filtered();
    bulkHost.replaceChildren(h('div', { class: 'bulk' }, h('b', null, `Выбрано: ${n}`),
      h('button', { class: 'btn sm', onclick: () => run(1, '«Өтті»') }, 'Өтті'),
      h('button', { class: 'btn sm', onclick: () => run(2, '«Өтпеді»') }, 'Өтпеді'),
      h('button', { class: 'btn sm', onclick: () => run(0, 'Очистить статус') }, 'Очистить статус'),
      fl.some((r) => !V.selected.has(r.id)) ? h('button', { class: 'btn sm', onclick: () => { fl.forEach((r) => V.selected.add(r.id)); drawTable(); } }, `Выбрать все по фильтру (${int(fl.length)})`) : null,
      h('span', { class: 'spacer' }), h('button', { class: 'btn sm', onclick: () => { V.selected.clear(); drawTable(); } }, 'Снять выбор')));
  }
  function studentModal(r) {
    const isNew = !r;
    const v = r || { a: V.a, s: V.s, c: V.c, n: '', b1: null, b2: null, b3: null, t: null, place: 0, st: 0, absent: 0, teacher: '', lang: '' };
    const dl = (id, vals) => h('datalist', { id }, vals.map((x) => h('option', { value: x })));
    const f = {};
    const field = (k, label, extra = {}) => { f[k] = h('input', { type: 'text', value: ['b1', 'b2', 'b3', 't'].includes(k) ? fmt(v[k]) : k === 'place' ? (v.place || '') : v[k], ...extra }); return h('div', { class: 'field' }, h('label', null, label), f[k]); };
    f.st = h('select', null, [['0', '—'], ['1', 'Өтті'], ['2', 'Өтпеді']].map(([x, l]) => h('option', { value: x, selected: String(v.st) === x }, l)));
    f.absent = h('input', { type: 'checkbox', checked: !!v.absent });
    const err = h('div', { class: 'err' });
    const close = () => m.remove();
    const m = h('div', { class: 'modal', onclick: (e) => { if (e.target === m) close(); } },
      h('form', { onsubmit: async (e) => {
        e.preventDefault(); err.textContent = '';
        const p = { a: f.a.value, s: f.s.value, c: f.c.value, n: f.n.value, teacher: f.teacher.value, place: parseInt(f.place.value, 10) || 0, st: Number(f.st.value), absent: f.absent.checked ? 1 : 0, lang: v.lang };
        for (const k of ['b1', 'b2', 'b3', 't']) { const n = num(f[k].value); if (Number.isNaN(n)) { err.textContent = 'Баллы должны быть числами'; return; } p[k] = n; }
        try {
          const d = await api('student', { method: 'POST', body: { i: V.oi, id: isNew ? undefined : r.id, row: p } });
          if (isNew) { V.rows.push(d.row); bumpMeta(); toast('Ученик добавлен'); } else { delete r._h; Object.assign(r, d.row); toast('Сохранено'); }
          close(); drawTable();
        } catch (er) { err.textContent = er.message; }
      } },
      h('h2', null, isNew ? `Новый ученик — ${S.meta.oblys[V.oi].o}` : 'Изменить ученика'),
      dl('dl-a', uniq(V.rows.map((x) => x.a))), dl('dl-s', uniq(V.rows.filter((x) => !f.a || x.a === (f.a.value || v.a)).map((x) => x.s))), dl('dl-c', uniq(V.rows.map((x) => x.c))),
      h('div', { class: 'grid2' },
        field('a', 'Аудан', { list: 'dl-a', required: true }), field('s', 'Мектеп', { list: 'dl-s', required: true }),
        field('c', 'Сынып и литер (например «3 А»)', { list: 'dl-c', required: true }), field('n', 'Оқушы аты-жөні', { required: true }),
        field('b1', 'Балл 1', { inputmode: 'decimal' }), field('b2', 'Балл 2', { inputmode: 'decimal' }),
        field('b3', 'Балл 3', { inputmode: 'decimal' }), field('t', 'Жалпы балл (пусто = сумма)', { inputmode: 'decimal' }),
        field('place', 'Орын (1, 2, 3 или пусто)', { inputmode: 'numeric' }), h('div', { class: 'field' }, h('label', null, 'Келесі кезеңге өтті'), f.st),
        field('teacher', 'Мұғалім'), h('div', { class: 'field' }, h('label', null, 'Участие'), h('label', { class: 'chk' }, f.absent, 'Қатыспады (не участвовал)'))),
      err,
      h('div', { class: 'row', style: 'justify-content:flex-end;margin-top:10px' }, h('button', { type: 'button', class: 'btn', onclick: close }, 'Отмена'), h('button', { type: 'submit', class: 'btn primary' }, isNew ? 'Добавить' : 'Сохранить'))));
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.body.append(m);
    (isNew ? (f.a.value ? (f.s.value ? f.n : f.s) : f.a) : f.n).focus();
  }

  /* ================================================================ все облысы: поиск и Excel */
  async function loadAllShards(onProgress) {
    const m = S.meta; const out = new Array(m.oblys.length); let done = 0;
    const queue = m.oblys.map((_, i) => i);
    const worker = async () => { while (queue.length) { const i = queue.shift(); out[i] = decode(await api('oblys?i=' + i)); done++; if (onProgress) onProgress(done / m.oblys.length); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
    return out;
  }
  async function globalSearch() {
    const prog = h('div', { class: 'progress' }, h('i'));
    const out = h('div');
    const input = h('input', { type: 'search', placeholder: 'ФИО ученика или школа', style: 'width:100%' });
    const close = () => m.remove();
    const m = h('div', { class: 'modal', onclick: (e) => { if (e.target === m) close(); } }, h('form', { style: 'width:min(1000px,100%)', onsubmit: (e) => e.preventDefault() },
      h('h2', null, 'Поиск по всем облысам'), prog, input, out, h('div', { class: 'row', style: 'justify-content:flex-end;margin-top:10px' }, h('button', { type: 'button', class: 'btn', onclick: close }, 'Закрыть'))));
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.body.append(m);
    let all;
    try { all = await loadAllShards((p) => { prog.firstChild.style.width = p * 100 + '%'; }); } catch (e) { out.replaceChildren(h('p', { class: 'err' }, e.message)); return; }
    prog.remove(); input.focus();
    const flat = []; all.forEach((rows, i) => rows.forEach((r) => flat.push([i, r])));
    let tmr = 0;
    input.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => {
      const words = norm(input.value).split(/\s+/).filter(Boolean);
      if (!words.length) { out.replaceChildren(); return; }
      const found = [];
      for (const [i, r] of flat) { const hay = r._h || (r._h = norm(`${r.n} ${r.s} ${r.a} ${r.c}`)); if (words.every((w) => hay.includes(w))) { found.push([i, r]); if (found.length >= 100) break; } }
      out.replaceChildren(h('p', { class: 'note' }, found.length >= 100 ? 'Первые 100 — уточните запрос' : `Найдено: ${found.length}`),
        h('div', { class: 'tbl-wrap' }, h('table', { style: 'min-width:800px' }, h('tbody', null, found.map(([i, r]) => h('tr', null,
          h('td', null, h('b', null, r.n)), h('td', { class: 'txt' }, r.s), h('td', null, r.c), h('td', { class: 'txt' }, r.a), h('td', { class: 'txt' }, S.meta.oblys[i].o), h('td', null, fmt(total(r))),
          h('td', null, h('div', { class: 'row', style: 'flex-wrap:nowrap;gap:6px' },
            h('a', { class: 'btn sm', href: `/s/${i}/${r.id}`, target: '_blank', rel: 'noopener' }, '↗'),
            h('button', { class: 'btn sm', type: 'button', onclick: async () => { close(); await loadOblys(i); V.q = r.n; V.a = V.s = V.c = ''; V.st = 'all'; renderShell(); } }, 'Открыть'))))))))); }, 150); });
  }
  async function exportExcel() {
    if (!S.meta.dataId) return toast('Нет данных', true);
    toast('Готовлю Excel… это займёт 10–20 секунд');
    try {
      const all = await loadAllShards();
      const head = ['Облыс', 'Аудан', 'Мектеп', 'Сынып', 'Литер', 'Оқушы аты-жөні', 'Оқу тілі', 'Мұғалім', 'Балл-1', 'Балл-2', 'Балл-3', 'Жалпы балл', 'Орын', 'Келесі кезеңге өтті', 'Қатысты', 'studentId'];
      const aoa = [head];
      all.forEach((rows, i) => rows.forEach((r) => {
        const m = /^(\d{1,2})(?:\s+(.+))?$/.exec(r.c || ''); const grade = m ? Number(m[1]) : r.c; const lit = m ? m[2] || '' : '';
        aoa.push([S.meta.oblys[i].o, r.a, r.s, grade, lit, r.n, r.lang, r.teacher, r.b1, r.b2, r.b3, total(r), r.place ? `${ROMAN[r.place] || r.place} орын` : '', r.st === 1 ? 'Иә' : r.st === 2 ? 'Жоқ' : '', r.absent ? 'Жоқ' : 'Иә', r.id]);
      }));
      await ensureXlsx();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [18, 22, 40, 7, 6, 28, 10, 26, 8, 8, 8, 11, 9, 18, 9, 38].map((w) => ({ wch: w }));
      ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: head.length - 1 } }) };
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Нәтижелер');
      XLSX.writeFile(wb, `Алтын сақа нәтижелер ${new Date().toISOString().slice(0, 10)}.xlsx`, { compression: true });
      toast('Excel скачан');
    } catch (e) { toast(e.message, true); }
  }
  let xlsxPromise = null;
  function ensureXlsx() {
    if (window.XLSX) return Promise.resolve();
    if (!xlsxPromise) xlsxPromise = new Promise((ok, fail) => { const s = document.createElement('script'); s.src = '/xlsx.full.min.js'; s.onload = ok; s.onerror = () => { xlsxPromise = null; fail(new Error('Не удалось загрузить модуль Excel')); }; document.head.append(s); });
    return xlsxPromise;
  }

  /* ================================================================ import */
  const HEADER_RULES = [
    ['st', /келесі|кезеңге|өтті|прош[её]л|следующ|статус|status|passed/],
    ['t', /жалпы|барлығы|итог|общ|сумма|total|всего/],
    ['b1', /(балл|ұпай|упай|score|тур|бал)\D*1|1\D*(балл|ұпай|тур)/],
    ['b2', /(балл|ұпай|упай|score|тур|бал)\D*2|2\D*(балл|ұпай|тур)/],
    ['b3', /(балл|ұпай|упай|score|тур|бал)\D*3|3\D*(балл|ұпай|тур)/],
    ['q', /^қатысты|^қатысу|^участвовал|^присутств|^attend/],
    ['p', /^орын$|^орны$|^место$|^place$|жүлделі орын/],
    ['l', /литер|литера|letter|параллел/],
    ['tch', /мұғалім|муғалім|учитель|педагог|teacher/],
    ['lang', /оқу тілі|тіл|язык обуч|language/],
    ['id', /studentid|student id|^id$/],
    ['n', /аты|жөн|фио|ф\.\s*и|оқушы|окушы|ученик|участник|қатысушы|name|тегі/],
    ['o', /облыс|област|oblys|region|өңір/],
    ['a', /аудан|район|audan|district/],
    ['s', /мектеп|школ|mektep|school|білім беру ұйым|организац/],
    ['c', /сынып|класс|synyp|class|grade/],
  ];
  function mapHeaders(header) {
    const map = {};
    header.forEach((hd, i) => { const n = clean(hd).toLowerCase(); if (!n) return; for (const [f, re] of HEADER_RULES) if (map[f] === undefined && re.test(n)) { map[f] = i; return; } });
    return map;
  }
  const parseStatus = (v) => { const s = clean(v).toLowerCase(); if (!s) return 0; if (/^(иә|ия|иа|да|yes|y|true|1|\+|✓|✔|өтті|отті|прош)/.test(s)) return 1; if (/^(жоқ|жок|нет|no|n|false|0|-|−|✗|өтпеді|не прош)/.test(s)) return 2; return 0; };
  const parsePlace = (v) => { const s = clean(v).toUpperCase().replace(/[^IVX0-9]/g, ' ').trim().split(' ')[0] || ''; const r = { I: 1, II: 2, III: 3, IV: 4, V: 5 }; if (r[s]) return r[s]; const n = parseInt(s, 10); return Number.isFinite(n) && n > 0 && n < 100 ? n : 0; };
  const absent = (v) => /^(жоқ|жок|нет|no|0|false|қатыспады|не участвовал)/i.test(clean(v));
  function classOf(grade, lit) { const g = clean(grade, 20).replace(/\s*(сынып|класс)\s*/i, '').replace(/\.0$/, '').trim(); const l = clean(lit, 10).replace(/[«»"']/g, '').toUpperCase(); return l ? `${g} ${l}` : g; }
  function hashId(str) { let h1 = 0x811c9dc5, h2 = 0x1234567; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 ^ c, 2246822519); } return 'h' + (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36); }
  // grid: массив строк (первая — заголовки) → объект импорта
  function buildImport(grids) {
    const result = new Map(); let skipped = 0; let total = 0; let header = null; let map = null; const warnings = [];
    for (const grid of grids) {
      if (!grid.length) continue;
      let hIdx = -1;
      for (let i = 0; i < Math.min(grid.length, 10); i++) { const mm = mapHeaders(grid[i]); if (mm.o !== undefined && mm.s !== undefined && mm.c !== undefined && mm.n !== undefined) { hIdx = i; map = mm; header = grid[i]; break; } }
      if (hIdx < 0) throw new Error('Не нашёл строку заголовков. Нужны колонки: Облыс, Аудан, Мектеп, Сынып, Оқушы аты-жөні.');
      const get = (row, f) => (map[f] === undefined ? '' : row[map[f]]);
      for (let i = hIdx + 1; i < grid.length; i++) {
        const row = grid[i];
        const o = clean(get(row, 'o'), 200), a = clean(get(row, 'a'), 200), s = clean(get(row, 's'), 300), c = classOf(get(row, 'c'), get(row, 'l')), n = clean(get(row, 'n'), 200);
        if (!o || !a || !s || !c || !n) { if (row.some((x) => clean(x))) skipped++; continue; }
        total++;
        if (!result.has(o)) result.set(o, []);
        const ab = map.q !== undefined && absent(get(row, 'q'));
        const sc = (f) => { const v = num(get(row, f)); return Number.isNaN(v) ? null : v; };
        result.get(o).push({ a, s, c, n, b1: sc('b1'), b2: sc('b2'), b3: sc('b3'), t: sc('t'), place: parsePlace(get(row, 'p')), st: parseStatus(get(row, 'st')), absent: ab ? 1 : 0, teacher: clean(get(row, 'tch'), 150), lang: clean(get(row, 'lang'), 30), id: clean(get(row, 'id'), 80).replace(/[^\w-]/g, '') });
      }
    }
    if (!total) throw new Error('В таблице нет строк с заполненными Облыс, Аудан, Мектеп, Сынып и ФИО');
    const names = [...result.keys()].sort(collator.compare);
    const oblys = []; const shards = []; const cls = {};
    let dupIds = 0;
    names.forEach((o, i) => {
      const rows = result.get(o); const seen = new Set();
      for (const r of rows) {
        let id = r.id || hashId(`${o}|${r.a}|${r.s}|${r.c}|${r.n}`);
        if (seen.has(id)) { dupIds++; let k = 2; while (seen.has(id + '-' + k)) k++; id = id + '-' + k; }
        seen.add(id); r.id = id;
      }
      shards.push(encodeShard(o, rows));
      const mm = new Map(); for (const r of rows) { const k = r.a + '\u0001' + r.s + '\u0001' + r.c; mm.set(k, (mm.get(k) || 0) + 1); }
      cls[i] = [...mm].map(([k, n]) => [...k.split('\u0001'), n]);
      oblys.push({ o, n: rows.length });
    });
    if (dupIds) warnings.push(`Повторяющихся studentId: ${dupIds} (сделаны уникальными)`);
    const colNames = { o: 'Облыс', a: 'Аудан', s: 'Мектеп', c: 'Сынып', l: 'Литер', n: 'Оқушы', b1: 'Балл 1', b2: 'Балл 2', b3: 'Балл 3', t: 'Жалпы балл', p: 'Орын', st: 'Келесі кезеңге өтті', q: 'Қатысты', tch: 'Мұғалім', id: 'studentId' };
    const found = Object.keys(colNames).map((k) => [colNames[k], map[k] !== undefined ? clean(header[map[k]]) : '']);
    let yes = 0, abs = 0, places = 0;
    for (const rows of result.values()) for (const r of rows) { if (r.st === 1) yes++; if (r.absent) abs++; if (r.place) places++; }
    return { oblys, shards, cls, total, skipped, found, warnings, yes, abs, places };
  }
  function encodeShard(o, rows) {
    const d = []; const di = new Map();
    const ix = (v) => { if (!v) return -1; if (!di.has(v)) { di.set(v, d.length); d.push(v); } return di.get(v); };
    return { o, d, r: rows.map((x) => [ix(x.a), ix(x.s), ix(x.c), x.n, x.b1, x.b2, x.b3, x.t, x.place || 0, x.st || 0, x.absent ? 1 : 0, ix(x.teacher), ix(x.lang), x.id]) };
  }
  function parseCsv(text) {
    text = String(text || '').replace(/^﻿/, '');
    const rows = []; let row = []; let cell = ''; let q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"' && cell === '') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  const colLetter = (i) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const quote = (v) => (!v.includes("'") ? `'${v}'` : !v.includes('"') ? `"${v}"` : null);

  function renderImport() {
    const m = S.meta;
    const out = h('div');
    const prog = h('div', { class: 'progress', hidden: true }, h('i'));
    const status = h('p', { class: 'note' });
    let prepared = null;
    const setProg = (p, text) => { prog.hidden = false; prog.firstChild.style.width = Math.round(p * 100) + '%'; if (text) status.textContent = text; };
    const show = (imp, source) => {
      prepared = imp;
      out.replaceChildren(h('div', { class: 'result-box' },
        h('b', null, `Прочитано из ${source}`),
        h('ul', null,
          h('li', null, `Учеников: ${int(imp.total)}, облысов: ${imp.oblys.length}` + (imp.skipped ? `, пропущено пустых строк: ${int(imp.skipped)}` : '')),
          h('li', null, `Өтті: ${int(imp.yes)}, қатыспады: ${int(imp.abs)}, с местом (орын): ${int(imp.places)}`),
          h('li', null, 'Колонки: ' + imp.found.map(([k, v]) => `${k}${v ? '' : ' — нет'}`).join(' · ')),
          imp.warnings.map((w) => h('li', null, w))),
        h('div', { class: 'row', style: 'margin-top:12px' },
          h('button', { class: 'btn primary', onclick: (e) => upload(e.target) }, m.dataId ? 'Заменить данные на сайте' : 'Загрузить на сайт'),
          h('span', { class: 'note' }, 'Настройки сайта и реакции сохранятся. Предыдущую версию можно будет вернуть.'))));
    };
    async function upload(btn) {
      if (!prepared) return;
      if (m.dataId && !confirm(`Заменить все данные на сайте (${int(m.oblys.reduce((a, o) => a + o.n, 0))} учеников) новыми (${int(prepared.total)})?`)) return;
      btn.disabled = true;
      try {
        const { dataId } = await api('import/begin', { method: 'POST', body: {} });
        let done = 0; const queue = prepared.shards.map((sh, i) => [sh, i]);
        const worker = async () => { while (queue.length) { const [sh, i] = queue.shift(); await api('import/shard', { method: 'POST', body: { dataId, i, shard: sh } }); done++; setProg(done / prepared.shards.length, `Загрузка: ${done} из ${prepared.shards.length} облысов…`); } };
        await Promise.all([worker(), worker(), worker()]);
        setProg(1, 'Сохраняю…');
        await api('import/commit', { method: 'POST', body: { dataId, oblys: prepared.oblys, cls: prepared.cls } });
        await loadMeta(); V.oi = -1; V.rows = []; V.tab = 'rows';
        toast('Данные загружены — сайт обновлён');
        status.textContent = '';
        renderShell();
      } catch (e) { toast(e.message, true); status.textContent = 'Ошибка: ' + e.message; btn.disabled = false; }
    }
    // Google Sheet
    const url = h('input', { type: 'url', value: DEFAULT_SHEET, style: 'flex:1 1 420px' });
    const sheet = h('input', { type: 'text', value: 'Нәтижелер', style: 'width:160px' });
    const gBtn = h('button', { class: 'btn primary', onclick: async () => {
      gBtn.disabled = true; out.replaceChildren(); prepared = null;
      try {
        setProg(0.02, 'Читаю заголовки…');
        const head = parseCsv(await api('gsheet', { method: 'POST', raw: true, body: { url: url.value, sheet: sheet.value, tq: 'select * limit 1' } }));
        const map = mapHeaders(head[0] || []);
        if (map.o === undefined) throw new Error('На листе нет колонки «Облыс». Проверьте название листа.');
        const O = colLetter(map.o);
        const list = parseCsv(await api('gsheet', { method: 'POST', raw: true, body: { url: url.value, sheet: sheet.value, tq: `select ${O}, count(${O}) where ${O} <> '' group by ${O}` } })).slice(1).map((r) => r[0]).filter(Boolean);
        if (!list.length) throw new Error('В таблице нет строк');
        const grids = []; let done = 0; const queue = list.slice();
        const worker = async () => {
          while (queue.length) {
            const o = queue.shift(); const q = quote(o);
            if (!q) throw new Error('Название облыса содержит кавычки: ' + o);
            const grid = parseCsv(await api('gsheet', { method: 'POST', raw: true, body: { url: url.value, sheet: sheet.value, tq: `select * where ${O} = ${q}` } }));
            grids.push(grid); done++; setProg(done / list.length, `Читаю облысы: ${done} из ${list.length}…`);
          }
        };
        await Promise.all([worker(), worker(), worker()]);
        status.textContent = '';
        show(buildImport(grids), 'Google Таблицы');
      } catch (e) { status.textContent = ''; out.replaceChildren(h('p', { class: 'err' }, e.message)); }
      finally { gBtn.disabled = false; prog.hidden = true; }
    } }, 'Прочитать таблицу');
    // Excel
    const file = h('input', { type: 'file', accept: '.xlsx,.xls,.csv', hidden: true });
    const drop = h('div', { class: 'drop', onclick: () => file.click() }, 'Перетащите сюда Excel-файл (.xlsx) или нажмите, чтобы выбрать');
    const readFile = async (fl) => {
      if (!fl) return;
      out.replaceChildren(); prepared = null; setProg(0.1, `Читаю ${fl.name}…`);
      try {
        await ensureXlsx();
        const buf = await fl.arrayBuffer();
        setProg(0.4, 'Разбираю таблицу…');
        await new Promise((r) => setTimeout(r, 30));
        const wb = XLSX.read(buf, { type: 'array', dense: true, cellDates: false });
        const name = wb.SheetNames.find((n) => /нәтиже|натиже|результ/i.test(n)) || wb.SheetNames[0];
        const grid = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '', blankrows: false });
        setProg(0.8, 'Проверяю…');
        show(buildImport([grid]), `файла «${fl.name}», лист «${name}»`);
        status.textContent = '';
      } catch (e) { status.textContent = ''; out.replaceChildren(h('p', { class: 'err' }, e.message)); }
      finally { prog.hidden = true; file.value = ''; }
    };
    file.addEventListener('change', () => readFile(file.files[0]));
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); readFile(e.dataTransfer.files[0]); });

    body.append(
      h('div', { class: 'card' }, h('h2', null, 'Сейчас на сайте'),
        h('p', { class: 'sub' }, m.dataId ? `${int(m.oblys.reduce((a, o) => a + o.n, 0))} учеников, ${m.oblys.length} облысов. Обновлено: ${fmtDate(m.updatedAt)}` : 'Данных пока нет.'),
        h('div', { class: 'row' },
          m.dataId ? h('button', { class: 'btn', onclick: exportExcel }, 'Скачать Excel') : null,
          m.canRollback ? h('button', { class: 'btn danger', onclick: async () => { if (!confirm('Вернуть данные, которые были до последней загрузки?')) return; try { await api('rollback', { method: 'POST', body: {} }); await loadMeta(); V.oi = -1; toast('Возвращена предыдущая версия'); renderShell(); } catch (e) { toast(e.message, true); } } }, 'Вернуть предыдущую загрузку') : null)),
      h('div', { class: 'card' }, h('h2', null, '1. Перенести из Google Таблицы (один раз)'),
        h('p', { class: 'sub' }, 'Сайт прочитает таблицу по облысам и сохранит у себя. После этого таблица больше не нужна — всё правится здесь. На время переноса доступ к таблице: «Все, у кого есть ссылка → Читатель».'),
        h('div', { class: 'row' }, url, sheet, gBtn)),
      h('div', { class: 'card' }, h('h2', null, '2. Или загрузить Excel'),
        h('p', { class: 'sub' }, 'Google Таблица → Файл → Скачать → Microsoft Excel (.xlsx). Колонки как в вашей таблице: Облыс, Аудан, Мектеп, Сынып, Литер, Оқушы аты-жөні, Мұғалім, Балл-1/2/3, Жалпы балл, Орын, Келесі кезеңге өтті, Қатысты, studentId.'),
        drop, file),
      h('div', { class: 'card' }, prog, status, out));
  }

  /* ================================================================ settings */
  function renderSettings() {
    const s = JSON.parse(JSON.stringify(S.meta.settings));
    const mark = () => { V.dirty = true; };
    const bi = (obj, key, label, opts = {}) => {
      const mk = (lng) => { const i = h(opts.area ? 'textarea' : 'input', { type: 'text', value: obj[key][lng] || '', class: opts.area ? 'textarea-ui' : undefined, style: opts.area ? `min-height:${opts.rows || 90}px` : 'width:100%' }); i.addEventListener('input', () => { obj[key][lng] = i.value; mark(); }); return i; };
      return h('div', { class: 'grid2', style: 'margin-bottom:10px' }, h('div', { class: 'field' }, h('label', null, label + ' — қазақша'), mk('kk')), h('div', { class: 'field' }, h('label', null, label + ' — по-русски'), mk('ru')));
    };
    const check = (obj, key, label) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: obj[key], onchange: (e) => { obj[key] = e.target.checked; mark(); } }), label);
    const maxIn = (key) => { const i = h('input', { type: 'text', inputmode: 'decimal', value: fmt(s.max[key]), placeholder: 'нет', style: 'width:90px' }); i.addEventListener('input', () => { s.max[key] = i.value.trim(); mark(); }); return h('span', { class: 'row' }, 'Максимум (для шкалы):', i); };
    const pad = (n) => String(n).padStart(2, '0');
    const toLocal = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
    const when = h('input', { type: 'datetime-local', value: toLocal(s.releaseAt) });
    when.addEventListener('input', () => { s.releaseAt = when.value ? new Date(when.value).toISOString() : ''; mark(); });
    const modeBox = h('div', { class: 'row' }, [['open', 'Результаты открыты'], ['closed', 'Скрыты (показывать «скоро»)'], ['scheduled', 'Открыть автоматически в:']].map(([v, l]) =>
      h('label', { class: 'chk' }, h('input', { type: 'radio', name: 'mode', value: v, checked: s.mode === v, onchange: () => { s.mode = v; when.disabled = v !== 'scheduled'; mark(); } }), l)), when);
    when.disabled = s.mode !== 'scheduled';
    const emptySel = h('select', { onchange: (e) => { s.emptyStatus = e.target.value; mark(); } }, h('option', { value: 'no', selected: s.emptyStatus === 'no' }, 'Пустой статус = «не прошёл»'), h('option', { value: 'pending', selected: s.emptyStatus === 'pending' }, 'Пустой статус = «результат позже»'));
    const onChild = h('select', { onchange: (e) => { s.promo.onChild = e.target.value; mark(); } }, [['passed', 'Только у прошедших'], ['all', 'У всех'], ['none', 'Не показывать']].map(([v, l]) => h('option', { value: v, selected: s.promo.onChild === v }, l)));
    const phone = h('input', { type: 'text', value: s.promo.phone, style: 'width:200px', inputmode: 'tel' }); phone.addEventListener('input', () => { s.promo.phone = phone.value; mark(); });
    const saveBtn = h('button', { class: 'btn primary', onclick: async () => {
      saveBtn.disabled = true;
      try {
        if (s.mode === 'scheduled' && !s.releaseAt) throw new Error('Укажите дату и время открытия');
        const d = await api('settings', { method: 'PUT', body: { settings: s } });
        S.meta.settings = d.settings; S.meta.open = d.open; V.dirty = false;
        toast('Сохранено — сайт обновится в течение ~20 секунд'); renderShell();
      } catch (e) { toast(e.message, true); } finally { saveBtn.disabled = false; }
    } }, 'Сохранить');
    const logoBox = (name, label, hint) => {
      const v = (S.meta.assets || {})[name];
      const img = h('img', { src: v ? `/api/asset/${name}?v=${v}` : '', style: `max-height:70px;max-width:220px;background:#140B33;border-radius:10px;padding:8px;${v ? '' : 'display:none'}` });
      const file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon', hidden: true });
      const status = h('span', { class: 'note' }, v ? '' : 'не загружен');
      file.addEventListener('change', () => {
        const f = file.files[0]; if (!f) return;
        if (f.size > 1500000) { toast('Картинка больше 1,5 МБ — уменьшите её', true); return; }
        const rd = new FileReader();
        rd.onload = async () => {
          try { const d = await api('asset', { method: 'POST', body: { name, dataUrl: rd.result } }); S.meta.assets = { ...(S.meta.assets || {}), [name]: d.v }; img.src = `/api/asset/${name}?v=${d.v}`; img.style.display = ''; status.textContent = 'загружен'; toast('Логотип загружен — появится на сайте через ~20 секунд'); }
          catch (e) { toast(e.message, true); }
        };
        rd.readAsDataURL(f); file.value = '';
      });
      return h('div', { class: 'colbox' }, h('h3', null, label), h('p', { class: 'note', style: 'margin:0 0 8px' }, hint),
        h('div', { class: 'row' }, img, h('button', { class: 'btn', type: 'button', onclick: () => file.click() }, v ? 'Заменить' : 'Загрузить'),
          v ? h('button', { class: 'btn danger', type: 'button', onclick: async () => { if (!confirm('Убрать логотип?')) return; try { await api('asset', { method: 'POST', body: { name, dataUrl: null } }); const a = { ...(S.meta.assets || {}) }; delete a[name]; S.meta.assets = a; renderShell(); } catch (e) { toast(e.message, true); } } }, 'Убрать') : null, status, file));
    };
    body.append(
      h('div', { class: 'card' }, h('h2', null, 'Логотипы'),
        h('p', { class: 'sub' }, 'Лучше PNG с прозрачным фоном или SVG, до 1,5 МБ. Сохраняются сразу, отдельная кнопка «Сохранить» не нужна.'),
        logoBox('altyn', 'Логотип «Алтын сақа»', 'В шапке сайта, на главной вместо эмблемы и на картинке результата. Светлый логотип — фон сайта тёмный.'),
        logoBox('app', 'Логотип Zerdeli App', 'Внизу сайта и на картинке результата.'),
        logoBox('favicon', 'Иконка вкладки (favicon)', 'Квадратная картинка, например значок Zerdeli App. Если не загружена — берётся логотип Zerdeli App.')),
      h('div', { class: 'card' }, h('h2', null, 'Публикация'), modeBox, h('div', { style: 'margin-top:12px' }, bi(s, 'closedText', 'Текст, пока результаты скрыты', { area: true, rows: 60 }))),
      h('div', { class: 'card' }, h('h2', null, 'Главная страница'),
        bi(s, 'title', 'Название'), bi(s, 'subtitle', 'Строка над названием'), bi(s, 'stage', 'Этап (плашка)'), bi(s, 'heroText', 'Текст под названием', { area: true, rows: 60 }),
        bi(s, 'announcement', 'Объявление вверху (пусто — нет)', { area: true, rows: 50 }), h('div', { class: 'row' }, check(s.show, 'stats', 'Показывать счётчики (участники, школы, регионы)'))),
      h('div', { class: 'card' }, h('h2', null, 'Реклама: подготовка к аудандық кезең'),
        h('div', { class: 'row', style: 'margin-bottom:10px' }, check(s.promo, 'show', 'Показывать блок'), check(s.promo, 'whatsapp', 'Кнопка WhatsApp'), h('span', null, 'Телефон:'), phone, h('span', null, 'На странице ребёнка:'), onChild),
        bi(s.promo, 'badge', 'Метка'), bi(s.promo, 'title', 'Заголовок'), bi(s.promo, 'text', 'Текст', { area: true, rows: 80 })),
      h('div', { class: 'card' }, h('h2', null, 'Письма на странице ребёнка'),
        h('p', { class: 'sub' }, '{name} подставит имя ребёнка. Пустая строка между абзацами — новый абзац.'),
        h('h3', null, 'Прошёл в следующий этап'), bi(s.letters.yes, 'title', 'Заголовок'), bi(s.letters.yes, 'body', 'Письмо', { area: true, rows: 200 }),
        h('h3', null, 'Не прошёл'), bi(s.letters.no, 'title', 'Заголовок'), bi(s.letters.no, 'body', 'Письмо', { area: true, rows: 200 }),
        h('h3', null, 'Статус пока не известен'), bi(s.letters.pending, 'title', 'Заголовок'), bi(s.letters.pending, 'body', 'Письмо', { area: true, rows: 80 }),
        h('h3', null, 'Сообщение для кнопки «Поделиться в WhatsApp»'),
        h('p', { class: 'note' }, '{name} — ФИО, {score} — жалпы балл, {school} — мектеп, {url} — ссылка на страницу ребёнка. Отправляется вместе с картинкой.'),
        bi(s.shareText, 'yes', 'Прошёл', { area: true, rows: 70 }), bi(s.shareText, 'no', 'Не прошёл', { area: true, rows: 70 }),
        h('div', { class: 'row' }, check(s, 'reactions', 'Реакции (🤲 👏 ❤️ 🔥 💪)'), check(s, 'confetti', 'Салют для прошедших'), check(s, 'download', 'Кнопка «Сохранить картинку»'))),
      h('div', { class: 'card' }, h('h2', null, 'Баллы и статус'),
        ...['b1', 'b2', 'b3'].map((k, i) => h('div', { class: 'colbox' }, h('h3', null, check(s.show, k, 'Показывать'), ` Балл ${i + 1}`), bi(s.labels, k, 'Название'), maxIn(k))),
        h('div', { class: 'colbox' }, h('h3', null, 'Жалпы балл'), bi(s.labels, 't', 'Название'), maxIn('t')),
        h('div', { class: 'colbox' }, h('h3', null, check(s.show, 'place', 'Показывать'), ' Орын'), bi(s.labels, 'place', 'Подпись места')),
        h('div', { class: 'colbox' }, h('h3', null, check(s.show, 'st', 'Показывать'), ' Келесі кезең'), h('div', { class: 'row', style: 'margin-bottom:10px' }, emptySel, check(s.show, 'teacher', 'Показывать мұғалімді')),
          bi(s.labels, 'st', 'Подпись'), bi(s.statusText, 'yes', 'Прошёл'), bi(s.statusText, 'no', 'Не прошёл'), bi(s.statusText, 'pending', 'Позже'))),
      h('div', { class: 'savebar' }, saveBtn, h('span', { class: 'note' }, 'Изменения появятся на сайте в течение ~20 секунд.')));
  }

  /* ================================================================ log */
  function renderLog() {
    const listHost = h('ul', { class: 'list' }, h('li', null, 'Загрузка…'));
    loadMeta().then(() => { listHost.replaceChildren(...((S.meta.log || []).length ? S.meta.log.map((l) => h('li', null, h('span', { class: 'when' }, fmtDate(l.at)), h('span', { class: 'what' }, l.text))) : [h('li', null, 'Пока пусто')])); }).catch((e) => toast(e.message, true));
    const pwCur = h('input', { type: 'password', placeholder: 'Текущий пароль', autocomplete: 'current-password' });
    const pwNew = h('input', { type: 'password', placeholder: 'Новый пароль (от 8 символов)', autocomplete: 'new-password' });
    body.append(
      h('div', { class: 'card' }, h('h2', null, 'Пароль администратора'), h('div', { class: 'row' }, pwCur, pwNew,
        h('button', { class: 'btn', onclick: async () => { try { const d = await api('password', { method: 'POST', body: { current: pwCur.value, next: pwNew.value } }); setToken(d.token); pwCur.value = pwNew.value = ''; toast('Пароль изменён, другие входы завершены'); } catch (e) { toast(e.message, true); } } }, 'Сменить'))),
      h('div', { class: 'card' }, h('h2', null, 'Журнал изменений'), listHost));
  }

  window.addEventListener('beforeunload', (e) => { if (V.dirty) { e.preventDefault(); e.returnValue = ''; } });
  start();
})();
