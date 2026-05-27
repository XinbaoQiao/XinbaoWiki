---
name: "Research"
occupation: "Research overview"
summary: "Research overview for Qiao Xinbao."
---

This page summarizes the main research directions in Qiao Xinbao's academic wiki. It functions as a compiled map of linked topic pages rather than a static list of interests. The current center of gravity is [[AI_and_Networks|AI and networks]].

## Research thesis

The common thread is **data-process reliability under networked constraints**: how to design learning algorithms when data are selected, removed, synthesized, siloed, biased, privacy-constrained, or communication-constrained. The work is primarily positioned in AI and networks, machine unlearning, synthetic data, and data centric ML. Following the wiki pattern, each concept page records a stable local synthesis and points outward to papers, institutions, and adjacent methods, so later updates can revise the map rather than restart from raw notes.

## AI and networks

[[AI_and_Networks]] covers the intersection of AI with networking and communication systems: AI for communication, communication for AI, decentralized learning, data pruning, and collaborative evaluation. In the current CUHK doctoral stage, this line includes distributed computing for [[Distributed_Wasserstein_Barycenter|Wasserstein barycenters]], where multiple local distributions are combined into a shared distributional reference without treating raw-data pooling as the default assumption.

## Machine unlearning

[[Machine_Unlearning]] studies certified data removal and low-cost update mechanisms after deletion requests. Related pages include [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]], [[Soft_Weighted_Machine_Unlearning|Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness]], [[DynFrs|DynFrs: An Efficient Framework for Machine Unlearning in Random Forest]], [[Influence_Functions]], and [[Certified_Data_Removal]].

## Synthetic data

[[Synthetic_Data_and_Model_Collapse|Synthetic Data]] studies recursive synthetic-data training, [[Data_Selection]], [[Sample_Selection_Bias]], [[Model_Collapse]], and collaborative mitigation in low-resource [[Data_Silos|data silos]]. The central paper is [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]], which frames model collapse as especially risky when real-data coverage is scarce or fragmented.

## Data centric ML and trustworthy AI

[[Data_Centric_Machine_Learning|Data Centric ML]] covers data selection, valuation, filtering, and evaluation. [[Trustworthy_AI]] connects unlearning, fairness, robustness, privacy, security, interpretability, and reliability.

## Geometry and distributed learning

[[Wasserstein_Geometry]], [[Distributed_Wasserstein_Barycenter]], and [[Distributed_Learning]] provide tools for collaborative evaluation, optimal-transport proxies, decentralized data access, and distributional references for networked AI systems.
