// Section indices refer to the existing duality-content.js sections, starting at zero.
// Recording boundaries below are actual sentence timestamps in the saved Zoom transcripts.
window.DUALITY_INSERTS = {
  duality: {
    2: {
      lab: 'lagrangian',
      question: String.raw`先预测：固定 \(\lambda\) 后，橙色 L 的最低点是否一定满足绿色可行区域？调大 \(\lambda\)，蓝色下界会一直变高吗？`,
      takeaway: String.raw`核对两个层次：先对原变量取 inf 得到 \(g(\lambda)\)，再调乘子选最高下界。内层点可以不可行；合法乘子产生的 \(g\) 始终不高于 \(p^\star\)。`
    }
  },
  strong: {
    0: {
      lab: 'strong',
      question: String.raw`先看严格可行模型，再切到 \(x^2\le0\)：如果下界越来越接近 0，是否一定存在某个有限乘子让它等于 0？`,
      takeaway: String.raw`退化模型中 \(d^\star=p^\star=0\)，却没有有限最优乘子。强对偶比较最优值；attainment 另外检查。下一节再看 Slater 如何提供充分保证。`
    },
    3: {
      figure: {
        src: 'assets/figures/duality-support-lines.png',
        alt: '约束值 u 与目标值 t 平面中的两幅对偶支撑线图。左图一条斜率为负 lambda 的支撑线在纵轴上截得 g(lambda)，低于 primal 最优值 p星；右图改变支撑线斜率后，最高截距 d星仍低于 p星。',
        caption: String.raw`课件原图：这里的横轴是约束值 \(u=f_1(x)\)，纵轴是目标值 \(t=f_0(x)\)，不是原来的 x 坐标。先在左图找 \(g(\lambda)\) 的截距，再在右图找 \(d^\star\) 与 \(p^\star\) 的差距。这是允许非凸点集的一般示意。`,
        lecture: 8, page: 3
      }
    },
    4: {
      figure: {
        src: 'assets/figures/duality-perturbation-boundary.png',
        alt: '将约束值和目标值向右、向上扩张成集合 A，红线标出扰动最优值 P(u) 的下边界。u 等于零时的高度是 p星，一条斜支撑线在纵轴截得 g(lambda)。',
        caption: String.raw`课件原图：允许预算 \(u\) 增加时，可行点变多，红色 \(P(u)\) 不会上升。此图展示一般问题，红线本身未必凸；若原问题是凸标准形，前面证明才保证 \(P\) 凸。图中用 min，正文用 inf，以覆盖最优值不达到的情况。`,
        lecture: 8, page: 4
      },
      clip: {
        file: '2026-10-08_095850', start: 2404.75, end: 2523.32,
        title: '严格可行为什么排除竖直支撑？',
        reason: '老师把 Slater 的 f₁(x)<0 翻译为纵轴左边存在点，再解释非竖直支撑与有限乘子的联系。配合本节原图，比单记严格小于零更容易形成几何直觉。'
      }
    }
  },
  kkt: {
    2: {
      lab: 'kkt',
      question: String.raw`对图中 \(\tfrac12\|x-a\|^2\) 的半空间问题，先预测：旋转法向量或放松 b 后，哪一刻 \(\lambda^\star\) 降为零？最优点碰到边界时，乘子是否一定严格为正？`,
      takeaway: String.raw`把可行区域、约束残差、乘子符号和两根向量一起核对：\(\nabla f_0+\lambda^\star n=0\)。边界恰好经过无约束最优点时，可以 active 且 \(\lambda^\star=0\)。`
    },
    6: {
      lab: 'waterfill',
      question: String.raw`先把预算调到 0，再慢慢增加：哪条通道先得到功率？第三条噪声底为 4 的通道，在多大预算之后才有正分配？`,
      takeaway: String.raw`在 \(P=5\) 时水位恰为 4，分配为 (3,2,0)；继续增加预算后，第三条通道才启用。所有已启用通道的 \(N_i+p_i\) 相同；功率是水位减噪声底。`,
      clip: {
        file: '2026-10-20_095741', start: 1868.55, end: 1996.52,
        title: '把水从最低的桶底开始倒',
        reason: '老师按“先填最低桶、达到下一桶底、再共同升高”的顺序解释阈值切换。若公式里的正部运算仍显抽象，可以边听边调整预算。'
      }
    }
  },
  sensitivity: {
    2: {
      clip: {
        file: '2026-10-08_095850', start: 3208.15, end: 3270.63,
        title: '先有可微条件，再读乘子的负号',
        reason: '老师在这段先说 strong duality 与值函数可微，再分别解释不等式、等式乘子对应负的偏导数。用来核对本节的条件与符号，不必重听整段敏感度推导。'
      }
    },
    3: {
      lab: 'sensitivity',
      question: String.raw`在实验的 \(c=1.6\) 下，把当前额度 b 向右移动：成本为什么下降？先用 \(-\lambda^\star\Delta b\) 预测，再比较实际变化。`,
      takeaway: String.raw`橙色切线是全局下界；沿它读出的变化是局部一阶预测。大幅改变额度时，预测通常不再等于实际变化；跨过 \(b=c\) 后价格降为零。`
    },
    6: {
      figure: {
        src: 'assets/figures/duality-payoff-matrix.png',
        alt: '老师手绘的付款矩阵：行标玩家 x 的动作 1 到 n，列标玩家 y 的动作 1 到 m，交点为付款 Pij，底部注明二人零和博弈。',
        caption: String.raw`课件原图：这里 x、y 是两位玩家的名字。行 i 与列 j 的交点 \(P_{ij}\) 表示 x 付给 y 的金额；u、v 才是混合策略概率。先用图确定“谁想小、谁想大”，再读下一节的两个 LP。`,
        lecture: 8, page: 9
      }
    }
  },
  'cone-duality': {
    7: {
      clip: {
        file: '2026-10-22_095907', start: 849.1, end: 906.43,
        title: '矩阵约束怎样加进一个标量目标？',
        reason: '老师说明 trace 内积与矩阵乘子如何形成一个标量 Lagrangian。适合第一次从标量不等式过渡到 PSD 锥约束时听。'
      }
    },
    8: {
      lab: 'logdet',
      question: String.raw`先令 \(c_1>0\)，观察内层最小点。再把 \(c_1\) 降到 0：即使系数矩阵仍为 PSD，为什么 inf 已经不是有限数？`,
      takeaway: String.raw`\(c_1>0\) 时 \(t^\star=1/c_1\)，有限值为 \(\log(c_1c_2)+2\)；\(c_1=0\) 时沿零特征方向增大 t，负 log 项仍持续下降。PSD 乘子条件与系数矩阵 PD 的有效域条件要分别检查。`
    },
    9: {
      lab: 'entropy',
      question: String.raw`先把 z 设为 0，b 保持为 1.5：此时概率之和是 1，formal 差值也为 0。这足够宣布最优吗？再点击“用二分让 Ap=b”。`,
      takeaway: String.raw`z=0 时 \(p=(1/3,1/3,1/3)\)，但 \(Ap=1\ne1.5\)。归一化与 formal 差值为零都不够；只有再满足 \(Ap=b\)，才可使用真实 primal–dual gap 的非负性与零 gap 证书。`
    },
    10: {
      lab: 'geomean',
      question: String.raw`先改变 u，再改变观察位置 \(x_1\)：橙线会落到几何平均曲线下方吗？点击相切按钮后，再移动观察位置，观察等号是否仍成立。`,
      takeaway: String.raw`每条固定参数的仿射函数都给上界；在与 x 无关的同一个参数集合上取 inf，得到凹函数。相切的最优 v 会随观察点变化；这不改变“固定 v 时关于 x 仿射”的事实。`
    },
    11: {
      lab: 'certificate',
      question: String.raw`把锚点 s 移到盒子外面。橙色切线在盒内的最小值，仍然是原问题的下界吗？再把锚点放回盒内最优点，比较下界差。`,
      takeaway: String.raw`锚点用于构造全局仿射下界与抵消 L 的梯度，不要求先满足盒约束。盒内最优点可以让这里的证书变紧；任意锚点生成的合法乘子则已经提供有效下界。`
    }
  }
};
