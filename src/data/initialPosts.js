// ============================================================================
// INITIAL SEED POSTS FOR SCHOLARIA
// Realistic academic feed across Research, Articles, Reviews, Notes, Issues
// ============================================================================

export const INITIAL_POSTS = [
  {
    id: "post_1",
    authorId: "usr_thorne",
    authorName: "Prof. Marcus Thorne",
    authorUsername: "m_thorne",
    authorRole: "Associate Professor of Computational Neuroscience & AI",
    authorInstitution: "Massachusetts Institute of Technology (MIT)",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    category: "research",
    categoryLabel: "Research",
    publishedAt: "3 hours ago",
    readingTime: "12 min read",
    title: "Emergent Symbolic Reasoning in Deep Multi-Agent Architectures: A Pre-registration Study",
    preview: "We investigate whether sparse inductive priors in multi-agent communicative loops induce compositional semantic abstraction without explicit grammatical supervision. Our preliminary empirical findings indicate a 34% acceleration in latent cross-modal transfer.",
    content: `### Executive Summary & Motivation

Recent advances in foundation models have demonstrated remarkable in-context reasoning capabilities; however, the mechanisms underlying emergent symbolic representations remain intensely debated. In this investigation, we pre-register a controlled experimental paradigm evaluating multi-agent communicative games.

### Methodology & Network Topologies

We instantiate clusters of 32 transformer-based autonomous agents situated within an asymmetric partially observable Markov decision process (POMDP). Crucially, agents communicate over a discrete bottleneck channel limited to 64 discrete tokens.

1. **Topology Formulation**: Hierarchical bipartite communicative graphs.
2. **Loss Formulation**: Joint task objective combined with an information-theoretic mutual information regularizer.
3. **Evaluation Metric**: Structural consistency against formal lambda-calculus representations.

### Key Empirical Findings

Our quantitative evaluation across 1,000 trial trajectories demonstrates:
- A spontaneous emergence of compositional noun-modifier bindings without auxiliary grammatical loss.
- High resilience to catastrophic forgetting when expanding environmental state spaces.
- Statistically significant improvements in transfer efficiency ($p < 0.001$).`,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
    researchData: {
      abstract: "This paper presents a formal investigation into emergent compositional semantics within collaborative transformer multi-agent societies. By constraining inter-agent bandwidth with discrete information bottlenecks, we show that agents develop syntactically structured communication protocols that map onto symbolic formalisms.",
      field: "Computational Linguistics & Autonomous Agents",
      keywords: ["Multi-Agent AI", "Emergent Communication", "Symbolic Reasoning", "Information Bottleneck", "Transformers"],
      doi: "10.1038/s41586-026-0924-x",
      citations: [
        "Foerster, J., et al. (2016). Learning to Communicate with Deep Multi-Agent Reinforcement Learning. NeurIPS.",
        "Kharitonov, E., et al. (2020). Emergent Language Generalization: An Empirical Investigation. ICLR.",
        "Thorne, M., & Vance, E. (2025). Topologies of Semantic Latents in Distributed Systems. Scholaria Preprints."
      ]
    },
    likesCount: 142,
    isLiked: false,
    repostsCount: 38,
    isReposted: false,
    saved: true,
    isFeatured: true,
    commentsCount: 14,
    comments: [
      {
        id: "c_1",
        authorName: "Dr. Evelyn Vance",
        authorUsername: "evelyn_vance",
        authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
        authorInstitution: "University of Oxford",
        createdAt: "2 hours ago",
        text: "Marcus, this discrete bottleneck approach is fascinating. Have you observed any phase transitions in the vocabulary entropy as agent swarm density scales beyond 64 nodes?",
        replies: [
          {
            id: "r_1",
            authorName: "Prof. Marcus Thorne",
            authorUsername: "m_thorne",
            authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            createdAt: "1 hour ago",
            text: "Excellent question Evelyn. Yes, right around N=48 we see a sharp bifurcation where homophonic tokens are purged in favor of strict compositional suffixes. We are releasing the code and telemetry data next week!"
          }
        ]
      },
      {
        id: "c_2",
        authorName: "Aria Chen",
        authorUsername: "aria_chen",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
        authorInstitution: "Stanford University",
        createdAt: "45 minutes ago",
        text: "The parallel to natural human creolization is striking! I will cite this in chapter 3 of my doctoral dissertation.",
        replies: []
      }
    ]
  },
  {
    id: "post_2",
    authorId: "usr_vance",
    authorName: "Dr. Evelyn Vance",
    authorUsername: "evelyn_vance",
    authorRole: "Senior Research Fellow in Quantum & Ethics",
    authorInstitution: "University of Oxford",
    authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    category: "book_review",
    categoryLabel: "Book Review",
    publishedAt: "5 hours ago",
    readingTime: "7 min read",
    title: "Re-Reading Newton's Principia in the Age of High-Energy Physics: Lessons for Modern Experimentalists",
    preview: "When we open Isaac Newton's Philosophiae Naturalis Principia Mathematica in 2026, we do not read it for outmoded gravitational equations—we read it for the purest masterclass in empirical deduction ever committed to print.",
    content: `When Sir Isaac Newton formulated the three universal laws of motion in 1687, he was not merely calculating orbits; he was dismantling centuries of scholastic dogma and substituting verifiable, falsifiable geometry.

### The Problem of Premature Abstraction

In contemporary physics, experimentalists frequently lament the proliferation of mathematical models that lack experimental testability. String theory landscapes and fine-tuned multiverses often threaten to drift away from physical verification.

Returning to Newton's *Axioms*, one is immediately grounded by the rigorous parsimony of his prose:

> *"Every body continues in its state of rest, or of uniform motion in a right line, unless it is compelled to change that state by forces impressed upon it."*

No superfluous adjectives. No decorative speculation. Every subsequent lemma flows strictly from observable phenomena.

### Why Every Student Needs Primary Sources

Reading summaries of classic physics in modern textbooks turns Newton into a two-dimensional icon on a chapter heading. When you sit with the unabridged text in the Scholaria reader, you witness the raw intellectual struggle of a mind forging the calculus necessary to describe the universe.

I encourage every undergraduate in physics and engineering to spend at least one week with Newton's original proofs.`,
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1000&q=80",
    likesCount: 289,
    isLiked: true,
    repostsCount: 64,
    isReposted: false,
    saved: true,
    isFeatured: true,
    commentsCount: 9,
    comments: [
      {
        id: "c_3",
        authorName: "Dr. Tariq Al-Mansoor",
        authorUsername: "tariq_edu",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
        authorInstitution: "University of Cambridge",
        createdAt: "3 hours ago",
        text: "Could not agree more, Evelyn. This aligns with what we teach in Cambridge's history of science curriculum. Reading secondary digests removes the fertile doubts and ambiguities that make genuine scientific discovery possible.",
        replies: []
      }
    ]
  },
  {
    id: "post_3",
    authorId: "usr_almansoor",
    authorName: "Dr. Tariq Al-Mansoor",
    authorUsername: "tariq_edu",
    authorRole: "Chair of Epistemic Studies",
    authorInstitution: "University of Cambridge",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    category: "article",
    categoryLabel: "Article",
    publishedAt: "8 hours ago",
    readingTime: "9 min read",
    title: "Why the Public Domain is the True Bedrock of Global Academic Equity",
    preview: "Paywalled scientific journals and exorbitant textbook monopolies continue to disenfranchise talented scholars across the Global South. Open access and digital public domain archives are not a luxury—they are an ethical imperative.",
    content: `Knowledge is the only resource that multiplies when it is shared without commercial rent-seeking.

For over three decades, international academic publishing has operated under an extractive economic model: universities pay researchers with public grants, faculty review and edit manuscripts without compensation, and commercial publishing oligarchs lock the resulting peer-reviewed papers behind \$45-per-article paywalls.

### The Moral Case for Open Preservation

When a high school student in Nairobi or an undergraduate in Lima wants to study Plato's *Republic*, Adam Smith's *Wealth of Nations*, or Mary Wollstonecraft's *Rights of Woman*, they should not encounter subscription walls, tracking cookies, or pirated PDF spam.

Scholaria's commitment to hosting over 500 foundational public domain works with zero advertising and browser-first reading is a vital step toward restoring the digital commons.

### The Three Pillars of Academic Equity:

1. **Universal Text Access**: Foundational literature belongs to humanity, not private copyright trusts.
2. **Transparent Open Peer Review**: Replacing anonymous gatekeeping with collegial, attributed discourse.
3. **Credit for Mentorship and Reading**: Validating deep sustained reading habits rather than vanity social metrics.`,
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=80",
    likesCount: 512,
    isLiked: false,
    repostsCount: 120,
    isReposted: false,
    saved: true,
    isFeatured: true,
    commentsCount: 22,
    comments: []
  },
  {
    id: "post_4",
    authorId: "usr_chen",
    authorName: "Aria Chen",
    authorUsername: "aria_chen",
    authorRole: "PhD Candidate in Linguistics & Symbolic Systems",
    authorInstitution: "Stanford University",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
    category: "study_notes",
    categoryLabel: "Study Notes",
    publishedAt: "1 day ago",
    readingTime: "5 min read",
    title: "Core Mathematical Foundations of Variational Inference: Intuition & Clean Derivations",
    preview: "Struggling with the Evidence Lower Bound (ELBO)? Here is my annotated derivation breakdown from CS228, connecting Jensen's inequality directly to KL divergence minimization in 4 concise steps.",
    content: `### Intuition First

In Bayesian machine learning, our goal is almost always to compute the posterior $p(z|x) = \\frac{p(x, z)}{p(x)}$. However, the evidence $p(x) = \\int p(x, z) dz$ is frequently intractable due to high dimensionality.

Instead of computing the exact posterior, Variational Inference posits an easily tractable family of distributions $q(z)$ and optimizes its parameters to minimize the difference between $q(z)$ and $p(z|x)$.

### Step 1: The KL Divergence Definition
$$\\text{KL}(q(z) \\parallel p(z|x)) = \\mathbb{E}_q\\left[\\log \\frac{q(z)}{p(z|x)}\\right]$$

### Step 2: Expanding the Conditional
Using Bayes theorem inside the logarithm:
$$\\log p(z|x) = \\log p(x, z) - \\log p(x)$$

### Step 3: Isolating the Marginal Evidence $\\log p(x)$
$$\\log p(x) = \\mathbb{E}_q\\left[\\log \\frac{p(x, z)}{q(z)}\\right] + \\text{KL}(q(z) \\parallel p(z|x))$$

Since the KL divergence is strictly non-negative (Gibbs' inequality), the first expectation term serves as a rigorous lower bound on the true log likelihood:
$$\\text{ELBO}(q) = \\mathbb{E}_q[\\log p(x, z)] - \\mathbb{E}_q[\\log q(z)]$$

Maximize the ELBO $\\implies$ Minimize the divergence!`,
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1000&q=80",
    likesCount: 310,
    isLiked: false,
    repostsCount: 78,
    isReposted: false,
    saved: false,
    isFeatured: false,
    commentsCount: 16,
    comments: []
  },
  {
    id: "post_5",
    authorId: "usr_rostova",
    authorName: "Dr. Elena Rostova",
    authorUsername: "elena_rostova",
    authorRole: "Senior Fellow in Environmental Economics",
    authorInstitution: "ETH Zürich",
    authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    category: "university_issue",
    categoryLabel: "University Issue",
    publishedAt: "2 days ago",
    readingTime: "6 min read",
    title: "Rethinking the Tenure Track: How Journal Impact Factors Stifle High-Risk Interdisciplinary Science",
    preview: "Early-career faculty are systematically incentivized to publish incremental adjustments in siloed journals rather than tackling risky, transformative problems that cross multiple scientific boundaries.",
    content: `A quiet crisis is permeating university departments worldwide. As promotion and tenure committees increasingly rely on simplistic algorithmic metrics—h-indices, impact factors, and citation percentiles—they inadvertently select for risk-averse scholarship.

### The Cost of Metricization

When Goodhart's law takes hold, the measure ceases to be a good measure. Postdoctoral fellows frequently choose safe follow-up experiments with guaranteed 6-month turnaround over multi-year empirical investigations that might yield null results or take 4 years to bear fruit.

### Proposed Structural Reforms:

- **Portfolio-Based Review**: Limiting tenure evaluation to the candidate's 5 best self-selected works, reviewed for qualitative rigor and reproducibility.
- **Credit for Open Datasets**: Valuing verified open-access repositories and educational software tools on equal footing with paper publications.
- **Interdisciplinary Safeguards**: Ensuring cross-departmental tenure committees so innovative work isn't penalized for failing to fit a single traditional discipline.`,
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1000&q=80",
    likesCount: 421,
    isLiked: false,
    repostsCount: 95,
    isReposted: false,
    saved: false,
    isFeatured: false,
    commentsCount: 31,
    comments: []
  },
  {
    id: "post_6",
    isRepost: true,
    repostedBy: {
      id: "usr_chen",
      name: "Aria Chen",
      username: "aria_chen",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
      repostComment: "Essential reading for anyone working in philosophy of mind or computational linguistics! Evelyn's analysis of Newton's method is remarkably clear.",
      repostedAt: "1 day ago"
    },
    // Original Post data preserved with full attribution
    id: "post_6_orig_post_2",
    authorId: "usr_vance",
    authorName: "Dr. Evelyn Vance",
    authorUsername: "evelyn_vance",
    authorRole: "Senior Research Fellow in Quantum & Ethics",
    authorInstitution: "University of Oxford",
    authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    category: "book_review",
    categoryLabel: "Book Review",
    publishedAt: "5 hours ago",
    readingTime: "7 min read",
    title: "Re-Reading Newton's Principia in the Age of High-Energy Physics: Lessons for Modern Experimentalists",
    preview: "When we open Isaac Newton's Philosophiae Naturalis Principia Mathematica in 2026, we do not read it for outmoded gravitational equations—we read it for the purest masterclass in empirical deduction ever committed to print.",
    content: `When Sir Isaac Newton formulated the three universal laws of motion in 1687, he was not merely calculating orbits; he was dismantling centuries of scholastic dogma and substituting verifiable, falsifiable geometry...`,
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1000&q=80",
    likesCount: 289,
    isLiked: true,
    repostsCount: 64,
    isReposted: true,
    saved: true,
    commentsCount: 9,
    comments: []
  }
];
