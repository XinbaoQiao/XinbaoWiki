---
name: "研究"
occupation: "研究概览"
summary: "乔鑫宝学术 wiki 的研究概览。"
language: "zh"
translation_of: "Research"
---

本页总结乔鑫宝学术 wiki 中的主要研究方向。它不是静态兴趣列表，而是由多个相互链接的专题页编译出的研究图谱。当前重心是 [[AI_and_Networks|AI 与网络]]。

## 研究主线

共同主线是 **网络约束下的数据过程可靠性**：当数据被选择、删除、合成、孤岛化、偏置化、隐私约束或通信约束时，如何设计学习算法。研究主要位于 AI 与网络、机器遗忘、合成数据和数据中心 ML 之间。按照 wiki 的维护方式，每个概念页保存一个稳定的局部综合，并继续连接论文、机构和相邻方法，使后续更新是在已有图谱上修订，而不是每次从零开始整理材料。

## AI 与网络

[[AI_and_Networks|AI 与网络]] 覆盖 AI 与网络通信系统的交叉：用于通信的 AI、服务 AI 的通信、去中心化学习、数据剪枝和协作评估。在当前 CUHK 博士阶段，这条主线包括[[Distributed_Wasserstein_Barycenter|Wasserstein barycenter 的分布式计算]]，即在不默认汇总原始数据的前提下，把多方局部分布组合成共享的分布参考。

## 机器遗忘

[[Machine_Unlearning|机器遗忘]] 研究删除请求后的认证数据删除和低成本更新机制。相关页面包括 [[Hessian_Free_Online_Certified_Unlearning|无 Hessian 在线认证遗忘]]、[[Soft_Weighted_Machine_Unlearning|超越二元擦除]]、[[DynFrs|DynFrs]]、[[Influence_Functions|影响函数]] 和 [[Certified_Data_Removal|认证数据删除]]。

## 合成数据

[[Synthetic_Data_and_Model_Collapse|合成数据]] 研究递归合成数据训练、[[Data_Selection|数据选择]]、[[Sample_Selection_Bias|样本选择偏差]]、[[Model_Collapse|模型坍缩]]，以及 [[Data_Silos|数据孤岛]] 中的协作缓解。中心论文是 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]。

## 数据中心 ML 与可信 AI

[[Data_Centric_Machine_Learning|数据中心 ML]] 覆盖数据选择、估值、过滤和评估。[[Trustworthy_AI|可信 AI]] 连接机器遗忘、公平性、鲁棒性、隐私、安全、可解释性和可靠性。

## 几何与分布式学习

[[Wasserstein_Geometry|Wasserstein 几何]]、[[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]] 与 [[Distributed_Learning|分布式学习]] 为协作评估、最优传输代理、去中心化数据访问，以及网络化 AI 系统中的分布参考提供工具。
