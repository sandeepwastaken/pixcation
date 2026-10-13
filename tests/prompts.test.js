const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('snapping popup widths includes padding once and preserves pixel-grid sizing', () => {
    const context = vm.createContext({}); vm.runInContext(['runtime/settings.js', 'runtime/state.js', 'ui/elements.js', 'ui/prompts.js'].map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext('const document = {createElement() {return {style:{}, textContent:"", append() {}, appendChild() {}, getBoundingClientRect() {return {width:(this.style.width ? parseFloat(this.style.width) + (this.style.boxSizing === "border-box" ? 0 : 12) : 108) * 4};}};}}; function addHudLayer(scene,node) {return {node:{getBoundingClientRect() {return {width:1280};}}};} createInteractionPromptUI({}); itemPrompt.style.display = "flex"; itemPrompt.label.textContent = "Master Rod"; const before = itemPrompt.getBoundingClientRect().width; snapPromptWidth(itemPrompt);', context);
    assert.equal(vm.runInContext('itemPrompt.getBoundingClientRect().width', context), vm.runInContext('before', context)); assert.equal(vm.runInContext('itemPrompt.style.width', context), '108px'); assert.equal(vm.runInContext('[marketPrompt,guidePrompt,itemPrompt,npcPrompt].every(box=>box.style.boxSizing === "border-box")', context), true);
});

test('the guide talk prompt remains available after dismissing her invitation without marking her as met', () => {
    const run = createPrompts(); run(fs.readFileSync('src/ui/interactions.js', 'utf8'));
    run('guideHasMetPlayer = false; guideInvitationShown = true; updateInteractionPrompt(scene, 0.5, Infinity);');
    assert.equal(run('promptState'), 2); assert.equal(run('guidePrompt.style.display'), 'flex');
    assert.equal(run('guideHasMetPlayer'), false);
    run('dialogueOpen = true; updateInteractionPrompt(scene, 0.5, Infinity)');
    assert.equal(run('promptState'), 0);
    run('dialogueOpen = false; updateInteractionPrompt(scene, 0.5, Infinity)');
    assert.equal(run('promptState'), 2);
});

function createPrompts() {
    const context = vm.createContext({});
    vm.runInContext(['runtime/settings.js', 'runtime/state.js', 'ui/elements.js', 'ui/prompts.js'].map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext('let nearestNpc = {name: "Emz", state: "idle"}; const scene = {time: {now: 100}, tweens: {killTweensOf() {}, add() {}}}; const box = () => ({style: {}, label: {textContent: ""}}); marketPrompt = box(); guidePrompt = box(); itemPrompt = box(); npcPrompt = box(); interactionPromptLayer = {setVisible() {}}; applyPromptMotion = snapPromptWidth = () => {}; setUITextContent = (element, value) => {element.textContent = value;};', context);
    return code => vm.runInContext(code, context);
}

test('resident interaction hints remain visible without borrowing the item notification timeout', () => {
    const run = createPrompts();
    run('updateInteractionPrompt(scene, Infinity, Infinity)');
    assert.equal(run('promptState'), 8);
    assert.equal(run('npcPrompt.label.textContent'), '- talk to Emz');
    run('scene.time.now = 100000; updateInteractionPrompt(scene, Infinity, Infinity)');
    assert.equal(run('promptState'), 8);
    assert.equal(run('itemLabelUntil'), 0);
    run('nearestNpc.name = "Jessie"; updateInteractionPrompt(scene, Infinity, Infinity)');
    assert.equal(run('npcPrompt.label.textContent'), '- talk to Jessie');
});

test('item notices temporarily take priority and resident hints return when they expire', () => {
    const run = createPrompts();
    run('itemLabelUntil = 200; updateInteractionPrompt(scene, Infinity, Infinity)');
    assert.equal(run('promptState'), 4);
    assert.equal(run('npcPrompt.style.display'), 'none');
    run('scene.time.now = 201; updateInteractionPrompt(scene, Infinity, Infinity)');
    assert.equal(run('promptState'), 8);
    assert.equal(run('npcPrompt.style.display'), 'flex');
});

test('dialogue, reveal screens, and absent or indoor residents suppress NPC hints', () => {
    for (const condition of ['dialogueOpen = true', 'catchCardUntil = Infinity', 'nearestNpc = null', 'nearestNpc.state = "home"']) {
        const run = createPrompts();
        run(condition + '; updateInteractionPrompt(scene, Infinity, Infinity)');
        assert.equal(run('promptState'), 0);
    }
});
