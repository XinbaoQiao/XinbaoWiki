---
name: "数据选择"
occupation: "研究概念"
summary: "解释在可靠性约束下选择训练或评估数据的概念页。"
language: "zh"
translation_of: "Data_Selection"
---

**数据选择** 是为训练、剪枝、评估或合成数据复用选择样本的过程。在本 wiki 中，它是核心的数据中心操作：选择可以降低成本、提升质量，但有偏选择也会扭曲模型对目标分布的理解。

## 在本 wiki 中的作用

本页把 [[Data_Centric_Machine_Learning|数据中心 ML]] 同 [[AI_and_Networks|AI 与网络]] 和 [[Synthetic_Data_and_Model_Collapse|合成数据]] 连接起来。在去中心化或数据孤岛设置中，选择通常是局部的：每个参与方只看到一部分数据，并按本地目标或约束选择样本。因此，选择不是单纯的统计预处理，而是网络化学习问题的一部分。

## 与乔鑫宝工作的关系

数据选择直接出现在 [[Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters]] 中：问题是哪部分本地数据应被保留以提高去中心化学习效率。它也出现在 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 中：有偏的本地选择会加剧递归合成数据训练的分布退化。在机器遗忘论文中，选择又以删除或重加权的形式出现。

## 参见

- [[Sample_Selection_Bias|样本选择偏差]]
- [[Data_Centric_Machine_Learning|数据中心 ML]]
- [[Distributed_Learning|分布式学习]]
- [[Synthetic_Data|合成数据（概念）]]

