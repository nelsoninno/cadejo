/* assets/js/main.js: header, hero reel, experience finder, open/closed status. */
(function(){
  var lang = document.documentElement.lang === 'es' ? 'es' : 'en';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header turns solid after the hero starts scrolling */
  var header = document.querySelector('.site-header');
  function onScroll(){ header.classList.toggle('is-solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* Hero reel: stand-in for the 30 s video. Fast cuts first, then slower. */
  var frames = [].slice.call(document.querySelectorAll('.hero__reel img'));
  var place = document.querySelector('.hero__place');
  if (frames.length){
    var i = 0;
    var show = function(n){
      frames.forEach(function(f,k){ f.classList.toggle('is-on', k === n); });
      if (place) place.textContent = frames[n].dataset.place || '';
    };
    show(0);
    if (!reduce){
      var step = 0;
      var next = function(){
        i = (i + 1) % frames.length; show(i); step++;
        setTimeout(next, step < frames.length ? 1300 : 3200); /* big changes in the first seconds */
      };
      setTimeout(next, 1300);
    }
  }

  /* Opening hours, America/El_Salvador. Only branches with confirmed hours.
     Each day: [open, close] in minutes from midnight; close may pass 24:00. */
  var H = {
    'zona-rosa':   {0:[660,1260],1:[660,1380],2:[660,1380],3:[660,1380],4:[660,1380],5:[660,1500],6:[660,1500]},
    'santa-elena': {0:[660,1260],1:[660,1380],2:[660,1380],3:[660,1380],4:[660,1380],5:[660,1500],6:[660,1500]}
  };
  var T = {
    en:{open:'Open now', closes:'closes at', closed:'Closed now', opens:'opens at', tbc:'Hours being confirmed'},
    es:{open:'Abierto ahora', closes:'cierra a las', closed:'Cerrado ahora', opens:'abre a las', tbc:'Horario por confirmar'}
  }[lang];
  function svNow(){
    var p = new Intl.DateTimeFormat('en-US',{timeZone:'America/El_Salvador',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
    var o = {}; p.forEach(function(x){ o[x.type] = x.value; });
    var days = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
    return {d:days[o.weekday], m:(parseInt(o.hour,10)%24)*60 + parseInt(o.minute,10)};
  }
  function fmt(min){
    min = min % 1440; var h = Math.floor(min/60), m = min % 60;
    var ap = h >= 12 ? 'p.m.' : 'a.m.'; var h12 = h % 12 || 12;
    return h12 + (m ? ':' + (m<10?'0':'') + m : '') + ' ' + ap;
  }
  function status(id){
    var s = H[id]; if (!s) return {cls:'', text:T.tbc};
    var n = svNow(), today = s[n.d], prev = s[(n.d+6)%7];
    if (prev && prev[1] > 1440 && n.m < prev[1]-1440) return {cls:'is-open', text:T.open + ', ' + T.closes + ' ' + fmt(prev[1])};
    if (today && n.m >= today[0] && n.m < today[1]) return {cls:'is-open', text:T.open + ', ' + T.closes + ' ' + fmt(today[1])};
    if (today && n.m < today[0]) return {cls:'is-closed', text:T.closed + ', ' + T.opens + ' ' + fmt(today[0])};
    var tm = s[(n.d+1)%7]; return {cls:'is-closed', text:T.closed + (tm ? ', ' + T.opens + ' ' + fmt(tm[0]) : '')};
  }
  function paintStatus(root){
    [].forEach.call(root.querySelectorAll('.status[data-hours]'), function(el){
      var r = status(el.dataset.hours); el.textContent = r.text; el.className = 'status ' + r.cls;
    });
  }
  paintStatus(document);

  /* Experience finder. Weights come from the branch audience board:
     main audience (heart) = 3, other audiences = 1. Guatemala is left out (other country). */
  var A = {
    'playa':      {familias:3,turistas:3,parejas:1},
    'mansion':    {turistas:3,familias:1,amigos:1,celebraciones:1,empresas:1,parejas:1,conocer:2},
    'montana':    {familias:3,empresas:3,celebraciones:3,amigos:1,parejas:1,turistas:1,conocer:1},
    'zona-rosa':  {turistas:3,amigos:3,experiencias:1,celebraciones:1,tomar:1,parejas:1},
    'santa-elena':{experiencias:3,amigos:3,tomar:1},
    'opico':      {amigos:3,tomar:3,experiencias:1},
    'soyapango':  {amigos:3,familias:3,tomar:1,experiencias:1,celebraciones:1},
    'aeropuerto': {turistas:1}
  };
  var WHO = {familia:['familias'], pareja:['parejas'], amigos:['amigos','tomar'], equipo:['empresas'], celebracion:['celebraciones'], visita:['turistas','conocer']};
  var VIBE = {
    playa:{'playa':6}, montana:{'montana':6}, historia:{'mansion':6},
    cerveza:{'zona-rosa':6,'santa-elena':1,'opico':1,'soyapango':1},
    noche:{'santa-elena':4,'zona-rosa':3,'soyapango':3,'opico':3}
  };
  var WHEN = {
    desayuno:{'playa':3,'mansion':3,'montana':3,'soyapango':3,'zona-rosa':-9,'santa-elena':-9,'opico':-9,'aeropuerto':-9},
    comida:{'aeropuerto':-6},
    noche:{'santa-elena':2,'zona-rosa':2,'opico':2,'soyapango':1,'mansion':1,'playa':-1,'montana':-1,'aeropuerto':-6},
    vuelo:{'aeropuerto':30}
  };
  var form = document.querySelector('#finder-form');
  if (form){
    form.addEventListener('change', function(){
      var who = (form.querySelector('[name=who]:checked')||{}).value;
      var vibe = (form.querySelector('[name=vibe]:checked')||{}).value;
      var when = (form.querySelector('[name=when]:checked')||{}).value;
      if (!who || !vibe || !when) return;
      var scores = Object.keys(A).map(function(id){
        var s = 0;
        WHO[who].forEach(function(k){ s += (A[id][k]||0) * (k === 'tomar' ? .5 : 1); });
        s += (VIBE[vibe][id]||0) + (WHEN[when][id]||0);
        return {id:id, s:s};
      }).sort(function(a,b){ return b.s - a.s; }).slice(0,3);
      var out = document.querySelector('.finder__results'), grid = out.querySelector('.results-grid');
      grid.innerHTML = '';
      scores.forEach(function(r){
        var card = document.querySelector('.branch-grid [data-branch="'+r.id+'"]');
        if (card){ var c = card.cloneNode(true); c.removeAttribute('id'); grid.appendChild(c); }
      });
      paintStatus(grid);
      out.hidden = false;
      out.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block:'start'});
    });
  }
})();

/* ===== Motion layer: makes scrolling feel alive. Off when the visitor prefers reduced motion. ===== */
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('motion');
  var base = (document.querySelector('link[href$="tokens.css"]') || {}).getAttribute ? document.querySelector('link[href$="tokens.css"]').getAttribute('href').replace('assets/css/tokens.css','') : '';

  /* 1. Page-load sequence for the first screen (one orchestrated moment). */
  requestAnimationFrame(function(){ root.classList.add('is-loaded'); });

  /* 2. Reveal blocks as they enter the screen, staggered inside each group. */
  var sel = ['.section h2','.lead','.moment','.branch-grid .branch','.dishes figure','.faq details','.fact','.gallery img','.ev','.other','.menu__sec','.split > *','.legend > *','.group-title','.group-sub','.seasonal img','.b2b .wrap > *','.finder__q'];
  var items = [].slice.call(document.querySelectorAll(sel.join(',')));
  /* skip anything already inside another revealed block, so nothing animates twice */
  items = items.filter(function(el){ return !items.some(function(o){ return o !== el && o.contains(el); }); });
  items.forEach(function(el){
    el.classList.add('rv');
    var sibs = [].filter.call(el.parentNode.children, function(c){ return c.classList.contains('rv') || items.indexOf(c) > -1; });
    var k = Math.max(0, sibs.indexOf(el));
    el.style.setProperty('--rv-delay', Math.min(k, 8) * 70 + 'ms');
  });
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
  items.forEach(function(el){ io.observe(el); });
  /* cards cloned into finder results should appear at once */
  var results = document.querySelector('.results-grid');
  if (results) new MutationObserver(function(){
    [].forEach.call(results.children, function(c,k){ c.classList.remove('is-in'); c.style.setProperty('--rv-delay', k*90+'ms'); requestAnimationFrame(function(){ requestAnimationFrame(function(){ c.classList.add('is-in'); }); }); });
  }).observe(results, {childList:true});

  /* 3. The cadejo that walks beside you: a small running silhouette follows the scroll. */
  var runner = document.createElement('div');
  runner.className = 'runner'; runner.setAttribute('aria-hidden','true');
  runner.innerHTML = '<div class="runner__track"><div class="runner__trail"></div></div><img class="runner__dog" alt="" src="' + base + 'assets/images/illustrations/cadejo-dog-silhouette-01-white-cervezacadejo.com.webp">';
  document.body.appendChild(runner);
  var dog = runner.querySelector('.runner__dog'), trail = runner.querySelector('.runner__trail');

  /* 4. Scroll-linked effects in one animation frame loop. */
  var header = document.querySelector('.site-header');
  var heroImgs = [].slice.call(document.querySelectorAll('.hero__reel, .page-hero__img'));
  var para = [].slice.call(document.querySelectorAll('.dishes img'));
  var lastY = window.scrollY, ticking = false, runTimer;
  function frame(){
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = Math.max(1, document.documentElement.scrollHeight - vh);
    var p = Math.min(1, Math.max(0, y / max));
    /* runner position and visibility */
    var w = runner.clientWidth - dog.clientWidth;
    dog.style.transform = 'translateX(' + (p * w) + 'px)';
    trail.style.transform = 'scaleX(' + p + ')';
    runner.classList.toggle('is-on', y > vh * 0.6 && p < 0.995);
    /* header hides going down, returns going up */
    if (header){
      if (y > lastY + 6 && y > 220) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 220) header.classList.remove('is-hidden');
    }
    lastY = y;
    /* hero drifts slower than the page */
    heroImgs.forEach(function(el){ if (y < vh * 1.2) el.style.transform = 'translateY(' + (y * 0.28) + 'px)'; });
    /* photos move a little inside their frames */
    para.forEach(function(img){
      var r = img.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = 'scale(1.12) translateY(' + (c * -6) + '%)';
    });
  }
  window.addEventListener('scroll', function(){
    runner.classList.add('is-running'); clearTimeout(runTimer);
    runTimer = setTimeout(function(){ runner.classList.remove('is-running'); }, 180);
    if (!ticking){ ticking = true; requestAnimationFrame(frame); }
  }, {passive:true});
  window.addEventListener('resize', frame);
  frame();

  /* 5. Beers drift sideways on their own; any touch, hover or focus hands control back. */
  var strip = document.querySelector('.beers');
  if (strip){
    var orig = [].slice.call(strip.children);
    orig.forEach(function(n){ var c = n.cloneNode(true); c.setAttribute('aria-hidden','true'); c.querySelectorAll('a,button').forEach(function(a){ a.tabIndex = -1; }); strip.appendChild(c); });
    strip.classList.add('is-auto');
    var paused = false, visible = false, resume;
    var pause = function(){ paused = true; clearTimeout(resume); };
    var later = function(){ clearTimeout(resume); resume = setTimeout(function(){ paused = false; }, 2500); };
    ['mouseenter','touchstart','focusin','wheel','pointerdown'].forEach(function(ev){ strip.addEventListener(ev, pause, {passive:true}); });
    ['mouseleave','touchend','focusout'].forEach(function(ev){ strip.addEventListener(ev, later, {passive:true}); });
    new IntersectionObserver(function(e){ visible = e[0].isIntersecting; }).observe(strip);
    var pos = 0;
    (function drift(){
      if (visible && !paused){
        var half = strip.scrollWidth / 2;
        pos = strip.scrollLeft + 0.5;
        if (pos >= half) pos -= half;
        strip.scrollLeft = pos;
      }
      requestAnimationFrame(drift);
    })();
  }

  /* 6. Finder chips give a small bounce when picked. */
  [].forEach.call(document.querySelectorAll('.chip input'), function(inp){
    inp.addEventListener('change', function(){ var s = inp.nextElementSibling; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); });
  });
})();
