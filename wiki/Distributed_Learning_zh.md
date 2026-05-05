---
name: "分布式学习"
occupation: "研究概念"
summary: "解释数据、计算或通信去中心化条件下的学习问题。"
language: "zh"
translation_of: "Distributed_Learning"
---

**分布式学习** 覆盖数据、计算或优化步骤分散在多个客户端、设备、机构或工作节点上的学习设置。在本 wiki 中，它包括去中心化和联邦式问题，但作为描述性概念使用，并不限定于某一种协议。[^fed]

## 在本 wiki 中的作用

分布式学习是 [[AI_and_Networks|AI 与网络]] 的基础页。它解释为什么网络化 AI 与中心化训练具有不同约束：通信可能昂贵，本地数据可能非独立同分布，隐私或所有权也可能限制可共享内容。这些约束使数据选择和剪枝变得更重要，因为传输或训练所有可用数据往往并不现实。

## 与乔鑫宝工作的关系

[[Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters]] 直接位于本页主题之下，研究数据剪枝如何提高去中心化学习效率。相同视角也间接出现在合成数据工作中：多个孤岛需要在没有汇总数据集的情况下判断分布漂移。分布式学习因此为乔鑫宝当前 AI 与网络方向提供基础设施背景。

## 参见

- [[AI_and_Networks|AI 与网络]]
- [[Data_Selection|数据选择]]
- [[Data_Silos|数据孤岛]]
- [[Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters]]

[^fed]: McMahan 等人的 “Communication-Efficient Learning of Deep Networks from Decentralized Data”（AISTATS 2017）是联邦学习与通信高效去中心化优化的标准参考之一。

