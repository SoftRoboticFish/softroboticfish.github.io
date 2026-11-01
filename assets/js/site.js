document.documentElement.classList.add('js-enhanced');

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Animated Fish Wave (Hero Canvas, DPI-aware) ---- */
  (function () {
    var canvas = document.getElementById('waveCanvas');
    if (!canvas || prefersReducedMotion) return;
    var ctx = canvas.getContext('2d');
    var t = 0;
    var raf;
    var cw = 0, ch = 0;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = canvas.offsetWidth;
      ch = canvas.offsetHeight;
      canvas.width  = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var waves = [
      { c1: 0.20, c2: 0.50, k: 5.0, omega: 4.0 * Math.PI, color: '#0D9488', alpha: 0.75, dt: 0.009 },
      { c1: 0.15, c2: 0.38, k: 4.2, omega: 3.2 * Math.PI, color: '#22D3EE', alpha: 0.35, dt: 0.007 },
      { c1: 0.28, c2: 0.60, k: 6.0, omega: 4.8 * Math.PI, color: '#A7F3D0', alpha: 0.20, dt: 0.011 },
    ];
    var times = [0, 0.4, 0.9];

    function draw() {
      var W = cw, H = ch;
      ctx.clearRect(0, 0, W, H);

      waves.forEach(function (w, i) {
        ctx.beginPath();
        var midY = H * 0.5;
        var scale = H * 0.21;
        for (var px = 0; px <= W; px += 2) {
          var x = px / W;
          var env = w.c1 * x + w.c2 * x * x;
          var y = env * Math.sin(w.omega * (t + times[i]) - w.k * x * 3.0);
          var sy = midY + y * scale;
          if (px === 0) ctx.moveTo(px, sy); else ctx.lineTo(px, sy);
        }
        ctx.strokeStyle = w.color;
        ctx.globalAlpha = w.alpha;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      t += waves[0].dt;
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();

    // Pause animation when hero is off-screen (performance)
    if ('IntersectionObserver' in window) {
      var heroObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          if (!raf) raf = requestAnimationFrame(draw);
        } else {
          cancelAnimationFrame(raf); raf = null;
        }
      });
      heroObs.observe(canvas);
    }
  }());


  /* ---- Mobile Nav Toggle ---- */
  (function () {
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    function closeMenu() {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    document.addEventListener('click', function (e) {
      if (!links.classList.contains('open')) return;
      if (!links.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 800) closeMenu();
    });
  }());


  /* ---- Active Nav + Scroll Progress + Back-to-Top ---- */
  (function () {
    var links = document.querySelectorAll('.nav-links a[href^="#"]');
    var progressBar = document.getElementById('scrollProgressBar');
    var backToTop = document.getElementById('backToTop');

    function setActive(id) {
      links.forEach(function (l) {
        var isActive = l.getAttribute('href') === '#' + id;
        l.classList.toggle('active', isActive);
        if (isActive) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
    }

    // Snappy feedback on click
    links.forEach(function (l) {
      l.addEventListener('click', function () {
        setActive(l.getAttribute('href').slice(1));
      });
    });

    // Observe sections crossing the middle band of the viewport
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      document.querySelectorAll('section[id], header[id]').forEach(function (s) { obs.observe(s); });
    }

    // Scroll progress + back-to-top visibility (rAF-throttled)
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var y = window.scrollY || document.documentElement.scrollTop;
        if (progressBar) {
          progressBar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
        }
        if (backToTop) backToTop.classList.toggle('show', y > 600);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    if (backToTop) {
      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    }
  }());


  /* ---- Keyboard Shortcuts (press 1–7 to jump to a section) ---- */
  (function () {
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.getElementById('workflowDialog')?.open) return;
      var link = document.querySelector('.nav-links a[data-shortcut="' + e.key + '"]');
      if (link) {
        e.preventDefault();
        window.location.hash = link.getAttribute('href');
      }
    });
  }());


  /* ---- Scroll Reveal (with stagger) ---- */
  (function () {
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
      });
    });

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
  }());


  /* ---- Toast ---- */
  var toastTimer;
  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }



  /* ---- Copy the visible BibTeX, without maintaining duplicate citation strings ---- */
  document.querySelectorAll('[data-copy-bibtex]').forEach(function (button) {
    button.addEventListener('click', function () {
      var which = button.getAttribute('data-copy-bibtex');
      var entry = document.querySelector('#bib-' + which + ' pre');
      if (!entry) return;
      var value = entry.textContent.trim();
      function feedback() {
        document.querySelectorAll('[data-copy-bibtex="' + which + '"]').forEach(function (btn) {
          var old = btn.textContent;
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          setTimeout(function () { btn.textContent = old; btn.classList.remove('copied'); }, 2200);
        });
        showToast('BibTeX copied to clipboard');
      }
      function legacyCopy() {
        var ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.className = 'clipboard-fallback';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { /* unsupported */ }
        ta.remove();
        if (ok) feedback();
        else showToast('Copy unavailable in this browser. Select the BibTeX text manually.');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(feedback, legacyCopy);
      } else legacyCopy();
    });
  });

  /* ---- Accessible 12-stage image viewer ---- */
  (function () {
    var opener = document.getElementById('openWorkflow');
    var modal = document.getElementById('workflowDialog');
    var closer = document.getElementById('closeWorkflow');
    if (!opener || !modal || !closer || typeof modal.showModal !== 'function') return;
    opener.addEventListener('click', function (event) {
      event.preventDefault();
      modal.showModal();
      document.documentElement.classList.add('dialog-open');
      closer.focus();
    });
    closer.addEventListener('click', function () { modal.close(); });
    modal.addEventListener('click', function (event) {
      if (event.target === modal) modal.close();
    });
    modal.addEventListener('close', function () {
      document.documentElement.classList.remove('dialog-open');
      opener.focus({preventScroll:true});
    });
    // The native <dialog> element handles Escape and focus management.
  }());
