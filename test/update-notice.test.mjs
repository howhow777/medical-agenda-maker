import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { UpdateNoticeController } from '../dist/interface/updateNoticeController.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const currentKey = 'medical-agenda-maker:update-notice:2026-09-16-roof-defaults';
const snoozeKey = `${currentKey}:snoozed`;
const previousKey = 'medical-agenda-maker:update-notice:2026-07-09';

class FakeClassList {
  values = new Set();
  add(...names) { names.forEach(name => this.values.add(name)); }
  contains(name) { return this.values.has(name); }
}

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.textContent = '';
    this.tabIndex = 0;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.classList = new FakeClassList();
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  dispatch(type, values = {}) {
    const event = { type, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...values };
    for (const listener of this.listeners.get(type) || []) listener(event);
    return event;
  }
  replaceChildren(...children) { this.children = children; }
  focus() { globalThis.document.activeElement = this; }
}

class FakeStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

function createEnvironment({ local = {}, session = {} } = {}) {
  const ids = [
    'updateNotice', 'updateNoticePanel', 'updateNoticeTitle', 'updateNoticeSummary',
    'updateNoticeDetails', 'updateNoticeItems', 'updateNoticeCurrentTab', 'updateNoticePreviousTab',
    'updateNoticeReadMore',
    'updateNoticeRemindLater', 'updateNoticeDismiss'
  ];
  const elements = new Map(ids.map(id => [id, new FakeElement(id)]));
  const localStorage = new FakeStorage();
  const sessionStorage = new FakeStorage();
  Object.entries(local).forEach(([key, value]) => localStorage.setItem(key, value));
  Object.entries(session).forEach(([key, value]) => sessionStorage.setItem(key, value));
  globalThis.document = {
    activeElement: null,
    getElementById: id => elements.get(id) || null,
    createElement: () => new FakeElement()
  };
  globalThis.window = {
    localStorage,
    sessionStorage,
    setTimeout(callback) { callback(); return 1; }
  };
  return { elements, localStorage, sessionStorage };
}

test('update notice markup orders current before previous and exposes one shared accessible panel', () => {
  const html = readFileSync(resolve(projectRoot, 'index.html'), 'utf8');
  const styles = readFileSync(resolve(projectRoot, 'styles.css'), 'utf8');
  const currentIndex = html.indexOf('>本期更新</button>');
  const previousIndex = html.indexOf('>上期更新</button>');
  assert.ok(currentIndex >= 0 && previousIndex > currentIndex);
  assert.match(html, /role="tablist" aria-label="更新期別"/);
  assert.match(html, /id="updateNoticeCurrentTab"[\s\S]*?aria-selected="true"/);
  assert.match(html, /id="updateNoticePreviousTab"[\s\S]*?aria-selected="false"/);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 1);
  assert.match(html, /id="updateNoticeDetails"[^>]*hidden/);
  assert.match(html, /id="updateNoticeReadMore"[\s\S]*?>閱讀更多<\/button>/);
  assert.doesNotMatch(html, /updateNoticeToggle|查看更新內容/);
  assert.match(styles, /\.update-notice-period-tabs\s*\{[\s\S]*?display:\s*flex/);
  assert.match(styles, /\.update-notice-period-tab\s*\{[\s\S]*?padding:\s*2px 8px[\s\S]*?font-size:\s*11px/);
});

test('current release is selected by default; click and arrow keys replace the shared panel content', () => {
  const { elements } = createEnvironment();
  new UpdateNoticeController();
  const current = elements.get('updateNoticeCurrentTab');
  const previous = elements.get('updateNoticePreviousTab');
  const panel = elements.get('updateNoticePanel');
  const title = elements.get('updateNoticeTitle');
  const items = elements.get('updateNoticeItems');
  const details = elements.get('updateNoticeDetails');
  const readMore = elements.get('updateNoticeReadMore');

  assert.equal(current.getAttribute('aria-selected'), 'true');
  assert.equal(previous.getAttribute('aria-selected'), 'false');
  assert.equal(title.textContent, '全新光影主視覺已成為預設設計');
  assert.equal(items.children.length, 4);
  assert.equal(panel.getAttribute('aria-labelledby'), current.id);
  assert.equal(details.hidden, true);

  readMore.dispatch('click');
  assert.equal(details.hidden, false);
  assert.equal(readMore.getAttribute('aria-expanded'), 'true');
  assert.equal(readMore.textContent, '收合內容');

  previous.dispatch('click');
  assert.equal(current.getAttribute('aria-selected'), 'false');
  assert.equal(previous.getAttribute('aria-selected'), 'true');
  assert.equal(title.textContent, '手機審閱、議程編輯與 Moderator 顯示已優化');
  assert.equal(items.children.length, 5);
  assert.equal(panel.getAttribute('aria-labelledby'), previous.id);
  assert.equal(details.hidden, true);
  assert.equal(readMore.textContent, '閱讀更多');

  const event = previous.dispatch('keydown', { key: 'ArrowLeft' });
  assert.equal(event.defaultPrevented, true);
  assert.equal(current.getAttribute('aria-selected'), 'true');
  assert.equal(globalThis.document.activeElement, current);
});

test('old dismissal does not hide the new release; current dismissal and snooze use versioned keys', () => {
  let environment = createEnvironment({ local: { [previousKey]: 'dismissed' } });
  new UpdateNoticeController();
  assert.equal(environment.elements.get('updateNotice').classList.contains('update-notice-hidden'), false);

  environment.elements.get('updateNoticeDismiss').dispatch('click');
  assert.equal(environment.localStorage.getItem(currentKey), 'dismissed');
  assert.equal(environment.elements.get('updateNotice').classList.contains('update-notice-hidden'), true);

  environment = createEnvironment({ local: { [currentKey]: 'dismissed' } });
  new UpdateNoticeController();
  assert.equal(environment.elements.get('updateNotice').classList.contains('update-notice-hidden'), true);

  environment = createEnvironment();
  new UpdateNoticeController();
  environment.elements.get('updateNoticeRemindLater').dispatch('click');
  assert.equal(environment.sessionStorage.getItem(snoozeKey), 'snoozed');
  assert.equal(environment.elements.get('updateNotice').classList.contains('update-notice-hidden'), true);
});
