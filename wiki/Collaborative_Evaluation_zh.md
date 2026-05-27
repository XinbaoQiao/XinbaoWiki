---
name: "协作评估"
occupation: "研究概念"
summary: "解释多方共同评估模型或数据过程的概念页。"
language: "zh"
translation_of: "Collaborative_Evaluation"
---

**协作评估** 指多个参与方共同提供关于模型行为、数据质量或分布漂移的证据。在本 wiki 中，它主要用于跨数据孤岛设置：每个参与者只有本地观测，没有任何一方完整掌握全局分布。

## 在本 wiki 中的作用

本页连接 [[Data_Silos|数据孤岛]]、[[Wasserstein_Geometry|Wasserstein 几何]] 和 [[AI_and_Networks|AI 与网络]]。中心化基准假设所有相关数据都能汇集并标注在一个地方；协作评估则追问：在局部且可能有偏的信号中，各方能共同推断出什么，尤其是当部分参与方处于低资源条件下时。

## 与乔鑫宝工作的关系

在 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 中，协作评估用于分析原始数据分布被切分在多个低资源孤岛中时，递归合成数据训练为何会失败。该项目使用 Wasserstein 风格的分布代理，把生成行为与多方证据进行比较。这体现了乔鑫宝的系统视角：可靠 AI 不只取决于模型如何训练，也取决于证据如何共享。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Data_Silos|数据孤岛]]
- [[Wasserstein_Geometry|Wasserstein 几何]]
- [[Synthetic_Data_and_Model_Collapse|合成数据]]
