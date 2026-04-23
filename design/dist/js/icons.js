/**
 * SVG icon library. Returns inline <svg> elements.
 * Usage: Icon('music', { size: 18, color: '#fff' })
 */

const PATHS = {
  guitar: `<rect x="9.5" y="1" width="5" height="2.5" rx="1" fill="CURRENT"/>
    <rect x="11" y="2" width="2" height="8" fill="CURRENT"/>
    <path fill="CURRENT" d="M12 9.5C9 9.5 7 11 7 13c0 1.5 1.5 2.5 1.5 2.5C7 16.5 6 17.5 6 19c0 2.5 2.5 4 6 4s6-1.5 6-4c0-1.5-1-2.5-2.5-3.5 0 0 1.5-1 1.5-2.5 0-2-2-3.5-5-3.5z"/>
    <rect x="9.5" y="17" width="5" height="1.2" rx="0.3" fill="rgba(0,0,0,0.25)"/>`,

  music: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3" fill="none" stroke="CURRENT" stroke-width="2"/>
    <circle cx="18" cy="16" r="3" fill="none" stroke="CURRENT" stroke-width="2"/>`,

  home: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 9.5 12 2l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>`,

  band: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    <circle cx="9" cy="7" r="4" fill="none" stroke="CURRENT" stroke-width="2"/>`,

  practice: `<rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="CURRENT" stroke-width="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="CURRENT" stroke-width="2"/>
    <circle cx="12" cy="16" r="2" fill="CURRENT"/>`,

  performance: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linejoin="round" d="M6 9V3h12v6a6 6 0 0 1-12 0z"/>
    <path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" d="M9 22h6M12 15v7M6 5H3a3 3 0 0 0 3 6M18 5h3a3 3 0 0 1-3 6"/>`,

  user: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4" fill="none" stroke="CURRENT" stroke-width="2"/>`,

  plus: `<line x1="12" y1="5" x2="12" y2="19" stroke="CURRENT" stroke-width="2.4" stroke-linecap="round"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="CURRENT" stroke-width="2.4" stroke-linecap="round"/>`,

  search: `<circle cx="11" cy="11" r="8" fill="none" stroke="CURRENT" stroke-width="2"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>`,

  bell: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>`,

  settings: `<circle cx="12" cy="12" r="3" fill="none" stroke="CURRENT" stroke-width="2"/>
    <path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,

  shield: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,

  logout: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>`,

  trash: `<polyline points="3 6 5 6 21 6" fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,

  edit: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,

  check: `<polyline points="20 6 9 17 4 12" fill="none" stroke="CURRENT" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,

  x: `<line x1="18" y1="6" x2="6" y2="18" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>
    <line x1="6" y1="6" x2="18" y2="18" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>`,

  chevronRight: `<polyline points="9 18 15 12 9 6" fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  chevronLeft: `<polyline points="15 18 9 12 15 6" fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,

  back: `<line x1="19" y1="12" x2="5" y2="12" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>
    <polyline points="12 19 5 12 12 5" fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,

  calendar: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke="CURRENT" stroke-width="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="CURRENT" stroke-width="2"/>`,

  location: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3" fill="none" stroke="CURRENT" stroke-width="2"/>`,

  mic: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>`,

  drum: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m2 2 8 8M5 17c0 3 7 5 14 2l-1-6c-7 3-14 1-14 4z"/>
    <line x1="18" y1="13" x2="20" y2="8" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>`,

  link: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,

  eye: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="CURRENT" stroke-width="2"/>`,

  eyeOff: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>`,

  camera: `<path fill="none" stroke="CURRENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4" fill="none" stroke="CURRENT" stroke-width="2"/>`,

  info: `<circle cx="12" cy="12" r="10" fill="none" stroke="CURRENT" stroke-width="2"/>
    <line x1="12" y1="16" x2="12" y2="12" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>
    <line x1="12" y1="8" x2="12.01" y2="8" stroke="CURRENT" stroke-width="2" stroke-linecap="round"/>`,

  star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="CURRENT"/>`,
};

export function Icon(name, { size = 18, color = 'currentColor' } = {}) {
  const path = PATHS[name] || PATHS.info;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.innerHTML = path.replaceAll('CURRENT', color);
  return svg;
}

export const iconNames = Object.keys(PATHS);
