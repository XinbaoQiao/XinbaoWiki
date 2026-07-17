export const WIKI_CHAT_RESPONSE_POLICY_VERSION = 'grounded-conversation-v2';

export type WikiChatResponseLanguage = 'en' | 'zh';

export type CitableWikiSource = {
  chunkId: string;
  slug: string;
  title: string;
  section: string;
  href: string;
};

export function deterministicAbstentionReply(_message: string, language: WikiChatResponseLanguage) {
  return language === 'zh'
    ? '这个请求涉及我不能提供的非公开、敏感或受保护信息；可以改问公开的研究、论文、项目、学术经历或联系方式'
    : 'I cannot provide non-public, sensitive, or otherwise protected information; you can ask about public research, papers, projects, academic background, or contact details instead';
}

export function validateConversationalReply(reply: string) {
  const compactReply = reply.trim();
  if (!compactReply || /\[\d+\]/u.test(compactReply)) return null;
  return compactReply;
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
