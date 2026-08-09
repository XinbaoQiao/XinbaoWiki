---
type: CV 摘要
title: 简历
description: 乔鑫宝的学术简历摘要。
tags:
  - zh
  - cv
  - profile
  - cv-摘要
timestamp: '2026-07-02T19:37:18+08:00'
modified: '2026-08-09T18:32:45.747Z'
content_hash: 'sha256:0c7772f84c5ccec8d04862a487dac3cbf216c398cbaf59e24919b2bbe1fd9d8c'
reviewed_at: '2026-08-10T02:34:00+08:00'
review_due: '2026-11-07'
language: zh
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-08-10T02:34:00+08:00'
  reviewDue: '2026-11-07'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:CV_zh'
  chunking: markdown-heading-v1
source_ids:
  - src-03bf1b2f9af65762
  - src-0642a11373a83c47
  - src-18fe2e2db0ff8b6a
  - src-19cdc04d387acf77
  - src-3234eea5652932e1
  - src-4144e3776ac496d0
  - src-53e1199f272a4df4
  - src-65d81b8aca549860
  - src-688381b8e9d8ad65
  - src-716564daa4b6397f
  - src-94b169d5c233e588
  - src-9b2be44d3f13005a
  - src-a0a9b7171dc028d2
  - src-b0de54fe614fa11d
  - src-cea294f51d3559e8
  - src-da17eb3884244bd3
  - src-faaafad831fbefc5
source_path: wiki/CV_zh.md
---
本页为读者整理乔鑫宝的学术简历要点。可下载版本见 [résumé](/files/XinbaoQiao_CV.pdf)。

## 联系方式

- 电话：[+852-70141618](tel:+85270141618)
- 邮箱：[xinbaoqiao@cuhk.edu.hk](mailto:xinbaoqiao@cuhk.edu.hk)
- 主页：[xinbaopedia.top](https://xinbaopedia.top/)
- GitHub：[GitHub](https://github.com/XinbaoQiao)
- LinkedIn：[LinkedIn](https://www.linkedin.com/in/xinbaoqiao/)
- Google Scholar：[Google Scholar](https://scholar.google.com/citations?view_op=search_authors&mauthors=Xinbao+Qiao)

## 教育经历

- **香港中文大学**，信息工程博士生，2026 年 8 月 1 日至今。导师为 [张颖珺](https://www.ie.cuhk.edu.hk/faculty/zhang-yingjun-angela/)。
- **浙江大学**，人工智能工学硕士，2022-09 至 2025-12。
- **山东大学**，通信工程工学学士，2018-09 至 2022-07。

## 研究兴趣

- 乔鑫宝的研究主要关注 AI 模型中数据的生命周期管理，重点研究数据在生成、使用和删除过程中产生的理论方法和实际问题。其近期工作旨在提升异构、计算受限和通信受限环境中 AI 模型的可靠性、可解释性和可控性。

## 研究经历

- **香港中文大学博士阶段研究**，2026 年 8 月 1 日至今，导师 [张颖珺](https://www.ie.cuhk.edu.hk/faculty/zhang-yingjun-angela/)。研究分布式 AI 系统中的数据生命周期管理，将数据生成、使用和删除问题与联邦表示几何联系起来。
  - Paper #5：提出联邦学习的最优传输视角，并构建面向通信受限表示几何的 barycentric multi-prototype classifier。
- **数据中心机器学习系统研究**，2023-03 至 2025-12，导师 [张萌](https://person.zju.edu.cn/mengzhang) 教授，机构 [浙江大学](./Zhejiang_University_zh.md)。构建面向数据删除的机器遗忘方法，覆盖连续影响权重、在线认证更新和动态树集成模型。
  - Paper #2：提出面向连续影响权重的 soft-weighted unlearning，支持超越二元删除的公平性和鲁棒性干预。
  - Paper #3：提出基于 recollected trajectory statistics 的无 Hessian 在线认证遗忘，避免显式 Hessian 求逆并支持流式删除请求。
  - Paper #4：构建用于动态在线环境的精确高效随机森林遗忘框架，通过更新受影响的树统计量替代重训。
- **可信 LLM 系统研究**，2025-06 至 2025-12，全职研究实习，导师 PANG Yan, James，机构 [新加坡国立大学重庆研究院（NUSRI-CQ）](./NUSRI_CQ_zh.md)。分析模型在递归选择的合成数据上训练，或从提示中推断虚假模式时出现的可靠性失效。
  - Paper #1：说明递归合成数据训练中的样本选择如何在低资源验证下剪除尾部样本并诱发模型坍缩。
  - Paper #6：分析错觉模式感知如何成为 LLM 虚假推理机制，尤其是感知到的模式压过基于证据的推理时。

## 开源贡献与学术服务

- **研究代码发布**：维护已录用论文的公开代码，包括认证遗忘、软加权机器遗忘和样本选择偏差导致模型坍缩等方向。
- **Xinbaopedia**：维护公开学术主页和 wiki 式研究档案，包括论文页面、图表、CV 与项目记录。
- **学术审稿，2026 年**：担任 ICML、NeurIPS 和 AAAI 审稿人。
- **学术审稿，2025 年**：担任 NeurIPS、ICLR、AAAI 和 IEEE TNNLS 审稿人。

## 论文

见 [论文](./Publications_zh.md)。简历列出已录用、已公开和在审的机器遗忘、去中心化学习、合成数据模型坍缩、联邦学习与 LLM 可靠性工作。

星号（*）表示共同第一作者；剑号（†）表示通讯作者。

- **Paper #1: When Sample Selection Bias Precipitates Model Collapse**。\
  **乔鑫宝**†、Xianglong Du、Wei Liu、Jingqi Zhang、Peihua Mai、张萌†、Yan Pang†。\
  Forty-Third International Conference on Machine Learning, ICML, 2026。链接：[OpenReview](https://openreview.net/forum?id=FFXvnzM254)、[arXiv](https://arxiv.org/abs/2606.13732)、[GitHub](https://github.com/XinbaoQiao/When-Sample-Selection-Bias-Precipitates-Model-Collapse)。
- **Paper #2: Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness**。\
  **乔鑫宝**、Ningning Ding、Yushi Cheng、张萌†。\
  Fortieth AAAI Conference on Artificial Intelligence, AAAI, 2026。链接：[arXiv](https://arxiv.org/abs/2505.18783)、[AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/39681)。
- **Paper #3: Hessian-Free Online Certified Unlearning**。\
  **乔鑫宝**、张萌†、Ming Tang、Ermin Wei。\
  Thirteenth International Conference on Learning Representations, ICLR, 2025。链接：[OpenReview](https://openreview.net/forum?id=C3TrHWanh5)、[arXiv](https://arxiv.org/abs/2404.01712)、[GitHub](https://github.com/XinbaoQiao/Hessian-Free-Certified-Unlearning)。
- **Paper #4: DynFrs: An Efficient Framework for Machine Unlearning in Random Forest**。\
  Shurong Wang、Zhuoyang Shen、**乔鑫宝**、Tongning Zhang、张萌†。\
  Thirteenth International Conference on Learning Representations, ICLR, 2025。链接：[OpenReview](https://openreview.net/forum?id=nsCOeCLR8e)、[arXiv](https://arxiv.org/abs/2410.01588)、[GitHub](https://github.com/shurongwang/DynFrs)。
- **Paper #5: Federated Learning as Optimal Transport: Barycentric Multi-Prototype Classification**。\
  **乔鑫宝**、Wenjing Yan†、Ying-Jun Angela Zhang。\
  在审。
- **Paper #6: Illusory Pattern Perception Drives Spurious Inference in Large Language Models**。\
  Peihua Mai、Zhuoyan Shao、**乔鑫宝**、张萌、Xinyue Zhou†、Yan Pang†。\
  在审。
