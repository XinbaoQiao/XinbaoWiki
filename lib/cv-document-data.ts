/** Structured CV content aligned with public/files/XinbaoQiao_CV.pdf / CV.tex. */
export type CvLanguage = 'en' | 'zh';

export type CvLink = { href: string; label: string };

export type CvEducation = {
  school: string;
  detail: string;
  when: string;
  researchAreas?: { label: string; text: string };
};

export type CvPaperBullet = { label: string; text: string };

export type CvExperience = {
  title: string;
  when: string;
  brief: string;
  papers: CvPaperBullet[];
};

export type CvService = {
  icon: 'github' | 'home' | 'scholar';
  href?: string;
  title: string;
  detail: string;
  titleHref?: string;
};

export type CvPublication = {
  number: number;
  titleParts: Array<{ text: string; emph?: boolean }>;
  authors: string;
  summary: string;
  venue: string;
  links: CvLink[];
};

export type CvDocumentModel = {
  name: string;
  pdfLabel: string;
  pdfHref: string;
  contact: CvLink[];
  sections: {
    education: string;
    experience: string;
    service: string;
    publications: string;
  };
  education: CvEducation[];
  experience: CvExperience[];
  service: CvService[];
  authorshipNote: string;
  publications: CvPublication[];
};

const en: CvDocumentModel = {
  name: 'Xinbao Qiao',
  pdfLabel: 'résumé',
  pdfHref: '/files/XinbaoQiao_CV.pdf',
  contact: [
    { href: 'tel:+85270141618', label: '+852-70141618' },
    { href: 'mailto:xinbaoqiao@link.cuhk.edu.hk', label: 'xinbaoqiao@link.cuhk.edu.hk' },
    { href: 'https://xinbaopedia.top/', label: 'xinbaopedia.top' },
    { href: 'https://github.com/XinbaoQiao', label: 'GitHub' },
    { href: 'https://www.linkedin.com/in/xinbaoqiao/', label: 'LinkedIn' },
    { href: 'https://scholar.google.com/citations?view_op=search_authors&mauthors=Xinbao+Qiao', label: 'Scholar' }
  ],
  sections: {
    education: 'Education',
    experience: 'Experience',
    service: 'Open-Source Contributions and Academic Service',
    publications: 'Selected Publications'
  },
  education: [
    {
      school: 'The Chinese University of Hong Kong',
      detail: 'Ph.D., Information Engineering. Advisor: Angela Yingjun Zhang.',
      when: 'Aug 2026∼present',
      researchAreas: {
        label: 'Research Areas',
        text: 'My research primarily studies lifecycle management of data in AI models, focusing on theoretical methods and practical problems that arise as data are acquired, used, and deleted. My recent work aims to improve the reliability, interpretability, and controllability of AI models in heterogeneous, computation-constrained, and communication-constrained environments.'
      }
    },
    {
      school: 'Zhejiang University',
      detail: 'M.Eng. in Artificial Intelligence. Advised by Meng Zhang.',
      when: 'Zhejiang. Sep 2022 ∼ Dec 2025'
    },
    {
      school: 'Shandong University',
      detail: 'B.Eng. in Communication Engineering.',
      when: 'Shandong. Sep 2018 ∼ Jul 2022'
    }
  ],
  experience: [
    {
      title: 'Doctoral Research @ The Chinese University of Hong Kong',
      when: 'Hong Kong. Aug 2026 ∼ present',
      brief: 'Investigates data lifecycle management in distributed AI across acquisition, use, deletion, and federated learning.',
      papers: [
        { label: 'Paper #6', text: 'Proposed optimal-transport federated learning with barycentric multi-prototype classification.' }
      ]
    },
    {
      title: "Master's Research on Data-Centric ML Systems @ Zhejiang University",
      when: 'Zhejiang. Mar 2023 ∼ Dec 2025',
      brief: 'Developed data-deletion methods for continuous influence control, certified online removal, and dynamic tree ensembles.',
      papers: [
        { label: 'Paper #3', text: 'Extended machine unlearning beyond binary erasure through continuous example weights, enabling targeted fairness and robustness interventions.' },
        { label: 'Paper #4', text: 'Built Hessian-free online certified unlearning with recollected trajectory statistics, replacing explicit Hessian inversion for streaming deletion requests.' },
        { label: 'Paper #5', text: 'Built exact dynamic random-forest unlearning through affected-tree updates, avoiding full retraining.' }
      ]
    },
    {
      title: 'Research Internship on Trustworthy LLM Systems @ NUSRI CQ',
      when: 'Chongqing. Jun 2025 ∼ Dec 2025',
      brief: 'Studied LLM reliability in synthetic-data feedback loops and unsupported relational inference.',
      papers: [
        { label: 'Paper #1', text: 'Showed how low-resource verification amplifies sample-selection bias in recursive synthetic-data training, persistently pruning tail data and precipitating model collapse.' },
        { label: 'Paper #2', text: 'Compared LLM and human illusory pattern perception across three psychological tasks and analyzed associated SAE features.' }
      ]
    }
  ],
  service: [
    { icon: 'github', href: 'https://github.com/XinbaoQiao', title: 'Research code releases', detail: 'public code for certified unlearning, soft-weighted unlearning, and model-collapse work.' },
    { icon: 'home', href: 'https://xinbaopedia.top/', title: 'Xinbaopedia', detail: 'public academic homepage and wiki-style research archive with papers, figures, CV, and project notes.' },
    { icon: 'scholar', title: 'Academic service, 2026', detail: 'reviewer for ICML, NeurIPS, and AAAI; NeurIPS 2026 Top Reviewer.', titleHref: '/files/NeurIPS2026_TopReviewer_XinbaoQiao.pdf' },
    { icon: 'scholar', title: 'Academic service, 2025', detail: 'reviewer for NeurIPS, ICLR, AAAI, and IEEE TNNLS.' }
  ],
  authorshipNote: 'Asterisks (*) denote co-first authorship; daggers (†) denote corresponding authors.',
  publications: [
    {
      number: 1,
      titleParts: [
        { text: 'When ' }, { text: 'Sample Selection Bias', emph: true }, { text: ' Precipitates ' }, { text: 'Model Collapse', emph: true }
      ],
      authors: 'Xinbao Qiao†, Xianglong Du, Wei Liu, Jingqi Zhang, Peihua Mai, Meng Zhang†, Yan Pang†',
      summary: 'Shows how low-resource verification turns selection bias into persistent tail pruning and model collapse.',
      venue: 'ICML 2026.',
      links: [
        { href: 'https://openreview.net/forum?id=FFXvnzM254', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2606.13732', label: 'arXiv' },
        { href: 'https://github.com/XinbaoQiao/When-Sample-Selection-Bias-Precipitates-Model-Collapse', label: 'Code (GitHub)' }
      ]
    },
    {
      number: 2,
      titleParts: [
        { text: 'Illusory Pattern Perception', emph: true }, { text: ' Drives Spurious Inference in Large Language Models' }
      ],
      authors: 'Peihua Mai*, Zhuoyan Shao*, Xinbao Qiao*, Meng Zhang, Xinyue Zhou†, Yan Pang†',
      summary: 'Compares LLM and human illusory pattern perception with SAE analysis of associated features.',
      venue: 'NeurIPS 2026.',
      links: [
        { href: 'https://openreview.net/forum?id=VLcmdFfRQc', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2610.07791', label: 'arXiv' },
        { href: 'https://github.com/NusIoraPrivacy/illusory', label: 'Code (GitHub)' }
      ]
    },
    {
      number: 3,
      titleParts: [
        { text: 'Beyond Binary Erasure: ' }, { text: 'Soft-Weighted Unlearning', emph: true }, { text: ' for Fairness and Robustness' }
      ],
      authors: 'Xinbao Qiao, Ningning Ding, Yushi Cheng, Meng Zhang†',
      summary: 'Generalizes binary deletion into continuous influence control for targeted fairness and robustness interventions.',
      venue: 'AAAI 2026.',
      links: [
        { href: 'https://openreview.net/forum?id=bCPJ6Jiqv7', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2505.18783', label: 'arXiv' },
        { href: 'https://ojs.aaai.org/index.php/AAAI/article/view/39681', label: 'Publisher' }
      ]
    },
    {
      number: 4,
      titleParts: [
        { text: 'Hessian-Free', emph: true }, { text: ' Online Certified Unlearning' }
      ],
      authors: 'Xinbao Qiao, Meng Zhang†, Ming Tang, Ermin Wei',
      summary: 'Replaces explicit Hessian inversion with recollected trajectory statistics for scalable certified deletion.',
      venue: 'ICLR 2025.',
      links: [
        { href: 'https://openreview.net/forum?id=C3TrHWanh5', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2404.01712', label: 'arXiv' },
        { href: 'https://github.com/XinbaoQiao/Hessian-Free-Certified-Unlearning', label: 'Code (GitHub)' }
      ]
    },
    {
      number: 5,
      titleParts: [
        { text: 'DynFrs', emph: true }, { text: ': An Efficient Framework for Machine Unlearning in Random Forest' }
      ],
      authors: 'Shurong Wang, Zhuoyang Shen, Xinbao Qiao, Tongning Zhang, Meng Zhang†',
      summary: 'Updates affected tree statistics to deliver exact random-forest unlearning in dynamic environments.',
      venue: 'ICLR 2025.',
      links: [
        { href: 'https://openreview.net/forum?id=nsCOeCLR8e', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2410.01588', label: 'arXiv' },
        { href: 'https://github.com/shurongwang/DynFrs', label: 'Code (GitHub)' }
      ]
    },
    {
      number: 6,
      titleParts: [
        { text: 'Federated Learning as Optimal Transport', emph: true }, { text: ': Barycentric Multi-Prototype Classification' }
      ],
      authors: 'Xinbao Qiao, Wenjing Yan†, Ying-Jun Angela Zhang',
      summary: 'Frames federated learning as optimal transport with barycentric multi-prototype classification under communication constraints.',
      venue: 'Under review.',
      links: []
    },
    {
      number: 7,
      titleParts: [
        { text: 'Decentralized Free-Support Wasserstein Barycenter', emph: true }
      ],
      authors: 'Xinbao Qiao, Bokai Hou, Peihua Mai, Wenqian Li, Wenjing Yan, Ying-Jun Angela Zhang',
      summary: 'Learns movable barycenter supports through neighbor gossip, separating geometric quality from network agreement.',
      venue: 'Under review.',
      links: []
    }
  ]
};

const zh: CvDocumentModel = {
  name: '乔鑫宝',
  pdfLabel: 'résumé',
  pdfHref: '/files/XinbaoQiao_CV.pdf',
  contact: [
    { href: 'tel:+85270141618', label: '+852-70141618' },
    { href: 'mailto:xinbaoqiao@link.cuhk.edu.hk', label: 'xinbaoqiao@link.cuhk.edu.hk' },
    { href: 'https://xinbaopedia.top/', label: 'xinbaopedia.top' },
    { href: 'https://github.com/XinbaoQiao', label: 'GitHub' },
    { href: 'https://www.linkedin.com/in/xinbaoqiao/', label: 'LinkedIn' },
    { href: 'https://scholar.google.com/citations?view_op=search_authors&mauthors=Xinbao+Qiao', label: 'Scholar' }
  ],
  sections: {
    education: '教育经历',
    experience: '研究经历',
    service: '开源贡献与学术服务',
    publications: '精选论文'
  },
  education: [
    {
      school: '香港中文大学',
      detail: '信息工程博士。导师：张颖珺。',
      when: '2026年8月∼至今',
      researchAreas: {
        label: '研究方向',
        text: '我的研究主要关注 AI 模型中数据的生命周期管理，重点研究数据在获取、使用和删除过程中产生的理论方法与实际问题。近期工作旨在提升异构、计算受限与通信受限环境中 AI 模型的可靠性、可解释性与可控性。'
      }
    },
    {
      school: '浙江大学',
      detail: '人工智能工学硕士。导师：张萌。',
      when: '浙江。2022年9月 ∼ 2025年12月'
    },
    {
      school: '山东大学',
      detail: '通信工程工学学士。',
      when: '山东。2018年9月 ∼ 2022年7月'
    }
  ],
  experience: [
    {
      title: '博士阶段研究 @ 香港中文大学',
      when: '香港。2026年8月 ∼ 至今',
      brief: '研究分布式 AI 中数据生命周期管理，覆盖获取、使用、删除与联邦学习。',
      papers: [
        { label: 'Paper #6', text: '提出面向通信受限设置的最优传输联邦学习与 barycentric multi-prototype classification。' }
      ]
    },
    {
      title: '硕士阶段的数据中心机器学习系统研究 @ 浙江大学',
      when: '浙江。2023年3月 ∼ 2025年12月',
      brief: '构建面向连续影响控制、在线认证删除与动态树集成的数据删除方法。',
      papers: [
        { label: 'Paper #3', text: '将机器遗忘从二元删除扩展为连续样本权重，支持针对性的公平性与鲁棒性干预。' },
        { label: 'Paper #4', text: '基于 recollected trajectory statistics 构建无 Hessian 在线认证遗忘，替代显式 Hessian 求逆以服务流式删除请求。' },
        { label: 'Paper #5', text: '通过更新受影响树统计量实现动态随机森林的精确遗忘，避免全量重训。' }
      ]
    },
    {
      title: '可信 LLM 系统科研实习 @ NUSRI CQ',
      when: '重庆。2025年6月 ∼ 2025年12月',
      brief: '研究合成数据反馈回路与缺乏支持的关系推断中的 LLM 可靠性问题。',
      papers: [
        { label: 'Paper #1', text: '说明低资源验证如何放大递归合成数据训练中的样本选择偏差，持续剪除尾部数据并诱发模型坍缩。' },
        { label: 'Paper #2', text: '通过三个心理任务比较 LLM 与人类的错觉模式感知，并分析相关 SAE 特征。' }
      ]
    }
  ],
  service: [
    { icon: 'github', href: 'https://github.com/XinbaoQiao', title: '研究代码发布', detail: '公开认证遗忘、软加权遗忘与模型坍缩相关代码。' },
    { icon: 'home', href: 'https://xinbaopedia.top/', title: 'Xinbaopedia', detail: '公开学术主页与 wiki 式研究档案，含论文、图表、CV 与项目记录。' },
    { icon: 'scholar', title: '学术审稿，2026 年', detail: '担任 ICML、NeurIPS 和 AAAI 审稿人；NeurIPS 2026 Top Reviewer。', titleHref: '/files/NeurIPS2026_TopReviewer_XinbaoQiao.pdf' },
    { icon: 'scholar', title: '学术审稿，2025 年', detail: '担任 NeurIPS、ICLR、AAAI 和 IEEE TNNLS 审稿人。' }
  ],
  authorshipNote: '星号（*）表示共同第一作者；剑号（†）表示通讯作者。',
  publications: [
    {
      number: 1,
      titleParts: [
        { text: 'When ' }, { text: 'Sample Selection Bias', emph: true }, { text: ' Precipitates ' }, { text: 'Model Collapse', emph: true }
      ],
      authors: '乔鑫宝†、杜相龙、刘巍、张婧琦、麦佩华、张萌†、庞严†',
      summary: '说明低资源验证如何把选择偏差转化为持续的尾部剪除与模型坍缩。',
      venue: 'ICML 2026.',
      links: [
        { href: 'https://openreview.net/forum?id=FFXvnzM254', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2606.13732', label: 'arXiv' },
        { href: 'https://github.com/XinbaoQiao/When-Sample-Selection-Bias-Precipitates-Model-Collapse', label: 'Code (GitHub)' }
      ]
    },
    {
      number: 2,
      titleParts: [
        { text: 'Illusory Pattern Perception', emph: true }, { text: ' Drives Spurious Inference in Large Language Models' }
      ],
      authors: '麦佩华*、邵卓妍*、乔鑫宝*、张萌、周欣悅†、庞严†',
      summary: '比较 LLM 与人类的错觉模式感知，并用 SAE 分析相关特征。',
      venue: 'NeurIPS 2026.',
      links: [
        { href: 'https://openreview.net/forum?id=VLcmdFfRQc', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2610.07791', label: 'arXiv' },
        { href: 'https://github.com/NusIoraPrivacy/illusory', label: 'Code (GitHub)' }
      ]
    },
    {
      number: 3,
      titleParts: [
        { text: 'Beyond Binary Erasure: ' }, { text: 'Soft-Weighted Unlearning', emph: true }, { text: ' for Fairness and Robustness' }
      ],
      authors: '乔鑫宝、丁宁宁、程雨诗、张萌†',
      summary: '将二元删除推广为连续影响控制，以支持针对性的公平性与鲁棒性干预。',
      venue: 'AAAI 2026.',
      links: [
        { href: 'https://openreview.net/forum?id=bCPJ6Jiqv7', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2505.18783', label: 'arXiv' },
        { href: 'https://ojs.aaai.org/index.php/AAAI/article/view/39681', label: 'Publisher' }
      ]
    },
    {
      number: 4,
      titleParts: [
        { text: 'Hessian-Free', emph: true }, { text: ' Online Certified Unlearning' }
      ],
      authors: '乔鑫宝、张萌†、唐茗、魏尔敏',
      summary: '用 recollected trajectory statistics 替代显式 Hessian 求逆，实现可扩展的认证删除。',
      venue: 'ICLR 2025.',
      links: [
        { href: 'https://openreview.net/forum?id=C3TrHWanh5', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2404.01712', label: 'arXiv' },
        { href: 'https://github.com/XinbaoQiao/Hessian-Free-Certified-Unlearning', label: 'Code (GitHub)' }
      ]
    },
    {
      number: 5,
      titleParts: [
        { text: 'DynFrs', emph: true }, { text: ': An Efficient Framework for Machine Unlearning in Random Forest' }
      ],
      authors: '汪树荣、沈卓洋、乔鑫宝、Tongning Zhang、张萌†',
      summary: '通过更新受影响树统计量，在动态环境中实现精确的随机森林遗忘。',
      venue: 'ICLR 2025.',
      links: [
        { href: 'https://openreview.net/forum?id=nsCOeCLR8e', label: 'OpenReview' },
        { href: 'https://arxiv.org/abs/2410.01588', label: 'arXiv' },
        { href: 'https://github.com/shurongwang/DynFrs', label: 'Code (GitHub)' }
      ]
    },
    {
      number: 6,
      titleParts: [
        { text: 'Federated Learning as Optimal Transport', emph: true }, { text: ': Barycentric Multi-Prototype Classification' }
      ],
      authors: '乔鑫宝、闫文静†、张颖珺',
      summary: '在通信约束下，将联邦学习表述为最优传输，并构建 barycentric multi-prototype classification。',
      venue: '在审。',
      links: []
    },
    {
      number: 7,
      titleParts: [
        { text: 'Decentralized Free-Support Wasserstein Barycenter', emph: true }
      ],
      authors: '乔鑫宝、侯博凯、麦佩华、李文倩、闫文静、张颖珺',
      summary: '通过邻居 gossip 学习可移动的 barycenter supports，将几何质量与网络一致性分离。',
      venue: '在审。',
      links: []
    }
  ]
};

export function getCvDocument(language: CvLanguage): CvDocumentModel {
  return language === 'zh' ? zh : en;
}
