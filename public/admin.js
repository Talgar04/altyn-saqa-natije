(() => {
  'use strict';
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1AvwPYSYBbdhM-VupBbwFYxiRTwXozh_qskbabr3sJs4/edit';
  const app = document.getElementById('app');

  /* ------------------------------------------------------------ helpers */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
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
  const fmt = (n) => (n === null || n === undefined ? '—' : String(Math.round(n * 100) / 100));
  const int = (n) => Number(n).toLocaleString('ru-RU');
  const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[әа]/g, 'а').replace(/ғ/g, 'г').replace(/қ/g, 'к').replace(/ң/g, 'н').replace(/ө/g, 'о').replace(/[ұү]/g, 'у').replace(/һ/g, 'х').replace(/[іи]/g, 'и');
  const collator = new Intl.Collator(['kk', 'ru'], { numeric: true, sensitivity: 'base', ignorePunctuation: true });
  const ST = ['—', 'Өтті', 'Өтпеді'];
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
  const studentLink = (r) => '/#' + new URLSearchParams({ o: r.o, a: r.a, s: r.s, c: r.c, ...(r.n ? { n: r.n } : {}) }).toString();

  /* ------------------------------------------------------------ state */
  const S = { tree: null, rows: [], loadedAt: null, error: '' };
  let tab = 'overview';

  async function getJson(url) {
    const res = await fetch(url, { cache: 'no-store' });
    let data = {};
    try { data = await res.json(); } catch (e) { /* not json */ }
    if (!res.ok) throw new Error(data.error || 'Ошибка ' + res.status);
    return data;
  }
  async function loadAll() {
    S.error = ''; S.rows = []; S.tree = null;
    renderShell(true);
    try {
      const tree = await getJson('/api/tree?fresh=' + Date.now());
      S.tree = tree;
      const oblysList = [...new Set((tree.k || []).map((k) => tree.d[k[0]]))].sort(collator.compare);
      let done = 0;
      const bar = document.querySelector('.progress i');
      const rows = [];
      const queue = oblysList.slice();
      const worker = async () => {
        while (queue.length) {
          const o = queue.shift();
          const p = await getJson('/api/oblys?fresh=1&o=' + encodeURIComponent(o));
          for (const r of p.r) rows.push({ o, a: p.d[r[0]], s: p.d[r[1]], c: p.d[r[2]], n: r[3], b1: r[4], b2: r[5], b3: r[6], t: r[7], st: r[8], place: r[9] || 0, teacher: r[10] >= 0 ? p.d[r[10]] : '', absent: r[11] === 1 });
          done++;
          if (bar) bar.style.width = (done / oblysList.length) * 100 + '%';
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      S.rows = rows;
      S.loadedAt = new Date();
    } catch (e) { S.error = e.message; }
    renderShell(false);
  }
  const total = (r) => (r.t !== null ? r.t : [r.b1, r.b2, r.b3].some((x) => x !== null) ? [r.b1, r.b2, r.b3].reduce((a, b) => a + (b || 0), 0) : null);

  /* ------------------------------------------------------------ shell */
  const TABS = [['overview', 'Обзор'], ['check', 'Проверка таблицы'], ['search', 'Поиск ученика'], ['settings', 'Настройки сайта']];
  function renderShell(loading) {
    const open = S.tree ? S.tree.open : null;
    const pill = h('span', { class: 'pill ' + (open ? 'open' : 'closed') }, open === null ? '…' : open ? 'Сайт открыт' : 'Результаты скрыты');
    const bar = h('div', { class: 'bar' },
      h('div', { class: 'bar-in' },
        h('h1', null, 'Кабинет результатов', pill),
        h('a', { class: 'btn', href: SHEET_URL, target: '_blank', rel: 'noopener' }, 'Открыть таблицу'),
        h('a', { class: 'btn', href: '/', target: '_blank', rel: 'noopener' }, 'Открыть сайт'),
        h('button', { class: 'btn', onclick: loadAll, disabled: loading }, loading ? 'Загружаю…' : 'Обновить')),
      h('div', { class: 'tabs', role: 'tablist' }, TABS.map(([k, l]) => h('button', { role: 'tab', 'aria-selected': String(tab === k), onclick: () => { tab = k; renderShell(false); } }, l))));
    const body = h('div', { class: 'wrap' });
    app.replaceChildren(bar, body);
    if (loading) { body.append(h('div', { class: 'card' }, h('h2', null, 'Читаю Google Таблицу…'), h('div', { class: 'progress' }, h('i')), h('p', { class: 'note' }, 'Все облысы загружаются для проверки — обычно 5–15 секунд.'))); return; }
    if (S.error) {
      body.append(h('div', { class: 'card' }, h('h2', null, 'Не удалось прочитать таблицу'), h('p', { class: 'err' }, S.error),
        h('p', { class: 'note' }, 'Проверьте: лист называется «Нәтижелер», в первой строке заголовки (Облыс, Аудан, Мектеп, Сынып, Литер, Оқушы аты-жөні, Балл-1…), доступ «Все, у кого есть ссылка — Читатель».')));
      if (tab !== 'settings') return;
    }
    ({ overview: renderOverview, check: renderCheck, search: renderSearch, settings: renderSettings })[tab](body);
  }

  /* ------------------------------------------------------------ overview */
  function renderOverview(body) {
    const rows = S.rows; const tr = S.tree;
    const classes = new Set(rows.map((r) => `${r.o}|${r.a}|${r.s}|${r.c}`)).size;
    const schools = new Set(rows.map((r) => `${r.o}|${r.a}|${r.s}`)).size;
    const tots = rows.map(total).filter((x) => x !== null);
    const avg = tots.length ? Math.round(tots.reduce((a, b) => a + b, 0) / tots.length * 10) / 10 : '—';
    const yes = rows.filter((r) => r.st === 1).length, no = rows.filter((r) => r.st === 2).length;
    const stat = (b, s) => h('div', { class: 'stat' }, h('b', null, b), h('span', null, s));
    const colNames = { o: 'Облыс', a: 'Аудан', s: 'Мектеп', c: 'Сынып', l: 'Литер', n: 'Оқушы', tch: 'Мұғалім', b1: 'Балл 1', b2: 'Балл 2', b3: 'Балл 3', t: 'Жалпы балл', p: 'Орын', st: 'Келесі кезеңге өтті', q: 'Қатысты' };
    const absentN = rows.filter((r) => r.absent).length;
    const places = [1, 2, 3].map((k) => rows.filter((r) => r.place === k).length);
    const byO = new Map();
    for (const r of rows) {
      let x = byO.get(r.o); if (!x) { x = { n: 0, cls: new Set(), sch: new Set(), sum: 0, cnt: 0, yes: 0, empty: 0 }; byO.set(r.o, x); }
      x.n++; x.cls.add(`${r.a}|${r.s}|${r.c}`); x.sch.add(`${r.a}|${r.s}`); const t = total(r); if (t !== null) { x.sum += t; x.cnt++; } else x.empty++; if (r.st === 1) x.yes++;
    }
    body.append(
      h('div', { class: 'stats' }, stat(int(rows.length), 'учеников'), stat(int(classes), 'классов (сынып+литер)'), stat(int(schools), 'школ'), stat(byO.size, 'облысов'),
        stat(int(tots.length), 'с баллами'), stat(int(absentN), 'не участвовали'), stat(`${int(places[0])} / ${int(places[1])} / ${int(places[2])}`, 'I / II / III орын'), stat(avg, 'средний балл'), stat(int(yes), 'өтті'), stat(int(no), 'өтпеді'), stat(int(rows.length - yes - no), 'статус пуст')),
      h('div', { class: 'card' }, h('h2', null, 'Как сайт видит таблицу'),
        h('dl', { class: 'kv' },
          ...Object.keys(colNames).flatMap((k) => [h('dt', null, colNames[k]), h('dd', null, tr.cols[k] ? `колонка «${tr.cols[k]}»` : h('span', { class: 'tag bad' }, 'не найдена'))]),
          h('dt', null, 'Прочитано'), h('dd', null, S.loadedAt.toLocaleString('ru-RU'))),
        h('p', { class: 'note' }, 'Изменения в таблице появляются у учеников в течение ~1 минуты. Если колонка не найдена — переименуйте заголовок в таблице.')),
      h('div', { class: 'card' }, h('h2', null, 'По облысам'),
        h('div', { class: 'tbl-wrap' }, h('table', { style: 'min-width:700px' },
          h('thead', null, h('tr', null, ['Облыс', 'Учеников', 'Классов', 'Школ', 'Средний балл', 'Без баллов', 'Өтті'].map((x) => h('th', { class: 'nosort' }, x)))),
          h('tbody', null, [...byO].sort((a, b) => collator.compare(a[0], b[0])).map(([o, x]) => h('tr', null,
            h('td', null, o), h('td', null, int(x.n)), h('td', null, int(x.cls.size)), h('td', null, int(x.sch.size)),
            h('td', null, x.cnt ? fmt(x.sum / x.cnt) : '—'), h('td', null, x.empty ? h('span', { class: 'tag bad' }, int(x.empty)) : '0'), h('td', null, int(x.yes)))))))));
  }

  /* ------------------------------------------------------------ checks */
  function problems() {
    const out = { size: [], dup: [], noname: [], mismatch: [], empty: [] };
    const hasNames = !!S.tree.cols.n;
    const byClass = new Map();
    for (const r of S.rows) { const k = `${r.o}|${r.a}|${r.s}|${r.c}`; if (!byClass.has(k)) byClass.set(k, []); byClass.get(k).push(r); }
    for (const list of byClass.values()) {
      if (list.length > 10) out.size.push({ r: list[0], info: `${list.length} учеников` });
      if (hasNames) {
        const seen = new Map();
        for (const r of list) { const k = String(r.n || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim(); if (!k) continue; if (seen.has(k)) out.dup.push({ r, info: 'одинаковое ФИО в классе' }); seen.set(k, r); }
      }
    }
    for (const r of S.rows) {
      if (hasNames && !r.n) out.noname.push({ r, info: 'пустое ФИО' });
      if (r.t !== null && [r.b1, r.b2, r.b3].every((x) => x !== null)) {
        const sum = Math.round((r.b1 + r.b2 + r.b3) * 1000) / 1000;
        if (Math.abs(sum - r.t) > 0.001) out.mismatch.push({ r, info: `${fmt(r.b1)} + ${fmt(r.b2)} + ${fmt(r.b3)} = ${fmt(sum)}, а жалпы балл ${fmt(r.t)}` });
      }
      if (!r.absent && [r.b1, r.b2, r.b3, r.t].every((x) => x === null)) out.empty.push({ r, info: 'нет ни одного балла' });
    }
    return out;
  }
  function renderCheck(body) {
    const p = problems();
    const groups = [
      ['mismatch', 'Жалпы балл не равен сумме баллов', 'Проверьте формулу или ручной ввод в этих строках.'],
      ['dup', 'Одинаковые ФИО в одном классе', 'Ученики покажутся оба, но их легко перепутать — допишите инициал.'],
      ['size', 'В классе больше 10 учеников', 'Класс = Сынып + Литер. Проверьте литер у этих учеников.'],
      ['noname', 'Пустое ФИО', 'В списке класса такой ученик покажется как «—».'],
      ['empty', 'Нет баллов', 'Ученик увидит «результата пока нет».'],
    ];
    const totalIssues = groups.reduce((a, [k]) => a + p[k].length, 0);
    body.append(h('div', { class: 'card' }, h('h2', null, totalIssues ? `Найдено замечаний: ${int(totalIssues)}` : 'Таблица в порядке'),
      h('p', { class: 'sub' }, 'Сайт работает и с замечаниями — это подсказки, что стоит поправить в таблице.'),
      h('div', { class: 'row' }, groups.map(([k, l]) => h('span', { class: 'tag ' + (p[k].length ? 'bad' : 'ok') }, `${l}: ${int(p[k].length)}`)))));
    for (const [k, title, hint] of groups) {
      if (!p[k].length) continue;
      const list = p[k].slice(0, 300);
      body.append(h('div', { class: 'card' }, h('h2', null, `${title} — ${int(p[k].length)}`), h('p', { class: 'sub' }, hint + (p[k].length > 300 ? ' Показаны первые 300.' : '')),
        h('ul', { class: 'list problems' }, list.map(({ r, info }) => h('li', null,
          h('span', { class: 'what' }, h('b', null, r.n || r.s), ` — ${r.s}, ${r.c}, ${r.a}, ${r.o}. `, h('span', { class: 'note' }, info)),
          h('a', { class: 'btn sm', href: studentLink(r), target: '_blank', rel: 'noopener' }, 'На сайте'))))));
    }
  }

  /* ------------------------------------------------------------ search */
  function renderSearch(body) {
    const input = h('input', { type: 'search', placeholder: 'ФИО ученика или школа, например «Ахметов Айару» или «№15 мектеп»', style: 'width:100%' });
    const out = h('div');
    let timer = 0;
    const run = () => {
      const words = norm(input.value).split(/\s+/).filter(Boolean);
      if (!words.length) { out.replaceChildren(h('p', { class: 'note' }, 'Начните вводить — поиск по всем ученикам.')); return; }
      const found = [];
      for (const r of S.rows) {
        const hay = r._h || (r._h = norm(`${r.n} ${r.s} ${r.a} ${r.o} ${r.c}`));
        if (words.every((w) => hay.includes(w))) { found.push(r); if (found.length >= 200) break; }
      }
      out.replaceChildren(
        h('p', { class: 'note' }, found.length >= 200 ? 'Показаны первые 200 — уточните запрос.' : `Найдено: ${found.length}`),
        h('div', { class: 'tbl-wrap' }, h('table', null,
          h('thead', null, h('tr', null, ['Оқушы', 'Мектеп', 'Сынып', 'Аудан', 'Облыс', 'Б1', 'Б2', 'Б3', 'Жалпы', 'Орын', 'Статус', ''].map((x) => h('th', { class: 'nosort' }, x)))),
          h('tbody', null, found.map((r) => h('tr', null, h('td', null, r.n || '—'), h('td', { class: 'txt', title: r.s }, r.s), h('td', null, r.c), h('td', { class: 'txt' }, r.a), h('td', { class: 'txt' }, r.o),
            h('td', null, fmt(r.b1)), h('td', null, fmt(r.b2)), h('td', null, fmt(r.b3)), h('td', null, r.absent ? h('span', { class: 'tag' }, 'қатыспады') : h('b', null, fmt(total(r)))), h('td', null, r.place ? ROMAN[r.place] || r.place : ''), h('td', null, ST[r.st]),
            h('td', null, h('a', { class: 'btn sm', href: studentLink(r), target: '_blank', rel: 'noopener' }, 'Как видит ученик'))))))));
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 150); });
    body.append(h('div', { class: 'card' }, h('h2', null, 'Поиск ученика'), h('p', { class: 'sub' }, 'Чтобы исправить данные — правьте строку в Google Таблице, через минуту сайт обновится.'), input, out));
    run(); input.focus();
  }

  /* ------------------------------------------------------------ settings generator */
  function renderSettings(body) {
    const s = S.tree ? JSON.parse(JSON.stringify(S.tree.settings)) : null;
    if (!s) { body.append(h('div', { class: 'card' }, h('p', null, 'Сначала нужно прочитать таблицу.'))); return; }
    const rows = [];
    const out = h('div', { class: 'out' });
    const bi = (key, obj, label) => {
      const mk = (lng) => { const i = h('input', { type: 'text', value: obj[lng] || '', style: 'width:100%' }); i.addEventListener('input', () => { obj[lng] = i.value; gen(); }); return i; };
      rows.push(() => [key, obj.kk || '', obj.ru || '']);
      return h('div', { class: 'grid2', style: 'margin-bottom:10px' }, h('div', { class: 'field' }, h('label', null, label + ' — қазақша'), mk('kk')), h('div', { class: 'field' }, h('label', null, label + ' — по-русски'), mk('ru')));
    };
    const flag = (key, get, set, label) => {
      const c = h('input', { type: 'checkbox', checked: get() }); c.addEventListener('change', () => { set(c.checked); gen(); });
      rows.push(() => [key, get() ? 'иә' : 'жоқ', '']);
      return h('label', { class: 'chk' }, c, label);
    };
    const val = (key, get, set, label, attrs = {}) => {
      const i = h('input', { type: 'text', value: get() ?? '', style: 'width:110px', ...attrs }); i.addEventListener('input', () => { set(i.value); gen(); });
      rows.push(() => [key, get() ?? '', '']);
      return h('span', { class: 'row' }, label, i);
    };
    const pad = (n) => String(n).padStart(2, '0');
    const toLocal = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
    const tz = () => { const m = -new Date().getTimezoneOffset(); return (m >= 0 ? '+' : '-') + pad(Math.floor(Math.abs(m) / 60)) + ':' + pad(Math.abs(m) % 60); };
    const rel = h('input', { type: 'datetime-local', value: toLocal(s.releaseAt) });
    let relStr = s.releaseAt ? toLocal(s.releaseAt) + tz() : '';
    rel.addEventListener('input', () => { relStr = rel.value ? rel.value + tz() : ''; gen(); });
    const scope = h('select', null, h('option', { value: 'аудан', selected: s.rankScope === 'audan' }, 'среди команд аудана'), h('option', { value: 'облыс', selected: s.rankScope === 'oblys' }, 'среди команд облыса'));
    scope.addEventListener('change', gen);
    const copyBtn = h('button', { class: 'btn primary', onclick: async () => {
      const text = out.textContent;
      try { await navigator.clipboard.writeText(text); toast('Скопировано — вставьте в ячейку A1 листа «Баптаулар»'); }
      catch (e) { const r = document.createRange(); r.selectNodeContents(out); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('Выделено — нажмите Ctrl+C'); }
    } }, 'Скопировать таблицу настроек');

    const form = [
      h('div', { class: 'card' }, h('h2', null, 'Публикация'),
        h('div', { class: 'row' }, flag('closed', () => s.closed, (v) => { s.closed = v; }, 'Скрыть результаты (показывать «скоро»)')),
        h('div', { class: 'row', style: 'margin-top:10px' }, 'Открыть автоматически в:', rel, h('span', { class: 'note' }, 'пусто — сразу')),
        h('div', { style: 'margin-top:12px' }, bi('closed_text', s.closedText, 'Текст, пока скрыто'))),
      h('div', { class: 'card' }, h('h2', null, 'Шапка'), bi('title', s.title, 'Название'), bi('subtitle', s.subtitle, 'Строка над названием'), bi('stage', s.stage, 'Этап (плашка)'), bi('announcement', s.announcement, 'Объявление сверху (пусто — нет)')),
      h('div', { class: 'card' }, h('h2', null, 'Баллы'),
        ...['b1', 'b2', 'b3'].map((k, i) => h('div', { class: 'colbox' },
          h('h3', null, flag('show_' + k, () => s.show[k], (v) => { s.show[k] = v; }, 'Показывать'), `Балл ${i + 1}`),
          bi('label_' + k, s.labels[k], 'Название'), val('max_' + k, () => s.max[k], (v) => { s.max[k] = v; }, 'Максимум (для шкалы):'))),
        h('div', { class: 'colbox' }, h('h3', null, 'Жалпы балл'), bi('label_total', s.labels.t, 'Название'), val('max_total', () => s.max.t, (v) => { s.max.t = v; }, 'Максимум:'))),
      h('div', { class: 'card' }, h('h2', null, 'Команда и статус'),
        h('div', { class: 'row' }, flag('show_team', () => s.showTeam, (v) => { s.showTeam = v; }, 'Показывать общий балл класса'), flag('show_rank', () => s.showRank, (v) => { s.showRank = v; }, 'Показывать место команды'), scope),
        h('div', { style: 'margin-top:12px' }, bi('label_team', s.labels.team, 'Подпись балла команды')),
        h('div', { class: 'row', style: 'margin-bottom:10px' }, flag('show_status', () => s.show.st, (v) => { s.show.st = v; }, 'Показывать «Келесі кезеңге өтті»'), flag('show_teacher', () => s.showTeacher, (v) => { s.showTeacher = v; }, 'Показывать мұғалімді')),
        bi('label_place', s.labels.place, 'Подпись места (Орын)'),
        bi('label_status', s.labels.st, 'Подпись статуса'), bi('status_yes', s.statusText.yes, 'Прошли'), bi('status_no', s.statusText.no, 'Не прошли'), bi('status_pending', s.statusText.pending, 'Статус пуст')),
      h('div', { class: 'card' }, h('h2', null, 'Прочее'),
        h('div', { class: 'row', style: 'margin-bottom:10px' }, flag('confetti', () => s.confetti, (v) => { s.confetti = v; }, 'Салют, если прошёл'), flag('download', () => s.allowDownload, (v) => { s.allowDownload = v; }, 'Кнопка «Сохранить картинку»')),
        bi('not_found_text', s.notFoundText, 'Если у ученика нет баллов'), bi('contact_text', s.contact.text, 'Контакт внизу (текст)'),
        val('contact_url', () => s.contact.url, (v) => { s.contact.url = v; }, 'Ссылка контакта:', { style: 'width:340px', placeholder: 'https://wa.me/7707…' })),
    ];
    function gen() {
      const lines = [['Параметр', 'Қазақша', 'Орысша'], ...rows.map((f) => f()), ['release_at', relStr, ''], ['rank_scope', scope.value, '']];
      out.textContent = lines.map((l) => l.map((x) => String(x ?? '').replace(/[\t\n]/g, ' ')).join('\t')).join('\n');
    }
    body.append(
      h('div', { class: 'card' }, h('h2', null, 'Как менять настройки'),
        h('p', { class: 'sub' }, 'Настройки хранятся в той же Google Таблице, на листе «Баптаулар». Измените поля ниже, нажмите «Скопировать» и вставьте в ячейку A1 листа «Баптаулар» (создайте лист, если его нет). Через минуту сайт обновится.'),
        h('div', { class: 'row' }, copyBtn)),
      ...form,
      h('div', { class: 'card' }, h('h2', null, 'Что будет вставлено'), out, h('div', { class: 'row', style: 'margin-top:10px' }, copyBtn.cloneNode(true))));
    body.lastChild.querySelector('button').addEventListener('click', () => copyBtn.click());
    gen();
  }

  loadAll();
})();
