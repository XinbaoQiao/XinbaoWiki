---
type: Research concept
title: Example Concept
description: Vector representations of graph nodes; an example research-concept page.
tags:
  - en
  - research
  - concept
timestamp: '2026-01-01T00:00:00+00:00'
modified: '2026-10-21T06:35:00.161Z'
content_hash: 'sha256:e624d9df27ee184747804dab762ce4d64f3a1389627bb862ae39fd4f30a1cf86'
reviewed_at: '2026-10-21T06:35:02.000Z'
review_due: '2027-04-19'
name: Example Concept
summary: Vector representations of graph nodes; an example research-concept page.
relations:
  - type: related
    target: Research_Area_2
    label: method used by
---
This sample concept uses **graph embeddings** as its illustration: they map each node of a graph to a vector so that nearby nodes in the graph stay close in vector space.[^survey] It is an example of a *research concept* page: it shows inline math, a display equation, a figure, a table, a quotation, and footnotes. Replace it with a concept from your own work, or delete it together with its Chinese counterpart.

## Definition

Given a graph $G = (V, E)$, an embedding is a function $f: V \to \mathbb{R}^d$. A common objective keeps linked nodes similar:

$$
\min_f \sum_{(u,v) \in E} \lVert f(u) - f(v) \rVert^2
$$

![Example graph embedding figure](/images/example-concept.svg)

## Comparison

| Method family | Signal used | Typical use |
| --- | --- | --- |
| Random-walk | Co-occurrence on walks | Link prediction |
| Factorization | Adjacency matrix | Clustering |
| Graph neural network | Node features and neighbors | Classification |

> Quotations render as block quotes. Use them sparingly, for a short cited definition.[^quote]

## Related topics

- [[Research_Area_2]]
- [[Research_Area_3]]

[^survey]: Footnotes carry sources and side context. Replace with a real citation.
[^quote]: Placeholder quotation; cite the original source here.
