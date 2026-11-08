import { lazy } from 'react'

// part: 用于侧边栏分组
export const chapters = [
  { slug: 'math-basics', num: '0', part: '准备', title: '数学预备：向量、矩阵与导数', en: 'Math Toolkit', lecture: '补充', load: () => import('./ch00-math.mdx') },
  { slug: 'intro', num: '1', part: '基础', title: '什么是（凸）优化', en: 'Introduction', lecture: 'L1', load: () => import('./ch01-intro.mdx') },
  { slug: 'convex-sets', num: '2', part: '基础', title: '凸集', en: 'Convex Sets', lecture: 'L2', load: () => import('./ch02-sets.mdx') },
  { slug: 'convex-functions', num: '3', part: '基础', title: '凸函数', en: 'Convex Functions', lecture: 'L3', load: () => import('./ch03-functions.mdx') },
  { slug: 'convex-problems', num: '4', part: '建模', title: '优化问题与凸问题', en: 'Convex Optimization Problems', lecture: 'L4', load: () => import('./ch04-problems.mdx') },
  { slug: 'lp', num: '5', part: '建模', title: '拟凸问题与线性规划', en: 'Quasiconvex & LP', lecture: 'L5', load: () => import('./ch05-lp.mdx') },
  { slug: 'problem-zoo', num: '6', part: '建模', title: 'ILP · QP · SOCP · GP · SDP · 多目标', en: 'Problem Families', lecture: 'L6', load: () => import('./ch06-zoo.mdx') },
  { slug: 'duality-1', num: '7', part: '对偶', title: '拉格朗日与对偶函数', en: 'Lagrangian & Dual Function', lecture: 'L7', load: () => import('./ch07-dual1.mdx') },
  { slug: 'duality-2', num: '8', part: '对偶', title: '对偶问题、强弱对偶', en: 'Dual Problem & Strong Duality', lecture: 'L8', load: () => import('./ch08-dual2.mdx') },
  { slug: 'duality-3', num: '9', part: '对偶', title: 'KKT 条件与互补松弛', en: 'KKT Conditions', lecture: 'L9', load: () => import('./ch09-dual3.mdx') },
  { slug: 'duality-4', num: '10', part: '对偶', title: '灵敏度分析与对偶应用', en: 'Sensitivity & Applications', lecture: 'L10', load: () => import('./ch10-dual4.mdx') },
  { slug: 'unconstrained', num: '11', part: '算法', title: '无约束优化：梯度下降与牛顿法', en: 'Unconstrained Minimization', lecture: 'L11', load: () => import('./ch11-unconstrained.mdx') },
  { slug: 'equality', num: '12', part: '算法', title: '等式约束优化', en: 'Equality Constrained Minimization', lecture: 'L12', load: () => import('./ch12-equality.mdx') },
  { slug: 'interior-point', num: '13', part: '算法', title: '内点法', en: 'Interior-Point Methods', lecture: 'L13', load: () => import('./ch13-ipm.mdx') },
  { slug: 'subgradient', num: '14', part: '算法', title: '次梯度法', en: 'Subgradient Methods', lecture: 'L14', load: () => import('./ch14-subgrad.mdx') },
  { slug: 'localization', num: '15', part: '算法', title: '定位法：割平面与椭球法', en: 'Localization Methods', lecture: 'L15', load: () => import('./ch15-localization.mdx') },
  { slug: 'practice', num: '★', part: '练习', title: '作业精讲', en: 'Worked Assignments', lecture: 'A1/A2', load: () => import('./ch16-practice.mdx') },
  { slug: 'cheatsheet', num: '★', part: '练习', title: '总复习速查表', en: 'Cheat Sheet', lecture: '全部', load: () => import('./ch17-cheatsheet.mdx') },
]

chapters.forEach((c) => { c.Component = lazy(c.load) })
