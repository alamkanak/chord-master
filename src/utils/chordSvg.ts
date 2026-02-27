export interface ChordData {
  name: string;
  fingers: [number, number, number][];
  muted: number[];
  open: number[];
}

export interface ChordGroup {
  title: string;
  subtitle: string;
  chords: ChordData[];
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

  // Calculate fret offset for chords played higher up the neck
  const fretNumbers = chord.fingers.map(([, f]) => f);
  const minFret = fretNumbers.length > 0 ? Math.min(...fretNumbers) : 1;
  const maxFret = fretNumbers.length > 0 ? Math.max(...fretNumbers) : 1;
  // Only offset if the chord doesn't fit within frets 1-5
  const fretOffset = maxFret > 5 ? minFret - 1 : 0;
  const showNut = fretOffset === 0;

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

  // Frets (Horizontal lines) — drawn first so strings render on top
  for (let i = 1; i <= 5; i++) {
    const y = fretTop + i * fretSpacing;
    svg += `<line x1="${firstStringX}" y1="${y}" x2="${lastStringX}" y2="${y}" stroke="#e2e8f0" stroke-width="2" />`;
  }

  // Strings (Vertical lines) — drawn after frets so they appear in front
  for (let i = 0; i < 6; i++) {
    const x = marginX + i * stringSpacing;
    const sNum = 6 - i;
    const isMuted = chord.muted.includes(sNum);
    const strokeColor = isMuted ? "#e2e8f0" : "#334155";
    svg += `<line x1="${x}" y1="${fretTop}" x2="${x}" y2="${fretBottom}" stroke="${strokeColor}" stroke-width="${stringWidth}" />`;
  }

  if (showNut) {
    // The Nut (Top bar) — only shown when starting from fret 1
    svg += `<line x1="${firstStringX - halfString}" y1="${fretTop}" x2="${lastStringX + halfString}" y2="${fretTop}" stroke="#334155" stroke-width="${nutWidth}" stroke-linecap="butt" />`;
  } else {
    // Thin top line when not at the nut position
    svg += `<line x1="${firstStringX - halfString}" y1="${fretTop}" x2="${lastStringX + halfString}" y2="${fretTop}" stroke="#94a3b8" stroke-width="2" stroke-linecap="butt" />`;
    // Fret number indicator — clean pill-style label
    const labelY = fretTop + fretSpacing / 2;
    svg += `<text x="${firstStringX - 18}" y="${labelY}" text-anchor="end" dominant-baseline="central" fill="#64748b" font-size="${isLarge ? 20 : 18}" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="0.02em">${minFret}</text>`;
  }

  // Group fingers by (fret, fingerNumber) to detect barres
  const barreGroups = new Map<string, [number, number, number][]>();
  chord.fingers.forEach(([s, f, n]) => {
    const key = `${f}-${n}`;
    if (!barreGroups.has(key)) barreGroups.set(key, []);
    barreGroups.get(key)!.push([s, f, n]);
  });

  const barres: [number, number, number][][] = [];
  const singles: [number, number, number][] = [];
  barreGroups.forEach((group) => {
    if (group.length >= 2) {
      barres.push(group);
    } else {
      singles.push(...group);
    }
  });

  const r = isLarge ? 16 : 14;

  // Render barres (adjusted for fret offset)
  barres.forEach((barre) => {
    const fret = barre[0][1];
    const fingerNum = barre[0][2];
    const strings = barre.map(([s]) => s).sort((a, b) => a - b);
    const minString = strings[0];
    const maxString = strings[strings.length - 1];

    const x1 = marginX + (6 - maxString) * stringSpacing;
    const x2 = marginX + (6 - minString) * stringSpacing;
    const adjustedFret = fret - fretOffset;
    const y = fretTop + adjustedFret * fretSpacing - fretSpacing / 2;

    // Draw a rounded bar spanning the strings
    svg += `<rect x="${x1 - r}" y="${y - r}" width="${x2 - x1 + r * 2}" height="${r * 2}" rx="${r}" fill="#1e293b" />`;
    // Finger number centered on the bar
    const cx = (x1 + x2) / 2;
    svg += `<text x="${cx}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="${
      isLarge ? 18 : 16
    }" font-weight="bold">${fingerNum}</text>`;
  });

  // Render single fingers (adjusted for fret offset)
  singles.forEach(([s, f, n]) => {
    const x = marginX + (6 - s) * stringSpacing;
    const adjustedFret = f - fretOffset;
    const y = fretTop + adjustedFret * fretSpacing - fretSpacing / 2;
    svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="#1e293b" />`;
    svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="${
      isLarge ? 18 : 16
    }" font-weight="bold">${n}</text>`;
  });

  svg += `</svg>`;
  return svg;
}
