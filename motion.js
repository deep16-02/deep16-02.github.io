(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const toggle = document.querySelector('.motion-toggle');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let pausedByUser = false;
  let active = false;
  try { pausedByUser = sessionStorage.getItem('portfolio-demo-motion') === 'paused'; } catch (_) {}
  const cards = [...document.querySelectorAll('[data-tilt]')];
  const resetCards = () => cards.forEach(card => {
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  });
  function applyMotion() {
    active = !preference.matches && !pausedByUser && !document.hidden;
    body.classList.toggle('motion-on', active);
    body.classList.toggle('motion-paused', !active);
    root.classList.toggle('motion-paused', !active);
    toggle.setAttribute('aria-pressed', String(pausedByUser || preference.matches));
    toggle.querySelector('.motion-label').textContent = preference.matches ? 'Reduced motion' : pausedByUser ? 'Enable motion' : 'Pause motion';
    toggle.querySelector('.motion-icon').textContent = active ? 'Ⅱ' : '▷';
    toggle.disabled = preference.matches;
    toggle.title = preference.matches ? 'Reduced motion is enabled in your device settings.' : 'Turn decorative motion on or off';
    if (!active) {
      document.getAnimations().forEach(animation => animation.cancel());
      resetCards();
    }
  }
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    pausedByUser = !pausedByUser;
    try { sessionStorage.setItem('portfolio-demo-motion', pausedByUser ? 'paused' : 'enabled'); } catch (_) {}
    applyMotion();
  });
  preference.addEventListener('change', applyMotion);
  document.addEventListener('visibilitychange', applyMotion);
  applyMotion();

  // Layer a travelling highlight over the original illustrative timing traces.
  const svg = document.querySelector('.wave');
  [...svg.querySelectorAll(':scope > path')].forEach((path, i) => {
    const trace = path.cloneNode();
    trace.classList.add('signal-flow');
    trace.style.animationDelay = `${i * -2.4}s`;
    trace.setAttribute('aria-hidden', 'true');
    svg.appendChild(trace);
  });

  // Content is always present; animation is progressive enhancement only.
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal.unobserve(entry.target);
      if (active && typeof entry.target.animate === 'function') {
        entry.target.animate([
          { opacity: .35, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 650, easing: 'cubic-bezier(.22,.7,.25,1)' });
      }
    }), { threshold: .08 });
    document.querySelectorAll('.section-heading,.featured,.project-card,.job,.about-grid,.contact').forEach(el => reveal.observe(el));
    const navLinks = [...document.querySelectorAll('.header nav a')];
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px' });
    document.querySelectorAll('main section[id]').forEach(el => navObserver.observe(el));
  }
  // Small perspective changes on precise pointers; touch scrolling stays native.
  cards.forEach(card => {
    let frame = null;
    card.addEventListener('pointermove', event => {
      if (!active || !finePointer.matches || event.pointerType === 'touch') return;
      if (frame !== null) cancelAnimationFrame(frame);
      const x = event.clientX, y = event.clientY;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (!active) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--tilt-x', `${-(y - rect.top - rect.height / 2) / rect.height * 3}deg`);
        card.style.setProperty('--tilt-y', `${(x - rect.left - rect.width / 2) / rect.width * 3}deg`);
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  });
  const progress = document.querySelector('.reading-progress');
  let scrollFrame = null;
  function updateProgress() {
    const range = root.scrollHeight - window.innerHeight;
    const value = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
    progress.style.transform = `scaleX(${value})`;
    scrollFrame = null;
  }
  function scheduleProgress() {
    if (scrollFrame === null) scrollFrame = requestAnimationFrame(updateProgress);
  }
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress, { passive: true });
  updateProgress();
})();
