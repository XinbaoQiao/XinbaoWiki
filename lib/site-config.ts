// Site configuration: the single place to personalise this wiki.
// Everything owner-specific (name, taglines, research areas, chat starters, contact) lives here.
// Values are plain data, so this file is safe to import from server and client components.
// Page slugs must match Markdown files in wiki/ (English) and wiki/*_zh.md (Chinese).

export type ConfigLanguage = 'en' | 'zh';
export type ConfigText = Record<ConfigLanguage, string>;

const env = (value: string | undefined, fallback: string) => value?.trim() || fallback;

/** Your name as shown in the homepage wordmark, metadata and chat copy. */
export const ownerName: ConfigText = {
  en: env(process.env.NEXT_PUBLIC_SITE_OWNER_NAME, 'Your Name'),
  zh: env(process.env.NEXT_PUBLIC_SITE_OWNER_NAME_ZH, '你的名字')
};

export const siteConfig = {
  ownerName,
  /** Small line under the site logo. */
  subtitle: 'The Academic Wiki',
  description: `Explore ${ownerName.en}'s research, publications, and academic journey through a connected bilingual wiki.`,
  /** Public contact address (used by the Email footer link). */
  contactEmail: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, 'you@example.com'),
  /** Footer links, in order. Remove an entry to hide it; add Scholar, ORCID, etc. as needed. */
  footerLinks: [
    { label: 'Email', href: `mailto:${env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, 'you@example.com')}` },
    { label: 'GitHub', href: 'https://github.com/your-username' }
  ],

  /** One motto per colour palette, shown under the homepage wordmark. */
  taglines: {
    text: { en: 'A living wiki of questions, notes, and evidence.', zh: '一部持续生长的问题、笔记与证据之书。' },
    blue: { en: 'To see farther, ask better questions.', zh: '想看得更远，先问得更好。' },
    gold: { en: 'Where curiosity meets evidence, discovery begins.', zh: '好奇与证据相遇，发现由此开始。' },
    rose: { en: 'Ideas grow when they are linked.', zh: '想法在相互链接中生长。' },
    green: { en: 'Learn from the world, one page at a time.', zh: '向世界学习，一页一页地积累。' },
    violet: { en: 'Every page is a question worth keeping.', zh: '每一页，都是值得留下的问题。' },
    charcoal: { en: 'Keep asking; keep the evidence.', zh: '不断追问，保留证据。' }
  },

  /**
   * Research areas: drive the sidebar "Research areas" group and the homepage directory.
   * Add, remove or rename entries; an entry whose page does not exist is skipped, and an empty group is hidden.
   */
  researchAreas: [
    { slug: 'Research_Area_1', label: { en: 'Research Area 1', zh: '研究方向一' } },
    { slug: 'Research_Area_2', label: { en: 'Research Area 2', zh: '研究方向二' } },
    { slug: 'Research_Area_3', label: { en: 'Research Area 3', zh: '研究方向三' } }
  ],
  /** Supporting concept pages listed after the research areas in the homepage directory. */
  concepts: [
    { slug: 'Example_Concept', label: { en: 'Example Concept', zh: '示例概念' } }
  ],
  /** Institutions and people; each list becomes a sidebar group and a directory group (hidden when empty). */
  education: [{ slug: 'Example_University', label: { en: 'Example Univ.', zh: '示例大学' } }],
  experience: [{ slug: 'Example_Lab', label: { en: 'Example Lab', zh: '示例实验室' } }],
  people: [{ slug: 'Example_Advisor', label: { en: 'Example Advisor', zh: '示例导师' } }],
  /** Featured papers in the homepage directory. */
  selectedPublications: ['Example_Paper'],

  /** Chat panel opening line and quick-start buttons. */
  chat: {
    en: {
      greeting: `Hi — welcome! I can walk you through ${ownerName.en}’s public research, papers, projects, or how to get in touch. What would you like to start with?`,
      quickPrompts: [
        { id: 'research', label: 'Research', message: `What are ${ownerName.en}’s research interests?` },
        { id: 'papers', label: 'Papers', message: 'Which papers should I start with?' },
        { id: 'projects', label: 'Projects', message: `What projects has ${ownerName.en} worked on?` },
        { id: 'contact', label: 'Contact', message: `How can I contact ${ownerName.en}?` }
      ]
    },
    zh: {
      greeting: `你好，欢迎！想了解${ownerName.zh}的研究方向、论文、项目，或怎么联系，点下面的按钮或直接问我；我会依据公开页面回答。`,
      quickPrompts: [
        { id: 'research', label: '研究', message: `${ownerName.zh}的研究方向是什么？` },
        { id: 'papers', label: '论文', message: '有哪些代表性论文可以先看？' },
        { id: 'projects', label: '项目', message: `${ownerName.zh}做过哪些项目？` },
        { id: 'contact', label: '联系', message: `怎么联系${ownerName.zh}？` }
      ]
    }
  }
} as const;
