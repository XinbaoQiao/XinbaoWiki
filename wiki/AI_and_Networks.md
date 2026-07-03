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
name: AI and Networks
summary: >-
  Primary research topic for Qiao Xinbao, covering AI systems under networked
  data and communication constraints.
occupation: Research topic
image: /topics/ai-and-networks.png
image_caption: AI and networks topic diagram
---
**AI and Networks** is the primary research topic currently emphasized in [[Xinbao_Qiao|Xinbao Qiao]]'s wiki. The term is used here in a deliberately broad but bounded sense: it covers AI for Networks, Networks for AI, and learning algorithms whose behavior depends on communication, decentralization, edge devices, institutional data silos, or cross-party evaluation.[^sources]

## Introduction

In this wiki, AI and Networks is not a separate application label but the organizing frame for research in which learning is shaped by where data live, how information moves, and which parties can evaluate a model. The topic therefore includes AI-assisted networked systems, network support for AI systems, decentralized learning, distributed computing, data pruning, collaborative evaluation, and synthetic-data verification under low-resource or siloed access.

## Role in this wiki

This page is the top-level hub for research in which model performance is shaped by where data live and how information moves. It links Qiao's background in communication engineering with later work on [[Distributed_Learning|distributed learning]], [[Data_Silos|data silos]], [[Collaborative_Evaluation|collaborative evaluation]], [[Distributed_Wasserstein_Barycenter|distributed Wasserstein barycenters]], and data pruning for decentralized training. The page also explains why several apparently separate projects are grouped together: they all treat communication, locality, or infrastructure as part of the learning problem, not merely as deployment details.

## Current doctoral focus

In the CUHK doctoral stage, Qiao's recent work within this topic centers on [[Data_Centric_Machine_Learning|data-centric ML]], AI for Networks, and Networks for AI. The emphasis is on learning systems whose data and evaluation evidence are shaped by communication, network infrastructure, and decentralized access, rather than on centralized statistical objectives alone.

## Publications

| Paper | Venue/status |
| --- | --- |
| [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] | ICML 2026, 6-11 July 2026, Seoul. |

## Connection to Qiao's work

The ICML 2026 paper [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] belongs here because it studies collaborative verification when low-resource parties only hold fragmented local evidence. Distributed [[Distributed_Wasserstein_Barycenter|Wasserstein barycenter]] methods remain one technical route for treating a reference distribution as something computed across a network rather than assumed to exist centrally. Earlier work in [[Machine_Unlearning|machine unlearning]] contributes the same systems instinct: algorithms are evaluated not only by accuracy, but also by latency, communication, and the cost of changing data after training.

## See also

- [[Distributed_Learning]]
- [[Data_Silos]]
- [[Collaborative_Evaluation]]
- [[Distributed_Wasserstein_Barycenter]]
- [[Data_Centric_Machine_Learning|Data Centric ML]]
- [[The_Chinese_University_of_Hong_Kong]]

[^sources]: The topic label follows CUHK IE's [official department description](https://www.ie.cuhk.edu.hk/about-the-department/), which frames information engineering around information generation, communication, storage, and processing in real-world applications; the ICML 2026 timing in the publications table follows the [official ICML 2026 conference page](https://icml.cc/Conferences/2026).
