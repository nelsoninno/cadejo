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
