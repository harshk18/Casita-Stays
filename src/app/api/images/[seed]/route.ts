function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Deterministic placeholder photo: a gradient and a house shape per seed. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ seed: string }> },
) {
  const { seed } = await params;
  const { searchParams } = new URL(request.url);
  const width = clamp(Number(searchParams.get('w')) || 480, 16, 2000);
  const height = clamp(Number(searchParams.get('h')) || 320, 16, 2000);
  const hue = hash(seed) % 360;
  const scale = Math.min(width, height) / 200;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 55% 78%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 40) % 360} 50% 58%)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <path fill="hsl(${hue} 35% 30% / 0.55)" transform="translate(${width / 2} ${height / 2}) scale(${scale})" d="M-50 20 L0 -30 L50 20 V50 H-50 Z"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
