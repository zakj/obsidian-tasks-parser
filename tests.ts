import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { parseDocument as doc, parseLine as line, Priority } from './index';

const parseDocument = suite('parseDocument');
const parseLine = suite('parseLine');

parseDocument('multiple tasks', () => {
  const document = `
- [ ] one
- [ ] two
`;
  assert.is(doc(document).length, 2);
});

parseDocument('indented tasks', () => {
  const document = `
  - [ ] one
  - [ ] two`;
  assert.is(doc(document).length, 2);
});

parseDocument('statusChar filter', () => {
  const document = `
- [x] one
- [ ] two
- [ ] three`;
  assert.is(doc(document, ' ').length, 2);
  assert.is(doc(document, 'x').length, 1);
});

parseLine('simple', () => {
  const task = line('- [ ] my task description');
  assert.equal(task, {
    indentation: '',
    statusChar: ' ',
    description: 'my task description',
    priority: 3,
    startDate: undefined,
    scheduledDate: undefined,
    dueDate: undefined,
    doneDate: undefined,
    recurrence: undefined,
    blockLink: undefined,
  });
});

parseLine('trim whitespace', () => {
  assert.is(line('- [ ]  some  whitespace  ').description, 'some  whitespace');
});

parseLine('indentation', () => {
  assert.is(line('- [ ] a').indentation, '');
  assert.is(line('  - [ ] a').indentation, '  ');
  assert.is(line('\t- [ ] a').indentation, '\t');
});

parseLine('indentation must be whitespace', () => {
  assert.not(line('a- [ ] a'));
  assert.not(line('\n- [ ] a'));
});

parseLine('statusChar', () => {
  assert.is(line('- [ ] a').statusChar, ' ');
  assert.is(line('- [x] a').statusChar, 'x');
  assert.is(line('- [X] a').statusChar, 'X');
});

parseLine('statusChar must be a single character', () => {
  assert.not(line('- [] a'));
  assert.not(line('- [xx] a'));
});

parseLine('priority', () => {
  assert.is(line('- [ ] a').priority, Priority.None);
  assert.is(line('- [ ] a ⏫').priority, Priority.High);
  assert.is(line('- [ ] a 🔼').priority, Priority.Medium);
  assert.is(line('- [ ] a 🔽').priority, Priority.Low);
});

parseLine('startDate', () => {
  assert.is(line('- [ ] a 🛫 2022-01-01').startDate, '2022-01-01');
});

parseLine('scheduledDate', () => {
  assert.is(line('- [ ] a ⏳ 2022-01-01').scheduledDate, '2022-01-01');
  assert.is(line('- [ ] a ⌛ 2022-01-02').scheduledDate, '2022-01-02');
});

parseLine('dueDate', () => {
  assert.is(line('- [ ] a 📅 2022-01-01').dueDate, '2022-01-01');
  assert.is(line('- [ ] a 📆 2022-01-02').dueDate, '2022-01-02');
  assert.is(line('- [ ] a 🗓 2022-01-03').dueDate, '2022-01-03');
});

parseLine('doneDate', () => {
  assert.is(line('- [ ] a ✅ 2022-01-01').doneDate, '2022-01-01');
});

parseLine('recurrence', () => {
  assert.is(line('- [ ] a 🔁 every day').recurrence, 'every day');
});

parseLine('blockLink', () => {
  assert.is(line('- [ ] a ^abc123').blockLink, '^abc123');
});

parseLine('multiple dates', () => {
  const task = line(
    '- [ ] a 🛫 2000-01-01 ⏳ 2000-02-02 📅 2000-03-03 ✅ 2000-03-01'
  );
  assert.is(task.startDate, '2000-01-01');
  assert.is(task.scheduledDate, '2000-02-02');
  assert.is(task.dueDate, '2000-03-03');
  assert.is(task.doneDate, '2000-03-01');
});

parseLine('multiple dates in non-standard order', () => {
  const task = line(
    '- [ ] a ✅ 2000-03-01 📅 2000-03-03 ⏳ 2000-02-02 🛫 2000-01-01'
  );
  assert.is(task.startDate, '2000-01-01');
  assert.is(task.scheduledDate, '2000-02-02');
  assert.is(task.dueDate, '2000-03-03');
  assert.is(task.doneDate, '2000-03-01');
});

parseLine('everything', () => {
  const task = line(
    '  - [x] my split ⏫ description 🔁 every Sunday 🛫 2000-01-01 ⏳ 2000-02-02 📅 2000-03-03 ✅ 2000-03-01 ^abcdef'
  );
  assert.equal(task, {
    indentation: '  ',
    statusChar: 'x',
    description: 'my split description',
    priority: 1,
    startDate: '2000-01-01',
    scheduledDate: '2000-02-02',
    dueDate: '2000-03-03',
    doneDate: '2000-03-01',
    recurrence: 'every Sunday',
    blockLink: '^abcdef',
  });
});

parseDocument.run();
parseLine.run();
