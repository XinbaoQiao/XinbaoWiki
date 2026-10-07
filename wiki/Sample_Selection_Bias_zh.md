---
type: 研究概念
title: 样本选择偏差
description: 数据选择如何使训练或评估所依据的分布产生偏差。
tags:
  - zh
  - research
  - concept
  - 研究概念
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.953Z'
content_hash: 'sha256:e04479cabd61bc3727aa0e1e90b8676c17d981039b5f2b067c623e1dc7da4700'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: 样本选择偏差
language: zh
summary: 数据选择如何使训练或评估所依据的分布产生偏差。
occupation: 研究概念
translation_of: Sample_Selection_Bias
---
**样本选择偏差** 发生在被选用于训练或评估的数据不能代表模型应处理的人群或目标分布时。当模型反复使用生成数据或本地筛选的数据训练时，选择偏差可能逐代累积。

## 研究背景

选择偏差是 [[Synthetic_Data_and_Model_Collapse|合成数据]] 失效的一种机制。选择偏差不只是“数据集有问题”的标签，而是一个过程：一旦某个子集被偏好，缺失模式获得的样本会更少，模型生成它们的概率会下降，下一轮数据也会进一步变窄。在低资源网络环境中，这种影响可能更明显，因为稀有模式在筛选前就可能缺少足够样本。

## 与乔鑫宝工作的关系

ICML 2026 论文 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 研究局部选择行为如何在递归合成数据训练中促成坍缩，尤其关注低资源验证者只掌握局部、不完整证据时的失效。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Data_Selection|数据选择]]
- [[Model_Collapse|模型坍缩]]
- [[Data_Silos|数据孤岛]]
