---
name: "合成数据"
image: "/topics/synthetic-data.png"
image_caption: "合成数据主题图"
aliases:
  - "Synthetic Data and Model Collapse"
occupation: "研究专题"
summary: "关于合成数据、递归训练、选择偏差和模型坍缩的研究专题。"
language: "zh"
translation_of: "Synthetic_Data_and_Model_Collapse"
---

**合成数据** 是本 wiki 对乔鑫宝关于生成数据、递归训练和模型坍缩研究的简短专题名。完整研究簇还包括 [[Recursive_Synthetic_Data_Training|递归合成数据训练]]、[[Data_Selection|数据选择]]、[[Sample_Selection_Bias|样本选择偏差]]、[[Model_Collapse|模型坍缩]]、[[Data_Silos|数据孤岛]] 和 [[Wasserstein_Geometry|Wasserstein 几何]]。[^collapse]

## 引言

该专题把合成数据同时视为资源和风险。生成样本可以降低真实数据访问成本、支持隐私友好的工作流，但若被选择后反复用于后续训练，也可能使训练分布逐代变窄。本页记录的核心张力正是偏置本地选择与协作验证之间的关系。

## 在本 wiki 中的作用

主页只需要用“合成数据”提示研究方向；本页则展开长技术背景。合成样本可能提高覆盖面，也可能在递归使用中放大偏差、抹去模式或扭曲目标分布。因此，本 wiki 同时把合成数据当作可用资产和潜在失效模式。

## 论文

| 论文 | 会议/状态 |
| --- | --- |
| [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] | ICML 2026，2026年7月6日至11日，首尔。 |

## 与乔鑫宝工作的关系

[[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 研究局部选择偏差如何在数据孤岛下触发递归合成数据训练的坍缩，并使用协作 Wasserstein 风格信号诊断该问题。这把合成数据可靠性连接到 [[AI_and_Networks|AI 与网络]]：关键困难不仅是生成质量，也包括各方对目标分布证据的分布式访问。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Synthetic_Data|合成数据（概念）]]
- [[Model_Collapse|模型坍缩]]
- [[Data_Silos|数据孤岛]]
- [[Collaborative_Evaluation|协作评估]]

[^collapse]: Shumailov 等人的 “AI models collapse when trained on recursively generated data”（Nature 2024）是递归模型坍缩问题的常见参考。

