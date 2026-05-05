---
name: "样本选择偏差"
occupation: "研究概念"
summary: "解释非代表性样本选择引入的分布偏差。"
language: "zh"
translation_of: "Sample_Selection_Bias"
---

**样本选择偏差** 发生在被选用于训练或评估的数据不能代表模型应处理的人群或目标分布时。在本 wiki 中，该概念很重要，因为当模型反复训练在生成数据或本地过滤数据上时，选择偏差会逐代累积。

## 在本 wiki 中的作用

本页解释 [[Synthetic_Data_and_Model_Collapse|合成数据]] 失效背后的机制。选择偏差不只是“数据集有问题”的标签，而是一个过程：一旦某个子集被偏好，缺失模式获得的样本会更少，模型生成它们的概率会下降，下一轮数据也会进一步变窄。在网络化设置中，不同参与方的偏差还可能不同，使诊断更难。

## 与乔鑫宝工作的关系

ICML 2026 论文 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 直接把该概念放入标题。论文研究局部选择行为如何在递归合成数据训练中促成坍缩，以及协作信号如何诊断分布漂移。本页因此是乔鑫宝合成数据研究线最直接的背景条目之一。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Data_Selection|数据选择]]
- [[Model_Collapse|模型坍缩]]
- [[Data_Silos|数据孤岛]]

