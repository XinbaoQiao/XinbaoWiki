---
type: Research topic
title: AI and Networks
description: >-
  Primary research topic for Qiao Xinbao, covering AI systems under networked
  data and communication constraints.
tags:
  - en
  - research
  - topic
  - research-topic
  - ai-and-networks
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:e29224a6e9ced60652a179982834df6b1aa7fa7cde79ecf1e340d56c4e8508c6'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-07-02T20:03:20+08:00'
  reviewDue: '2026-12-29'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:AI_and_Networks'
  chunking: markdown-heading-v1
source_ids:
  - src-5ffca2a581311c27
  - src-766234e11681dad2
source_path: wiki/AI_and_Networks.md
---
**AI and Networks** is the primary research topic currently emphasized in [Xinbao Qiao](./Xinbao_Qiao.md)'s wiki. The term is used here in a deliberately broad but bounded sense: it covers AI for Networks, Networks for AI, and learning algorithms whose behavior depends on communication, decentralization, edge devices, institutional data silos, or cross-party evaluation.[^sources]

## Introduction

In this wiki, AI and Networks is not a separate application label but the organizing frame for research in which learning is shaped by where data live, how information moves, and which parties can evaluate a model. The topic therefore includes AI-assisted networked systems, network support for AI systems, decentralized learning, distributed computing, data pruning, collaborative evaluation, and synthetic-data verification under low-resource or siloed access.

## Role in this wiki

This page is the top-level hub for research in which model performance is shaped by where data live and how information moves. It links Qiao's background in communication engineering with later work on [distributed learning](./Distributed_Learning.md), [data silos](./Data_Silos.md), [collaborative evaluation](./Collaborative_Evaluation.md), [distributed Wasserstein barycenters](./Distributed_Wasserstein_Barycenter.md), and data pruning for decentralized training. The page also explains why several apparently separate projects are grouped together: they all treat communication, locality, or infrastructure as part of the learning problem, not merely as deployment details.

## Current doctoral focus

In the CUHK doctoral stage, Qiao's recent work within this topic centers on [data-centric ML](./Data_Centric_Machine_Learning.md), AI for Networks, and Networks for AI. The emphasis is on learning systems whose data and evaluation evidence are shaped by communication, network infrastructure, and decentralized access, rather than on centralized statistical objectives alone.

## Publications

| Paper | Venue/status |
| --- | --- |
| [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md) | ICML 2026, 6-11 July 2026, Seoul. |

## Connection to Qiao's work

The ICML 2026 paper [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md) belongs here because it studies collaborative verification when low-resource parties only hold fragmented local evidence. Distributed [Wasserstein barycenter](./Distributed_Wasserstein_Barycenter.md) methods remain one technical route for treating a reference distribution as something computed across a network rather than assumed to exist centrally. Earlier work in [machine unlearning](./Machine_Unlearning.md) contributes the same systems instinct: algorithms are evaluated not only by accuracy, but also by latency, communication, and the cost of changing data after training.

## See also

- [Distributed Learning](./Distributed_Learning.md)
- [Data Silos](./Data_Silos.md)
- [Collaborative Evaluation](./Collaborative_Evaluation.md)
- [Distributed Wasserstein Barycenter](./Distributed_Wasserstein_Barycenter.md)
- [Data Centric ML](./Data_Centric_Machine_Learning.md)
- [The Chinese University of Hong Kong](./The_Chinese_University_of_Hong_Kong.md)

[^sources]: The topic label follows CUHK IE's [official department description](https://www.ie.cuhk.edu.hk/about-the-department/), which frames information engineering around information generation, communication, storage, and processing in real-world applications; the ICML 2026 timing in the publications table follows the [official ICML 2026 conference page](https://icml.cc/Conferences/2026).
