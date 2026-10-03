const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const source = ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'runtime/progress.js']
    .map(file => fs.readFileSync(path.join(ROOT, 'src', file), 'utf8')).join('\n');

function createSession(saved, options = {}) {
    const writes = [];
    const items = [];
    const erased = [];
    const context = vm.createContext({
        TEST_MODE: Boolean(options.testMode),
        localStorage: {
            getItem(key) {
                assert.equal(key, 'pixcation-save-v1');
                if (options.failRead) throw new Error('Storage unavailable');
                return typeof saved === 'string' ? saved : JSON.stringify(saved ?? null);
            },
            setItem(key, value) {
                if (options.failWrite) throw new Error('Storage full');
                writes.push([key, value]);
            }
        },
        addHotbarItem: (scene, icon, label) => items.push([icon, label]),
        refreshBaitSlot() {},
        refreshMarketOptions() {},
        eraseChestSilhouette: chunk => erased.push(chunk.chest.id)
    });
    vm.runInContext(source, context);
    return {
        writes, items, erased,
        load: () => context.loadProgress({}),
        save: () => context.saveProgress(),
        run: code => vm.runInContext(code, context)
    };
}

function persisted(session) {
    session.run('saveDirty = true');
    session.save();
    assert.equal(session.writes.at(-1)[0], 'pixcation-save-v1');
    return JSON.parse(session.writes.at(-1)[1]);
}

test('player progress survives a save and load round trip', () => {
    const saved = {
        version: 1, coins: 123, rods: ['basic', 'master'], fish: [['bluegill', 2], ['goldfish', 1]],
        catchLog: ['bluegill', 'goldfish'], explored: [-123, 4], bait: [['trainer', 5]],
        activeBait: 'trainer', chests: [-31, 10], guideMet: true
    };
    const session = createSession(saved);
    session.load();
    assert.deepEqual(persisted(session), saved);
    assert.equal(session.run('coinDisplay.value'), 123);
    assert.equal(session.run('saveDirty'), false);
    assert.equal(session.items.length, 2);
});

test('legacy gear and fish IDs migrate without losing catches', () => {
    const session = createSession({
        version: 1, rods: ['sturdy', 'iron', 'intermediate', 'unknown'],
        fish: [['minnow', 2], ['common-minnow', 3], ['carp', 4], ['bass', 1], ['catfish', 2], ['koi', 3]],
        catchLog: ['minnow', 'carp', 'bass', 'catfish', 'koi', 'unknown']
    });
    session.load();
    const saved = persisted(session);
    assert.deepEqual(saved.rods, ['intermediate', 'master']);
    assert.deepEqual(saved.fish, [['common-minnow', 5], ['common-carp', 4], ['largemouth-bass', 1], ['channel-catfish', 2], ['goldfish', 3]]);
    assert.deepEqual(saved.catchLog, ['common-minnow', 'common-carp', 'largemouth-bass', 'channel-catfish', 'goldfish']);
    assert.equal(session.items.length, 2);
});

test('invalid saved values keep defaults and valid entries still load', () => {
    const session = createSession({
        version: 1, coins: -4, guideMet: 'true', rods: 'basic', catchLog: {},
        fish: [['bluegill', 0], ['goldfish', 1.5], ['unknown', 10], ['roach', 3]],
        explored: [1.2, Number.MAX_SAFE_INTEGER + 1, 3, -4],
        bait: [['novice', -1], ['trainer', 2], ['trainer', 5], ['unknown', 8]],
        activeBait: 'unknown', chests: [null, '4', 7]
    });
    session.load();
    const saved = persisted(session);
    assert.equal(saved.coins, 100);
    assert.equal(saved.guideMet, false);
    assert.deepEqual(saved.rods, []);
    assert.deepEqual(saved.catchLog, []);
    assert.deepEqual(saved.fish, [['roach', 3]]);
    assert.deepEqual(saved.explored, [3, -4]);
    assert.deepEqual(saved.bait, [['trainer', 5]]);
    assert.equal(saved.activeBait, null);
    assert.deepEqual(saved.chests, [7]);
});

test('missing, corrupt, and unsupported saves leave the game unchanged', () => {
    for (const saved of [undefined, '{broken', { version: 2, coins: 500 }, { version: '1', coins: 500 }]) {
        const session = createSession(saved);
        assert.doesNotThrow(session.load);
        assert.equal(session.run('playerCoins'), 100);
        assert.equal(session.run('mapDirty'), false);
        assert.equal(session.items.length, 0);
    }
});

test('storage failures keep unsaved progress eligible for a retry', () => {
    const options = { failRead: true, failWrite: true };
    const session = createSession(null, options);
    assert.doesNotThrow(session.load);
    session.run('playerCoins = 345; saveDirty = true');
    assert.doesNotThrow(session.save);
    assert.equal(session.run('saveDirty'), true);
    assert.equal(session.writes.length, 0);
    options.failWrite = false;
    session.save();
    assert.equal(JSON.parse(session.writes[0][1]).coins, 345);
    assert.equal(session.run('saveDirty'), false);
});

test('clean progress, new game resets, and test mode skip storage writes', () => {
    const session = createSession();
    session.save();
    assert.equal(session.writes.length, 0);
    session.run('newGameResetting = true; saveDirty = true');
    session.save();
    assert.equal(session.writes.length, 0);
    session.run('newGameResetting = false');
    session.save();
    session.save();
    assert.equal(session.writes.length, 1);
    const testSession = createSession(null, { testMode: true });
    testSession.run('saveDirty = true');
    testSession.save();
    assert.equal(testSession.writes.length, 0);
});

test('opening saved chests removes only their loaded silhouettes', () => {
    const session = createSession({ version: 1, chests: [17] });
    session.run('loadedWaterChunks.add({ chest: { id: 17 } }); loadedWaterChunks.add({ chest: { id: 23 } }); loadedWaterChunks.add({ chest: null })');
    session.load();
    assert.deepEqual(session.erased, [17]);
    assert.equal(session.run('mapDirty'), true);
});


test('malformed inventory rows do not prevent valid progress from loading', () => {
    const session = createSession({
        version: 1, coins: 250, rods: [null, {}, 'basic'],
        fish: [null, 7, {}, 'bluegill', [], ['bluegill'], ['bluegill', 2, 3], [{ toString: null }, 5], ['roach', 3]],
        catchLog: [null, { toString: null }, 'roach'],
        bait: [null, false, {}, 'trainer', ['trainer'], ['trainer', 2, 3], ['novice', 4]],
        activeBait: 'novice', explored: [7], chests: [8], guideMet: true
    });
    assert.doesNotThrow(session.load);
    const saved = persisted(session);
    assert.equal(saved.coins, 250);
    assert.deepEqual(saved.rods, ['basic']);
    assert.deepEqual(saved.fish, [['roach', 3]]);
    assert.deepEqual(saved.catchLog, ['roach']);
    assert.deepEqual(saved.bait, [['novice', 4]]);
    assert.equal(saved.activeBait, 'novice');
    assert.deepEqual(saved.explored, [7]);
    assert.deepEqual(saved.chests, [8]);
    assert.equal(saved.guideMet, true);
});

test('unsafe saved amounts cannot overflow inventory counts or coins', () => {
    const session = createSession({
        version: 1, coins: Number.MAX_SAFE_INTEGER + 1,
        fish: [['roach', Number.MAX_SAFE_INTEGER], ['roach', 1], ['bluegill', Number.MAX_SAFE_INTEGER + 1]],
        bait: [['novice', Number.MAX_SAFE_INTEGER + 1], ['trainer', 4]]
    });
    session.load();
    const saved = persisted(session);
    assert.equal(saved.coins, 100);
    assert.deepEqual(saved.fish, [['roach', Number.MAX_SAFE_INTEGER]]);
    assert.deepEqual(saved.bait, [['trainer', 4]]);
});
