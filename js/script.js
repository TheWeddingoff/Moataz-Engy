/* ===== Wedding Site Vanilla JS ===== */
(function () {
  'use strict';

  // ============= Preloader =============
  window.addEventListener('load', function () {
    setTimeout(function () {
      var pre = document.getElementById('preloader');
      if (!pre) return;
      pre.classList.add('fade');
      setTimeout(function () { pre.style.display = 'none'; }, 900);
    }, 2400);
  });

  // ============= Reveal animations =============
  function setupReveals() {
    // Hero text reveal w/ data-delay (ms)
    document.querySelectorAll('.reveal').forEach(function (el) {
      var delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(function () { el.classList.add('shown'); }, delay);
    });

    // Generic fade-in-up via IntersectionObserver
    var fadeEls = Array.prototype.slice.call(document.querySelectorAll('.fade-in-up'));
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.01, rootMargin: '0px 0px 0px 0px' });
      fadeEls.forEach(function (el) { io.observe(el); });

      // Safety net for iOS/Safari edge cases where observer events can be missed.
      setTimeout(function () {
        fadeEls.forEach(function (el) { el.classList.add('in-view'); });
      }, 1600);
    } else {
      fadeEls.forEach(function (el) { el.classList.add('in-view'); });
    }
  }
  setupReveals();

  // ============= Scroll progress bar =============
  var progressEl = document.getElementById('scroll-progress');
  function updateScrollProgress() {
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight) || 1;
    var p = Math.max(0, Math.min(1, window.scrollY / max));
    if (progressEl) progressEl.style.transform = 'scaleX(' + p + ')';
    updateHeartMarker(p);
    updateParallax();
  }

  // ============= Heart path marker =============
  var pathEl = document.getElementById('heart-path-curve');
  var marker = document.getElementById('heart-path-marker');
  var pathLen = pathEl ? pathEl.getTotalLength() : 0;
  function updateHeartMarker(p) {
    if (!pathEl || !marker) return;
    var pt = pathEl.getPointAtLength(Math.max(0, Math.min(1, p)) * pathLen);
    var tx = (pt.x - 8);
    var ty = (pt.y - 8);
    marker.style.setProperty('--heart-tx', 'translate(' + tx + 'px, ' + ty + 'px)');
    marker.style.transform = 'translate(' + tx + 'px, ' + ty + 'px)';
  }

  // ============= Parallax (hero/location bg + photo cards) =============
  function updateParallax() {
    // Background parallax
    document.querySelectorAll('[data-parallax-bg]').forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh - rect.top) / (vh + rect.height);
      var translateY = (progress - 0.5) * 80;
      var scale = 1 + Math.abs(progress - 0.5) * 0.1;
      el.style.transform = 'translateY(' + translateY + 'px) scale(' + scale + ')';
    });
    // Photo card parallax
    document.querySelectorAll('[data-parallax-y]').forEach(function (el) {
      var amount = parseFloat(el.dataset.parallaxY);
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh - rect.top) / (vh + rect.height); // 0..1
      var ty = (1 - progress) * amount * 0.6 - amount * 0.3;
      el.style.transform = 'translateY(' + ty + 'px)';
    });
  }

  window.addEventListener('scroll', function () {
    requestAnimationFrame(updateScrollProgress);
  }, { passive: true });
  window.addEventListener('resize', updateScrollProgress);
  updateScrollProgress();

  // ============= Audio toggle =============
  (function audio() {
    var btn = document.getElementById('audio-toggle');
    if (!btn) return;
    var icon = document.getElementById('audio-icon');
    var label = document.getElementById('audio-label');
    var audioCandidates = [
      'assets/wedding-song.mp3',
      './assets/wedding-song.mp3',
      '/assets/wedding-song.mp3'
    ];
    var audio = new Audio(audioCandidates[0]);
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = 0;
    var playing = false;
    var audioReady = false;
    var currentAudioIdx = 0;

    var playSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--burgundy)"><path d="M8 5v14l11-7z"/></svg>';
    var barsSvg = '<span class="audio-bars"><span></span><span></span><span></span></span>';
    btn.disabled = true;

    function setUnavailableState() {
      playing = false;
      audioReady = false;
      icon.innerHTML = playSvg;
      label.textContent = 'unavailable';
      btn.setAttribute('aria-label', 'Music unavailable');
      btn.disabled = true;
    }

    function tryNextSource() {
      currentAudioIdx += 1;
      if (currentAudioIdx >= audioCandidates.length) {
        setUnavailableState();
        return;
      }
      audio.src = audioCandidates[currentAudioIdx];
      audio.load();
    }

    audio.addEventListener('canplaythrough', function () {
      audioReady = true;
      btn.disabled = false;
      if (!playing) {
        label.textContent = 'music';
        btn.setAttribute('aria-label', 'Play music');
      }
    });

    audio.addEventListener('error', function () {
      audioReady = false;
      tryNextSource();
    });

    audio.load();

    btn.addEventListener('click', function () {
      if (!audioReady) return;
      if (playing) {
        var v = audio.volume;
        var fade = setInterval(function () {
          v = Math.max(0, v - 0.05);
          audio.volume = v;
          if (v <= 0) { audio.pause(); clearInterval(fade); }
        }, 40);
        playing = false;
        icon.innerHTML = playSvg;
        label.textContent = 'music';
        btn.setAttribute('aria-label', 'Play music');
      } else {
        audio.volume = 0;
        var p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function () {
            // Play can fail when browser blocks media playback or codec is unsupported.
            if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
              tryNextSource();
            }
          });
        }
        var v2 = 0;
        var fade2 = setInterval(function () {
          v2 = Math.min(0.45, v2 + 0.04);
          audio.volume = v2;
          if (v2 >= 0.45) clearInterval(fade2);
        }, 60);
        playing = true;
        icon.innerHTML = barsSvg;
        label.textContent = 'playing';
        btn.setAttribute('aria-label', 'Pause music');
      }
    });
  })();

  // ============= Countdown =============
  (function countdown() {
    var TARGET = new Date('2026-05-28T20:00:00').getTime();
    var nums = {
      days: document.querySelector('[data-unit="days"]'),
      hours: document.querySelector('[data-unit="hours"]'),
      minutes: document.querySelector('[data-unit="minutes"]'),
      seconds: document.querySelector('[data-unit="seconds"]')
    };
    if (!nums.days) return;
    var prev = { days: -1, hours: -1, minutes: -1, seconds: -1 };

    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      var ms = Math.max(0, TARGET - Date.now());
      var d = Math.floor(ms / 86400000);
      var h = Math.floor((ms / 3600000) % 24);
      var m = Math.floor((ms / 60000) % 60);
      var s = Math.floor((ms / 1000) % 60);
      var vals = { days: d, hours: h, minutes: m, seconds: s };
      Object.keys(vals).forEach(function (k) {
        if (vals[k] !== prev[k]) {
          nums[k].textContent = pad(vals[k]);
          nums[k].classList.remove('tick');
          // force reflow
          void nums[k].offsetWidth;
          nums[k].classList.add('tick');
          prev[k] = vals[k];
        }
      });
    }
    tick();
    setInterval(tick, 1000);
  })();

  // ============= Calendar (May 2026) =============
  (function calendar() {
    var grid = document.getElementById('calendar-grid');
    if (!grid) return;
    var weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    var html = '';
    weekdays.forEach(function (d) {
      html += '<div class="calendar__weekday">' + d + '</div>';
    });
    // May 1, 2026 = Friday => offset 5
    for (var b = 0; b < 5; b++) html += '<div></div>';
    for (var d = 1; d <= 31; d++) {
      if (d === 28) {
        html += '<div class="calendar__day calendar__day--target"><span>' + d + '</span></div>';
      } else {
        html += '<div class="calendar__day">' + d + '</div>';
      }
    }
    grid.innerHTML = html;
  })();

  // ============= RSVP form =============
  (function rsvp() {
    var form = document.getElementById('rsvp-form');
    var success = document.getElementById('rsvp-success');
    var btn = document.getElementById('rsvp-submit');
    var label = document.getElementById('rsvp-submit-label');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      btn.disabled = true;
      label.innerHTML = '<span class="spinner"></span>sending';
      setTimeout(function () {
        form.style.display = 'none';
        success.hidden = false;
        // trigger transition
        requestAnimationFrame(function () { success.classList.add('show'); });
      }, 1400);
    });
  })();
})();
