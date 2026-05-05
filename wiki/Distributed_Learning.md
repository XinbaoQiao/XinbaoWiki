---
name: "Distributed Learning"
occupation: "Research concept"
summary: "Concept page for learning with decentralized data, computation, or communication."
---

**Distributed Learning** covers learning settings in which data, computation, or optimization steps are spread across multiple clients, devices, institutions, or workers. In this wiki the term includes decentralized and federated-style learning problems, but it is used descriptively rather than as a commitment to one protocol.[^fed]

## Role in this wiki

Distributed learning is a foundation page for [[AI_and_Networks|AI and networks]]. It explains why networked AI has different constraints from centralized training: communication can be expensive, local data can be non-identically distributed, and privacy or ownership may limit what can be shared. These constraints make data selection and pruning more important, because transmitting or training on all available data may be impractical.

## Connection to Qiao's work

This perspective appears in Qiao's synthetic-data work, where multiple silos must reason about distributional drift without a pooled dataset. Distributed learning therefore provides the infrastructure context for Qiao's current [[AI_and_Networks|AI and networks]] direction.

## See also

- [[AI_and_Networks]]
- [[Data_Selection]]
- [[Data_Silos]]

[^fed]: McMahan et al., "Communication-Efficient Learning of Deep Networks from Decentralized Data", AISTATS 2017, is a standard reference point for federated learning and communication-efficient decentralized optimization.
