window.DUALITY_CHAPTERS = [
  {
    "id": String.raw`duality`,
    "title": String.raw`从约束到一族下界`,
    "en": String.raw`Lagrangian & dual function`,
    "group": String.raw`DUALITY`,
    "summary": String.raw`把约束放进目标，先固定乘子、再消去原变量；对偶是在这些可证明的下界中挑最高的一个。`,
    "objectives": [
      String.raw`能统一约束方向并设置乘子符号`,
      String.raw`能区分L、g与dual problem`,
      String.raw`能求内层inf并写有效定义域`,
      String.raw`能用弱对偶检查下界`
    ],
    "prereq": [
      String.raw`凸函数的一阶下界`,
      String.raw`梯度与二次型`,
      String.raw`逐点上确界与下确界`
    ],
    "labs": [
      String.raw`lagrangian`
    ],
    "sections": [
      {
        "title": String.raw`Recap：为什么零梯度能找到最小值`,
        "body": String.raw`<p>可微凸函数位于每一条切平面之上。因此在定义域内部，零梯度意味着全局最小。对偶推导会反复使用这个事实：把乘子当作常数，对原变量求最小值。</p>`,
        "formula": String.raw`f(y)\ge f(x)+\nabla f(x)^T(y-x),\qquad \nabla f(x)=0\Longrightarrow x\text{ is globally optimal}.`,
        "example": String.raw`<p>若 \(Q\succ0\)，完成平方给出 \(\inf_x\{\frac12x^TQx+c^Tx\}=-\frac12c^TQ^{-1}c\)，唯一最小点是 \(-Q^{-1}c\)。</p>`,
        "pitfall": String.raw`<p>非凸函数的零梯度可能是最大值或鞍点；线性函数的inf则可能是 \(-\infty\)。只写“令导数为零”还没有完成论证。</p>`
      },
      {
        "title": String.raw`先统一约束，再写Lagrangian`,
        "body": String.raw`<p>把不等式写成 \(f_i(x)\le0\)，等式写成 \(h_j(x)=0\)。给每条约束一个权重，加到目标上。共同定义域D仍要保留，例如正数、正定矩阵等限制。</p>`,
        "formula": String.raw`L(x,\lambda,\nu)=f_0(x)+\sum_i\lambda_if_i(x)+\sum_j\nu_jh_j(x).`,
        "example": String.raw`<p>\(a^Tx\ge b\) 要写成 \(b-a^Tx\le0\)，对应项为 \(\lambda(b-a^Tx)\)。等式换方向时，乘子也随之反号。</p>`,
        "details": [
          {
            "title": String.raw`为什么lambda非负，而nu自由？`,
            "html": String.raw`<p>在primal feasible点，\(f_i(x)\le0\)。当 \(\lambda_i\ge0\) 时，附加项 \(\lambda_if_i(x)\le0\)，正好让L成为目标的下方估计。等式项在可行点总为零，因此nu没有符号限制。</p>`
          }
        ]
      },
      {
        "title": String.raw`固定乘子，对x取inf`,
        "body": String.raw`<p>固定 \((\lambda,\nu)\)，让x在D中寻找L的下确界，消掉原变量后就得到dual function。求内层inf时，不再强制满足已经松弛的全部primal constraints。</p>`,
        "formula": String.raw`g(\lambda,\nu)=\inf_{x\in D}L(x,\lambda,\nu).`,
        "pitfall": String.raw`<p>正数、正定矩阵这样的定义域不能丢掉；明确决定保留的约束也不能删掉。最小化L得到的 \(x(\lambda,\nu)\) 未必primal feasible，更未必primal optimal。</p>`,
        "details": [
          {
            "title": String.raw`为什么写inf而不总写min？`,
            "html": String.raw`<p>\(\inf_{v>0}v=0\)，但没有正数v能达到0。因此g可以存在，而内层没有minimizer。找不到驻点时，应该检查边界和无界方向。</p>`
          }
        ]
      },
      {
        "title": String.raw`有效定义域会生成新的约束`,
        "body": String.raw`<p>乘子的符号限制来自原约束方向；g的有效定义域则来自内层何时不是负无穷。这是两件不同的事。完整推导必须同时交代。</p>`,
        "formula": String.raw`\operatorname{dom}g=\{(\lambda,\nu):g(\lambda,\nu)>-\infty\}.`,
        "example": String.raw`<p>\(\inf_{x\in\mathbb R^n}(c^Tx+d)\) 在c=0时为d，否则为 \(-\infty\)：若c非零，取 \(x=-tc\)，让t增大即可。</p>`,
        "pitfall": String.raw`<p>“lambda非负”不自动保证g有限；“找到驻点”也不自动排除定义域边界上的无界下降。</p>`
      },
      {
        "title": String.raw`弱对偶：一行可核验的下界证书`,
        "body": String.raw`<p>对任何primal feasible的x与满足符号限制的乘子，以下链条成立。第一步用inf的定义，第二步用可行性与非负乘子。这里完全不需要primal convexity。</p>`,
        "formula": String.raw`g(\lambda,\nu)\le L(x,\lambda,\nu)\le f_0(x)\quad\Longrightarrow\quad d^\star\le p^\star.`,
        "example": String.raw`<p>Primal feasible点给最小化问题的上界，有限dual值给下界。可行对的gap是 \(f_0(x)-g(\lambda,\nu)\ge0\)；最优gap才是 \(p^\star-d^\star\)。</p>`,
        "pitfall": String.raw`<p>一次试验的大gap可能只是候选点不好，不能由此断言这个问题没有strong duality。</p>`
      },
      {
        "title": String.raw`为什么dual总是凸优化`,
        "body": String.raw`<p>固定x后，L对乘子是仿射函数；g是这一族仿射函数的逐点inf，因此是凹函数。最大化凹函数、配合凸的乘子可行域，就是凸优化的方向，哪怕primal非凸也是如此。</p>`,
        "formula": String.raw`g(\theta y_1+(1-\theta)y_2)\ge\theta g(y_1)+(1-\theta)g(y_2),\quad0\le\theta\le1.`,
        "pitfall": String.raw`<p>这里是<strong>最大化凹函数</strong>，不是说g为凸。Dual好求也不代表非凸primal一定能无损恢复。</p>`
      },
      {
        "title": String.raw`完整推一遍LP对偶`,
        "body": String.raw`<p>对 \(\min c^Tx,\ Ax=b,\ x\ge0\)，将非负条件写成 \(-x\le0\)，收集L中x的系数。内层x在整个实空间中变化，因此该系数必须为零，g才有限。</p>`,
        "formula": String.raw`L=-b^T\nu+(c+A^T\nu-\lambda)^Tx,\qquad g=\begin{cases}-b^T\nu,&c+A^T\nu-\lambda=0,\\-\infty,&\text{otherwise.}\end{cases}`,
        "details": [
          {
            "title": String.raw`消去lambda，认出常见形式`,
            "html": String.raw`<p>结合 \(\lambda\ge0\)，得到 \(\max -b^T\nu,\ A^T\nu+c\ge0\)。令y=-nu，得到 \(\max b^Ty,\ A^Ty\le c\)，此处y自由。若primal是 \(Ax\ge b,x\ge0\)，对应dual的y才要求非负。先认primal形式，再决定符号。</p>`
          }
        ]
      },
      {
        "title": String.raw`共轭函数把重复的inf打包`,
        "body": String.raw`<p>Affine constraints \(Ax\le b,Cx=d\) 让内层变成f加线性项。利用 \(f^\star(s)=\sup_x(s^Tx-f(x))\)，可以把inf直接写成负的conjugate。</p>`,
        "formula": String.raw`g(\lambda,\nu)=-f_0^\star(-A^T\lambda-C^T\nu)-b^T\lambda-d^T\nu.`,
        "example": String.raw`<p>\(f(x)=x\log x\)（x>0）的共轭为 \(e^{s-1}\)。可分离的和可以逐坐标计算。加权形式 \(x\log(x/y)\) 的共轭为 \(y e^{s-1}\)（y>0）。</p>`,
        "pitfall": String.raw`<p>\(f^\star\)是函数，\(p^\star\)是数值，\(x^\star\)是点；相同星号承担不同角色。</p>`
      }
    ],
    "quiz": [
      {
        "id": String.raw`duality-q1`,
        "q": String.raw`<p>约束 \(a^Tx\ge b\) 应给最小化问题的L加哪一项？</p>`,
        "options": [
          String.raw`\(\lambda(a^Tx-b),\lambda\ge0\)`,
          String.raw`\(\lambda(b-a^Tx),\lambda\ge0\)`,
          String.raw`\(\nu(b-a^Tx),\nu\text{ free}\)`
        ],
        "answer": 1,
        "explanation": String.raw`<p>先统一成小于等于零，再乘非负lambda，才能在primal feasible点保证附加项不大于零。</p>`
      },
      {
        "id": String.raw`duality-q2`,
        "q": String.raw`<p>\(\inf_{x\in\mathbb R}(cx+d)\) 何时有限？</p>`,
        "options": [
          String.raw`总是有限`,
          String.raw`当且仅当 \(c\ge0\)`,
          String.raw`当且仅当 \(c=0\)`
        ],
        "answer": 2,
        "explanation": String.raw`<p>x能向两个方向移动。只要c非零，就有无界下降方向。</p>`
      },
      {
        "id": String.raw`duality-q3`,
        "q": String.raw`<p>哪句话不需要primal convexity？</p>`,
        "options": [
          String.raw`有限dual值是primal最优值的下界`,
          String.raw`每个KKT点都全局最优`,
          String.raw`最优duality gap必为零`
        ],
        "answer": 0,
        "explanation": String.raw`<p>弱对偶只依赖inf、可行性和乘子符号。后两项需要额外条件。</p>`
      }
    ],
    "sources": [
      {
        "lecture": 7,
        "page": 3,
        "note": String.raw`标准形与Lagrangian`
      },
      {
        "lecture": 7,
        "page": 4,
        "note": String.raw`g与dual problem`
      },
      {
        "lecture": 7,
        "page": 5,
        "note": String.raw`LP推导`
      },
      {
        "lecture": 7,
        "page": 6,
        "note": String.raw`conjugate`
      },
      {
        "lecture": 7,
        "page": 9,
        "note": String.raw`g的凹性`
      },
      {
        "lecture": 7,
        "page": 13,
        "note": String.raw`弱对偶证明`
      },
      {
        "lecture": 7,
        "page": 14,
        "note": String.raw`duality gap`
      }
    ],
    "clips": [
      {
        "file": String.raw`2026-10-06_095854`,
        "start": 574.15,
        "end": 770,
        "title": String.raw`固定乘子，对x求inf`,
        "note": String.raw`定义dual function与三步推导流程`
      },
      {
        "file": String.raw`2026-10-06_095854`,
        "start": 1717.99,
        "end": 1980,
        "title": String.raw`共轭函数怎样进入对偶`,
        "note": String.raw`从inf到负的conjugate`
      },
      {
        "file": String.raw`2026-10-06_095854`,
        "start": 5648.63,
        "end": 5830,
        "title": String.raw`弱对偶与可计算下界`,
        "note": String.raw`原问题即使非凸，下界仍有效`
      }
    ]
  },
  {
    "id": String.raw`strong`,
    "title": String.raw`下界什么时候碰到最优值`,
    "en": String.raw`Strong duality & geometry`,
    "group": String.raw`DUALITY`,
    "summary": String.raw`Slater、支撑线和非凸反例，帮助你分清零gap、最优点存在和凸性之间的关系。`,
    "objectives": [
      String.raw`能区分强对偶与最优点达到`,
      String.raw`能检查Slater及线性不等式精化`,
      String.raw`能用支撑线理解g`,
      String.raw`知道非凸也可能零gap`
    ],
    "prereq": [
      String.raw`dual function与弱对偶`,
      String.raw`凸集与支撑超平面`,
      String.raw`对称矩阵特征值`
    ],
    "labs": [
      String.raw`strong`
    ],
    "sections": [
      {
        "title": String.raw`Strong duality说的是两个数`,
        "body": String.raw`<p>弱对偶总给 \(d^\star\le p^\star\)。若最好的下界达到真实最优值，就称strong duality。Primal和dual变量的维数可以不同，定理没有说它们是同一个点。</p>`,
        "formula": String.raw`d^\star=p^\star.`,
        "pitfall": String.raw`<p>最优值相等不自动意味着两边最优点都达到。要恢复最优点或建立saddle pair，还须检查attainment。</p>`
      },
      {
        "title": String.raw`Slater：严格可行点留出余量`,
        "body": String.raw`<p>对凸标准形，目标与不等式函数凸、等式affine。若存在适当定义域内部点，让nonlinear inequalities严格成立、等式精确成立，则Slater给出strong duality；通常有限最优情形还给出dual optimal multipliers。</p>`,
        "formula": String.raw`\exists\tilde x\in\operatorname{ri}D:\quad f_i(\tilde x)<0,\quad A\tilde x=b.`,
        "formulaCaption": String.raw`讲义对开放定义域写int D，更一般形式用相对内部ri D。`,
        "details": [
          {
            "title": String.raw`Affine inequalities的精化`,
            "html": String.raw`<p>线性不等式可以只要求非严格可行；非affine的凸不等式才要严格。等式始终精确满足，不存在“严格满足等式”的要求。</p>`
          }
        ],
        "pitfall": String.raw`<p>Slater是充分条件而非必要条件。未满足它不表示必有gap；仅凭primal凸也不能无条件宣布零gap。</p>`
      },
      {
        "title": String.raw`LP有有限最优、无界和不可行三种状态`,
        "body": String.raw`<p>若LP有有限且达到的最优解，dual也有最优解并目标相等。无界或不可行的情况要分开处理。弱对偶已经能排除许多不可能的组合。</p>`,
        "formula": String.raw`\text{primal unbounded}\Rightarrow\text{dual infeasible},\quad\text{dual unbounded}\Rightarrow\text{primal infeasible}.`,
        "example": String.raw`<p>两边可以同时有有限最优值，也可以同时infeasible。仅知primal infeasible，不能断言dual必定unbounded。</p>`
      },
      {
        "title": String.raw`换个平面看lower bound`,
        "body": String.raw`<p>单约束时，把x映射到 \(u=f_1(x),t=f_0(x)\)。横轴记录约束值，纵轴记录目标值。固定lambda后，沿斜率为-lambda的直线向上移动，直到碰到这个点集。</p>`,
        "formula": String.raw`\mathcal G=\{(f_1(x),f_0(x)):x\in D\},\qquad g(\lambda)=\inf_{(u,t)\in\mathcal G}(t+\lambda u).`,
        "example": String.raw`<p>\(t+\lambda u=g(\lambda)\)的纵轴截距是g。Dual挑选最大的截距；primal则看u≤0一侧的最低可行目标。这不是原来的x-space。</p>`
      },
      {
        "title": String.raw`扰动值函数与支撑面`,
        "body": String.raw`<p>定义 \(\mathcal A=\{(u,t):\exists x,\ f_1(x)\le u,\ f_0(x)\le t\}\)。凸primal使A凸，它的下边界P(u)也凸。严格可行点u<0排除了只能垂直支撑的病态情况，非垂直支撑面可以用有限乘子表示。</p>`,
        "formula": String.raw`P(u)=\inf\{f_0(x):f_1(x)\le u\},\qquad P(\theta u_1+(1-\theta)u_2)\le\theta P(u_1)+(1-\theta)P(u_2).`,
        "details": [
          {
            "title": String.raw`P凸性的两步证明`,
            "html": String.raw`<p>两端候选点的凸组合对中间预算可行，因为f1凸；该组合点的目标不超过两端目标的加权平均，因为f0凸。若inf不达到，用任意接近inf的候选点，再让误差趋零。</p>`
          }
        ]
      },
      {
        "title": String.raw`Min–max不等式与鞍点`,
        "body": String.raw`<p>固定x，若有不等式被违反，就能把对应非负乘子增大，使L无界上升；若有等式被违反，则调节自由乘子的正负号，同样使L无界上升。若x可行，sup乘子还原f0(x)。因此primal是先sup乘子再inf原变量，dual则把顺序反过来。x始终在原始共同定义域D中变化。</p>`,
        "formula": String.raw`p^\star=\inf_{x\in D}\sup_{\lambda\ge0,\nu}L(x,\lambda,\nu),\quad d^\star=\sup_{\lambda\ge0,\nu}\inf_{x\in D}L(x,\lambda,\nu),\quad d^\star\le p^\star.`,
        "details": [
          {
            "title": String.raw`什么时候有saddle pair？`,
            "html": String.raw`<p>最优对达到并且strong duality时，\(L(x^\star,\lambda,\nu)\le L(x^\star,\lambda^\star,\nu^\star)\le L(x,\lambda^\star,\nu^\star)\)，这里 \(x\in D,\lambda\ge0\)，nu自由。固定x是乘子方向的峰，固定乘子是x方向的谷。单纯inf/sup数值相等而不达到，不自动产生这样的点对。</p>`
          }
        ]
      },
      {
        "title": String.raw`非凸却零gap：球面二次型`,
        "body": String.raw`<p>考虑对称A与 \(\min x^TAx,\|x\|^2=1\)。球面不是凸集，但Rayleigh quotient给primal最优值为最小特征值。对偶可以直接验证这个值。</p>`,
        "formula": String.raw`g(\nu)=\begin{cases}-\nu,&A+\nu I\succeq0,\\-\infty,&\text{otherwise},\end{cases}\qquad \nu^\star=-\lambda_{\min}(A).`,
        "example": String.raw`<p>可行域是 \(\nu\ge-\lambda_{\min}(A)\)，最大化-nu就选择最小可行nu。若A=diag(1,4)，圆上目标为 \(1+3\sin^2\theta\)，p*=d*=1。</p>`,
        "pitfall": String.raw`<p>这个反例说明strong duality不蕴含primal convexity，也说明不能把“最大化-nu”误读成“nu越大越好”。</p>`
      },
      {
        "title": String.raw`非凸时，只有bound也很有价值`,
        "body": String.raw`<p>Max-cut使用二值变量 \(x_i\in\{-1,+1\}\)。把条件写成 \(x_i^2=1\)，构造 \(L=x^TQx-\sum_i\lambda_i(x_i^2-1)\)，可以得到一个PSD约束的dual，即使不能保证零gap也能提供证书。</p>`,
        "formula": String.raw`\max_{\lambda\in\mathbb R^n}\sum_i\lambda_i\qquad\text{s.t.}\quad Q-\operatorname{diag}(\lambda)\succeq0.`,
        "details": [
          {
            "title": String.raw`从二值划分到SDP bound`,
            "html": String.raw`<p>内层二次型PSD时inf为trace(diag lambda)，否则负无穷。原约束是等式，因此lambda自由。任意dual feasible点证明 \(x^TQx\ge\sum_i\lambda_i\)。图的cut容量为 \(\frac14\sum_{ij}Q_{ij}(1-x_ix_j)\)，所以这个最小化的下界转成cut最大值的上界；它不声称已经找到最优cut。</p>`
          }
        ]
      }
    ],
    "quiz": [
      {
        "id": String.raw`strong-q1`,
        "q": String.raw`<p>没有找到Slater点，可以推出什么？</p>`,
        "options": [
          String.raw`必定有正duality gap`,
          String.raw`primal必定非凸`,
          String.raw`这条充分条件尚未提供保证，仍可能零gap`
        ],
        "answer": 2,
        "explanation": String.raw`<p>Slater不是必要条件，不可对充分条件取错误逆命题。</p>`
      },
      {
        "id": String.raw`strong-q2`,
        "q": String.raw`<p>球面二次型的dual可行条件是 \(\nu\ge-\lambda_{\min}(A)\)，目标是-nu。最优nu是哪一个？</p>`,
        "options": [
          String.raw`\(-\lambda_{\min}(A)\)`,
          String.raw`\(\lambda_{\max}(A)\)`,
          String.raw`\(+\infty\)`
        ],
        "answer": 0,
        "explanation": String.raw`<p>最大化-nu就选择最小可行nu，得到最小特征值。</p>`
      },
      {
        "id": String.raw`strong-q3`,
        "q": String.raw`<p>Primal LP unbounded below，dual还能有有限可行目标值吗？</p>`,
        "options": [
          String.raw`可以，强对偶可能失败`,
          String.raw`不可以，弱对偶已排除这种情况`
        ],
        "answer": 1,
        "explanation": String.raw`<p>有限dual值会给所有primal目标一个共同下界，与unbounded below矛盾。</p>`
      }
    ],
    "sources": [
      {
        "lecture": 7,
        "page": 16,
        "note": String.raw`strong duality`
      },
      {
        "lecture": 7,
        "page": 17,
        "note": String.raw`Slater与精化`
      },
      {
        "lecture": 7,
        "page": 18,
        "note": String.raw`LP状态`
      },
      {
        "lecture": 8,
        "page": 3,
        "note": String.raw`几何坐标`
      },
      {
        "lecture": 8,
        "page": 4,
        "note": String.raw`epigraph variation`
      },
      {
        "lecture": 8,
        "page": 5,
        "note": String.raw`P(u)凸性`
      },
      {
        "lecture": 8,
        "page": 7,
        "note": String.raw`max–min`
      },
      {
        "lecture": 8,
        "page": 8,
        "note": String.raw`saddle point`
      },
      {
        "lecture": 8,
        "page": 17,
        "note": String.raw`非凸零gap`
      },
      {
        "lecture": 7,
        "page": 12,
        "note": String.raw`max-cut SDP dual`
      }
    ],
    "clips": [
      {
        "file": String.raw`2026-10-06_095854`,
        "start": 5998.3,
        "end": 6260,
        "title": String.raw`Slater与线性约束精化`,
        "note": String.raw`严格可行的充分保证`
      },
      {
        "file": String.raw`2026-10-08_095850`,
        "start": 487.08,
        "end": 885,
        "title": String.raw`LP的三种状态`,
        "note": String.raw`有限最优、无界与不可行`
      },
      {
        "file": String.raw`2026-10-08_095850`,
        "start": 944.14,
        "end": 1540,
        "title": String.raw`约束值与目标值的平面`,
        "note": String.raw`几何解释的坐标与支撑线`
      },
      {
        "file": String.raw`2026-10-13_095736`,
        "start": 1161.61,
        "end": 1330,
        "title": String.raw`非凸也能强对偶`,
        "note": String.raw`球面二次型例子的起点`
      }
    ]
  },
  {
    "id": String.raw`kkt`,
    "title": String.raw`用四组条件定位最优点`,
    "en": String.raw`Complementary slackness & KKT`,
    "group": String.raw`DUALITY`,
    "summary": String.raw`梯度平衡只是一组条件。可行性、符号和互补松弛一起，才把图形直觉变成最优性证书。`,
    "objectives": [
      String.raw`能分别检查四组KKT`,
      String.raw`能解释active与正乘子的单向关系`,
      String.raw`能区分KKT必要性与充分性`,
      String.raw`能推导water-filling及推广`
    ],
    "prereq": [
      String.raw`一阶凸最优条件`,
      String.raw`Lagrangian与strong duality`,
      String.raw`线性约束的法向量`
    ],
    "labs": [
      String.raw`kkt`,
      String.raw`waterfill`
    ],
    "sections": [
      {
        "title": String.raw`互补松弛来自两个不等式取等`,
        "body": String.raw`<p>假设最优primal/dual点达到且strong duality成立。弱对偶链的开头和结尾相等，中间两步只能都取等：x*最小化固定最优乘子下的L，每个不等式贡献的非正项都为零。</p>`,
        "formula": String.raw`f_0(x^\star)=g(\lambda^\star,\nu^\star)\le L(x^\star,\lambda^\star,\nu^\star)\le f_0(x^\star),\qquad\lambda_i^\star f_i(x^\star)=0.`
      },
      {
        "title": String.raw`松弛的约束没有边界压力`,
        "body": String.raw`<p>严格松弛的约束乘子为零，正乘子则一定对应active constraint。但刚好在边界的约束，也可能有零乘子。</p>`,
        "formula": String.raw`f_i(x^\star)<0\Rightarrow\lambda_i^\star=0,\qquad\lambda_i^\star>0\Rightarrow f_i(x^\star)=0.`,
        "example": String.raw`<p>\(\min x^2,\ x\le0\) 的最优点x*=0，约束active，但stationarity给lambda*=0。两个因子可以同时为零。</p>`
      },
      {
        "title": String.raw`四组KKT，各自负责一件事`,
        "body": String.raw`<p>Primal feasibility把点放进可行域；dual feasibility保证下界方向；complementarity选择哪些边界能参与作用；stationarity让它们的法向量与目标梯度平衡。</p>`,
        "formula": String.raw`\begin{aligned}f_i(x)&\le0,\quad h_j(x)=0,\\\lambda_i&\ge0,\\\lambda_i f_i(x)&=0,\\\nabla f_0(x)+\sum_i\lambda_i\nabla f_i(x)+\sum_j\nu_j\nabla h_j(x)&=0.\end{aligned}`,
        "pitfall": String.raw`<p>只解stationarity而忽略其它三组，会留下不可行点或负乘子。原始定义域也必须满足。</p>`
      },
      {
        "title": String.raw`必要性与充分性不要混在一起`,
        "body": String.raw`<p>一般可微问题若有达到的最优对、strong duality及相应内部可微条件，最优对满足KKT。对凸标准形，反过来KKT本身就足够：L凸，stationarity找到全局最小，再用其它三组条件得到零gap。</p>`,
        "formula": String.raw`\text{convex + KKT}\Longrightarrow\text{primal/dual optimal and zero gap}.`,
        "details": [
          {
            "title": String.raw`Slater补上什么？`,
            "html": String.raw`<p>常见可微凸标准形与有限最优情形下，Slater保证强对偶及合适最优乘子，使KKT成为必要且充分条件。非凸时，KKT通常只是候选点条件。</p>`
          }
        ]
      },
      {
        "title": String.raw`LP为什么有两组互补松弛`,
        "body": String.raw`<p>对canonical primal \(\min c^Tx,\ Ax\ge b,x\ge0\)，dual是 \(\max b^Ty,\ A^Ty\le c,y\ge0\)。一组把y乘primal slack，另一组把x乘dual slack。结合两边可行性，这两组条件等价于最优性。</p>`,
        "formula": String.raw`y_i(b_i-(Ax)_i)=0,\qquad x_j(c_j-(A^Ty)_j)=0.`,
        "details": [
          {
            "title": String.raw`充分性的一行证明`,
            "html": String.raw`<p>第一组给 \(b^Ty=y^TAx\)，第二组给 \(c^Tx=x^TA^Ty\)。两边目标相等，再用弱对偶就知两边最优。可行性不能省略，否则全零的乘积没有这种含义。</p>`
          }
        ]
      },
      {
        "title": String.raw`直线怎样挡住一个椭圆`,
        "body": String.raw`<p>讲义例为 \(\min x_1^2+2x_2^2,\ x_1+x_2\ge3\)。写 \(f_1=3-x_1-x_2\)，stationarity给 \(2x_1=\lambda,4x_2=\lambda\)。Inactive分支lambda=0给原点，却不可行，因此使用active分支。</p>`,
        "formula": String.raw`x^\star=(2,1),\qquad\lambda^\star=4,\qquad p^\star=6.`,
        "example": String.raw`<p>右侧推广为s：s>0时 \(x^\star=(2s/3,s/3),\lambda^\star=4s/3\)；s≤0时原点最优、lambda=0。s=0再次说明active不必有正乘子。观察等高椭圆、约束线与两根相反的梯度箭头。</p>`
      },
      {
        "title": String.raw`Water-filling：先写L，再认出水位`,
        "body": String.raw`<p>最小化 \(-\sum_i\log(1+p_i/N_i)\)，其中噪声 \(N_i>0\)，约束 \(\sum_i p_i\le P,p_i\ge0\)。lambda对总预算，mu_i对-p_i。正功率通道mu_i=0，于是stationarity给出共同水位。</p>`,
        "formula": String.raw`-\frac1{p_i+N_i}+\lambda-\mu_i=0,\qquad p_i=\left(\frac1\lambda-N_i\right)_+,\qquad\sum_i p_i=P.`,
        "details": [
          {
            "title": String.raw`高桶底为什么分不到水？`,
            "html": String.raw`<p>p_i=0时，\(\mu_i=\lambda-1/N_i\ge0\)，即水位 \(1/\lambda\le N_i\)。功率是水柱高度“水位减桶底”，不是水位的绝对高度。</p>`
          }
        ],
        "example": String.raw`<p>N=(1,2,4)、P=3时，水位3、功率(2,1,0)、lambda=1/3。第三个通道mu=1/12，恰好补足stationarity。</p>`
      },
      {
        "title": String.raw`推广：等化边际代价`,
        "body": String.raw`<p>若目标可分离为 \(\sum_i\phi_i(p_i)\)，每项凸且递减，导数严格递增并可逆，就能把正分配通道的边际代价调到共同水平。未使用通道满足阈值不等式。</p>`,
        "formula": String.raw`p_i>0:\ \phi_i'(p_i)=-\lambda,\qquad p_i=0:\ \phi_i'(0)+\lambda\ge0.`,
        "details": [
          {
            "title": String.raw`推广公式与边界`,
            "html": String.raw`<p>当 \(\lambda<-\phi_i'(0)\) 时用 \(p_i=(\phi_i')^{-1}(-\lambda)\)，否则用0。有耦合项、导数不可逆或目标不递减时，不能硬套逐通道公式。P=0时primal全零，最优lambda可能不唯一。</p>`
          }
        ],
        "pitfall": String.raw`<p>水桶图帮助理解，KKT才是证书。总预算、符号、stationarity与互补松弛仍须逐项核对。</p>`
      }
    ],
    "quiz": [
      {
        "id": String.raw`kkt-q1`,
        "q": String.raw`<p>\(f_i(x^\star)=0\) 能推出 \(\lambda_i^\star>0\) 吗？</p>`,
        "options": [
          String.raw`能，因为约束active`,
          String.raw`不能，两个因子可以同时为零`
        ],
        "answer": 1,
        "explanation": String.raw`<p>互补松弛是乘积为零，并没有排除两个因子都零。</p>`
      },
      {
        "id": String.raw`kkt-q2`,
        "q": String.raw`<p>凸可微标准形中，已找到满足四组KKT的点，还需先证明Slater才能知道它最优吗？</p>`,
        "options": [
          String.raw`需要，否则KKT毫无用处`,
          String.raw`不需要；凸性下KKT已充分，Slater帮助必要性和乘子存在`
        ],
        "answer": 1,
        "explanation": String.raw`<p>凸L在stationarity点达到全局最小，其它三组条件构成零gap证书。</p>`
      },
      {
        "id": String.raw`kkt-q3`,
        "q": String.raw`<p>已知水位w，噪声 \(N_i>w\) 的通道分配多少功率？</p>`,
        "options": [
          String.raw`0`,
          String.raw`w`,
          String.raw`\(N_i-w\)`
        ],
        "answer": 0,
        "explanation": String.raw`<p>功率是 \((w-N_i)_+\)。非负约束的乘子平衡未使用通道的stationarity。</p>`
      }
    ],
    "sources": [
      {
        "lecture": 9,
        "page": 3,
        "note": String.raw`一般互补松弛`
      },
      {
        "lecture": 9,
        "page": 4,
        "note": String.raw`LP两组互补松弛`
      },
      {
        "lecture": 9,
        "page": 7,
        "note": String.raw`四组KKT`
      },
      {
        "lecture": 9,
        "page": 9,
        "note": String.raw`凸充分性`
      },
      {
        "lecture": 9,
        "page": 10,
        "note": String.raw`Slater下必要充分`
      },
      {
        "lecture": 9,
        "page": 12,
        "note": String.raw`二维椭圆例`
      },
      {
        "lecture": 9,
        "page": 14,
        "note": String.raw`water-filling KKT`
      },
      {
        "lecture": 9,
        "page": 15,
        "note": String.raw`正部公式`
      },
      {
        "lecture": 9,
        "page": 16,
        "note": String.raw`一般资源分配`
      },
      {
        "lecture": 9,
        "page": 17,
        "note": String.raw`阈值与逆导数`
      }
    ],
    "clips": [
      {
        "file": String.raw`2026-10-13_095736`,
        "start": 2462.04,
        "end": 2750,
        "title": String.raw`从零gap推互补松弛`,
        "note": String.raw`理解乘积为零的来源`
      },
      {
        "file": String.raw`2026-10-13_095736`,
        "start": 4597.98,
        "end": 4895,
        "title": String.raw`四组KKT`,
        "note": String.raw`分别负责可行性、符号、松弛与梯度`
      },
      {
        "file": String.raw`2026-10-20_095741`,
        "start": 565.3,
        "end": 1020,
        "title": String.raw`资源分配的KKT`,
        "note": String.raw`从目标与约束写出stationarity`
      },
      {
        "file": String.raw`2026-10-20_095741`,
        "start": 1740.07,
        "end": 2070,
        "title": String.raw`老师画出的倒水直觉`,
        "note": String.raw`水位、桶底与active channels`
      }
    ]
  }
,
{
    "id": String.raw`sensitivity`,
    "title": String.raw`把乘子读成变化率与策略`,
    "en": String.raw`Sensitivity, recovery & minimax`,
    "group": String.raw`DUALITY`,
    "summary": String.raw`乘子不只是解方程的辅助变量：它给出约束变化的价格，也把两人零和博弈连接到一对LP。`,
    "objectives": [
      String.raw`能用最优乘子构造扰动后的全局下界`,
      String.raw`能解释局部导数的负号`,
      String.raw`能区分取inf得到的点与primal最优点`,
      String.raw`能把零和博弈写成两个dual LP`
    ],
    "prereq": [
      String.raw`strong duality与最优乘子`,
      String.raw`一阶支撑下界`,
      String.raw`概率向量与线性规划`
    ],
    "labs": [
      String.raw`sensitivity`
    ],
    "sections": [
      {
        "title": String.raw`允许一点约束变化`,
        "body": String.raw`<p>把原约束从 \(f_i(x)\le0,h_j(x)=0\) 改成 \(f_i(x)\le u_i,h_j(x)=v_j\)，记最优值为 \(p^\star(u,v)\)。正的u意味着放松不等式，因此最小化问题的最优值不能因此变大。</p>`,
        "formula": String.raw`g_{u,v}(\lambda,\nu)=g(\lambda,\nu)-u^T\lambda-v^T\nu.`,
        "example": String.raw`<p>总预算从P变成P+u，就对应预算不等式右侧放松u。这里的正负号来自约束写法；如果把扰动写到左边，解释也要跟着改变。</p>`
      },
      {
        "title": String.raw`不用重新求最优，也能给一个全局bound`,
        "body": String.raw`<p>假设原问题有有限最优值、strong duality及最优乘子。把原来的最优乘子代入扰动问题的dual，仍然给出下界。这条界对任意扰动都成立，不是只在附近有效的近似。</p>`,
        "formula": String.raw`p^\star(u,v)\ge p^\star(0,0)-(\lambda^\star)^Tu-(\nu^\star)^Tv.`,
        "details": [
          {
            "title": String.raw`从哪里来？`,
            "html": String.raw`<p>扰动问题的弱对偶给 \(p^\star(u,v)\ge g(\lambda^\star,\nu^\star)-u^T\lambda^\star-v^T\nu^\star\)，原问题强对偶再把g替换成 \(p^\star(0,0)\)。若扰动后不可行，最优值是正无穷，这条下界仍不矛盾。</p>`
          }
        ]
      },
      {
        "title": String.raw`局部可微时，乘子就是导数的负号`,
        "body": String.raw`<p>如果值函数在原点可微，上面的支撑面斜率就等于梯度。较大的不等式乘子表示：轻微放松这条约束，最优成本有较大的下降速率。</p>`,
        "formula": String.raw`\frac{\partial p^\star}{\partial u_i}(0,0)=-\lambda_i^\star,\qquad \frac{\partial p^\star}{\partial v_j}(0,0)=-\nu_j^\star.`,
        "pitfall": String.raw`<p>等式乘子可正可负。值函数若有折角，就不能硬说“普通导数存在”；此时乘子给出支撑斜率或subgradient信息。全局bound和局部线性近似也不是同一句话。</p>`
      },
      {
        "title": String.raw`一维例子把价格画出来`,
        "body": String.raw`<p>对 \(\min\frac12(x-c)^2,\ x\le b\)，无约束最优点是c。若b挡在c左侧，最优点被压到边界；若b在c右侧，约束没有作用。</p>`,
        "formula": String.raw`x^\star=\min(c,b),\qquad \lambda^\star=(c-b)_+,\qquad p^\star(b)=\frac12(c-b)_+^2,\qquad\frac{dp^\star}{db}=-\lambda^\star.`,
        "example": String.raw`<p>例如c=2、b=1，lambda*=1。把b轻微增加0.01，最优值约下降0.01；但完整变化仍是二次曲线。把实验中的b滑过c，观察constraint由active转为inactive、价格降到0。</p>`
      },
      {
        "title": String.raw`恢复primal：内层最小点还需要一张通行证`,
        "body": String.raw`<p>Dual optimal multipliers能帮助恢复primal，但 \(\arg\min_xL(x,\lambda^\star,\nu^\star)\) 可能有多个点。必须进一步检查primal feasibility与complementary slackness。仅仅“它最小化了L”不够。</p>`,
        "example": String.raw`<p>\(\min -x,\ x\le0\) 的最优lambda为1，此时L恒等于0，所以每个x都最小化L。选择x=-1虽然可行，但目标为1，并不最优；它违反互补松弛 \(\lambda x=0\)。</p>`,
        "pitfall": String.raw`<p>不要把“从dual恢复primal”简化成一次求梯度为零。恢复的最后一步仍然是最优性条件检查。</p>`
      },
      {
        "title": String.raw`用dual解析求最小范数解`,
        "body": String.raw`<p>讲义用 \(\min\|x\|^2,\ Ax=b\) 展示对偶的解析价值。固定等式乘子，内层是一个简单二次型；再最大化dual，就能把满足等式的最短向量写出来。</p>`,
        "formula": String.raw`g(\nu)=-\frac14\nu^TAA^T\nu-b^T\nu,\qquad x^\star=A^T(AA^T)^{-1}b.`,
        "formulaCaption": String.raw`普通逆公式要求A满行秩；否则需可行性检查与伪逆等处理。`,
        "details": [
          {
            "title": String.raw`推导路线`,
            "html": String.raw`<p>Stationarity给 \(x=-A^T\nu/2\)。若A满行秩，dual stationarity给 \(\nu^\star=-2(AA^T)^{-1}b\)，代回得到x*。最后检查Ax*=b，而不是只停留在乘子公式。</p>`
          }
        ]
      },
      {
        "title": String.raw`零和博弈：把动作变成概率`,
        "body": String.raw`<p>矩阵P的元素是行玩家x付给列玩家y的金额。混合策略u、v是概率向量，因此预期付款为 \(u^TPv\)。付款方希望小，收款方希望大；这是zero-sum结构。</p>`,
        "formula": String.raw`u\ge0,\ \mathbf1^Tu=1,\qquad v\ge0,\ \mathbf1^Tv=1,\qquad f(u,v)=u^TPv.`,
        "example": String.raw`<p>匹配硬币 \(P=\begin{pmatrix}1&-1\\-1&1\end{pmatrix}\)，取 \(u=(r,1-r),v=(s,1-s)\)，期望付款为 \((2r-1)(2s-1)\)。双方各用一半概率，value为0。</p>`
      },
      {
        "title": String.raw`两个行动顺序，得到两个LP`,
        "body": String.raw`<p>付款方先给定u，收款方会挑使 \(P^Tu\) 最大的列。因此付款方最小化这组数中的最大值。反过来，收款方先给定v，付款方会挑使Pv最小的行，于是收款方最大化这组数中的最小值。</p>`,
        "formula": String.raw`\begin{array}{ll}\min_{u,t}t& P^Tu\le t\mathbf1,\ \mathbf1^Tu=1,\ u\ge0,\\[2pt]\max_{v,s}s& Pv\ge s\mathbf1,\ \mathbf1^Tv=1,\ v\ge0.\end{array}`,
        "details": [
          {
            "title": String.raw`LP duality给出minimax与Nash`,
            "html": String.raw`<p>这两个LP互为dual，在这里有相同最优值。最优策略满足 \(f(u^\star,v)\le f(u^\star,v^\star)\le f(u,v^\star)\)，构成saddle point与混合策略Nash equilibrium。</p>`
          }
        ],
        "pitfall": String.raw`<p>“没有后行动优势”指提交混合分布的这个模型，不是说在看到了对方一次实际抽样的动作之后也没有优势。</p>`
      }
    ],
    "quiz": [
      {
        "id": String.raw`sensitivity-q1`,
        "q": String.raw`<p>约束写成 \(f_i(x)\le u_i\)。值函数可微时，\(\partial p^\star/\partial u_i\) 是多少？</p>`,
        "options": [
          String.raw`\(\lambda_i^\star\)`,
          String.raw`\(-\lambda_i^\star\)`,
          String.raw`总是0`
        ],
        "answer": 1,
        "explanation": String.raw`<p>正u放松约束，最小成本不能增加，所以变化率是非正的-lambda。符号要从扰动写法推导。</p>`
      },
      {
        "id": String.raw`sensitivity-q2`,
        "q": String.raw`<p>某点最小化了最优乘子下的L，而且primal feasible。是否必定primal optimal？</p>`,
        "options": [
          String.raw`必定，因为已经使用最优乘子`,
          String.raw`不一定，还必须检查互补松弛等最优性条件`
        ],
        "answer": 1,
        "explanation": String.raw`<p>\(\min -x,x\le0\) 在lambda=1时L恒为0，x=-1就是可行但非最优的内层最小点。</p>`
      },
      {
        "id": String.raw`sensitivity-q3`,
        "q": String.raw`<p>零和博弈中，为什么两个混合策略LP有相同value？</p>`,
        "options": [
          String.raw`因为所有payoff matrix都对称`,
          String.raw`因为两个LP互为dual并满足这里的强对偶条件`,
          String.raw`因为两个玩家只能取相同策略`
        ],
        "answer": 1,
        "explanation": String.raw`<p>关键是LP duality。P可以不对称，行列玩家的策略空间维数也可以不同。</p>`
      }
    ],
    "sources": [
      {
        "lecture": 8,
        "page": 6,
        "note": String.raw`扰动问题、全局bound与局部sensitivity`
      },
      {
        "lecture": 8,
        "page": 8,
        "note": String.raw`saddle-point不等式`
      },
      {
        "lecture": 8,
        "page": 9,
        "note": String.raw`payoff与混合策略`
      },
      {
        "lecture": 8,
        "page": 10,
        "note": String.raw`付款方LP`
      },
      {
        "lecture": 8,
        "page": 11,
        "note": String.raw`收款方LP`
      },
      {
        "lecture": 8,
        "page": 12,
        "note": String.raw`LP duality与minimax`
      },
      {
        "lecture": 8,
        "page": 13,
        "note": String.raw`Nash equilibrium`
      },
      {
        "lecture": 8,
        "page": 14,
        "note": String.raw`最小范数解析解`
      },
      {
        "lecture": 9,
        "page": 3,
        "note": String.raw`恢复primal还须互补松弛`
      }
    ],
    "clips": [
      {
        "file": String.raw`2026-10-08_095850`,
        "start": 3073.34,
        "end": 3445,
        "title": String.raw`敏感度的负号来自哪里`,
        "note": String.raw`扰动问题与最优乘子的解释`
      },
      {
        "file": String.raw`2026-10-08_095850`,
        "start": 5115.11,
        "end": 5515,
        "title": String.raw`零和博弈与混合策略`,
        "note": String.raw`把payoff矩阵写成概率下的期望`
      },
      {
        "file": String.raw`2026-10-13_095736`,
        "start": 254.52,
        "end": 690,
        "title": String.raw`对偶的解析用途`,
        "note": String.raw`最小范数等式约束解的推导起点`
      }
    ]
  },
{
    "id": String.raw`cone-duality`,
    "title": String.raw`让对偶适应矩阵、熵与改写`,
    "en": String.raw`Reformulation, cones & certificates`,
    "group": String.raw`DUALITY`,
    "summary": String.raw`等价primal不一定给同样的dual。学会保留部分约束、使用dual cone与trace内积，再把这些工具连接到logdet、几何平均、熵和box证书。`,
    "objectives": [
      String.raw`能解释primal改写为何改变dual形式`,
      String.raw`能区分全部松弛与partial relaxation`,
      String.raw`能用dual cone和trace内积处理SDP`,
      String.raw`能检查logdet内层的正定有效域`,
      String.raw`能连接熵、逐点inf和box lower-bound模板`
    ],
    "prereq": [
      String.raw`conjugate与有效定义域`,
      String.raw`PSD、PD与trace`,
      String.raw`KKT与弱强对偶`
    ],
    "labs": [
      String.raw`entropy`,
      String.raw`geomean`,
      String.raw`certificate`
    ],
    "sections": [
      {
        "title": String.raw`Recap：矩阵不等式不是逐元素比较`,
        "body": String.raw`<p>对称矩阵M为PSD，是说所有方向的二次型非负，等价于所有特征值非负。矩阵不等式 \(A\preceq B\) 表示B-A为PSD。它与“每个元素非负”是不同的关系。</p>`,
        "formula": String.raw`M\succeq0\iff v^TMv\ge0\ \forall v\iff\lambda_{\min}(M)\ge0,\qquad \langle A,B\rangle=\operatorname{tr}(AB).`,
        "example": String.raw`<p>\(M(t)=\begin{pmatrix}1&t\\t&1\end{pmatrix}\) 的特征值为1±t：|t|≤1时PSD，|t|<1时PD。t=±1时奇异，不能再计算普通inverse与有限logdet。</p>`
      },
      {
        "title": String.raw`等价primal，为什么会给出不同dual？`,
        "body": String.raw`<p>没有显式约束的 \(\min f_0(Ax+b)\)，dual只是一个常数inf，虽然形式上零gap，却没有简化计算。引入y和等式 \(Ax+b-y=0\) 后，x和y的作用分开，便能用conjugate消去y。</p>`,
        "formula": String.raw`\min_{x,y} f_0(y)\ \text{s.t.}\ Ax+b-y=0\quad\leadsto\quad \max_\nu b^T\nu-f_0^\star(\nu)\ \text{s.t.}\ A^T\nu=0.`,
        "pitfall": String.raw`<p>等价指最优原变量可相互转换，不表示新旧dual必须长得一样。改写的目的可能是让dual更易算、更有结构。</p>`
      },
      {
        "title": String.raw`Norm residual：共轭把norm变成unit ball`,
        "body": String.raw`<p>把 \(\min\|Ax-b\|\) 改成 \(\min\|y\|,\ y=Ax-b\)。Norm的conjugate是dual-norm unit ball的indicator：球内为0，球外为正无穷。因此有限域本身变成dual约束。</p>`,
        "formula": String.raw`\max_\nu b^T\nu\qquad\text{s.t.}\quad A^T\nu=0,\quad\|\nu\|_\ast\le1.`,
        "details": [
          {
            "title": String.raw`为什么会出现dual norm？`,
            "html": String.raw`<p>若 \(\|\nu\|_\ast\le1\)，有 \(\nu^Ty\ge-\|y\|\)，所以 \(\inf_y(\|y\|+\nu^Ty)=0\)。若在球外，就有某个方向让线性项下降得比norm增长更快，inf变为负无穷。</p>`
          }
        ]
      },
      {
        "title": String.raw`变换目标保留点，却会改变值和dual`,
        "body": String.raw`<p>Residual norm为非负数，因此把它换成严格递增的平方函数，保留最优x，但改变最优值和dual。Euclidean norm的平方版，dual中出现二次项，不再是unit-ball约束。</p>`,
        "formula": String.raw`\min_x\frac12\|Ax-b\|_2^2\quad\leadsto\quad\max_\nu b^T\nu-\frac12\|\nu\|_2^2\ \text{s.t.}\ A^T\nu=0.`,
        "pitfall": String.raw`<p>“同一个最优x”不代表“同一个最优值”，更不意味着可以把两个dual的约束与目标混用。</p>`
      },
      {
        "title": String.raw`保留box约束，直接在盒子里取inf`,
        "body": String.raw`<p>对 \(\min c^Tx,\ Ax=b,-1\le x\le1\)，可以把box当作内层domain，而只给等式乘子。这避免为每条box边界增加新变量，也让内层变成逐坐标挑盒子端点。</p>`,
        "formula": String.raw`g(\nu)=\inf_{-1\le x\le1}(c+A^T\nu)^Tx-b^T\nu=-\|c+A^T\nu\|_1-b^T\nu.`,
        "example": String.raw`<p>一个坐标的系数为正，就挑x_i=-1；系数为负，就挑x_i=1。这解释了绝对值与负的一范数。</p>`
      },
      {
        "title": String.raw`Partial relaxation：没松弛的约束要留下`,
        "body": String.raw`<p>若只把f1加进L，把f2继续作为内层约束，就得到partial Lagrangian relaxation。它给出不同结构的dual；凸性与合适Slater条件下，partial dual也可以保留相同最优值。</p>`,
        "formula": String.raw`\widetilde L(x,\lambda)=f_0(x)+\lambda f_1(x),\qquad \widetilde g(\lambda)=\inf_{x:\,f_2(x)\le0}\widetilde L(x,\lambda).`,
        "pitfall": String.raw`<p>未松弛不等于删掉。把内层约束f2也丢掉，计算的就不是这个partial dual。</p>`,
        "details": [
          {
            "title": String.raw`讲义的网络流例子`,
            "html": String.raw`<p>保留流守恒与边容量，只松弛每个节点的流入/流出预算。这样内层仍是结构清晰的min-cost-flow问题，而外层只调节点价格。这是之后primal–dual算法的一个基础想法。</p>`
          }
        ]
      },
      {
        "title": String.raw`从非负乘子推广到dual cone`,
        "body": String.raw`<p>广义不等式 \(f_i(x)\preceq_{K_i}0\) 表示 \(-f_i(x)\in K_i\)。现在约束值可以是向量，乘子也在对应维数。为了保持lower-bound方向，乘子必须属于dual cone。</p>`,
        "formula": String.raw`K^\ast=\{z:\langle z,y\rangle\ge0\ \forall y\in K\},\qquad L=f_0+\sum_i\langle\lambda_i,f_i(x)\rangle+\sum_j\nu_jh_j(x),\quad\lambda_i\in K_i^\ast.`,
        "details": [
          {
            "title": String.raw`弱对偶的同一条逻辑`,
              "html": String.raw`<p>Primal feasible意味着 \(-f_i(x)\in K_i\)，dual feasible意味着与它的内积非负，所以 \(\langle\lambda_i,f_i(x)\rangle\le0\)。弱对偶不需要凸性。若目标凸、约束函数具有相应的锥凸性、等式affine，再以严格锥内点检查Slater，可以得到相应强对偶结论。广义complementary slackness是内积为零。</p>`
          }
        ]
      },
      {
        "title": String.raw`SDP dual：先看x的线性系数`,
        "body": String.raw`<p>PSD cone是self-dual，因此矩阵约束的乘子Z也是PSD。对 \(\min c^Tx,\ \sum_i x_iF_i\preceq G\)，L使用trace内积。内层x自由，仍然通过“线性系数必须为零”找到有效域。</p>`,
        "formula": String.raw`L=-\operatorname{tr}(GZ)+\sum_i x_i\bigl(c_i+\operatorname{tr}(F_iZ)\bigr),\quad \max_Z-\operatorname{tr}(GZ)\ \text{s.t.}\ Z\succeq0,\ c_i+\operatorname{tr}(F_iZ)=0.`,
        "pitfall": String.raw`<p>广义互补松弛是 \(\langle Z,\sum_i x_iF_i-G\rangle=0\)，不是逐元素相乘等于零。严格可行意味着 \(G-\sum_i x_iF_i\succ0\)。</p>`
      },
      {
        "title": String.raw`Logdet模板：为什么有效域必须PD`,
        "body": String.raw`<p>在 \(X\succ0\) 上，考虑内层 \(-\log\det X+\operatorname{tr}(SX)\)。Stationarity给S=X的逆。但还必须检查非PD的S：若S有负特征方向，线性项能无界下降；若S只是PSD却奇异，沿零特征方向增大X，会让负logdet趋向负无穷。</p>`,
        "formula": String.raw`\inf_{X\succ0}\{-\log\det X+\operatorname{tr}(SX)\}=\begin{cases}\log\det S+n,&S\succ0,\\-\infty,&\text{otherwise.}\end{cases}`,
        "example": String.raw`<p>矩阵约束 \(A_i^TXA_i\preceq B_i\) 对应 \(Z_i\succeq0\)，收集后 \(S=\sum_iA_iZ_iA_i^T\)。注意S是n×n，Z_i是k_i×k_i。常数项通过trace循环换位整理，正定定义域不能省略。</p>`,
        "details": [
          {"title": String.raw`把正定性放回Slater检查`, "html": String.raw`<p>若每个 \(B_i\succ0\)，取 \(X=\varepsilon I\)，让正的epsilon充分小，就能让所有 \(\varepsilon A_i^TA_i\prec B_i\)。这是有限多条矩阵不等式，因此可以统一选择一个epsilon。若再有 \(\sum_iA_iA_i^T\succ0\)，选择 \(Z_i=I\) 就能让S正定，得到一个有限dual lower bound。一个有限primal值加一个有限dual下界，也排除了最优值向两端无穷逸出。</p>`},
          {"title": String.raw`如何证明-logdet凸`, "html": String.raw`<p>在正定域中，沿对称方向H的二阶方向导数为 \(\operatorname{tr}(X^{-1}HX^{-1}H)\ge0\)。也可写成 \(\operatorname{tr}((X^{-1/2}HX^{-1/2})^2)\)，其值是对称矩阵特征值平方之和。矩阵约束对X为affine，再结合严格可行性，才构成strong duality的完整条件检查。</p>`}
        ]
      },
      {
        "title": String.raw`熵与normalization：从指数到softmax`,
        "body": String.raw`<p>加权熵 \(x\log(x/y)\) 的导数为 \(\log(x/y)+1\)。加上一个线性系数c之后，最小点为 \(y e^{-c-1}\)，这解释了熵约束问题为何出现指数。再消掉“各分量和为1”的等式乘子，就会出现log-sum-exp与normalized exponential。</p>`,
        "formula": String.raw`\inf_{x>0}\left\{x\log\frac xy+cx\right\}=-y e^{-c-1},\qquad p_k(z)=\frac{y_ke^{a_k^Tz}}{\sum_jy_je^{a_j^Tz}}.`,
        "details": [
          {
            "title": String.raw`概率归一化不等于所有primal约束都满足`,
            "html": String.raw`<p>p(z)总是正数且分量和为1，但通常 \(Ap(z)\ne b\)。对于 \(g(z)=b^Tz-\log\sum_ky_ke^{a_k^Tz}\)，有 \(\nabla g=b-Ap\)。只有再满足这个stationarity，才得到对应的等式可行性。</p>`
          }
        ],
        "pitfall": String.raw`<p>任意z时，\(f_0(p(z))-g(z)=(Ap(z)-b)^Tz\) 可以为负，不能误标成总是非负的“duality gap”。弱对偶的非负gap要求primal点可行。</p>`
      },
      {
        "title": String.raw`几何平均：点态inf也能证明凹性`,
        "body": String.raw`<p>几何平均可以表示为一族关于x的线性函数的inf。每个固定v给一个线性函数，选择最低的那条形成凹函数。这和dual function的凹性是同一个结构。</p>`,
        "formula": String.raw`G(x)=\inf_{\substack{v>0\\\prod_iv_i=1}}\frac1n v^Tx,\qquad G(x)=\left(\prod_ix_i\right)^{1/n}.`,
        "details": [
          {
            "title": String.raw`推导时变量角色与凸性要小心`,
            "html": String.raw`<p>先固定正参数x，把v视为优化变量。等式 \(\sum_i\log v_i=0\) 非affine，所以原写法并非标准凸规划，不能直接套凸Slater。可以直接计算内层dual、构造达到同值的点来证明表示式。最后选v=1，才由这个表示式推出AM–GM；不要形成循环论证。</p>`
          }
        ],
        "example": String.raw`<p>可以在图中固定多组乘积为1的v，画出这些线性函数；它们的下包络逼近几何平均。改变x，观察每条线仍在线性函数族内。</p>`
      },
      {
        "title": String.raw`Box certificate：构造一个下界，不必求到最优`,
        "body": String.raw`<p>固定x与原不等式乘子lambda≥0，令 \(r=\nabla f_0(x)+\sum_i\lambda_i\nabla f_i(x)\)。为上界x≤u取mu，为下界l≤x取nu，可以用梯度正负部分让L的梯度抵消。由于L凸，这个x就全局最小化了L，得到一个可计算dual值。</p>`,
        "formula": String.raw`\mu=(-r)_+,\qquad\nu=r_+,\qquad r+\mu-\nu=0.`,
        "details": [
          {
            "title": String.raw`中点证书的由来`,
            "html": String.raw`<p>令lambda=0、\(\bar x=(l+u)/2\)，两边box slack都为负的半宽，得到 \(p^\star\ge f_0(\bar x)-((u-l)/2)^T|\nabla f_0(\bar x)|\)。这是weak-duality lower bound，不要求这个乘子点dual optimal。mu、nu也不唯一：给二者加同一非负向量仍维持stationarity。</p>`
          }
        ],
        "pitfall": String.raw`<p>用stationarity计算dual bound时，x本身不一定满足全部primal约束；不要把“计算g用的内层最小点”与“提供upper bound的primal feasible点”混为一谈。</p>`
      }
    ],
    "quiz": [
      {
        "id": String.raw`cone-q1`,
        "q": String.raw`<p>\(\inf_{X\succ0}(-\log\det X+\operatorname{tr}(SX))\) 何时有限？</p>`,
        "options": [
          String.raw`\(S\succeq0\) 即可`,
          String.raw`必须 \(S\succ0\)`,
          String.raw`只要S每个元素非负`
        ],
        "answer": 1,
        "explanation": String.raw`<p>若S有零特征方向，沿该方向增大X，trace项不变而负logdet趋向负无穷。因此PSD还不够。</p>`
      },
      {
        "id": String.raw`cone-q2`,
        "q": String.raw`<p>Partial relaxation没有松弛的约束应该放在哪里？</p>`,
        "options": [
          String.raw`直接删掉`,
          String.raw`保留在内层inf的可行域`,
          String.raw`随意给它一个固定负乘子`
        ],
        "answer": 1,
        "explanation": String.raw`<p>“不松弛”表示仍然强制满足。删掉它会改变所计算的dual function。</p>`
      },
      {
        "id": String.raw`cone-q3`,
        "q": String.raw`<p>Normalized exponential p(z)正且和为1，是否说明它已经是熵问题的primal feasible点？</p>`,
        "options": [
          String.raw`是，概率向量就满足所有约束`,
          String.raw`不一定，还需要 \(Ap(z)=b\)`
        ],
        "answer": 1,
        "explanation": String.raw`<p>Normalization只解决一个等式。其余等式约束由Ap=b表达，也对应reduced dual的stationarity。</p>`
      }
    ],
    "sources": [
      {
        "lecture": 10,
        "page": 3,
        "note": String.raw`等价primal的dual可不同`
      },
      {
        "lecture": 10,
        "page": 4,
        "note": String.raw`引入变量与norm共轭`
      },
      {
        "lecture": 10,
        "page": 5,
        "note": String.raw`隐式box约束`
      },
      {
        "lecture": 10,
        "page": 6,
        "note": String.raw`partial relaxation定义`
      },
      {
        "lecture": 10,
        "page": 7,
        "note": String.raw`partial dual的零gap`
      },
      {
        "lecture": 10,
        "page": 8,
        "note": String.raw`网络流例`
      },
      {
        "lecture": 10,
        "page": 10,
        "note": String.raw`变换目标与平方norm`
      },
      {
        "lecture": 10,
        "page": 11,
        "note": String.raw`generalized inequality与dual cone`
      },
      {
        "lecture": 10,
        "page": 12,
        "note": String.raw`广义对偶性质`
      },
      {
        "lecture": 10,
        "page": 13,
        "note": String.raw`trace内积与SDP dual`
      },
      {
        "lecture": 7,
        "page": 6,
        "note": String.raw`熵的conjugate`
      },
      {
        "lecture": 9,
        "page": 9,
        "note": String.raw`凸stationarity构造证书`
      }
    ],
    "clips": [
      {
        "file": String.raw`2026-10-20_095741`,
        "start": 4054.43,
        "end": 4450,
        "title": String.raw`改写primal，改变dual结构`,
        "note": String.raw`引入变量与等式的用途`
      },
      {
        "file": String.raw`2026-10-20_095741`,
        "start": 5362.01,
        "end": 5665,
        "title": String.raw`Partial Lagrangian relaxation`,
        "note": String.raw`未松弛约束留在内层domain`
      },
      {
        "file": String.raw`2026-10-22_095907`,
        "start": 183.14,
        "end": 540,
        "title": String.raw`广义不等式与dual cone`,
        "note": String.raw`10号讲义末尾延续至这次录音`
      },
      {
        "file": String.raw`2026-10-22_095907`,
        "start": 697.8,
        "end": 1250,
        "title": String.raw`SDP dual与trace内积`,
        "note": String.raw`矩阵乘子、有限域和严格可行`
      }
    ]
  }
];
