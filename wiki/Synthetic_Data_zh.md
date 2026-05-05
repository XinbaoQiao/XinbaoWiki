---
name: "合成数据（概念）"
occupation: "研究概念"
summary: "解释用于训练、评估或隐私友好协作的生成数据。"
language: "zh"
translation_of: "Synthetic_Data"
---

**合成数据** 指被用来替代、补充或代理真实数据的生成样本。在机器学习中，合成数据可以扩大覆盖面、降低标注成本、保护隐私，或在真实数据稀缺时支持评估；但如果缺乏真实数据锚点并被递归复用，也会引入失效模式。

## 在本 wiki 中的作用

本页提供狭义概念定义；[[Synthetic_Data_and_Model_Collapse|合成数据]] 专题页则覆盖乔鑫宝的完整研究簇。这个区分有用：作为工具的合成数据可能有益，而递归合成数据训练是一种具有独立风险的过程。读者可以从本页进入模型坍缩研究线。

## 与乔鑫宝工作的关系

乔鑫宝的 ICML 2026 工作研究选择偏差和数据孤岛条件下的合成数据。核心问题并非数据是否由模型生成，而是生成数据是否嵌入了重复训练循环。当每一代都从前一代有偏选择的输出中学习时，合成分布可能偏离原始分布。该项目连接 [[Data_Selection|数据选择]]、[[Model_Collapse|模型坍缩]] 和 [[Collaborative_Evaluation|协作评估]]。

## 参见

- [[Synthetic_Data_and_Model_Collapse|合成数据]]
- [[Recursive_Synthetic_Data_Training|递归合成数据训练]]
- [[Sample_Selection_Bias|样本选择偏差]]
- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]

