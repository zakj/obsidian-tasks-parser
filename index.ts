export interface ObsidianTask {
  statusChar: string;
  description: string;
  indentation: string;
  priority: Priority;
  startDate: string;
  scheduledDate: string;
  dueDate: string;
  doneDate: string;
  recurrence: string;
  blockLink: string;
}

export const Priority = {
  High: 1,
  Medium: 2,
  None: 3,
  Low: 4,
} as const;
export type Priority = typeof Priority[keyof typeof Priority];

const priorities = new Map([
  ['⏫', Priority.High],
  ['🔼', Priority.Medium],
  ['🔽', Priority.Low],
]);
const priorityFlags = [...priorities.keys()].join('');

const dateTypes = new Map([
  ['🛫', 'start'],
  ['⏳', 'scheduled'],
  ['⌛', 'scheduled'],
  ['📅', 'due'],
  ['📆', 'due'],
  ['🗓', 'due'],
  ['✅', 'done'],
]);
const dateFlags = [...dateTypes.keys()].join('');

const taskRe = /^([ \t]*)[-*] +\[(.)\] *(.*)$/u;
const priorityRe = new RegExp(` *([${priorityFlags}])`, 'u');
const dateRe = new RegExp(
  String.raw` *(?<type>[${dateFlags}]) *(?<date>\d\d\d\d-\d\d-\d\d)`,
  'gu'
);
const recurrenceRe = / *🔁([a-zA-Z0-9, !]+)/u;
const blockLinkRe = / *(\^[a-zA-Z0-9-]+)/u;

export function parseDocument(doc: string, statusFilter = '.'): ObsidianTask[] {
  const allTasksRe = new RegExp(
    String.raw`^[ \t]*[-*] +\[${statusFilter}\].*$`,
    'gmu'
  );
  return [...doc.matchAll(allTasksRe)].map((match) => parseLine(match[0]));
}

export function parseLine(line: string): ObsidianTask {
  const match = line.match(taskRe);
  if (!match) return null;
  const [indentation, statusChar, description] = match.slice(1);

  const priority = priorities.get(line.match(priorityRe)?.[1]) || Priority.None;
  const dates = new Map(
    [...line.matchAll(dateRe)].map((m) => [
      dateTypes.get(m.groups.type),
      m.groups.date,
    ])
  );
  const recurrence = line.match(recurrenceRe)?.[1].trim();
  const blockLink = line.match(blockLinkRe)?.[1];

  return {
    indentation,
    statusChar,
    description: [priorityRe, dateRe, recurrenceRe, blockLinkRe]
      .reduce((d, re) => d.replace(re, ''), description)
      .trim(),
    priority,
    startDate: dates.get('start'),
    scheduledDate: dates.get('scheduled'),
    dueDate: dates.get('due'),
    doneDate: dates.get('done'),
    recurrence,
    blockLink,
  };
}
