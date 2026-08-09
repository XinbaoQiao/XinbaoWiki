---
type: 研究概念
title: 大语言模型可靠性
description: 解释大语言模型系统可靠性问题的概念页。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - llm
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-08-09T18:32:45.773Z'
content_hash: 'sha256:eaee39fcbfdc086b2eb5337244acb6ae9f264f286710ebe156de116eb56af51f'
reviewed_at: '2026-08-10T02:34:00+08:00'
review_due: '2027-02-05'
language: zh
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-08-10T02:34:00+08:00'
  reviewDue: '2027-02-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:LLM_Reliability_zh'
  chunking: markdown-heading-v1
source_ids:
  - src-11be10768dbb7de0
  - src-44708abf72c85407
  - src-8e21f24eb6b80d2c
source_path: wiki/LLM_Reliability_zh.md
---
**大语言模型可靠性** 关注大语言模型系统在真实使用中是否一致、安全且可信。在本 wiki 中，该概念与合成数据、评估和可信系统相连，而不是作为单独的产品开发路线。可靠性不仅要求提高答对率，也包括在证据不足时能够适当弃答。

## 在本 wiki 中的作用

本页为乔鑫宝 2025 年在 [NUSRI-CQ](./NUSRI_CQ_zh.md) 的研究实习提供背景。传记中该阶段记录为可信 LLM 系统与合成数据评估。这里的可靠性涵盖幻觉、数据污染、评估泄漏、递归合成数据使用，以及对生成输出的错误信任等问题。它被链接到 [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md)，因为生成文本或多模态数据可能进入未来训练管线。

近期证据进一步区分了两个问题。第一，流畅但错误的输出并不只意味着“知识缺失”：TruthfulQA 表明语言模型可能复现人类常见误解；2026 年 Nature 的研究则指出，只按准确率评价会在证据不足时奖励猜测，而不是弃答。[^truthfulness] 第二，基准得分不等同于泛化能力。如果评测样本与预训练数据重叠，得分可能被抬高；一篇 ICML 2025 论文把这种重叠作为可测量的数据集泄漏来研究，而不只把它视为抽象风险。[^leakage] 因此，可靠评估需要同时检查事实证据、弃答行为、基准时效性与潜在污染。

## 与乔鑫宝工作的关系

乔鑫宝公开的论文页目前主要强调机器遗忘、AI 与网络，以及合成数据模型坍缩，而不是单独的 LLM 论文。因此本页保持保守：它记录研究背景，并把 LLM 可靠性连接到 wiki 中已有方法。相关方法桥梁是“证据不完美时的评估”，尤其当数据是生成的、分布式的或训练前被选择过。

## 参见

- [NUSRI-CQ](./NUSRI_CQ_zh.md)
- [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md)
- [协作评估](./Collaborative_Evaluation_zh.md)
- [可信 AI](./Trustworthy_AI_zh.md)

[^truthfulness]: Lin、Hilton 与 Evans 提出的 [TruthfulQA](https://aclanthology.org/2022.acl-long.229/) 用于衡量模型是否会模仿常见错误信念。Kalai 等人随后在 [Nature 2026 论文](https://www.nature.com/articles/s41586-026-10549-w)中说明，下一词预测和只看准确率的评估可能奖励缺乏依据的猜测，并提出把弃答激励写入评估规则。

[^leakage]: Choi 等人的 ICML 2025 论文 [“How Contaminated Is Your Benchmark? Measuring Dataset Leakage in Large Language Models with Kernel Divergence”](https://proceedings.mlr.press/v267/choi25b.html)指出，评测集与预训练数据重叠会抬高评估指标，并在受控污染实验中研究了测量这种泄漏的方法。
