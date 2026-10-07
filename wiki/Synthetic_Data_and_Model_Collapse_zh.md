---
type: 研究专题
title: 合成数据
description: 关于合成数据、递归训练、低资源验证、选择偏差和模型坍缩的研究专题。
tags:
  - zh
  - research
  - topic
  - 研究专题
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.969Z'
content_hash: 'sha256:a22933a5d45f0e375b50a54086443668327831bb3b3c977863be22bf80f02b71'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: 合成数据
language: zh
summary: 关于合成数据、递归训练、低资源验证、选择偏差和模型坍缩的研究专题。
aliases:
  - Synthetic Data and Model Collapse
occupation: 研究专题
image: /topics/synthetic-data.png
image_caption: 合成数据主题图
relations:
  - type: depends-on
    target: Synthetic_Data
    label: 概念基础
translation_of: Synthetic_Data_and_Model_Collapse
---
乔鑫宝的**合成数据**研究关注生成数据、递归训练和模型坍缩。相关问题包括 [[Recursive_Synthetic_Data_Training|递归合成数据训练]]、[[Data_Selection|数据选择]]、[[Sample_Selection_Bias|样本选择偏差]]、[[Model_Collapse|模型坍缩]]、[[Data_Silos|数据孤岛]] 和 [[Wasserstein_Geometry|Wasserstein 几何]]。

## 引言

合成数据既能提供额外训练资源，也可能带来分布退化风险。生成样本可以降低真实数据访问成本、支持隐私友好的工作流，但若被选择后反复用于后续训练，也可能使训练分布逐代变窄。模型坍缩证据针对的是无差别递归复用，而不是所有合成数据用途；所引研究中，保留原始数据可以减轻退化。[^collapse] 这一权衡受到验证资源、本地选择偏差和协作评估方式的影响。

## 研究背景

合成样本可能提高覆盖面，也可能在递归使用中放大偏差、抹去模式或扭曲目标分布。当本地验证器把稀有但有效的样本误判为低质量生成结果时，低资源社区尤其容易丢失尾部模式。

## 论文

| 论文 | 会议/状态 |
| --- | --- |
| [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] | ICML 2026，2026年7月6日至11日，首尔。 |

## 与乔鑫宝工作的关系

[[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 研究局部选择偏差如何在低资源、数据孤岛化的递归训练中触发坍缩，并使用协作 Wasserstein 风格信号诊断该问题。这把合成数据可靠性连接到 [[AI_and_Networks|AI 与网络]]：关键困难不仅是生成质量，也包括各方对目标分布证据的分布式访问。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Synthetic_Data|合成数据（概念）]]
- [[Model_Collapse|模型坍缩]]
- [[Data_Silos|数据孤岛]]
- [[Collaborative_Evaluation|协作评估]]

[^collapse]: Shumailov 等人的 [“AI models collapse when trained on recursively generated data”](https://www.nature.com/articles/s41586-024-07566-y)（*Nature* 631，755-759，2024）是递归模型坍缩问题的一手参考，并报告了保留部分原始数据时退化减轻的结果。
