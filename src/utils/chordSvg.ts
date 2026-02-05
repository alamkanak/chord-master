interface ChordData {
  name: string;
  fingers: [number, number, number][];
  muted: number[];
  open: number[];
}

export function createChordSVG(chord: ChordData, isLarge = false): string {
  const width = 240;
  const height = 300;
  const fretTop = 85;
  const fretBottom = 280;
  const marginX = 30;
  const gridWidth = width - marginX * 2;
  const gridHeight = fretBottom - fretTop;
  const stringSpacing = gridWidth / 5;
  const fretSpacing = gridHeight / 5;

  const stringWidth = 2;
  const nutWidth = isLarge ? 8 : 6;

  const halfString = stringWidth / 2;
  const firstStringX = marginX;
  const lastStringX = marginX + 5 * stringSpacing;

  // Alignment target for markers (X and O)
  const markerY = fretTop - 18;

  let svg = `<svg viewBox="0 0 ${width} ${height}" class="w-full h-auto">`;

  // Chord Name
  svg += `<text x="${width / 2}" y="45" text-anchor="middle" font-weight="900" font-size="${
    isLarge ? 52 : 44
  }" fill="#1e293b">${chord.name}</text>`;

  // Muted/Open markers
  for (let i = 0; i < 6; i++) {
    const x = marginX + i * stringSpacing;
    const sNum = 6 - i;
    if (chord.muted.includes(sNum)) {
      // Muted 'X' marker
      svg += `<text x="${x}" y="${markerY}" text-anchor="middle" dominant-baseline="middle" fill="#ef4444" font-weight="bold" font-size="20" dy="-0.05em">×</text>`;
    } else if (chord.open.includes(sNum)) {
      // Open 'O' marker
      svg += `<circle cx="${x}" cy="${markerY}" r="6" fill="none" stroke="#94a3b8" stroke-width="2.5" />`;
    }
  }

  // Strings (Vertical lines)
  for (let i = 0; i < 6; i++) {
    const x = marginX + i * stringSpacing;
    svg += `<line x1="${x}" y1="${fretTop}" x2="${x}" y2="${fretBottom}" stroke="#94a3b8" stroke-width="${stringWidth}" />`;
  }

  // Frets (Horizontal lines)
  for (let i = 1; i <= 5; i++) {
    const y = fretTop + i * fretSpacing;
    svg += `<line x1="${firstStringX}" y1="${y}" x2="${lastStringX}" y2="${y}" stroke="#e2e8f0" stroke-width="2" />`;
  }

  // The Nut (Top bar)
  svg += `<line x1="${firstStringX - halfString}" y1="${fretTop}" x2="${lastStringX + halfString}" y2="${fretTop}" stroke="#545454" stroke-width="${nutWidth}" stroke-linecap="butt" />`;

  // Fingers
  chord.fingers.forEach(([s, f, n]) => {
    const x = marginX + (6 - s) * stringSpacing;
    const y = fretTop + f * fretSpacing - fretSpacing / 2;
    svg += `<circle cx="${x}" cy="${y}" r="${isLarge ? 16 : 14}" fill="#1e293b" />`;
    svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="${
      isLarge ? 18 : 16
    }" font-weight="bold">${n}</text>`;
  });

  svg += `</svg>`;
  return svg;
}
