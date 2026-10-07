---
type: 研究概念
title: 大语言模型可靠性
description: 大语言模型系统在真实使用中的可靠性。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - llm
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-10-07T07:07:23.909Z'
content_hash: 'sha256:af816ed16b8daaba36aa9529f16e0f1d78392e0be36a597836823a11f807996e'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: 大语言模型可靠性
language: zh
summary: 大语言模型系统在真实使用中的可靠性。
occupation: 研究概念
translation_of: LLM_Reliability
---
**大语言模型可靠性** 关注大语言模型系统在真实使用中是否一致、安全且可信。可靠性不仅要求提高答对率，也包括在证据不足时能够适当弃答。

## 研究背景

乔鑫宝于 2025 年在 [[NUSRI_CQ|NUSRI-CQ]] 研究实习期间，从事可信 LLM 系统与合成数据评估研究。这里的可靠性涵盖幻觉、数据污染、评估泄漏、递归合成数据使用，以及对生成输出的错误信任等问题。这一问题也影响 [[Synthetic_Data_and_Model_Collapse|合成数据]]，因为生成文本或多模态数据可能进入未来训练管线。

近期证据进一步区分了两个问题。第一，流畅但错误的输出并不只意味着“知识缺失”：TruthfulQA 表明语言模型可能复现人类常见误解；2026 年 Nature 的研究则指出，只按准确率评价会在证据不足时奖励猜测，而不是弃答。[^truthfulness] 第二，基准得分不等同于泛化能力。如果评测样本与预训练数据重叠，得分可能被抬高；一篇 ICML 2025 论文把这种重叠作为可测量的数据集泄漏来研究，而不只把它视为抽象风险。[^leakage] 因此，可靠评估需要同时检查事实证据、弃答行为、基准时效性与潜在污染。

## 与乔鑫宝工作的关系

乔鑫宝的[[Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models|NeurIPS 2026 论文]]研究提示中的错觉模式如何导致虚假推理。这项工作与其更广泛的研究关注相连：当证据有限、分散、由模型生成或可能具有误导性时，AI 系统能否基于充分证据作出结论。

## 参见

- [[Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models|错觉模式感知驱动大语言模型的虚假推理]]
- [[NUSRI_CQ|NUSRI-CQ]]
- [[Synthetic_Data_and_Model_Collapse|合成数据]]
- [[Collaborative_Evaluation|协作评估]]
- [[Trustworthy_AI|可信 AI]]

[^truthfulness]: Lin、Hilton 与 Evans 提出的 [TruthfulQA](https://aclanthology.org/2022.acl-long.229/) 用于衡量模型是否会模仿常见错误信念。Kalai 等人随后在 [Nature 2026 论文](https://www.nature.com/articles/s41586-026-10549-w)中说明，下一词预测和只看准确率的评估可能奖励缺乏依据的猜测，并提出把弃答激励写入评估规则。

[^leakage]: Choi 等人的 ICML 2025 论文 [“How Contaminated Is Your Benchmark? Measuring Dataset Leakage in Large Language Models with Kernel Divergence”](https://proceedings.mlr.press/v267/choi25b.html)指出，评测集与预训练数据重叠会抬高评估指标，并在受控污染实验中研究了测量这种泄漏的方法。
