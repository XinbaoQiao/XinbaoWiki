---
name: "模型坍缩"
occupation: "研究概念"
summary: "解释递归模型训练中退化性分布漂移的概念页。"
language: "zh"
translation_of: "Model_Collapse"
---

**模型坍缩** 是模型在递归使用生成或有偏数据训练时，逐渐丢失原始数据分布信息的退化过程。坍缩可以表现为模式丢失、多样性下降、类别比例扭曲或样本质量随代际恶化。[^collapse]

## 在本 wiki 中的作用

本页为更广泛的 [[Synthetic_Data_and_Model_Collapse|合成数据]] 专题提供失效概念。合成数据并非天然有害；失效取决于生成数据如何被选择、混合和复用。模型坍缩是负面终点，因此激励更谨慎的数据治理和协作验证。低资源视角在这里尤其重要：如果尾部区域一开始就覆盖不足，坍缩可能更早发生，并且更严重影响代表不足的内容。

## 与乔鑫宝工作的关系

乔鑫宝的 ICML 2026 论文研究样本选择偏差在低资源验证场景下如何促成模型坍缩。该工作连接 [[Wasserstein_Geometry|Wasserstein 几何]]，因为分布距离可以提供漂移信号；也连接 [[Data_Silos|数据孤岛]]，因为没有单一参与方掌握完整分布。在传记中，模型坍缩属于更广泛的可靠性议题：即使模型结构不变，数据过程也可能悄然退化模型。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Recursive_Synthetic_Data_Training|递归合成数据训练]]
- [[Sample_Selection_Bias|样本选择偏差]]
- [[Collaborative_Evaluation|协作评估]]

[^collapse]: Shumailov 等人在递归生成数据背景下定义了模型坍缩，并在语言模型、变分自编码器和高斯混合模型中报告了该现象。
