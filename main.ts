// Sizzle & Serve: Kucing Chef's Kitchen — the hand-in program (Node 22, stdlib only).
// It copies this repository's game/ and screenshots/ into the grader's output
// directory and writes /output/dossier.json with the kit's vendored library, so
// the sealed gate can check the files and the judge can read the dossier.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program writes the same bytes on every run: it copies files as they are
// and the dossier is a pure function of those files.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
if (!existsSync(join(out, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing: the entry has no playable game');
}

// The gate's own caps, as the kit's RULES.txt states them: the dossier text is
// capped at 160 KiB, at most 4 screenshots of 256 KiB, game/ at most 993 files
// and 48 MiB with paths under 1,000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
