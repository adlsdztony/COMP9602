import { useState } from 'react'
import { Mafs, Plot, Theme } from 'mafs'
import { Coordinates } from './coordinates.jsx'
import { Widget, Tabs, M } from '../components/index.jsx'

/* ---------- 凸性判定练习：随机抽题 ---------- */
// ans: 'convex' | 'concave' | 'affine'（既凸又凹）| 'neither'
const BANK = [
  { f: 'e^{ax}', dom: '\\mathbb R', ans: 'convex', why: '二阶导 $a^2e^{ax}\\ge0$。' },
  { f: 'x^a,\\ a\\ge1\\ \\text{or}\\ a\\le0', dom: '\\mathbb R_{++}', ans: 'convex', why: '二阶导 $a(a-1)x^{a-2}\\ge0$。' },
  { f: 'x^a,\\ 0\\le a\\le1', dom: '\\mathbb R_{++}', ans: 'concave', why: '二阶导 $a(a-1)x^{a-2}\\le0$。' },
  { f: 'x\\log x', dom: '\\mathbb R_{++}', ans: 'convex', why: '二阶导 $1/x>0$（负熵）。' },
  { f: '\\log x', dom: '\\mathbb R_{++}', ans: 'concave', why: '二阶导 $-1/x^2<0$。' },
  { f: '\\|x\\|_p\\ (p\\ge1)', dom: '\\mathbb R^n', ans: 'convex', why: '所有范数都凸：三角不等式 + 齐次性。' },
  { f: '\\max_i x_i', dom: '\\mathbb R^n', ans: 'convex', why: '线性函数 $x_i$ 的逐点最大值。' },
  { f: '\\log\\sum_i e^{x_i}', dom: '\\mathbb R^n', ans: 'convex', why: 'log-sum-exp：Hessian 用 Cauchy–Schwarz 证明 $\\succeq0$。' },
  { f: '\\big(\\prod_i x_i\\big)^{1/n}', dom: '\\mathbb R^n_{++}', ans: 'concave', why: '几何平均是凹的（A2 Q2：线性函数族的逐点 inf）。' },
  { f: '\\log\\det X', dom: '\\mathbb S^n_{++}', ans: 'concave', why: '限制到直线 $X=Z+tV$ 上得到 $\\sum_i\\log(1+t\\lambda_i)+\\text{const}$，凹。' },
  { f: 'x^2/y', dom: 'y>0', ans: 'convex', why: 'quadratic-over-linear：Hessian $=\\frac{2}{y^3}(y,-x)(y,-x)^T\\succeq0$。' },
  { f: 'x_1x_2', dom: '\\mathbb R^2_{++}', ans: 'neither', why: 'Hessian $\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$ 不定（特征值 $\\pm1$），它只是拟凹 quasiconcave。' },
  { f: 'a^Tx+b', dom: '\\mathbb R^n', ans: 'affine', why: '仿射函数既凸又凹，Jensen 不等式取等号。' },
  { f: '\\|Ax-b\\|_2^2', dom: '\\mathbb R^n', ans: 'convex', why: 'Hessian $=2A^TA\\succeq0$（对任意 $A$）。' },
  { f: '\\tfrac12x^TPx+q^Tx,\\ P\\ \\text{indefinite}', dom: '\\mathbb R^n', ans: 'neither', why: '二次函数凸 $\\iff P\\succeq0$；$P$ 特征值有正有负时既不凸也不凹。' },
  { f: '\\sqrt{|x|}', dom: '\\mathbb R', ans: 'neither', why: '下水平集都是区间（拟凸），但不凸：sublevel set 凸推不出函数凸。' },
  { f: '\\min\\{x^2,(x-2)^2\\}', dom: '\\mathbb R', ans: 'neither', why: '凸函数的逐点最小值一般不凸（两个谷）。' },
  { f: '-\\log(-f(x)),\\ f\\ \\text{convex}', dom: 'f(x)<0', ans: 'convex', why: '外层 $-\\log(-u)$ 凸且递增，内层凸，复合后凸（log barrier）。' },
  { f: 'e^{-x^2}', dom: '\\mathbb R', ans: 'neither', why: 'log-concave 但不凹：$|x|>1/\\sqrt2$ 时二阶导为正。' },
  { f: '\\lambda_{\\max}(X)', dom: '\\mathbb S^n', ans: 'convex', why: '$\\lambda_{\\max}(X)=\\sup_{\\|y\\|_2=1}y^TXy$，是 $X$ 的线性函数的逐点 sup。' },
  { f: '\\textstyle\\sum_{i=1}^r x_{[i]}', dom: '\\mathbb R^n', ans: 'convex', why: '前 $r$ 大分量之和：对所有 $r$ 元下标子集求和再取最大。' },
  { f: '1/x', dom: '\\mathbb R_{++}', ans: 'convex', why: '二阶导 $2/x^3>0$。' },
  { f: 'x^3', dom: '\\mathbb R', ans: 'neither', why: '二阶导 $6x$ 变号；只在 $x\\ge0$ 上凸。定义域要看清。' },
  { f: '\\sup_{y\\in C}\\|x-y\\|_2', dom: '\\mathbb R^n', ans: 'convex', why: '对每个固定 $y$ 都凸，逐点 sup 保凸（$C$ 不必凸）。' },
]
function Mixed({ s }) {
  return s.split('$').map((seg, k) => (k % 2 ? <M key={k}>{seg}</M> : <span key={k}>{seg}</span>))
}
const LABELS = { convex: '凸', concave: '凹', affine: '既凸又凹（仿射）', neither: '都不是' }

export function Ch17ConvexityDrill() {
  const [i, setI] = useState(() => Math.floor(Math.random() * BANK.length))
  const [pick, setPick] = useState(null)
  const [score, setScore] = useState({ ok: 0, n: 0 })
  const q = BANK[i]
  const choose = (k) => {
    if (pick) return
    setPick(k)
    setScore((s) => ({ ok: s.ok + (k === q.ans ? 1 : 0), n: s.n + 1 }))
  }
  const next = () => {
    let j = i
    while (j === i) j = Math.floor(Math.random() * BANK.length)
    setI(j); setPick(null)
  }
  return (
    <Widget title="凸性判定练习（随机抽题）" hint="先自己判断再点选项，看解释里用的是哪种方法（定义 / 二阶导 / 保凸运算）。连续做 10 题，争取全对。">
      <div style={{ fontSize: '1.15em', margin: '8px 0 12px' }}>
        <M>{`f = ${q.f}`}</M><span style={{ color: '#636366', marginLeft: 12 }}>定义域 <M>{q.dom}</M></span>
      </div>
      <div className="wrow" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.keys(LABELS).map((k) => (
          <button key={k} className={`wbtn ${pick && k === q.ans ? 'primary' : ''}`} onClick={() => choose(k)} disabled={!!pick && k !== q.ans && k !== pick}>{LABELS[k]}</button>
        ))}
        <button className="wbtn" onClick={next}>下一题</button>
      </div>
      {pick && (
        <div style={{ marginTop: 10, color: pick === q.ans ? '#34c759' : '#ff3b30' }}>
          {pick === q.ans ? '正确。' : `不对，答案是「${LABELS[q.ans]}」。`} <span style={{ color: 'inherit' }}>理由：<Mixed s={q.why} /></span>
        </div>
      )}
      <div className="wstat">
        <span className="chip info">已答 {score.n}</span>
        <span className={`chip ${score.n && score.ok === score.n ? 'good' : 'info'}`}>答对 {score.ok}</span>
      </div>
    </Widget>
  )
}

/* ---------- 收敛速度对比 ---------- */
const RATES = {
  linear: { label: '线性 (GD)', c: Theme.orange },
  quad: { label: '二次 (Newton)', c: Theme.red },
  sub: { label: '次梯度 O(1/√k)', c: Theme.blue },
}
export function Ch17RateCompare() {
  const [show, setShow] = useState('all')
  const lin = (k) => k * Math.log10(0.7) // 误差 0.7^k
  const quad = (k) => Math.max(-16, Math.pow(2, k) * Math.log10(0.5)) // e_{k+1}=e_k^2, e_0=0.5
  const sub = (k) => -0.5 * Math.log10(Math.max(k, 1)) // 1/√k
  const on = (key) => show === 'all' || show === key
  return (
    <Widget title="三种收敛速度在 log 坐标下的样子" hint="纵轴是 log₁₀(误差)。线性收敛 = 直线；二次收敛 = 先慢后“断崖式”下降；次梯度法 1/√k 几乎是平的——这就是教授说它要“上千次迭代”的原因。">
      <Tabs tabs={[{ value: 'all', label: '全部' }, { value: 'linear', label: RATES.linear.label }, { value: 'quad', label: RATES.quad.label }, { value: 'sub', label: RATES.sub.label }]} value={show} set={setShow} />
      <Mafs viewBox={{ x: [0, 40], y: [-16, 1] }} height={280} preserveAspectRatio="contain">
        <Coordinates.Cartesian xAxis={{ lines: 5 }} yAxis={{ lines: 2 }} />
        {on('linear') && <Plot.OfX y={lin} color={RATES.linear.c} />}
        {on('quad') && <Plot.OfX y={quad} color={RATES.quad.c} />}
        {on('sub') && <Plot.OfX y={sub} color={RATES.sub.c} />}
      </Mafs>
      <div className="wstat">
        <span className="chip info">k = 20：线性 ≈ 10^{lin(20).toFixed(1)}</span>
        <span className="chip info">二次 ≈ 10^{quad(5).toFixed(1)}（仅 5 步）</span>
        <span className="chip info">次梯度 ≈ 10^{sub(20).toFixed(2)}</span>
      </div>
    </Widget>
  )
}
