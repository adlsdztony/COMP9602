# COMP9602 Optimization Study Lab

为已经学过 convex function、准备学习 Assignment 2 阶段课程的学习者制作。以英文专业术语贯穿中文讲解，系统覆盖 Lecture 4–10，含必要回顾、交互实验、自测、作业分层提示和定点课堂音频。

## 打开

- 直接打开 `index.html`：所有讲解、公式和图形实验均可离线使用。
- 或运行 `start.ps1`，然后访问 <http://127.0.0.1:9602/07_Assignment_2_Lab/>。本地服务支持音频和 PDF 的 byte ranges，方便定位片段。
- 学习网页需要与相邻的 `02_Lecture_Slides`、`03_Assignments`、`06_Recordings` 保持相对位置，才能打开原课件和音频。网页本身不需要联网，也不会上传学习进度。

## 使用方式

1. 先做 recap 的三道检查题，接上已有知识。
2. 按左侧顺序学习完整阶段。先读知识点的解释和推导；在需要观察参数变化时再预测、操作内嵌实验。
3. 完成逐章练习；用自己的话记一句，再手动标记掌握。进度、答案与笔记只保存在当前浏览器。
4. 关键知识点旁提供少量经过定位的可选原声片段，并说明听这一段要解决什么疑问。
5. 最后做迁移自测，使用“作业导航”回到五道原题。每题有三层提示，并保留原题 PDF 入口。

## 范围与依据

覆盖标准形式/最优性/等价变换/quasiconvex；LP/ILP/TU；QP/QCQP/SOCP/robust/chance constraints；GP/SDP/vector/Pareto；Lagrangian/弱强对偶/Slater/几何/鞍点/博弈；KKT/水位法/敏感度；partial relaxation/锥对偶/SDP dual。后续数值优化算法不在本次主线中。

原讲义的重要公式已结合渲染页核对；某些 PDF 文字层不完整或存在损坏结构，未将文字提取失败当作内容缺失。音频锚点依据本地课堂转录定位，并按讲义校准数学术语。本地 `research/` 保存了核对记录，不包含在公开站点中。

图中的数值示例用于观察原理，通常与作业数值不同。作业提示帮助构造推导和检查条件，默认不展示整题完整答案。

## 文件

- `content.js`、`programs-content.js`、`duality-content.js`：课程内容。
- `assignment-support.js`：作业关联和迁移检查。
- `diagrams.js`、`advanced-labs.js`：本地 SVG 交互实验。
- `vendor/`：固定版本 KaTeX 0.16.22 与字体，许可证随附。
- `serve.py`：仅绑定 `127.0.0.1` 的可选本地服务。

清除浏览器站点数据会清除学习进度和笔记；换浏览器或从 file 地址切换到 http 地址时，进度存储也会分开。
