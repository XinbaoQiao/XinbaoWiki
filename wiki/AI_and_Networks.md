---
name: "AI and Networks"
occupation: "Research topic"
summary: "Primary research topic for Qiao Xinbao, covering AI systems under networked data and communication constraints."
---

**AI and Networks** is the primary research topic currently emphasized in [[Xinbao_Qiao|Xinbao Qiao]]'s wiki. The term is used here in a deliberately broad but bounded sense: it covers AI methods for networked settings, and learning algorithms whose behavior depends on communication, decentralization, edge devices, institutional data silos, or cross-party evaluation.[^scope]

## Role in this wiki

This page is the top-level hub for research in which model performance is shaped by where data live and how information moves. It links Qiao's background in communication engineering with later work on [[Distributed_Learning|distributed learning]], [[Data_Silos|data silos]], [[Collaborative_Evaluation|collaborative evaluation]], and data pruning for decentralized training. The page also explains why several apparently separate projects are grouped together: they all treat communication, locality, or infrastructure as part of the learning problem, not merely as deployment details.

## Connection to Qiao's work

The clearest project in this area is [[Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters: Data Pruning for Efficient Decentralized Learning]], which studies how local data can be selected before decentralized learning. The ICML 2026 paper [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] also belongs here because it studies collaborative verification under siloed access. Earlier work in [[Machine_Unlearning|machine unlearning]] contributes the same systems instinct: algorithms are evaluated not only by accuracy, but also by latency, communication, and the cost of changing data after training.

## See also

- [[Distributed_Learning]]
- [[Data_Silos]]
- [[Collaborative_Evaluation]]
- [[Data_Centric_Machine_Learning|Data Centric ML]]
- [[The_Chinese_University_of_Hong_Kong]]

[^scope]: The phrasing follows the Information Engineering framing used by CUHK, where generation, transmission, storage, and processing of information are treated together rather than as isolated subfields.
