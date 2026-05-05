---
name: "Wasserstein Geometry"
occupation: "Research concept"
summary: "Concept page for distributional comparison using optimal-transport geometry."
---

**Wasserstein Geometry** refers to the use of optimal-transport distances and related geometric ideas to compare probability distributions. Unlike pointwise metrics, Wasserstein distances account for the cost of moving probability mass from one distribution to another, which makes them useful for reasoning about distribution shift and generated data.[^wgan]

## Role in this wiki

This page supports the [[Synthetic_Data_and_Model_Collapse|Synthetic Data]] and [[Collaborative_Evaluation|collaborative evaluation]] pages. It gives readers a reason why the wiki talks about geometry in a biography about AI and networks: when data are split across silos, a distributional comparison can be more informative than a single scalar accuracy score. Wasserstein-style measures provide a language for describing how generated data drift across classes, modes, or visual features.

## Connection to Qiao's work

The ICML 2026 paper [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] uses collaborative Wasserstein-style signals to reason about model collapse under selection bias. In this wiki, Wasserstein geometry is therefore not a general math detour. It is the background for how Qiao's synthetic-data line diagnoses distributional change when the data are distributed and direct global inspection is unavailable.

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Collaborative_Evaluation]]
- [[Model_Collapse]]
- [[Data_Silos]]

[^wgan]: Arjovsky, Chintala, and Bottou's "Wasserstein GAN" popularized the use of Wasserstein distance in generative modeling and highlighted its connection to training stability and distributional comparison.
