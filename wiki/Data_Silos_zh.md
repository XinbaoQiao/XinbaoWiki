---
name: "数据孤岛"
occupation: "研究概念"
summary: "解释数据分布在不同持有者之间时的学习与评估问题。"
language: "zh"
translation_of: "Data_Silos"
---

**数据孤岛** 是组织、法律、技术或地理隔离造成的状态，使所有训练数据无法被汇集到一个地方。在本 wiki 中，该词指各自只持有目标分布局部视角的机构、设备或客户端。

## 在本 wiki 中的作用

数据孤岛是 [[AI_and_Networks|AI 与网络]] 区别于普通中心化机器学习的关键原因。当每一方只看到本地数据时，训练和评估必须面对通信、隐私和代表性约束。孤岛能保护数据所有权，但也会让全局诊断更困难：偏差可能在本地不可见，只有比较多方证据时才显现。

## 与乔鑫宝工作的关系

数据孤岛是 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 的核心设置，论文研究局部样本选择偏差下的递归合成数据训练。它也激励 [[Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters]]：去中心化学习必须决定哪些数据值得通信或保留。两个问题都不是单纯模型精度问题，而是多方如何在不假定完整数据访问的情况下协调。

## 参见

- [[AI_and_Networks|AI 与网络]]
- [[Distributed_Learning|分布式学习]]
- [[Collaborative_Evaluation|协作评估]]
- [[Sample_Selection_Bias|样本选择偏差]]

