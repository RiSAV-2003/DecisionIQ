import { DecisionCategory, DecisionReport, DecisionHistoryRecord } from '@/types/decision';

export const DECISION_CATEGORIES: DecisionCategory[] = [
  {
    id: 'technology',
    title: 'Technology',
    tagline: 'Smarter Tech Decisions for a Brighter Tomorrow',
    description: 'Evaluate hardware, software stacks, dev tools, and emerging tech stacks with objective benchmark synthesis.',
    iconName: 'Cpu',
    accentColor: '#00f0ff',
    gradient: 'from-cyan-500 to-blue-600',
    sampleQuestions: [
      'Which laptop should I buy for AI development and video editing?',
      'Should we migrate our backend from Express to Next.js App Router?',
      'Which cloud database provider offers the best ROI for 1M DAU?'
    ]
  },
  {
    id: 'career',
    title: 'Career',
    tagline: 'Grow Your Career with Smarter Decisions',
    description: 'Compare job offers, skill trajectories, certifications, and high-impact career path shifts.',
    iconName: 'Briefcase',
    accentColor: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-600',
    sampleQuestions: [
      'Which job should I accept: Senior AI Engineer at Series-B vs Staff Developer at Enterprise?',
      'Is pursuing a Master in Computer Science worth the 2-year opportunity cost?',
      'Should I pivot into Machine Learning or DevOps Engineering in 2026?'
    ]
  },
  {
    id: 'finance',
    title: 'Finance',
    tagline: 'Smarter Financial Decisions. A Brighter Tomorrow.',
    description: 'Compare investment vehicles, savings strategies, loan options, and long-term financial allocations.',
    iconName: 'TrendingUp',
    accentColor: '#10b981',
    gradient: 'from-emerald-400 to-teal-600',
    sampleQuestions: [
      'Should I buy a home now with 6.5% interest or rent and invest in index funds?',
      'Which high-yield portfolio allocation fits a 5-year medium risk goal?',
      'Is fixed-rate or adjustable-rate mortgage safer for my current income?'
    ]
  },
  {
    id: 'education',
    title: 'Education',
    tagline: 'Smarter Education. Brighter Futures.',
    description: 'Compare universities, degree programs, bootcamps, online certifications, and scholarship ROI.',
    iconName: 'GraduationCap',
    accentColor: '#8b5cf6',
    gradient: 'from-purple-500 to-violet-600',
    sampleQuestions: [
      'Which university should I choose for Artificial Intelligence studies?',
      'Is a 6-month Full Stack Bootcamp worth it compared to a CS Degree?',
      'Which online platform provides the highest verified industry recognition?'
    ]
  },
  {
    id: 'travel',
    title: 'Travel',
    tagline: 'Plan Better Trips. Explore More.',
    description: 'Compare travel destinations, flight itineraries, seasonal budget allocations, and visa compliance.',
    iconName: 'Compass',
    accentColor: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
    sampleQuestions: [
      'Which city should I visit for a 2-week remote work sabbatical: Tokyo vs Lisbon?',
      'Is flying business class with points better than booking 3 economy trips?',
      'Which digital nomad visa path provides the best tax and quality of life setup?'
    ]
  },
  {
    id: 'business',
    title: 'Business',
    tagline: 'Smarter Business Decisions. Bigger Impact.',
    description: 'Validate startup ideas, market entry strategies, pricing models, and competitive differentiators.',
    iconName: 'Rocket',
    accentColor: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    sampleQuestions: [
      'Which business model is best for an AI decision SaaS: Freemium vs Usage-Based?',
      'Should we bootstrap or pitch pre-seed venture capital in current market?',
      'Which market expansion strategy has lower downside risk for Q3?'
    ]
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    tagline: 'A Better You. Every Day.',
    description: 'Optimize relocation decisions, daily routines, wellness habits, and work-life harmony choices.',
    iconName: 'Heart',
    accentColor: '#06b6d4',
    gradient: 'from-cyan-400 to-sky-600',
    sampleQuestions: [
      'Which city should I move to: Austin, TX vs Seattle, WA for work-life balance?',
      'Which fitness and nutrition regimen fits a demanding founder schedule?',
      'Should I transition to a fully remote work lifestyle or hybrid setup?'
    ]
  },
  {
    id: 'products',
    title: 'Consumer Products',
    tagline: 'Research less. Buy better.',
    description: 'Cross-evaluate consumer hardware, vehicles, appliances, and high-ticket personal investments.',
    iconName: 'ShoppingBag',
    accentColor: '#a855f7',
    gradient: 'from-fuchsia-500 to-purple-600',
    sampleQuestions: [
      'Which electric vehicle provides the best long-term value under $50,000?',
      'Which ergonomic desk chair is best for 10-hour daily coding sessions?',
      'Which OLED monitor should I select for color accuracy and high refresh rate?'
    ]
  }
];

export const MOCK_DECISION_REPORT: DecisionReport = {
  id: 'dec-9842',
  query: 'Which laptop should I buy for AI engineering and mobile development?',
  category: 'technology',
  createdAt: '2026-09-06T18:00:00Z',
  recommendedOptionId: 'opt-macbook-m3',
  overallFitScore: 87,
  confidenceLevel: 'High',
  summaryRationale: 'The Apple MacBook Pro 16-inch (M3 Max, 36GB Unified Memory) offers superior local LLM inference performance, whisper-quiet thermal efficiency, battery endurance exceeding 16 hours, and seamless iOS/Android emulation compilation speeds.',
  criteriaWeights: [
    { id: 'crit-perf', name: 'Performance & Local AI Inference', weight: 40, description: 'GPU VRAM unified bandwidth and multi-core CPU compilation speed.' },
    { id: 'crit-battery', name: 'Battery & Portability', weight: 25, description: 'Real-world unplugged battery longevity under heavy dev workloads.' },
    { id: 'crit-display', name: 'Display & Build Quality', weight: 20, description: 'Display color gamut, thermal throttling resistance, and chassis durability.' },
    { id: 'crit-price', name: 'Price to Value Ratio', weight: 15, description: 'Total outlay relative to longevity and resale retention.' },
  ],
  options: [
    {
      id: 'opt-macbook-m3',
      title: 'Apple MacBook Pro 16" (M3 Max)',
      subtitle: '36GB Unified Memory • 1TB SSD • 40-Core GPU',
      tagline: 'Unmatched local AI bandwidth and battery endurance for heavy dev workflows.',
      fitScore: 87,
      badge: 'RECOMMENDED FIT',
      price: '$3,499',
      highlights: [
        '300 GB/s Unified Memory Bandwidth runs 30B parameter LLMs locally at high t/s',
        'Over 16 hours of unplugged developer usage without CPU throttling',
        'Silent fan noise even under high multi-core Xcode compilation loads'
      ],
      advantages: [
        'Local ML models benefit from unified memory architecture',
        'Best-in-class Liquid Retina XDR 120Hz display for precise UI engineering',
        'High resale value retention over 4-year cycle'
      ],
      disadvantages: [
        'Higher upfront financial investment',
        'Non-upgradable RAM or SSD post-purchase'
      ],
      risks: [
        'CUDA-exclusive library compatibility requires CPU fallback or Docker containers'
      ],
      criterionScores: [
        { criterionId: 'crit-perf', score: 92, note: 'Unified 36GB RAM enables 300GB/s bandwidth for ML models.' },
        { criterionId: 'crit-battery', score: 95, note: '16+ hours unplugged workflow.' },
        { criterionId: 'crit-display', score: 98, note: 'XDR mini-LED panel with 1600 nits peak brightness.' },
        { criterionId: 'crit-price', score: 68, note: 'Premium price point requiring higher upfront capital.' },
      ]
    },
    {
      id: 'opt-dell-xps',
      title: 'Dell XPS 16 (NVIDIA RTX 4070)',
      subtitle: 'Intel Core Ultra 9 • 32GB LPDDR5X • 1TB SSD',
      tagline: 'Native Windows & Linux CUDA hardware acceleration in a sleek chassis.',
      fitScore: 79,
      badge: 'ALTERNATIVE FIT',
      price: '$2,899',
      highlights: [
        'Dedicated RTX 4070 Tensor cores for native PyTorch & CUDA acceleration',
        'Stunning 4K OLED touch display option',
        'Full compatibility with native Linux dual-boot setups'
      ],
      advantages: [
        'Direct CUDA support eliminates Docker translation layer for deep learning',
        'Saves ~$600 compared to equivalent MacBook Pro spec',
        'Standard Windows & Linux dev stack native integration'
      ],
      disadvantages: [
        'Battery drops to ~5-6 hours under sustained CUDA compute workloads',
        'Fan noise and surface temperatures rise under peak thermal load'
      ],
      risks: [
        'Thermal throttling under continuous multi-hour training runs'
      ],
      criterionScores: [
        { criterionId: 'crit-perf', score: 85, note: 'Dedicated CUDA Tensor Cores run PyTorch natively.' },
        { criterionId: 'crit-battery', score: 60, note: 'Heavy battery drain under load (~5.5 hours).' },
        { criterionId: 'crit-display', score: 90, note: '4K OLED panel with vibrant contrast.' },
        { criterionId: 'crit-price', score: 82, note: 'More accessible price for hardware tier.' },
      ]
    }
  ],
  evidenceList: [
    {
      id: 'ev-1',
      claim: 'MacBook Pro M3 Max unified memory bandwidth reaches 300 GB/s, enabling local execution of 30B parameter LLMs at 28 tokens/sec.',
      sourceTitle: 'AnandTech Hardware Deep Dive: M3 Max Memory Subsystem Benchmarks',
      publisher: 'AnandTech Analytics',
      publishDate: '2026-02-14',
      url: 'https://example.com/evidence/m3-max-bandwidth',
      reliability: 'High',
      reliabilityReason: 'Peer-reviewed hardware benchmark suite with reproducible open-source testing methodology.',
      snippet: 'In quantized GGUF LLM benchmarks (llama.cpp), the M3 Max unified memory bus maintained sustained 300GB/s bandwidth.',
      relevanceScore: 96
    }
  ],
  counterEvidence: [
    {
      id: 'cev-1',
      title: 'CUDA Library Dependency Bottleneck for Mac',
      impactLevel: 'Moderate',
      challengePoint: 'If your daily work relies on CUDA-exclusive AI frameworks, running them on Apple Silicon requires Metal translation or cloud GPU instances.',
      alternativeRecommendation: 'If 80%+ of your workflow involves low-level CUDA C++ development, Dell XPS 16 becomes the stronger choice.',
      hiddenRisks: [
        'MPS missing ops fall back to CPU execution in PyTorch',
        'Containerized Linux emulation adds memory overhead'
      ],
      weakAssumptions: [
        'Assumes developer uses standard PyTorch/MLX libraries with native Metal support'
      ]
    }
  ],
  workflowSteps: [
    { id: 'step-1', stageNumber: 1, title: 'Understanding Problem', description: 'Parsed developer requirements.', status: 'completed', durationMs: 400 },
    { id: 'step-2', stageNumber: 2, title: 'Finding Options', description: 'Identified top 3 laptop platforms.', status: 'completed', durationMs: 600 },
    { id: 'step-3', stageNumber: 3, title: 'Researching Sources', description: 'Crawled hardware benchmarks.', status: 'completed', durationMs: 800 },
    { id: 'step-4', stageNumber: 4, title: 'Verifying Evidence', description: 'Cross-checked thermal throttle logs.', status: 'completed', durationMs: 500 },
    { id: 'step-5', stageNumber: 5, title: 'Comparing Options', description: 'Computed weighted scores.', status: 'completed', durationMs: 450 },
    { id: 'step-6', stageNumber: 6, title: 'Calculating Fit', description: 'Scored options accurately.', status: 'completed', durationMs: 300 },
    { id: 'step-7', stageNumber: 7, title: 'Challenging Recommendation', description: 'Ran Counter-Evidence test.', status: 'completed', durationMs: 350 },
    { id: 'step-8', stageNumber: 8, title: 'Finalizing Decision', description: 'Synthesized final decision report.', status: 'completed', durationMs: 200 }
  ]
};

export const MOCK_HISTORY: DecisionHistoryRecord[] = [
  {
    id: 'dec-9842',
    query: 'Which laptop should I buy for AI engineering and mobile development?',
    category: 'technology',
    recommendationTitle: 'Apple MacBook Pro 16" (M3 Max)',
    fitScore: 87,
    date: '2026-09-06',
    status: 'Completed'
  },
  {
    id: 'dec-9820',
    query: 'Which job offer should I accept: Senior AI Engineer vs Lead Product Manager?',
    category: 'career',
    recommendationTitle: 'Senior AI Engineer at Series-B Startup',
    fitScore: 91,
    date: '2026-08-28',
    status: 'Challenged'
  }
];

export const DEMO_STATS = [
  { label: 'Decision Categories', value: '10+', suffix: '', detail: 'Spanning Tech, Career, Finance, Travel, & more' },
  { label: 'Trusted Sources', value: '1,000+', suffix: '', detail: 'Peer-reviewed research & verified benchmark databases' },
  { label: 'Decisions Analyzed', value: '1M+', suffix: '', detail: 'Simulated and evaluated globally' },
  { label: 'User Satisfaction', value: '95%', suffix: '', detail: 'Based on post-decision clarity feedback' },
];
