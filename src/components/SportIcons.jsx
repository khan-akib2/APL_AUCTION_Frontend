export function CricketIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 4L6 17l-2 3 3-2L20 5a1.5 1.5 0 0 0-1-1z" />
      <line x1="15.5" y1="7.5" x2="17.5" y2="9.5" />
      <circle cx="19" cy="19" r="2.5" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export function FootballIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <polygon points="12 7.5 15.2 9.8 14 13.5 10 13.5 8.8 9.8 12 7.5" fill="currentColor" fillOpacity="0.35" />
      <line x1="12" y1="2.5" x2="12" y2="7.5" />
      <line x1="21.2" y1="9.2" x2="15.2" y2="9.8" />
      <line x1="17.8" y1="19.7" x2="14" y2="13.5" />
      <line x1="6.2" y1="19.7" x2="10" y2="13.5" />
      <line x1="2.8" y1="9.2" x2="8.8" y2="9.8" />
    </svg>
  );
}
