<div align="center">
  <img src="public/xinbaopedia-icon.png" width="132" alt="Xinbaopedia" />

  # Xinbaopedia

  **A bilingual, searchable, AI-assisted academic homepage.**

  把分散的学术履历、研究主题、论文与项目，整理成一个可以浏览、搜索、提问和持续维护的知识入口。

  <p>
    <a href="https://xinbaopedia.top"><img src="https://img.shields.io/badge/Open-Homepage-3366cc?style=for-the-badge" height="28" alt="Open the Xinbaopedia homepage" /></a>
    <a href="https://xinbaopedia.top/wiki/Research/"><img src="https://img.shields.io/badge/Browse-Connected%20Wiki-2a7f62?style=for-the-badge" height="28" alt="Browse the connected wiki" /></a>
    <a href="https://xinbaopedia.top/wiki/Qiao_Xinbao_zh/"><img src="https://img.shields.io/badge/Language-English%20%7C%20中文-202122?style=for-the-badge" height="28" alt="English and Chinese" /></a>
  </p>
</div>

---

## 这是一个怎样的主页

Xinbaopedia 是一个受 Wikipedia 启发的学术主页：它不把内容压缩成一页履历，也不要求访客从头读到尾，而是把人物条目、研究主题、论文、项目和学术经历组织成彼此连接的页面。

访客可以从首页建立整体印象，也可以直接搜索一个关键词、沿着页面链接继续探索，或者向 AI 提问。重点不只是展示“有哪些内容”，而是帮助读者更快找到入口、理解上下文，并回到对应的公开页面核对信息。

## 访客可以怎么使用

<table>
  <thead>
    <tr>
      <th align="left">你的需求</th>
      <th align="left">使用方式</th>
      <th align="left">可以获得的效果</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>第一次访问，想快速了解全貌</td>
      <td>从首页选择语言，再进入人物、研究或论文入口</td>
      <td>不用翻阅多份材料，就能建立清晰的内容地图</td>
    </tr>
    <tr>
      <td>查找一篇论文、一个项目或一个关键词</td>
      <td>使用首页或文章页顶部的双语搜索</td>
      <td>直接定位相关页面，同时看到摘要、关键启示和关联内容</td>
    </tr>
    <tr>
      <td>理解不同工作之间的关系</td>
      <td>从研究主题出发，继续打开相关论文、概念和经历</td>
      <td>把孤立的成果列表还原成可以顺着阅读的研究脉络</td>
    </tr>
    <tr>
      <td>不知道应该从哪里开始</td>
      <td>在首页打开 Chat with Xinbao，直接用自然语言提问</td>
      <td>站内资料充分时获得带页面引用的回答；一般问题也可以正常对话</td>
    </tr>
    <tr>
      <td>需要分享或在不同设备上阅读</td>
      <td>切换中英文、主题色和桌面或移动端布局</td>
      <td>得到稳定、可分享且适合当前阅读环境的页面入口</td>
    </tr>
  </tbody>
</table>

## 这套主页带来的效果

- **从“履历列表”变成“知识地图”。** 内容按条目和关系组织，访客可以从任意入口继续探索。
- **从“自己寻找”变成“搜索与提问并用”。** 精确查询交给站内搜索，开放问题交给 AI；有站内依据时保留引用。
- **从“只有作者看得懂”变成“第一次访问也能理解”。** 论文页面优先说明问题、意义和关键启示，再补充必要的技术细节。
- **从“单一版本”变成“双语且响应式”。** 中英文入口、移动端布局和主题系统服务于不同的阅读与分享场景。
- **从“手工堆页面”变成“可持续维护”。** Markdown 内容、关系索引、数据检查和构建验证共同降低新增与更新内容的成本。

## 可以直接体验的入口

<table>
  <thead>
    <tr>
      <th width="48" align="center"></th>
      <th width="210" align="left">入口</th>
      <th align="left">适合做什么</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="public/site-icons/xinbaopedia-blue.png" width="22" height="22" alt="" /></td>
      <td><a href="https://xinbaopedia.top">主页与 AI 对话</a></td>
      <td>搜索全部公开内容、选择浏览入口，或直接提出问题。</td>
    </tr>
    <tr>
      <td align="center"><img src="public/site-icons/xinbaopedia-green.png" width="22" height="22" alt="" /></td>
      <td><a href="https://xinbaopedia.top/wiki/Research/">研究主题</a></td>
      <td>从问题和方向出发，理解论文、项目与概念之间的联系。</td>
    </tr>
    <tr>
      <td align="center"><img src="public/site-icons/xinbaopedia-gold.png" width="22" height="22" alt="" /></td>
      <td><a href="https://xinbaopedia.top/wiki/Publications/">论文档案</a></td>
      <td>按条目浏览成果，并快速读取摘要、上下文和关键启示。</td>
    </tr>
    <tr>
      <td align="center"><img src="public/xinbaopedia-icon.png" width="22" height="22" alt="" /></td>
      <td><a href="https://xinbaopedia.top/wiki/Xinbao_Qiao/">English</a> · <a href="https://xinbaopedia.top/wiki/Qiao_Xinbao_zh/">中文</a></td>
      <td>查看同一主页体系中的双语人物与学术信息入口。</td>
    </tr>
  </tbody>
</table>

## 本地查看与维护

项目使用 Node.js 22。若要查看这套主页如何运行：

```bash
npm ci
npm run dev
```

开发服务器默认运行在 `http://localhost:3000`。公开内容以 `wiki/*.md` 为源；修改或新增内容后，使用现有维护与验证流程：

```bash
npm run maintain:wiki
npm run check
npm run build
```

AI 对话需要在服务器端配置模型与限流相关环境变量；密钥不应进入客户端代码或 Git 仓库。即使不配置 AI，Wiki 浏览、双语页面和站内搜索仍可独立使用。

<div align="center">

### 从一个问题开始，而不是从一份长履历开始

[**打开 Xinbaopedia →**](https://xinbaopedia.top)

<sub>Wikipedia-inspired, independently built, and not affiliated with the Wikimedia Foundation.</sub>

</div>
