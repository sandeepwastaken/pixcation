import json
import random
import subprocess
import sys
import time
import threading
from pathlib import Path
import z3
ROOT = Path(__file__).resolve().parents[1]
def compile_targets(targets, model):
    compiled = []
    for target in targets:
        if not isinstance(target, dict) or not isinstance(target.get('rolls', {}), dict) or not isinstance(target.get('look', {}), dict):
            raise ValueError('NPC targets need optional rolls and look objects')
        if any(key in target and not isinstance(target[key], str) for key in ['name', 'firstName']):
            raise ValueError('NPC names must be strings')
        if any(not str(key).isdecimal() or not 0 <= int(key) <= 20 for key in target.get('look', {})):
            raise ValueError('Invalid final appearance index')
        copy = dict(target, rolls=dict(target.get('rolls', {})))
        name = target.get('firstName') or target.get('name', '').split(' ')[0]
        if name in model['rareNames'] and model['rareNames'][name]:
            values = model['rareNames'][name]
            copy['rolls'].setdefault('22', [min(values), max(values)])
        if target.get('name') and ' ' not in target['name']:
            copy['rolls'].setdefault('20', 0)
        look = target.get('look', {})
        if '1' in look:
            face = integer(look['1'], 0, 2, 'face style')
            start = sum(model['faces'][:face])
            copy['rolls'].setdefault('4', [start, start + model['faces'][face] - 1])
        if '14' in look:
            copy['rolls'].setdefault('18', integer(look['14'], 0, 1, 'gender'))
        if all(key in look for key in ['1', '2', '14']):
            profile = ('young' if look['1'] == 1 else 'older' if look['1'] == 2 else '') + ('Female' if look['14'] else 'Male')
            weights = model['styles'][profile if look['1'] else profile.lower()]
            shirt = integer(look['2'], 0, len(weights) - 1, 'shirt style')
            total, values = sum(weights), []
            for roll in range(model['radices'][5]):
                value, limit = (roll + 0.5) / model['radices'][5] * total, 0
                for index, weight in enumerate(weights):
                    limit += weight
                    if value < limit:
                        if index == shirt:
                            values.append(roll)
                        break
            if not values:
                raise ValueError('Shirt is unavailable for this age and gender')
            copy['rolls'].setdefault('5', [min(values), max(values)])
        compiled.append(copy)
    return compiled
def runtime(request):
    result = subprocess.run(['node', str(ROOT / 'tools/seed-runtime.js')], input=json.dumps(request), text=True, capture_output=True, timeout=30, check=True, cwd=ROOT)
    return json.loads(result.stdout)
def sample_anchors(targets, radices, anchor_coordinate, coefficient, multiplier, limit, random_seed):
    rng, modulus = random.Random(random_seed), 1 << 256
    prefixes, product = [], 1
    for radix in radices:
        prefixes.append(product)
        product *= radix
    for number in range(limit):
        target = targets[number % len(targets)]
        rolls = [rng.randrange(radix) for radix in radices]
        for index, low, high in domains(target, radices):
            rolls[index] = rng.randint(low, high)
        payload = sum(roll * prefix for roll, prefix in zip(rolls, prefixes))
        word = payload + rng.randrange((modulus - 1 - payload) // product + 1) * product
        coordinate = (target['x'] & 0xffffffff) << 32 | (target['y'] & 0xffffffff)
        yield ((word ^ word >> 128) - (coordinate - anchor_coordinate) * coefficient * multiplier) % modulus
def verify_candidate(anchor_value, anchor_coordinate, coefficient, offset, multiplier, base, targets, radices):
    modulus = 1 << 256
    value = (anchor_value * pow(multiplier, -1, modulus) - anchor_coordinate * coefficient - offset) % modulus
    if value < 1 << 21:
        return None
    seed = str(value << 32 | base)
    actual = runtime({'action': 'verify', 'seed': seed, 'targets': targets})
    for row, target in zip(actual, targets):
        row['matched'] = row['matched'] and all(low <= row['rolls'][index] <= high for index, low, high in domains(target, radices))
    return {'seed': seed, 'verifiedMatches': sum(row['matched'] for row in actual), 'residents': actual}
def raw_match_count(anchor_value, prepared):
    matched, mask = 0, (1 << 256) - 1
    for delta, conditions in prepared:
        word = (anchor_value + delta) & mask
        folded = word ^ word >> 128
        matched += all(low <= (folded // prefix) % radix <= high for prefix, radix, low, high in conditions)
    return matched
def integer(value, low, high, label):
    if isinstance(value, bool) or not isinstance(value, int) or not low <= value <= high:
        raise ValueError('Invalid ' + label)
    return value
def domains(target, radices):
    result = []
    for key, value in target.get('rolls', {}).items():
        if not isinstance(key, str) or not key.isdecimal():
            raise ValueError('Invalid appearance roll index')
        index = integer(int(key), 0, len(radices) - 1, 'appearance roll index')
        bounds = value if isinstance(value, list) and len(value) == 2 else [value, value]
        low = integer(bounds[0], 0, radices[index] - 1, 'roll lower bound')
        high = integer(bounds[1], low, radices[index] - 1, 'roll upper bound')
        result.append((index, low, high))
    return result
def solve(request):
    if not isinstance(request, dict):
        raise ValueError('Seed search request must be a JSON object')
    base = integer(request.get('worldSeed'), 1, 0xffffffff, 'terrain seed')
    targets = request.get('targets')
    if not isinstance(targets, list) or not 1 <= len(targets) <= 256 or any(not isinstance(target, dict) for target in targets):
        raise ValueError('Provide between one and 256 NPC targets')
    minimum = integer(request.get('minimumMatches', len(targets)), 1, len(targets), 'minimum matches')
    timeout = integer(request.get('timeoutSeconds', 30), 1, 300, 'timeout')
    maximum = integer(request.get('maxCandidates', 100), 1, 10000, 'candidate limit')
    samples = integer(request.get('sampleCandidates', 10000), 0, 1000000, 'sample limit')
    random_seed = integer(request.get('randomSeed', 0), 0, 0x7fffffff, 'solver random seed')
    memory = integer(request.get('memoryMB', 512), 64, 2048, 'memory budget')
    progress = bool(request.get('progress', False))
    z3.set_param('memory_max_size', memory)
    model = runtime({'action': 'model', 'worldSeed': base})
    targets = compile_targets(targets, model)
    radices = model['radices']
    coefficient, offset, multiplier = map(int, model['constants'])
    anchor = z3.BitVec('anchor', 256)
    solver = z3.Solver()
    solver.set(timeout=timeout * 1000)
    solver.set(random_seed=random_seed)
    solver.set(max_memory=memory, threads=1)
    family = model['family']
    matches, prepared, modulus = [], [], 1 << 256
    anchor_coordinate = (integer(targets[0].get('x'), -0x80000000, 0x7fffffff, 'NPC x coordinate') & 0xffffffff) << 32 | (integer(targets[0].get('y'), -0x80000000, 0x7fffffff, 'NPC y coordinate') & 0xffffffff)
    origin = anchor - anchor_coordinate * coefficient * multiplier
    family_selector = z3.URem(z3.UDiv(origin, int(family['period']) ** 2 * int(family['span'])), int(family['interval']))
    solver.add(family_selector != int(family['mark']))
    for number, target in enumerate(targets):
        if not isinstance(target, dict):
            raise ValueError('Invalid NPC target')
        x = integer(target.get('x'), -0x80000000, 0x7fffffff, 'NPC x coordinate')
        y = integer(target.get('y'), -0x80000000, 0x7fffffff, 'NPC y coordinate')
        coordinate = (x & 0xffffffff) << 32 | (y & 0xffffffff)
        delta = ((coordinate - anchor_coordinate) * coefficient * multiplier) % modulus
        word = anchor + delta
        folded = word ^ z3.LShR(word, 128)
        prefix, prefixes = 1, []
        for radix in radices:
            prefixes.append(prefix)
            prefix *= radix
        conditions, raw_conditions = [], []
        for index, low, high in domains(target, radices):
            roll = z3.URem(z3.UDiv(folded, prefixes[index]), radices[index])
            conditions.extend([z3.UGE(roll, low), z3.ULE(roll, high)])
            raw_conditions.append((prefixes[index], radices[index], low, high))
        matches.append(z3.And(*conditions))
        prepared.append((delta, raw_conditions))
    solver.add(z3.PbGe([(match, 1) for match in matches], minimum))
    if 'fixedSeed' in request:
        fixed = int(request['fixedSeed'])
        if fixed <= 2 ** 53 - 1 or fixed >= 2 ** 288 or fixed & 0xffffffff != base:
            raise ValueError('Fixed seed must be an ordinary large numeric seed with the requested terrain')
        solver.add(anchor == ((fixed >> 32) + anchor_coordinate * coefficient + offset) * multiplier % modulus)
    deadline, rejected = time.monotonic() + timeout, 0
    best, sampled = None, 0
    if 'fixedSeed' not in request:
        for anchor_value in sample_anchors(targets, radices, anchor_coordinate, coefficient, multiplier, samples, random_seed):
            if time.monotonic() >= deadline:
                break
            sampled += 1
            if ((anchor_value - anchor_coordinate * coefficient * multiplier) % modulus) // (int(family['period']) ** 2 * int(family['span'])) % int(family['interval']) == int(family['mark']): continue
            if raw_match_count(anchor_value, prepared) <= (best['verifiedMatches'] if best else 0):
                continue
            verified = verify_candidate(anchor_value, anchor_coordinate, coefficient, offset, multiplier, base, targets, radices)
            if verified and (best is None or verified['verifiedMatches'] > best['verifiedMatches']):
                best = verified
                if progress: print(json.dumps({'bestSeed': best['seed'], 'verifiedMatches': best['verifiedMatches'], 'sampledCandidates': sampled}), file=sys.stderr, flush=True)
            if verified and verified['verifiedMatches'] >= minimum:
                return dict(verified, status='sat', sampledCandidates=sampled, rejectedCandidates=rejected)
    while rejected < maximum:
        remaining = int((deadline - time.monotonic()) * 1000)
        if remaining <= 0:
            return {'status': 'unknown', 'reason': 'timeout', 'rejectedCandidates': rejected, 'sampledCandidates': sampled, 'best': best}
        solver.set(timeout=remaining)
        watchdog = threading.Timer(remaining / 1000, solver.ctx.interrupt); watchdog.daemon = True; watchdog.start()
        try: status = solver.check()
        except z3.Z3Exception as error:
            return {'status': 'unknown', 'reason': str(error), 'best': best, 'sampledCandidates': sampled, 'rejectedCandidates': rejected}
        finally: watchdog.cancel()
        if status != z3.sat:
            return {'status': str(status), 'reason': solver.reason_unknown() if status == z3.unknown else 'No numeric seed satisfies these constraints', 'rejectedCandidates': rejected, 'sampledCandidates': sampled, 'best': best}
        anchor_value = solver.model().eval(anchor, model_completion=True).as_long()
        verified = verify_candidate(anchor_value, anchor_coordinate, coefficient, offset, multiplier, base, targets, radices)
        if verified and verified['verifiedMatches'] >= minimum:
            return dict(verified, status='sat', rejectedCandidates=rejected, sampledCandidates=sampled)
        if verified and (best is None or verified['verifiedMatches'] > best['verifiedMatches']): best = verified
        rejected += 1
        solver.add(anchor != anchor_value)
    return {'status': 'unknown', 'reason': 'Candidate verification limit reached', 'rejectedCandidates': rejected, 'sampledCandidates': sampled, 'best': best}
if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] in ['--help', '-h']:
        print('Usage: .venv/bin/python tools/seed-search.py request.json. See tools/SEEDS.md for constraints and limits.')
        sys.exit(0)
    try:
        request = json.loads(Path(sys.argv[1]).read_text()) if len(sys.argv) == 2 else json.load(sys.stdin)
        print(json.dumps(solve(request)))
    except (ValueError, KeyError, TypeError, subprocess.SubprocessError, OSError) as error:
        print(json.dumps({'status': 'error', 'reason': str(error)}))
        sys.exit(1)
