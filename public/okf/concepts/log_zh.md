---
type: 维护日志
title: 日志
description: Wiki 的追加式维护日志。
tags:
  - zh
  - maintenance
  - log
  - 维护日志
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-08-09T18:32:45.775Z'
content_hash: 'sha256:749d82fe7aee0b9b5634aa707999e32d26d4059096ad9eb65583e676db312f0f'
reviewed_at: '2026-08-10T02:34:00+08:00'
review_due: '2027-08-09'
language: zh
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-08-10T02:34:00+08:00'
  reviewDue: '2027-08-09'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:log_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/log_zh.md
---
## 2026-08-10

- 同步中英文人物、教育、经历与 CV 页面，记录乔鑫宝于 2026-08-01 开始在香港中文大学信息工程系攻读博士；保留私有记录并排除在公开索引之外，同时移除过时的 CV 表述。
- 依据弃答激励、基准泄漏与递归生成数据训练的一手研究，更新中英文 LLM 可靠性和合成数据页面；将 Karpathy LLM Wiki 的审阅版本固定为 `ac46de1`；从公开论文元数据和可下载 CV 中移除失效的 Soft-Weighted Unlearning GitHub 链接。

## 2026-07-18

- 在嵌入式来源声明与旧维护记录相冲突后，从当前人物页和资源页移除肖像的特定供应商归因；保留首尔图片的 AI 生成标识，并在仓库素材溯源清单中记录待核验情况。

## 2026-06-13

- 更新 [英文人物主页](./Xinbao_Qiao.md)、[中文主页](./Qiao_Xinbao_zh.md)、[研究概览](./Research_zh.md)、[项目页](./Projects_zh.md)、[研究经历](./Experience_zh.md)、[简历](./CV_zh.md) 及相关专题页，将近期工作表述为围绕 AI 模型中的数据全生命周期管理、[数据中心 ML](./Data_Centric_Machine_Learning_zh.md)、AI for Networks 与 Networks for AI 展开，同时保留 [分布式 Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md) 作为相关方法，而不是唯一当前重点。
- 在 [英文主页](./Xinbao_Qiao.md) 与 [中文主页](./Qiao_Xinbao_zh.md) 中补充“数据生成、数据使用、数据删除”三部分数据生命周期概述。
- 在 CV 论文列表中新增两篇 NeurIPS 2026 在审条目，并重新生成公开 CV PDF。

## 2026-05-31

- 为 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 补充 OpenReview 和代码链接。
- 润色 [英文主页](./Xinbao_Qiao.md) 与 [中文主页](./Qiao_Xinbao_zh.md)，将开头整理为紧凑研究画像，保留研究经历的时间线结构，并把学术项目段落改为按问题簇组织，减少与传记经历的重复。
- 调整 [论文索引](./Publications_zh.md) 中已录用论文表格，使每篇论文的标题、作者和简介分行显示。
- 调整 [论文索引](./Publications_zh.md) 中已录用论文的会议与状态列，使会议名称、日期和地点分行显示。
- 加宽 [论文索引](./Publications_zh.md) 的会议与状态列，避免表头和短会议信息被意外折行。
- 将 [论文索引](./Publications_zh.md) 的会议与状态列收紧为略宽于表头的紧凑固定宽度。
- 将 [论文索引](./Publications_zh.md) 中已录用论文的简介行样式调整为灰色注释式文本，使其与标题和作者行区分。
- 将 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 在论文表中的简介压缩为只保留尾部剪枝这句话。

## 2026-05-27

- 根据新版论文更新模型坍缩论文页及相关研究专题页，突出低资源验证场景、碎片化真实数据覆盖，以及低资源社区中的尾部模式剪枝问题。
- 同步刷新 [人物主页](./Qiao_Xinbao_zh.md)、[论文索引](./Publications_zh.md)、[研究概览](./Research_zh.md)、[项目页](./Projects_zh.md)、相关概念页和 `CV.tex`，使 ICML 2026 论文围绕新的低资源社区主线表述。

## 2026-05-06

- 润色中英文人物主页，压缩开头表述，明确博士阶段措辞，并减少研究经历与学术项目之间的重复。
- 调整人物主页开头的脚注引用顺序，使 Xinbao 同名脚注出现在 Xinbao Qiao/新寶橋拼写巧合脚注之前。
- 调整可见左侧栏：Navigation 增加 [Publications](./Publications_zh.md)，Experience 放到 Education 后面且只保留 [NUSRI-CQ](./NUSRI_CQ_zh.md)。
- 在 [英文人物主页](./Xinbao_Qiao.md) 与 [中文主页](./Qiao_Xinbao_zh.md) 增加姓名脚注，说明 “Qiao”/“ciao” 的昵称关联以及 “Mr. Ciao” 这一称呼。
- 优化 Chat with Xinbao 的开场语与语气边界，同时保持公开 wiki 聚焦于可核对的人物与研究信息。
- 围绕 [AI 与网络](./AI_and_Networks_zh.md) 更新 CUHK 博士阶段叙述，新增 [分布式 Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md) 作为当前博士阶段关注点，并将研究概览整理为更接近 LLM Wiki 的编译式研究图谱。

## 2026-05-05

- 为全站 wiki 页面补齐静态中文版本，并使语言切换在每个页面的中英文版本之间对应跳转。
- 让中文页面中的正文 WikiLink 优先指向对应中文页面，而不是跳回英文或主页。
- 进一步缩小正文论文图片显示尺寸，避免单张图占满屏幕。
- 使用 KaTeX 渲染论文公式，并为论文页保留紧凑的图片、poster 与概念图。
- 将站点名称统一为 Xinbaopedia，加入 wiki 风格图标，并将可见框架继续靠近 Colarpedia/Wikipedia 风格。
- 扩展导师、机构、研究专题和论文页面，使每个链接都进入结构完整的 wiki 条目。

## 2026-05-04

- 将本地 XinbaoWiki 重建为 Next.js 15 静态导出的 wiki，使用 react-markdown 与 gray-matter。
- 建立 wiki/*.md 作为 source of truth 的页面结构，并加入人物主页、索引、日志、论文页与 CV 页面。
- 增加 CLAUDE.md，规定新增页面、更新索引、追加日志和保持第三人称百科语气的工作流。
