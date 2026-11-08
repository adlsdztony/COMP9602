window.ASSIGNMENT_SUPPORT = {
  cases: [
    {
      id: 'q1',
      title: '矩阵约束中的 log-det 对偶',
      subtitle: 'Log-determinant, matrix inequalities & conic duality',
      summary: String.raw`<p>目标是把 \(\min_{X\in S_{++}^n}-\log\det X\)、\(A_i^TXA_i\preceq B_i\) 转换成一个尺寸和符号都正确的对偶问题。题目给定 \(B_i\succ0\) 与 \(\sum_iA_iA_i^T\succ0\)。你需要说明乘子的域、dual function 的有限域，并证明最优对偶间隙为零。</p><p>这里的 \(\preceq\) 是 PSD order；它比较所有方向上的二次型，不是逐个比较矩阵元素。</p>`,
      chapters: ['recap', 'cones', 'gp-sdp', 'duality', 'strong', 'cone-duality'],
      skills: ['区分 PSD 与 PD，以及矩阵偏序与元素级偏序', '用 trace inner product 为 LMI 配置锥乘子', '把关于 X 的项收集成一个矩阵系数', '检查内层 inf 的有限域', '构造严格可行点并应用 Slater'],
      hints: [
        {
          title: '如何开始：先确定乘子的尺寸和正性',
          html: String.raw`<p>把约束写成 \(A_i^TXA_i-B_i\preceq0\)。这是一个 \(k_i\times k_i\) 对称矩阵，所以配对的乘子也必须属于同样尺寸的对称矩阵空间。回忆 PSD cone 的 dual cone 是什么，以及矩阵的内积 \(\langle U,V\rangle=\operatorname{tr}(UV)\)。</p><p>先检查每一项的尺寸，再写 Lagrangian；结果必须是一个实数。</p>`
        },
        {
          title: '推导检查：收集矩阵系数后再做内层最小化',
          html: String.raw`<p>使用 trace 的循环性质，把 \(\operatorname{tr}(Z_iA_i^TXA_i)\) 改写成与 X 的 trace 内积。将这些系数之和暂记为 C，内层就有 \(-\log\det X+\operatorname{tr}(CX)\) 的形状。</p><p>分开检查：C 正定、C 有零方向、C 有负方向时，内层是否存在有限下界。只有确认有限性后，才用题面给出的 \(\nabla_X\log\det X=X^{-1}\) 写 stationarity。不要只求导而遗漏其他情形。</p>`
        },
        {
          title: '自检：强对偶的理由必须对应题目的假设',
          html: String.raw`<p>尝试 \(X=tI\)，其中 t 是足够小的正数。因为每个 \(B_i\succ0\)，你能否让所有 \(B_i-tA_i^TA_i\) 都严格正定？这给出 Slater 所需的严格可行性。</p><p>再想想 \(H=\sum_iA_iA_i^T\succ0\) 的用途：对原约束取 trace 并求和，可以约束 \(\operatorname{tr}(HX)\)，进而限制可行 X 的规模。最后分别检查：primal 的凸性、有限最优值、严格可行性、乘子的 PSD 约束，以及 dual function 的有限域。</p>`
        }
      ],
      pitfall: String.raw`<p><strong>两个不同的条件：</strong>乘子属于 PSD cone 是 dual feasibility；内层关于 X 的矩阵系数严格正定，是 dual function 有限的条件。前者不会自动保证后者。也不要把 \(X\succ0\) 的 domain 约束当成必须再加入一个普通非负乘子的元素级约束。</p>`,
      source: {page: 1, label: 'Assignment 2'}
    },
    {
      id: 'q2',
      title: '几何均值为什么是下包络？',
      subtitle: 'Geometric mean as an infimum of affine functions',
      summary: String.raw`<p>固定 \(x\in\mathbb R_{++}^n\)，把 \(G(x)=(\prod_i x_i)^{1/n}\) 表示为一族关于 x 的仿射函数的下确界。题目的内层优化变量是 v，约束为 \(\sum_i\log v_i=0\)、\(v\succ0\)。你先研究其 Lagrange dual function，再证明表示式，最后推出凹性和 AM–GM inequality。</p><p>本题跨 PDF 第 1–2 页。</p>`,
      chapters: ['recap', 'standard', 'reformulation', 'gp-sdp', 'duality', 'strong'],
      skills: ['区分参数 x 与优化变量 v', '对等式乘子的不同符号分情况', '区分 minimum 与 infimum', '识别非仿射等式和对数变量代换', '由 affine 函数族的下包络证明凹性'],
      hints: [
        {
          title: '如何开始：先固定 x，再处理 v 的等式',
          html: String.raw`<p>固定 x 后，目标对 v 是线性的。给 \(\sum_i\log v_i=0\) 配置一个自由符号的标量乘子，并逐坐标拆开 Lagrangian 的 inf。</p><p>注意：\(\sum_i\log v_i=0\) 在 v 坐标里不是仿射等式。若想将它视为标准凸程序，可考虑 \(u_i=\log v_i\)：等式会变成什么，目标又会变成什么？</p>`
        },
        {
          title: '推导检查：乘子的正、零、负不能跳过',
          html: String.raw`<p>如果你采用 \(+\lambda\sum_i\log v_i\) 的符号约定，就分别检查 \(\lambda\gt 0\)、\(\lambda=0\)、\(\lambda\lt 0\)。在某些情形，令某个 \(v_i\downarrow0\) 就能判断内层是否趋向 \(-\infty\)；在另一些情形，需要区分“有一个有限 inf”和“在正域内达到这个 inf”。</p><p>对可以有限最小化的情形，再求每个坐标的一阶条件。将结果代回 L 后，检查所有对数的参数是否严格为正。</p>`
        },
        {
          title: '自检：用 tightness 证明表示，再推出凹性',
          html: String.raw`<p>要证明一个 inf 表示式，需同时有下界和能达到该下界的可行 v。检查你构造的 v 是否满足 \(\prod_i v_i=1\)，以及其目标值能否与对偶下界相等。</p><p>表示式一旦成立，观察：可供选择的 v 集合不依赖 x；每个固定 v 对应的 \(v^Tx/n\) 都关于 x 仿射。由此使用点态下包络的凹性规则。最后代入一个简单可行的 v 得到 AM–GM，而不是先借 AM–GM 证明表示式后再循环引用。</p>`
        }
      ],
      pitfall: String.raw`<p><strong>非仿射等式：</strong>不能直接在原始 v 坐标上套用标准凸程序的 Slater 条件。可以明确完成对数变量代换，或直接展示 primal feasible value 与 dual bound 相等。另一个易错点是“inf of convex functions 仍凸”这个错误规则；本题使用的是 <strong>inf of affine functions 是凹的</strong>。</p>`,
      source: {page: 1, label: 'Assignment 2'}
    },
    {
      id: 'q3',
      title: '一个半空间如何改变二次最优点？',
      subtitle: 'Strictly convex QP, active sets & KKT',
      summary: String.raw`<p>对 \(Q\succ0\)、\(a\ne0\)，研究 \(\min_x\frac12x^TQx+q^Tx\)，约束为 \(a^Tx\le b\)。你需要求 dual function 及其有效域，推导最优乘子和 primal optimizer，并在题目给定的二维实例中核对共同最优值。</p><p>先找到 unconstrained optimum，再问它是否满足半空间约束，可以大幅简化后面的分情况。</p>`,
      chapters: ['standard', 'lp', 'duality', 'strong', 'kkt', 'sensitivity'],
      skills: ['最小化严格凸二次函数', '区分乘子符号约束与函数有效域', '使用 KKT 四条件', '处理 active 与 inactive 两种情形', '核对 primal 和 dual 的目标值'],
      hints: [
        {
          title: '如何开始：给半空间配一个非负乘子',
          html: String.raw`<p>写出 \(L(x,\lambda)=\frac12x^TQx+q^Tx+\lambda(a^Tx-b)\)，并标明乘子的符号。对固定的 λ，为什么这个关于 x 的二次函数仍有唯一 minimizer？</p><p>先通过 stationarity \(Qx+q+\lambda a=0\) 消去 x，再代回 L。也可以配方；两条路线应给出相同结果。</p>`
        },
        {
          title: '推导检查：先问 unconstrained point 是否可行',
          html: String.raw`<p>将 \(\lambda=0\) 对应的 unconstrained optimizer 代入约束。若它已经可行，应如何选择 λ？若它严格违反约束，互补松弛会迫使最优点满足哪条等式？</p><p>此时用 stationarity 和活跃约束联立，只剩一个标量方程。正定性与 \(a\ne0\) 会保证你得到的标量二次项系数严格为正。</p>`
        },
        {
          title: '自检：四条 KKT 与两个目标值',
          html: String.raw`<p>逐条检查 primal feasibility、dual feasibility、stationarity、complementary slackness。不要只验证梯度为零。</p><p>在数值例子中，分别从原目标和 dual function 计算最优值；它们应相同。还可以改变 b 做几何自检：放松约束时，最小化问题的最优值不能上升。约束恰好触及 unconstrained optimum 的切换点，可能 active 而 λ 为零。</p>`
        }
      ],
      pitfall: String.raw`<p><strong>域要分清：</strong>由于 \(Q\succ0\)，dual function 的二次内层 inf 对每个实数 λ 都有限；但 dual optimization 另要求 \(\lambda\ge0\)。同时，active 不代表乘子一定严格为正。</p>`,
      source: {page: 2, label: 'Assignment 2'}
    },
    {
      id: 'q4',
      title: '从相对熵到归一化指数族',
      subtitle: 'Entropy duality, log-sum-exp & primal recovery',
      summary: String.raw`<p>目标为 \(f_0(x)=\sum_kx_k\log(x_k/y_k)\)，约束是 \(Ax=b\)、\(\mathbf1^Tx=1\)、\(x\succ0\)。题目仅要求 \(y\succ0\)，并假设存在严格正的可行点。</p><p>你要先推导 full dual，再消去归一化等式的乘子；随后解释指数归一化得到的 \(p(z)\)、dual gradient 与约束残差的关系。题目跨 PDF 第 2–3 页。</p>`,
      chapters: ['recap', 'standard', 'reformulation', 'duality', 'strong', 'kkt', 'sensitivity'],
      skills: ['逐坐标求 separable Lagrangian 的 inf', '保持等式乘子符号约定一致', '消去归一化乘子', '理解 log-sum-exp 与 softmax', '区分归一化、primal feasibility 与最优性'],
      hints: [
        {
          title: '如何开始：先统一等式乘子的符号',
          html: String.raw`<p>为了与题面 reduced dual 的 \(+b^Tz\) 对齐，可将第一个等式项写成 \(z^T(b-Ax)\)，另用一个自由符号乘子处理 \(\mathbf1^Tx-1\)。其他符号约定也可以，但全程必须一致。</p><p>利用 \(A=[a_1\ \cdots\ a_n]\)，把关于 x 的 Lagrangian 拆成 n 个一维问题。先求 \(x_k\log(x_k/y_k)+c_kx_k\) 的 inf，再组合起来。</p>`
        },
        {
          title: '推导检查：消去一个乘子就是做一次最大化',
          html: String.raw`<p>得到 full dual function 后，将 \(S(z)=\sum_k y_ke^{a_k^Tz}\) 记作一个正数。对归一化乘子求最大化的一阶条件，检查这是否恰好让你恢复的 x 各分量之和为 1。</p><p>代回之后，再对 z 求导。用 \(\nabla\log S=\nabla S/S\) 看清归一化权重如何出现。实现计算时可用 log-sum-exp 的稳定写法，避免直接计算很大的指数。</p>`
        },
        {
          title: '自检：归一化还不等于满足所有约束',
          html: String.raw`<p>任意 z 生成的 \(p(z)\) 都严格正且归一化。仍需单独检查 \(Ap(z)=b\)；dual gradient 正是在度量这个 moment constraint 的残差。</p><p>验证题面的差值恒等式时，可先由 \(\log[p_k(z)/y_k]\) 展开 f₀，再与 g 相减。只有候选点也满足全部 primal 约束，才可以将相等目标值用作最优性证书。</p>`
        }
      ],
      pitfall: String.raw`<p><strong>formal difference 不是无条件的 gap：</strong>当 \(Ap(z)\ne b\) 时，\(p(z)\) 不是 primal feasible；\(f_0(p(z))-g(z)\) 可以为负，也可能为零而仍不可行。不要只看差值判断最优。另请保留题目的条件 \(y\succ0\)，不要擅自要求 y 的和为 1。</p>`,
      source: {page: 2, label: 'Assignment 2'}
    },
    {
      id: 'q5',
      title: '用盒约束构造一个下界证书',
      subtitle: 'Box constraints, gradient splitting & dual certificates',
      summary: String.raw`<p>对一个可微凸目标与可微凸不等式，另有 \(l\preceq x\preceq u\)。题目固定 x 与 \(\lambda\succeq0\)，要求选择非负的上下界乘子，使这个 x 成为 Lagrangian 的全局 minimizer。</p><p>随后在盒中点、\(\lambda=0\) 处产生一个可计算的 primal lower bound，并将方法用于题目给定的二维例子。你构造的是一个 dual feasible certificate，未必是最优证书。</p>`,
      chapters: ['recap', 'standard', 'duality', 'kkt', 'cone-duality', 'readiness'],
      skills: ['由凸性与 stationarity 证明全局内层最优', '按梯度分量的正负拆分乘子', '用 weak duality 认证 lower bound', '理解盒半宽与绝对梯度的内积', '区分有效证书与最优解'],
      hints: [
        {
          title: '如何开始：先消掉 Lagrangian 的梯度',
          html: String.raw`<p>将已有梯度之和记为 \(w=\nabla f_0(x)+\sum_i\lambda_i\nabla f_i(x)\)。按题面的符号，完整的梯度是 \(w+\mu-\nu\)。</p><p>逐个分量思考：若某个 \(w_j\) 为正，应该启用哪一边的非负乘子来抵消它？若为负呢？先保证符号和 stationarity，再解释为什么凸性足以保证全局 inf 在这里达到。</p>`
        },
        {
          title: '推导检查：在中点代入盒的两侧距离',
          html: String.raw`<p>当 \(\bar x=(l+u)/2\) 时，\(\bar x-u\) 与 \(l-\bar x\) 都等于盒半宽的负值。把你选择的乘子代回 L，会出现梯度各分量的绝对值。</p><p>这里使用的是 weak duality：一个 dual feasible point 就能给出 lower bound，不需要先求出 dual optimum，也不需要假设你构造的点满足互补松弛。</p>`
        },
        {
          title: '自检：交叉项的系数与证书的意义',
          html: String.raw`<p>数值目标中，括号外的 \(1/2\) 同样乘到了交叉项 \(x_1x_2\)。先独立算中点处的目标值和梯度，再按正负部选择乘子。</p><p>最终检查乘子非负、L 的梯度为零，以及你报告的是 lower bound。除非另有 tightness 或完整 KKT 证据，不能直接把这个 lower bound 当作 primal optimal value。</p>`
        }
      ],
      pitfall: String.raw`<p><strong>抵消梯度不等于解完原问题：</strong>这里只需让给定 x 最小化固定乘子下的 L。该 x 不必因此成为 primal optimizer。数值题中也不要把目标里的 \(\tfrac12x_1x_2\) 当作 \(x_1x_2\)，否则梯度和下界都会出错。</p>`,
      source: {page: 3, label: 'Assignment 2'}
    }
  ],
  graduateQuiz: [
    {
      id: 'check-psd', level: 'diagnostic', chapter: 'recap',
      q: String.raw`令 \(M=\begin{pmatrix}1&2\\2&1\end{pmatrix}\)。下面哪一个判断正确？`,
      options: [String.raw`所有元素为正，所以 \(M\succ0\)。`, String.raw`M 不定，因此 \(x^TMx\) 不是凸函数。`, String.raw`对角线为正已经足以证明 \(M\succeq0\)。`, String.raw`\(X\preceq B\) 总是指每个元素分别小于等于。`],
      answer: 1,
      explanation: String.raw`<p>M 的特征值为 3、−1；也可取 \(v=(1,-1)\) 得 \(v^TMv=-2\)。二次函数的 Hessian 是 \(2M\)，所以它不凸。PSD order 比较所有方向上的二次型，不等于 componentwise order。关联 A2 Q1。</p>`
    },
    {
      id: 'check-form', level: 'diagnostic', chapter: 'standard',
      q: String.raw`关于等价变形与凸程序标准形式，哪一个说法正确？`,
      options: [String.raw`任何凸函数都可出现在等式约束左边而保持凸可行集。`, String.raw`严格递增的目标变换保留 argmin，但不一定保留凸目标形式。`, String.raw`把 \(\min_xf_0(x)\) 写成 epigraph 形式一定改变最优 x。`, String.raw`函数的 domain 与约束所定义的 feasible set 永远相同。`],
      answer: 1,
      explanation: String.raw`<p>严格递增变换保留目标值的排序，但不保证曲率不变。例如在 \(x\gt 0\) 上，最小化 x 与最小化 \(\log x\) 保留排序，后者却是凹目标。标准凸等式应为 affine；\(x^2=1\) 的可行集就是非凸的反例。epigraph 变换 \(f_0(x)\le t\)、最小化 t 则保留原来的最优 x。</p>`
    },
    {
      id: 'check-quasiconvex', level: 'graduation', chapter: 'standard',
      q: String.raw`在 \(y\gt 0\) 上，固定阈值 \(\tau\)，考虑 \(x/y\le\tau\)。哪一个结论正确？`,
      options: [String.raw`它等价于 \(x-\tau y\le0\)，因此固定阈值的可行性问题可为凸问题。`, String.raw`这证明 \(x/y\) 对 x、y jointly convex。`, String.raw`可以将 τ、x、y 同时当变量，而 \(\tau y\) 仍是 affine。`, String.raw`因为分母是变量，任何 sublevel set 都必为非凸。`],
      answer: 0,
      explanation: String.raw`<p>固定 τ 后，\(x-\tau y\le0\) 是仿射不等式，和 \(y\gt 0\) 的域相交仍凸。这是 quasiconvex optimization 通过 feasibility + bisection 工作的关键。它不说明函数 jointly convex；x/y 的 Hessian 行列式为 \(-1/y^4\lt 0\)。τ 在一次 feasibility 子问题里必须是固定参数。</p>`
    },
    {
      id: 'check-models', level: 'graduation', chapter: 'gp-sdp',
      q: String.raw`依次识别：①线性目标与仿射约束；②PSD Hessian 的二次目标与仿射约束；③\(\|Fx+g\|_2\le a^Tx+b\) 配合仿射目标；④线性目标与 LMI；⑤正变量中最小化 \(x^{-1}+2y/x\)，满足 \(xy=1\)。最具体的分类是？`,
      options: [String.raw`LP、QP、SOCP、SDP、GP。`, String.raw`LP、LP、QP、SOCP、SDP。`, String.raw`五者在原变量里都是 LP。`, String.raw`第五个问题有非仿射等式，所以不可能通过变量代换得到凸形式。`],
      answer: 0,
      explanation: String.raw`<p>答案依次为 LP、convex QP、SOCP、SDP、GP。第⑤项令 \(u=\log x,v=\log y\)，其对数目标变为 \(\log(e^{-u}+2e^{v-u})\)，等式变为 \(u+v=0\)。GP 的凸性通常在对数坐标中显现；并非所有指数模型都属于 GP。关联 A2 Q1/Q2/Q3，但建模分类本身属于完整课程主线。</p>`
    },
    {
      id: 'check-dual-domain', level: 'diagnostic', chapter: 'duality',
      q: String.raw`对 \(\min_{x\gt 0}-\log x\)、\(x\le3\)，令 \(L=-\log x+\lambda(x-3)\)。关于 dual function 的有效域，哪个判断正确？`,
      options: [String.raw`只要 \(\lambda\ge0\)，内层 inf 就一定有限。`, String.raw`只有 \(\lambda\gt 0\) 时有限；\(\lambda=0\) 虽满足乘子符号，但给出 \(-\infty\)。`, String.raw`因为原问题可行，任意实数 λ 都给出有限 g。`, String.raw`\(\lambda\lt 0\) 才能使内层关于 x 凸。`],
      answer: 1,
      explanation: String.raw`<p>λ&gt;0 时，stationarity 给出 \(x=1/\lambda\)，从而 \(g(\lambda)=1+\log\lambda-3\lambda\)。λ=0 时令 x→∞，L→−∞；λ&lt;0 时负线性项也使 inf 为−∞。乘子的符号约束和 g 的有限域是两件事。关联 A2 Q1/Q2/Q3。</p>`
    },
    {
      id: 'check-slater', level: 'graduation', chapter: 'strong',
      q: String.raw`考虑 \(\min_xx^2\)，约束 \(x^2\le0\)。不存在严格可行点。由此能推出什么？`,
      options: [String.raw`optimal duality gap 必须为正。`, String.raw`dual problem 必须不可行。`, String.raw`不能据此否定强对偶；此例 primal 和 dual 的最优值其实都为 0。`, String.raw`原问题必定没有 minimizer。`],
      answer: 2,
      explanation: String.raw`<p>可行集为 {0}，primal value=0。对 \(\lambda\ge0\)，\(L=(1+\lambda)x^2\)，所以 g=0，dual value 也为0。Slater 是常用的充分条件，不是必要条件；它失败不意味着强对偶必然失败。关联 A2 Q1/Q3/Q4 的 qualification 检查。</p>`
    },
    {
      id: 'check-qp-kkt', level: 'graduation', chapter: 'kkt',
      q: String.raw`迁移例子：\(\min_x\frac12\|x\|_2^2+(-3,-1)^Tx\)，约束 \(x_1+x_2\le2\)。哪组结果符合 KKT？`,
      options: [String.raw`\(x^\star=(3,1),\lambda^\star=0,p^\star=-5\)。`, String.raw`\(x^\star=(2,0),\lambda^\star=1,p^\star=-4\)。`, String.raw`\(x^\star=(1,1),\lambda^\star=1,p^\star=-3\)。`, String.raw`\(x^\star=(2,0),\lambda^\star=-1,p^\star=-4\)。`],
      answer: 1,
      explanation: String.raw`<p>正确点为 (2,0)，乘子为1。stationarity：\((2,0)+(-3,-1)+(1,1)=0\)；约束取等、乘子非负、互补松弛成立。目标值为 \(2-6=-4\)，dual value 也为−4。若把右端改为4，则 unconstrained optimum (3,1) 恰好在边界，active 但 λ=0。关联 A2 Q3；这里使用了不同的数值。</p>`
    },
    {
      id: 'check-envelope', level: 'graduation', chapter: 'recap',
      q: String.raw`对 \(x\gt 0\)，令 \(h(x)=\inf_{t\gt 0}(tx+1/t)/2\)。哪一个推理正确？`,
      options: [String.raw`因为每个被取 inf 的函数凸，所以 h 必定凸。`, String.raw`固定 t 时关于 x 仿射；其下包络凹，这里恰好得到 \(\sqrt x\)。`, String.raw`对参数取 inf 与取 sup 总保持相同的曲率。`, String.raw`最优 t 永远等于1，与 x 无关。`],
      answer: 1,
      explanation: String.raw`<p>固定 t 时，\((tx+1/t)/2\) 关于 x 仿射；索引集合 t&gt;0 与 x 无关，故 pointwise inf 是凹函数。对 t 求导得到 \(t=1/\sqrt x\)，包络为 \(\sqrt x\)。不要把这里的规则错误推广成“inf of convex functions 一定凸”。关联 A2 Q2。</p>`
    },
    {
      id: 'check-entropy-feasibility', level: 'graduation', chapter: 'kkt',
      q: String.raw`取 \(a=(-1,0,1),y=(1,2,1),b=1/2\)，\(p_k(z)=y_ke^{a_kz}/\sum_jy_je^{a_jz}\)。在 z=0 时，\(p=(1/4,1/2,1/4)\)，且 formal difference \(f_0(p)-g(0)=0\)。哪个结论正确？`,
      options: [String.raw`p 已归一化，所以一定 primal optimal。`, String.raw`差值为0已足够证明强对偶与最优性。`, String.raw`p 仍不可行，因为 Ap=0 不等于 b；dual gradient 为1/2。`, String.raw`y 的和不是1，所以题中指数归一化公式不能使用。`],
      answer: 2,
      explanation: String.raw`<p>正性和归一化不会自动保证 moment equality。这里 \(Ap=0\ne1/2\)，所以 p 不可行；\(g'(0)=b-Ap=1/2\)。恒等式 \(f_0(p)-g=(Ap-b)z\) 在 z=0 为0，但并不是一个可用于认证最优的 feasible primal–dual gap。y 只需严格正，不要求归一化。关联 A2 Q4。</p>`
    },
    {
      id: 'check-box-certificate', level: 'graduation', chapter: 'readiness',
      q: String.raw`盒为 \(l=(0,0),u=(2,4)\)，中点 \(\bar x=(1,2)\) 满足 \(f_0(\bar x)=7,\nabla f_0(\bar x)=(-2,3)\)。其他乘子 λ=0。对 \(\mu^T(x-u)+\nu^T(l-x)\)，哪组是有效证书？`,
      options: [String.raw`\(\mu=(0,3),\nu=(2,0)\)，lower bound=15。`, String.raw`\(\mu=(2,0),\nu=(0,3)\)，lower bound=−1；不保证它等于最优值。`, String.raw`\(\mu=(-2,0),\nu=(0,-3)\)，lower bound=−1。`, String.raw`\(\mu=(2,0),\nu=(0,3)\)，所以 primal optimum 必定为−1。`],
      answer: 1,
      explanation: String.raw`<p>梯度和为 \((-2,3)+(2,0)-(0,3)=0\)，且乘子非负。凸性使该中点成为固定乘子下 L 的全局 minimizer。盒半宽为 (1,2)，故下界为 \(7-(1,2)^T(2,3)=-1\)。有效下界不一定 tight，不能直接认作 primal optimum。关联 A2 Q5；这里使用不同的盒和梯度。</p>`
    },
    {
      id: 'check-conic-pairing', level: 'graduation', chapter: 'cone-duality',
      q: String.raw`对矩阵约束 \(F(x)\preceq0\)，如何添加 Lagrangian 项才能延续 weak duality 的下界逻辑？`,
      options: [String.raw`添加 \(\operatorname{tr}(ZF(x))\)，并要求 \(Z\succeq0\)。`, String.raw`只要 Z 每个元素非负就足够，无需 PSD。`, String.raw`添加 \(\det Z\det F(x)\)，要求 \(\det Z\ge0\)。`, String.raw`所有矩阵约束都只能用一个标量非负乘子完整表达。`],
      answer: 0,
      explanation: String.raw`<p>PSD cone 在 trace inner product 下 self-dual。若 \(F(x)\preceq0\)、\(Z\succeq0\)，则 \(\operatorname{tr}(ZF(x))\le0\)，所以在 primal feasible 点上添加该项不会超过原目标，继续支持 lower-bound 逻辑。乘子的尺寸必须与 F(x) 一致。关联 A2 Q1。</p>`
    },
    {
      id: 'check-partial-relaxation', level: 'graduation', chapter: 'reformulation',
      q: String.raw`考虑两个约束 \(f_1(x)\le0,f_2(x)\le0\)。固定 \(\lambda\ge0\)，定义 \(\tilde g(\lambda)=\inf_{f_2(x)\le0}[f_0(x)+\lambda f_1(x)]\)。若再以 \(\mu\ge0\) dualize 第二个约束，哪一项一定成立？`,
      options: [String.raw`任意非负 μ 都使 full dual function 严格大于 \(\tilde g(\lambda)\)。`, String.raw`任意非负 μ 都有 \(g(\lambda,\mu)\le\tilde g(\lambda)\)。`, String.raw`保留约束在内层 domain 就无法形成 lower bound。`, String.raw`无论是否凸、是否满足 qualification，两种最优 dual value 都必定相等。`],
      answer: 1,
      explanation: String.raw`<p>在 \(f_2(x)\le0\) 的点上，新增项 \(\mu f_2(x)\le0\)；full dual 还会在更大的域上取 inf。所以对固定的 λ、μ，有 \(g(\lambda,\mu)\le\tilde g(\lambda)\)。两者对乘子优化后的关系和是否相等，需要进一步条件，不能由这条 fixed-multiplier 关系直接断言。这连接 partial Lagrangian relaxation 与 A2 Q5 的盒约束。</p>`
    },
    {
      id: 'check-shadow-price', level: 'graduation', chapter: 'sensitivity',
      q: String.raw`将一个约束写成 \(f_1(x)\le u\)。在 u=0 的最优乘子为2，且 value function 在这里可微。把 u 增加0.1，最优值的一阶变化近似是多少？`,
      options: [String.raw`增加0.2。`, String.raw`减少0.2。`, String.raw`必定完全不变。`, String.raw`精确减少2，且无须小扰动假设。`],
      answer: 1,
      explanation: String.raw`<p>Lagrangian 含有 \(\lambda[f_1(x)-u]\)，所以在相应正则性和可微条件下，\(dp^\star/du=-\lambda^\star=-2\)。小扰动0.1产生的一阶近似为−0.2。这是一阶近似，不保证有限扰动下精确相等；若只知道 dual optimal multiplier 而不假设可微，通常先得到 supporting-hyperplane 的敏感性下界。关联 A2 Q3，并属于完整的 perturbation/sensitivity 单元。</p>`
    }
  ]
};
