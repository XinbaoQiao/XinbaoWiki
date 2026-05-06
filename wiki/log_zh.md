---
name: "日志"
occupation: "维护日志"
summary: "Wiki 的追加式维护日志。"
language: "zh"
translation_of: "log"
---

## 2026-05-06

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
