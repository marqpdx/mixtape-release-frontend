# Offline Folio recognition seam (proposal)

Run `python3 -B -m unittest discover -s pre-tests/folio-ner -v` from mobile.
Standard library only: no downloads, model loading, network, production data,
production imports, paid server or capability registration.

`recognition.py` provides a cue matcher, adapter Protocol, boundary validator and
exact label/span evaluator. Its adapter contract is an **offline proposal**, not
Heddle's settled step contract or a new API. A caller supplies text, source revision,
context version and a versioned vocabulary; both source and context identity are
checked. Production vocabulary must come from Contour's Writing shelf. The test
vocabulary is synthetic and does not define a canonical Shape/schema copy.

The matcher spots cue words, including locale and location, with exact Python
Unicode code-point spans. Negation and simple ordinary file-location phrasing are
qualifiers, not assertions of a Shape. These heuristics have limited coverage;
they do not establish calibrated confidence. It infers no Entity names or Scenes.
`mentions` stays empty until a real recognition adapter supplies source-bound
candidates. Outputs here are **recognition candidates, not Contour Sightings**.
No status/payload fields are being added to the canonical Sighting envelope.

The evaluator measures exact labelled spans, counts duplicate predictions as
false positives, and leaves undefined empty-denominator metrics null/None. Score
cues separately from mentions; broad Shape interpretation, linking and coreference
are different tasks. Unit-test success is not model-quality evidence.

Next: agree this boundary with HD-2/HD-3; have a person review gold spans for the
existing synthetic contrast cases in the Puddlejump bundle, then add holdouts.
Implement spaCy/GLiNER/Claude adapters only after environment/model revisions and
input permission are explicit. Load a model once per process. Log package/model
revisions, cold/warm latency, memory and task size with each measured run. No model
has been installed or evaluated here; no paid benchmark run is authorized.
