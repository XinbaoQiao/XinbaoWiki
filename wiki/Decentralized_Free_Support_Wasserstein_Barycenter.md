---
type: publication
title: Decentralized Free-Support Wasserstein Barycenter
description: >-
  Under-review manuscript on movable barycenter supports and shared geometric
  references under decentralized communication.
tags:
  - en
  - publication
  - paper
  - under-review
  - wasserstein
timestamp: '2026-08-20T00:00:00+09:00'
modified: '2026-10-07T07:07:23.846Z'
content_hash: 'sha256:880653007652fbf48f1f36ddd63085d593512f97ebeefa5b48c7c036001989fb'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2026-11-06'
name: Decentralized Free-Support Wasserstein Barycenter
summary: >-
  Under-review manuscript on movable barycenter supports and shared geometric
  references under decentralized communication.
occupation: Under-review manuscript
authors:
  - Xinbao Qiao
  - Bokai Hou
  - Peihua Mai
  - Wenqian Li
  - Wenjing Yan
  - Ying-Jun Angela Zhang
year: 2026
status: under review
publication_type: Manuscript
---
**Decentralized Free-Support Wasserstein Barycenter** is a manuscript by **[[Xinbao_Qiao|Xinbao Qiao]]**, Bokai Hou, Peihua Mai, Wenqian Li, Wenjing Yan, and Ying-Jun Angela Zhang, currently **under review**. It studies how a network can build a shared distributional reference while allowing that reference to adapt to the geometry of locally held data.[^manuscript]

## Overview

Many decentralized Wasserstein barycenter solvers place the barycenter on a grid chosen in advance and optimize the mass assigned to each location. A shared grid simplifies agreement between nodes, but it can limit geometric fidelity or require a large representation. The manuscript instead fixes equal atom masses and optimizes only their locations, allowing the support to move continuously.

Each node computes a local optimal-transport plan and converts it into targets for the barycenter support. Neighbor gossip combines these support-sized updates within a majorization–minimization framework. Local measures and transport plans remain at their respective nodes; this data-access boundary does not by itself provide a formal privacy guarantee.

## Key takeaways

- **Representation is part of the communication problem.** A compact, movable support can preserve distributional geometry without committing the network to a dense common grid.
- **Barycenter quality and network agreement have different time scales.** The manuscript reports that a useful network-average barycenter can emerge with shallow gossip, while further communication mainly improves agreement between local copies.
- **Communication budgets change the guarantee.** Fixed-depth gossip controls disagreement and average motion; stronger stationarity conclusions require additional conditions and increasing communication.
- **Shared geometric references can support decisions beyond averaging.** The work evaluates barycenters as nominal distributions for cooperative distributionally robust optimization.

## Evidence and boundaries

The manuscript reports experiments on synthetic measures, image distributions, and 3D point clouds, comparing against representative fixed-support decentralized solvers. It reports lower barycenter objectives, better geometric fidelity, and substantial computation and communication savings in the tested settings, together with a cooperative distributionally robust optimization application.

For the quadratic-cost analysis with exact local transport plans, exact aggregation gives monotone descent and a best-iterate Clarke-stationarity guarantee. Fixed gossip depth instead gives topology-dependent bounds on disagreement and network-average motion, which do not establish stationarity. Under the stated compact-support and mixing assumptions, sufficiently increasing gossip depth with summable mixing errors yields vanishing disagreement and Clarke-stationary accumulation points. Stationarity does not establish global optimality. The regularized analysis assumes exact entropic subproblem solutions and does not justify a finite number of Sinkhorn iterations.

## Placement

The paper connects [[AI_and_Networks]], [[Distributed_Wasserstein_Barycenter]], [[Wasserstein_Geometry]], and [[Data_Centric_Machine_Learning]]. It extends Qiao's work on collaborative distributional references from using such references for evaluation to computing them under decentralized access and communication constraints.

## Review status

The manuscript is currently under review.

[^manuscript]: Author-provided manuscript, including the abstract, introduction, methodology, theory, experiments, and conclusion, with bibliographic metadata supplied by the author on 7 October 2026.
