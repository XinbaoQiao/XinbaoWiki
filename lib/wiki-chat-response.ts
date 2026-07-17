export const WIKI_CHAT_RESPONSE_POLICY_VERSION = 'grounded-response-v1';

export type WikiChatResponseLanguage = 'en' | 'zh';

export type CitableWikiSource = {
  chunkId: string;
  slug: string;
  title: string;
  section: string;
  href: string;
};

const PURE_GREETING_PATTERN = /^(?:hi|hello|hey|yo|good\s+(?:morning|afternoon|evening)|你好|您好|嗨|哈喽|在吗)[!！,.，。?？\s]*$/iu;

export function deterministicAbstentionReply(message: string, language: WikiChatResponseLanguage) {
  if (PURE_GREETING_PATTERN.test(message.trim())) {
    return language === 'zh'
      ? '嗨！想聊乔鑫宝的研究、论文、项目或学术经历，可以直接问我'
      : 'Hi! Ask me about Xinbao Qiao\'s research, papers, projects, or academic background';
  }
  return language === 'zh'
    ? '现有公开 Xinbaopedia 资料不足以回答这个问题；我可以帮你查乔鑫宝的研究、论文、项目、学术经历或公开联系方式'
    : 'The public Xinbaopedia evidence is not sufficient to answer that; I can help with Xinbao Qiao\'s research, papers, projects, academic background, or public contact information';
}

export function validateAndCompactCitations<T extends CitableWikiSource>(reply: string, sources: T[]) {
  const citedNumbers = [...reply.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1]));
  if (citedNumbers.length === 0) return null;
  if (citedNumbers.some((number) => !Number.isInteger(number) || number < 1 || number > sources.length)) return null;

  const uniqueNumbers = [...new Set(citedNumbers)];
  const compactNumber = new Map(uniqueNumbers.map((number, index) => [number, index + 1]));
  const compactReply = reply.replace(/\[(\d+)\]/g, (_match, rawNumber) => `[${compactNumber.get(Number(rawNumber))}]`);
  return {
    reply: compactReply,
    sources: uniqueNumbers.map((number) => sources[number - 1])
  };
}
