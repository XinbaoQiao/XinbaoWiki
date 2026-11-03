/** Structured CV content for the public template sample. Replace with your own facts. */
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
  name: 'Your Name',
  pdfLabel: 'resume',
  pdfHref: '/files/your-cv.pdf',
  contact: [
    { href: 'mailto:you@example.com', label: 'you@example.com' },
    { href: 'https://example.com/', label: 'example.com' },
    { href: 'https://github.com/your-username', label: 'GitHub' }
  ],
  sections: {
    education: 'Education',
    experience: 'Experience',
    service: 'Open-Source Contributions and Academic Service',
    publications: 'Selected Publications'
  },
  education: [
    {
      school: 'Example University',
      detail: 'Ph.D. student. Advisor: Example Advisor.',
      when: '2026-present',
      researchAreas: {
        label: 'Research Areas',
        text: 'Sample research summary covering Research Area 1, Research Area 2, and Research Area 3.'
      }
    }
  ],
  experience: [
    {
      title: 'Research Internship @ Example Lab',
      when: '2025',
      brief: 'Sample internship description for the template CV.',
      papers: [
        { label: 'Paper #1', text: 'Sample contribution linked to the example paper page.' }
      ]
    }
  ],
  service: [
    { icon: 'github', href: 'https://github.com/your-username', title: 'Research code releases', detail: 'public sample repositories for template papers.' },
    { icon: 'home', href: 'https://example.com/', title: 'Academic homepage', detail: 'public academic homepage and wiki-style research archive.' }
  ],
  authorshipNote: 'Asterisks (*) denote co-first authorship; daggers denote corresponding authors.',
  publications: [
    {
      number: 1,
      titleParts: [
        { text: 'An Example Paper Title for Your Template', emph: true }
      ],
      authors: 'Your Name, Example Coauthor, Example Advisor.',
      summary: 'A short sample abstract for the template CV publication entry.',
      venue: 'Example Conference 2026.',
      links: [
        { href: 'https://example.com/papers/example-paper', label: 'PDF' }
      ]
    }
  ]
};

const zh: CvDocumentModel = {
  name: '你的名字',
  pdfLabel: '简历',
  pdfHref: '/files/your-cv.pdf',
  contact: [
    { href: 'mailto:you@example.com', label: 'you@example.com' },
    { href: 'https://example.com/', label: 'example.com' },
    { href: 'https://github.com/your-username', label: 'GitHub' }
  ],
  sections: {
    education: '教育经历',
    experience: '研究经历',
    service: '开源贡献与学术服务',
    publications: '代表性论文'
  },
  education: [
    {
      school: '示例大学',
      detail: '博士研究生。导师：示例导师。',
      when: '2026-至今',
      researchAreas: {
        label: '研究方向',
        text: '模板示例：研究方向一、研究方向二与研究方向三。'
      }
    }
  ],
  experience: [
    {
      title: '示例实验室研究实习',
      when: '2025',
      brief: '模板示例实习描述。',
      papers: [
        { label: '论文 #1', text: '与示例论文页对应的贡献说明。' }
      ]
    }
  ],
  service: [
    { icon: 'github', href: 'https://github.com/your-username', title: '研究代码发布', detail: '模板论文相关的示例公开仓库。' },
    { icon: 'home', href: 'https://example.com/', title: '学术主页', detail: '公开学术主页与维基式研究归档。' }
  ],
  authorshipNote: '星号（*）表示共同一作；剑号表示通讯作者。',
  publications: [
    {
      number: 1,
      titleParts: [
        { text: 'An Example Paper Title for Your Template', emph: true }
      ],
      authors: '你的名字、示例合作者、示例导师。',
      summary: '模板 CV 论文条目的简短摘要。',
      venue: 'Example Conference 2026.',
      links: [
        { href: 'https://example.com/papers/example-paper', label: 'PDF' }
      ]
    }
  ]
};

export function getCvDocument(language: CvLanguage): CvDocumentModel {
  return language === 'zh' ? zh : en;
}