/**
 * Tiny reactive store + DOM helpers.
 * No framework; ~100 LOC of plain JS.
 */

// ---- DOM builder (h = hyperscript) ----
export function h(tag, props = {}, ...children) {
  const el = typeof tag === 'string' ? document.createElement(tag) : tag;
  const flat = children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false);

  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class' || k === 'className') {
      el.className = Array.isArray(v) ? v.filter(Boolean).join(' ') : v;
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign(el.style, v);
    } else if (k === 'dataset' && typeof v === 'object') {
      Object.assign(el.dataset, v);
    } else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'html') {
      el.innerHTML = v;
    } else if (k === 'ref' && typeof v === 'function') {
      v(el);
    } else if (k in el && typeof v !== 'string') {
      try { el[k] = v; } catch { el.setAttribute(k, v); }
    } else {
      el.setAttribute(k, v);
    }
  }

  for (const c of flat) {
    if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---- Simple state store ----
export class Store {
  constructor(initial = {}) {
    this.state = initial;
    this.listeners = new Set();
  }
  get() { return this.state; }
  set(patch) {
    this.state = typeof patch === 'function' ? patch(this.state) : { ...this.state, ...patch };
    this.listeners.forEach(fn => fn(this.state));
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

// ---- Classname helper ----
export function cx(...parts) {
  const out = [];
  for (const p of parts) {
    if (!p) continue;
    if (typeof p === 'string') out.push(p);
    else if (Array.isArray(p)) out.push(cx(...p));
    else if (typeof p === 'object') {
      for (const [k, v] of Object.entries(p)) if (v) out.push(k);
    }
  }
  return out.join(' ');
}

// ---- Basic navigation stack with persistence ----
export class Router {
  constructor(initial) {
    this.store = new Store({
      stack: initial.stack || [{ screen: 'login', params: {} }],
      tab: initial.tab || 'home',
    });
    this.tabScreens = new Set(['home', 'band', 'practice', 'performance', 'mypage']);
  }
  current() {
    const { stack } = this.store.get();
    return stack[stack.length - 1];
  }
  navigate(screen, params = {}) {
    if (screen === 'login') {
      this.store.set({ stack: [{ screen: 'login', params: {} }] });
      return;
    }
    if (this.tabScreens.has(screen)) {
      this.store.set({ stack: [{ screen, params }], tab: screen });
      return;
    }
    const { stack } = this.store.get();
    this.store.set({ stack: [...stack, { screen, params }] });
  }
  back() {
    const { stack } = this.store.get();
    if (stack.length > 1) this.store.set({ stack: stack.slice(0, -1) });
  }
  subscribe(fn) { return this.store.subscribe(fn); }
  persist(key) {
    this.subscribe(state => {
      try { localStorage.setItem(key, JSON.stringify({ stack: state.stack.slice(-3), tab: state.tab })); } catch {}
    });
  }
  static load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  }
}
