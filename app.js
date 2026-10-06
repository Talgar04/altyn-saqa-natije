(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================================ i18n */
  const T = {
    kk: {
      loading: 'Нәтижелер жүктелуде…', loadError: 'Нәтижелер жүктелмеді. Интернетті тексеріп, қайталап көріңіз.', retry: 'Қайталау',
      navResults: 'Нәтижелер', navPromo: 'Дайындық курсы', ctaFind: 'Нәтижені көру',
      statStudents: 'қатысушы', statSchools: 'мектеп', statOblys: 'өңір',
      finderTitle: 'Баланың нәтижесін табу',
      oblys: 'Облыс', audan: 'Аудан', school: 'Мектеп', klass: 'Сынып',
      pickO: 'Облысты таңдаңыз', pickA: 'Ауданды таңдаңыз', pickS: 'Мектепті таңдаңыз', pickFirst: 'Алдымен мектепті таңдаңыз',
      search: 'Іздеу', nothing: 'Ештеңе табылмады', close: 'Жабу',
      tapChild: 'Балаңыздың атын басыңыз — оның жеке парағы ашылады.',
      classFull: (g, l) => (l ? `${g} «${l}» сынып` : `${g}-сынып`), classShort: (g, l) => (l ? `${g} «${l}»` : `${g}-сынып`),
      placeN: (r) => `${r} орын`, teacher: 'Мұғалімі', absentShort: 'қатыспады',
      absentTitle: 'Олимпиадаға қатыспады', absentText: 'Бұл оқушы мектепішілік кезеңге қатыспаған.',
      classErr: 'Сынып тізімі жүктелмеді. Қайталап көріңіз.', notFound: 'Оқушы табылмады. Сілтемені тексеріңіз немесе тізімнен қайта таңдаңыз.',
      back: 'Сынып тізіміне оралу', backHome: 'Басты бетке',
      ribbonYes: 'Келесі кезеңге өтті!', ribbonNo: 'Жарайсың!', ribbonPending: 'Жарайсың!', cardThanks: 'Қатысқаныңыз үшін рахмет!',
      reactTitleYes: 'Балаңызға тілегіңізді білдіріңіз', reactTitleNo: 'Балаңызды қолдап жіберіңіз',
      r_pray: 'Сәттілік!', r_clap: 'Жарайсың!', r_heart: 'Мақтанамыз', r_fire: 'Алға!', r_strong: 'Келесі жолы!',
      sign: 'Құрметпен, «{title}» олимпиадасының ұйымдастырушылары',
      save: 'Суретті сақтау', share: 'WhatsApp-та бөлісу', copied: 'Сілтеме көшірілді', saved: 'Сурет сақталды', shareFail: 'Сілтемені көшіру мүмкін болмады',
      call: 'Қоңырау шалу', whatsapp: 'WhatsApp-қа жазу', footCall: 'Дайындық курсы:',
      preparing: 'Сурет дайындалуда…', shareDesktop: 'Сурет сақталды, мәтін көшірілді — WhatsApp-та суретті тіркеп, мәтінді қойыңыз',
      days: 'күн', hours: 'сағат', mins: 'минут', secs: 'секунд', of: '/',
      waText: 'Сәлеметсіз бе! Аудандық кезеңге дайындық курсы туралы білгім келеді.',
    },
    ru: {
      loading: 'Загружаем результаты…', loadError: 'Не удалось загрузить результаты. Проверьте интернет и попробуйте ещё раз.', retry: 'Повторить',
      navResults: 'Результаты', navPromo: 'Курс подготовки', ctaFind: 'Посмотреть результат',
      statStudents: 'участников', statSchools: 'школ', statOblys: 'регионов',
      finderTitle: 'Найти результат ребёнка',
      oblys: 'Область', audan: 'Район', school: 'Школа', klass: 'Класс',
      pickO: 'Выберите область', pickA: 'Выберите район', pickS: 'Выберите школу', pickFirst: 'Сначала выберите школу',
      search: 'Поиск', nothing: 'Ничего не найдено', close: 'Закрыть',
      tapChild: 'Нажмите на имя ребёнка — откроется его личная страница.',
      classFull: (g, l) => (l ? `${g} «${l}» класс` : `${g} класс`), classShort: (g, l) => (l ? `${g} «${l}»` : `${g} класс`),
      placeN: (r) => `${r} место`, teacher: 'Учитель', absentShort: 'не участв.',
      absentTitle: 'Не участвовал(а) в олимпиаде', absentText: 'Этот ученик не принимал участие в школьном этапе.',
      classErr: 'Не удалось загрузить список класса. Попробуйте ещё раз.', notFound: 'Ученик не найден. Проверьте ссылку или выберите заново из списка.',
      back: 'Вернуться к списку класса', backHome: 'На главную',
      ribbonYes: 'Прошёл(ла) дальше!', ribbonNo: 'Молодец!', ribbonPending: 'Молодец!', cardThanks: 'Спасибо за участие!',
      reactTitleYes: 'Поддержите ребёнка своим пожеланием', reactTitleNo: 'Поддержите своего ребёнка',
      r_pray: 'Удачи!', r_clap: 'Молодец!', r_heart: 'Гордимся', r_fire: 'Вперёд!', r_strong: 'В следующий раз!',
      sign: 'С уважением, организаторы олимпиады «{title}»',
      save: 'Сохранить картинку', share: 'Поделиться в WhatsApp', copied: 'Ссылка скопирована', saved: 'Картинка сохранена', shareFail: 'Не удалось скопировать ссылку',
      call: 'Позвонить', whatsapp: 'Написать в WhatsApp', footCall: 'Курс подготовки:',
      preparing: 'Готовим картинку…', shareDesktop: 'Картинка сохранена, текст скопирован — прикрепите картинку в WhatsApp и вставьте текст',
      days: 'дн', hours: 'ч', mins: 'мин', secs: 'сек', of: '/',
      waText: 'Здравствуйте! Хочу узнать о курсе подготовки к районному этапу.',
    },
  };
  let lang = 'kk';
  try { const q = new URLSearchParams(location.search).get('lang'); lang = q === 'ru' || q === 'kk' ? q : (localStorage.getItem('as_lang') || 'kk'); } catch (e) { /* storage blocked */ }
  if (lang !== 'ru') lang = 'kk';
  const t = (k) => T[lang][k];
  const pickL = (o) => (o && (o[lang] || o.kk || o.ru)) || '';

  /* ================================================================ helpers */
  const collator = (() => { try { return new Intl.Collator(['kk', 'ru'], { numeric: true, sensitivity: 'base', ignorePunctuation: true }); } catch (e) { return new Intl.Collator(undefined, { numeric: true }); } })();
  const sortStr = (a, b) => collator.compare(a, b);
  const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[әа]/g, 'а').replace(/ғ/g, 'г').replace(/қ/g, 'к').replace(/ң/g, 'н')
    .replace(/ө/g, 'о').replace(/[ұү]/g, 'у').replace(/һ/g, 'х').replace(/[іи]/g, 'и').replace(/[«»"'`.,№#()\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
  const splitClass = (c) => { const m = /^(\d{1,2})(?:\s+(.+))?$/.exec(c || ''); return m ? [m[1], m[2] || ''] : null; };
  const classLabel = (c) => { const x = splitClass(c); return x ? t('classFull')(x[0], x[1]) : c; };
  const classChip = (c) => { const x = splitClass(c); return x ? t('classShort')(x[0], x[1]) : c; };
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const roman = (n) => ROMAN[n] || String(n);
  const fmt = (n) => (n === null || n === undefined ? '—' : (Math.round(n * 100) / 100).toLocaleString(lang === 'ru' ? 'ru-RU' : 'kk-KZ'));
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const phoneDigits = (p) => { let d = String(p || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); if (d.length === 10) d = '7' + d; return d; };
  const waLink = (p) => `https://wa.me/${phoneDigits(p)}?text=${encodeURIComponent(t('waText'))}`;

  /* ================================================================ state */
  let data = null;            // /api/site
  let tree = null;            // Map o -> Map a -> Map s -> [c]
  const sel = { o: '', a: '', s: '', c: '' };
  let cls = null;
  const shards = new Map();   // индекс облыса -> Promise(shard)

  /* ================================================================ data */
  function buildTree(p) {
    const tr = new Map(); const d = p.d || [];
    for (const k of p.k || []) {
      const o = p.oblys[k[0]].o, a = d[k[1]], s = d[k[2]], c = d[k[3]];
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
  const oblysIndex = (o) => (data && data.oblys ? data.oblys.findIndex((x) => x.o === o) : -1);
  // Старый текст письма «Позже» упоминал «келесі кезеңге өту» — заменяем его нейтральным, если админ его не менял
  const OLD_PENDING = ['Келесі кезеңге өту нәтижесі жақында жарияланады. Қатысқаның үшін рахмет!', 'Результат прохождения в следующий этап будет объявлен скоро. Спасибо за участие!'];
  const NEUTRAL_LETTER = {
    title: { kk: 'Жарайсың, {name}!', ru: 'Молодец, {name}!' },
    body: {
      kk: '«Алтын сақа» олимпиадасының мектепішілік кезеңіне қатысып, өз біліміңді сынағаның — үлкен жетістік! Сен қиын тапсырмалардан қорықпай, барыңды салдың.\n\nБіз сенің талпынысыңды бағалаймыз және мақтан тұтамыз. Білімге деген осы құштарлығың әрдайым жолыңды ашық етсін! Қатысқаның үшін рахмет!',
      ru: 'Участвовать в школьном этапе олимпиады «Алтын сақа» и проверить свои знания — уже большое достижение! Ты не испугался(лась) сложных заданий и выложился(лась) на полную.\n\nМы ценим твоё стремление и гордимся тобой. Пусть любовь к знаниям всегда открывает тебе новые дороги! Спасибо за участие!',
    },
  };
  function neutralLetter(L) {
    if (!L) return NEUTRAL_LETTER;
    const b = L.body || {};
    const old = OLD_PENDING.includes(String(b.kk || '').trim()) || OLD_PENDING.includes(String(b.ru || '').trim()) || (!String(b.kk || '').trim() && !String(b.ru || '').trim());
    return old ? NEUTRAL_LETTER : L;
  }
  function statusOf(x) {
    if (x.absent) return 'absent';
    if (!data.settings.show.st) return 'pending'; // «Келесі кезең» скрыт в админке → никому не пишем прошёл/не прошёл
    if (x.st === 1) return 'yes';
    if (x.st === 2) return 'no';
    return data.settings.emptyStatus === 'pending' ? 'pending' : 'no';
  }
  function decode(sh) {
    const d = sh.d || [];
    const groups = new Map(); const byId = new Map();
    for (const r of sh.r || []) {
      const b1 = r[4], b2 = r[5], b3 = r[6];
      let tot = r[7];
      if (tot === null || tot === undefined) { const ps = [b1, b2, b3].filter((v) => v !== null && v !== undefined); tot = ps.length ? Math.round(ps.reduce((x, y) => x + y, 0) * 1000) / 1000 : null; }
      const x = { a: d[r[0]], s: d[r[1]], c: d[r[2]], n: r[3], b1, b2, b3, t: tot, place: r[8] || 0, st: r[9] || 0, absent: !!r[10], teacher: r[11] >= 0 ? d[r[11]] : '', id: String(r[13]) };
      const key = [x.a, x.s, x.c].join('\u0001');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(x);
      byId.set(x.id, x);
    }
    for (const list of groups.values()) list.sort((p, q) => (p.absent - q.absent) || ((q.t ?? -1) - (p.t ?? -1)) || sortStr(p.n, q.n));
    return { groups, byId };
  }
  function loadShard(i) {
    if (i < 0 || !data.oblys[i]) return Promise.reject(new Error('no oblys'));
    if (!shards.has(i)) {
      const p = (async () => {
        const res = await fetch(`/api/oblys?i=${i}&r=${data.oblys[i].rev}`);
        if (!res.ok) throw new Error(res.status);
        return decode(await res.json());
      })();
      shards.set(i, p);
      p.catch(() => { if (shards.get(i) === p) shards.delete(i); });
    }
    return shards.get(i);
  }
  async function loadSite(first) {
    try {
      const res = await fetch('/api/site', first ? {} : { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const p = await res.json();
      if (!first && data && p.rev === data.rev && p.open === data.open) return;
      const changed = data && p.rev !== data.rev;
      data = p; tree = p.open ? buildTree(p) : null;
      if (changed) shards.clear();
      $('error').hidden = true;
      route();
    } catch (e) {
      if (first || !data) { $('loading').hidden = true; $('error').hidden = false; }
    }
  }
  $('retry').addEventListener('click', () => { $('error').hidden = true; $('loading').hidden = false; loadSite(true); });
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (Date.now() - hiddenAt > 60000) loadSite(false);
  });

  /* ================================================================ routing: / и /s/<облыс>/<id> */
  function childPath() {
    const m = location.pathname.match(/^\/s\/(\d+)\/([\w-]+)\/?$/);
    return m ? { i: Number(m[1]), id: m[2] } : null;
  }
  let cameFromHome = false;
  function go(url, replace) {
    cameFromHome = !childPath() && /^\/s\//.test(url);
    try { history[replace ? 'replaceState' : 'pushState'](null, '', url); } catch (e) { location.href = url; return; }
    route(true);
  }
  window.addEventListener('popstate', () => route(true));
  let homeScroll = 0;
  function route(nav) {
    applyStatic();
    if (!data) return;
    renderHeader();
    const cp = childPath();
    if (cp) {
      if (!$('home').hidden) homeScroll = window.scrollY;
      $('home').hidden = true; $('child').hidden = false;
      renderChild(cp);
      if (nav) window.scrollTo(0, 0);
    } else {
      stopFx();
      $('child').hidden = true; $('home').hidden = false;
      renderHome();
      if (nav && homeScroll) requestAnimationFrame(() => window.scrollTo(0, homeScroll));
      if (location.hash === '#finder' || location.hash === '#promo') setTimeout(() => { const n = $(location.hash.slice(1)); if (n && !n.hidden) n.scrollIntoView({ behavior: 'smooth' }); }, 50);
    }
  }
  $('backLink').addEventListener('click', (e) => {
    e.preventDefault();
    if (cameFromHome) history.back(); else { homeScroll = 0; go('/'); setTimeout(() => { const cv = $('classView'); if (!cv.hidden) cv.scrollIntoView({ block: 'start' }); }, 300); }
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-home], a[data-nav]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const target = a.dataset.nav;
    if (childPath()) { homeScroll = 0; go('/' + (target ? '#' + target : '')); }
    if (target) { const n = $(target); if (n && !n.hidden) n.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
    else if (!childPath()) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ================================================================ static texts */
  function applyStatic() {
    document.documentElement.lang = lang === 'ru' ? 'ru' : 'kk';
    document.querySelectorAll('[data-t]').forEach((n) => { n.textContent = t(n.dataset.t); });
    document.querySelectorAll('[data-t-aria]').forEach((n) => n.setAttribute('aria-label', t(n.dataset.tAria)));
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('sheetSearch').placeholder = t('search');
    $('year').textContent = new Date().getFullYear() + ' Zerdeli App';
  }
  let statsDone = false;
  const logos = {};   // загруженные Image для картинки-карточки
  // логотипы из кабинета; если не загружены — встроенные файлы сайта
  const BUILTIN = { altyn: '/logo-altyn.png', app: '/logo-app.png', favicon: '/favicon.png' };
  const assetUrl = (name) => (data && data.assets && data.assets[name] ? `/api/asset/${name}?v=${data.assets[name]}` : BUILTIN[name] || '');
  function applyAssets() {
    const al = assetUrl('altyn'), ap = assetUrl('app'), fav = assetUrl('favicon') || ap;
    const setImg = (img, url, holder, cls) => { if (url) { if (img.getAttribute('src') !== url) img.src = url; img.hidden = false; if (holder) holder.classList.add(cls); } else { img.hidden = true; if (holder) holder.classList.remove(cls); } };
    setImg($('logoAltyn'), al, document.querySelector('.brand'), 'has-logo');
    setImg($('heroLogo'), al, document.querySelector('.hero'), 'has-logo');
    setImg($('logoApp'), ap);
    if (fav) { $('favicon').href = fav; $('touchIcon').href = fav; }
    for (const [k, url] of [['altyn', al], ['app', ap]]) {
      if (url && (!logos[k] || logos[k].url !== url)) { const im = new Image(); im.decoding = 'async'; im.src = url; logos[k] = { url, im }; }
      if (!url) delete logos[k];
    }
  }
  function renderHeader() {
    const s = data.settings;
    applyAssets();
    $('title').textContent = pickL(s.title);
    $('brandName').textContent = pickL(s.title);
    $('footTitle').textContent = pickL(s.title);
    $('subtitle').textContent = pickL(s.subtitle);
    $('stage').textContent = pickL(s.stage);
    $('heroText').textContent = data.open ? pickL(s.heroText) : '';
    document.title = [pickL(s.title), pickL(s.stage)].filter(Boolean).join(' — ');
    const ann = pickL(s.announcement);
    $('announce').hidden = !ann; $('announce').textContent = ann;
    const p = s.promo;
    $('navPromo').hidden = !(p.show && p.phone);
    const fp = $('footPhone');
    if (p.show && p.phone) {
      fp.hidden = false; fp.replaceChildren(t('footCall') + ' ');
      const a = el('a', '', t('whatsapp')); a.href = waLink(p.phone); a.target = '_blank'; a.rel = 'noopener'; fp.append(a);
    } else fp.hidden = true;
    const st = $('stats');
    st.hidden = !(s.show.stats && data.stats && data.stats.students);
    if (!st.hidden && !statsDone) { statsDone = true; countUp($('stStudents'), data.stats.students); countUp($('stSchools'), data.stats.schools); countUp($('stOblys'), data.stats.oblys); }
  }
  function countUp(node, target) {
    if (reduceMotion) { node.textContent = target.toLocaleString('ru-RU'); return; }
    const start = performance.now(); const dur = 1600;
    const step = (now) => { const p = Math.min(1, (now - start) / dur); node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('ru-RU'); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ================================================================ promo */
  function promoNode() {
    const p = data.settings.promo;
    const wrap = el('section', 'promo'); wrap.id = 'promo';
    const inn = el('div', 'promo-in');
    if (pickL(p.badge)) inn.append(el('span', 'promo-badge', pickL(p.badge)));
    inn.append(el('h2', '', pickL(p.title)));
    const ptxt = String(pickL(p.text) || '').replace(/телефон арқылы/gi, 'WhatsApp арқылы').replace(/по телефону/gi, 'в WhatsApp').replace(/\s*(\+?7|8)[\s(-]*7\d{2}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g, '');
    if (ptxt) inn.append(el('p', '', ptxt));
    const act = el('div', 'promo-actions');
    const wa = el('a', 'btn wa'); wa.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0012.04 2zm5.8 14.06c-.24.68-1.42 1.3-1.95 1.35-.5.05-.98.24-3.3-.69-2.79-1.1-4.56-3.95-4.7-4.13-.14-.18-1.12-1.49-1.12-2.85 0-1.35.71-2.02.96-2.29.25-.27.55-.34.73-.34h.52c.17 0 .4-.06.62.47.24.56.8 1.94.87 2.08.07.14.12.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.7 1.16 1.51 1.88 1.04.93 1.92 1.21 2.19 1.35.27.14.43.12.59-.07.16-.18.68-.8.86-1.07.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.34z"/></svg>'; wa.append(el('span', '', t('whatsapp')));
    wa.href = waLink(p.phone); wa.target = '_blank'; wa.rel = 'noopener';
    act.append(wa);
    inn.append(act);
    wrap.append(inn);
    return wrap;
  }
  function renderPromoHome() {
    const p = data.settings.promo;
    const slot = $('promo');
    if (!(p.show && p.phone)) { slot.hidden = true; return; }
    const n = promoNode();
    slot.replaceChildren(...n.childNodes); slot.hidden = false;
  }

  /* ================================================================ home */
  let countdownTimer = 0;
  function renderHome() {
    $('loading').hidden = true;
    renderPromoHome();
    if (!data.open) {
      $('steps').hidden = true; $('classView').hidden = true; $('closed').hidden = false;
      $('closedText').textContent = pickL(data.settings.closedText);
      renderCountdown();
      return;
    }
    clearInterval(countdownTimer);
    $('closed').hidden = true; $('steps').hidden = false;
    if (!sel.o) { const saved = readSel(); if (saved) Object.assign(sel, saved); }
    validateSel(); renderSteps();
    if (sel.o) loadShard(oblysIndex(sel.o)).catch(() => {});
    if (sel.o && sel.a && sel.s && sel.c) showClass(false); else $('classView').hidden = true;
  }
  function renderCountdown() {
    clearInterval(countdownTimer);
    const cd = $('countdown');
    const target = data.settings.releaseAt ? Date.parse(data.settings.releaseAt) : 0;
    if (!target || target <= Date.now()) { cd.hidden = true; return; }
    cd.hidden = false;
    const tick = () => {
      let ms = target - Date.now();
      if (ms <= 0) { clearInterval(countdownTimer); setTimeout(() => loadSite(false), 2500); ms = 0; }
      const parts = [[Math.floor(ms / 864e5), 'days'], [Math.floor(ms / 36e5) % 24, 'hours'], [Math.floor(ms / 6e4) % 60, 'mins'], [Math.floor(ms / 1e3) % 60, 'secs']];
      cd.replaceChildren(...parts.map(([v, k]) => { const d = el('div'); d.append(el('b', '', String(v).padStart(2, '0')), el('span', '', t(k))); return d; }));
    };
    tick(); countdownTimer = setInterval(tick, 1000);
  }
  function readSel() { try { const s = JSON.parse(localStorage.getItem('as_sel') || 'null'); return s && s.o ? s : null; } catch (e) { return null; } }
  function saveSel() { try { localStorage.setItem('as_sel', JSON.stringify(sel)); } catch (e) { /* ignore */ } }
  function validateSel() {
    if (!tree) return;
    if (sel.o && !tree.has(sel.o)) sel.o = sel.a = sel.s = sel.c = '';
    const A = sel.o ? tree.get(sel.o) : null;
    if (sel.a && (!A || !A.has(sel.a))) sel.a = sel.s = sel.c = '';
    const S = sel.a ? A.get(sel.a) : null;
    if (sel.s && (!S || !S.has(sel.s))) sel.s = sel.c = '';
    const C = sel.s ? S.get(sel.s) : null;
    if (sel.c && (!C || !C.includes(sel.c))) sel.c = '';
    if (!sel.o && tree.size === 1) sel.o = [...tree.keys()][0];
    if (sel.o && !sel.a && tree.get(sel.o).size === 1) sel.a = [...tree.get(sel.o).keys()][0];
    if (sel.s && !sel.c) { const list = tree.get(sel.o).get(sel.a).get(sel.s); if (list.length === 1) sel.c = list[0]; }
  }
  function setPick(field, value, placeholder, disabled) {
    const v = $('val-' + field);
    v.textContent = value || placeholder; v.classList.toggle('ph', !value);
    v.parentElement.disabled = !!disabled;
  }
  function renderSteps() {
    const A = sel.o ? tree.get(sel.o) : null;
    const S = sel.a && A ? A.get(sel.a) : null;
    setPick('o', sel.o, t('pickO'), false);
    setPick('a', sel.a, t('pickA'), !sel.o);
    setPick('s', sel.s, t('pickS'), !sel.a);
    const chips = $('chips'); chips.replaceChildren();
    if (!sel.s) chips.append(el('span', 'hint', t('pickFirst')));
    else {
      const list = S.get(sel.s);
      for (const c of list) {
        const b = el('button', 'chip', classChip(c)); b.type = 'button';
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(c === sel.c)); b.setAttribute('aria-label', classLabel(c));
        b.tabIndex = c === sel.c || (!sel.c && c === list[0]) ? 0 : -1;
        b.addEventListener('click', () => choose('c', c));
        chips.append(b);
      }
    }
    const firstEmpty = ['o', 'a', 's', 'c'].find((k) => !sel[k]);
    document.querySelectorAll('.step').forEach((li) => { const k = li.dataset.step; li.classList.toggle('done', !!sel[k]); li.classList.toggle('active', k === firstEmpty); });
  }
  function choose(field, value) {
    const order = ['o', 'a', 's', 'c'];
    const changed = sel[field] !== value;
    sel[field] = value;
    if (changed) for (const k of order.slice(order.indexOf(field) + 1)) sel[k] = '';
    validateSel(); renderSteps(); saveSel();
    if (sel.o) loadShard(oblysIndex(sel.o)).catch(() => {});
    if (sel.o && sel.a && sel.s && sel.c) {
      showClass(true);
      setTimeout(() => { const cv = $('classView'); const r = cv.getBoundingClientRect(); if (r.top > window.innerHeight * 0.6) cv.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }, 80);
    } else {
      $('classView').hidden = true;
      const next = order.find((k) => !sel[k]);
      if (next && next !== 'c' && field !== 'c') setTimeout(() => openSheet(next), reduceMotion ? 0 : 160);
      else if (next === 'c') { const ch = $('chips').querySelector('.chip'); if (ch) ch.focus({ preventScroll: true }); }
    }
  }
  let classReq = 0;
  async function showClass() {
    const req = ++classReq;
    const cv = $('classView'); cv.hidden = false;
    $('clsMsg').hidden = true; $('clsTitle').textContent = classLabel(sel.c);
    const i = oblysIndex(sel.o);
    const slow = setTimeout(() => { if (req !== classReq) return; const r = $('roster'); r.replaceChildren(); for (let k = 0; k < 4; k++) r.append(el('li', 'skel')); }, 120);
    let sh;
    try { sh = await loadShard(i); } catch (e) { clearTimeout(slow); if (req === classReq) { $('roster').replaceChildren(); $('clsMsg').hidden = false; $('clsMsgText').textContent = t('classErr'); } return; }
    clearTimeout(slow);
    if (req !== classReq) return;
    const list = sh.groups.get([sel.a, sel.s, sel.c].join('\u0001')) || [];
    cls = list;
    const frag = document.createDocumentFragment();
    list.forEach((x, k) => {
      const li = el('li');
      const b = el('button'); b.type = 'button'; // стили списка рассчитаны на кнопку
      b.append(el('span', 'ix', String(k + 1)), el('span', 'nm', x.n || '—'));
      const sc = el('span', 'sc');
      if (x.absent) { sc.append(el('span', 'abs', t('absentShort'))); b.classList.add('absent'); }
      else {
        if (x.place >= 1 && x.place <= 3) { const pb = el('span', 'pb m' + x.place, roman(x.place)); pb.title = t('placeN')(roman(x.place)); sc.append(pb); }
        sc.append(el('span', '', fmt(x.t)));
        if (data.settings.show.st) sc.append(el('i', 'dot ' + (statusOf(x) === 'yes' ? 'yes' : '')));
      }
      const go_ = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); go_.setAttribute('viewBox', '0 0 20 20'); go_.setAttribute('class', 'go');
      go_.innerHTML = '<path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
      sc.append(go_);
      b.append(sc);
      b.addEventListener('click', () => go(`/s/${i}/${x.id}`));
      li.append(b); frag.append(li);
    });
    $('roster').replaceChildren(frag);
  }
  $('clsRetry').addEventListener('click', () => showClass());

  /* ================================================================ picker sheet */
  const sheet = $('sheet'); const list = $('sheetList'); const search = $('sheetSearch');
  let sheetField = ''; let sheetItems = []; let shown = []; let active = -1; let lastFocus = null;
  function openSheet(field) {
    if (!tree || (field === 'a' && !sel.o) || (field === 's' && !sel.a)) return;
    sheetField = field;
    const opts = field === 'o' ? [...tree.keys()] : field === 'a' ? [...tree.get(sel.o).keys()] : [...tree.get(sel.o).get(sel.a).keys()];
    sheetItems = opts.sort(sortStr).map((v) => ({ v, n: norm(v) }));
    $('sheetTitle').textContent = { o: t('pickO'), a: t('pickA'), s: t('pickS') }[field];
    search.value = ''; lastFocus = document.activeElement;
    sheet.hidden = false; document.documentElement.classList.add('lock');
    filterSheet();
    const cur = shown.findIndex((x) => x.v === sel[field]);
    setActive(cur >= 0 ? cur : -1, true);
    if (window.matchMedia('(pointer: fine)').matches || sheetItems.length > 12) search.focus({ preventScroll: true }); else list.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true; document.documentElement.classList.remove('lock');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  function filterSheet() {
    const words = norm(search.value).split(' ').filter(Boolean);
    shown = words.length ? sheetItems.filter((x) => words.every((w) => x.n.includes(w))) : sheetItems;
    const frag = document.createDocumentFragment();
    shown.forEach((x, i) => { const li = el('li', '', x.v); li.setAttribute('role', 'option'); li.id = 'opt-' + i; li.dataset.i = i; li.setAttribute('aria-selected', String(x.v === sel[sheetField])); frag.append(li); });
    list.replaceChildren(frag); list.scrollTop = 0;
    $('sheetNone').hidden = shown.length > 0;
    active = -1; if (words.length && shown.length) setActive(0);
  }
  function setActive(i, center) {
    const prev = list.querySelector('.act'); if (prev) prev.classList.remove('act');
    active = i;
    if (i < 0 || !list.children[i]) { search.removeAttribute('aria-activedescendant'); return; }
    const n = list.children[i]; n.classList.add('act'); search.setAttribute('aria-activedescendant', n.id);
    n.scrollIntoView({ block: center ? 'center' : 'nearest' });
  }
  list.tabIndex = -1;
  list.addEventListener('click', (e) => { const li = e.target.closest('li'); if (!li) return; const x = shown[Number(li.dataset.i)]; if (!x) return; const f = sheetField; closeSheet(); choose(f, x.v); });
  search.addEventListener('input', filterSheet);
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(shown.length - 1, active + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, active - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const x = shown[active >= 0 ? active : (shown.length === 1 ? 0 : -1)]; if (x) { const f = sheetField; closeSheet(); choose(f, x.v); } }
    else if (e.key === 'Tab') {
      const f = [...sheet.querySelectorAll('button, input')]; const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  document.querySelectorAll('.pick').forEach((b) => b.addEventListener('click', () => openSheet(b.dataset.field)));
  $('chips').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const chips = [...$('chips').querySelectorAll('.chip')]; const i = chips.indexOf(document.activeElement);
    if (i < 0) return; e.preventDefault();
    chips[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + chips.length) % chips.length].click();
    setTimeout(() => { const c = $('chips').querySelector('[aria-checked="true"]'); if (c) c.focus(); }, 0);
  });

  /* ================================================================ child page */
  let current = null; let childReq = 0;
  async function renderChild(cp) {
    const req = ++childReq;
    const body = $('childBody');
    if (!data.open) { body.replaceChildren(closedCard()); return; }
    const back = $('backLink');
    if (!data.oblys[cp.i]) { body.replaceChildren(msgCard(t('notFound'))); back.href = '/'; return; }
    body.replaceChildren(el('div', 'panel-loading')); body.firstChild.append(el('span', 'spinner'), el('span', '', t('loading')));
    let sh;
    try { sh = await loadShard(cp.i); } catch (e) { if (req === childReq) { const m = msgCard(t('loadError')); const b = el('button', 'btn', t('retry')); b.type = 'button'; b.onclick = () => renderChild(cp); m.append(b); body.replaceChildren(m); } return; }
    if (req !== childReq) return;
    const x = sh.byId.get(cp.id);
    if (!x) { body.replaceChildren(msgCard(t('notFound'))); return; }
    current = x;
    // выбор в форме подстраиваем под ребёнка — «назад» вернёт к его классу
    Object.assign(sel, { o: data.oblys[cp.i].o, a: x.a, s: x.s, c: x.c }); saveSel();
    document.title = `${x.n} — ${pickL(data.settings.title)}`;
    body.replaceChildren(...buildChild(x, cp.i));
    animateChild(x);
  }
  function msgCard(text) { const c = el('div', 'absent-card'); c.append(el('p', '', text)); return c; }
  function closedCard() { const c = el('div', 'absent-card'); c.append(el('h2', '', pickL(data.settings.closedText))); return c; }
  const RING_C = 553;
  function buildChild(x, oi) {
    const s = data.settings; const kind = statusOf(x);
    const out = [];
    if (kind === 'absent') {
      const c = el('div', 'absent-card'); c.append(el('h2', '', x.n), el('p', '', `${x.s}, ${classLabel(x.c)}`), el('p', '', t('absentTitle')));
      out.push(c);
      return out;
    }
    const card = el('section', 'kid ' + kind);
    const inn = el('div', 'kid-in');
    if (kind === 'yes') inn.append(el('div', 'rays'));
    inn.append(el('p', 'ribbon', t(kind === 'yes' ? 'ribbonYes' : kind === 'no' ? 'ribbonNo' : 'ribbonPending')));
    inn.append(el('h1', 'kid-name', x.n));
    inn.append(el('p', 'kid-where', `${x.s} · ${classLabel(x.c)} · ${x.a}, ${data.oblys[oi].o}`));
    if (s.show.teacher && x.teacher) inn.append(el('p', 'kid-teacher', `${t('teacher')}: ${x.teacher}`));
    // кольцо
    const hero = el('div', 'score-hero');
    hero.innerHTML = '<svg class="ring" viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8F11A"/><stop offset="1" stop-color="#E4FF8F"/></linearGradient><linearGradient id="rgGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9971C"/><stop offset=".5" stop-color="#F2C94C"/><stop offset="1" stop-color="#FFF1C2"/></linearGradient></defs><circle cx="100" cy="100" r="88" class="ring-bg"/><circle cx="100" cy="100" r="88" class="ring-fg"/></svg>';
    const tot = el('div', 'total');
    tot.append(el('span', 'total-num', '0'));
    if (s.max.t) tot.append(el('span', 'total-max', `${t('of')} ${fmt(s.max.t)}`));
    tot.append(el('span', 'total-label', pickL(s.labels.t)));
    hero.append(tot); inn.append(hero);
    // баллы
    const parts = el('ul', 'parts');
    for (const k of ['b1', 'b2', 'b3']) {
      if (!s.show[k]) continue;
      const li = el('li'); li.append(el('span', 'pl', pickL(s.labels[k])));
      const v = el('span', 'pv', fmt(x[k]));
      if (s.max[k]) v.append(el('small', '', `${t('of')} ${fmt(s.max[k])}`));
      li.append(v);
      if (s.max[k] && x[k] !== null) { const bar = el('div', 'bar'); const i = el('i'); i.dataset.w = Math.max(0, Math.min(1, x[k] / s.max[k])); bar.append(i); li.append(bar); }
      parts.append(li);
    }
    if (parts.children.length) inn.append(parts);
    if (s.show.place && x.place) {
      const ml = el('p', 'medal-line' + (x.place <= 3 ? ' m' + x.place : ''));
      ml.append(el('i', '', roman(x.place)), `${pickL(s.labels.place)}: ${t('placeN')(roman(x.place))}`);
      inn.append(ml);
    }
    if (s.show.st) {
      const box = el('div', 'status ' + kind);
      box.append(el('span', 'status-icon'));
      const d = el('div'); d.append(el('span', 'status-label', pickL(s.labels.st)), el('strong', 'status-text', pickL(s.statusText[kind])));
      box.append(d); inn.append(box);
    }
    card.append(inn); out.push(card);
    // письмо
    const L = kind === 'pending' ? neutralLetter(s.letters.pending) : s.letters[kind];
    const name = (x.n || '').split(' ').slice(-1)[0] || x.n; // обращение по имени (в таблице «Фамилия Имя»)
    if (L && (pickL(L.title) || pickL(L.body))) {
      const letter = el('article', 'letter ' + kind);
      letter.append(el('span', 'seal', kind === 'yes' ? '🏆' : kind === 'no' ? '⭐' : '✉️'));
      letter.append(el('h3', '', pickL(L.title).replace(/\{name\}/g, name)));
      for (const para of pickL(L.body).replace(/\{name\}/g, name).split(/\n\s*\n/)) if (para.trim()) letter.append(el('p', '', para.trim()));
      letter.append(el('p', 'sign', t('sign').replace('{title}', pickL(s.title))));
      out.push(letter);
    }
    // реакции
    if (s.reactions && x.id) out.push(reactionsNode(x, kind));
    // действия
    const act = el('div', 'kid-actions');
    if (s.download) { const b = el('button', 'btn ghost'); b.type = 'button'; b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v9m0 0l-4-4m4 4l4-4M4 15h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; b.append(el('span', '', t('save'))); b.addEventListener('click', () => saveImage(b)); act.append(b); }
    const sb = el('button', 'btn wa'); sb.type = 'button'; sb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0012.04 2zm5.8 14.06c-.24.68-1.42 1.3-1.95 1.35-.5.05-.98.24-3.3-.69-2.79-1.1-4.56-3.95-4.7-4.13-.14-.18-1.12-1.49-1.12-2.85 0-1.35.71-2.02.96-2.29.25-.27.55-.34.73-.34h.52c.17 0 .4-.06.62.47.24.56.8 1.94.87 2.08.07.14.12.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.7 1.16 1.51 1.88 1.04.93 1.92 1.21 2.19 1.35.27.14.43.12.59-.07.16-.18.68-.8.86-1.07.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.34z"/></svg>'; sb.append(el('span', '', t('share'))); sb.addEventListener('click', () => share(sb)); act.prepend(sb);
    out.push(act);
    const p = s.promo;
    if (p.show && p.phone && (p.onChild === 'all' || (p.onChild === 'passed' && (kind === 'yes' || (kind === 'pending' && !s.show.st))))) { const pn = promoNode(); pn.removeAttribute('id'); out.push(pn); }
    return out;
  }
  function animateChild(x) {
    const s = data.settings; const kind = statusOf(x);
    const ring = document.querySelector('#childBody .ring-fg');
    const num = document.querySelector('#childBody .total-num');
    if (!ring) return;
    const frac = s.max.t && x.t !== null ? Math.max(0, Math.min(1, x.t / s.max.t)) : (x.t !== null ? 1 : 0);
    const bars = document.querySelectorAll('#childBody .bar i');
    if (reduceMotion) { ring.style.strokeDashoffset = String(RING_C * (1 - frac)); num.textContent = fmt(x.t); bars.forEach((b) => { b.style.width = b.dataset.w * 100 + '%'; }); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ring.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)';
      ring.style.strokeDashoffset = String(RING_C * (1 - frac));
      bars.forEach((b) => { b.style.width = b.dataset.w * 100 + '%'; });
    }));
    if (x.t === null) num.textContent = '—';
    else {
      const start = performance.now(); const isInt = Number.isInteger(x.t);
      const step = (now) => { if (!num.isConnected) return; const p = Math.min(1, (now - start) / 1500); const e = 1 - Math.pow(1 - p, 3); num.textContent = p < 1 ? fmt(isInt ? Math.round(x.t * e) : Math.round(x.t * e * 10) / 10) : fmt(x.t); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    if ((kind === 'yes' || (kind === 'pending' && !s.show.st)) && s.confetti) setTimeout(() => celebrate(), 700);
    else if (kind === 'no') setTimeout(() => softStars(), 500);
  }

  /* ================================================================ reactions */
  const REACT_SETS = { yes: ['pray', 'clap', 'heart', 'fire'], no: ['strong', 'heart', 'clap', 'pray'], pending: ['clap', 'heart', 'pray', 'fire'] };
  const EMOJI = { pray: '🤲', clap: '👏', heart: '❤️', fire: '🔥', strong: '💪' };
  function reactionsNode(x, kind) {
    const box = el('section', 'reacts');
    box.append(el('p', 'reacts-title', t(kind === 'yes' ? 'reactTitleYes' : 'reactTitleNo')));
    const row = el('div', 'reacts-row'); box.append(row);
    const mine = readMine(x.id);
    const counts = {};
    const btns = {};
    for (const k of REACT_SETS[kind] || REACT_SETS.pending) {
      const b = el('button', 'react' + (mine[k] ? ' on' : '')); b.type = 'button';
      b.append(el('span', 'e', EMOJI[k]), el('span', '', t('r_' + k)), el('b', '', ''));
      b.addEventListener('click', (e) => react(x.id, k, b, e));
      btns[k] = b; row.append(b);
    }
    fetch('/api/react?id=' + encodeURIComponent(x.id)).then((r) => r.json()).then((d) => {
      Object.assign(counts, d.c || {});
      for (const k of Object.keys(btns)) { const n = (counts[k] || 0) + (mine[k] && !(counts[k] > 0) ? 1 : 0); btns[k].querySelector('b').textContent = n ? n : ''; }
    }).catch(() => {});
    return box;
  }
  function readMine(id) { try { return JSON.parse(localStorage.getItem('as_r_' + id) || '{}'); } catch (e) { return {}; } }
  function react(id, k, btn, e) {
    floatEmoji(EMOJI[k], e);
    const mine = readMine(id);
    if (mine[k]) return; // одна реакция каждого вида с устройства
    mine[k] = 1;
    try { localStorage.setItem('as_r_' + id, JSON.stringify(mine)); } catch (er) { /* ignore */ }
    btn.classList.add('on');
    const b = btn.querySelector('b'); b.textContent = String((parseInt(b.textContent, 10) || 0) + 1);
    fetch('/api/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, k }) }).catch(() => {});
  }
  function floatEmoji(ch, e) {
    if (reduceMotion) return;
    const r = e.currentTarget ? e.currentTarget.getBoundingClientRect() : { left: e.clientX, top: e.clientY, width: 0 };
    for (let i = 0; i < 6; i++) {
      const f = el('span', 'float-e', ch);
      f.style.left = (r.left + r.width / 2 + (Math.random() - .5) * 30) + 'px'; f.style.top = (r.top - 4) + 'px';
      f.style.setProperty('--dx', ((Math.random() - .5) * 120) + 'px'); f.style.animationDelay = (i * 70) + 'ms';
      document.body.append(f); setTimeout(() => f.remove(), 1700 + i * 70);
    }
  }

  /* ================================================================ language */
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    if (lang === b.dataset.lang) return;
    lang = b.dataset.lang;
    try { localStorage.setItem('as_lang', lang); } catch (e) { /* ignore */ }
    if (!sheet.hidden) closeSheet();
    if (!data) { applyStatic(); return; }
    applyStatic(); renderHeader();
    const cp = childPath();
    if (cp) { stopFx(); renderChild(cp); } else renderHome();
  }));

  /* ================================================================ toast, share */
  let toastTimer = 0;
  function toast(msg) { const n = $('toast'); n.textContent = msg; n.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { n.hidden = true; }, 2600); }
  function shareMessage() {
    const x = current; const kind = statusOf(x);
    const tpl = pickL(data.settings.shareText[kind === 'absent' ? 'pending' : kind]) || '{name}\n{url}';
    return tpl.replace(/\{name\}/g, x.n).replace(/\{score\}/g, fmt(x.t)).replace(/\{school\}/g, x.s).replace(/\{url\}/g, location.href);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = el('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (er) { ok = false; } ta.remove(); return ok;
    }
  }
  // картинка + поздравительный текст: на телефоне сразу открывает выбор WhatsApp
  async function share(btn) {
    if (!current || (btn && btn.disabled)) return;
    if (btn) btn.disabled = true;
    const text = shareMessage();
    try {
      let file = null;
      if (data.settings.download !== false) {
        toast(t('preparing'));
        const blob = await drawCard();
        if (blob) file = new File([blob], `${current.n}`.replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 80).trim() + '.png', { type: 'image/png' });
      }
      if (navigator.share) {
        const payload = file && navigator.canShare && navigator.canShare({ files: [file] }) ? { files: [file], text } : { text };
        try { await navigator.share(payload); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      // компьютер: скачиваем картинку, копируем текст и открываем WhatsApp с текстом
      if (file) { const url = URL.createObjectURL(file); const a = el('a'); a.href = url; a.download = file.name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
      await copyText(text);
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
      toast(t('shareDesktop'));
    } catch (e) { toast(t('shareFail')); }
    finally { if (btn) btn.disabled = false; }
  }

  /* ================================================================ image card */
  function wrap(ctx, text, maxW) { const words = String(text).split(' '); const lines = []; let line = ''; for (const w of words) { const tt = line ? line + ' ' + w : w; if (ctx.measureText(tt).width > maxW && line) { lines.push(line); line = w; } else line = tt; } if (line) lines.push(line); return lines; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  async function drawCard() {
    try {
      const probe = 'AaӘәҒғҚқҢңӨөҰұҮүҺһІі0123456789«»';
      await Promise.all(['900', '800', '700'].map(w => document.fonts.load(`${w} 40px Montserrat`, probe)).concat(['400', '600', '700'].map(w => document.fonts.load(`${w} 40px Inter`, probe))));
      await document.fonts.ready;
    } catch (e) { /* ignore */ }
    const s = data.settings; const x = current; const kind = statusOf(x); const gold = kind === 'yes';
    const W = 1080;
    const disp = (w, px) => `${w} ${px}px Montserrat, "Segoe UI", Arial, sans-serif`;
    const txt = (w, px) => `${w} ${px}px Inter, "Segoe UI", Arial, sans-serif`;
    const clampLines = (c, text, maxW, max) => { const ls = wrap(c, text, maxW); if (ls.length <= max) return ls; const out = ls.slice(0, max); let last = out[max - 1]; while (last.length > 1 && c.measureText(last + '…').width > maxW) last = last.slice(0, -1); out[max - 1] = last.trimEnd() + '…'; return out; };
    const accent = gold ? '#F2C94C' : '#B6A6E6';
    function content(c) {
      c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      let y = 140;
      const al = logos.altyn && logos.altyn.im.complete && logos.altyn.im.naturalWidth ? logos.altyn.im : null;
      if (al) {
        const h = 150, w = Math.min(560, al.naturalWidth * h / al.naturalHeight); const hh = w * al.naturalHeight / al.naturalWidth;
        c.drawImage(al, W / 2 - w / 2, 90, w, hh); y = 90 + hh + 50;
        c.fillStyle = '#B6A6E6'; c.font = txt(500, 30); c.fillText(pickL(s.subtitle), W / 2, y, W - 180); y += 78;
      } else {
        c.fillStyle = '#B6A6E6'; c.font = txt(500, 30); c.fillText(pickL(s.subtitle), W / 2, 140, W - 180);
        c.font = disp(900, 80); c.fillStyle = gold ? '#FFE7A3' : '#FFFFFF';
        y = 236; clampLines(c, pickL(s.title).toUpperCase(), W - 180, 2).forEach((l) => { c.fillText(l, W / 2, y, W - 180); y += 88; });
      }
      const stg = pickL(s.stage);
      if (stg) { c.font = txt(600, 28); const w = Math.min(W - 200, c.measureText(stg).width + 48); c.strokeStyle = accent; c.lineWidth = 2; rr(c, W / 2 - w / 2, y - 30, w, 52, 26); c.stroke(); c.fillStyle = accent; c.fillText(stg, W / 2, y + 5, w - 30); y += 80; }
      const rib = t(kind === 'yes' ? 'ribbonYes' : kind === 'no' ? 'ribbonNo' : 'ribbonPending').toUpperCase();
      c.font = disp(900, 34); const rw = Math.min(W - 160, c.measureText(rib).width + 80);
      c.fillStyle = gold ? '#F2C94C' : 'rgba(182,166,230,.18)'; rr(c, W / 2 - rw / 2, y, rw, 70, 35); c.fill();
      c.fillStyle = gold ? '#2A1A00' : '#FFFFFF'; c.fillText(rib, W / 2, y + 47, rw - 40); y += 150;
      c.fillStyle = '#FFFFFF'; c.font = disp(900, 58);
      clampLines(c, x.n, W - 180, 2).forEach((l) => { c.fillText(l, W / 2, y); y += 70; });
      c.fillStyle = '#B6A6E6'; c.font = txt(500, 28);
      clampLines(c, `${x.s}, ${classLabel(x.c)}`, W - 200, 3).forEach((l) => { c.fillText(l, W / 2, y); y += 38; });
      y += 30;
      const cx = W / 2, cy = y + 140, R = 130;
      c.lineWidth = 14; c.strokeStyle = 'rgba(182,166,230,.16)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
      const frac = s.max.t && x.t !== null ? Math.max(0, Math.min(1, x.t / s.max.t)) : 1;
      c.strokeStyle = gold ? '#F2C94C' : '#B8F11A'; c.lineCap = 'round'; c.shadowColor = gold ? 'rgba(242,201,76,.6)' : 'rgba(184,241,26,.5)'; c.shadowBlur = 24;
      c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); c.stroke(); c.shadowBlur = 0;
      c.fillStyle = '#FFFFFF'; c.font = disp(900, 96); c.fillText(fmt(x.t), cx, cy + 28, R * 1.6);
      c.fillStyle = gold ? '#FFE7A3' : '#E4FF8F'; c.font = txt(600, 23); c.fillText(pickL(s.labels.t) + (s.max.t ? ` / ${fmt(s.max.t)}` : ''), cx, cy + 72, R * 1.55);
      y = cy + R + 50;
      const keys = ['b1', 'b2', 'b3'].filter((k) => s.show[k]);
      if (keys.length) {
        const gap = 20, bw = (W - 200 - gap * (keys.length - 1)) / keys.length;
        keys.forEach((k, i) => {
          const bx = 100 + i * (bw + gap);
          c.fillStyle = 'rgba(13,7,36,.55)'; rr(c, bx, y, bw, 116, 24); c.fill(); c.strokeStyle = 'rgba(182,166,230,.25)'; c.lineWidth = 2; c.stroke();
          c.fillStyle = '#B6A6E6'; c.font = txt(500, 24); c.fillText(clampLines(c, pickL(s.labels[k]), bw - 24, 1)[0], bx + bw / 2, y + 42);
          c.fillStyle = '#FFFFFF'; c.font = disp(700, 40); c.fillText(fmt(x[k]), bx + bw / 2, y + 92, bw - 24);
        });
        y += 150;
      }
      if (s.show.place && x.place) { c.font = disp(700, 32); c.fillStyle = ['', '#F5D46B', '#DCE3F0', '#E3A36F'][x.place] || '#B6A6E6'; c.fillText(`${pickL(s.labels.place)}: ${t('placeN')(roman(x.place))}`, W / 2, y + 22, W - 200); y += 70; }
      if (s.show.st || kind === 'no') {
        const label = kind === 'no' ? t('cardThanks') : pickL(s.statusText[kind]); c.font = disp(700, 30);
        const w = Math.min(W - 160, c.measureText(label).width + 80);
        c.fillStyle = gold ? '#F2C94C' : 'rgba(182,166,230,.16)'; rr(c, W / 2 - w / 2, y, w, 76, 38); c.fill();
        c.fillStyle = gold ? '#2A1A00' : '#F5F1FF'; c.fillText(label, W / 2, y + 49, w - 50); y += 76;
      }
      return y;
    }
    const probe = document.createElement('canvas').getContext('2d');
    const H = Math.max(1350, Math.ceil(content(probe) + 200));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, gold ? '#2E1A63' : '#24135F'); g.addColorStop(1, '#0D0724'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createRadialGradient(W / 2, -100, 50, W / 2, -100, 900); g.addColorStop(0, gold ? 'rgba(242,201,76,.45)' : 'rgba(118,69,193,.75)'); g.addColorStop(1, 'rgba(118,69,193,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 90; i++) { c.globalAlpha = .15 + rnd() * .5; c.fillStyle = gold && i % 3 === 0 ? '#F2C94C' : '#fff'; c.beginPath(); c.arc(rnd() * W, rnd() * H, rnd() * 1.8 + .4, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    c.strokeStyle = gold ? 'rgba(242,201,76,.7)' : 'rgba(182,166,230,.45)'; c.lineWidth = 3; rr(c, 40, 40, W - 80, H - 80, 44); c.stroke();
    content(c);
    c.textAlign = 'center'; c.fillStyle = 'rgba(182,166,230,.8)'; c.font = txt(500, 24);
    const ap = logos.app && logos.app.im.complete && logos.app.im.naturalWidth ? logos.app.im : null;
    if (ap) {
      c.font = disp(700, 30); c.fillStyle = '#FFFFFF';
      const label = 'Zerdeli App'; const tw = c.measureText(label).width; const sz = 56; const gap = 16;
      const x0 = W / 2 - (sz + gap + tw) / 2;
      c.save(); rr(c, x0, H - 150, sz, sz, 14); c.clip(); c.drawImage(ap, x0, H - 150, sz, sz); c.restore();
      c.textAlign = 'left'; c.fillText(label, x0 + sz + gap, H - 111);
    }
    else { c.font = disp(700, 30); c.fillStyle = '#FFFFFF'; c.fillText('Zerdeli App', W / 2, H - 111); }
    return new Promise((r) => cv.toBlob(r, 'image/png'));
  }
  async function saveImage(btn) {
    if (btn.disabled) return; btn.disabled = true;
    try {
      const blob = await drawCard(); if (!blob) throw new Error('blob');
      const name = `${current.n}`.replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 80).trim() + '.png';
      const file = new File([blob], name, { type: 'image/png' });
      if (window.matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      const url = URL.createObjectURL(blob); const a = el('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000); toast(t('saved'));
    } catch (e) { toast('Error'); } finally { btn.disabled = false; }
  }

  /* ================================================================ effects */
  const fx = $('fx'); const fctx = fx.getContext('2d'); let fxRaf = 0; let parts = [];
  function fxSize() { const dpr = Math.min(window.devicePixelRatio || 1, 2); fx.width = innerWidth * dpr; fx.height = innerHeight * dpr; fctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function stopFx() { cancelAnimationFrame(fxRaf); fxRaf = 0; parts = []; fctx.clearRect(0, 0, fx.width, fx.height); }
  function runFx(until) {
    fxSize();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(40, now - last) / 16.7; last = now;
      fctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.vy += p.g * dt; p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt);
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.r += p.vr * dt;
        fctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.fade));
        fctx.fillStyle = p.c;
        if (p.kind === 'rect') { fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 1.7))); fctx.restore(); }
        else { fctx.beginPath(); fctx.arc(p.x, p.y, p.w, 0, 6.283); fctx.fill(); }
      }
      fctx.globalAlpha = 1;
      if (parts.length || now < until) fxRaf = requestAnimationFrame(loop); else stopFx();
    };
    cancelAnimationFrame(fxRaf); fxRaf = requestAnimationFrame(loop);
  }
  function burst(x, y, colors, n, power) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (Math.random() * .6 + .4) * power;
      parts.push({ kind: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .06, drag: .985, w: Math.random() * 2 + 1.4, r: 0, vr: 0, c: colors[i % colors.length], life: 70 + Math.random() * 30, fade: 40 });
    }
  }
  function celebrate() {
    if (reduceMotion || childPath() === null) return;
    const gold = ['#F2C94C', '#FFE7A3', '#FFFFFF', '#C9971C'];
    const mix = ['#F2C94C', '#FFE7A3', '#B8F11A', '#FFFFFF', '#7645C1', '#B6A6E6'];
    const W = innerWidth, H = innerHeight;
    for (let i = 0; i < 160; i++) {
      const left = i % 2 === 0;
      parts.push({ kind: 'rect', x: left ? -10 : W + 10, y: H * .7, vx: (left ? 1 : -1) * (4 + Math.random() * 9), vy: -(10 + Math.random() * 10), g: .3, drag: .992, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: mix[i % mix.length], life: 200, fade: 60 });
    }
    // салют
    const shots = [[.25, .25], [.75, .2], [.5, .15], [.18, .4], [.82, .38], [.5, .3]];
    shots.forEach(([fx_, fy], k) => setTimeout(() => { if (childPath()) burst(W * fx_, H * fy, k % 2 ? gold : mix, 70, 7); }, 400 + k * 550));
    runFx(performance.now() + 5200);
  }
  function softStars() {
    if (reduceMotion) return;
    const W = innerWidth, H = innerHeight; const cols = ['#B6A6E6', '#E4FF8F', '#FFFFFF', '#F2C94C'];
    for (let i = 0; i < 60; i++) parts.push({ kind: 'dot', x: Math.random() * W, y: H + Math.random() * 60, vx: (Math.random() - .5) * .6, vy: -(1.2 + Math.random() * 2.2), g: 0, drag: 1, w: Math.random() * 2.4 + 1, r: 0, vr: 0, c: cols[i % cols.length], life: 160 + Math.random() * 120, fade: 80 });
    runFx(performance.now() + 4000);
  }
  window.addEventListener('resize', () => { if (fxRaf) fxSize(); });

  /* ================================================================ sky */
  (function sky() {
    const cv = $('sky'); const ctx = cv.getContext('2d');
    let w, h, stars = [], raf = 0, last = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      w = innerWidth; h = innerHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(140, (w * h) / 9000));
      stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + .3, a: Math.random() * 6, s: Math.random() * .6 + .2, v: Math.random() * .08 + .02 }));
      draw(0);
    }
    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.y -= st.v * dt * .06; if (st.y < -2) { st.y = h + 2; st.x = Math.random() * w; }
        st.a += st.s * dt * .001;
        ctx.globalAlpha = .25 + Math.abs(Math.sin(st.a)) * .6; ctx.fillStyle = st.r > 1.2 ? '#FFE7A3' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const loop = (now) => { const dt = Math.min(64, now - (last || now)); last = now; draw(dt); raf = requestAnimationFrame(loop); };
    let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    size();
    if (reduceMotion) return;
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = 0; raf = requestAnimationFrame(loop); } });
  })();

  /* ================================================================ start */
  applyStatic();
  loadSite(true);
})();
