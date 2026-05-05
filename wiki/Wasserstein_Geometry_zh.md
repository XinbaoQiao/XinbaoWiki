---
name: "Wasserstein 几何"
occupation: "研究概念"
summary: "解释使用最优传输几何进行分布比较的概念页。"
language: "zh"
translation_of: "Wasserstein_Geometry"
---

**Wasserstein 几何** 指使用最优传输距离及相关几何思想比较概率分布。与逐点指标不同，Wasserstein 距离考虑把概率质量从一个分布移动到另一个分布的代价，因此适合描述分布偏移和生成数据。[^wgan]

## 在本 wiki 中的作用

本页支撑 [[Synthetic_Data_and_Model_Collapse|合成数据]] 和 [[Collaborative_Evaluation|协作评估]]。它解释为什么一个关于 AI 与网络的学术 wiki 会谈几何：当数据被切分在多个孤岛中时，分布比较可能比单个准确率数字更有信息量。Wasserstein 风格度量提供了描述生成数据如何在类别、模式或视觉特征上漂移的语言。

## 与乔鑫宝工作的关系

ICML 2026 论文 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 使用协作 Wasserstein 风格信号分析选择偏差下的模型坍缩。在本 wiki 中，Wasserstein 几何不是一般数学旁支，而是乔鑫宝合成数据研究线在分布式、不可全局直接检查条件下诊断分布变化的背景工具。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Collaborative_Evaluation|协作评估]]
- [[Model_Collapse|模型坍缩]]
- [[Data_Silos|数据孤岛]]

[^wgan]: Arjovsky、Chintala 和 Bottou 的 “Wasserstein GAN” 推广了 Wasserstein 距离在生成建模中的使用，并强调其与训练稳定性和分布比较的联系。

