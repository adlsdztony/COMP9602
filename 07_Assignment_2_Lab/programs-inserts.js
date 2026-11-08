/* Point-of-use inserts. Indexes refer to PROGRAM_CHAPTERS[*].sections (zero based).
 * Figures are crops from the local course PDFs; no lecture text was redrawn.
 */
window.PROGRAM_INSERTS = {
  standard: {
    5: {
      lab: 'feasible',
      question: String.raw`先预测：无约束碗底在 \(x=0.4\)。把下界 \(b\) 从0.9调到0以下时，最优点还会一直贴着边界吗？`,
      takeaway: String.raw`先看“目标更低的方向是否可行”。当 \(b\le0.4\)，碗底仍可行；当 \(b>0.4\)，最优点被边界挡住，梯度可以不为零。`,
      clip: {
        file: '2026-09-17_095755', start: 2007, end: 2107,
        title: '把一阶内积读成可行方向的几何',
        reason: '这100秒把 y−x 解释为通向其他可行点的方向，比直接背最优性条件更有帮助。数学上的内积≥0也包括直角情形。'
      }
    }
  },
  reformulation: {
    4: {
      lab: 'epigraph',
      question: String.raw`换一个相近的上包络练习：先把 \(t\) 调得很高。此时约束满足，为什么它还不是最优目标值？再把高度逐渐降低，观察哪个条件先失效。`,
      takeaway: String.raw`\(f(x)\le t\) 本身只给上界。是“最小化 \(t\)”与这些不等式共同作用，才把最优高度压到上包络上。`,
      clip: {
        file: '2026-09-22_095833', start: 2587, end: 2662,
        title: '等价的是整个优化问题，不是一个单独不等式',
        reason: '老师专门解释：t可以高于所有仿射项；只有结合min t，才得到原目标的准确最大值。这个细节正是epigraph最容易误解的地方。'
      }
    },
    8: {
      clip: {
        file: '2026-09-22_095833', start: 879, end: 983,
        title: '为什么不把二分里的 t 直接当变量一起最小化？',
        reason: '这段直接回答一个自然疑问：φ_t对x在固定t时凸，不代表它对(x,t)联合凸。听完再回看分式例子里的tq(x)。'
      }
    }
  },
  lp: {
    6: {
      lab: 'integer',
      question: String.raw`本图是“最大化收益”。先预测：允许分数坐标以后，LP最优值应是整数最优值的上界还是下界？再旋转目标方向检查。`,
      takeaway: String.raw`扩大可行集让最大收益不减，所以这里 \(p^*_{\mathrm{LP}}\ge p^*_{\mathrm{ILP}}\)。本节正文讨论最小成本时方向相反；界的方向来自min/max，而不是“松弛”这个词。`
    },
    7: {
      clip: {
        file: '2026-09-24_095928', start: 802, end: 865,
        title: '把分数舍入成0/1，为什么还只能叫近似？',
        reason: '老师先明确舍入规则，再区分“得到了整数方案”与“得到了整数最优方案”。随后再读正文的可行性和两倍成本证明，会更容易分清两层保证。'
      }
    },
    9: {
      question: '先在网络图中找边(1,2)，再在矩阵中找对应列：为什么这一列恰好只有两个非零元素？',
      figure: {
        src: 'assets/figures/programs-directed-incidence.png',
        alt: '上方是4个节点、5条有向边的网络；下方把每条边对应成矩阵的一列，出发节点记−1、到达节点记+1。',
        caption: '同一页课件的网络和incidence matrix上下排列，便于逐边对照。课件采用“入流−出流”，与正文的“出流−入流”整体反号；等式两边一起反号不改变模型或TU性质。',
        lecture: 5, page: 19
      },
      takeaway: '每列描述一条边，它只离开一个节点、进入一个节点。这个特殊的符号结构是网络矩阵拥有TU性质的入口；一般无向图不能直接照搬。'
    }
  },
  cones: {
    3: {
      lab: 'projection',
      question: String.raw`这是带圆盘约束的QCQP。先预测：把半径 \(r\) 调得足够大以后，最优点会留在圆周上，还是回到目标中心 \(a\)？`,
      takeaway: String.raw`当 \(r\ge\|a\|_2\)，中心本来可行，约束inactive；否则最优点是中心向圆盘的径向投影。圆盘的二次约束解释了这为何属于QCQP。`
    },
    4: {
      figure: {
        src: 'assets/figures/programs-second-order-cone.png',
        alt: '以t为竖直高度、x1和x2为横向坐标的二阶锥边界，顶点在原点，正高度截面为圆。',
        caption: '课件中的三维二阶锥。固定t得到一个圆盘截面；把所有非负高度一起考虑，才得到整个实心SOC。图中网格画的是边界，锥内部也属于可行集。',
        lecture: 6, page: 7
      },
      takeaway: '将上一个圆盘实验的半径理解为固定的t：t=0只容许原点，t<0没有可行点，因此平方范数不等式时不能丢掉符号条件。'
    },
    6: {
      clip: {
        file: '2026-09-24_095928', start: 5569, end: 5740,
        title: '最坏扰动为什么沿 Pᵀx 的方向？',
        reason: '老师把内层优化的变量u与暂时固定的方案x分开，再解释最大内积的方向与长度。它补足了从“对所有扰动”到“一个范数余量”的几何直觉。'
      }
    }
  },
  'gp-sdp': {
    3: {
      lab: 'gp',
      question: String.raw`切换到原坐标前先预测：同一个候选点必须保持什么关系？它的横坐标 \(x\) 与 \(u\)、纵坐标 \(p(x)\) 与 \(\log p(e^u)\) 会相同吗？`,
      takeaway: String.raw`坐标对应始终是 \(x=e^u\)，并且log严格保序；目标高度的数值会改变，候选方案与最小化排序没有改变。可在log坐标识别凸性，不能只凭“GP”这个名字判断原坐标曲线。`
    },
    5: {
      lab: 'psd',
      question: '先把非对角元素调成负数：一定会破坏PSD吗？再让矩阵的每个元素都正，检查最小特征值是否仍可能为负。',
      takeaway: String.raw`看 \(\lambda_{\min}\) 与行列式，而不是看每个元素的正负。本例的PSD区域是 \(a\ge b^2\)；边界仅半正定，不能把它当作有限logdet的正定域。`
    },
    8: {
      lab: 'pareto',
      question: '暂时把w当作偏好滑块，先只观察目标空间：能否向某个方向移动，同时把横轴和纵轴目标都降低？下一节再解释权重为何选中这些点。',
      takeaway: '这条曲线上的点互相取舍，都在Pareto前沿；右上角灰点则能被前沿点支配。没有一个点能同时把两项目标分别都做到零。'
    },
    9: {
      question: '现在看课件中的非凸目标前沿：两条虚线能支撑两端，但能否找到一条正权支持线，使中间的x₃成为加权和最优点？',
      figure: {
        src: 'assets/figures/programs-unsupported-pareto.png',
        alt: '一般可达目标集O的非凸下边界，两个端部点各有一条虚线支持线，中间标作f0(x3)的Pareto点位于凹陷处，没有相应的正权支持线。',
        caption: '这幅课件图补充了凸前沿交互中看不到的情况：在一般非凸目标前沿上，x₃可以Pareto，却不是任何正权加权和选出的支持点。正权标量化的Pareto保证不能倒过来理解。',
        lecture: 6, page: 27
      },
      clip: {
        file: '2026-09-29_095855', start: 5873, end: 6005,
        title: '随着权重旋转，支持线仍可能漏掉Pareto点',
        reason: '边看这幅原课件图边听老师解释支持超平面与x₃，能把“充分条件”与“能否找齐前沿”的区别真正对应起来。'
      },
      takeaway: '正权加权和的最优点一定Pareto；反向命题需要额外结构条件。不要因为旋转了很多权重，就宣称已经找齐一般非凸问题的全部Pareto点。'
    }
  }
};
