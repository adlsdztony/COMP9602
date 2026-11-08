/* Chinese self-study notes, checked against the rendered COMP9602 slides. */
window.PROGRAM_CHAPTERS = [
  {
    id: 'standard', title: '从凸函数到一个凸优化问题', en: 'Standard form & optimality', group: 'MODEL',
    summary: '先学会读一个问题：谁是变量、允许在哪里取值、什么叫可行和最优。再用可行方向理解为什么边界最优点的梯度不必为零。',
    objectives: ['区分 domain、可行集、最优值与最优点', '检查一个写法是否属于标准凸问题', '用线段证明 local optimum ⇒ global optimum', '从可行方向推导三种一阶最优性条件'],
    prereq: ['凸集与线段', '凸函数的一阶支撑不等式', '梯度、内积、矩阵转置'], labs: ['feasible'],
    sections: [
      {
        title: '1 · 函数回答“值是多少”，优化问题回答“哪个输入最好”',
        body: String.raw`<p>此前你研究的是函数 \(f(x)\) 的曲率。现在还要指定：<strong>哪些量可以改变</strong>，以及<strong>哪些输入允许出现</strong>。目标函数给候选方案打分，约束决定候选方案能否参加比较。</p><p>读题时先把三件事分开：decision variable（决策变量）、parameters（已给定参数）、domain（表达式有意义的输入）。同一个符号在不同题中可以换角色。例如 \(x^Tv/n\) 若对 \(v\) 优化，\(x\) 就是固定系数；不能对 \(x\) 求导来寻找这个问题的最优解。</p>`,
        formula: String.raw`\begin{aligned}\operatorname{minimize}_{x\in\mathbb R^n}\quad &f_0(x)\\\operatorname{subject\ to}\quad &f_i(x)\le0,\ i=1,\ldots,m,\\&h_j(x)=0,\ j=1,\ldots,p.\end{aligned}`,
        formulaCaption: '标准形式把不等式统一写到 ≤0；h 不必在一般优化问题中仿射，但标准凸问题会进一步要求。',
        example: String.raw`<p>\(\min_{x>0}-\log x\)，且 \(x\le3\)：变量是 \(x\)，隐式域来自 log，显式可行集为 \((0,3]\)。\(x=0\) 即使满足 \(x\le3\)，也不是候选点。</p>`,
        pitfall: String.raw`<p>把 \(x>0\) 当作可忽略的“旁注”会破坏对偶函数的定义。之后取 \(\inf_x L\) 时，仍须在原函数的共同定义域内取 inf。</p>`
      },
      {
        title: '2 · feasible、optimal value、optimizer 是三件事',
        body: String.raw`<p>可行点既在共同定义域里，也满足全部约束。可行并不意味着目标小；最优点则是目标恰好达到最优值的可行点。最优值本质上是所有可行目标值的<strong>下确界</strong>，因此课件用 inf，而不是一律用 min。</p><p>有时“能无限靠近最好”却“没有最好那个点”。此时最优值存在，但 optimizer 不存在。要先弄清这一区别，再谈求解器或一阶条件。</p>`,
        formula: String.raw`p^*=\inf_{x\in C} f_0(x),\qquad x^*\in C,\ f_0(x^*)=p^*\ \Longrightarrow\ x^*\text{ is optimal}.`,
        example: String.raw`<ul><li>\(\min_{x>0}1/x\)：\(p^*=0\)，但没有有限的 \(x\) 达到 0。</li><li>约束 \(x\le0\) 与 \(x\ge1\) 同时出现：可行集为空，按约定 \(p^*=+\infty\)。</li><li>\(\min_{x\in\mathbb R}x\)：可行但向下无界，\(p^*=-\infty\)。</li></ul>`,
        details: [{ title: '局部最优到底比较哪些点？', html: String.raw`<p>存在一个半径 \(R>0\)，使得 \(x^*\) 的 \(R\)-邻域内<strong>所有可行点</strong>都不能改善目标。边界外不可行的点，即使目标更小，也不能用来否定局部最优。</p>` }]
      },
      {
        title: '3 · 标准化是记账：统一符号，别偷偷改变问题',
        body: String.raw`<p>最大化 \(r(x)\) 可以改成最小化 \(-r(x)\)。约束 \(a^Tx\ge b\) 可以改成 \(b-a^Tx\le0\)。等式可写成一个函数等于零。标准化不增加知识，却能让你在写 Lagrangian 时避免符号混乱。</p><p><strong>Feasibility problem</strong> 只问是否存在满足约束的点；把目标设成常数 0，便可放进同一优化框架。可行时所有可行点同样好，不可行时最优值按约定是正无穷。</p>`,
        formula: String.raw`\text{find }x\in C\quad\Longleftrightarrow\quad\operatorname{minimize}_{x\in C}0.`,
        example: String.raw`<p>“收益至少 5，成本最多 8”可记成 \(5-r(x)\le0\)、\(c(x)-8\le0\)。每个不等式的方向都决定了后续非负乘子应乘哪一项。</p>`,
        pitfall: String.raw`<p>最大化 \(r\) 与最小化 \(-r\) 的 optimizer 相同，但 optimal value 相差一个负号。不能在转换后继续把两者的数值混用。</p>`
      },
      {
        title: '4 · “凸问题”检查的是整套结构',
        body: String.raw`<p>标准凸优化要求：最小化凸函数，不等式左侧为凸函数，等式为仿射函数，共同定义域为凸集。原因很直观：凸函数的 sublevel set 是凸的；仿射等式给出仿射集；这些集合相交后仍是凸集。</p><p>注意方向：\(f_i(x)\le0\) 中的 \(f_i\) 要凸。如果某个凹函数被要求大于等于 0，先乘负号也可以得到凸不等式。</p>`,
        formula: String.raw`\begin{gathered}f_0,f_1,\ldots,f_m\text{ convex},\qquad h(x)=Ax-b,\\C=\{x\in D:f_i(x)\le0,\ Ax=b\}\text{ is convex}.\end{gathered}`,
        example: String.raw`<p>\(x_1^2+x_2^2\le1\) 是凸约束；\(x_1^2+x_2^2=1\) 的可行集是圆周，一般不凸。两个对径可行点的中点不在圆周上。</p>`,
        details: [{ title: '矩阵不等式也能保留凸性', html: String.raw`<p>仿射矩阵函数 \(M(x)\preceq0\) 的可行集也凸，因为负半定锥是凸锥。这里的 \(\preceq\) 是谱意义的矩阵序，而不是逐个元素比较；后面的 SDP 章节会专门展开。</p>` }],
        pitfall: String.raw`<p>“函数是凸的”并不意味着“把它放到任何位置都得到凸问题”。最大化凸函数、把非仿射凸函数设成等式，通常都会离开标准凸结构。</p>`
      },
      {
        title: '5 · 为什么局部最优不再是陷阱',
        body: String.raw`<p>设凸问题有一个局部最优点 \(x\)，却又存在更好的可行点 \(y\)。把 \(y\) 拉向 \(x\)：\(z=(1-\theta)x+\theta y\)。凸可行集保证整条线段可行；凸目标保证线段上的目标不高于端点目标的加权平均。</p><p>只要 \(\theta>0\)，这个平均就比 \(f_0(x)\) 小；同时可以让 \(\theta\) 足够小，使 \(z\) 任意靠近 \(x\)。这直接违背“附近没有更好可行点”。</p>`,
        formula: String.raw`f_0(z)\le(1-\theta)f_0(x)+\theta f_0(y)<f_0(x),\qquad 0<\theta\ll1.`,
        example: String.raw`<p>把一只碗截在一个凸区域上，不会凭空产生另一个坏的局部谷底。但如果区域被挖成两个不连通的岛，即使目标仍然是同一只碗，局部可行最优也可能不再全局最好。</p>`,
        pitfall: String.raw`<p>结论是“任何局部最优都是全局最优”，不是“全局最优一定唯一”。线性目标在某条可行边上取常值时，可有无穷多个最优点。</p>`
      },
      {
        title: '6 · 用方向导数读懂一阶最优性',
        body: String.raw`<p>在可行点 \(x\) 处，朝另一个可行点 \(y\) 迈小步。最初的目标变化率是 \(\nabla f_0(x)^T(y-x)\)。如果它小于 0，你就找到了一个可行下降方向，\(x\) 不可能最优。</p><p>对于可微凸目标，这个必要条件也充分：函数始终在自己的切平面上方。若所有可行方向都使切平面不下降，真正的函数也不会下降。这把“搜索整个区域”变成了“检查一个支撑平面”。</p>`,
        formula: String.raw`\begin{aligned}x^*\text{ optimal}\quad\Longleftrightarrow\quad &x^*\in C,\\&\nabla f_0(x^*)^T(y-x^*)\ge0\quad\forall y\in C.\end{aligned}`,
        details: [{ title: '充分性的两行推导', html: String.raw`<p>凸函数的一阶不等式给出 \(f_0(y)\ge f_0(x^*)+\nabla f_0(x^*)^T(y-x^*)\)。右侧的第二项对可行 \(y\) 非负，所以 \(f_0(y)\ge f_0(x^*)\)。</p>` }],
        example: String.raw`<p>\(\min x\) s.t. \(x\ge0\)。在最优点 0，梯度是 1；但所有可行 \(y\ge0\) 都满足 \(1\cdot(y-0)\ge0\)。所以<strong>有约束最优不要求梯度为零</strong>。</p>`
      },
      {
        title: '7 · 无约束与等式约束：梯度能朝哪里指？',
        body: String.raw`<p>若最优点位于一个开放定义域的内部，并且没有显式约束，那么小幅朝任何方向都可行。若梯度非零，就沿负梯度下降。因此无约束可微凸问题的最优性条件是梯度为零。</p><p>若限制为 \(Ax=b\)，只能沿 \(A\) 的 null space 移动。最优点的梯度要与所有这些可行方向正交，亦即落在 \(A^T\) 的列空间里。于是出现一个自由符号向量 \(\nu\)，它在后面会成为等式约束的 Lagrange multiplier。</p>`,
        formula: String.raw`\begin{array}{ll}\text{unconstrained:}&\nabla f_0(x^*)=0,\\[2pt]\text{equality constrained:}&Ax^*=b,\quad\nabla f_0(x^*)+A^T\nu=0.\end{array}`,
        example: String.raw`<p>最小化 \(x_1^2+x_2^2\)，且 \(x_1+x_2=2\)。最优点是 \((1,1)\)，梯度 \((2,2)\) 不为零，却垂直于可行直线。取 \(\nu=-2\) 即满足上式。</p>`,
        details: [{ title: '为什么等式乘子没有非负要求？', html: String.raw`<p>可行方向 \(d\) 与 \(-d\) 都在 \(N(A)\)，所以梯度和它们的内积必须同时非负，最终只能为零。乘子只是表达一个列空间中的向量，可正可负；这与单向不等式的乘子不同。</p>` }]
      },
      {
        title: '8 · 非负正交锥：边界决定梯度的允许符号',
        body: String.raw`<p>考虑 \(x\succeq0\)。如果某个坐标 \(x_i>0\)，它可以稍微增大或减小；最优时对应偏导必须为零。若 \(x_i=0\)，只能往正方向走；此时偏导非负即可，负偏导意味着增大该坐标会改善目标。</p><p>把两种情况压缩成乘积条件，就是互补性的原型。以后看到 \(\lambda_i f_i(x)=0\)，可以想起这里：“没卡住的方向，其阻力应为零”。</p>`,
        formula: String.raw`x\succeq0,\quad\nabla f_0(x)\succeq0,\quad x_i\frac{\partial f_0(x)}{\partial x_i}=0\quad\forall i.`,
        example: String.raw`<p>\(f(x)=(x_1+1)^2+(x_2-2)^2\)，且 \(x\succeq0\)。最优点 \((0,2)\) 的梯度是 \((2,0)\)：第一维被下界挡住，第二维可以自由微调。</p>`,
        pitfall: String.raw`<p>这是对可微凸目标、非负坐标约束的一阶条件。若还存在其他约束，不能只检查这三行便宣称最优；需要把其他可行方向也考虑进去。</p>`
      }
    ],
    quiz: [
      { id:'standard-q1', q:String.raw`<p>下列哪个写法符合标准凸优化结构？</p>`, options:[String.raw`\(\min x^2\)，约束 \(x^2=1\)`,String.raw`\(\min x^2\)，约束 \(x\ge1\)`,String.raw`\(\max x^2\)，约束 \(-1\le x\le1\)`], answer:1, explanation:String.raw`<p>第二项的目标凸，\(x\ge1\) 可写成仿射不等式 \(1-x\le0\)。第一项的非仿射等式给出非凸可行集；第三项最大化凸目标。</p>` },
      { id:'standard-q2', q:String.raw`<p>\(\min (x-2)^2\)，约束 \(x\le1\)。最优点处的梯度是什么？</p>`, options:[String.raw`0，因为最优点必须驻点`,String.raw`2，因为在上界处应为正`,String.raw`-2；它仍满足对所有可行方向的一阶条件`], answer:2, explanation:String.raw`<p>最优点 \(x^*=1\)，梯度 \(2(x^*-2)=-2\)。任何可行 \(y\le1\) 满足 \((-2)(y-1)\ge0\)。向右虽会降低目标，却不可行。</p>` },
      { id:'standard-q3', q:String.raw`<p>\(\inf_{x>0}1/x\) 的正确描述是？</p>`, options:[String.raw`最优值为0，但没有达到它的最优点`,String.raw`最优点是 \(x=0\)`,String.raw`目标向下无界，所以值为 \(-\infty\)`], answer:0, explanation:String.raw`<p>所有目标值都正且可任意接近0；\(x=0\) 不在定义域里。有限 inf 不保证 attained minimum。</p>` }
    ],
    sources: [{lecture:4,page:3,note:'Standard form 与 optimal value'},{lecture:4,page:4,note:'Feasible、optimal、local optimum'},{lecture:4,page:5,note:'Feasibility problem'},{lecture:4,page:6,note:'Convex program 的结构'},{lecture:4,page:7,note:'Local ⇒ global proof'},{lecture:4,page:8,note:'Directional optimality'},{lecture:4,page:9,note:'Unconstrained optimality'},{lecture:4,page:10,note:'Equality constrained optimality'},{lecture:4,page:11,note:'Nonnegative orthant'}],
    clips: [{file:'2026-09-15_095849',start:6069,end:6346,title:'把优化问题写成标准形式',note:'变量、目标、约束与局部最优的正式定义。'},{file:'2026-09-17_095755',start:722,end:950,title:'局部最优为什么必全局最优',note:'沿可行线段的反证。'},{file:'2026-09-17_095755',start:1852,end:2547,title:'一阶条件与方向导数',note:'从可行方向理解内积条件。'},{file:'2026-09-17_095755',start:3479,end:4350,title:'等式约束与梯度正交性',note:'Null space、range 与等式乘子的几何来源。'}]
  },
  {
    id:'reformulation', title:'换一种写法，问题就变得可处理', en:'Reformulation & quasiconvexity', group:'MODEL',
    summary:'学习消元、辅助变量、slack 和 epigraph。理解“表示等价”与“某个单独约束等价”的区别，并把 quasiconvex 问题变成一串凸可行性判断。',
    objectives:['在保留可行解对应关系的前提下变换模型','正确使用 slack、epigraph 与部分极小化','区分 convex 与 quasiconvex','执行一次有明确上下界含义的二分求解'],
    prereq:['标准凸问题与定义域','仿射映射、null space','Sublevel set 与凸函数保凸操作'], labs:['epigraph'],
    sections:[
      {
        title:'1 · 等价的核心是“解可以来回恢复”',
        body:String.raw`<p>两个表达式看起来不同，也可能描述同一项任务。所谓等价变换，至少要说明：旧问题的解怎样变成新问题的解，新问题的解又怎样恢复旧变量。新增变量不能偷偷放宽约束，消掉变量也不能漏掉可行解。</p><p>有些变换还改变目标的数值，却保持排序。例如正目标取严格递增的 log 后，最优点不变，但最优值变成原值的 log。学习每种技巧时，都问自己：<strong>保留了哪些东西？如何恢复原解？</strong></p>`,
        example:String.raw`<p>若 \(f(x)>0\)，\(\arg\min f(x)=\arg\min\log f(x)\)。但若 \(f\) 可以为负，log 变换连定义域都不成立；若用非严格递增变换，则还可能产生额外最优点。</p>`
      },
      {
        title:'2 · 消掉等式：在仿射可行集内重新选坐标',
        body:String.raw`<p>先找一个满足 \(Ax_0=b\) 的特解，再找一组张成 \(N(A)\) 的列向量组成 \(F\)。任意其他等式可行点与 \(x_0\) 的差都在 null space 中，所以能够完整写成 \(x=x_0+Fz\)。</p><p>此后只优化 \(z\)：等式自动成立，目标和剩余约束则把 \(x_0+Fz\) 代回。仿射复合保持凸性，因此这一步不会破坏凸问题结构。</p>`,
        formula:String.raw`\begin{aligned}\min_x\quad & f_0(x)\quad\text{s.t. }f_i(x)\le0,\ Ax=b\\\Longleftrightarrow\quad\min_z\quad& f_0(x_0+Fz)\quad\text{s.t. }f_i(x_0+Fz)\le0,\quad R(F)=N(A).\end{aligned}`,
        example:String.raw`<p>\(x_1+x_2=2\) 可取 \(x_0=(1,1)\)、\(F=(1,-1)^T\)，于是 \(x=(1+z,1-z)\)。若原来还有 \(x\succeq0\)，剩余约束变成 \(-1\le z\le1\)。</p>`,
        pitfall:String.raw`<p>需要先确认等式系统可解。若 \(Ax=b\) 本身不可行，不存在可用的 \(x_0\)，也就没有这条参数化。</p>`
      },
      {
        title:'3 · 引入等式：把复合函数拆成“局部函数＋耦合”',
        body:String.raw`<p>消等式并非永远最好；有时反而要引入等式。若很多项写成 \(f_i(A_i x+b_i)\)，可新建 \(y_i=A_i x+b_i\)，让函数只作用在 \(y_i\) 上。这样每一项更易处理，而变量之间的联系集中在仿射等式里。</p><p>这像把一条很长的计算式拆成命名步骤。优化变量变多，但结构更清楚；将来某些算法正是利用这种结构分别处理各个函数。</p>`,
        formula:String.raw`f_i(A_i x+b_i)\le0\quad\Longleftrightarrow\quad f_i(y_i)\le0,\qquad y_i=A_i x+b_i.`,
        example:String.raw`<p>\(\min_x\|Ax-b\|_2^2\) 可写成 \(\min_{x,r}\|r\|_2^2\)，约束 \(r=Ax-b\)。\(r\) 是 residual，不是可以独立随意取零的自由变量。</p>`
      },
      {
        title:'4 · Slack 是剩余额度，不是任意松开的口子',
        body:String.raw`<p>约束 \(a^Tx\le b\) 表示消耗不能超过预算。引入 \(s=b-a^Tx\ge0\)，即可把它写成等式。这个新变量记录没有用完的额度，所以叫 slack variable。</p><p>方向相反时符号也要改变。若 \(a^Tx\ge b\)，则写成 \(a^Tx-s=b\)、\(s\ge0\)。等式与符号约束必须一起保留。</p>`,
        formula:String.raw`a^Tx\le b\quad\Longleftrightarrow\quad a^Tx+s=b,\ s\ge0.`,
        example:String.raw`<p>\(2x_1+x_2\le10\)。在 \((x_1,x_2)=(2,3)\) 时 slack=3；在 \((4,2)\) 时 slack=0，约束恰好 active。</p>`,
        details:[{title:'自由变量也能拆成非负变量',html:String.raw`<p>若 LP 的某个变量 \(x_i\) 可以正负取值，可写成 \(x_i=x_i^+-x_i^-\)，其中 \(x_i^+,x_i^-\ge0\)。新表示不唯一，但任何旧变量都能表达，任何新解也可恢复 \(x_i\)。</p>`}]
      },
      {
        title:'5 · Epigraph：把目标高度抬成一个变量',
        body:String.raw`<p>用一个高度 \(t\) 压在目标函数上方，再尽量把它往下推。由于原来候选点 \(x\) 的最小允许高度就是 \(f_0(x)\)，最小化 \(t\) 与最小化原目标做的是同一件事。</p><p>这对于 max-of-affine 目标尤其有用：要让所有直线都不高于 \(t\)，只需逐条加入线性不等式。非光滑的上包络于是变成一个线性目标加线性约束的问题。</p>`,
        formula:String.raw`\begin{aligned}\min_x f_0(x)&\Longleftrightarrow\min_{x,t}t\quad\text{s.t. }f_0(x)\le t,\\\min_x\max_i(a_i^Tx+b_i)&\Longleftrightarrow\min_{x,t}t\quad\text{s.t. }a_i^Tx+b_i\le t\ \forall i.\end{aligned}`,
        example:String.raw`<p>\(\min_x\max(x+1,-2x+2)\) 变成 \(\min t\)，约束 \(x+1\le t\)、\(-2x+2\le t\)。两条线交于 \(x=1/3\)，最低可用高度为 \(4/3\)。</p>`,
        pitfall:String.raw`<p>单独的 \(f_0(x)\le t\) 不等于 \(t=f_0(x)\)。只有结合“最小化 t”，最优处才会把多余高度压掉。</p>`
      },
      {
        title:'6 · 部分极小化：把另一个变量已经做好的选择折进去',
        body:String.raw`<p>若约束只作用在 \(x_1\)，可以定义 \(\tilde f(x_1)=\inf_{x_2}f(x_1,x_2)\)，先把每个 \(x_1\) 对应的最佳 \(x_2\) 选择压缩进目标。若 \(f\) 对两个变量<strong>联合凸</strong>，这个 partial minimization 仍凸。</p><p>直觉是：从一个联合凸 epigraph 沿着 \(x_2\) 方向投影，得到的集合仍凸。若 inf 不能达到，则恢复原变量时只能找逼近最优的 \(x_2\)，不能凭空宣称有 minimizer。</p>`,
        example:String.raw`<p>\(f(x,z)=(x-z)^2+z^2\)。对固定 \(x\)，由 \(-2(x-z)+2z=0\) 得 \(z=x/2\)，因此 \(\tilde f(x)=x^2/2\)，依然凸。</p>`,
        pitfall:String.raw`<p>别把这条规则与“任意一族凸函数逐点取 inf 仍凸”混淆，后者一般是错的。例如 \(\min\{(x-1)^2,(x+1)^2\}\) 不凸。这里需要对被保留与被消去的变量联合凸。</p>`
      },
      {
        title:'7 · Quasiconvex：目标不是碗，但每个水平以下仍连成凸区域',
        body:String.raw`<p>凸函数满足弦线不等式；quasiconvex 只要求每个 sublevel set 都凸。这是更弱的条件。例如在正半轴上单调增的 \(\sqrt{x}\) 是 quasiconvex，却是凹函数。</p><p>若目标 quasiconvex、不等式约束凸、等式仿射，固定一个目标水平后就得到凸可行性问题。这提供了解法，但不能把 convex problem 的所有最优性结论原样搬来。</p>`,
        formula:String.raw`f\text{ quasiconvex}\quad\Longleftrightarrow\quad\{x:f(x)\le t\}\text{ convex for every }t.`,
        example:String.raw`<p>单调函数 \(f(x)=\min(\max(x,0),1)\) 的 sublevel sets 都是区间。在 \(x=1.5\) 附近它恒为1，所以该点是非严格局部最优；但 \(x\le0\) 处目标是0，说明它不是全局最优。</p>`,
        pitfall:String.raw`<p>“Quasiconvex 的局部最优也全局最优”过强，尤其会被平台反例推翻。严格局部最优与非严格局部最优也不能混为一谈。</p>`
      },
      {
        title:'8 · 固定 t，才能把分式变成凸不等式',
        body:String.raw`<p>希望找一个函数族 \(\phi_t\)，让 \(f_0(x)\le t\) 恰好等价于 \(\phi_t(x)\le0\)，且在每个固定 t 下 \(\phi_t\) 对 x 凸。</p><p>一个重要类型是 convex-over-concave：\(f_0=p/q\)，其中 \(p\ge0\) 凸、\(q>0\) 凹。对 \(t\ge0\)，可写 \(\phi_t=p-tq\)。固定 t 时，负的凹函数乘非负系数变成凸函数；若把 t 同时当优化变量，乘积 \(tq(x)\) 一般又造成非凸耦合。</p>`,
        formula:String.raw`\frac{p(x)}{q(x)}\le t\quad\Longleftrightarrow\quad p(x)-tq(x)\le0,\qquad q(x)>0,\ t\ge0.`,
        example:String.raw`<p>\(f_0(x)=(x^2+1)/(x+2)\)，\(x\ge0\)。测试 \(t=0.5\) 得 \(x^2-0.5x\le0\)，有可行区间 \([0,0.5]\)；测试 \(t=0.4\) 得 \(x^2-0.4x+0.2\le0\)，判别式为负，无解。</p>`,
        details:[{title:'一般表示与一个边界细节',html:String.raw`<p>任何凸 sublevel set 都可用其 extended-value indicator 表示：集合内0、集合外\(+\infty\)，它是凸函数。也可用到该集合的距离；但要由“距离为0”准确推出点属于集合，需要 sublevel set 闭，否则只能推出属于闭包。</p>`}]
      },
      {
        title:'9 · 二分：每次只问“这个目标高度做得到吗？”',
        body:String.raw`<p>准备一个下界 l 与一个已知可行点给出的上界 u。取 \(t=(l+u)/2\)，解“原约束加上 \(f_0(x)\le t\)”的可行性问题。若能做到，真正最优值不会高于 t，故更新上界；若做不到，则把下界抬到 t。</p><p>每次区间减半，直到 \(u-l\le\epsilon\)。保留最近一次可行测试的点，便得到与当前最优值下界相差至多 \(\epsilon\) 的可行目标值。这里的工作量是多次凸 feasibility solve，而不是一次一般非凸优化。</p>`,
        formula:String.raw`\begin{array}{ll}t=(l+u)/2;\\\text{feasible at }t:&u\leftarrow t,\\\text{infeasible at }t:&l\leftarrow t,\\\text{stop when}:&u-l\le\epsilon.\end{array}`,
        example:String.raw`<p>上节分式可从 \([0.4,0.5]\) 开始。第一次测0.45，不可行就变成 \([0.45,0.5]\)；若某次测0.475可行，就把上界降到0.475。你不需要预先写出原分式的一阶求根公式。</p>`,
        details:[{title:'次数与 inf 不达到的细节',html:String.raw`<p>若初始宽度大于容差，需要约 \(\lceil\log_2((u-l)/\epsilon)\rceil\) 次测试。严格说，测试不可行只保证 \(p^*\ge t\)；当最优值达到时可加强为 \(p^*>t\)。即使 inf 未达到，更新 \(l=t\) 仍保持有效下界。初始上界来自一个可行点，可确保最后有可返回的可行解。</p>`}]
      }
    ],
    quiz:[
      {id:'reform-q1',q:String.raw`<p>把 \(a^Tx\ge b\) 改成带非负 slack 的等式，正确的是？</p>`,options:[String.raw`\(a^Tx+s=b,\ s\ge0\)`,String.raw`\(a^Tx-s=b,\ s\ge0\)`,String.raw`\(a^Tx+s=b\)，且s可任意正负`],answer:1,explanation:String.raw`<p>\(s=a^Tx-b\ge0\)，所以 \(a^Tx-s=b\)。另两种写法分别反转方向、或完全丢失原不等式。</p>`},
      {id:'reform-q2',q:String.raw`<p>Epigraph 写法里，什么时候可以断言 \(t=f_0(x)\)？</p>`,options:[String.raw`任何满足 \(f_0(x)\le t\) 的可行点`,String.raw`只要 \(f_0\) 是凸函数`,String.raw`在最小化t的最优解处，且没有其他限制强迫t更大`],answer:2,explanation:String.raw`<p>可行点可以把t取很高；最小化t才会去掉多余高度。标准epigraph转换中t没有其他阻碍下降的约束，因此最优时贴住目标。</p>`},
      {id:'reform-q3',q:String.raw`<p>二分测试 \(f_0(x)\le t\) 找到一个可行点后，应怎样更新区间？</p>`,options:[String.raw`\(u\leftarrow t\)，因为最优值至多为t`,String.raw`\(l\leftarrow t\)，因为最优值至少为t`,String.raw`立即停止，因为这个点必为全局最优`],answer:0,explanation:String.raw`<p>可行测试给出了一个可达到的目标上界。它没有排除还存在更低水平，因此继续搜索较低的一半。</p>`}
    ],
    sources:[{lecture:4,page:12,note:'消去等式约束'},{lecture:4,page:13,note:'引入等式和辅助变量'},{lecture:4,page:14,note:'Slack variables'},{lecture:4,page:15,note:'Epigraph 与部分极小化'},{lecture:4,page:16,note:'标准凸结构的边界'},{lecture:4,page:17,note:'Quasiconvex optimization'},{lecture:4,page:18,note:'凸函数族表示'},{lecture:4,page:19,note:'Indicator、distance、分式例子'},{lecture:4,page:20,note:'凸可行性判断'},{lecture:4,page:21,note:'Bisection algorithm'}],
    clips:[{file:'2026-09-17_095755',start:4977,end:5296,title:'解如何在两个表示之间恢复',note:'等价程序与null-space消元。'},{file:'2026-09-17_095755',start:5331,end:5651,title:'Slack 与 epigraph 的角色',note:'注意min t与不等式的联合作用。'},{file:'2026-09-17_095755',start:5720,end:6469,title:'Quasiconvex 与固定水平表示',note:'为什么目标曲线不凸仍能处理。'},{file:'2026-09-22_095833',start:589,end:983,title:'二分可行性问题',note:'更新上下界，以及为什么不能简单把t一起优化。'}]
  },
  {
    id:'lp', title:'线性规划、整数选择与松弛', en:'LP, ILP & total unimodularity', group:'MODEL',
    summary:'从平移一条等值线开始理解 LP，再把选边、选点写成0/1模型。学习为什么放松整数约束会给出界，以及什么结构能让松弛恰好给出整数最优解。',
    objectives:['识别并互换 LP 的常见表示','把 max、内接球与图选择问题写成模型','解释 LP relaxation、integrality gap 与舍入保证','正确陈述 total unimodularity 的整数极点结论'],
    prereq:['仿射函数与多面体','Slack 与 epigraph','最优值和可行域的关系'], labs:['integer'],
    sections:[
      {
        title:'1 · LP：目标与每一条约束都是仿射的',
        body:String.raw`<p>Linear program 的“linear”通常也包含常数项，也就是仿射函数。它的可行域是有限个半空间与超平面的交，因而是一个 polyhedron。把它当成“在多面体上最小化一张斜平面”即可抓住几何核心。</p><p>课件使用以下三种写法。standard/canonical 的名称在不同教材中可能不同，因此做题时应写清公式，而不要只说“已变成标准型”。</p>`,
        formula:String.raw`\begin{array}{ll}\text{general:}&\min c^Tx+d,\quad Gx\preceq h,\ Ax=b;\\[2pt]\text{standard:}&\min c^Tx,\quad Ax=b,\ x\succeq0;\\[2pt]\text{canonical:}&\min c^Tx,\quad Ax\succeq b,\ x\succeq0.\end{array}`,
        example:String.raw`<p>Canonical 的 \(Ax\succeq b\) 可写成 \(Ax-s=b,s\succeq0\)。不受符号限制的变量则拆为 \(x^+-x^-\)。目标常数 d 不改变 optimizer，但会改变最优目标值。</p>`
      },
      {
        title:'2 · 旋转目标，最优点为什么会沿顶点和边移动？',
        body:String.raw`<p>线性目标的等值集 \(c^Tx=t\) 是互相平行的超平面。沿目标降低的方向推动它，最后接触到的可行面就是最优解集合。目标方向改变时，接触点可能跳到另一个顶点；若等值线恰好贴着一条边，整条边都可能最优。</p><p>在有极点且有限最优的标准情形中，可以寻找最优极点。但不是每个一般 LP 都拥有顶点。例如约束只有 \(y\ge0\)、x 完全自由，最小化 y 的全部最优点是一整条直线，没有极点。</p>`,
        example:String.raw`<p>在正方形 \([0,1]^2\) 上最小化 \(x_1+\alpha x_2\)。\(\alpha>0\) 时选 \((0,0)\)；\(\alpha<0\) 时选 \((0,1)\)；\(\alpha=0\) 时整条 \(x_1=0\) 的边都最优。</p>`,
        pitfall:String.raw`<p>“最优解只能是某一个顶点”会漏掉最优边、退化和无顶点情形。也要先判断不可行、向下无界，才谈最优接触位置。</p>`
      },
      {
        title:'3 · 上包络与资源分配：把自然语言转为线性限制',
        body:String.raw`<p>Diet problem 把食物数量设为变量，成本是线性加和，每种营养的摄入量也是线性加和；“至少达到需求”与“不要超过预算”分别给出不同方向的线性约束。Network flow 则把边上的流量作为变量，以节点流量守恒连接整张图。</p><p>更隐蔽的 LP 是 piecewise-linear minimization。虽然 max 目标不光滑，但 epigraph 变换让每一段都只给出一条线性不等式。</p>`,
        formula:String.raw`\min_x\max_{i=1,\ldots,m}(a_i^Tx+b_i)\quad\Longleftrightarrow\quad\min_{x,t}t\quad\text{s.t. }a_i^Tx+b_i\le t\ \forall i.`,
        example:String.raw`<p>想让三种场景下的最大成本尽量小，就让 t 同时盖住三种成本。不要把“最坏成本最小”误写成“成本之和最小”：这两个目标对场景的偏好不同。</p>`,
        details:[{title:'建模时的三个检查',html:String.raw`<ol><li>每个变量的单位是什么：食物份数、流量，还是0/1选择？</li><li>约束方向是否真的表达“至少”或“至多”？</li><li>有没有变量相乘、未知量进入分母等破坏线性的项？</li></ol>`}]
      },
      {
        title:'4 · 最大内接球：一个“对所有扰动”约束如何消失',
        body:String.raw`<p>给定多面体 \(P=\{x:a_i^Tx\le b_i\}\)，想放进一颗尽可能大的球。决策变量是中心 \(x_c\) 与半径 r。球里任何点都写成 \(x_c+u\)，其中 \(\|u\|_2\le r\)。</p><p>每个半空间都必须容纳整颗球，因此要考虑 \(a_i^Tu\) 的最大可能值。Cauchy-Schwarz 给出上界 \(r\|a_i\|_2\)，且沿法向量方向的扰动能达到这个界。无穷多条“对所有u”的约束便压缩成有限条线性不等式。</p>`,
        formula:String.raw`\begin{aligned}\max_{x_c,r}\quad&r\\\text{s.t.}\quad&a_i^Tx_c+r\|a_i\|_2\le b_i,\quad i=1,\ldots,m,\qquad r\ge0.\end{aligned}`,
        example:String.raw`<p>正方形 \(-1\le x_1,x_2\le1\) 的四条不等式都具有单位法向量。取中心0时，每条都要求 r≤1，因此最大半径为1。</p>`,
        pitfall:String.raw`<p>这里 \(\|a_i\|_2\) 是给定常数，所以仍是 LP；若 ai 也成了未知变量，不能再把这一项当常系数。</p>`
      },
      {
        title:'5 · ILP：连续可行域上只准踩整数点',
        body:String.raw`<p>Integer linear program 保留线性目标和线性约束，却把变量限制在整数格点。Binary variable \(x_i\in\{0,1\}\) 最适合表示是否选择某个对象。多面体仍可作为背景，但整数可行集通常不凸：两个允许选择的平均可能是半选。</p><p>一般 ILP 是 NP-hard；然而一些具有特殊结构的组合问题仍能精确、高效求解。不能从“写成 ILP”直接判断每个特殊问题都难，也不能因为目标线性就套用凸问题局部最优结论。</p>`,
        formula:String.raw`\min c^Tx+d\quad\text{s.t. }Gx\preceq h,\ Ax=b,\quad x\in\mathbb Z^n.`,
        example:String.raw`<p>“是否开一个仓库”是0/1，“开仓后的运输量”通常连续；同时有这两类变量的是 mixed-integer 模型。若把开仓变量随便放成0.3，原问题的实际含义已经改变。</p>`
      },
      {
        title:'6 · 用边变量和点变量读懂五类图模型',
        body:String.raw`<p>最短路与匹配用<strong>边变量</strong>；vertex cover 与 independent set 用<strong>点变量</strong>。先决定变量放在哪里，再看每个节点或每条边需要怎样的局部规则。</p><ul><li><strong>Shortest path：</strong>\(x_{ij}=1\) 表示选边；源点出流减入流为1，汇点为−1，其余为0，最小化 \(\sum c_{ij}x_{ij}\)。在非负成本场景中可移除多余循环，恢复一条最短路径。</li><li><strong>Vertex cover：</strong>每条边至少选一个端点：\(x_i+x_j\ge1\)，最小化选点数。</li><li><strong>Independent set：</strong>每条边至多选一个端点：\(x_i+x_j\le1\)，最大化选点数。</li><li><strong>Perfect bipartite matching：</strong>每个节点恰有一条被选边：\(\sum_{e\ni v}x_e=1\)，最大化边权和。</li><li><strong>b-matching：</strong>每个节点至多接 b 条被选边：\(\sum_{e\ni v}x_e\le b\)，最大化边权和。</li></ul>`,
        example:String.raw`<p>三角形的 vertex cover 至少要两个点；independent set 至多一个点。一个点集是 cover 当且仅当它的补集 independent，这解释了这两类问题之间的联系。</p>`,
        pitfall:String.raw`<p>流量守恒本身允许循环。若允许负成本循环，简单流模型可能额外选择循环，不能不加条件就把任意解叫作一条简单最短路径。</p>`
      },
      {
        title:'7 · LP relaxation：先扩大选择范围，得到一个界',
        body:String.raw`<p>去掉整数要求，让变量可以分数取值，就得到 LP relaxation。它可能无法直接执行，却往往更容易求解，而且有清楚的界意义：最小化时，给你更多选择，最优成本只能更低或相同。</p><p>Integrality gap 描述这种放松能有多乐观。对正目标的最小化问题，常用 \(\sup_I\mathrm{OPT}(I)/\mathrm{OPT}_f(I)\)。比值约定要和最小化/最大化以及分母是否为正一起说明。</p>`,
        formula:String.raw`C_{\mathrm{ILP}}\subseteq C_{\mathrm{LP}}\quad\Longrightarrow\quad p^*_{\mathrm{LP}}\le p^*_{\mathrm{ILP}}\qquad(\text{minimization}).`,
        example:String.raw`<p>三角形 vertex cover 的 LP 可取每个点 \(x_i=1/2\)，每条边的端点之和都是1，总成本1.5；整数最优成本是2。该实例的 gap 比值是 \(2/1.5=4/3\)。</p>`,
        pitfall:String.raw`<p>Relaxation 给出 lower bound，不等于给出一个合法整数方案。求出的分数变量必须经过一个有可行性保证的恢复方法。</p>`
      },
      {
        title:'8 · 为什么 vertex cover 的 1/2 阈值能保证 2-approximation',
        body:String.raw`<p>先求 LP 最优解 \(x^*\)，再把所有至少1/2的坐标设成1，其余设成0。可行性来自每条边的规则：既然 \(x_i^*+x_j^*\ge1\)，两端不可能同时小于1/2，因此舍入后每条边仍被覆盖。</p><p>成本保证来自逐坐标不等式 \(\hat x_i\le2x_i^*\)。加总，再利用 LP 最优成本是整数最优成本的下界，即得到最多两倍最优的保证。你不必先证明所有 LP 最优解都半整数，才能做这个阈值论证。</p>`,
        formula:String.raw`\hat x_i=\mathbf1\{x_i^*\ge1/2\},\qquad\sum_i\hat x_i\le2\sum_i x_i^*=2\mathrm{OPT}_f\le2\mathrm{OPT}.`,
        example:String.raw`<p>三角形的全1/2解会被舍入为三个点全选，成本3；这不是该图的最优 cover，但不超过两倍整数最优成本4。近似算法提供的是保证，不是“每次都刚好最优”。</p>`,
        pitfall:String.raw`<p>不能把这条舍入规则直接搬到 independent set。三角形中三个1/2满足其 LP 的每条 \(x_i+x_j\le1\)，却会被全舍入成1，从而违反所有边约束。</p>`
      },
      {
        title:'9 · Total unimodularity：整数性藏在所有小行列式里',
        body:String.raw`<p>整数矩阵 A 若每个方形子矩阵的行列式都属于 \(\{-1,0,1\}\)，就称 totally unimodular（TU/TUM）。这个局部代数结构能够控制多面体极点的坐标。</p><p>当 A 为 TU 且右侧 b 为整数时，标准形式多面体 \(\{x:Ax=b,x\succeq0\}\) 的极点是整数。直觉是：在一个极点，足够多的独立 active constraints 会确定坐标；用 Cramer 法则解这个小系统时，分母只能是±1，整数分子便不会制造分数。</p>`,
        formula:String.raw`A\text{ TU},\ b\in\mathbb Z^m\quad\Longrightarrow\quad\text{vertices of }\{x:Ax=b,\ x\succeq0\}\text{ are integral}.`,
        details:[{title:'结论到底说到哪一步？',html:String.raw`<p>若 LP 有有限最优值并可选择最优极点，就存在整数最优解，因此松弛 exact。它<strong>没有说</strong>每个可行点都整数，也没有说每个最优点都整数。两个整数最优点的平均可能是分数最优点。</p>`}],
        example:String.raw`<p>约束 \(x_1+x_2=1,x\succeq0\) 的矩阵是TU，极点 \((1,0),(0,1)\) 都整数；但中点 \((1/2,1/2)\) 也可行。若目标为0，这个分数点同样最优。</p>`
      },
      {
        title:'10 · 网络与二部图为什么特殊，三角形又提醒了什么',
        body:String.raw`<p>有向图的 node-edge incidence matrix 每列记录一条边：在出发点记1、到达点记−1，其余0；这类矩阵为 TU。无向二部图的 incidence matrix 也 TU：把一侧节点的行乘−1后，就得到类似的符号结构。因此整数供需的网络流、二部匹配等 LP 可以拥有整数最优极点。</p><p>一般无向图则不同。三角形的无向 incidence 子式行列式绝对值为2，正好允许分数极点出现。一般图的 b-matching 虽仍有多项式算法，但单靠度约束的 LP 不一定 exact；不能把“可高效求解”与“这个简单矩阵是 TU”画等号。</p>`,
        formula:String.raw`\det\begin{bmatrix}1&1&0\\1&0&1\\0&1&1\end{bmatrix}=-2\quad\Longrightarrow\quad\text{not TU}.`,
        example:String.raw`<p>三角形 matching 的度约束 LP 可取每条边1/2，目标边数1.5；真正的整数 matching 只能选一条边。这个例子直接显示非二部图里还缺少结构限制。</p>`,
        pitfall:String.raw`<p>TU加整数rhs是很有用的充分条件，不是所有整数问题可解的必要条件。也不要忘记rhs的整数性：TU矩阵配分数rhs仍可产生分数极点。</p>`
      }
    ],
    quiz:[
      {id:'lp-q1',q:String.raw`<p>三角形 vertex cover 的 LP relaxation 最优成本是1.5，而整数最优成本是2。这说明？</p>`,options:[String.raw`LP relaxation 无法提供任何可靠信息`,String.raw`LP给出一个下界，但其最优方案未必是合法整数方案`,String.raw`只要四舍五入就一定得到整数最优解`],answer:1,explanation:String.raw`<p>放松扩大了可行集，所以1.5是合法下界；它的分数选择不能直接执行。舍入可以有近似保证，但不自动达到整数最优。</p>`},
      {id:'lp-q2',q:String.raw`<p>TU矩阵配整数rhs，最准确的结论是哪一个？</p>`,options:[String.raw`每个可行点都是整数`,String.raw`每个最优点都是整数`,String.raw`极点是整数，因此在有限最优的标准情形中可选整数最优点`],answer:2,explanation:String.raw`<p>TU控制极点，不会排除整数极点之间的分数凸组合。多个最优极点之间的整个最优面也可能含分数点。</p>`},
      {id:'lp-q3',q:String.raw`<p>为什么 vertex cover 的1/2阈值舍入保持可行？</p>`,options:[String.raw`每条边两端至少一端在LP解中≥1/2`,String.raw`所有线性规划的最优解都只含0、1/2、1`,String.raw`舍入后的目标总会更小`],answer:0,explanation:String.raw`<p>由每条边 \(x_i+x_j\ge1\)，至少一个端点达到1/2。第二项对一般LP错误；舍入后的目标可能增大，其价值是有可分析的上界。</p>`}
    ],
    sources:[{lecture:5,page:2,note:'LP general form 与几何'},{lecture:5,page:3,note:'Standard/canonical forms'},{lecture:5,page:5,note:'Piecewise-linear minimization'},{lecture:5,page:6,note:'Chebyshev center'},{lecture:5,page:7,note:'最坏方向的支持函数推导'},{lecture:5,page:8,note:'Integer linear program'},{lecture:5,page:9,note:'Shortest path'},{lecture:5,page:10,note:'Vertex cover'},{lecture:5,page:11,note:'Independent set'},{lecture:5,page:12,note:'Bipartite matching'},{lecture:5,page:13,note:'b-matching'},{lecture:5,page:15,note:'Relaxation 与 integrality gap'},{lecture:5,page:17,note:'2-approximation rounding'},{lecture:5,page:18,note:'TU definition'},{lecture:5,page:20,note:'Integer vertices theorem'},{lecture:5,page:22,note:'Network LP relaxation'}],
    clips:[{file:'2026-09-22_095833',start:1024,end:1570,title:'LP的几何与几种形式',note:'把多面体、等值线与代数表示联系起来。'},{file:'2026-09-22_095833',start:2214,end:2662,title:'Max-of-affine 为什么也是LP',note:'Epigraph高度只在最优时贴住上包络。'},{file:'2026-09-24_095928',start:569,end:1304,title:'Vertex cover的阈值舍入',note:'先证明可行，再比较近似成本与最优成本。'},{file:'2026-09-24_095928',start:1362,end:2336,title:'TU与整数极点',note:'方形子式、整数rhs与松弛exact的结构。'}]
  },
  {
    id:'cones', title:'二次碗、锥约束与不确定性', en:'QP, QCQP & SOCP', group:'MODEL',
    summary:'把二次目标的曲率变成一个PSD矩阵，理解最优点何时在内部、何时被约束挡住。再用二阶锥表示范数约束，把鲁棒要求和概率安全余量写成凸模型。',
    objectives:['从P的谱判断QP是否凸、是否可能唯一','把least squares与均值-方差模型展开成QP','区别QCQP与SOCP，并保留平方前的符号条件','推导椭球不确定性与Gaussian机会约束的SOC形式'],
    prereq:['PSD/PD与二次型','梯度与一阶最优性','Cauchy-Schwarz、均值与方差'], labs:['projection'],
    sections:[
      {
        title:'1 · QP：一个矩阵描述目标碗的全部曲率',
        body:String.raw`<p>Quadratic program 具有二次目标和仿射约束。对称矩阵 P 就是目标的 Hessian；\(P\succeq0\) 表示每个方向的曲率都不负，所以目标凸。若 \(P\succ0\)，每个非零方向都有正曲率，目标严格凸。</p><p>在非空、闭的可行多面体上，正定P给出唯一最优点。半正定P可能有平坦方向：若线性项沿它下降，问题可能向下无界；若线性项也不变，则可能存在很多最优点。</p>`,
        formula:String.raw`\begin{aligned}\min_x\quad &\tfrac12x^TPx+q^Tx+r\\\text{s.t.}\quad&Gx\preceq h,\ Ax=b,\qquad P\succeq0,\\&\nabla f_0(x)=Px+q,\quad\nabla^2f_0(x)=P.\end{aligned}`,
        example:String.raw`<p>\(P=\operatorname{diag}(1,0)\)。若 \(q=0\)，所有 \((0,t)\) 都是无约束最优点；若 \(q=(0,-1)\)，目标 \(x_1^2/2-x_2\) 就沿第二维向下无界。</p>`,
        pitfall:String.raw`<p>凸QP的最优点不一定在边界。若无约束最优点已在可行域内部，约束可以完全不发挥作用。交互图里应同时观察 active 与 inactive 两种状态。</p>`
      },
      {
        title:'2 · Least squares：先展开，再检查能否取逆',
        body:String.raw`<p>最小二乘希望让 residual \(Ax-b\) 的平方长度尽量小。把平方范数展开，就会看见一个二次目标，其中曲率矩阵是 \(2A^TA\)。它总半正定，因为 \(z^TA^TAz=\|Az\|_2^2\ge0\)。</p><p>梯度为零给出 normal equations。只有 A 满列秩时 \(A^TA\) 才正定可逆，此时能直接写逆矩阵公式；秩不足时不该硬取逆，而应解这个线性系统或使用伪逆。</p>`,
        formula:String.raw`\begin{aligned}\|Ax-b\|_2^2&=x^TA^TAx-2(A^Tb)^Tx+b^Tb,\\\nabla f(x)=0&\Longleftrightarrow A^TAx=A^Tb,\\A\text{ full column rank}&\Longrightarrow x^*=(A^TA)^{-1}A^Tb.\end{aligned}`,
        example:String.raw`<p>若 \(A=[1\ \ 1]\)、\(b=2\)，目标为 \((x_1+x_2-2)^2\)。任何 \(x_1+x_2=2\) 都最优，\(A^TA\) 奇异恰好表达这个不唯一性。</p>`,
        details:[{title:'几何解释',html:String.raw`<p>\(Ax\) 只能落在 A 的列空间内。Least squares 把 b 正交投影到该列空间，因此最优残差与所有列方向正交：\(A^T(Ax-b)=0\)。</p>`}]
      },
      {
        title:'3 · 随机成本：把“平均好”与“不容易波动”同时写进目标',
        body:String.raw`<p>若成本向量 c 随机，方案x的总成本 \(c^Tx\) 也随机。给定均值 \(\bar c\) 和 covariance matrix \(\Sigma\)，它的期望是线性的，方差是二次型。</p><p>一个风险厌恶模型最小化“期望成本＋γ倍方差”。γ越大，越愿意牺牲一些平均表现以降低波动。Covariance matrix 自带PSD性质，因为任何方向的方差都非负，所以这个目标是凸QP。</p>`,
        formula:String.raw`\mathbb E[c^Tx]=\bar c^Tx,\quad\operatorname{Var}(c^Tx)=x^T\Sigma x,\quad\min_x\ \bar c^Tx+\gamma x^T\Sigma x,\quad\gamma>0.`,
        example:String.raw`<p>两个方案平均成本相同，但一个结果几乎固定，另一个时好时坏；γ>0时，模型会偏向低方差方案。这与“无论什么场景都必须安全”的robust约束不同。</p>`,
        details:[{title:'方差公式的一步推导',html:String.raw`<p>\(c^Tx-\bar c^Tx=(c-\bar c)^Tx\)，平方并取期望得到 \(\mathbb E[x^T(c-\bar c)(c-\bar c)^Tx]=x^T\Sigma x\)。x是决策变量，不是此处求期望的随机量。</p>`}]
      },
      {
        title:'4 · QCQP：让约束也长成二次曲面',
        body:String.raw`<p>Quadratically constrained quadratic program 不仅目标是二次的，每条不等式也可以是二次函数。若各个曲率矩阵都PSD，则目标与不等式都凸；等式仍要求仿射。</p><p>当约束矩阵正定且对应水平集非空时，二次不等式描出椭球（退化时可能是一点）；半正定的情况还会出现柱面或其他退化形状。可行集就是这些凸区域与仿射集的交。</p>`,
        formula:String.raw`\begin{aligned}\min_x\quad&\tfrac12x^TP_0x+q_0^Tx+r_0\\\text{s.t.}\quad&\tfrac12x^TP_ix+q_i^Tx+r_i\le0,\ i=1,\ldots,m,\\&Ax=b,\qquad P_i\succeq0\ (i=0,\ldots,m).\end{aligned}`,
        example:String.raw`<p>盒约束 \(0\le x_i\le1\) 可等价写成凸二次不等式 \(x_i(x_i-1)\le0\)。但若改成等式 \(x_i(x_i-1)=0\)，就只剩0或1，变成非凸离散选择。</p>`
      },
      {
        title:'5 · 二阶锥：高度必须盖住横向长度',
        body:String.raw`<p>把向量u看成横向位置、t看成高度。\(\|u\|_2\le t\) 描出一个实心“冰淇淋锥”：固定正高度时，截面是一个球；高度0只容许u=0；负高度没有可行点。</p><p>它的凸性来自三角不等式。把两个锥内点做凸组合，组合后的横向长度不超过原长度的加权和，而该加权和又不超过组合后的高度。</p>`,
        formula:String.raw`\mathcal Q=\{(u,t):\|u\|_2\le t\},\qquad\|\theta u+(1-\theta)v\|_2\le\theta\|u\|_2+(1-\theta)\|v\|_2.`,
        example:String.raw`<p>\((u,t)=((3,4),5)\) 在锥边界；\(((3,4),6)\) 在内部；\(((3,4),-5)\) 不可行，虽然平方后也满足 \(3^2+4^2\le(-5)^2\)。</p>`,
        pitfall:String.raw`<p>把范数不等式平方时，必须保留右侧非负条件。\(\|u\|_2^2\le t^2\) 单独会把另一半负锥也误收进来。</p>`
      },
      {
        title:'6 · SOCP：仿射映射后的点必须落在二阶锥里',
        body:String.raw`<p>Second-order cone program 用线性目标、仿射等式，以及“一个仿射向量的长度不超过一个仿射标量”构成约束。可以把每条限制理解为 \((A_i x+b_i,c_i^Tx+d_i)\) 必须属于二阶锥。</p><p>它比看上去灵活：LP可视作没有横向范数项的特殊情形；凸二次目标或约束则可通过epigraph和rotated-cone表示转为SOCP。重点是保持正确的符号和维度，而不是对所有式子盲目平方。</p>`,
        formula:String.raw`\begin{aligned}\min_x\quad&f^Tx\\\text{s.t.}\quad&\|A_i x+b_i\|_2\le c_i^Tx+d_i,\ i=1,\ldots,m,\\&Fx=g.\end{aligned}`,
        details:[{title:'一个可以自己验证的乘积表示',html:String.raw`<p>在 \(u,v\ge0\) 下，\(\|z\|_2^2\le uv\) 等价于 \(\|(2z,u-v)\|_2\le u+v\)。两边平方后，\((u+v)^2-(u-v)^2=4uv\)。这就是把正变量乘积与平方范数装进锥的一个入口。</p>`}],
        pitfall:String.raw`<p>并非任意SOCP平方后都成为“标准凸QCQP”：右侧含变量时，其平方会产生负的二次曲率项；原来的锥表达才清楚地保留凸结构。</p>`
      },
      {
        title:'7 · Robust LP：对整个不确定椭球都安全',
        body:String.raw`<p>假设约束法向量不是一个确定的 \(a_i\)，而可能属于椭球 \(\mathcal E_i=\{\bar a_i+P_i u:\|u\|_2\le1\}\)。确定性robust要求不管椭球里哪个参数发生，\(a_i^Tx\le b_i\) 都成立。</p><p>对固定x，先把最坏参数找出来。\(u^TP_i^Tx\) 在单位球上的最大值就是 \(\|P_i^Tx\|_2\)。于是一个含无穷多场景的约束，精确地变成一个SOC约束。</p>`,
        formula:String.raw`\begin{aligned}a_i^Tx\le b_i\ \forall a_i\in\mathcal E_i&\Longleftrightarrow\sup_{\|u\|_2\le1}(\bar a_i+P_i u)^Tx\le b_i\\&\Longleftrightarrow\bar a_i^Tx+\|P_i^Tx\|_2\le b_i.\end{aligned}`,
        example:String.raw`<p>若 \(P_i=\rho I\)，安全余量是 \(\rho\|x\|_2\)。ρ=0时退回普通线性约束；ρ增大时，必须留出更多余量，robust可行域收缩。</p>`,
        details:[{title:'最坏扰动朝哪里？',html:String.raw`<p>当 \(P_i^Tx\ne0\) 时，取 \(u=P_i^Tx/\|P_i^Tx\|_2\) 达到最坏值；若它等于0，则所有允许扰动对该约束的影响都为0。</p>`}]
      },
      {
        title:'8 · Chance constraint：允许小概率失效，但把概率算清楚',
        body:String.raw`<p>另一种模型不要求所有参数都安全，而要求安全概率至少η。若 \(a_i\sim\mathcal N(\bar a_i,\Sigma_i)\)，则对固定x，\(a_i^Tx\) 仍是Gaussian，均值 \(\bar a_i^Tx\)，标准差 \(\|\Sigma_i^{1/2}x\|_2\)。</p><p>把它标准化，并对标准正态CDF Φ 取逆，就得到“均值＋若干个标准差≤预算”。当 \(1/2\le\eta<1\) 时，\(\Phi^{-1}(\eta)\ge0\)，因而这是凸SOC限制。η越高，要求的安全余量越大。</p>`,
        formula:String.raw`\Pr(a_i^Tx\le b_i)\ge\eta\quad\Longleftrightarrow\quad\bar a_i^Tx+\Phi^{-1}(\eta)\|\Sigma_i^{1/2}x\|_2\le b_i.`,
        example:String.raw`<p>η=0.95时，标准正态分位数约1.645。若均值为7、标准差为2，则要预算至少 \(7+1.645\times2\approx10.29\)，才能满足这个单条约束的95%安全概率。</p>`,
        details:[{title:'两个不能省略的条件',html:String.raw`<ul><li>标准差为0时，不做除0的标准化，直接检查确定性均值是否≤b。</li><li>分别给每条约束95%安全概率，并不自动意味着“所有约束同时满足”的概率也是95%；joint chance constraint 是另一个要求。</li></ul>`}],
        pitfall:String.raw`<p>η低于1/2时分位数变负，这个写法一般不再具有同样的凸SOC结构；η=1则对应无穷分位数的极限，不能直接当成普通有限系数。</p>`
      },
      {
        title:'9 · 半空间挡住碗底：从投影直觉连接到作业',
        body:String.raw`<p>看最简单的QP：把点c投影到半空间 \(a^Tx\le b\)。若c本来可行，它就是最优点，约束不active；若c不可行，就沿法向量把它推回边界。这个两种情况的切换，比背一串乘子公式更重要。</p><p>若目标是带正定权重Q的距离，椭圆的轴会改变“最近”的含义。修正方向不再是a本身，而是 \(Q^{-1}a\)。它与对偶/KKT里“梯度与约束法向量抵消”的关系完全一致。</p>`,
        formula:String.raw`\begin{gathered}\min_x\ \tfrac12(x-c)^TQ(x-c)\quad\text{s.t. }a^Tx\le b,\quad Q\succ0,\ a\ne0,\\x^*=c-\alpha Q^{-1}a,\qquad\alpha=\max\!\left(0,\frac{a^Tc-b}{a^TQ^{-1}a}\right).\end{gathered}`,
        example:String.raw`<p>取 \(Q=I,c=(2,0),a=(1,1)\)。若b=3，c可行，不用移动；若b=0，则沿 \((1,1)\) 推回边界，得到 \((1,-1)\)。将来推导 A2 的半空间QP时，先辨认无约束碗底，再判断它是否违反约束。</p>`,
        details:[{title:'从几何得到公式的三步',html:String.raw`<ol><li>若c不可行，最优处贴边：\(a^Tx=b\)。</li><li>一阶法向平衡给 \(Q(x-c)=-\alpha a\)。</li><li>代回边界等式得到 \(\alpha=(a^Tc-b)/(a^TQ^{-1}a)>0\)。分母为正来自Q正定与a非零。</li></ol>`}]
      }
    ],
    quiz:[
      {id:'cones-q1',q:String.raw`<p>为什么 \(\|u\|_2^2\le t^2\) 不能单独替代SOC约束？</p>`,options:[String.raw`它漏掉了t必须非负，错误地允许负高度`,String.raw`二次函数永远非凸`,String.raw`范数不能用于优化问题`],answer:0,explanation:String.raw`<p>例如 \(u=(3,4),t=-5\) 满足平方不等式，却不满足 \(5\le-5\)。保留 \(t\ge0\) 后才与原SOC等价。</p>`},
      {id:'cones-q2',q:String.raw`<p>无约束QP中 \(P=\operatorname{diag}(1,0),q=(0,-1)\)。发生了什么？</p>`,options:[String.raw`P为PSD，所以必有唯一最优点`,String.raw`沿第二维向下无界`,String.raw`所有点都最优`],answer:1,explanation:String.raw`<p>目标 \(x_1^2/2-x_2\) 沿 \(x_2\to+\infty\) 变为 \(-\infty\)。PSD给凸性，但没有正曲率的方向仍可能被线性项推向无界。</p>`},
      {id:'cones-q3',q:String.raw`<p>Gaussian机会约束的η从0.5升到0.95时，其他参数不变，会怎样？</p>`,options:[String.raw`安全余量减少，因为允许更多风险`,String.raw`一定变成非凸问题`,String.raw`安全余量增加，通常缩小可行域`],answer:2,explanation:String.raw`<p>\(\Phi^{-1}(0.5)=0\)，\(\Phi^{-1}(0.95)\approx1.645\)。要求更高的满足概率，就要在均值之外加入更多标准差的余量。</p>`}
    ],
    sources:[{lecture:6,page:3,note:'QP、PSD Hessian 与几何'},{lecture:6,page:4,note:'Least squares'},{lecture:6,page:5,note:'随机成本与均值-方差'},{lecture:6,page:6,note:'QCQP 与box约束'},{lecture:6,page:7,note:'SOC 与SOCP形式'},{lecture:6,page:8,note:'SOCP与LP/QCQP关系'},{lecture:6,page:9,note:'两类uncertainty模型'},{lecture:6,page:10,note:'Ellipsoidal robust model'},{lecture:6,page:11,note:'Sup=norm推导'},{lecture:6,page:12,note:'Gaussian chance constraint'},{lecture:6,page:13,note:'CDF与SOC等价变换'},{lecture:4,page:8,note:'投影的一阶最优性基础'}],
    clips:[{file:'2026-09-24_095928',start:3077,end:3551,title:'QP与least squares',note:'曲率矩阵、目标展开与驻点。'},{file:'2026-09-24_095928',start:4173,end:4921,title:'QCQP到二阶锥',note:'二次约束与冰淇淋锥的结构。'},{file:'2026-09-24_095928',start:4834,end:5701,title:'Robust LP的最坏扰动',note:'从椭球中的所有参数压缩到一个范数。'},{file:'2026-09-24_095928',start:6290,end:6721,title:'Gaussian概率安全余量',note:'标准化、CDF反函数与η≥1/2。'}]
  },
  {
    id:'gp-sdp', title:'正变量、矩阵序与多目标取舍', en:'GP, SDP & vector optimization', group:'MODEL',
    summary:'学习三种不同的“换视角”：正变量取log让GP凸化；用特征值理解矩阵不等式；用Pareto前沿和正权标量化处理多个互相冲突的目标。',
    objectives:['区分monomial、posynomial与普通polynomial','把GP逐步变成log-sum-exp凸问题','用谱条件判断PSD并把最大特征值目标改写成LMI','区分minimum与Pareto，并解释严格正权标量化的保证'],
    prereq:['正变量与log的单调性','Log-sum-exp的凸性','对称矩阵特征值与PSD','Proper cone与广义不等式'], labs:['gp','psd','pareto'],
    sections:[
      {
        title:'1 · Monomial不是高中课本里那个“只能整数次幂”的词',
        body:String.raw`<p>GP里的 monomial 是正系数乘上正变量的任意实数次幂。指数可以是负数、分数，也可以是0；因此倒数和平方根都可以出现。正变量的共同定义域非常重要，它让这些运算和后续log变换都有意义。</p><p>Posynomial 是若干monomial的<strong>正项和</strong>。不要与普通polynomial混淆：这里系数必须正，但指数比普通多项式宽松得多。</p>`,
        formula:String.raw`m(x)=c\prod_{j=1}^n x_j^{a_j},\quad c>0,\ a_j\in\mathbb R,\ x\in\mathbb R_{++}^n;\qquad p(x)=\sum_{k=1}^K c_k\prod_jx_j^{a_{kj}},\ c_k>0.`,
        example:String.raw`<ul><li>\(3x_1^{1/2}x_2^{-2}\) 是monomial。</li><li>\(x_1+x_2+2x_1^{-1}x_2\) 是posynomial。</li><li>\(x_1-x_2\) 不是posynomial，因为有负系数项。</li></ul>`,
        pitfall:String.raw`<p>这些名字本身不保证函数在原始x坐标里凸。最简单的 \(x_1x_2\) 就不是联合凸函数。</p>`
      },
      {
        title:'2 · GP允许什么：正项和≤1，单项积=1',
        body:String.raw`<p>Geometric program 的目标是最小化一个posynomial；不等式是posynomial≤1；等式是monomial=1。这里的等式通常不是仿射的，所以原始写法一般不属于标准凸问题。</p><p>它仍然值得识别，因为这种严格的正项结构允许一个通用的凸化过程。建模时先把正的常数除到右侧1，再检查每个等式是否真的只有一个monomial。</p>`,
        formula:String.raw`\begin{aligned}\min_{x\succ0}\quad&f_0(x)\\\text{s.t.}\quad&f_i(x)\le1\quad(f_i\text{ posynomial}),\\&h_j(x)=1\quad(h_j\text{ monomial}).\end{aligned}`,
        example:String.raw`<p>\(x_1+x_2\le5\) 可写成 \(x_1/5+x_2/5\le1\)。\(x_1x_2=2\) 可写成 \(x_1x_2/2=1\)。但 \(x_1+x_2=1\) 是posynomial等式，一般不符合这个GP模板。</p>`,
        details:[{title:'最大化也可能转入GP，但别过度推广',html:String.raw`<p>若要最大化正的monomial m，可等价最小化其倒数 \(1/m\)，它仍是monomial。若最大化的是一般posynomial，它的倒数通常不再是posynomial，不能直接套同一招。</p>`}]
      },
      {
        title:'3 · 第一步：乘法在log坐标里变成加法',
        body:String.raw`<p>设 \(y_j=\log x_j\)，则 \(x_j=e^{y_j}\)。这是正半轴与整个实轴之间的一一映射，恢复原解只需取exp。一个monomial的log随即变成仿射函数。</p><p>这一步不只是对目标取log，还换掉了变量坐标。原先弯曲的乘法关系，在y坐标里可能成为直线；monomial等式因而变成仿射等式。</p>`,
        formula:String.raw`\log m(e^y)=\log c+\sum_j a_jy_j=a^Ty+\log c.`,
        example:String.raw`<p>\(3x_1^{1/2}x_2^{-2}=1\) 变成 \(\log3+\tfrac12y_1-2y_2=0\)。此时 \(y_1,y_2\) 可取任意实数，无需再加 \(y\succ0\)：正性已经由 \(x=e^y\) 自动保证。</p>`,
        pitfall:String.raw`<p>“x必须正”不意味着“log x也必须正”。例如0&lt;x&lt;1时，log x为负，完全合法。</p>`
      },
      {
        title:'4 · 第二步：正项和变成log-sum-exp',
        body:String.raw`<p>对posynomial，每个monomial在新变量下成为一个指数项。再对整项取log，就得到 \(\log\sum\exp\)；这是你在convex function章节见过的凸函数，且与仿射函数复合仍凸。</p><p>因为log严格递增，正目标取log保持最优点；\(f_i(x)\le1\) 则等价于 \(\log f_i(e^y)\le0\)。于是GP在y坐标里具有凸目标、凸不等式和仿射等式，整套结构都齐了。</p>`,
        formula:String.raw`\log p(e^y)=\log\!\left(\sum_{k=1}^K\exp(a_k^Ty+\log c_k)\right).`,
        example:String.raw`<p>\(x_1+x_2\le5\) 变成 \(\log(e^{y_1-\log5}+e^{y_2-\log5})\le0\)。等价式在y坐标是凸约束，尽管正变量空间里的其他GP约束可能看起来很弯曲。</p>`,
        details:[{title:'与softmax有什么联系？',html:String.raw`<p>\(F(z)=\log\sum_k e^{z_k}\) 的梯度是 \(p_k=e^{z_k}/\sum_j e^{z_j}\)。这些正权重总和为1；其Hessian是 \(\operatorname{diag}(p)-pp^T\succeq0\)。这会在后面的熵对偶中重新出现。</p>`}]
      },
      {
        title:'5 · 把一个盒子的最大体积真正写成GP',
        body:String.raw`<p>设盒子的高度、宽度、深度为h,w,d，墙面面积预算a、底面积预算b，同时给定比例界 \(c\le h/w\le e\)、\(f\le d/w\le g\)，所有量都正。最大化体积hwd，先改成最小化倒数。</p><p>接着把每条约束化为posynomial≤1。例如墙面积是一项正项和；比例下界 \(h/w\ge c\) 应改成 \(cw/h\le1\)，而不是把不等号原样留下。每一步都能恢复原变量与原含义。</p>`,
        formula:String.raw`\begin{aligned}\min\quad&h^{-1}w^{-1}d^{-1}\\\text{s.t.}\quad&\tfrac2a hw+\tfrac2a hd\le1,\quad \tfrac1b wd\le1,\\&ch^{-1}w\le1,\quad e^{-1}hw^{-1}\le1,\\&fwd^{-1}\le1,\quad g^{-1}w^{-1}d\le1.\end{aligned}`,
        example:String.raw`<p>再设 \(H=\log h,W=\log w,D=\log d\)，目标的log变成 \(-H-W-D\)。墙面积约束变成两个仿射项的log-sum-exp≤0，比例约束变成线性不等式。现在可以用凸优化方法解，再取exp恢复盒子尺寸。</p>`
      },
      {
        title:'6 · SDP：一个矩阵不等式限制的是所有方向',
        body:String.raw`<p>Semidefinite program 的目标线性，等式仿射，特殊之处是用linear matrix inequality（LMI）代替普通标量不等式。给定对称矩阵 \(F_i,G\)，\(\sum_i x_iF_i+G\preceq0\) 表示这个矩阵在每个方向上的二次型都非正。</p><p>PSD序不是逐元素序。一个矩阵含负的非对角元素仍可PSD；每个元素都正的矩阵也可能有负特征值。你要检查的是谱或二次型。</p>`,
        formula:String.raw`M\succeq0\quad\Longleftrightarrow\quad v^TMv\ge0\ \forall v\quad\Longleftrightarrow\quad\lambda_i(M)\ge0\ \forall i.`,
        example:String.raw`<p>\(\begin{bmatrix}1&-1/2\\-1/2&1\end{bmatrix}\) 的特征值为1/2、3/2，所以PSD。\(\begin{bmatrix}1&2\\2&1\end{bmatrix}\) 每个元素都正，却有特征值−1、3，因此不是PSD。</p>`,
        details:[{title:'2×2矩阵可以直接核算',html:String.raw`<p>对 \(M=\begin{bmatrix}a&c\\c&b\end{bmatrix}\)，特征值为 \(\tfrac12(a+b\pm\sqrt{(a-b)^2+4c^2})\)。PSD等价于 \(a\ge0,b\ge0,ab-c^2\ge0\)；PD则要求严格正的主子式条件。</p>`}]
      },
      {
        title:'7 · 最大特征值目标为什么能写成LMI',
        body:String.raw`<p>设 \(A(x)=A_0+\sum_i x_iA_i\) 是一个仿射对称矩阵函数，想把它最大的特征值尽量压低。先做epigraph：引入上界t，要求 \(\lambda_{\max}(A(x))\le t\)。</p><p>这等价于 \(tI-A(x)\succeq0\)，因为它的各个特征值正好是 \(t-\lambda_i(A(x))\)。右边是关于x和t的LMI，于是整个模型成为标准SDP。</p>`,
        formula:String.raw`\min_x\lambda_{\max}(A(x))\quad\Longleftrightarrow\quad\min_{x,t}t\quad\text{s.t. }A(x)\preceq tI.`,
        example:String.raw`<p>若 \(A(x)=\operatorname{diag}(x,2-x)\)，最大特征值是 \(\max(x,2-x)\)。最优在x=1，两条特征值曲线相交，t=1；LMI写法正是同时限制两条谱方向。</p>`,
        pitfall:String.raw`<p>带LMI的任意凸问题不一定就是“标准SDP”。例如 \(-\log\det X\) 配LMI仍是凸优化，但目标不是线性，不应只因出现PSD约束就称它为标准线性目标SDP。</p>`,
        details:[{title:'为logdet题补一块直觉',html:String.raw`<p>当 \(X\succ0\) 时，\(\det X=\prod_i\lambda_i(X)>0\)，\(\log\det X=\sum_i\log\lambda_i(X)\)。\(-\log\det X\) 在PD域凸，并会在某个特征值趋近0时增大。\(\log\det(X^{-1})=-\log\det X\)，其中负号作用在整个logdet上，而不是单独的det。</p>`}]
      },
      {
        title:'8 · Vector optimization：多个分数不一定能直接排成一列',
        body:String.raw`<p>若目标是 \(f_0(x)=(F_1(x),\ldots,F_q(x))\)，一项更好可能伴随另一项更差。必须先说明如何比较向量。最常见的多目标情形用非负正交锥：\(u\preceq v\) 意味着每个分量都不大于对应分量。</p><p>更一般地，给一个proper cone K，以 \(u\preceq_Kv\iff v-u\in K\) 定义广义序。目标的K-convexity把标量凸函数的弦线不等式换成这个锥序；其余凸不等式与仿射等式的结构继续保留。</p>`,
        formula:String.raw`f(\theta x+(1-\theta)y)\preceq_K\theta f(x)+(1-\theta)f(y),\qquad0\le\theta\le1.`,
        example:String.raw`<p>一个方案耗时2、成本8；另一个耗时5、成本3。若两项都希望小，就不能说其中一个在向量序下绝对优于另一个。把它们压成一个分数前，需要明确取舍偏好。</p>`,
        details:[{title:'Proper cone的条件为何有用？',html:String.raw`<p>课堂使用的proper cone是闭、凸、pointed且有非空内部的锥。Pointed意味着 \(K\cap(-K)=\{0\}\)，排除两个不同向量互相“≤”的矛盾；非空内部让严格改进有清晰含义。</p>`}]
      },
      {
        title:'9 · Minimum与Pareto：全部胜出，还是无法无代价改进？',
        body:String.raw`<p>一个minimum目标向量要不差于<strong>所有</strong>其他可行目标向量；它可能根本不存在。Pareto/minimal的要求弱一些：不存在另一个方案，在每项目标都不差、且至少一项更好。</p><p>Pareto前沿描述真正需要取舍的部分。离开前沿的方案可以被另一个方案无代价改善；前沿上的方案则需要牺牲一项才能改善另一项。</p>`,
        formula:String.raw`x\text{ Pareto optimal}\quad\Longleftrightarrow\quad\nexists\ y\text{ feasible}:\ f_0(y)\preceq_K f_0(x),\ f_0(y)\ne f_0(x).`,
        example:String.raw`<p>在 \(x\in[0,2]\) 上同时最小化 \(F_1=x^2\)、\(F_2=(x-2)^2\)。每个点都Pareto：减小x会改善第一项、恶化第二项；但没有一个点同时把两项都做到最小。</p>`,
        pitfall:String.raw`<p>不能只排除“所有坐标都严格更好”的方案，那是较弱的weak Pareto概念。例如目标(1,0)被(0,0)支配，虽然第二项没有严格改善，它仍不是Pareto。</p>`
      },
      {
        title:'10 · 正权标量化：用偏好选择一个Pareto点',
        body:String.raw`<p>选择权重 \(\lambda\)，把向量目标合成 \(\lambda^Tf_0(x)\)。若每个目标都获得严格正权，那么任何一个加权和最优点必是Pareto：如果有别的方案每项都不差且至少一项更好，它的正权总分就一定更低，产生矛盾。</p><p>一般锥序中，权重取自dual cone的内部。旋转权重就像旋转一条支持超平面，选到不同取舍点；但非凸前沿上的unsupported Pareto点可能永远不会被加权和选中。</p>`,
        formula:String.raw`K^*=\{\lambda:\lambda^Tz\ge0\ \forall z\in K\},\qquad\lambda\in\operatorname{int}K^*,\qquad\min_x\lambda^Tf_0(x).`,
        example:String.raw`<p>上节例子取 \(wF_1+(1-w)F_2\)，\(0<w<1\)，驻点给 \(x^*=2(1-w)\)。w增大时更偏爱第一项，x随之减小；w接近端点时逼近前沿端点。</p>`,
        details:[{title:'为什么要严格正，而不只是非负？',html:String.raw`<p>若一项目标权重为0，模型可能无视它。即使(0,0)可行，权重(0,1)也可能把被支配的(1,0)作为并列最优。严格正权排除这种“忽略目标”的退化。</p>`},{title:'能否找齐所有Pareto点？',html:String.raw`<p>凸问题的目标上像具有支持平面结构，因此标量化能描述广泛的前沿点；但严格正权未必覆盖需要极限权重的端点，非凸前沿还可能有完全不被任何支持平面选中的点。不能无条件声称“调权重一定找齐所有Pareto点”。</p>`}]
      },
      {
        title:'11 · 风险-回报：把多个目标重新连回一个QP',
        body:String.raw`<p>投资组合变量 \(x_i\) 表示分配到第i个资产的比例，\(x\succeq0,\mathbf1^Tx=1\)。期望回报 \(\bar p^Tx\) 想要大，回报方差 \(x^T\Sigma x\) 想要小。统一为最小化时，把第一项取负。</p><p>取正的风险权重γ，就得到一个凸QP。调γ并不是“数学上找更正确的唯一目标”，而是在改变你对风险与回报的偏好。每次固定γ后，再把那个标量问题解好。</p>`,
        formula:String.raw`\begin{aligned}\min_x\quad&-\bar p^Tx+\gamma x^T\Sigma x,\qquad\gamma>0,\\\text{s.t.}\quad&\mathbf1^Tx=1,\ x\succeq0,\qquad\Sigma\succeq0.\end{aligned}`,
        example:String.raw`<p>若一个资产平均回报更高但波动也大，γ较小时可能更偏重它；γ较大时可能转向低方差或分散配置。具体结果仍依赖协方差：不是单看每个资产自己的方差就能决定组合风险。</p>`
      }
    ],
    quiz:[
      {id:'gpsdp-q1',q:String.raw`<p>哪一项是GP意义下的monomial？</p>`,options:[String.raw`\(x_1-x_2\)`,String.raw`\(3x_1^{1/2}x_2^{-2}\)，定义在正变量域`,String.raw`\(-2x_1x_2\)`],answer:1,explanation:String.raw`<p>Monomial要求正系数，指数可为任意实数，变量严格正。减法和负系数不符合定义。</p>`},
      {id:'gpsdp-q2',q:String.raw`<p>矩阵 \(M=\begin{bmatrix}1&2\\2&1\end{bmatrix}\) 是否PSD？</p>`,options:[String.raw`是，因为每个元素都正`,String.raw`是，因为它对称`,String.raw`不是，因为有特征值−1`],answer:2,explanation:String.raw`<p>沿方向 \((1,-1)\)，二次型为−2。PSD检查所有方向或特征值，既不是元素正性，也不只是对称性。</p>`},
      {id:'gpsdp-q3',q:String.raw`<p>为什么严格正权的加权和最优点一定Pareto？</p>`,options:[String.raw`若另一个方案每项不差且至少一项更好，正权总和会严格下降`,String.raw`加权以后所有目标都变成同一个函数`,String.raw`因为所有Pareto点都必然能用同一组权重得到`],answer:0,explanation:String.raw`<p>这是一个反证：被支配点不可能最小化严格正权总分。它不意味着一组权重能获得全部前沿，也不意味着原目标之间没有冲突。</p>`}
    ],
    sources:[{lecture:6,page:14,note:'Monomial、posynomial、GP'},{lecture:6,page:15,note:'Log坐标凸化'},{lecture:6,page:16,note:'盒体积GP模型'},{lecture:6,page:17,note:'SDP与LMI'},{lecture:6,page:18,note:'最大特征值的epigraph'},{lecture:6,page:19,note:'谱分解推导'},{lecture:6,page:20,note:'Vector optimization'},{lecture:6,page:21,note:'K-convexity'},{lecture:6,page:23,note:'Minimum概念'},{lecture:6,page:24,note:'Pareto/minimal概念'},{lecture:6,page:26,note:'Dual cone与正权标量化'},{lecture:6,page:27,note:'支持型Pareto点'},{lecture:6,page:28,note:'Portfolio scalarization'}],
    clips:[{file:'2026-09-29_095855',start:504,end:1068,title:'GP怎样在log坐标里变凸',note:'Monomial变仿射，posynomial变log-sum-exp。'},{file:'2026-09-29_095855',start:1504,end:2068,title:'LMI与最大特征值目标',note:'区分矩阵谱序与逐元素大小。'},{file:'2026-09-29_095855',start:3950,end:4801,title:'最小元与Pareto前沿',note:'“每项都不差且至少一项更好”才是正确支配判断。'},{file:'2026-09-29_095855',start:5252,end:5820,title:'正权与dual cone',note:'为什么标量化能保证Pareto，以及它的边界。'}]
  }
];
