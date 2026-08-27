"use client";

type Props = {
  size?: number;
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  iconOnly?: boolean;
};

export default function VisionLogo({ size = 32, showText = true, showSubtitle = false, className = "", iconOnly = false }: Props) {
  // The V mark uses currentColor so it automatically adapts to dark/light theme via CSS variable --text
  // Dark: --text #fff -> white logo, Light: --text #000 -> black logo (matches your image)
  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`} style={{ color: "var(--text)" }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="VISION logo"
        className="shrink-0"
      >
        {/* V shape — filled, with U notch for the dot. Uses currentColor */}
        <path
          d="M 9 10 C 6 6, 12 3, 17 6.5 L 42.5 66.5 C 44.2 70.2, 46.5 73.2, 50 73.2 C 53.5 73.2, 55.8 70.2, 57.5 66.5 L 83 6.5 C 88 3, 94 6, 91 10 L 90.5 14.5 L 62 84.2 C 58.5 91.5, 53.2 88.8, 50 88.8 C 46.8 88.8, 41.5 91.5, 38 84.2 L 9.5 14.5 Z"
          fill="currentColor"
        />
        {/* Inner U highlight (the white gap) is actually transparent — we simulate by not drawing there. Dot sits in the notch. */}
        {/* Dot */}
        <circle cx="50" cy="38.5" r="11.5" fill="currentColor" />
        {/* Dot highlight — uses bg color so it inverts with theme (white on black dot in light, black on white dot in dark) */}
        <circle cx="46.2" cy="34.8" r="4.2" fill="var(--bg)" />
      </svg>

      {showText && !iconOnly && (
        <div className="flex flex-col items-center">
          <span
            className="font-display tracking-[0.38em] leading-none"
            style={{ fontSize: size * 0.42, color: "var(--text)" }}
          >
            VISION
          </span>
          {showSubtitle && (
            <span
              className="tracking-[0.32em] font-light opacity-70"
              style={{ fontSize: size * 0.11, color: "var(--text)", marginTop: 4 }}
            >
              YOUR PERSONAL AI ASSISTANT
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// App Icon — rounded square, theme-aware (white bg black logo in light, black bg white logo in dark)
// Use as favicon / PWA icon
export function VisionAppIcon({ size = 512 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VISION app icon">
      <rect width="100" height="100" rx="22" fill="var(--bg)" />
      <g style={{ color: "var(--text)" }}>
        <path
          d="M 14 22 C 11 18, 17 14, 22 17 L 44 64 C 45.5 67, 47.5 70, 50 70 C 52.5 70, 54.5 67, 56 64 L 78 17 C 83 14, 89 18, 86 22 L 85 25 L 61 78 C 58 84, 53 82.5, 50 82.5 C 47 82.5, 42 84, 39 78 L 14 25 Z"
          fill="currentColor"
        />
        <circle cx="50" cy="42" r="9.5" fill="currentColor" />
        <circle cx="47" cy="39.2" r="3.4" fill="var(--bg)" />
      </g>
    </svg>
  );
}
