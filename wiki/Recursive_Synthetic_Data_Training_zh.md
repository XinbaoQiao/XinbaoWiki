---
type: 研究概念
title: 递归合成数据训练
description: 解释模型反复使用早期模型生成数据进行训练的过程。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-08-09T18:32:45.786Z'
content_hash: 'sha256:5d8a4e20eec790d14fac24557dfedfa4ab08a87f6ea28bc0c80802df8c7bb414'
reviewed_at: '2026-08-10T02:34:00+08:00'
review_due: '2027-02-05'
name: 递归合成数据训练
language: zh
summary: 解释模型反复使用早期模型生成数据进行训练的过程。
occupation: 研究概念
translation_of: Recursive_Synthetic_Data_Training
---
**递归合成数据训练** 是指某一代模型生成的数据进入后一代模型训练集的过程。它可能是有意设计的，例如自训练或合成数据自举；也可能是偶然发生的，例如生成内容进入未来训练语料。[^recursive]

## 在本 wiki 中的作用

本页解释 [[Model_Collapse|模型坍缩]] 背后的过程。它与一般合成数据不同：一次性的合成增强可能有益，但重复复用会放大分布误差。本 wiki 用该页区分机制和结果：递归训练是循环，坍缩是可能的退化结果之一。

## 与乔鑫宝工作的关系

[[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 研究局部样本选择偏差下的递归训练。该设置与 [[AI_and_Networks|AI 与网络]] 尤其相关，因为数据过程是分布式且常常低资源的：不同参与方看到不同数据、选择不同样本，并且只共享有限信号。递归合成数据训练因此成为跨孤岛可靠性问题，而不仅是生成模型问题。

## 参见

- [[Synthetic_Data|合成数据（概念）]]
- [[Model_Collapse|模型坍缩]]
- [[Sample_Selection_Bias|样本选择偏差]]
- [[Data_Silos|数据孤岛]]

[^recursive]: Shumailov 等人的 [“AI models collapse when trained on recursively generated data”](https://www.nature.com/articles/s41586-024-07566-y)（*Nature* 631，2024）研究了这一递归过程，并表明无差别复用会逐步丢失原始分布信息；其实验也显示，保留部分原始数据时退化较轻。
