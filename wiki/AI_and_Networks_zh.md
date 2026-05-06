---
name: "AI 与网络"
image: "/topics/ai-and-networks.png"
image_caption: "AI 与网络主题图"
occupation: "研究专题"
summary: "乔鑫宝当前主要研究专题，涵盖网络化数据与通信约束下的 AI 系统。"
language: "zh"
translation_of: "AI_and_Networks"
---

**AI 与网络** 是本 wiki 中描述 [[Xinbao_Qiao|乔鑫宝]] 当前研究重心的总括性标签。这里的“网络”并不只指通信网络本身，也包括数据所在位置、信息如何流动、哪些机构可以评估模型，以及学习系统在通信、隐私和数据孤岛约束下如何保持可靠。[^sources]

## 引言

在本 wiki 中，AI 与网络不是一个单独应用场景，而是一个组织研究脉络的框架。它关注学习过程如何被数据分布、通信成本、边缘设备、去中心化协作和跨机构评估所塑造。相关问题包括分布式计算、去中心化学习中的数据剪枝、数据孤岛中的协作评估，以及合成数据在有限访问条件下的验证。

## 在本 wiki 中的作用

本页是乔鑫宝研究图谱中最上层的研究专题页面。它把本科通信工程背景、硕士阶段的数据中心机器学习工作，以及博士阶段的信息工程研究连接起来。若模型性能受数据位置和信息流动方式影响，那么算法设计就不能只看中心化训练精度，也要同时考虑通信延迟、局部偏差、隐私和部署代价。本页因此连接 [[Distributed_Learning|分布式学习]]、[[Data_Silos|数据孤岛]]、[[Collaborative_Evaluation|协作评估]]、[[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]] 和去中心化训练的数据剪枝。

## 当前博士阶段关注点

在 CUHK 博士阶段，乔鑫宝近期在该方向下关注[[Distributed_Wasserstein_Barycenter|Wasserstein barycenter 的分布式计算]]。这一问题适合放在 AI 与网络框架下：每个参与方可能只持有局部经验分布，而系统需要一个集体分布参考来进行比较、验证或控制。因此，重点不仅是中心化统计目标，也包括满足通信与数据访问约束的算法。

## 论文

| 论文 | 会议/状态 |
| --- | --- |
| [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] | ICML 2026，2026年7月6日至11日，首尔。 |

## 与乔鑫宝工作的关系

[[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 把问题放在合成数据与数据孤岛中，研究单个本地验证者如何造成递归训练分布变窄。当前 Wasserstein barycenter 关注点延续了这一脉络：参考分布不是默认集中存在的对象，而可能需要跨网络计算出来。早期 [[Machine_Unlearning|机器遗忘]] 工作也体现同一系统视角：算法不仅要准确，还要在删除、更新、通信和延迟成本上可用。

## 参见

- [[Distributed_Learning|分布式学习]]
- [[Data_Silos|数据孤岛]]
- [[Collaborative_Evaluation|协作评估]]
- [[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]]
- [[Data_Centric_Machine_Learning|数据中心 ML]]
- [[The_Chinese_University_of_Hong_Kong|香港中文大学]]

[^sources]: 该专题名称与 CUHK IE 的[官方系所介绍](https://www.ie.cuhk.edu.hk/about-the-department/)相一致：信息工程同时处理信息的生成、传输、存储、处理与应用；ICML 2026 的会议时间来自[官方会议页面](https://icml.cc/Conferences/2026)。
