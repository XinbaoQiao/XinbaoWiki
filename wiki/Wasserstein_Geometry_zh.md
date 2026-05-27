---
name: "Wasserstein 几何"
occupation: "研究概念"
summary: "解释使用最优传输几何进行分布比较的概念页。"
language: "zh"
translation_of: "Wasserstein_Geometry"
---

**Wasserstein 几何** 指使用最优传输距离及相关几何思想比较概率分布。与逐点指标不同，Wasserstein 距离考虑把概率质量从一个分布移动到另一个分布的代价，因此适合描述分布偏移和生成数据。[^ot]

## 在本 wiki 中的作用

本页支撑 [[Synthetic_Data_and_Model_Collapse|合成数据]]、[[Collaborative_Evaluation|协作评估]] 和 [[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]]。它解释为什么一个关于 AI 与网络的学术 wiki 会谈几何：当数据被切分在多个孤岛中时，分布比较可能比单个准确率数字更有信息量。Wasserstein 风格度量提供了描述生成数据如何在类别、模式或视觉特征上漂移的语言。

## 与乔鑫宝工作的关系

ICML 2026 论文 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 使用协作 Wasserstein 风格信号分析低资源选择偏差下的模型坍缩。后续博士阶段关于 [[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]] 的关注保留同一几何语言，但把重点转向计算：如何从多个局部测度得到共享的分布参考。在本 wiki 中，Wasserstein 几何不是一般数学旁支，而是乔鑫宝 AI 与网络研究线在分布式、不可全局直接检查条件下诊断分布变化的背景工具。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Collaborative_Evaluation|协作评估]]
- [[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]]
- [[Model_Collapse|模型坍缩]]
- [[Data_Silos|数据孤岛]]

[^ot]: Agueh 和 Carlier 关于 [Wasserstein 空间 barycenter](https://epubs.siam.org/doi/10.1137/100805741) 的 SIAM 论文、Cuturi 和 Doucet 关于[快速 Wasserstein barycenter 计算](https://proceedings.mlr.press/v32/cuturi14.html)的 ICML 论文，以及 Arjovsky、Chintala 和 Bottou 的 [Wasserstein GAN](https://arxiv.org/abs/1701.07875) 是本页的相关背景。
