const LEAVES = [
  { left: '3%',  delay: '0s',  duration: '12s', size: 55, color: '#c0392b' },
  { left: '14%', delay: '3s',  duration: '15s', size: 45, color: '#d4731a' },
  { left: '7%',  delay: '6s',  duration: '11s', size: 60, color: '#b8860b' },
  { left: '18%', delay: '1s',  duration: '14s', size: 40, color: '#a0522d' },
  { left: '10%', delay: '8s',  duration: '13s', size: 50, color: '#cc5c2a' },
  { left: '1%',  delay: '4s',  duration: '16s', size: 35, color: '#d4a017' },
  { left: '16%', delay: '10s', duration: '12s', size: 48, color: '#8b4513' },
  { left: '83%', delay: '2s',  duration: '13s', size: 50, color: '#c0392b' },
  { left: '92%', delay: '5s',  duration: '11s', size: 55, color: '#d4731a' },
  { left: '87%', delay: '0s',  duration: '15s', size: 42, color: '#b8860b' },
  { left: '96%', delay: '7s',  duration: '14s', size: 60, color: '#a0522d' },
  { left: '80%', delay: '3s',  duration: '12s', size: 38, color: '#cc5c2a' },
  { left: '90%', delay: '9s',  duration: '16s', size: 52, color: '#d4a017' },
  { left: '85%', delay: '1s',  duration: '11s', size: 44, color: '#8b4513' },
];

function MapleLeaf({ color }: { color: string }) {
  return (
    <g>
      <path
        d="M50 8 L54 20 L62 12 C64 16 63 22 58 26 L68 24 C68 30 64 34 58 36 L72 38 C70 44 64 46 58 44 L62 52 C56 52 52 48 50 44 C48 48 44 52 38 52 L42 44 C36 46 30 44 28 38 L42 36 C36 34 32 30 32 24 L42 26 C37 22 36 16 38 12 L46 20 L50 8Z"
        fill={color}
        opacity="0.85"
      />
      <path d="M50 44 L50 62" stroke="#5a3e2b" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round" />
      <path d="M50 28 L38 16" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" filter="brightness(0.7)" />
      <path d="M50 28 L62 16" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" filter="brightness(0.7)" />
      <path d="M50 34 L32 30" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" filter="brightness(0.7)" />
      <path d="M50 34 L68 30" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" filter="brightness(0.7)" />
      <path d="M50 40 L40 48" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" filter="brightness(0.7)" />
      <path d="M50 40 L60 48" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" filter="brightness(0.7)" />
    </g>
  );
}

export default function FallingLeaves() {
  return (
    <div className="falling-leaves" aria-hidden="true">
      {LEAVES.map((leaf, i) => (
        <svg
          key={i}
          className={`falling-leaf leaf-sway-${(i % 3) + 1}`}
          style={{
            left: leaf.left,
            animationDelay: leaf.delay,
            animationDuration: leaf.duration,
            width: leaf.size,
            height: leaf.size,
          }}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <MapleLeaf color={leaf.color} />
        </svg>
      ))}
    </div>
  );
}
