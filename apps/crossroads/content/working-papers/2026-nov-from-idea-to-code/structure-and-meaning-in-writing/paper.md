---
title: 'Research spike: finding structure and meaning in bodies of writing'
version: '0.9'
date: '2026-11-01'
summary: 'The research brief behind reading for meaning: how named-entity recognition and related techniques could help people discover the people, places and ideas in their own writing, and build navigable, curated knowledge from them, running locally where possible.'
names: '*Folio* is a curated body of writing; *Daedalus* gathers research; *Contour* holds the shapes readers follow; *Catalyst* holds canon; *GLiNER* and *spaCy* are small models we can run ourselves.'
status: draft
---

**Project:** Mixtape  
**Focus:** Folio, Daedalus, Contour, Catalyst, Idea Matrix  
**Type:** Research / Architectural Exploration  
**Status:** Exploratory — No implementation commitment

## 1. Purpose

Investigate how Named Entity Recognition (NER), entity linking, and related NLP techniques could be incorporated into Mixtape's processing of substantial bodies of content, particularly books, manuscripts, Folios, collections, and research documents.

The immediate opportunity is to identify people, places, organizations, publications, concepts, and other meaningful entities within written material.

The larger opportunity is to use those discoveries to help construct navigable, interconnected, and eventually curated representations of knowledge.

We are interested in moving beyond conventional document indexing toward **assisted discovery of structure and meaning within bodies of writing**.

This spike should determine what is technically feasible, what can run economically on our infrastructure, and how these capabilities might fit into Mixtape's existing architecture.

## 2. Starting Reference

The following article provides an accessible starting point:

[Implement Named Entity Recognition with Hugging Face Transformers — KDnuggets](https://www.kdnuggets.com/implement-named-entity-recognition-with-hugging-face-transformers)

Investigate the approach demonstrated, but do not assume that the particular model or implementation is our best choice.

Consider newer or alternative approaches, including:

- Hugging Face token-classification models
- GLiNER and other flexible or zero-shot NER approaches
- spaCy pipelines
- Small local language models
- Hybrid approaches combining conventional NER with LLM-assisted extraction

We should favor practical, maintainable solutions that can run locally when appropriate.

## 3. Architectural Context

Mixtape already has several relevant components.

**Folio** is our environment for working with substantial bodies of writing, including linear and nonlinear structures. Books, chapters, Leaves, Writing Pieces, research materials, and other editorial forms may be represented within it.

**Daedalus** is our research and agent-execution environment. It is a likely home for asynchronous extraction and enrichment jobs.

**Contour** provides structured shapes for interpreting and representing information. Entity types and relationship types could potentially be described through Contour.

**Catalyst** provides a curated knowledge substrate. It should not automatically receive every extracted entity as canonical knowledge.

**Puddlejump** manages research materials and vetted documentation.

**Idea Matrix** is an emerging capability for discovering concepts, references, and relationships across a large corpus, including weighted relevance and source provenance.

**Inkwell** already supports local language-model processing, but interactive inference workloads should remain isolated from potentially expensive document-processing jobs.

The spike should examine how these systems might collaborate without duplicating responsibility or prematurely introducing new infrastructure.

## 4. Research Questions

### A. What should we recognize?

Investigate at least two categories of extraction.

**Conventional named entities:**
- People
- Organizations
- Places
- Dates and historical periods
- Named events
- Publications and other titled works

**Domain-specific or conceptual entities:**
- Ideas and concepts
- Theories and frameworks
- Recurring themes
- Technical terms
- Named processes and methodologies
- Project-specific vocabulary

For example, a Folio might contain references to Darwin, Portland, and the United Nations, alongside concepts such as *Enoughness*, *Fruition*, and *Curated Provisionality*.

The latter group is especially interesting because conventional NER may not recognize these as entities.

Explore whether configurable entity types, supplied through Contour or another mechanism, would allow us to recognize concepts relevant to a particular Folio.

### B. How should large documents be processed?

Books and substantial Folios exceed the context windows of many extraction models.

Investigate:

- Chunking strategies that respect chapters, paragraphs, and sentences
- Overlapping chunks and boundary handling
- Preservation of exact source offsets
- Reconciliation of repeated mentions
- Incremental processing when a document changes
- Batch execution and caching
- Idempotency and extraction-version tracking

A key requirement is that an extracted entity should remain traceable to its precise location in the source material.

### C. How do we resolve identities?

Recognizing a mention is not equivalent to establishing an entity.

For example, "Charles Darwin," "Darwin," and "the naturalist" may refer to the same person.

Conversely, two mentions with identical names may refer to different entities.

Investigate entity linking, alias resolution, and cross-document reconciliation.

Consider how provisional identities could be retained until sufficient evidence or human review justifies consolidation.

### D. Can we extract relationships?

NER alone does not reveal how entities relate.

Investigate whether a second processing stage could propose relationships such as:

- Person authored Work
- Concept appears in Chapter
- Theory influenced Concept
- Organization participated in Event
- Concept contradicts Concept
- Concept evolves across Chapters

These should be treated as **candidate relationships supported by source evidence**, not automatically accepted facts.

Distinguish between relationships explicitly asserted in the text and relationships inferred by a model.

### E. How do we assess significance?

An entity's frequency is not necessarily a measure of its importance.

Explore weighting signals such as:

- Appearance in a title or heading
- Frequency across chapters
- Concentration within particular sections
- Presence in introductions or conclusions
- Participation in multiple relationships
- Explicit emphasis by the author
- Human curation or endorsement

Consider whether these signals could complement the weighted relevance model already being explored for Idea Matrix.

Significance should remain contextual: an entity may be central to one Folio and peripheral to another.

## 5. Proposed Processing Pattern

Investigate the feasibility of this pipeline:

```text
Folio / Book / Document
         |
         v
Structural Parsing
         |
         v
NER + Domain Entity Extraction
         |
         v
Mention Reconciliation
         |
         v
Entity Linking
         |
         v
Relationship Extraction
         |
         v
Significance / Confidence Assessment
         |
         v
Provisional Knowledge Layer
         |
         +----> Folio Index
         |
         +----> Idea Matrix
         |
         +----> Research / Discovery
         |
         v
Human Curation
         |
         v
Catalyst / Canonical Knowledge
```

This is a conceptual pipeline, not a prescribed implementation.

The agent should evaluate whether some stages can be combined, deferred, or performed on demand.

**Important architectural principle:** Extraction should not automatically confer canonical status.

## 6. Potential Folio Experiences

Consider what these capabilities could enable for authors, editors, researchers, and readers.

### Generated Index

A navigable index of people, places, works, and concepts, with references to their appearances throughout a Folio.

### Concept Trajectories

A view showing where a concept first appears, how it develops, and which other concepts become associated with it.

This may connect naturally with Storyline and our notion of a *lineage of thought*.

### Relationship Exploration

An interface for examining connections among entities, supported by excerpts from the source material.

### Assisted Curation

A lightweight process through which an author can accept, reject, merge, rename, or annotate proposed entities.

### Cross-Folio Discovery

Recognition that a concept appearing in one Folio also appears in other documents, research collections, or canonical knowledge.

These are possibilities to evaluate, not features to implement during the spike.

## 7. Technical Evaluation

Compare a small number of promising approaches.

For each candidate, report:

| Dimension | Evaluation |
|---|---|
| Recognition quality | Accuracy on conventional and domain-specific entities |
| Configurability | Ability to define custom entity types |
| Resource requirements | RAM, CPU, GPU, model size |
| Performance | Processing speed on representative text |
| Integration | Python ecosystem, Django, FastAPI, workers |
| Provenance | Support for reliable text spans and offsets |
| Maintainability | Dependencies, model maturity, operational complexity |
| Licensing | Model and library usage restrictions |

Include the feasibility of running extraction on Daedalus or other local infrastructure.

Do not assume that a general-purpose LLM is necessary for every stage. Specialized models may be faster, more consistent, and substantially cheaper.

## 8. Suggested Proof of Concept

If practical within the spike's time budget, construct a small experimental pipeline using a representative body of text.

Suggested scope:

1. Process approximately three chapters from a substantial document.
2. Extract conventional named entities.
3. Attempt domain-specific concept extraction.
4. Reconcile repeated mentions.
5. Preserve source references and character offsets.
6. Produce a structured JSON representation.
7. Generate a simple human-readable index.

Optionally compare a specialized NER model with an LLM-assisted approach on the same material.

Evaluate a manually reviewed sample for precision, recall where feasible, and false positives. Do not treat model confidence scores as calibrated probabilities without validation.

The proof of concept does not need a production UI or database integration.

A command-line demonstration and sample output are sufficient.

## 9. Expected Deliverables

Return a concise but substantive research report containing:

**1. Landscape assessment**  
Promising technologies, their strengths and limitations, and their suitability for Mixtape.

**2. Recommended architecture**  
Where extraction should execute, how results should be represented, and how Folio, Daedalus, Contour, Catalyst, and Idea Matrix might participate.

**3. Proposed data shape**  
A preliminary schema for entity mentions, resolved entities, relationships, provenance, extraction versions, and curation status.

**4. Proof-of-concept findings**  
If an experiment was performed, include examples, resource usage, errors, and lessons learned.

**5. Implementation roadmap**  
A modest first increment, followed by possible enhancements.

**6. Open questions**  
Identify decisions requiring human input, especially those concerning canonical identity, curation, and user experience.

## 10. Boundaries and Design Principles

This is an exploratory spike. Do not build a production subsystem without further review.

Preserve these principles:

- **Provisionality is first-class.** Extraction produces candidates, not canonical knowledge.
- **Provenance is essential.** Claims and entities should remain traceable to their sources.
- **Human judgment remains authoritative.** Models assist discovery; people decide what matters.
- **Resourcefulness matters.** Prefer economical processing and reuse of existing infrastructure.
- **Structure should emerge without being imposed.** Authors should not be required to pre-classify their writing.
- **Purposeful retention matters.** Not every extracted entity deserves permanent storage or prominence.

## 11. Larger Opportunity

The immediate objective is relatively straightforward: extract useful entities from books and other substantial bodies of writing.

The longer-term opportunity is more ambitious.

Mixtape is exploring how natural language can become a medium for knowledge building, not merely content generation or retrieval.

Entity extraction may become one of the mechanisms by which written material begins to reveal its own structure: its participants, concepts, relationships, recurring patterns, and trajectories of thought.

This could provide an important bridge between **Folio as a place for writing and reading** and **Catalyst as a place for curated knowledge**.

We should explore that bridge carefully, without assuming every discovery must become permanent structure.

**Working principle: Machines notice possibilities. People decide what matters.**

---

## Appendix

One additional thought: I'd ask the agent to pay particular attention to GLiNER versus conventional BERT-based NER. Configurable entity categories may be especially valuable for our use cases, because we're interested in concepts and intellectual constructs as much as people and places.

And I'd keep the first implementation deliberately small: one Folio → one extraction pass → one provisional entity index. If that works well, we have a solid foundation for the richer knowledge-building possibilities.

---

**Requested outcome:** Recommend whether NER and adjacent extraction techniques deserve a place in Mixtape's architecture, identify the most promising implementation approach, and propose a bounded first development increment.
