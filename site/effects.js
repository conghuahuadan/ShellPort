(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const wideScreen = window.matchMedia('(min-width: 768px)');
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('signal-field');
  const command = document.getElementById('connection-command');

  // Everything remains readable when JavaScript or motion is unavailable.
  const revealTargets = document.querySelectorAll('.section-heading, .feature-grid article, .screenshot, .light-intro, .download-card, .quick-start, .faq, .closing');
  let revealObserver;
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    revealTargets.forEach((target, index) => {
      target.dataset.reveal = '';
      if (target.matches('.feature-grid article')) target.style.setProperty('--reveal-delay', `${index % 3 * 65}ms`);
      revealObserver.observe(target);
    });
    document.documentElement.classList.add('motion-ready');
  }

  let scrollFrame = 0;
  function updateProgress() {
    scrollFrame = 0;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty('--reading-progress', range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0);
  }
  function scheduleProgress() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress);
  }
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress, { passive: true });
  window.addEventListener('load', scheduleProgress, { once: true });
  updateProgress();

  let hoverFrame = 0;
  let hoverTarget;
  let hoverX = 0;
  let hoverY = 0;
  document.querySelectorAll('.feature-grid article, .download-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!finePointer.matches || reducedMotion.matches) return;
      const bounds = card.getBoundingClientRect();
      hoverTarget = card;
      hoverX = event.clientX - bounds.left;
      hoverY = event.clientY - bounds.top;
      if (hoverFrame) return;
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        hoverTarget.style.setProperty('--pointer-x', `${hoverX}px`);
        hoverTarget.style.setProperty('--pointer-y', `${hoverY}px`);
      });
    }, { passive: true });
  });

  let heroVisible = true;
  let heroObserver;
  if (hero && 'IntersectionObserver' in window) {
    heroObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncMotion();
    });
    heroObserver.observe(hero);
  }

  const context = canvas?.getContext('2d');
  let width = 0;
  let height = 0;
  let nodes = [];
  let animationFrame = 0;
  let previousTime = 0;
  const pointer = { x: -1000, y: -1000 };
  const canAnimate = () => !document.hidden && !reducedMotion.matches && heroVisible;
  const canDraw = () => context && wideScreen.matches && canAnimate();

  function resizeField() {
    if (!context) return;
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    nodes = Array.from({ length: Math.min(44, Math.floor(width / 32)) }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
    }));
    previousTime = 0;
    syncMotion();
  }

  function drawField(time) {
    animationFrame = 0;
    if (!canDraw()) return;
    animationFrame = requestAnimationFrame(drawField);
    if (time - previousTime < 33) return;
    const step = Math.min((time - previousTime) / 16.67, 3);
    previousTime = time;
    context.clearRect(0, 0, width, height);
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.x += node.vx * step;
      node.y += node.vy * step;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
      context.fillStyle = 'rgba(131,237,199,0.42)';
      context.beginPath();
      context.arc(node.x, node.y, 1.3, 0, Math.PI * 2);
      context.fill();
      for (let j = i + 1; j < nodes.length; j++) {
        const other = nodes[j];
        const distance = Math.hypot(node.x - other.x, node.y - other.y);
        if (distance > 165) continue;
        context.strokeStyle = `rgba(131,237,199,${(1 - distance / 165) * 0.16})`;
        context.beginPath(); context.moveTo(node.x, node.y); context.lineTo(other.x, other.y); context.stroke();
      }
      const pointerDistance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
      if (pointerDistance < 220) {
        context.strokeStyle = `rgba(131,237,199,${(1 - pointerDistance / 220) * 0.3})`;
        context.beginPath(); context.moveTo(node.x, node.y); context.lineTo(pointer.x, pointer.y); context.stroke();
      }
    }
  }

  hero?.addEventListener('pointermove', event => {
    if (!finePointer.matches || !canDraw()) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
  }, { passive: true });
  hero?.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1000; });

  const commands = ['ssh your-next-server', 'tail -f /var/log/app.log', 'cd ~/projects'];
  let commandIndex = 0;
  let commandLength = commands[0].length;
  let deleting = true;
  let typingTimer = 0;
  function typeCommand() {
    typingTimer = 0;
    if (!command || !canAnimate()) return;
    const text = commands[commandIndex];
    commandLength += deleting ? -1 : 1;
    command.textContent = text.slice(0, commandLength);
    let delay = deleting ? 35 : 80;
    if (commandLength === 0) {
      deleting = false;
      commandIndex = (commandIndex + 1) % commands.length;
      delay = 240;
    } else if (!deleting && commandLength === text.length) {
      deleting = true;
      delay = 2800;
    }
    typingTimer = window.setTimeout(typeCommand, delay);
  }

  function syncMotion() {
    document.documentElement.classList.toggle('motion-paused', !canAnimate());
    if (canDraw()) {
      if (!animationFrame) animationFrame = requestAnimationFrame(drawField);
    } else {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      context?.clearRect(0, 0, width, height);
    }
    if (command && canAnimate()) {
      if (!typingTimer) typingTimer = window.setTimeout(typeCommand, 2200);
    } else {
      clearTimeout(typingTimer);
      typingTimer = 0;
      if (command && reducedMotion.matches) {
        command.textContent = commands[0];
        commandIndex = 0; commandLength = commands[0].length; deleting = true;
      }
    }
    if (reducedMotion.matches) {
      revealObserver?.disconnect();
      revealTargets.forEach(target => target.classList.add('is-visible'));
    }
  }

  window.addEventListener('resize', resizeField, { passive: true });
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', syncMotion);
  wideScreen.addEventListener('change', syncMotion);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(animationFrame);
    cancelAnimationFrame(scrollFrame);
    cancelAnimationFrame(hoverFrame);
    clearTimeout(typingTimer);
    animationFrame = scrollFrame = hoverFrame = typingTimer = 0;
  });
  window.addEventListener('pageshow', () => { updateProgress(); syncMotion(); });
  resizeField();
})();
