---
type: 研究概念
title: 模型坍缩
description: 递归模型训练中的分布退化。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.921Z'
content_hash: 'sha256:9b2ece20bb98d464023ec8685981be50ffa47d96a77645b172d5dd6f5ae773b8'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: 模型坍缩
language: zh
summary: 递归模型训练中的分布退化。
occupation: 研究概念
translation_of: Model_Collapse
---
**模型坍缩** 是模型在递归使用生成或有偏数据训练时，逐渐丢失原始数据分布信息的退化过程。坍缩可以表现为模式丢失、多样性下降、类别比例扭曲或样本质量随代际恶化。[^collapse]

## 研究背景

模型坍缩是 [[Synthetic_Data_and_Model_Collapse|合成数据]] 研究关注的一类失效。合成数据并非天然有害；失效取决于生成数据如何被选择、混合和复用。这种风险凸显了数据治理和协作验证的重要性。低资源条件下的风险尤其值得关注：如果尾部区域一开始就覆盖不足，坍缩可能更早发生，并且更严重影响代表不足的内容。

## 与乔鑫宝工作的关系

乔鑫宝的 ICML 2026 论文研究样本选择偏差在低资源验证场景下如何促成模型坍缩。该工作连接 [[Wasserstein_Geometry|Wasserstein 几何]]，因为分布距离可以提供漂移信号；也连接 [[Data_Silos|数据孤岛]]，因为没有单一参与方掌握完整分布。这项工作关注一个更广泛的可靠性问题：即使模型结构不变，数据处理过程也可能使模型逐渐退化。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Recursive_Synthetic_Data_Training|递归合成数据训练]]
- [[Sample_Selection_Bias|样本选择偏差]]
- [[Collaborative_Evaluation|协作评估]]

[^collapse]: Shumailov 等人的 [“AI models collapse when trained on recursively generated data”](https://www.nature.com/articles/s41586-024-07566-y)（*Nature* 631，2024）在无差别递归使用生成数据的背景下定义模型坍缩，并在语言模型、变分自编码器和高斯混合模型中报告了该现象。
