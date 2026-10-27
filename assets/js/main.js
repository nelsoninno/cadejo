/* assets/js/main.js: header, hero reel, experience finder, open/closed status. */
(function(){
  var lang = document.documentElement.lang === 'es' ? 'es' : 'en';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header turns solid after the hero starts scrolling */
  var header = document.querySelector('.site-header');
  function onScroll(){ header.classList.toggle('is-solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* Intro video: respects reduced motion (shows the still frame instead). */
  var vid = document.querySelector('.hero__video');
  if (vid && reduce){ vid.removeAttribute('autoplay'); vid.pause(); }

  /* Adaptive quality, like streaming apps: everyone starts with the light version so the page opens fast.
     On a fast connection and a big or sharp screen, a higher quality version loads quietly and swaps in. */
  var assetBase = (document.querySelector('link[href$="tokens.css"]').getAttribute('href') || '').replace('assets/css/tokens.css','');
  function speedOK(){
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c){
      if (c.saveData) return false;
      if (c.effectiveType && c.effectiveType !== '4g') return false;
      if (c.downlink) return c.downlink >= 5;
    }
    /* no network info (Safari, iPhone): measure how fast this page's own files arrived */
    var bytes = 0, ms = 0;
    (performance.getEntriesByType ? performance.getEntriesByType('resource') : []).forEach(function(e){
      if (e.transferSize > 20000 && e.duration > 0){ bytes += e.transferSize; ms += e.duration; }
    });
    return ms > 0 && bytes / ms > 900; /* about 7 Mbps or more */
  }
  var px = window.innerWidth * (window.devicePixelRatio || 1);
  function upgradeVideo(){
    var v = document.querySelector('.hero__video');
    if (!v || reduce || !speedOK()) return;
    var file = px >= 1600 ? 'cadejo-intro-hd-cervezacadejo.com.mp4' : (px >= 900 ? 'cadejo-intro-cervezacadejo.com.mp4' : null);
    if (!file || (v.currentSrc || '').indexOf(file) > -1) return;
    var hd = document.createElement('video');
    hd.className = 'hero__video hero__video--next'; hd.muted = true; hd.loop = true; hd.playsInline = true; hd.setAttribute('playsinline',''); hd.setAttribute('muted','');
    hd.preload = 'auto'; hd.src = assetBase + 'assets/video/' + file;
    if (px >= 1600) v.poster = assetBase + 'assets/video/cadejo-intro-poster-hd-cervezacadejo.com.webp';
    hd.addEventListener('canplaythrough', function once(){
      hd.removeEventListener('canplaythrough', once);
      try { hd.currentTime = v.currentTime % (hd.duration || 1e9); } catch(e) {}
      var pr = hd.play(); if (pr && pr.catch) pr.catch(function(){});
      hd.classList.add('is-on');
      setTimeout(function(){ if (v.parentNode) v.parentNode.removeChild(v); }, 900);
    });
    v.parentNode.appendChild(hd);
  }
  function upgradeFinder(){
    var f = document.querySelector('.finder');
    if (!f || !speedOK()) return;
    var name = px >= 1500 ? 'hd-' : (px >= 700 ? '' : null);
    if (name === null || (name === '' && window.innerWidth > 760)) return; /* desktop already has the standard one */
    var url = assetBase + 'assets/images/branches/montana-huizucar/cadejo-montana-huizucar-terrace-breakfast-' + name + 'cervezacadejo.com.webp';
    new IntersectionObserver(function(en, obs){
      if (!en[0].isIntersecting) return; obs.disconnect();
      var im = new Image(); im.onload = function(){ f.style.backgroundImage = 'url("' + url + '")'; }; im.src = url;
    }, {rootMargin:'600px 0px'}).observe(f);
  }
  window.addEventListener('load', function(){ setTimeout(function(){ upgradeVideo(); upgradeFinder(); }, 1200); });

  /* Hero reel (photo fallback, only if a page still uses images). */
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

  /* Opening hours, America/El_Salvador. Hours from Cadejo's branch texts (Oct 21, 2026).
     Each day: [open, close] in minutes from midnight; close may pass 24:00. */
  var H = {
    'playa': {0:[540,1140],1:[660,1200],2:[660,1200],3:[660,1200],4:[660,1200],5:[660,1380],6:[540,1380]},
    'mansion': {0:[420,1260],1:[660,1380],2:[660,1380],3:[660,1380],4:[660,1380],5:[660,1440],6:[420,1440]},
    'montana': {0:[420,1260],1:[660,1380],2:[660,1380],3:[660,1380],4:[660,1380],5:[660,1440],6:[420,1440]},
    'zona-rosa': {0:[660,1260],1:[660,1380],2:[660,1380],3:[660,1380],4:[660,1380],5:[660,1500],6:[660,1500]},
    'aeropuerto': {0:[300,1260],1:[300,1260],2:[300,1260],3:[300,1260],4:[300,1260],5:[300,1260],6:[300,1260]},
    'santa-elena': {0:[660,1260],1:[660,1380],2:[660,1380],3:[660,1380],4:[660,1380],5:[660,1500],6:[660,1500]},
    'soyapango': {0:[420,1260],1:[660,1380],2:[660,1380],3:[660,1380],4:[660,1380],5:[660,1500],6:[420,1500]},
    'opico': {0:[660,1260],1:[660,1440],2:[660,1440],3:[660,1440],4:[660,1440],5:[660,1500],6:[660,1500]},
    'guatemala': {0:[720,1200],1:[720,1320],2:[720,1440],3:[720,1440],4:[720,1500],5:[720,1500],6:[720,1500]}
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
    min = min % 1440; if (min === 0) return lang === 'es' ? 'medianoche' : 'midnight';
    var h = Math.floor(min/60), m = min % 60;
    var ap = h >= 12 ? 'p.m.' : 'a.m.'; var h12 = h % 12 || 12;
    return h12 + (m ? ':' + (m<10?'0':'') + m : '') + ' ' + ap;
  }
  function cl(min){ return (min % 1440 === 0 && lang === 'es') ? 'cierra a medianoche' : T.closes + ' ' + fmt(min); }
  function status(id){
    var s = H[id]; if (!s) return {cls:'', text:T.tbc};
    var n = svNow(), today = s[n.d], prev = s[(n.d+6)%7];
    if (prev && prev[1] > 1440 && n.m < prev[1]-1440) return {cls:'is-open', text:T.open + ', ' + cl(prev[1])};
    if (today && n.m >= today[0] && n.m < today[1]) return {cls:'is-open', text:T.open + ', ' + cl(today[1])};
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
    'mansion':    {turistas:3,familias:1,amigos:1,celebraciones:1,empresas:1,parejas:1,conocer:2,mascotas:2},
    'montana':    {familias:3,empresas:3,celebraciones:3,amigos:1,parejas:1,turistas:1,conocer:1,mascotas:8},
    'zona-rosa':  {turistas:3,amigos:3,experiencias:1,celebraciones:1,tomar:1,parejas:1},
    'santa-elena':{experiencias:3,amigos:3,tomar:1},
    'opico':      {amigos:3,tomar:3,experiencias:1},
    'soyapango':  {amigos:3,familias:3,tomar:1,experiencias:1,celebraciones:1},
    'aeropuerto': {turistas:1}
  };
  var WHO = {perro:['mascotas'], familia:['familias'], pareja:['parejas'], amigos:['amigos','tomar'], equipo:['empresas'], celebracion:['celebraciones'], visita:['turistas','conocer']};
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
    /* one question at a time: answering one brings in the next */
    var qs = [].slice.call(form.querySelectorAll('.finder__q'));
    qs.forEach(function(q, k){ if (k > 0) q.classList.add('is-waiting'); });
    form.addEventListener('change', function(e){
      var q = e.target.closest('.finder__q'), k = qs.indexOf(q);
      if (q) q.classList.add('is-done');
      var nx = qs[k + 1];
      if (nx && nx.classList.contains('is-waiting')){
        nx.classList.remove('is-waiting');
        if (!reduce){ nx.classList.add('is-arriving', 'is-in'); }
        var r = nx.getBoundingClientRect(), room = window.innerHeight - 24;
        if (r.bottom > room) window.scrollBy({top: r.bottom - room, behavior: reduce ? 'auto' : 'smooth'});
        var first = nx.querySelector('input'); if (first) first.focus({preventScroll:true});
      }
    });
    /* button hint: an outline walks across the answers of the current question as you scroll,
       so people see they are buttons. Stops once that question is answered. */
    var hintOn = null;
    function hint(){
      var q = qs.filter(function(x){ return !x.classList.contains('is-waiting') && !x.querySelector('input:checked'); })[0];
      var spans = q ? [].slice.call(q.querySelectorAll('.chip span')) : [];
      var target = null;
      if (spans.length){
        var r = q.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom > 0 && r.top < vh){
          var p = Math.min(0.999, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.62)));
          target = spans[Math.floor(p * spans.length)];
        }
      }
      if (target !== hintOn){
        if (hintOn) hintOn.classList.remove('is-hint');
        if (target) target.classList.add('is-hint');
        hintOn = target;
      }
    }
    var hintQueued = false;
    window.addEventListener('scroll', function(){ if (!hintQueued){ hintQueued = true; requestAnimationFrame(function(){ hintQueued = false; hint(); }); } }, {passive:true});
    window.addEventListener('resize', hint);
    form.addEventListener('change', function(){ setTimeout(hint, 650); });
    hint();
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

  /* Menu tabs: one menu at a time (main, breakfast, lunch...). Without JS every menu shows. */
  [].forEach.call(document.querySelectorAll('.menu-tabs'), function(bar){
    var btns = [].slice.call(bar.querySelectorAll('button'));
    var books = btns.map(function(b){ return document.getElementById(b.dataset.target); });
    function pick(n){
      btns.forEach(function(b, k){ b.setAttribute('aria-selected', k === n ? 'true' : 'false'); });
      books.forEach(function(el, k){ if (el) el.hidden = k !== n; });
    }
    btns.forEach(function(b, k){ b.addEventListener('click', function(){ pick(k); }); });
    bar.hidden = false; bar.parentNode.classList.add('has-tabs'); pick(0);
  });
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
  var sel = ['.section h2','.lead','.moment','.branch-grid .branch','.faq details','.fact','.gallery img','.ev','.other','.menu__sec','.split > *','.legend > *','.group-title','.group-sub','.seasonal img','.b2b .wrap > *','.finder__q'];
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

  /* 3. Teeter: every running cadejo rocks side to side while the page moves,
     like PowerPoint's Teeter. Each one keeps its own position (tx) and we add the rocking on top. */
  var tee = (function(){
    var list = [], amp = 0, target = 0, stop;
    window.addEventListener('scroll', function(){
      target = 1; clearTimeout(stop);
      stop = setTimeout(function(){ target = 0; }, 240);
    }, {passive:true});
    function loop(t){
      amp += (target - amp) * (target > amp ? 0.22 : 0.07);
      var still = amp < 0.003;
      list.forEach(function(o){
        if (still && !o.dirty && o.rest) return;
        var r = still ? 0 : o.deg * amp * Math.sin(t / 1000 * Math.PI * 2 * 2.3 + o.ph);
        o.el.style.transform = o.tx + ' rotate(' + r.toFixed(2) + 'deg)' + (o.flip ? ' scaleX(-1)' : '');
        o.dirty = false; o.rest = still;
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return function(el, tx, flip, deg){
      var o = el._tee;
      if (!o){ o = el._tee = {el:el, deg:deg || 7, ph:Math.random() * 6}; list.push(o); }
      o.tx = tx; o.flip = flip; o.dirty = true;
    };
  })();
  window.cadejoTeeter = tee;

  /* 4. The cadejo that walks beside you: a small running cadejo follows the scroll. */
  var runner = document.createElement('div');
  runner.className = 'runner'; runner.setAttribute('aria-hidden','true');
  runner.innerHTML = '<div class="runner__track"><div class="runner__trail"></div></div><span class="runner__dog"></span>'; /* a 4-frame run cycle drawn by CSS, so no teeter here */
  document.body.appendChild(runner);
  var dog = runner.querySelector('.runner__dog'), trail = runner.querySelector('.runner__trail');

  /* 5. Scroll-linked effects in one animation frame loop. */
  var header = document.querySelector('.site-header');
  var heroImgs = [].slice.call(document.querySelectorAll('.hero__reel, .page-hero__img'));
  var lastY = window.scrollY, ticking = false, runTimer;
  function frame(){
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = Math.max(1, document.documentElement.scrollHeight - vh);
    var p = Math.min(1, Math.max(0, y / max));
    var w = runner.clientWidth - dog.clientWidth;
    dog.style.transform = 'translate3d(' + (p * w).toFixed(1) + 'px,0,0)';
    trail.style.transform = 'scaleX(' + p + ')';
    runner.classList.toggle('is-on', y > vh * 0.6 && p < 0.995);
    if (header){
      if (y > lastY + 6 && y > 220) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 220) header.classList.remove('is-hidden');
    }
    lastY = y;
    heroImgs.forEach(function(el){ if (y < vh * 1.2) el.style.transform = 'translateY(' + (y * 0.28) + 'px)'; });
  }
  window.addEventListener('scroll', function(){
    runner.classList.add('is-running'); clearTimeout(runTimer);
    runTimer = setTimeout(function(){ runner.classList.remove('is-running'); }, 180);
    if (!ticking){ ticking = true; requestAnimationFrame(frame); }
  }, {passive:true});
  window.addEventListener('resize', frame);
  frame();

  /* 6. Endless carousels (beers and food). They run edge to edge, drift on their own,
     can be dragged or flicked with mouse or finger (with momentum), and rush a little
     when the page scrolls. */
  var strips = [].slice.call(document.querySelectorAll('.marquee'));
  var pageV = 0, pageT = 0, prevY = window.scrollY;
  window.addEventListener('scroll', function(){
    var y = window.scrollY; pageT = Math.min(7, Math.abs(y - prevY) * 0.08); prevY = y;
  }, {passive:true});
  /* hover comes from where the mouse really is, checked every frame, so scrolling can never flip it */
  var mouse = {x:0, y:0, on:false};
  document.addEventListener('pointermove', function(e){ if (e.pointerType === 'mouse'){ mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; } }, {passive:true});
  document.addEventListener('mouseout', function(e){ if (!e.relatedTarget) mouse.on = false; });
  window.addEventListener('blur', function(){ mouse.on = false; });
  var M = strips.map(function(el){
    var track = el.querySelector('.marquee__track');
    var orig = [].slice.call(track.children);
    var o = {el:el, track:track, orig:orig, dir:+(el.dataset.dir || -1), base:+(el.dataset.speed || .5),
             hoverK:el.dataset.hover !== undefined ? +el.dataset.hover : .25, boost:el.dataset.boost !== undefined ? +el.dataset.boost : 1, x:0, v:0, W:0, hover:false, vis:false, drag:null, moved:0};
    o.v = o.dir * o.base;
    [].forEach.call(el.querySelectorAll('img'), function(im){ im.draggable = false; });
    function build(){
      [].slice.call(track.querySelectorAll('[data-clone]')).forEach(function(n){ track.removeChild(n); });
      var setW = track.scrollWidth, sets = Math.max(2, Math.ceil(window.innerWidth / Math.max(1, setW)) + 2);
      for (var k = 1; k < sets; k++) orig.forEach(function(n){
        var c = n.cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true');
        [].forEach.call(c.querySelectorAll('a,button,[tabindex]'), function(a){ a.tabIndex = -1; });
        [].forEach.call(c.querySelectorAll('img'), function(im){ im.draggable = false; });
        track.appendChild(c);
      });
      var firstClone = track.querySelector('[data-clone]');
      o.W = firstClone ? firstClone.offsetLeft - orig[0].offsetLeft : setW;
      if (o.W > 0) o.x = ((o.x % o.W) - o.W) % o.W;
    }
    o.build = build;
    build();
    el.classList.add('is-live');
    el.scrollLeft = 0;
    el.addEventListener('scroll', function(){ el.scrollLeft = 0; }); /* focus must not shift the strip */
    /* sizes are fixed in the markup, so the strip is built once and never rebuilt while scrolling.
       Load every photo in it a little before it reaches the screen, so nothing pops in. */
    new IntersectionObserver(function(en, obs){
      if (!en[0].isIntersecting) return;
      [].forEach.call(el.querySelectorAll('img[loading="lazy"]'), function(im){ im.loading = 'eager'; });
      obs.disconnect();
    }, {rootMargin:'600px 0px'}).observe(el);

    el.addEventListener('pointerdown', function(e){
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      o.drag = {id:e.pointerId, x0:e.clientX, y0:e.clientY, xs:o.x, lx:e.clientX, lt:performance.now(), vel:0, axis:null};
      o.moved = 0;
    });
    el.addEventListener('pointermove', function(e){
      var d = o.drag; if (!d || e.pointerId !== d.id) return;
      var dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (!d.axis){
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        d.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        if (d.axis === 'y'){ o.drag = null; return; }
        try { el.setPointerCapture(d.id); } catch (err) {}
        el.classList.add('is-dragging');
      }
      var now = performance.now(), dt = Math.max(1, now - d.lt);
      d.vel = d.vel * 0.5 + ((e.clientX - d.lx) / dt * 16.67) * 0.5;
      d.lx = e.clientX; d.lt = now;
      o.x = d.xs + dx; o.moved = Math.abs(dx);
    });
    function release(e){
      var d = o.drag; if (!d || (e && e.pointerId !== d.id)) return;
      if (d.axis === 'x'){
        if (performance.now() - d.lt > 90) d.vel = 0; /* held still before letting go */
        o.v = Math.max(-70, Math.min(70, d.vel * 1.6));
      }
      o.drag = null; el.classList.remove('is-dragging');
    }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
    /* a drag is not a click */
    el.addEventListener('click', function(e){ if (o.moved > 6){ e.preventDefault(); e.stopPropagation(); } }, true);
    /* trackpads and shift + wheel move it sideways; normal wheel still scrolls the page */
    el.addEventListener('wheel', function(e){
      /* only a clearly sideways gesture (trackpad swipe or shift + wheel) moves the strip */
      var dx = (Math.abs(e.deltaX) > 4 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 2) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (!dx) return;
      o.x -= dx; o.v = o.dir * o.base * o.hoverK;
    }, {passive:true}); /* passive so page scrolling over the strip never waits on this */
    el.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ o.v = -26; e.preventDefault(); }
      if (e.key === 'ArrowLeft'){ o.v = 26; e.preventDefault(); }
    });
    new IntersectionObserver(function(en){ o.vis = en[0].isIntersecting; }, {rootMargin:'100px 0px'}).observe(el);
    return o;
  });
  if (M.length){
    var last = performance.now(), rz;
    var lastW = window.innerWidth;
    /* only a real width change rebuilds (phones fire resize when the address bar hides on scroll) */
    window.addEventListener('resize', function(){
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(rz); rz = setTimeout(function(){ M.forEach(function(o){ o.build(); }); }, 200);
    });
    (function loop(t){
      var f = Math.min(3, (t - last) / 16.67); last = t;
      M.forEach(function(o){
        if (!o.vis) return;
        if (mouse.on){ var r = o.el.getBoundingClientRect(); o.hover = mouse.x >= r.left && mouse.x <= r.right && mouse.y >= r.top && mouse.y <= r.bottom; }
        else o.hover = false;
        if (!o.drag){
          var target = o.dir * (o.base * (o.hover ? o.hoverK : 1) + pageV * o.boost);
          var k = Math.abs(o.v) > Math.abs(target) + 2 ? 0.035 : 0.08; /* a flick glides, then settles back */
          o.v += (target - o.v) * Math.min(1, k * f);
          o.x += Math.max(-40, Math.min(40, o.v * f));
        }
        if (o.W > 0){ while (o.x <= -o.W) { o.x += o.W; if (o.drag) o.drag.xs += o.W; } while (o.x > 0) { o.x -= o.W; if (o.drag) o.drag.xs -= o.W; } }
        o.track.style.transform = 'translate3d(' + o.x.toFixed(2) + 'px,0,0)';
      });
      pageV += (pageT - pageV) * Math.min(1, 0.12 * f);
      pageT *= Math.pow(0.88, f);
      requestAnimationFrame(loop);
    })(last);
  }

  /* 7. Finder chips give a small bounce when picked. */
  [].forEach.call(document.querySelectorAll('.chip input'), function(inp){
    inp.addEventListener('change', function(){ var s = inp.nextElementSibling; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); });
  });
})();

/* ===== Beer and legend layer: a pint that fills as you scroll, beer rising in the beer section,
   and the two cadejos of the legend (one white, one black) running through the page. ===== */
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var vh = function(){ return window.innerHeight; };
  var tee = window.cadejoTeeter;
  function base0(){ return document.querySelector('link[href$="tokens.css"]').getAttribute('href').replace('assets/css/tokens.css',''); }

  /* 1. The pint: fixed bottom right, fills with beer as you go down the page. */
  var pint = document.createElement('div');
  pint.className = 'pint'; pint.setAttribute('aria-hidden','true');
  var ill = base0() + 'assets/images/illustrations/pint-16oz-';
  pint.innerHTML = '<img class="pint__empty" alt="" src="' + ill + 'empty-cervezacadejo.com.webp">' +
    '<div class="pint__liquid"><img alt="" src="' + ill + 'full-cervezacadejo.com.webp"></div>' +
    '<div class="pint__foam" style="background-image:url(' + ill + 'foam-cervezacadejo.com.webp)"></div>' +
    '<img class="pint__logo" alt="" src="' + ill + 'logo-cervezacadejo.com.webp">';
  /* glass outline (left and right edge, % of width, every 4 of 260 rows) so the foam follows the glass shape */
  var EDGE = [[48.4, 67.0], [9.9, 89.0], [1.1, 98.9], [0.0, 100.0], [0.0, 100.0], [0.0, 100.0], [0.0, 100.0], [0.0, 100.0], [0.0, 100.0], [0.0, 100.0], [1.1, 100.0], [1.1, 100.0], [1.1, 98.9], [1.1, 98.9], [2.2, 98.9], [2.2, 98.9], [2.2, 97.8], [3.3, 97.8], [3.3, 97.8], [4.4, 96.7], [4.4, 96.7], [5.5, 95.6], [5.5, 95.6], [6.6, 94.5], [7.7, 93.4], [7.7, 93.4], [8.8, 92.3], [9.9, 91.2], [11.0, 91.2], [12.1, 90.1], [12.1, 89.0], [13.2, 87.9], [14.3, 87.9], [15.4, 86.8], [16.5, 85.7], [16.5, 85.7], [17.6, 84.6], [18.7, 83.5], [18.7, 83.5], [19.8, 82.4], [20.9, 82.4], [20.9, 81.3], [20.9, 81.3], [22.0, 81.3], [22.0, 81.3], [22.0, 81.3], [22.0, 81.3], [22.0, 81.3], [22.0, 81.3], [22.0, 82.4], [20.9, 82.4], [20.9, 83.5], [19.8, 84.6], [18.7, 85.7], [17.6, 86.8], [16.5, 87.9], [15.4, 90.1], [13.2, 91.2], [11.0, 93.4], [8.8, 94.5], [6.6, 96.7], [6.6, 96.7], [8.8, 94.5], [13.2, 91.2], [23.1, 82.4]];
  function edgeAt(f){ var k = Math.max(0, Math.min(EDGE.length - 1, Math.round(f * (EDGE.length - 1)))); return EDGE[k]; }
  document.body.appendChild(pint);
  var beer = pint.querySelector('.pint__liquid'), foam = pint.querySelector('.pint__foam');

  /* 2. Beer rising in the beer section, with the foam riding on top of it. */
  var beersSec = document.getElementById('beers') || document.getElementById('cervezas');
  var fill;
  if (beersSec){
    beersSec.classList.add('has-fill');
    /* real beer video rising behind the beers; the foam on top gets a wavy, moving edge (CSS mask) */
    fill = document.createElement('div'); fill.className = 'beer-fill'; fill.setAttribute('aria-hidden','true');
    var vbase = base0() + 'assets/video/';
    fill.innerHTML = '<video class="beer-fill__video" muted loop playsinline preload="none" poster="' + vbase + 'beer-background-poster-cervezacadejo.com.webp">' +
      '<source src="' + vbase + 'beer-background-sm-cervezacadejo.com.mp4" type="video/mp4" media="(max-width: 760px)">' +
      '<source src="' + vbase + 'beer-background-cervezacadejo.com.mp4" type="video/mp4"></video>';
    var bv = fill.querySelector('video');
    new IntersectionObserver(function(en){
      if (en[0].isIntersecting){ bv.preload = 'auto'; var pr = bv.play(); if (pr && pr.catch) pr.catch(function(){}); }
      else bv.pause();
    }, {rootMargin:'200px 0px'}).observe(beersSec);
    beersSec.insertBefore(fill, beersSec.firstChild);
  }

  /* 3. Big gray cadejos running across sections, tied to scroll. */
  var base = document.querySelector('link[href$="tokens.css"]').getAttribute('href').replace('assets/css/tokens.css','');
  var runners = [];
  var moments = document.querySelector('.moments');
  var risers = [];
  if (moments){
    /* two cadejos rise from the bottom corners as the section comes in, looking toward the middle */
    var sec = moments.closest('section'); sec.classList.add('has-risers');
    ['left','right'].forEach(function(side){
      var im = document.createElement('img'); im.className = 'riser riser--' + side; im.alt = ''; im.setAttribute('aria-hidden','true');
      im.src = base + 'assets/images/illustrations/cadejo-howling-dark-cervezacadejo.com.svg';
      sec.insertBefore(im, sec.firstChild);
      risers.push({el:im, sec:sec, side:side});
    });
  }
  [].forEach.call(document.querySelectorAll('.legend-pair'), function(pair){
    var sec = pair.parentNode;
    runners.push({el:pair.querySelector('.legend-pair__white'), sec:sec, from:-50, to:105, flip:true, deg:7});
    runners.push({el:pair.querySelector('.legend-pair__black'), sec:sec, from:110, to:-55, flip:false, deg:7});
  });

  var pillars = [].slice.call(document.querySelectorAll('.legend-pillar'));
  var moving;
  function frame(){
    var y = window.scrollY, h = vh();
    var max = Math.max(1, document.documentElement.scrollHeight - h);
    var p = Math.min(1, Math.max(0, y / max));
    /* the real 16 oz Cadejo glass fills from the bottom; a foam band rides on top until the glass is full */
    beer.style.height = (p * 100).toFixed(2) + '%';
    var ph = pint.clientHeight || 1, band = ph * 0.1;
    var bottom = (1 - p) * ph + ph * 0.02, top = Math.max(ph * 0.03, bottom - band);
    var et = edgeAt(top / ph), eb = edgeAt(Math.min(1, bottom / ph));
    foam.style.top = top.toFixed(1) + 'px'; foam.style.height = (bottom - top).toFixed(1) + 'px';
    foam.style.clipPath = 'polygon(' + et[0] + '% 0,' + et[1] + '% 0,' + eb[1] + '% 100%,' + eb[0] + '% 100%)';
    foam.style.opacity = (p > 0.03 && p < 0.87) ? '1' : '0';
    pint.classList.toggle('is-on', y > h * 0.4);
    pint.classList.toggle('is-full', p > 0.985);
    if (fill){
      var r = beersSec.getBoundingClientRect();
      var prog = Math.min(1, Math.max(0, (h - r.top) / (h * 0.9 + r.height * 0.35)));
      var q = 1 - prog;
      fill.style.transform = 'translate3d(0,calc(' + (q * 100).toFixed(2) + '% + ' + (q * 60).toFixed(1) + 'px),0)';
    }
    risers.forEach(function(o){
      var r = o.sec.getBoundingClientRect();
      var k = Math.min(1, Math.max(0, (h - r.top) / h));
      var e = k * k * (3 - 2 * k);
      var x = (1 - e) * 30 * (o.side === 'left' ? -1 : 1);
      o.el.style.transform = 'translate3d(' + x.toFixed(1) + '%,' + ((1 - e) * 75).toFixed(1) + '%,0)' + (o.side === 'left' ? ' scaleX(-1)' : '');
      o.el.style.opacity = e.toFixed(2);
    });
    /* legend pillars: start low and rise to their place as the section comes up the screen.
       They never go above their box, so the cadejos on top are never cut; the bottom is cut by the section. */
    pillars.forEach(function(box){
      var img = box.firstChild, rb = box.getBoundingClientRect();
      var rise = Math.min(rb.height * 0.45, img.offsetHeight * 0.5);
      var kp = Math.min(1, Math.max(0, (h - rb.top) / (h * 0.8)));
      kp = 1 - Math.pow(1 - kp, 2);
      img.style.transform = 'translate3d(0,' + (rise * (1 - kp)).toFixed(1) + 'px,0)';
    });
    runners.forEach(function(o){
      var r = o.sec.getBoundingClientRect();
      var k = Math.min(1, Math.max(0, (h - r.top) / (h + r.height)));
      tee(o.el, 'translateX(' + (o.from + (o.to - o.from) * k) + 'vw)', o.flip, o.deg);
    });
  }
  var queued = false;
  window.addEventListener('scroll', function(){
    document.documentElement.classList.add('is-scrolling'); clearTimeout(moving);
    moving = setTimeout(function(){ document.documentElement.classList.remove('is-scrolling'); }, 200);
    if (!queued){ queued = true; requestAnimationFrame(function(){ queued = false; frame(); }); }
  }, {passive:true});
  window.addEventListener('resize', frame);
  frame();
})();
