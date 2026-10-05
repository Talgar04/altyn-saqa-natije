(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ i18n */
  const T = {
    kk: {
      loading: 'Нәтижелер жүктелуде…', loadError: 'Нәтижелер жүктелмеді. Интернетті тексеріп, қайталап көріңіз.', retry: 'Қайталау',
      intro: 'Мектебің мен сыныбыңды таңда, содан кейін тізімнен өз атыңды тап.',
      oblys: 'Облыс', audan: 'Аудан', school: 'Мектеп', klass: 'Сынып',
      pickO: 'Облысты таңдаңыз', pickA: 'Ауданды таңдаңыз', pickS: 'Мектепті таңдаңыз', pickFirst: 'Алдымен мектепті таңдаңыз',
      search: 'Іздеу', nothing: 'Ештеңе табылмады', close: 'Жабу',
      save: 'Суретті сақтау', share: 'Бөлісу', copied: 'Сілтеме көшірілді', saved: 'Сурет сақталды', shareFail: 'Сілтемені көшіру мүмкін болмады',
      days: 'күн', hours: 'сағат', mins: 'минут', secs: 'секунд',
      classN: (c) => `${c}-сынып`, of: '/',
      rank: (r, n, scope) => `${scope === 'oblys' ? 'Облыс' : 'Аудан'} бойынша <b>${n}</b> команданың ішінде <b>${r}-орын</b>`,
      findYou: 'Өз атыңды таңда', members: (n) => `${n} оқушы`,
      classFull: (g, l) => (l ? `${g} «${l}» сынып` : `${g}-сынып`), classShort: (g, l) => (l ? `${g} «${l}»` : `${g}-сынып`),
      placeN: (r) => `${r} орын`, teacher: 'Мұғалімі', absent: 'Олимпиадаға қатыспады', absentShort: 'қатыспады',
      classErr: 'Сынып тізімі жүктелмеді. Қайталап көріңіз.',
    },
    ru: {
      loading: 'Загружаем результаты…', loadError: 'Не удалось загрузить результаты. Проверьте интернет и попробуйте ещё раз.', retry: 'Повторить',
      intro: 'Выберите школу и класс, затем найдите своё имя в списке.',
      oblys: 'Область', audan: 'Район', school: 'Школа', klass: 'Класс',
      pickO: 'Выберите область', pickA: 'Выберите район', pickS: 'Выберите школу', pickFirst: 'Сначала выберите школу',
      search: 'Поиск', nothing: 'Ничего не найдено', close: 'Закрыть',
      save: 'Сохранить картинку', share: 'Поделиться', copied: 'Ссылка скопирована', saved: 'Картинка сохранена', shareFail: 'Не удалось скопировать ссылку',
      days: 'дн', hours: 'ч', mins: 'мин', secs: 'сек',
      classN: (c) => `${c} класс`, of: '/',
      rank: (r, n, scope) => `<b>${r}-е место</b> из <b>${n}</b> команд в ${scope === 'oblys' ? 'области' : 'районе'}`,
      findYou: 'Найдите своё имя', members: (n) => `${n} учеников`,
      classFull: (g, l) => (l ? `${g} «${l}» класс` : `${g} класс`), classShort: (g, l) => (l ? `${g} «${l}»` : `${g} класс`),
      placeN: (r) => `${r} место`, teacher: 'Учитель', absent: 'Не участвовал(а) в олимпиаде', absentShort: 'не участв.',
      classErr: 'Не удалось загрузить список класса. Попробуйте ещё раз.',
    },
  };
  let lang = 'kk';
  try { const q = new URLSearchParams(location.search).get('lang'); lang = q === 'ru' || q === 'kk' ? q : (localStorage.getItem('zr_lang') || 'kk'); } catch (e) { /* storage blocked */ }
  if (lang !== 'ru') lang = 'kk';
  const t = (k) => T[lang][k];
  const pickL = (o) => (o && (o[lang] || o.kk || o.ru)) || '';

  /* ------------------------------------------------------------ state */
  let data = null;          // дерево: настройки + список классов (без имён и баллов)
  let tree = null;          // Map oblys -> Map audan -> Map school -> [class]
  const sel = { o: '', a: '', s: '', c: '', n: '' };
  let loadedVersion = 0;
  let cls = null;           // { key, team, students } загруженный класс
  let current = null;       // выбранный ученик (или команда в режиме без имён)

  const collator = (() => { try { return new Intl.Collator(['kk', 'ru'], { numeric: true, sensitivity: 'base', ignorePunctuation: true }); } catch (e) { return new Intl.Collator(undefined, { numeric: true }); } })();
  const sortStr = (a, b) => collator.compare(a, b);
  const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[әа]/g, 'а').replace(/ғ/g, 'г').replace(/қ/g, 'к').replace(/ң/g, 'н')
    .replace(/ө/g, 'о').replace(/[ұү]/g, 'у').replace(/һ/g, 'х').replace(/[іи]/g, 'и').replace(/[«»"'`.,№#()\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
  const splitClass = (c) => { const m = /^(\d{1,2})(?:\s+(.+))?$/.exec(c); return m ? [m[1], m[2] || ''] : null; };
  const classLabel = (c) => { const x = splitClass(c); return x ? t('classFull')(x[0], x[1]) : c; };
  const classChip = (c) => { const x = splitClass(c); return x ? t('classShort')(x[0], x[1]) : c; };
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const roman = (n) => ROMAN[n] || String(n);
  const fmt = (n) => (n === null || n === undefined ? '—' : (Math.round(n * 100) / 100).toLocaleString(lang === 'ru' ? 'ru-RU' : 'kk-KZ'));
  const isTeamMode = () => cls && cls.students.length === 1 && !cls.students[0].n;
  const heading = () => (current && current.n) || sel.s;
  const placeLine = () => (current && current.n ? `${sel.s}, ${classLabel(sel.c)}, ${sel.a}, ${sel.o}` : `${classLabel(sel.c)}, ${sel.a}, ${sel.o}`);
  const selKey = () => [sel.o, sel.a, sel.s, sel.c].join('\u0001');

  /* ------------------------------------------------------------ data */
  function buildTree(p) {
    const tr = new Map(); const d = p.d || [];
    for (const k of p.k || []) {
      const o = d[k[0]], a = d[k[1]], s = d[k[2]], c = d[k[3]];
      if (!tr.has(o)) tr.set(o, new Map());
      const ao = tr.get(o);
      if (!ao.has(a)) ao.set(a, new Map());
      const so = ao.get(a);
      if (!so.has(s)) so.set(s, []);
      so.get(s).push(c);
    }
    for (const so of tr.values()) for (const ss of so.values()) for (const list of ss.values()) list.sort(sortStr);
    return tr;
  }
  async function load(first) {
    try {
      const res = await fetch('/api/tree', first ? {} : { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const p = await res.json();
      if (!first && p.v === loadedVersion && p.open === (data && data.open)) return;
      const changed = !first && p.v !== loadedVersion;
      data = p; loadedVersion = p.v;
      tree = p.open ? buildTree(p) : null;
      if (changed) shards.clear();
      $('error').hidden = true;
      render(true);
    } catch (e) {
      if (first || !data) { $('loading').hidden = true; $('error').hidden = false; }
    }
  }
  $('retry').addEventListener('click', () => { $('error').hidden = true; $('loading').hidden = false; load(true); });
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (Date.now() - hiddenAt > 45000) load(false);
  });

  // данные облыса загружаются один раз и дальше выбор работает без запросов
  const shards = new Map();
  function buildShard(p) {
    const s = data.settings; const d = p.d || [];
    const groups = new Map();
    for (const r of p.r || []) {
      const key = [d[r[0]], d[r[1]], d[r[2]]].join('\u0001');
      let g = groups.get(key);
      if (!g) { g = { a: d[r[0]], c: d[r[2]], students: [] }; groups.set(key, g); }
      const b1 = r[4], b2 = r[5], b3 = r[6];
      let tot = r[7];
      if (tot === null) { const parts = [b1, b2, b3].filter((x) => x !== null); tot = parts.length ? Math.round(parts.reduce((x, y) => x + y, 0) * 1000) / 1000 : null; }
      g.students.push({ n: r[3], b1, b2, b3, t: tot, st: s.show.st ? r[8] : 0, place: r[9] || 0, teacher: r[10] >= 0 ? d[r[10]] : '', absent: r[11] === 1 });
    }
    const scopes = new Map();
    for (const [key, g] of groups) {
      // список класса — как таблица результатов: по баллу, не участвовавшие в конце
      g.students.sort((x, y) => (x.absent - y.absent) || ((y.t ?? -1) - (x.t ?? -1)) || sortStr(x.n, y.n));
      const present = g.students.filter((x) => !x.absent);
      const vals = present.map((x) => x.t).filter((x) => x !== null);
      g.team = { t: vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) * 1000) / 1000 : null, rank: 0, n: 0, size: g.students.length };
      const sk = (s.rankScope === 'oblys' ? '' : g.a) + '\u0001' + g.c;
      if (!scopes.has(sk)) scopes.set(sk, []);
      scopes.get(sk).push(g);
    }
    for (const list of scopes.values()) {
      const ranked = list.filter((g) => g.team.t !== null).sort((x, y) => y.team.t - x.team.t);
      let rank = 0;
      ranked.forEach((g, i) => { if (i === 0 || g.team.t !== ranked[i - 1].team.t) rank = i + 1; g.team.rank = rank; g.team.n = ranked.length; });
    }
    return groups;
  }
  function loadShard(o) {
    if (!shards.has(o)) {
      const p = (async () => {
        const res = await fetch('/api/oblys?o=' + encodeURIComponent(o));
        if (res.status === 403) { load(false); throw new Error('closed'); }
        if (!res.ok) throw new Error(res.status);
        return buildShard(await res.json());
      })();
      shards.set(o, p);
      p.catch(() => { if (shards.get(o) === p) shards.delete(o); });
    }
    return shards.get(o);
  }
  let classReq = 0;
  async function fetchClass(animate) {
    const key = selKey();
    const req = ++classReq;
    cls = null; current = null;
    let groups = null;
    const pending = loadShard(sel.o);
    const slow = setTimeout(() => { if (req === classReq) showClassLoading(); }, 120);
    try { groups = await pending; }
    catch (e) { clearTimeout(slow); if (req === classReq) showClassError(t('classErr')); return; }
    clearTimeout(slow);
    if (req !== classReq) return;
    const g = groups.get([sel.a, sel.s, sel.c].join('\u0001'));
    if (!g) { showClassError(t('classErr')); return; }
    cls = { key, team: g.team, students: g.students };
    afterClass(animate);
  }
  /* ------------------------------------------------------------ selection persistence */
  function readHash() {
    try {
      const h = new URLSearchParams(location.hash.slice(1));
      if (h.get('o')) return { o: h.get('o') || '', a: h.get('a') || '', s: h.get('s') || '', c: h.get('c') || '', n: h.get('n') || '' };
      const saved = JSON.parse(localStorage.getItem('zr_sel') || 'null');
      if (saved && saved.o) return { n: '', ...saved };
    } catch (e) { /* ignore */ }
    return null;
  }
  function writeHash() {
    const p = new URLSearchParams();
    for (const k of ['o', 'a', 's', 'c', 'n']) if (sel[k]) p.set(k, sel[k]);
    const h = p.toString();
    try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) { /* ignore */ }
    // имя ученика не храним на устройстве: школьный компьютер общий
    try { localStorage.setItem('zr_sel', JSON.stringify({ ...sel, n: '' })); } catch (e) { /* ignore */ }
  }
  function validateSel() {
    if (!tree) return;
    if (sel.o && !tree.has(sel.o)) { sel.o = sel.a = sel.s = sel.c = sel.n = ''; }
    const A = sel.o ? tree.get(sel.o) : null;
    if (sel.a && (!A || !A.has(sel.a))) { sel.a = sel.s = sel.c = sel.n = ''; }
    const S = sel.a ? A.get(sel.a) : null;
    if (sel.s && (!S || !S.has(sel.s))) { sel.s = sel.c = sel.n = ''; }
    const C = sel.s ? S.get(sel.s) : null;
    if (sel.c && (!C || !C.includes(sel.c))) { sel.c = sel.n = ''; }
    if (!sel.o && tree.size === 1) sel.o = [...tree.keys()][0];
    if (sel.o && !sel.a && tree.get(sel.o).size === 1) sel.a = [...tree.get(sel.o).keys()][0];
    if (sel.s && !sel.c) { const list = tree.get(sel.o).get(sel.a).get(sel.s); if (list.length === 1) sel.c = list[0]; }
  }

  /* ------------------------------------------------------------ render */
  function applyStatic() {
    document.documentElement.lang = lang === 'ru' ? 'ru' : 'kk';
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll('[data-t-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.tAria)));
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('sheetSearch').placeholder = t('search');
    $('year').textContent = new Date().getFullYear();
  }
  function renderHeader() {
    if (!data) return;
    const s = data.settings;
    $('title').textContent = pickL(s.title);
    $('subtitle').textContent = pickL(s.subtitle);
    $('stage').textContent = pickL(s.stage);
    document.title = [pickL(s.title), pickL(s.stage)].filter(Boolean).join(' — ');
    const ann = pickL(s.announcement);
    $('announce').hidden = !ann; $('announce').textContent = ann;
    const ct = pickL(s.contact && s.contact.text);
    const c = $('contact');
    if (ct && s.contact.url) { c.hidden = false; c.textContent = ct; c.href = s.contact.url; }
    else if (ct) { c.hidden = false; c.textContent = ct; c.removeAttribute('href'); }
    else c.hidden = true;
  }
  let countdownTimer = 0;
  function renderClosed() {
    const s = data.settings;
    $('closedText').textContent = pickL(s.closedText);
    clearInterval(countdownTimer);
    const cd = $('countdown');
    const target = s.releaseAt ? Date.parse(s.releaseAt) : 0;
    if (!target || target <= Date.now()) { cd.hidden = true; return; }
    cd.hidden = false;
    const tick = () => {
      let ms = target - Date.now();
      if (ms <= 0) { clearInterval(countdownTimer); setTimeout(() => load(false), 1500); ms = 0; }
      const parts = [[Math.floor(ms / 864e5), 'days'], [Math.floor(ms / 36e5) % 24, 'hours'], [Math.floor(ms / 6e4) % 60, 'mins'], [Math.floor(ms / 1e3) % 60, 'secs']];
      cd.replaceChildren(...parts.map(([v, k]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = String(v).padStart(2, '0'); const sp = document.createElement('span'); sp.textContent = t(k); d.append(b, sp); return d; }));
    };
    tick(); countdownTimer = setInterval(tick, 1000);
  }
  function setPick(field, value, placeholder, disabled) {
    const v = $('val-' + field);
    v.textContent = value || placeholder;
    v.classList.toggle('ph', !value);
    v.parentElement.disabled = !!disabled;
  }
  function renderSteps() {
    const A = sel.o ? tree.get(sel.o) : null;
    const S = sel.a && A ? A.get(sel.a) : null;
    setPick('o', sel.o, t('pickO'), false);
    setPick('a', sel.a, t('pickA'), !sel.o);
    setPick('s', sel.s, t('pickS'), !sel.a);
    const chips = $('chips');
    chips.replaceChildren();
    if (!sel.s) {
      const h = document.createElement('span'); h.className = 'hint'; h.textContent = t('pickFirst'); chips.append(h);
    } else {
      const list = S.get(sel.s);
      for (const c of list) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(c === sel.c));
        b.tabIndex = c === sel.c || (!sel.c && c === list[0]) ? 0 : -1;
        b.textContent = classChip(c);
        b.setAttribute('aria-label', classLabel(c));
        b.addEventListener('click', () => choose('c', c));
        chips.append(b);
      }
    }
    const order = ['o', 'a', 's', 'c'];
    const firstEmpty = order.find((k) => !sel[k]);
    document.querySelectorAll('.step').forEach((li) => {
      const k = li.dataset.step;
      li.classList.toggle('done', !!sel[k]);
      li.classList.toggle('active', k === firstEmpty);
    });
  }
  function hideClassArea() { $('classView').hidden = true; $('result').hidden = true; $('empty').hidden = true; }
  function showClassLoading() {
    $('result').hidden = true; $('empty').hidden = true;
    const cv = $('classView'); cv.hidden = false;
    $('team').hidden = true; $('tRank').hidden = true; $('clsMsg').hidden = true;
    $('clsTitle').textContent = classLabel(sel.c);
    const r = $('roster'); r.replaceChildren();
    for (let i = 0; i < 4; i++) { const li = document.createElement('li'); li.className = 'skel'; r.append(li); }
  }
  function showClassError(msg) {
    $('result').hidden = true;
    $('classView').hidden = false; $('team').hidden = true; $('tRank').hidden = true;
    $('roster').replaceChildren(); $('clsTitle').textContent = '';
    $('clsMsg').hidden = false; $('clsMsgText').textContent = msg;
  }
  $('clsRetry').addEventListener('click', () => fetchClass(true));

  function setRank(el, rank, n, scope) {
    if (data.settings.showRank && rank && n > 1) {
      el.hidden = false;
      el.innerHTML = '<span>' + t('rank')(rank, n, scope) + '</span>';
      el.className = el.className.replace(/\s*\b(medal|m[123])\b/g, '') + (rank <= 3 ? ' medal m' + rank : '');
      el.dataset.place = rank;
    } else el.hidden = true;
  }
  function afterClass(animate) {
    // режим без имён: одна строка на класс — показываем результат команды сразу
    if (isTeamMode()) {
      $('classView').hidden = true;
      current = cls.students[0];
      sel.n = '';
      renderResult(animate);
      writeHash();
      return;
    }
    const want = sel.n;
    renderClass();
    if (want) {
      const stu = cls.students.find((x) => x.n === want);
      if (stu) { openStudent(stu, animate, true); return; }
      sel.n = '';
    }
    $('result').hidden = true;
    writeHash();
  }
  function renderClass() {
    const s = data.settings;
    const cv = $('classView'); cv.hidden = false;
    $('clsMsg').hidden = true; $('empty').hidden = true;
    const team = cls.team || {};
    const showTeam = s.showTeam && team.t !== null && team.t !== undefined;
    $('team').hidden = !showTeam;
    if (showTeam) {
      $('tLabel').textContent = pickL(s.labels.team);
      $('tSub').textContent = `${sel.s}, ${classLabel(sel.c)} · ${t('members')(team.size || cls.students.length)}`;
      $('tTotal').textContent = fmt(team.t);
    }
    setRank($('tRank'), team.rank, team.n, s.rankScope);
    $('clsTitle').textContent = t('findYou');
    const frag = document.createDocumentFragment();
    cls.students.forEach((stu, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-current', String(current === stu));
      const ix = document.createElement('span'); ix.className = 'ix'; ix.textContent = i + 1;
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = stu.n || '—';
      const sc = document.createElement('span'); sc.className = 'sc';
      if (stu.absent) {
        const v = document.createElement('span'); v.className = 'abs'; v.textContent = t('absentShort'); sc.append(v);
        b.classList.add('absent');
      } else {
        if (stu.place >= 1 && stu.place <= 3) { const pb = document.createElement('span'); pb.className = 'pb m' + stu.place; pb.textContent = roman(stu.place); pb.title = t('placeN')(roman(stu.place)); sc.append(pb); }
        const v = document.createElement('span'); v.textContent = fmt(stu.t); sc.append(v);
        if (s.show.st) { const d = document.createElement('i'); d.className = 'dot ' + (stu.st === 1 ? 'yes' : stu.st === 2 ? 'no' : ''); sc.append(d); }
      }
      b.append(ix, nm, sc);
      b.addEventListener('click', () => openStudent(stu, true));
      li.append(b); frag.append(li);
    });
    $('roster').replaceChildren(frag);
  }
  function openStudent(stu, animate, silentScroll) {
    current = stu; sel.n = stu.n;
    $('roster').querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', String(cls.students[i] === stu)));
    renderResult(animate);
    writeHash();
    if (!silentScroll || animate) {
      const r = $('result').getBoundingClientRect();
      if (r.top > window.innerHeight * 0.4 || r.top < 0) $('result').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  let animToken = 0;
  function renderResult(animate) {
    const res = $('result'); const empty = $('empty');
    const item = current;
    const s = data.settings;
    const hasAny = item && [item.b1, item.b2, item.b3, item.t].some((x) => x !== null && x !== undefined);
    if (!item || item.absent || !hasAny) {
      res.hidden = true; empty.hidden = false;
      $('emptyText').textContent = item && item.absent ? `${heading()} — ${t('absent')}` : pickL(s.notFoundText);
      return;
    }
    empty.hidden = true; res.hidden = false;
    $('rSchool').textContent = heading();
    $('rPlace').textContent = placeLine();
    const tch = $('rTeacher');
    if (s.showTeacher && item.teacher) { tch.hidden = false; tch.textContent = `${t('teacher')}: ${item.teacher}`; } else tch.hidden = true;
    $('rTotalLabel').textContent = pickL(s.labels.t);
    $('rTotalMax').textContent = s.max.t ? `${t('of')} ${fmt(s.max.t)}` : '';
    const parts = $('rParts'); parts.replaceChildren();
    const bars = [];
    for (const k of ['b1', 'b2', 'b3']) {
      if (!s.show[k]) continue;
      const li = document.createElement('li');
      const l = document.createElement('span'); l.className = 'pl'; l.textContent = pickL(s.labels[k]);
      const v = document.createElement('span'); v.className = 'pv'; v.textContent = fmt(item[k]);
      if (s.max[k]) { const sm = document.createElement('small'); sm.textContent = `${t('of')} ${fmt(s.max[k])}`; v.append(sm); }
      li.append(l, v);
      if (s.max[k] && item[k] !== null) {
        const bar = document.createElement('div'); bar.className = 'bar'; const i = document.createElement('i'); bar.append(i); li.append(bar);
        bars.push([i, Math.max(0, Math.min(1, item[k] / s.max[k]))]);
      }
      parts.append(li);
    }
    parts.hidden = !parts.children.length;
    // место команды показываем на плашке только в режиме без имён
    const rk = $('rRank');
    if (item.place) {
      rk.hidden = false;
      rk.className = 'rank' + (item.place <= 3 ? ' medal m' + item.place : '');
      rk.dataset.place = roman(item.place);
      rk.innerHTML = '';
      const sp = document.createElement('span');
      sp.append(pickL(s.labels.place) + ': ');
      const b = document.createElement('b'); b.textContent = t('placeN')(roman(item.place)); sp.append(b);
      rk.append(sp);
    } else if (isTeamMode() && cls.team) setRank(rk, cls.team.rank, cls.team.n, s.rankScope);
    else rk.hidden = true;
    const stBox = $('rStatus');
    if (s.show.st) {
      const kind = item.st === 1 ? 'yes' : item.st === 2 ? 'no' : 'pending';
      stBox.hidden = false; stBox.className = 'status ' + kind;
      $('rStatusLabel').textContent = pickL(s.labels.st);
      $('rStatusText').textContent = pickL(s.statusText[kind]);
    } else stBox.hidden = true;
    $('btnSave').hidden = !s.allowDownload;

    const total = item.t;
    const frac = s.max.t && total !== null ? Math.max(0, Math.min(1, total / s.max.t)) : (total !== null ? 1 : 0);
    const ring = $('ringFg'); const C = 553;
    const tn = $('rTotal');
    const token = ++animToken;
    if (!animate || reduceMotion) {
      ring.style.transition = 'none'; ring.style.strokeDashoffset = String(C * (1 - frac));
      tn.textContent = fmt(total);
      bars.forEach(([i, f]) => { i.style.transition = 'none'; i.style.width = f * 100 + '%'; });
      return;
    }
    res.classList.remove('reveal'); void res.offsetWidth; res.classList.add('reveal');
    ring.style.transition = 'none'; ring.style.strokeDashoffset = String(C);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (token !== animToken) return;
      ring.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)';
      ring.style.strokeDashoffset = String(C * (1 - frac));
      bars.forEach(([i, f]) => { i.style.transition = ''; i.style.width = f * 100 + '%'; });
    }));
    if (total === null) { tn.textContent = '—'; return; }
    const start = performance.now(); const dur = 1300;
    const isInt = Number.isInteger(total);
    const step = (now) => {
      if (token !== animToken) return;
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      tn.textContent = p < 1 ? fmt(isInt ? Math.round(total * e) : Math.round(total * e * 10) / 10) : fmt(total);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    if (item.st === 1 && s.show.st && s.confetti) setTimeout(() => { if (token === animToken) confetti(); }, 900);
  }
  function render(fresh) {
    applyStatic();
    if (!data) return;
    renderHeader();
    $('loading').hidden = true;
    if (!data.open) {
      $('steps').hidden = true; $('closed').hidden = false; hideClassArea();
      renderClosed();
      return;
    }
    clearInterval(countdownTimer);
    $('closed').hidden = true; $('steps').hidden = false;
    if (fresh) { const h = readHash(); if (h && !sel.o) Object.assign(sel, h); }
    validateSel();
    renderSteps();
    if (sel.o) loadShard(sel.o).catch(() => {});
    if (sel.o && sel.a && sel.s && sel.c) fetchClass(false); else { hideClassArea(); writeHash(); }
  }
  function choose(field, value) {
    const order = ['o', 'a', 's', 'c'];
    const i = order.indexOf(field);
    const changed = sel[field] !== value;
    sel[field] = value;
    if (changed) { for (const k of order.slice(i + 1)) sel[k] = ''; sel.n = ''; }
    validateSel();
    renderSteps();
    if (sel.o) loadShard(sel.o).catch(() => {});
    const complete = sel.o && sel.a && sel.s && sel.c;
    if (complete) {
      if (changed || !cls || cls.key !== selKey()) { sel.n = ''; fetchClass(true); }
      setTimeout(() => {
        const target = $('result').hidden ? $('classView') : $('result');
        const r = target.getBoundingClientRect();
        if (!target.hidden && (r.top > window.innerHeight * 0.55 || r.top < 0)) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }, 60);
    } else {
      cls = null; current = null; hideClassArea();
      const next = order.find((k) => !sel[k]);
      if (next && next !== 'c' && field !== 'c') setTimeout(() => openSheet(next), reduceMotion ? 0 : 160);
      else if (next === 'c') { const ch = $('chips').querySelector('.chip'); if (ch) ch.focus({ preventScroll: true }); }
    }
    writeHash();
  }

  /* ------------------------------------------------------------ picker sheet */
  const sheet = $('sheet'); const list = $('sheetList'); const search = $('sheetSearch');
  let sheetField = ''; let sheetItems = []; let shown = []; let active = -1; let lastFocus = null;
  function optionsFor(field) {
    if (field === 'o') return [...tree.keys()].sort(sortStr);
    if (field === 'a') return [...tree.get(sel.o).keys()].sort(sortStr);
    if (field === 's') return [...tree.get(sel.o).get(sel.a).keys()].sort(sortStr);
    return [];
  }
  function openSheet(field) {
    if (!tree) return;
    if ((field === 'a' && !sel.o) || (field === 's' && !sel.a)) return;
    sheetField = field;
    sheetItems = optionsFor(field).map((v) => ({ v, n: norm(v) }));
    $('sheetTitle').textContent = { o: t('pickO'), a: t('pickA'), s: t('pickS') }[field];
    search.value = '';
    lastFocus = document.activeElement;
    sheet.hidden = false;
    document.documentElement.classList.add('lock');
    filterSheet();
    const cur = shown.findIndex((x) => x.v === sel[field]);
    setActive(cur >= 0 ? cur : -1, true);
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (fine || sheetItems.length > 12) search.focus({ preventScroll: true });
    else list.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true;
    document.documentElement.classList.remove('lock');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  function filterSheet() {
    const q = norm(search.value);
    const words = q ? q.split(' ') : [];
    shown = words.length ? sheetItems.filter((x) => words.every((w) => x.n.includes(w))) : sheetItems;
    const frag = document.createDocumentFragment();
    shown.forEach((x, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option'); li.id = 'opt-' + i; li.dataset.i = i;
      li.setAttribute('aria-selected', String(x.v === sel[sheetField]));
      li.textContent = x.v;
      frag.append(li);
    });
    list.replaceChildren(frag);
    list.scrollTop = 0;
    $('sheetNone').hidden = shown.length > 0;
    active = -1;
    if (words.length && shown.length) setActive(0);
  }
  function setActive(i, center) {
    const prev = list.querySelector('.act'); if (prev) prev.classList.remove('act');
    active = i;
    if (i < 0 || !list.children[i]) { search.removeAttribute('aria-activedescendant'); return; }
    const el = list.children[i];
    el.classList.add('act');
    search.setAttribute('aria-activedescendant', el.id);
    if (center) el.scrollIntoView({ block: 'center' }); else el.scrollIntoView({ block: 'nearest' });
  }
  list.tabIndex = -1;
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li'); if (!li) return;
    const x = shown[Number(li.dataset.i)]; if (!x) return;
    const f = sheetField; closeSheet(); choose(f, x.v);
  });
  search.addEventListener('input', filterSheet);
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(shown.length - 1, active + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, active - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const x = shown[active >= 0 ? active : (shown.length === 1 ? 0 : -1)];
      if (x) { const f = sheetField; closeSheet(); choose(f, x.v); }
    } else if (e.key === 'Tab') {
      const focusables = [...sheet.querySelectorAll('button, input')];
      const i = focusables.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
      else if (!e.shiftKey && i === focusables.length - 1) { e.preventDefault(); focusables[0].focus(); }
    }
  });
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  document.querySelectorAll('.pick').forEach((b) => b.addEventListener('click', () => openSheet(b.dataset.field)));
  $('chips').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const chips = [...$('chips').querySelectorAll('.chip')]; const i = chips.indexOf(document.activeElement);
    if (i < 0) return; e.preventDefault();
    const n = chips[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + chips.length) % chips.length];
    n.click(); setTimeout(() => { const c = $('chips').querySelector('[aria-checked="true"]'); if (c) c.focus(); }, 0);
  });

  /* ------------------------------------------------------------ language */
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    if (lang === b.dataset.lang) return;
    lang = b.dataset.lang;
    try { localStorage.setItem('zr_lang', lang); } catch (e) { /* ignore */ }
    if (!sheet.hidden) closeSheet();
    applyStatic();
    if (!data) return;
    renderHeader();
    if (!data.open) { renderClosed(); return; }
    renderSteps();
    if (cls && !isTeamMode() && !$('classView').hidden) renderClass();
    if (cls && $('classView').hidden === false && $('clsMsg').hidden === false) { /* сообщение об ошибке остаётся */ }
    if (current && !$('result').hidden) renderResult(false);
  }));

  /* ------------------------------------------------------------ toast */
  let toastTimer = 0;
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  /* ------------------------------------------------------------ share & image */
  $('btnShare').addEventListener('click', async () => {
    const url = location.href;
    const title = `${heading()} — ${pickL(data.settings.title)}`;
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); toast(t('copied')); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = url; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (er) { ok = false; }
      ta.remove(); toast(ok ? t('copied') : t('shareFail'));
    }
  });

  function wrap(ctx, text, maxW) {
    const words = String(text).split(' '); const lines = []; let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  async function drawCard() {
    try { await document.fonts.ready; } catch (e) { /* ignore */ }
    const s = data.settings;
    const item = current;
    const W = 1080;
    const disp = (w, px) => `${w} ${px}px Unbounded, "Arial Black", sans-serif`;
    const txt = (w, px) => `${w} ${px}px Onest, "Segoe UI", Arial, sans-serif`;
    const clampLines = (c, text, maxW, max) => {
      const ls = wrap(c, text, maxW);
      if (ls.length <= max) return ls;
      const out = ls.slice(0, max); let last = out[max - 1];
      while (last.length > 1 && c.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      out[max - 1] = last.trimEnd() + '…'; return out;
    };
    function background(c, H) {
      let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#24135F'); g.addColorStop(1, '#0D0724');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      g = c.createRadialGradient(W / 2, -100, 50, W / 2, -100, 900); g.addColorStop(0, 'rgba(118,69,193,.75)'); g.addColorStop(1, 'rgba(118,69,193,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.save(); c.globalAlpha = .06; c.fillStyle = '#E4FF8F';
      c.beginPath(); c.moveTo(W / 2 - 40, 0); c.lineTo(W / 2 + 40, 0); c.lineTo(W / 2 + 330, H); c.lineTo(W / 2 - 330, H); c.closePath(); c.fill(); c.restore();
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 90; i++) { c.globalAlpha = .15 + rnd() * .5; c.fillStyle = '#fff'; c.beginPath(); c.arc(rnd() * W, rnd() * H, rnd() * 1.8 + .4, 0, 7); c.fill(); }
      c.globalAlpha = 1;
      c.strokeStyle = 'rgba(184,241,26,.55)'; c.lineWidth = 3; rr(c, 40, 40, W - 80, H - 80, 44); c.stroke();
    }
    function content(c) {
      c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.save(); c.translate(W / 2, 150);
      c.fillStyle = '#1B1046'; c.strokeStyle = '#B8F11A'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 52, 0, 7); c.fill(); c.stroke();
      c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-17, -17); c.lineTo(17, -17); c.lineTo(-17, 17); c.lineTo(17, 17); c.stroke();
      c.restore();
      c.fillStyle = '#B6A6E6'; c.font = txt(500, 30); c.fillText(pickL(s.subtitle), W / 2, 260, W - 180);
      c.fillStyle = '#FFFFFF'; c.font = disp(900, 76);
      let y = 345;
      clampLines(c, pickL(s.title).toUpperCase(), W - 180, 2).forEach((l) => { c.fillText(l, W / 2, y, W - 180); y += 84; });
      const st = pickL(s.stage);
      if (st) { c.font = txt(600, 28); const w = Math.min(W - 200, c.measureText(st).width + 48); c.strokeStyle = 'rgba(184,241,26,.6)'; c.lineWidth = 2; rr(c, W / 2 - w / 2, y - 26, w, 52, 26); c.stroke(); c.fillStyle = '#E4FF8F'; c.fillText(st, W / 2, y + 9, w - 30); y += 70; }
      c.fillStyle = '#FFFFFF'; c.font = disp(700, 40);
      y += 40; clampLines(c, heading(), W - 200, 4).forEach((l) => { c.fillText(l, W / 2, y); y += 52; });
      c.fillStyle = '#B6A6E6'; c.font = txt(500, 28);
      clampLines(c, placeLine(), W - 200, 3).forEach((l) => { c.fillText(l, W / 2, y); y += 38; });
      y += 20;
      const cx = W / 2, cy = y + 150, R = 140;
      c.lineWidth = 14; c.strokeStyle = 'rgba(182,166,230,.16)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
      const frac = s.max.t && item.t !== null ? Math.max(0, Math.min(1, item.t / s.max.t)) : 1;
      c.strokeStyle = '#B8F11A'; c.lineCap = 'round'; c.shadowColor = 'rgba(184,241,26,.6)'; c.shadowBlur = 24;
      c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); c.stroke(); c.shadowBlur = 0;
      c.fillStyle = '#FFFFFF'; c.font = disp(900, 100); c.fillText(fmt(item.t), cx, cy + 30, R * 1.6);
      c.fillStyle = '#E4FF8F'; c.font = txt(600, 23); c.fillText(pickL(s.labels.t) + (s.max.t ? ` / ${fmt(s.max.t)}` : ''), cx, cy + 76, R * 1.55);
      y = cy + R + 50;
      const keys = ['b1', 'b2', 'b3'].filter((k) => s.show[k]);
      if (keys.length) {
        const gap = 20, bw = (W - 200 - gap * (keys.length - 1)) / keys.length;
        keys.forEach((k, i) => {
          const x = 100 + i * (bw + gap);
          c.fillStyle = 'rgba(13,7,36,.55)'; rr(c, x, y, bw, 120, 24); c.fill(); c.strokeStyle = 'rgba(182,166,230,.25)'; c.lineWidth = 2; c.stroke();
          c.fillStyle = '#B6A6E6'; c.font = txt(500, 24); c.fillText(clampLines(c, pickL(s.labels[k]), bw - 24, 1)[0], x + bw / 2, y + 42);
          c.fillStyle = '#FFFFFF'; c.font = disp(700, 40); c.fillText(fmt(item[k]) + (s.max[k] ? '' : ''), x + bw / 2, y + 94, bw - 24);
        });
        y += 150;
      }
      if (item.place) {
        const label = `${pickL(s.labels.place)}: ${t('placeN')(roman(item.place))}`;
        c.font = disp(700, 32); c.fillStyle = ['', '#F5D46B', '#DCE3F0', '#E3A36F'][item.place] || '#B6A6E6';
        c.fillText(label, W / 2, y + 22, W - 200);
        y += 64;
      }
      if (s.showTeacher && item.teacher) {
        c.font = txt(500, 24); c.fillStyle = '#B6A6E6';
        c.fillText(`${t('teacher')}: ${item.teacher}`, W / 2, y + 8, W - 200);
        y += 46;
      }
      if (s.show.st) {
        const kind = item.st === 1 ? 'yes' : item.st === 2 ? 'no' : 'pending';
        const label = pickL(s.statusText[kind]);
        c.font = disp(700, 30);
        const w = Math.min(W - 160, c.measureText(label).width + 80);
        c.fillStyle = kind === 'yes' ? '#B8F11A' : 'rgba(182,166,230,.16)'; rr(c, W / 2 - w / 2, y, w, 76, 38); c.fill();
        c.fillStyle = kind === 'yes' ? '#140B33' : '#F5F1FF'; c.fillText(label, W / 2, y + 49, w - 50);
        y += 76;
      }
      return y;
    }
    const probe = document.createElement('canvas').getContext('2d');
    probe.canvas.width = W; probe.canvas.height = 10;
    const endY = content(probe);
    const H = Math.max(1350, Math.ceil(endY + 150));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    background(c, H);
    content(c);
    c.textAlign = 'center'; c.fillStyle = 'rgba(182,166,230,.8)'; c.font = txt(500, 24); c.fillText(location.host + '  ·  Zerdeli Group', W / 2, H - 78);
    return new Promise((r) => cv.toBlob(r, 'image/png'));
  }
  $('btnSave').addEventListener('click', async () => {
    const btn = $('btnSave'); if (btn.disabled) return; btn.disabled = true;
    try {
      const blob = await drawCard();
      if (!blob) throw new Error('blob');
      const name = `${heading()} ${sel.c}`.replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 80).trim() + '.png';
      const file = new File([blob], name, { type: 'image/png' });
      if (window.matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast(t('saved'));
    } catch (e) { toast('Error'); }
    finally { btn.disabled = false; }
  });

  /* ------------------------------------------------------------ sky */
  (function sky() {
    const cv = $('sky'); const ctx = cv.getContext('2d');
    let w, h, stars = [], raf = 0, last = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(140, (w * h) / 9000));
      stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + .3, a: Math.random(), s: Math.random() * .6 + .2, v: Math.random() * .08 + .02 }));
      draw(0);
    }
    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.y -= st.v * dt * 0.06; if (st.y < -2) { st.y = h + 2; st.x = Math.random() * w; }
        st.a += st.s * dt * 0.001;
        const al = 0.25 + Math.abs(Math.sin(st.a)) * 0.6;
        ctx.globalAlpha = al; ctx.fillStyle = st.r > 1.2 ? '#E4FF8F' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function loop(now) { const dt = Math.min(64, now - (last || now)); last = now; draw(dt); raf = requestAnimationFrame(loop); }
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    size();
    if (reduceMotion) return;
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = 0; raf = requestAnimationFrame(loop); } });
  })();

  /* ------------------------------------------------------------ confetti */
  function confetti() {
    if (reduceMotion) return;
    const cv = $('confetti'); const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#B8F11A', '#E4FF8F', '#FFFFFF', '#7645C1', '#B6A6E6'];
    const ps = Array.from({ length: 140 }, (_, i) => {
      const left = i % 2 === 0;
      return { x: left ? 0 : W, y: H * 0.65, vx: (left ? 1 : -1) * (4 + Math.random() * 8), vy: -(9 + Math.random() * 9), w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: colors[i % colors.length] };
    });
    const t0 = performance.now();
    function f(now) {
      const el = now - t0; ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - el / 3200); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r))); ctx.restore();
      }
      if (el < 3200) requestAnimationFrame(f); else ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(f);
  }

  /* ------------------------------------------------------------ start */
  applyStatic();
  load(true);
})();
