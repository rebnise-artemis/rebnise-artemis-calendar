import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildCalendar } from '../lib/ical.js';
import { validateScheduleFile } from '../lib/schedule.js';

const ROOT = new URL('../', import.meta.url);

const SOURCES = [
  { file: 'data/rebnise.json', out: 'calendars/rebnise.ics' },
  { file: 'data/artemis.json', out: 'calendars/artemis.ics' },
];

export function toEntries(scheduleFile) {
  return scheduleFile.games.map((game) => ({
    game,
    sport: scheduleFile.sport,
    teamShort: scheduleFile.teamShort,
  }));
}

async function loadSchedule(file) {
  const data = JSON.parse(await readFile(new URL(file, ROOT), 'utf8'));
  const errors = validateScheduleFile(data);
  if (errors.length > 0) {
    throw new Error(`${file} が不正です:\n  ${errors.join('\n  ')}`);
  }
  return data;
}

async function main() {
  await mkdir(new URL('calendars/', ROOT), { recursive: true });

  const allEntries = [];

  for (const { file, out } of SOURCES) {
    const schedule = await loadSchedule(file);
    const entries = toEntries(schedule);
    allEntries.push(...entries);

    const ics = buildCalendar(entries, `${schedule.team} ${schedule.season}`);
    await writeFile(new URL(out, ROOT), ics, 'utf8');
    console.log(`${out} を生成しました（${entries.length}件）`);
  }

  const allIcs = buildCalendar(allEntries, 'レブナイズ・アルテミス 2026-27');
  await writeFile(new URL('calendars/all.ics', ROOT), allIcs, 'utf8');
  console.log(`calendars/all.ics を生成しました（${allEntries.length}件）`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
