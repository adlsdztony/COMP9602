# 章节编写规范（给写作代理）

站点：React + Vite + MDX（`remark-math` + `rehype-katex`）+ Mafs（交互绘图）。
章节文件：`src/chapters/chXX-*.mdx`。交互组件：`src/widgets/chXX.jsx`（每章一个文件）。

## 读者画像
- 中文母语，**数学基础薄弱**（线性代数、微积分都不熟）。目标是不看讲义也能完整掌握这门课（期末考试占 40%）。
- 正文用**中文**，专业术语**频繁保留英文**：首次出现写成 `凸集 <T zh="凸集">convex set</T>`，之后可以直接用英文词（如 “这个 Lagrangian ……”、“满足 Slater 条件”）。
- 每个公式出现后都要用一句**大白话**解释它在说什么；每个符号首次出现时说明含义（如 “$\succeq 0$ 表示半正定”）。
- 需要的数学背景（梯度、Hessian、矩阵正定、范数、内积、最大值/上确界 sup/inf 等）就地用 `<MathNote>` 补课，不要假设读者已经会。
- 推导拆成小步：多用 `<Steps>` 组件逐步展示，每步都写“为什么”。

## 结构要求
- 用 `##` 作为大节、`###` 作为小节（右侧目录自动生成）。不要写 `#` 一级标题（页头已有）。
- 章首：一段“这一章要解决什么问题 / 和前后章的关系”，再给一个“本章路线”列表。
- 每个大节的节奏：动机 → 直觉/图 → 正式定义（`<Def>`/`<Thm>`）→ 例子（`<Example>`）→ 交互或图 → 自测（`<Quiz>`）。
- **图片和交互必须穿插在讲解过程中**，紧贴它要说明的那段文字，不要堆在章末。
- 讲义每一页的内容都要覆盖到（定义、定理、例子、算法），不允许遗漏；公式必须准确（以笔记里从讲义图片读出的版本为准，有疑问时打开讲义页 PNG 核对）。
- 把教授课堂上强调的内容用 `<Prof>` 写出（意译成中文，可注时间戳，如 “(09-03 课 00:35)”）；他说会考/重要的放进 `<Exam>`。
- 章末：`<Summary>` 小结 + 2–4 道 `<Quiz>` 综合自测。
- 每章至少 **3 个交互组件**（算法章可更多），至少 **4 张讲义图**（有合适的图的话）。

## 可用组件（在 MDX 中直接使用，无需 import）
```mdx
<T zh="中文释义">English term</T>                     // 术语标签
<M>{'\\nabla f(x)'}</M>                               // JSX 属性/表格内的行内公式（普通正文直接用 $...$）
<Def title="凸集">...markdown + $math$...</Def>        // 也有 Thm / Intuition / Exam / Warn / Example / Prof / MathNote / Summary
<Figure src="L02/p05_f1.png" caption="锥与凸锥" />     // 讲义裁图，路径相对 public/figs/
<Figure src="pages/L07/p09.png" caption="..." />       // 若裁图不好，可用整页：先把 scratchpad/pages/LXX/pNN.png 复制到 public/figs/pages/LXX/
<Reveal label="看证明">...</Reveal>                     // 折叠内容（证明、长推导）
<Quiz q="问题" options={['A','B','C']} answer={1} explain="解释" />
<Steps title="推导 dual function" steps={[{text:'第一步说明', math:'L(x,\\lambda)=...'}, ...]} />
```
**MDX 注意事项（很重要，否则编译失败）：**
- 组件内部写 markdown/公式时，开标签后、闭标签前**各空一行**。
- 正文中的 `{` `}` `<` `>` 会被当作 JSX：在 `$...$` / `$$...$$` 里是安全的；在纯文本里不要直接写 `<`、`{`，用中文“小于”或放进公式。
- `$$` 块公式：`$$` 独占一行。
- JSX 属性中的 LaTeX 字符串要双反斜杠：`math:'\\frac{1}{2}'`。
- 不要写 HTML 注释 `<!-- -->`（MDX 不支持），用 `{/* */}`。

## 交互组件编写（src/widgets/chXX.jsx）
- 参考 `src/widgets/_example.jsx`。用 `Widget` 外框（title + hint 告诉用户该怎么操作、该观察什么），`Slider`、`Tabs`、`M` 来自 `../components/index.jsx`。
- 绘图优先用 Mafs：`import { Mafs, Coordinates, Plot, Point, Line, Polygon, Circle, Ellipse, Vector, Text, Theme, useMovablePoint } from 'mafs'`。
  - `<Mafs viewBox={{x:[-4,4], y:[-3,3]}} height={320} preserveAspectRatio={false}>`
  - `Plot.OfX({y: x=>...})`、`Plot.Parametric({t:[0,2*Math.PI], xy: t=>[x,y]})`、`Plot.Inequality({y: {'<=': f, '>=': g}})` 或 `Plot.Inequality({x: {...}})`、`Line.Segment({point1, point2})`、`Line.ThroughPoints`、`Polygon({points})`、`Circle({center, radius})`、`Ellipse({center, radius:[rx,ry], angle})`、`Vector({tail, tip})`、`Text({x,y,attach:'n'|'e'|...,size})`。
  - `useMovablePoint([x,y], {constrain: 'horizontal' | ([x,y])=>[x',y']})` 返回 `.x .y .point .element`，记得渲染 `.element`。
  - 颜色用 `Theme.blue / red / green / orange / violet / indigo / pink / yellow`。
- 等高线/热力图等 Mafs 不方便的，可以手写 `<svg>` 或 `<canvas>`。不要引入新的 npm 依赖。
- 组件名必须带章节前缀并全局唯一，例如 `Ch02ConvexCombo`、`Ch11GradientDescent`。全部用 `export function` 具名导出。
- 交互要有教学目的：用户改变什么 → 看到什么现象 → 这个现象对应哪个概念。显示实时数值（`wstat` + `chip good/bad/info`），在 hint 里提示 “试试把 … 调到 …，观察 …”。
- 算法类交互：要能单步/自动运行迭代，画出迭代路径，显示 $f(x^{(k)})$ 或误差随迭代下降的小曲线。

## 资料来源
- 讲义笔记：`SCRATCH/notes/LXX.md`（由助手从讲义图片 + 课堂录音文字稿整理，含公式、教授讲解、考点、可用图片清单、交互创意）。
- 讲义页面渲染：`SCRATCH/pages/LXX/pNN.png`（公式核对用；讲义很多公式是图片，PDF 文字提取不可靠）。
- 候选裁图：`public/figs/LXX/pNN_fK.png`（= `SCRATCH/figs/...`），先看图再用；只用真正有信息的图（不要用只有文字/公式的裁图）。
- 课堂文字稿：`E:/workspace/COMP9602/06_Recordings/Transcripts/*.txt`（Zoom 自动转录，有识别错误）。
- 网络图片（可选，每章 ≤3 张）：只从 Wikimedia Commons（upload.wikimedia.org）下载许可明确的图，存到 `public/web/`，caption 的 `source` 写明作者/许可。
- 其中 SCRATCH = `C:/Users/zzl07/AppData/Local/Temp/claude/41c0ab8085c274eb/2f453447-cee9-407e-bc18-57895f0eec05/scratchpad`

## 验证
- 在 mdx 文件顶部显式 import 本章组件：`import { Ch02ConvexCombo, Ch02Cone } from '../widgets/ch02.jsx'`。不要修改 `src/widgets/index.js`、`App.jsx`、`components/`、`styles.css`（如确需新样式，在你的 widget 文件里用 inline style）。
- 写完后在 `E:/workspace/COMP9602/study-site` 运行 `npx vite build --outDir SCRATCH/build-<你的章节号>`（**不要**用默认 dist，避免与其他并行代理冲突），必须无报错。
- dev server 已在 http://localhost:5179 运行（HMR），路由是 `#/c/<slug>`；如果你有浏览器工具，可以打开看效果，没有就以 build 通过为准。

## 视觉风格（用户新要求，优先级最高）
- 整体风格：**简洁、类似 Apple/macOS**——大量留白、中性灰、克制的颜色、直观。**禁止蓝色和紫色**（含靛蓝、青蓝、淡紫）。
- 交互图配色：只用 `Theme.*`（已在 CSS 里被重映射：`Theme.blue`=石墨黑、`Theme.indigo`=灰、`Theme.violet`=棕；`red/green/orange/pink/yellow` 正常），或中性灰（#1d1d1f / #636366 / #aeaeb2 / #e5e5ea）+ 橙色 #ff9500 / 红 #ff3b30 / 绿 #34c759。不要在 inline style、SVG、canvas 里写任何蓝/紫色值（如 #3b5bdb、#4c6ef5、#7048e8、royalblue、steelblue 等）。
- 不要在正文和组件里用 emoji 装饰。按钮用 `className="wbtn"`（主按钮 `wbtn primary`）。
