# Xinbaopedia OKF Bundle

This bundle exposes the public Xinbaopedia wiki as Markdown concepts with OKF v0.1-compatible frontmatter.

## Entry Points

- [Manifest](manifest.json) - bundle metadata and maintenance contract.
- [Graph](graph.json) - generated concept graph, backlinks, lifecycle metadata, and quality warnings.
- [Pages](pages.json) - public page catalog for lightweight consumers.
- [Schema](schema.json) - source and maintenance schema contract.
- [Sources](sources.json) - stable source IDs, page associations, and verification state.
- [Quality report](quality-report.json) - source, citation, review, relation, and retrieval coverage.
- [Update log](log.md) - chronological wiki maintenance history.

## Licensing

Original textual content and knowledge-graph metadata in this bundle are available under CC BY 4.0 only to the extent the licensor owns the applicable rights.
Software, protected media, brand assets, and third-party material have different terms. See the [repository licensing policy](https://github.com/XinbaoQiao/XinbaoWiki/blob/main/LICENSING.md).
Recommended attribution: "Xinbao Qiao and Xinbaopedia contributors, Xinbaopedia, https://github.com/XinbaoQiao/XinbaoWiki, CC BY 4.0." Indicate changes.

## Concepts

### 博士生

- [乔鑫宝](concepts/Qiao_Xinbao_zh.md) - 香港中文大学信息工程系博士生；研究方向包括数据中心 ML、AI for Networks、Networks for AI、机器遗忘和合成数据可靠性

### 公立研究型大学

- [山东大学](concepts/Shandong_University_zh.md) - 乔鑫宝本科阶段所在机构。
- [香港中文大学](concepts/The_Chinese_University_of_Hong_Kong_zh.md) - 乔鑫宝当前博士阶段所在机构。
- [浙江大学](concepts/Zhejiang_University_zh.md) - 乔鑫宝硕士阶段所在机构。

### 技术技能

- [技能](concepts/Skills_zh.md) - 乔鑫宝 CV 中列出的技术技能。

### 教育时间线

- [教育经历](concepts/Education_zh.md) - 乔鑫宝的教育时间线。

### 论文列表

- [论文](concepts/Publications_zh.md) - 乔鑫宝的论文索引。

### 模型族

- [随机森林](concepts/Random_Forest_zh.md) - 随机化决策树集成模型及其在 DynFrs 中的高效维护。

### 维护日志

- [日志](concepts/log_zh.md) - Wiki 的追加式维护日志。

### 项目概览

- [项目](concepts/Projects_zh.md) - AI 与网络、机器遗忘、合成数据及语言模型可靠性研究项目。

### 研究概览

- [研究](concepts/Research_zh.md) - 乔鑫宝在数据中心机器学习、AI 与网络及可信 AI 领域的研究。

### 研究概念

- [大语言模型可靠性](concepts/LLM_Reliability_zh.md) - 大语言模型系统在真实使用中的可靠性。
- [递归合成数据训练](concepts/Recursive_Synthetic_Data_Training_zh.md) - 反复使用前代模型生成的数据进行训练。
- [分布式 Wasserstein Barycenter](concepts/Distributed_Wasserstein_Barycenter_zh.md) - 根据各方本地数据计算共享的 Wasserstein 参考分布。
- [分布式学习](concepts/Distributed_Learning_zh.md) - 数据、计算或评估分散于多个参与方的学习方式。
- [公平性与鲁棒性](concepts/Fairness_and_Robustness_zh.md) - 以公平性与鲁棒性为目标的数据驱动模型修正。
- [合成数据（概念）](concepts/Synthetic_Data_zh.md) - 用于训练、评估与协作的生成数据。
- [可解释性](concepts/Interpretability_zh.md) - 理解模型行为及训练数据的影响。
- [模型坍缩](concepts/Model_Collapse_zh.md) - 递归模型训练中的分布退化。
- [认证数据删除](concepts/Certified_Data_Removal_zh.md) - 机器遗忘中的数据删除保证。
- [数据孤岛](concepts/Data_Silos_zh.md) - 数据共享受限时的跨机构学习与评估。
- [数据选择](concepts/Data_Selection_zh.md) - 可靠性约束下的训练与评估数据选择。
- [协作评估](concepts/Collaborative_Evaluation_zh.md) - 利用多方证据评估模型与数据处理过程。
- [样本选择偏差](concepts/Sample_Selection_Bias_zh.md) - 数据选择如何使训练或评估所依据的分布产生偏差。
- [影响函数](concepts/Influence_Functions_zh.md) - 估计训练样本对已训练模型影响的方法。
- [Wasserstein 几何](concepts/Wasserstein_Geometry_zh.md) - 利用最优传输几何比较概率分布。

### 研究经历

- [研究经历](concepts/Experience_zh.md) - 研究经历与机构关系。

### 研究院

- [NUSRI-CQ](concepts/NUSRI_CQ_zh.md) - 乔鑫宝研究实习阶段所在机构。

### 研究专题

- [合成数据](concepts/Synthetic_Data_and_Model_Collapse_zh.md) - 关于合成数据、递归训练、低资源验证、选择偏差和模型坍缩的研究专题。
- [机器遗忘](concepts/Machine_Unlearning_zh.md) - 研究如何从已训练模型中删除、降低或纠正数据影响。
- [可信 AI](concepts/Trustworthy_AI_zh.md) - 覆盖可靠性、删除、公平性、鲁棒性、可解释性和评估的研究专题。
- [数据中心 ML](concepts/Data_Centric_Machine_Learning_zh.md) - 关注数据质量、选择、估值、修正和治理的研究专题。
- [AI 与网络](concepts/AI_and_Networks_zh.md) - 乔鑫宝当前主要研究专题，涵盖网络化数据与通信约束下的 AI 系统。

### 资源记录

- [主页肖像资源](concepts/Old_Homepage_Resources_zh.md) - 乔鑫宝个人主页中的肖像与会议图片。

### Academic advisor

- [张萌](concepts/Meng_Zhang_zh.md) - 浙江大学教师，乔鑫宝硕士导师。
- [张颖珺](concepts/Angela_Yingjun_Zhang_zh.md) - 香港中文大学信息工程系教授，乔鑫宝博士导师。
- [Angela Yingjun Zhang](concepts/Angela_Yingjun_Zhang.md) - CUHK Information Engineering professor and doctoral advisor of Xinbao Qiao.
- [Meng Zhang](concepts/Meng_Zhang.md) - Zhejiang University faculty member and master's advisor of Xinbao Qiao.

### CV 摘要

- [简历](concepts/CV_zh.md) - 乔鑫宝的学术简历摘要。

### CV summary

- [Curriculum Vitae](concepts/CV.md) - Academic CV summary for Xinbao Qiao.

### Education timeline

- [Education](concepts/Education.md) - Education timeline for Qiao Xinbao.

### Maintenance log

- [Log](concepts/log.md) - Append-only maintenance log for the wiki.

### Model family

- [Random Forest](concepts/Random_Forest.md) - Randomized tree ensembles and their efficient maintenance in DynFrs.

### PhD student

- [Xinbao Qiao](concepts/Xinbao_Qiao.md) - PhD student in Information Engineering at The Chinese University of Hong Kong; researcher in data-centric ML, AI for Networks, Networks for AI, machine unlearning, and synthetic-data reliability

### Project overview

- [Projects](concepts/Projects.md) - Research projects in AI and networks, machine unlearning, synthetic data, and reliable language models.

### Public research university

- [Shandong University](concepts/Shandong_University.md) - Undergraduate institution of Xinbao Qiao.
- [The Chinese University of Hong Kong](concepts/The_Chinese_University_of_Hong_Kong.md) - Current doctoral institution of Xinbao Qiao.
- [Zhejiang University](concepts/Zhejiang_University.md) - Master's institution of Xinbao Qiao.

### publication

- [超越二元擦除：用于公平性与鲁棒性的软加权遗忘](concepts/Soft_Weighted_Machine_Unlearning_zh.md) - AAAI 2026 论文，研究用于公平性与鲁棒性修正的软加权机器遗忘。
- [错觉模式感知驱动大语言模型的虚假推理](concepts/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh.md) - NeurIPS 2026 论文，研究错觉模式感知与大语言模型的虚假推理。
- [无 Hessian 在线认证遗忘](concepts/Hessian_Free_Online_Certified_Unlearning_zh.md) - ICLR 2025 论文，研究无显式 Hessian 求逆的高效认证机器遗忘。
- [样本选择偏差何以促成模型坍缩](concepts/When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) - ICML 2026 论文，研究低资源验证场景、样本选择偏差、模型坍缩与协作 Wasserstein 几何代理。
- [Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness](concepts/Soft_Weighted_Machine_Unlearning.md) - AAAI 2026 paper on soft-weighted unlearning for fairness and robustness correction.
- [Decentralized Free-Support Wasserstein Barycenter](concepts/Decentralized_Free_Support_Wasserstein_Barycenter.md) - Under-review manuscript on movable barycenter supports and shared geometric references under decentralized communication.
- [Decentralized Free-Support Wasserstein Barycenter](concepts/Decentralized_Free_Support_Wasserstein_Barycenter_zh.md) - 在审稿件，研究可移动支撑点如何在去中心化通信约束下构建共享几何参考。
- [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](concepts/DynFrs.md) - ICLR 2025 paper on efficient machine unlearning for random forests.
- [DynFrs：随机森林机器遗忘高效框架](concepts/DynFrs_zh.md) - ICLR 2025 论文，研究随机森林中的高效机器遗忘。
- [Hessian-Free Online Certified Unlearning](concepts/Hessian_Free_Online_Certified_Unlearning.md) - ICLR 2025 paper on efficient Hessian-free certified machine unlearning.
- [Illusory Pattern Perception Drives Spurious Inference in Large Language Models](concepts/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models.md) - NeurIPS 2026 paper on illusory pattern perception and spurious inference in large language models.
- [When Sample Selection Bias Precipitates Model Collapse](concepts/When_Sample_Selection_Bias_Precipitates_Model_Collapse.md) - ICML 2026 paper on low-resource verification regimes, sample-selection bias, model collapse, and collaborative Wasserstein-geometry proxies.

### Publication list

- [Publications](concepts/Publications.md) - Publication list for Qiao Xinbao.

### Research concept

- [Certified Data Removal](concepts/Certified_Data_Removal.md) - Deletion guarantees in machine unlearning.
- [Collaborative Evaluation](concepts/Collaborative_Evaluation.md) - Evaluation of models and data processes using evidence from multiple parties.
- [Data Selection](concepts/Data_Selection.md) - Selection of training or evaluation data under reliability constraints.
- [Data Silos](concepts/Data_Silos.md) - Learning and evaluation across institutions with limited data sharing.
- [Distributed Learning](concepts/Distributed_Learning.md) - Learning with data, computation, or evaluation distributed across participants.
- [Distributed Wasserstein Barycenter](concepts/Distributed_Wasserstein_Barycenter.md) - Computing a shared Wasserstein reference distribution from locally held data.
- [Fairness and Robustness](concepts/Fairness_and_Robustness.md) - Fairness and robustness as goals of data-driven model correction.
- [Influence Functions](concepts/Influence_Functions.md) - Methods for estimating how training examples affect learned models.
- [Interpretability](concepts/Interpretability.md) - Understanding model behavior and the influence of training data.
- [LLM Reliability](concepts/LLM_Reliability.md) - Reliability of large language model systems in realistic use.
- [Model Collapse](concepts/Model_Collapse.md) - Distributional degradation during recursive model training.
- [Recursive Synthetic Data Training](concepts/Recursive_Synthetic_Data_Training.md) - Repeated training on data generated by earlier models.
- [Sample Selection Bias](concepts/Sample_Selection_Bias.md) - How data selection can distort the distribution used for learning or evaluation.
- [Synthetic Data (concept)](concepts/Synthetic_Data.md) - Generated data used for training, evaluation, and collaboration.
- [Wasserstein Geometry](concepts/Wasserstein_Geometry.md) - Comparison of probability distributions using optimal-transport geometry.

### Research experience

- [Experience](concepts/Experience.md) - Research experience and affiliations.

### Research institute

- [NUSRI-CQ](concepts/NUSRI_CQ.md) - Research internship institution of Xinbao Qiao.

### Research overview

- [Research](concepts/Research.md) - Xinbao Qiao's research on data-centric machine learning, AI and networks, and trustworthy AI.

### Research topic

- [AI and Networks](concepts/AI_and_Networks.md) - Primary research topic for Qiao Xinbao, covering AI systems under networked data and communication constraints.
- [Data Centric ML](concepts/Data_Centric_Machine_Learning.md) - Research topic focused on data quality, selection, valuation, correction, and governance.
- [Machine Unlearning](concepts/Machine_Unlearning.md) - Research topic on removing or correcting data influence from trained models.
- [Synthetic Data](concepts/Synthetic_Data_and_Model_Collapse.md) - Research topic on synthetic data, recursive training, low-resource verification, selection bias, and model collapse.
- [Trustworthy AI](concepts/Trustworthy_AI.md) - Research topic covering reliability, deletion, fairness, robustness, interpretability, and evaluation.

### Resource inventory

- [Homepage Portrait Resources](concepts/Old_Homepage_Resources.md) - Portraits and conference images on Xinbao Qiao's homepage.

### Technical skills

- [Skills](concepts/Skills.md) - Technical skills listed in Qiao Xinbao's CV.

### Wiki 索引

- [索引](concepts/index_zh.md) - Xinbaopedia 公开页面导航索引。

### Wiki index

- [Index](concepts/index.md) - Navigation index for public Xinbaopedia pages.
