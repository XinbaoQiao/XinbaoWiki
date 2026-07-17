---
type: CV summary
title: Curriculum Vitae
description: Academic CV summary for Xinbao Qiao.
tags:
  - en
  - cv
  - profile
  - cv-summary
timestamp: '2026-07-02T19:37:18+08:00'
modified: '2026-07-13T21:35:14+08:00'
content_hash: 'sha256:b5007348122639a3571ac4d3c9cf928b75dba7755a15f7e14497a9c046590503'
reviewed_at: '2026-07-13T21:35:14+08:00'
review_due: '2026-10-11'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-07-13T21:35:14+08:00'
  reviewDue: '2026-10-11'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:CV'
  chunking: markdown-heading-v1
source_ids:
  - src-03bf1b2f9af65762
  - src-0642a11373a83c47
  - src-18fe2e2db0ff8b6a
  - src-19cdc04d387acf77
  - src-22eeced7ebe7a0c5
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
source_path: wiki/CV.md
---
This page summarizes Xinbao Qiao's academic CV for wiki readers. A downloadable résumé is available as [résumé](/files/XinbaoQiao_CV.pdf).

## Contact

- Phone: [+852-70141618](tel:+85270141618)
- Email: [xinbaoqiao@cuhk.edu.hk](mailto:xinbaoqiao@cuhk.edu.hk)
- Homepage: [xinbaopedia.top](https://xinbaopedia.top/)
- GitHub: [GitHub](https://github.com/XinbaoQiao)
- LinkedIn: [LinkedIn](https://www.linkedin.com/in/xinbaoqiao/)
- Google Scholar: [Google Scholar](https://scholar.google.com/citations?view_op=search_authors&mauthors=Xinbao+Qiao)

## Education

- **The Chinese University of Hong Kong**, PhD student in Information Engineering, 2026-present. Advised by [Angela Yingjun Zhang](https://www.ie.cuhk.edu.hk/faculty/zhang-yingjun-angela/).
- **Zhejiang University**, M.Eng. in Artificial Intelligence, 2022-09 to 2025-12.
- **Shandong University**, B.Eng. in Communication Engineering, 2018-09 to 2022-07.

## Research interests

- Qiao's research primarily studies lifecycle management of data in AI models, focusing on theoretical methods and practical problems that arise as data are generated, used, and deleted. His recent work aims to improve the reliability, interpretability, and controllability of AI models in heterogeneous, computation-constrained, and communication-constrained environments.

## Research experience

- **Doctoral Research at The Chinese University of Hong Kong**, 2026-present, advised by [Angela Yingjun Zhang](https://www.ie.cuhk.edu.hk/faculty/zhang-yingjun-angela/). Investigates data lifecycle management in distributed AI systems, connecting data generation, use, and deletion with federated representation geometry.
  - Paper #5: proposed an optimal-transport view of federated learning and a barycentric multi-prototype classifier for communication-constrained representation geometry.
- **Research on Data-Centric ML Systems**, 03/2023 to 12/2025, advised by Prof. [Meng Zhang](https://person.zju.edu.cn/mengzhang) at [Zhejiang University](./Zhejiang_University.md). Built unlearning methods for data deletion across continuous influence weights, certified online updates, and dynamic tree ensembles.
  - Paper #2: introduced soft-weighted unlearning for continuous influence weights, supporting fairness and robustness interventions beyond binary erasure.
  - Paper #3: developed Hessian-free online certified unlearning with recollected trajectory statistics, avoiding explicit Hessian inversion for streaming deletion requests.
  - Paper #4: built an exact and efficient random-forest unlearning framework for dynamic online environments, updating affected tree statistics instead of retraining.
- **Research on Trustworthy LLM systems**, 06/2025 to 12/2025, full-time research intern advised by PANG Yan, James at the National University of Singapore. Analyzed reliability failures that emerge when models train on recursively selected synthetic data or infer spurious patterns from prompts.
  - Paper #1: showed that sample selection during recursive synthetic-data training can prune tail samples under low-resource verification and precipitate model collapse.
  - Paper #6: analyzed illusory pattern perception as a mechanism for spurious LLM inference when perceived patterns override evidence-grounded reasoning.

## Open-Source Contributions and Academic Service

- **Research code releases**: maintains public code for accepted papers on certified unlearning, soft-weighted unlearning, and sample-selection model collapse.
- **Xinbaopedia**: maintains a public academic homepage and wiki-style research archive with paper pages, figures, CV, and project notes.
- **Academic service, 2026**: reviewer for ICML, NeurIPS, and AAAI.
- **Academic service, 2025**: reviewer for NeurIPS, ICLR, AAAI, and IEEE TNNLS.

## Publications

See [Publications](./Publications.md). The CV lists accepted, published, and under-review work in machine unlearning, decentralized learning, synthetic-data model collapse, federated learning, and LLM reliability.

Asterisks (*) denote co-first authorship; daggers (†) denote corresponding authors.

- **Paper #1: When Sample Selection Bias Precipitates Model Collapse**.\
  **Xinbao Qiao**†, Xianglong Du, Wei Liu, Jingqi Zhang, Peihua Mai, Meng Zhang†, Yan Pang†.\
  Forty-Third International Conference on Machine Learning, ICML, 2026. Links: [OpenReview](https://openreview.net/forum?id=FFXvnzM254), [arXiv](https://arxiv.org/abs/2606.13732), [GitHub](https://github.com/XinbaoQiao/When-Sample-Selection-Bias-Precipitates-Model-Collapse).
- **Paper #2: Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness**.\
  **Xinbao Qiao**, Ningning Ding, Yushi Cheng, Meng Zhang†.\
  Fortieth AAAI Conference on Artificial Intelligence, AAAI, 2026. Links: [arXiv](https://arxiv.org/abs/2505.18783), [AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/39681), [GitHub](https://github.com/XinbaoQiao/Soft-Weighted-Machine-Unlearning).
- **Paper #3: Hessian-Free Online Certified Unlearning**.\
  **Xinbao Qiao**, Meng Zhang†, Ming Tang, Ermin Wei.\
  Thirteenth International Conference on Learning Representations, ICLR, 2025. Links: [OpenReview](https://openreview.net/forum?id=C3TrHWanh5), [arXiv](https://arxiv.org/abs/2404.01712), [GitHub](https://github.com/XinbaoQiao/Hessian-Free-Certified-Unlearning).
- **Paper #4: DynFrs: An Efficient Framework for Machine Unlearning in Random Forest**.\
  Shurong Wang, Zhuoyang Shen, **Xinbao Qiao**, Tongning Zhang, Meng Zhang†.\
  Thirteenth International Conference on Learning Representations, ICLR, 2025. Links: [OpenReview](https://openreview.net/forum?id=nsCOeCLR8e), [arXiv](https://arxiv.org/abs/2410.01588), [GitHub](https://github.com/shurongwang/DynFrs).
- **Paper #5: Federated Learning as Optimal Transport: Barycentric Multi-Prototype Classification**.\
  **Xinbao Qiao**, Wenjing Yan†, Ying-Jun Angela Zhang.\
  Under review.
- **Paper #6: Illusory Pattern Perception Drives Spurious Inference in Large Language Models**.\
  Peihua Mai, Zhuoyan Shao, **Xinbao Qiao**, Meng Zhang, Xinyue Zhou†, Yan Pang†.\
  Under review.
