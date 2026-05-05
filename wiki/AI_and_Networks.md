---
name: "AI and Networks"
occupation: "Research topic"
summary: "Primary research topic for Qiao Xinbao, covering AI systems under networked data and communication constraints."
---

**AI and Networks** is the primary research topic currently emphasized in [[Xinbao_Qiao|Xinbao Qiao]]'s wiki. The term is used here in a deliberately broad but bounded sense: it covers AI methods for networked settings, and learning algorithms whose behavior depends on communication, decentralization, edge devices, institutional data silos, or cross-party evaluation.[^scope]

## Introduction

In this wiki, AI and Networks is not a separate application label but the organizing frame for research in which learning is shaped by where data live, how information moves, and which parties can evaluate a model. The topic therefore includes decentralized learning, data pruning, collaborative evaluation, and synthetic-data verification under siloed access.[^icml-2026]

## Role in this wiki

This page is the top-level hub for research in which model performance is shaped by where data live and how information moves. It links Qiao's background in communication engineering with later work on [[Distributed_Learning|distributed learning]], [[Data_Silos|data silos]], [[Collaborative_Evaluation|collaborative evaluation]], and data pruning for decentralized training. The page also explains why several apparently separate projects are grouped together: they all treat communication, locality, or infrastructure as part of the learning problem, not merely as deployment details.

## Publications

| Paper | Venue/status |
| --- | --- |
| [[Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters: Data Pruning for Efficient Decentralized Learning]] | TNNLS under review; ongoing journal manuscript listed in the CV. |
| [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] | ICML 2026, 6-11 July 2026, Seoul; accepted 30 April 2026 according to owner-provided records and the ICML author-notification date. |

## Connection to Qiao's work

The clearest project in this area is [[Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters: Data Pruning for Efficient Decentralized Learning]], which studies how local data can be selected before decentralized learning. The ICML 2026 paper [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] also belongs here because it studies collaborative verification under siloed access. Earlier work in [[Machine_Unlearning|machine unlearning]] contributes the same systems instinct: algorithms are evaluated not only by accuracy, but also by latency, communication, and the cost of changing data after training.

## See also

- [[Distributed_Learning]]
- [[Data_Silos]]
- [[Collaborative_Evaluation]]
- [[Data_Centric_Machine_Learning|Data Centric ML]]
- [[The_Chinese_University_of_Hong_Kong]]

[^scope]: The phrasing follows the Information Engineering framing used by CUHK, where generation, transmission, storage, and processing of information are treated together rather than as isolated subfields.

[^icml-2026]: ICML lists its 2026 meeting for 6-11 July 2026 at COEX in Seoul, with author notification on 30 April 2026; the date is used here to separate accepted-conference timing from ongoing manuscript status.
