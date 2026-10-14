const test = require('node:test');
const assert = require('node:assert/strict');
const {createPortraitPeople} = require('./portrait-fixture');
test('standalone dialogue source keeps one entry per line for easy editing', () => {
    const source = require('node:fs').readFileSync('src/npc-dialogue.js', 'utf8');
    for (const line of source.split('\n')) assert.ok((line.match(/"(?:[^"\\]|\\.)*"/g) || []).length <= 1, line);
});

test('all six NPC voices have five times their original dialogue pool sizes', () => {
    const {run} = createPortraitPeople();
    const counts = JSON.parse(run('JSON.stringify(NPC_PERSONALITIES.map(person => Object.fromEntries(Object.entries(person).map(([key, lines]) => [key, lines.length]))))'));
    for (const count of counts) assert.deepEqual(count, {greetings: 10, familiar: 10, rainGreetings: 10, chatter: 15, fishing: 10, rainFishing: 10, tradeDone: 5, thanks: 5});
    assert.equal(run('NPC_FISHING_TIPS.length'), 25); assert.equal(run('NPC_RUMOR_LINES.length'), 20);
    for (const pool of ['NPC_NO_RUMOR_LINES', 'NPC_RARE_BAIT_NOW_LINES', 'NPC_RARE_BAIT_SOON_LINES']) assert.equal(run(pool + '.length'), 10);
    assert.equal(run('NPC_PERSONALITIES.reduce((count, person) => count + Object.values(person).reduce((sum, lines) => sum + lines.length, 0), 0) + NPC_FISHING_TIPS.length + NPC_RUMOR_LINES.length + NPC_NO_RUMOR_LINES.length + NPC_RARE_BAIT_NOW_LINES.length + NPC_RARE_BAIT_SOON_LINES.length'), 525);
});

test('spoken lines are short, unique within each pool, and contain no dash-style pauses', () => {
    const {run} = createPortraitPeople();
    const pools = JSON.parse(run('JSON.stringify([...NPC_PERSONALITIES.flatMap(person => Object.values(person)), ...Object.values(NPC_ACTIVITY_LINES), NPC_FISHING_TIPS, NPC_RUMOR_LINES, NPC_NO_RUMOR_LINES, NPC_RARE_BAIT_NOW_LINES, NPC_RARE_BAIT_SOON_LINES])'));
    for (const pool of pools) {assert.equal(new Set(pool).size, pool.length); for (const line of pool) {assert.ok(line.length <= 145, line); assert.doesNotMatch(line, /[\u2013\u2014]|\s-\s/);}}
});

test('expanded guide conversations have valid links, joyful expressions, and at most four choices', () => {
    const {run} = createPortraitPeople(), nodes = JSON.parse(run('JSON.stringify(GUIDE_DIALOGUE)'));
    assert.ok(Object.keys(nodes).length >= 15);
    assert.ok(Object.values(nodes).filter(node => node.portraitEyesClosed).length >= 5);
    for (const node of Object.values(nodes)) {
        assert.ok(node.options.length <= 4); assert.ok(node.text.length <= 145); assert.doesNotMatch(node.text, /[\u2013\u2014]|\s-\s/);
        assert.ok(['normal', 'grin', 'openMouth'].includes(node.portraitExpression));
        for (const option of node.options) assert.ok(option.close || nodes[option.next]);
    }
});
