export function ParcelScene() {
  return (
    <div className="parcel-scene relative mx-auto w-full max-w-xl" aria-hidden="true">
      <svg viewBox="0 0 480 140" className="block h-full w-full" focusable="false">
        <ellipse cx="240" cy="116" rx="170" ry="12" fill="var(--color-muted)" />
        <path d="M45 99 Q145 45 240 94 T435 70" fill="none" stroke="var(--color-border)" strokeWidth="3" strokeDasharray="5 7" />
        <g transform="translate(45 77)">
          <path d="M0 22C-25-4-12-20 0-20S25-4 0 22Z" fill="var(--color-success)" />
          <circle cy="-6" r="5" fill="var(--color-card)" />
        </g>
        <g transform="translate(435 48)">
          <path d="M0 22C-25-4-12-20 0-20S25-4 0 22Z" fill="var(--color-primary)" />
          <circle cy="-6" r="5" fill="var(--color-card)" />
        </g>
        <g className="parcel-arrival">
          <ellipse cx="240" cy="106" rx="40" ry="7" fill="var(--color-border)" />
          <path d="M203 48L240 27L277 48L240 70Z" fill="var(--color-accent)" stroke="var(--color-primary)" strokeWidth="2" />
          <path d="M203 48L240 70V110L203 87Z" fill="var(--color-primary)" />
          <path d="M240 70L277 48V87L240 110Z" fill="var(--color-warning)" />
          <path d="M221 38L258 60V77L248 83V65L211 44Z" fill="var(--color-card)" opacity="0.8" />
          <path d="M212 75L229 85M212 81L223 87" stroke="var(--color-primary-foreground)" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}