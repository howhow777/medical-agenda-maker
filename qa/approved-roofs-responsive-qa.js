const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function waitFor(check, message, timeout = 20000) {
  const started = performance.now();
  while (performance.now() - started < timeout) {
    const value = check(); if (value) return value;
    await wait(25);
  }
  throw new Error(`Timeout: ${message}`);
}

async function frameAt(host, width, height) {
  const frame = document.createElement('iframe');
  frame.title = `${width}×${height}正式 Maker 響應式驗證`;
  frame.src = '../index.html';
  frame.style.cssText = `display:block;width:${width}px;height:${height}px;border:1px solid #cbd5e1;background:#fff`;
  host.replaceChildren(frame);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Maker ${width}x${height} load timeout`)), 30000);
    frame.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
  await waitFor(() => frame.contentWindow?.app, `Maker ${width}x${height} app`, 30000);
  return { frame, win: frame.contentWindow, doc: frame.contentDocument };
}

function key(win, key, shiftKey = false) {
  return new win.KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
}

function measureTriggerText(trigger, computedStyle) {
  const range = trigger.ownerDocument.createRange();
  range.selectNodeContents(trigger);
  const textWidth = range.getBoundingClientRect().width;
  const contentWidth = trigger.clientWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight);
  return { textWidth, contentWidth, clipped: textWidth > contentWidth + 0.5 };
}

function styleContract(css) {
  const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  const breathing = css.match(/@keyframes\s+designSwitcherBreathing\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  return {
    reducedMotionRule: /\.design-switcher-trigger[\s\S]*animation:\s*none\s*!important/.test(reduced) &&
      /\.design-switcher-trigger::before/.test(reduced) && /transition:\s*none\s*!important/.test(reduced),
    breathingDuration: /designSwitcherBreathing\s+3\.6s\s+ease-in-out\s+infinite/.test(css),
    breathingBrightnessWithinFourPercent: /brightness\(1\.04\)/.test(breathing) && !/brightness\(1\.0[5-9]|brightness\(1\.[1-9]/.test(breathing),
    discoveryThreeCycles: /designSwitcherDiscovery\s+900ms\s+ease-in-out\s+3/.test(css),
    gradientEightSeconds: /gradientShift\s+8s\s+ease\s+infinite/.test(css),
    shimmerThreeSeconds: /animation:\s*shimmer\s+3s\s+infinite/.test(css),
    hoverActivePause: /\.design-switcher-trigger:hover[\s\S]*animation-play-state:\s*paused/.test(css) &&
      /\.design-switcher-trigger:active[\s\S]*animation-play-state:\s*paused/.test(css)
  };
}

async function exerciseViewport(maker, width, height) {
  const { doc, win } = maker, root = doc.documentElement, body = doc.body;
  await wait(60);
  const trigger = doc.getElementById('designSwitcherTrigger'), drawer = doc.getElementById('designSwitcherDrawer');
  const before = win.getComputedStyle(trigger), rect = trigger.getBoundingClientRect();
  const textMeasure = measureTriggerText(trigger, before);
  const closed = { drawerHidden: drawer.getAttribute('aria-hidden') === 'true', expanded: trigger.getAttribute('aria-expanded') === 'false' };
  assert(trigger.textContent.trim() === '切換 癌別/特效', `${width}: trigger label changed`);
  assert(rect.height >= 44 && before.whiteSpace === 'nowrap' && !textMeasure.clipped,
    `${width}: trigger is clipped/wrapped or below 44px ${JSON.stringify({ height: rect.height,
      whiteSpace: before.whiteSpace, ...textMeasure })}`);
  assert(before.position === 'sticky', `${width}: trigger is no longer sticky`);
  trigger.classList.add('design-switcher-discovery');
  void trigger.offsetWidth;
  const discoveryName = win.getComputedStyle(trigger).animationName;
  assert(discoveryName.includes('designSwitcherDiscovery') && discoveryName.includes('gradientShift'),
    `${width}: discovery animation is not active`);
  trigger.dispatchEvent(new win.AnimationEvent('animationend', { animationName: 'designSwitcherDiscovery', bubbles: true }));
  const steadyName = win.getComputedStyle(trigger).animationName;
  assert(!trigger.classList.contains('design-switcher-discovery') &&
    steadyName.includes('designSwitcherBreathing') && steadyName.includes('gradientShift'),
    `${width}: breathing did not follow discovery`);
  trigger.focus(); trigger.click(); await wait(20);
  assert(drawer.getAttribute('aria-hidden') === 'false' && trigger.getAttribute('aria-expanded') === 'true',
    `${width}: drawer ARIA open state failed`);
  assert(doc.activeElement === doc.getElementById('designSwitcherClose'),
    `${width}: opening the drawer did not move focus to its close button`);
  const focusable = [...drawer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.hidden && element.offsetParent !== null);
  assert(focusable.length > 5, `${width}: drawer has no keyboard controls`);
  let lastReachable;
  for (const candidate of [...focusable].reverse()) {
    candidate.focus({ preventScroll: true });
    if (doc.activeElement === candidate) { lastReachable = candidate; break; }
  }
  assert(lastReachable, `${width}: drawer has no reachable end control`);
  lastReachable.focus(); doc.dispatchEvent(key(win, 'Tab'));
  assert(doc.activeElement === focusable[0], `${width}: forward focus trap failed`);
  focusable[0].focus(); doc.dispatchEvent(key(win, 'Tab', true));
  assert(doc.activeElement === lastReachable, `${width}: reverse focus trap failed ${JSON.stringify({
    first: focusable[0].outerHTML.slice(0, 180), last: lastReachable.outerHTML.slice(0, 180),
    active: doc.activeElement?.outerHTML?.slice(0, 180) || String(doc.activeElement)
  })}`);
  doc.dispatchEvent(key(win, 'Escape')); await wait(10);
  assert(drawer.getAttribute('aria-hidden') === 'true' && trigger.getAttribute('aria-expanded') === 'false' && doc.activeElement === trigger,
    `${width}: Escape/focus return failed`);
  trigger.click(); await wait(10); doc.getElementById('designSwitcherClose').click(); await wait(10);
  assert(doc.activeElement === trigger, `${width}: close button did not return focus`);
  const scroll = { documentClientWidth: root.clientWidth, documentScrollWidth: root.scrollWidth,
    bodyClientWidth: body.clientWidth, bodyScrollWidth: body.scrollWidth };
  assert(scroll.documentScrollWidth <= scroll.documentClientWidth && scroll.bodyScrollWidth <= scroll.bodyClientWidth,
    `${width}: horizontal page overflow ${JSON.stringify(scroll)}`);
  return { width, height, closed, trigger: { text: trigger.textContent.trim(), height: rect.height,
    whiteSpace: before.whiteSpace, position: before.position, ...textMeasure,
    discoveryAnimationName: discoveryName, steadyAnimationName: steadyName },
  drawer: { ariaHidden: drawer.getAttribute('aria-hidden'), expanded: trigger.getAttribute('aria-expanded'),
    focusableControls: focusable.length, escapeAndFocusReturn: true, tabTrap: true }, scroll,
  media: { actualPrefersReducedMotion: win.matchMedia('(prefers-reduced-motion: reduce)').matches } };
}

export async function runResponsiveQA(host, onProgress = () => {}) {
  const report = { version: 1, startedAt: new Date().toISOString(), cases: [], cssContract: {},
    horizontalOverflowCases: 'unverified', responsiveMotionKeyboard: false, failures: [] };
  const updateKey = 'medical-agenda-maker:update-notice:2026-07-09', before = localStorage.getItem(updateKey);
  let maker;
  try {
    const details = host.closest('details');
    if (details) details.open = true;
    localStorage.setItem(updateKey, 'dismissed');
    const css = await (await fetch('../styles.css', { cache: 'no-store' })).text();
    report.cssContract = styleContract(css);
    assert(Object.values(report.cssContract).every(Boolean), 'motion/gradient CSS contract drifted');
    for (const size of [[1400, 900], [390, 844]]) {
      onProgress(`響應式與鍵盤：${size[0]}×${size[1]}`);
      maker = await frameAt(host, ...size);
      report.cases.push(await exerciseViewport(maker, ...size));
      maker.frame.remove(); maker = undefined;
    }
    report.horizontalOverflowCases = report.cases.filter(item => item.scroll.documentScrollWidth > item.scroll.documentClientWidth ||
      item.scroll.bodyScrollWidth > item.scroll.bodyClientWidth).length;
    report.responsiveMotionKeyboard = report.horizontalOverflowCases === 0 && report.cases.every(item =>
      item.drawer.escapeAndFocusReturn && item.drawer.tabTrap && !item.trigger.clipped);
    assert(report.responsiveMotionKeyboard, 'responsive/motion/keyboard assertions failed');
    report.finishedAt = new Date().toISOString();
  } catch (error) { report.failures.push({ message: String(error), stack: error.stack || '' }); }
  finally {
    maker?.frame.remove();
    if (before === null) localStorage.removeItem(updateKey); else localStorage.setItem(updateKey, before);
  }
  return report;
}
