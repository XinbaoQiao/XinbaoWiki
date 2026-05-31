---
name: "日志"
occupation: "维护日志"
summary: "Wiki 的追加式维护日志。"
language: "zh"
translation_of: "log"
---

## 2026-05-31

- 润色 [[Xinbao_Qiao|英文主页]] 与 [[Qiao_Xinbao_zh|中文主页]]，将开头整理为紧凑研究画像，保留研究经历的时间线结构，并把学术项目段落改为按问题簇组织，减少与传记经历的重复。
- 调整 [[Publications|论文索引]] 中已录用论文表格，使每篇论文的标题、作者和简介分行显示。
- 调整 [[Publications|论文索引]] 中已录用论文的会议与状态列，使会议名称、日期和地点分行显示。

## 2026-05-27

- 根据新版论文更新模型坍缩论文页及相关研究专题页，突出低资源验证场景、碎片化真实数据覆盖，以及低资源社区中的尾部模式剪枝问题。
- 同步刷新 [[Xinbao_Qiao|人物主页]]、[[Publications|论文索引]]、[[Research|研究概览]]、[[Projects|项目页]]、相关概念页和 `CV.tex`，使 ICML 2026 论文围绕新的低资源社区主线表述。

## 2026-05-06

- 润色中英文人物主页，压缩开头表述，明确博士阶段措辞，并减少研究经历与学术项目之间的重复。
- 调整人物主页开头的脚注引用顺序，使 Xinbao 同名脚注出现在 Xinbao Qiao/新寶橋拼写巧合脚注之前。
- 调整可见左侧栏：Navigation 增加 [[Publications|Publications]]，Experience 放到 Education 后面且只保留 [[NUSRI_CQ|NUSRI-CQ]]。
- 在 [[Xinbao_Qiao]] 与 [[Qiao_Xinbao_zh]] 增加姓名脚注，说明 “Qiao”/“ciao” 的昵称关联以及 “Mr. Ciao” 这一称呼。
- 新增 [[Internet_Slang_2026_zh|2026热梗]] 与 [[Internet_Slang_2026|Internet Slang 2026]] 作为 Chat with Xinbao 的年度语气参考，扩充热梗使用边界，并把 AI 打开后的第一句调整为有趣但不失学术主页风度的版本。
- 围绕 [[AI_and_Networks|AI 与网络]] 更新 CUHK 博士阶段叙述，新增 [[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]] 作为当前博士阶段关注点，并将研究概览整理为更接近 LLM Wiki 的编译式研究图谱。

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
