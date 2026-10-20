# Validate shuttle.idea

1. Validate `idea.schema.json` at pinned version `0.1.0`.
2. Core checks every quoted span against the immutable source using Unicode
   code-point offsets, inclusive start and exclusive end.
3. Core checks Sighting ids and typed references across the whole response.
4. Preserve uncertainty; confidence is not a database match score.
5. A valid Sighting remains provisional until human confirmation. It cannot
   create Commons rows or authorize publication.

See `shuttle.interpretation.contract.validate_findings` for deterministic
whole-weave span, graph, story-fidelity and reference checks.
