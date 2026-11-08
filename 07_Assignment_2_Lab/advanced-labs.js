(function () {
  'use strict';
  const L = window.StudyLabs;
  const C = L.C;
  const F = (x, n = 2) => Number.isFinite(x) ? L.fmt(Math.abs(x) < 1e-10 ? 0 : x, n) : (x < 0 ? '−∞' : '∞');
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const readout = rows => rows.map(([label, value]) => `<div>${label}：<strong>${value}</strong></div>`).join('');

  function entropyState(z, b) {
    const logits = [0, z, 2 * z];
    const max = Math.max(...logits);
    const exp = logits.map(a => Math.exp(a - max));
    const sum = exp.reduce((a, x) => a + x, 0);
    const probabilities = exp.map(x => x / sum);
    const logSumExp = max + Math.log(sum);
    const moment = probabilities[1] + 2 * probabilities[2];
    const residual = moment - b;
    const g = b * z - logSumExp;
    const f0 = probabilities.reduce((s, x) => s + x * Math.log(x), 0);
    return {probabilities, moment, residual, gradient: -residual, formal: z * residual, g, f0};
  }

  function solveMoment(b) {
    let low = -40, high = 40;
    for (let i = 0; i < 90; i += 1) {
      const middle = (low + high) / 2;
      if (entropyState(middle, b).moment < b) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  function waterfillState(budget) {
    const noise = [1, 2, 4];
    let low = noise[0], high = noise[2] + budget;
    if (budget > 0) {
      for (let i = 0; i < 90; i += 1) {
        const middle = (low + high) / 2;
        const used = noise.reduce((s, n) => s + Math.max(0, middle - n), 0);
        if (used < budget) low = middle;
        else high = middle;
      }
    }
    const level = budget === 0 ? noise[0] : (low + high) / 2;
    const allocations = noise.map(n => Math.max(0, level - n));
    const used = allocations.reduce((s, x) => s + x, 0);
    const utility = allocations.reduce((s, x, i) => s + Math.log1p(x / noise[i]), 0);
    return {noise, level, allocations, used, utility};
  }

  L.register({
    entropy: {
      title: '归一化以后，约束满足了吗？',
      caption: 'a = (0, 1, 2)，y = (1, 1, 1)。柱高是 pᵢ；两条虚线分别标出目标 b 与当前 moment Ap。',
      controls: [
        {key: 'z', label: '指数族参数 z', min: -4, max: 4, step: 0.05, value: 0.5},
        {key: 'b', label: '目标 moment b', min: 0.1, max: 1.9, step: 0.05, value: 1.5}
      ],
      draw(host, v) {
        const z = Number(v.z), b = Number(v.b);
        const s = entropyState(z, b);
        const p = L.plot(host, [-0.55, 2.55], [0, 1.14], 'aᵢ / feature value', '概率 pᵢ');
        s.probabilities.forEach((height, i) => {
          p.poly([[i - 0.21, 0], [i + 0.21, 0], [i + 0.21, height], [i - 0.21, height]], C.blue, C.blue, 0.68);
          p.text(i, height > 0.8 ? height * 0.55 : height + 0.055, F(height, 3), C.ink, 'middle');
        });
        p.line([b, 0], [b, 1.035], C.green, '6 4', 2);
        p.text(b, 1.085, `b = ${F(b)}`, C.green, 'middle');
        p.line([s.moment, 0], [s.moment, 0.925], C.orange, '2 4', 2);
        p.text(s.moment, 0.965, `Ap = ${F(s.moment)}`, C.orange, 'middle');
        const feasible = Math.abs(s.residual) < 1e-7;
        p.finish(`归一化指数分布，概率为 ${s.probabilities.map(x => F(x, 3)).join('、')}，总和为1。目标moment为${F(b, 3)}，当前moment为${F(s.moment, 3)}。${feasible ? 'moment约束已满足。' : '虽然归一化，但moment约束尚未满足。'}formal差值为${F(s.formal, 4)}。`);
        return readout([
          ['概率之和', F(s.probabilities.reduce((a, x) => a + x, 0), 4)],
          ['Ap − b', F(s.residual, 4)],
          ['dual gradient：b − Ap', F(s.gradient, 4)],
          ['formal 差值：z(Ap − b)', F(s.formal, 4)]
        ]) + `<p><strong style="color:${feasible ? C.green : C.orange}">${feasible ? 'primal feasible：此时可比较真实 primal–dual gap。' : '仍不满足 Ap = b；formal 差值即使为零，也不能认证最优。'}</strong></p>`;
      },
      action: {
        label: '用二分让 Ap = b',
        run(v) { return {...v, z: solveMoment(Number(v.b))}; }
      }
    },

    geomean: {
      title: '几何均值：一族直线的下包络',
      caption: '固定 x₂，绿色曲线为 √(x₁x₂)；橙色直线由 v = (eᵘ, e⁻ᵘ) 产生，始终在曲线上方。',
      controls: [
        {key: 'x1', label: '观察位置 x₁', min: 0.2, max: 4.8, step: 0.05, value: 1.4},
        {key: 'x2', label: '固定的 x₂', min: 0.2, max: 4, step: 0.05, value: 2.4},
        {key: 'u', label: '仿射族参数 u', min: -2, max: 2, step: 0.05, value: 0.6}
      ],
      draw(host, v) {
        const x1 = Number(v.x1), x2 = Number(v.x2), u = Number(v.u);
        const v1 = Math.exp(u), v2 = Math.exp(-u);
        const geometric = x => Math.sqrt(x * x2);
        const upper = x => (v1 * x + v2 * x2) / 2;
        const g = geometric(x1), bound = upper(x1), gap = bound - g;
        const ymax = 1.16 * Math.max(upper(5), geometric(5), 1);
        const p = L.plot(host, [0.06, 5], [0, ymax], 'x₁（x₂ 固定）', '函数值');
        p.curve(upper, C.orange, 2.4);
        p.curve(geometric, C.green, 3);
        p.line([x1, g], [x1, bound], C.blue, '4 3', 2.3);
        p.dot(x1, bound, C.orange, 5);
        p.dot(x1, g, C.green, 5);
        p.text(4.8, upper(4.8) + 0.045 * ymax, '仿射上界', C.orange, 'end');
        p.text(4.8, Math.max(0.06 * ymax, geometric(4.8) - 0.06 * ymax), '几何均值', C.green, 'end');
        p.finish(`固定x₂为${F(x2)}，绿色几何均值曲线与橙色仿射上界。观察点x₁为${F(x1)}，几何均值为${F(g, 4)}，上界为${F(bound, 4)}，差为${F(gap, 4)}。所有仿射上界的下包络给出凹的几何均值。`);
        return readout([
          ['v₁ × v₂', F(v1 * v2, 4)],
          ['G(x)', F(g, 4)],
          ['(v₁x₁ + v₂x₂) / 2', F(bound, 4)],
          ['上界 − G(x)', F(gap, 4)]
        ]) + '<p>固定 v 时关于 x 仿射；在与 x 无关的可行 v 集合上取 inf，得到的是凹函数。</p>';
      },
      action: {
        label: '让上界在观察点相切',
        run(v) { return {...v, u: 0.5 * Math.log(Number(v.x2) / Number(v.x1))}; }
      }
    },

    certificate: {
      title: '任意锚点都能构造一个盒下界',
      caption: 'f(x) = ½x² + cx，盒为 [−1, 1]。橙色切线在盒内的最小值是 lower-bound certificate；锚点 s 可以在盒外。',
      controls: [
        {key: 'c', label: '目标的线性系数 c', min: -2, max: 2, step: 0.05, value: 0.7},
        {key: 's', label: '切线锚点 s', min: -2.5, max: 2.5, step: 0.05, value: 1.6}
      ],
      draw(host, v) {
        const c = Number(v.c), s = Number(v.s);
        const f = x => 0.5 * x * x + c * x;
        const d = s + c;
        const mu = Math.max(-d, 0), nu = Math.max(d, 0);
        const tangent = x => f(s) + d * (x - s);
        const lower = f(s) - d * s - Math.abs(d);
        const corner = d >= 0 ? -1 : 1;
        const optimal = clamp(-c, -1, 1), primalValue = f(optimal);
        const xmin = -2.8, xmax = 2.8;
        const points = [f(xmin), f(xmax), f(optimal), tangent(xmin), tangent(xmax), lower];
        const bottom = Math.min(...points), top = Math.max(...points);
        const span = Math.max(top - bottom, 2), ymin = bottom - 0.12 * span, ymax = top + 0.16 * span;
        const p = L.plot(host, [xmin, xmax], [ymin, ymax], 'x：阴影内为盒约束', '目标与切线');
        p.poly([[-1, ymin], [1, ymin], [1, ymax], [-1, ymax]], C.fill, C.line, 0.55);
        p.line([-1, ymin], [-1, ymax], C.muted, '4 5', 1);
        p.line([1, ymin], [1, ymax], C.muted, '4 5', 1);
        p.curve(f, C.green, 3);
        p.curve(tangent, C.orange, 2.4);
        p.line([-1, lower], [1, lower], C.orange, '4 4', 1.7);
        p.dot(corner, lower, C.orange, 5);
        p.dot(s, f(s), C.blue, 5);
        p.text(s, f(s) + 0.065 * span, '锚点 s', C.blue, s > 1.7 ? 'end' : 'start');
        p.dot(optimal, primalValue, C.green, 4);
        p.finish(`凸函数f(x)=二分之一x平方加${F(c)}x。可行盒为负1到1，锚点为${F(s)}，${Math.abs(s) <= 1 ? '在盒内' : '在盒外但仍可构造有效证书'}。切线在盒上的最小值为${F(lower, 4)}，实际最优值为${F(primalValue, 4)}。非负乘子mu=${F(mu)}、nu=${F(nu)}使Lagrangian在锚点达到全局最小。`);
        return readout([
          ['d = f′(s)', F(d, 3)],
          ['μ = max(−d, 0)，ν = max(d, 0)', `${F(mu, 3)}，${F(nu, 3)}`],
          ['有效 lower bound', F(lower, 4)],
          ['盒内真实最优值 / 与下界的差', `${F(primalValue, 4)} / ${F(primalValue - lower, 4)}`]
        ]) + `<p>${Math.abs(s) > 1 ? '<strong>锚点在盒外，证书仍有效。</strong> ' : ''}d + μ − ν = ${F(d + mu - nu, 4)}；凸性使 stationarity 足以证明固定乘子下的全局内层最小。</p>`;
      },
      action: {
        label: '将锚点放在盒内最优点',
        run(v) { return {...v, s: clamp(-Number(v.c), -1, 1)}; }
      }
    },

    logdet: {
      title: '有限域为什么要求严格正定？',
      caption: 'C = diag(c₁, c₂)，c₂ > 0。消去第二个对角变量后，观察 φ(t) = −log t + c₁t + log c₂ + 1，t > 0。',
      controls: [
        {key: 'c1', label: '第一个特征值 c₁', min: -1, max: 3, step: 0.1, value: 1.2},
        {key: 'c2', label: '第二个特征值 c₂', min: 0.2, max: 3, step: 0.1, value: 1.6}
      ],
      draw(host, v) {
        const c1 = Number(v.c1), c2 = Number(v.c2);
        const finite = c1 > 0;
        const phi = t => -Math.log(t) + c1 * t + Math.log(c2) + 1;
        const stationary = finite ? 1 / c1 : null;
        const xmax = finite ? Math.max(8, stationary * 1.45) : 12;
        const minimum = finite ? phi(stationary) : -Infinity;
        const shownMin = finite ? minimum : phi(xmax);
        const shownMax = Math.max(phi(0.05), phi(xmax), shownMin + 1);
        const span = Math.max(shownMax - shownMin, 2);
        const ymin = shownMin - 0.16 * span, ymax = shownMax + 0.14 * span;
        const p = L.plot(host, [0.05, xmax], [ymin, ymax], 't = x₁ > 0', 'φ(t)：另一维已取 inf');
        p.curve(phi, finite ? C.green : C.orange, 3);
        if (finite) {
          p.line([stationary, ymin], [stationary, minimum], C.blue, '4 4', 1.8);
          p.dot(stationary, minimum, C.blue, 5);
          p.text(stationary + 0.04 * xmax, minimum + 0.08 * span, `t* = ${F(stationary, 3)}`, C.blue, 'start');
        } else {
          p.text(0.54 * xmax, ymin + 0.2 * span, 't → ∞，φ(t) → −∞', C.orange, 'start');
        }
        p.finish(`C的特征值为${F(c1)}和${F(c2)}。${finite ? `C严格正定，内层最优t为${F(stationary, 4)}，有限inf为${F(minimum, 4)}。` : 'C不是严格正定，t增大时目标趋向负无穷；图中右端不是全局最小值。'}`);
        return readout([
          ['C 的性质', finite ? '正定：有限域内' : (c1 === 0 ? '半正定但奇异：不在有限域' : '不定：不在有限域')],
          ['内层 inf', finite ? F(minimum, 4) : '−∞'],
          ['内层 minimizer', finite ? `t* = ${F(stationary, 4)}` : '不存在']
        ]) + `<p>${finite ? '有限值应与 log(c₁c₂) + 2 一致。' : '有限的绘图窗口不会把 −∞ 变成有限下界。'} 矩阵乘子的 PSD 约束，与这个系数矩阵的严格正定条件，需要分别检查。</p>`;
      }
    },

    waterfill: {
      title: 'Water-filling：哪些通道会被启用？',
      caption: '噪声底 N = (1, 2, 4)，最大化 Σ log(1 + pᵢ/Nᵢ)。先抬高水位，再把预算分给高于噪声底的水柱。',
      controls: [
        {key: 'budget', label: '总预算 P', min: 0, max: 10, step: 0.1, value: 4.5}
      ],
      draw(host, v) {
        const budget = Number(v.budget);
        const s = waterfillState(budget);
        const ymax = Math.max(6, s.level + 1.2);
        const p = L.plot(host, [-0.65, 2.65], [0, ymax], '通道 1 / 2 / 3', '噪声底 + 分配量');
        p.line([-0.55, s.level], [2.55, s.level], C.green, '6 4', 2);
        s.noise.forEach((noise, i) => {
          const allocated = s.allocations[i];
          const top = noise + allocated;
          p.poly([[i - 0.28, 0], [i + 0.28, 0], [i + 0.28, noise], [i - 0.28, noise]], C.line, C.muted, 0.68);
          if (allocated > 1e-9) {
            p.poly([[i - 0.28, noise], [i + 0.28, noise], [i + 0.28, top], [i - 0.28, top]], C.blue, C.blue, 0.6);
          }
          p.line([i - 0.31, 0], [i - 0.31, top + 0.28], C.muted, '', 1);
          p.line([i + 0.31, 0], [i + 0.31, top + 0.28], C.muted, '', 1);
          const noiseLabelY = Math.abs(noise / 2 - s.level) < 0.32 ? Math.max(0.2, noise / 2 - 0.5) : noise / 2;
          p.text(i, noiseLabelY, `N${i + 1} = ${noise}`, C.ink, 'middle');
          p.text(i, top + 0.5, `p${i + 1} = ${F(allocated)}`, allocated > 1e-9 ? C.blue : C.muted, 'middle');
        });
        const active = s.allocations.filter(x => x > 1e-8).length;
        p.finish(`三个通道的噪声底分别为1、2、4，总预算${F(budget)}。二分求得水位${F(s.level, 4)}，分配量分别为${s.allocations.map(x => F(x, 4)).join('、')}，已用预算${F(s.used, 4)}，启用${active}个通道。虚线表示共同水位，灰色部分是噪声底，蓝色水柱是实际分配。`);
        return readout([
          ['虚线水位 h', F(s.level, 4)],
          ['pᵢ = max(0, h − Nᵢ)', s.allocations.map(x => F(x, 3)).join('，')],
          ['已用预算 / P', `${F(s.used, 4)} / ${F(budget, 4)}`],
          ['启用通道 / 总效用（自然对数）', `${active} / ${F(s.utility, 4)}`]
        ]) + '<p>启用通道的 Nᵢ + pᵢ 相同；未启用通道的噪声底不低于水位。P = 0 时选取 h = 1 作为约定水位，分配全为零。</p>';
      }
    }
  });
}());
