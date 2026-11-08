# COMP9602 凸优化 · 交互学习站

基于讲义 L1–L15、18 段课堂文字稿、作业一/二整理的交互式学习网页（React + Vite + MDX + KaTeX + Mafs）。

## 运行

```bash
cd study-site
npm install
npm run dev        # http://localhost:5173
```

构建静态版本：`npm run build`，产物在 `dist/`（使用相对路径与 HashRouter，可直接部署到任意静态托管）。

## 目录

| 路径 | 内容 |
| --- | --- |
| `src/chapters/*.mdx` | 各章正文（中文 + 英文术语），公式用 `$...$` |
| `src/widgets/chXX.jsx` | 各章交互组件 |
| `src/components/index.jsx` | 通用组件：定义/定理/直觉/考点框、图片、自测题、分步推导 |
| `public/figs/` | 从讲义裁出的插图（`LXX/pNN_fK.png` = 第 XX 讲第 NN 页） |
| `AUTHORING.md` | 编写规范 |

插图来自课程讲义（多数源自 Boyd & Vandenberghe《Convex Optimization》），仅供个人学习使用。
