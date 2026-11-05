"""Offline checks for proposed Contour schemas; no runtime/bundle changes."""
from copy import deepcopy
from datetime import datetime
import re
import hashlib
import json
from pathlib import Path
import unicodedata

from jsonschema import Draft7Validator, FormatChecker, ValidationError
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parent
CANON = ROOT.parents[1].parents[2] / 'puddlejump/reference/contour'
FILES = ['shared/sighting_provenance.schema.json', 'shared/dictionary_entry.schema.json',
         'writing/character-0.2.0.schema.json', 'writing/setting-0.2.0.schema.json']
SCHEMAS = {p: json.loads((ROOT / p).read_text()) for p in FILES}
for schema in SCHEMAS.values():
    Draft7Validator.check_schema(schema)
# Registry has no network retrieval callback. All shared references are local.
REGISTRY = Registry().with_resources((s['$id'], Resource.from_contents(s)) for s in SCHEMAS.values())
FORMATS = FormatChecker()


@FORMATS.checks('date-time', raises=(ValueError, TypeError))
def checked_date_time(value):
    # jsonschema may omit date-time support when its optional dependencies are
    # absent. Register explicitly so this check cannot silently become a no-op.
    if not isinstance(value, str):
        return True
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})', value):
        return False
    datetime.fromisoformat(value.replace('Z', '+00:00'))
    return True

CHECKS = 0


def check(schema_path, value, valid=True):
    global CHECKS
    validator = Draft7Validator(SCHEMAS[schema_path], registry=REGISTRY, format_checker=FORMATS)
    try:
        validator.validate(value)
    except ValidationError:
        if valid:
            raise
    else:
        if not valid:
            raise AssertionError('Unexpectedly valid: ' + json.dumps(value))
    CHECKS += 1


actor = '00000000-0000-4000-8000-000000000001'
operation = '00000000-0000-4000-8000-000000000002'
entry_id = '00000000-0000-4000-8000-000000000003'
model = {'kind': 'model', 'model_id': 'test/model', 'model_revision': 'pinned-revision',
         'execution_action_run_id': operation}
person = {'kind': 'person', 'actor_id': actor, 'operation_id': operation,
          'recorded_at': '2026-11-05T20:00:00Z'}
dictionary = {'kind': 'dictionary', 'entry_id': entry_id, 'entry_revision': 1}
for provenance in (model, person, dictionary):
    check(FILES[0], provenance)
check(FILES[0], {**person, 'actor_id': 'not-a-uuid'}, False)
check(FILES[0], {**person, 'recorded_at': '2026-99-99T20:00:00Z'}, False)
check(FILES[0], {**person, 'recorded_at': '2026-11-05T20:00:00+01:00'}, False)
check(FILES[0], {**person, 'confidence': 'high'}, False)
check(FILES[0], {**dictionary, 'entry_revision': 0}, False)
check(FILES[0], {**model, 'model_revision': '   '}, False)

for name in ('character', 'setting'):
    path = f'writing/{name}-0.2.0.schema.json'
    for provenance in (model, person, dictionary):
        sighting = {'sighting_id': 's1', 'shape_id': f'writing.{name}', 'shape_version': '0.2.0',
                    'name_as_said': 'Mary', 'source_locator': [{'source_ref': 'note:1', 'source_revision': 0,
                        'start': 2, 'end': 6, 'quote': 'Mary'}], 'uncertain': [], 'provenance': provenance}
        if provenance['kind'] == 'model':
            sighting['confidence'] = 'medium'
        check(path, sighting)
        bad = deepcopy(sighting)
        if provenance['kind'] == 'model':
            del bad['confidence']
        else:
            bad['confidence'] = 'high'
        check(path, bad, False)
        if provenance['kind'] != 'model':
            bad['confidence'] = None
            check(path, bad, False)
        bad = deepcopy(sighting)
        bad['status'] = 'confirmed'
        check(path, bad, False)
        bad = deepcopy(sighting)
        del bad['provenance']
        check(path, bad, False)
        bad = deepcopy(sighting)
        bad['shape_version'] = '0.1.0'
        check(path, bad, False)

value = {'entry_id': entry_id, 'revision': 1, 'shape_id': 'writing.character', 'shape_version': '0.2.0',
         'names': {'main': 'Mary', 'variants': ['M.']}, 'provenance': person}
check(FILES[1], value)
check(FILES[1], {**value, 'provenance': model}, False)
check(FILES[1], {**value, 'provenance': dictionary}, False)
check(FILES[1], {**value, 'entity_id': actor}, False)  # storage wrapper, not Contour value
check(FILES[1], {**value, 'names': {'main': '   ', 'variants': []}}, False)
check(FILES[1], {**value, 'names': {'main': 'Mary', 'variants': ['M.', 'M.']}}, False)
check(FILES[1], {**value, 'names': {'main': 'Mary', 'variants': ['x'] * 33}}, False)
check(FILES[1], {**value, 'note': 'x' * 2001}, False)
# Neutral value does not hardcode Fiction; actual type availability is a service check.
check(FILES[1], {**value, 'shape_id': 'tincture.ingredient', 'shape_version': '1.0.0'})

sources = json.loads((ROOT / 'DRAFT_SOURCES.json').read_text())['canonical_files_sha256']
for path, expected in sources.items():
    assert hashlib.sha256((CANON / path).read_bytes()).hexdigest() == expected, path
    old = json.loads((CANON / path).read_text())
    assert old['properties']['shape_version']['const'] == '0.1.0'
    assert 'confidence' in old['required'] and 'provenance' not in old['required']

key = lambda value: unicodedata.normalize('NFC', unicodedata.normalize('NFC', value).casefold())
assert key('E\u0301lodie') == key('ÉLODIE')
assert key('Straße') == key('STRASSE')
assert len('Straße') != len(key('Straße'))  # original offset alignment required
assert key('Cafe') != key('Café')  # no accent stripping
print(f'{CHECKS} schema cases passed; source hashes/old versions unchanged; Unicode rule checks passed.')
print('Proposal only: no canonical resources, bundle, API or migration changed.')
