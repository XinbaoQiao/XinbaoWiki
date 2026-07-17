import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type WikiRetrievalLanguage = 'en' | 'zh';

export type WikiRetrievalChunk = {
  chunkId: string;
  contentHash: string;
  slug: string;
  title: string;
  section: string;
  href: string;
  language: WikiRetrievalLanguage;
  summary: string;
  aliases: string[];
  tags: string[];
  content: string;
  outgoing: string[];
};

export type WikiRetrievalSource = {
  chunkId: string;
  contentHash: string;
  slug: string;
  title: string;
  section: string;
  href: string;
  score: number;
  matchedTerms: string[];
};

export type WikiRetrievalIndex = {
  algorithmVersion: string;
  indexVersion: string;
  indexFingerprint: string;
  chunks: WikiRetrievalChunk[];
  graph: Record<string, string[]>;
};

export type WikiRetrievalResult = {
  indexVersion: string;
  indexFingerprint: string;
  totalChunks: number;
  sources: WikiRetrievalSource[];
  context: string;
  evidenceScore: number;
  queryCoverage: number;
  shouldAbstain: boolean;
  blockedReason: 'hidden-page' | 'sensitive-query' | null;
};

type RetrievalOptions = {
  language: WikiRetrievalLanguage;
  limit?: number;
  contextSlug?: string;
};

type PageRecord = {
  slug: string;
  title: string;
  summary: string;
  aliases: string[];
  tags: string[];
  language: WikiRetrievalLanguage;
  content: string;
  metadataText: string;
  outgoing: string[];
};

type PreparedChunk = {
  chunk: WikiRetrievalChunk;
  title: string;
  section: string;
  aliases: string;
  tags: string;
  summary: string;
  body: string;
  termSet: Set<string>;
};

type ScoredChunk = {
  prepared: PreparedChunk;
  score: number;
  matchedTerms: string[];
};

type BoundedIntentKind = 'profile' | 'recent-work' | 'doctoral-work' | 'public-contact';

type BoundedTarget = {
  slug: string;
  sectionPattern?: RegExp;
  newestMatchingSection?: boolean;
};

export const WIKI_RETRIEVAL_INDEX_VERSION = 'wiki-heading-lexical-v2';

const WIKI_DIR = path.join(process.cwd(), 'wiki');
const MAX_CHUNK_CHARACTERS = 1_800;
const DEFAULT_SOURCE_LIMIT = 6;
const MAX_SOURCE_LIMIT = 8;
const MAX_CONTEXT_CHARACTERS = 11_000;
const MIN_RETRIEVAL_SCORE = 2.2;

const ENGLISH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
  'for', 'from', 'had', 'has', 'have', 'he', 'her', 'his', 'how', 'i', 'in', 'is', 'it', 'its',
  'me', 'of', 'on', 'or', 'our', 'she', 'that', 'the', 'their', 'them', 'they', 'this', 'to', 'was',
  'explain', 'list', 'method', 'paper', 'papers', 'project', 'projects', 'should', 'show', 'tell', 'use',
  'there', 'used', 'using', 'we', 'were', 'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'work',
  'works', 'would', 'you', 'your'
]);

const CHINESE_STOP_GRAMS = new Set([
  '一个', '一下', '以及', '关于', '可以', '如何', '我们', '什么', '他的', '他的', '这个', '那个',
  '哪些', '是否', '介绍', '一下', '目前', '还是', '怎么', '为什么'
]);
const CHINESE_STOP_CHARACTERS = new Set(['的', '了', '呢', '吗', '是', '有', '和', '与', '及', '在']);
const ENGLISH_PERSONAL_OWNER = String.raw`(?:xinbao(?: qiao)?(?: s)?|qiao xinbao(?: s)?|his|your)`;
const ENGLISH_PERSON = String.raw`(?:xinbao(?: qiao)?|qiao xinbao|he|you)`;
const ENGLISH_SECRET_OBJECT = String.raw`(?:api key|secret key|access token|system prompt|developer (?:message|prompt)|private voice(?: style)? note|voice style note|(?:authentication|login|api|secret) credentials|environment variables?|redis token|upstash token|yunwu key)`;
const ENGLISH_PERSONAL_DETAIL = String.raw`(?:passport(?: number)?|password|social security(?: number)?|ssn|bank account|credit card(?: number)?|(?:exact|home|private|street|residential) address|birthday|date of birth|religion|religious beliefs?|health (?:problem|condition|status|history)|medical (?:condition|record|history)|diagnosis|illness|disease|phone number|mobile number|bank balance|savings|salary|income)`;
const ENGLISH_OWNED_SECRET_PATTERN = new RegExp(String.raw`\b${ENGLISH_PERSONAL_OWNER} (?:(?:actual|hidden|secret|private|raw) )?${ENGLISH_SECRET_OBJECT}\b`, 'iu');
const ENGLISH_SECRET_EXTRACTION_PATTERN = new RegExp(String.raw`\b(?:reveal|show|print|display|expose|leak|dump|list|share|provide|read|give me|tell me) (?:me )?(?:the |${ENGLISH_PERSONAL_OWNER} )(?:(?:actual|hidden|secret|private|raw) )?${ENGLISH_SECRET_OBJECT}\b`, 'iu');
const ENGLISH_INSTRUCTION_EXTRACTION_PATTERN = /\b(?:repeat|reveal|show|print|display|expose|leak|dump|list|share|provide|read|quote|recite|transcribe|copy|give me|tell me) (?:me )?(?:the )?(?:(?:(?:hidden|private|internal|initial|initialization|system|developer) ){1,3}instructions?|(?:every|all) rules? governing (?:this|the) assistant)\b/iu;
const ENGLISH_PROTECTED_INSTRUCTION_REFERENCE_PATTERN = /\b(?:(?:(?:your|its|this assistant s|the assistant s|this system s|the system s|xinbaopedia s) )(?:(?:hidden|private|internal|initial|initialization|system|developer) ){0,3}(?:instructions?|rules?|prompts?|messages?|directives?|guidelines?)|(?:instructions?|rules?|directives?|guidelines?) governing (?:this|the) assistant)\b/iu;
const ENGLISH_INITIALIZATION_REFERENCE_PATTERN = /\b(?:(?:how|what).{0,32}\byou (?:were|are) (?:initialized|configured|set up)|(?:your|this assistant s|the assistant s) (?:initialization|setup|configuration)|(?:developer|system).{0,48}\b(?:told|instructed|said|gave).{0,24}\byou)\b/iu;
const ENGLISH_PRIOR_MESSAGE_REFERENCE = String.raw`(?:(?:everything|(?:all|any|the) (?:text|content|messages?|instructions?|words?|context)) (?:(?:placed|written|appearing|received) )?(?:before|above|preceding|prior to|earlier in)(?: (?:(?:this|the|my|me) )?(?:user )?(?:message|question|request|context|conversation))?|(?:the )?(?:preceding|previous|prior|above|earlier) (?:text|content|messages?|instructions?|words?|context)|(?:the )?(?:text|content|messages?|instructions?|words?|context) (?:you )?received before (?:this|the|my|me)(?: (?:message|question|request|context|conversation))?)`;
const ENGLISH_PRIOR_MESSAGE_ACTION = String.raw`(?:translate|encode|base64 encode|hex encode|convert|transform|turn|copy|repeat|recite|show|print|summarize|paraphrase|output|render|return|give(?: me)?|send(?: back)?)`;
const ENGLISH_PRIOR_MESSAGE_EXTRACTION_PATTERN = new RegExp(String.raw`\b(?:${ENGLISH_PRIOR_MESSAGE_ACTION}.{0,96}${ENGLISH_PRIOR_MESSAGE_REFERENCE}|${ENGLISH_PRIOR_MESSAGE_REFERENCE}.{0,96}${ENGLISH_PRIOR_MESSAGE_ACTION})\b`, 'iu');
const ENGLISH_PERSONAL_AGE_PATTERN = new RegExp(String.raw`\b(?:${ENGLISH_PERSONAL_OWNER} (?:(?:current|exact|actual|real|present) )?age\b(?! of information)|age of ${ENGLISH_PERSON}\b|(?:what|which) age (?:is|was|might be|could be|would be) ${ENGLISH_PERSON}\b|${ENGLISH_PERSON} (?:is|was|might be|could be|would be) (?:how old|what age)\b|how old (?:(?:is|are|was|were) ${ENGLISH_PERSON}|(?:might|could|would) ${ENGLISH_PERSON} be|${ENGLISH_PERSON} (?:is|are|was|were|might be|could be|would be))\b|how many years old (?:(?:is|was) ${ENGLISH_PERSON}|${ENGLISH_PERSON} (?:is|was))\b)`, 'iu');
const ENGLISH_PERSONAL_SENSITIVE_PATTERN = new RegExp(String.raw`\b(?:${ENGLISH_PERSONAL_OWNER} ${ENGLISH_PERSONAL_DETAIL}|(?:(?:what is|what s|tell me)|(?:can|could|would) you (?:please )?tell me) ${ENGLISH_PERSONAL_OWNER} age(?: now| today)?(?: please)?$|where (?:does|do|is) ${ENGLISH_PERSON} (?:live|reside)|${ENGLISH_PERSON} (?:lives?|resides?) (?:where|at what address)|(?:what|which) (?:health|medical) (?:condition|problem|issue|history)s? (?:does|do) ${ENGLISH_PERSON} have|(?:does|do) ${ENGLISH_PERSON} (?:have|suffer from) (?:a |any )?(?:health|medical) (?:condition|problem|issue)|how old (?:is|are) ${ENGLISH_PERSON})\b`, 'iu');
const CHINESE_SECRET_OBJECT = /(?:api\s*密钥|秘密密钥|访问(?:令牌|密钥)|系统提示(?:词)?|开发者(?:消息|提示)|私有语气|私密语气|语气(?:风格)?说明|(?:身份验证|认证|登录|api)凭据|环境变量|redis\s*令牌|upstash\s*令牌|云雾密钥)/iu;
const CHINESE_OWNED_SECRET_PATTERN = /(?:乔鑫宝|鑫宝|他|你|本站|网站|应用|服务器)(?:的)?\s*(?:实际|隐藏|秘密|私有|内部|原始)?\s*(?:api\s*密钥|秘密密钥|访问(?:令牌|密钥)|系统提示(?:词)?|开发者(?:消息|提示)|私有语气|私密语气|语气(?:风格)?说明|(?:身份验证|认证|登录|api)凭据|环境变量|redis\s*令牌|upstash\s*令牌|云雾密钥)/iu;
const CHINESE_SECRET_EXTRACTION_PATTERN = /(?:显示|展示|打印|泄露|公开|导出|列出|给我|告诉我|提供)(?:一下)?(?:给我)?(?:该|这个|那份|你的|他的|乔鑫宝的|鑫宝的|本站的|网站的|应用的|服务器的)?(?:实际|隐藏|秘密|私有|内部|原始)?(?:api\s*密钥|秘密密钥|访问(?:令牌|密钥)|系统提示(?:词)?|开发者(?:消息|提示)|私有语气|私密语气|语气(?:风格)?说明|(?:身份验证|认证|登录|api)凭据|环境变量|redis\s*令牌|upstash\s*令牌|云雾密钥)/iu;
const CHINESE_INSTRUCTION_EXTRACTION_PATTERN = /(?:逐字(?:抄出|复述|引用)|抄出|照抄|引用|复述|重复|显示|展示|打印|输出|泄露|公开|导出|列出|告诉我|提供)(?:一下)?(?:(?:你的|他的|该|这个)?(?:(?:隐藏|私有|内部|初始|系统|开发者)的?)+(?:指令|规则|提示词)|(?:所有|全部)(?:控制|约束|管理)?(?:这个|该|本)?(?:助手|系统)(?:的)?(?:指令|规则|提示词))/u;
const CHINESE_PROTECTED_INSTRUCTION_REFERENCE_PATTERN = /(?:(?:你的|该助手的|这个助手的|本助手的|该系统的|这个系统的|本系统的)(?:(?:隐藏|私有|内部|初始|系统|开发者)的?){0,3}(?:指令|规则|提示词|消息|指示|要求|设定|配置)|(?:控制|约束|管理)(?:这个|该|本)?助手的?(?:(?:隐藏|私有|内部|初始|系统|开发者)的?)*(?:指令|规则|提示词|指示|要求))/u;
const CHINESE_INITIALIZATION_REFERENCE_PATTERN = /(?:(?:你|该助手|这个助手|本助手).{0,12}(?:收到|获得|被告知|被指示).{0,18}(?:(?:初始|系统|开发者)(?:指示|指令|规则|要求|设定|配置)|(?:指示|指令|规则|要求))|(?:你|该助手|这个助手|本助手).{0,8}(?:如何|怎么|怎样).{0,4}被(?:初始化|配置|设定)|(?:你|该助手|这个助手|本助手)的(?:初始化|内部设定|系统配置)(?:方式|过程|内容|详情|细节)?|(?:系统|开发者).{0,16}(?:告诉|指示|要求|给).{0,12}(?:你|助手))/u;
const CHINESE_PRIOR_MESSAGE_REFERENCE = String.raw`(?:(?:(?:这条|本条|当前|我的|我)?(?:用户)?(?:消息|请求|提问))(?:之前|以前|前)的?(?:所有|全部)?(?:文本|内容|消息|文字|指令)|(?:前文|上文|上方|上面|此前|先前)(?:的)?(?:所有|全部)?(?:文本|内容|消息|文字|指令)?|(?:所有|全部)(?:文本|内容|消息|文字|指令).{0,12}(?:(?:这条|本条|当前|我的|我)?(?:用户)?(?:消息|请求|提问))(?:之前|以前|前))`;
const CHINESE_PRIOR_MESSAGE_ACTION = String.raw`(?:翻译|编码|转成|转换|复述|重复|抄出|显示|输出|概括|总结|改写|发给(?:我)?|给我)`;
const CHINESE_PRIOR_MESSAGE_EXTRACTION_PATTERN = new RegExp(String.raw`(?:${CHINESE_PRIOR_MESSAGE_ACTION}.{0,60}${CHINESE_PRIOR_MESSAGE_REFERENCE}|${CHINESE_PRIOR_MESSAGE_REFERENCE}.{0,60}${CHINESE_PRIOR_MESSAGE_ACTION})`, 'iu');
const CHINESE_PERSONAL_SENSITIVE_PATTERN = /(?:乔鑫宝|鑫宝|他|你)(?:的)?(?:护照(?:号码|号)?|身份证(?:号码|号)?|密码|银行(?:卡|账户)|信用卡|(?:具体|家庭|私人|住宅|街道)地址|生日|出生日期|宗教|信仰|健康问题|健康状况|疾病|病史|电话号码|手机号|银行余额|账户余额|存款|工资|薪水|收入)|(?:乔鑫宝|鑫宝|他|你)(?:的)?(?:当前|现在|实际)?年龄(?:是|为|多大|多少|几岁|呢|吗|$)|(?:乔鑫宝|鑫宝|他|你)(?:现在)?(?:住|居住)(?:在)?哪(?:里|儿)|(?:乔鑫宝|鑫宝|他|你)(?:有|患有|得过)(?:什么|哪些)?(?:健康问题|健康状况|疾病|病史)|(?:乔鑫宝|鑫宝|他|你)(?:今年|现在|目前)?(?:多大|几岁|多少岁|多大年纪)|(?:乔鑫宝|鑫宝|他|你)(?:的)?年纪(?:多大|多少|几岁)/u;
const ENGLISH_CONTEXT_REFERENCE_PATTERN = /^(?:(?:and )?(?:this|that)(?: one| paper| work| project)?|it|what (?:is|s) (?:this|it)(?: about)?|what does (?:this|it)(?: paper| work| project)? do|what problems? does (?:this|it)(?: paper| work| project)? solve|why does (?:this|it)(?: paper| work| project)? matter|tell me about (?:this|it)(?: paper| work| project)?|(?:could|can|would) you (?:please )?(?:explain|summarize|tell me) (?:what (?:this|that|it)(?: paper| work| project)? does|(?:this|that)(?: paper| work| project)?))$/u;
const CHINESE_CONTEXT_REFERENCE_PATTERN = /^(?:这篇|这个|这项工作|这项研究|这个项目|它)(?:呢|讲(?:了)?(?:啥|什么)|是什么|是做什么的|做什么|有什么用|解决什么|解决了什么|为什么重要)?$/u;
const ENGLISH_PROFILE_INTENT_PATTERN = /^(?:tell me about (?:yourself|xinbao(?: qiao)?)|introduce (?:yourself|xinbao(?: qiao)?)|who (?:are you|is xinbao(?: qiao)?)|give me (?:your|xinbao(?: qiao)? s) introduction)$/u;
const ENGLISH_RECENT_WORK_INTENT_PATTERN = /^(?:whatever xinbao(?: qiao)? is cooking up lately|what (?:is|s) (?:xinbao(?: qiao)?|he) (?:working on|cooking up|researching)(?: lately| recently| now)?|what are you (?:working on|cooking up|researching)(?: lately| recently| now)?|what has (?:xinbao(?: qiao)?|he|you) been working on(?: lately| recently)?|what is (?:xinbao(?: qiao)?|he) up to(?: lately| recently| now)?)$/u;
const ENGLISH_DOCTORAL_WORK_INTENT_PATTERN = /^(?:what did (?:xinbao(?: qiao)?|he|you) work on (?:during|in) (?:his|your|the) phd|what (?:is|was) (?:xinbao(?: qiao)? s|his|your) phd (?:work|research)(?: about)?|what (?:does|did) (?:xinbao(?: qiao)?|he|you) research (?:during|in) (?:his|your|the) phd)$/u;
const ENGLISH_PUBLIC_CONTACT_INTENT_PATTERN = /^(?:(?:what(?: is|s)|give me|show me|share) (?:xinbao(?: qiao)? s|qiao xinbao s|his|your) (?:(?:public|work|academic) )?(?:email(?: address)?|contact (?:information|info|details))|how (?:can|do) i contact (?:xinbao(?: qiao)?|qiao xinbao|him|you))$/u;
const ENGLISH_GENERAL_CONVERSATION_PATTERN = /^(?:what is (?:a |an )?(?:system prompt|authentication credential)|how are environment variables used|how does medical diagnosis work)$/u;

const HOME_INTENT_TARGETS: Record<WikiRetrievalLanguage, Record<BoundedIntentKind, BoundedTarget[]>> = {
  en: {
    profile: [
      { slug: 'Xinbao_Qiao', sectionPattern: /^Overview$/iu },
      { slug: 'Research', sectionPattern: /^Research thesis$/iu },
      { slug: 'Education', sectionPattern: /^Timeline$/iu }
    ],
    'recent-work': [
      { slug: 'Xinbao_Qiao', sectionPattern: /Chinese University of Hong Kong \(2026-present\)|Academic projects/iu },
      { slug: 'Projects', sectionPattern: /Research project clusters/iu },
      { slug: 'Publications', sectionPattern: /Peer-reviewed and accepted papers/iu },
      { slug: 'log', sectionPattern: /^2026-/u, newestMatchingSection: true }
    ],
    'doctoral-work': [
      { slug: 'Xinbao_Qiao', sectionPattern: /Chinese University of Hong Kong \(2026-present\)/iu },
      { slug: 'Experience', sectionPattern: /Doctoral research in AI and networks/iu },
      { slug: 'Research', sectionPattern: /^AI and networks$/iu }
    ],
    'public-contact': [
      { slug: 'CV', sectionPattern: /^Contact$/iu }
    ]
  },
  zh: {
    profile: [
      { slug: 'Qiao_Xinbao_zh', sectionPattern: /^概述$/u },
      { slug: 'Research_zh', sectionPattern: /^研究主线$/u },
      { slug: 'Education_zh', sectionPattern: /^时间线$/u }
    ],
    'recent-work': [
      { slug: 'Qiao_Xinbao_zh', sectionPattern: /香港中文大学博士阶段|学术项目/u },
      { slug: 'Projects_zh', sectionPattern: /研究项目簇/u },
      { slug: 'Publications_zh', sectionPattern: /已录用论文/u },
      { slug: 'log_zh', sectionPattern: /^2026-/u, newestMatchingSection: true }
    ],
    'doctoral-work': [
      { slug: 'Qiao_Xinbao_zh', sectionPattern: /香港中文大学博士阶段/u },
      { slug: 'Experience_zh', sectionPattern: /AI 与网络博士研究/u },
      { slug: 'Research_zh', sectionPattern: /^AI 与网络$/u }
    ],
    'public-contact': [
      { slug: 'CV_zh', sectionPattern: /^联系方式$/u }
    ]
  }
};


let cachedIndex: WikiRetrievalIndex | null = null;
let cachedPrepared: { fingerprint: string; chunks: PreparedChunk[] } | null = null;
let cachedHiddenQueryPhrases: string[] | null = null;

function asStrings(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(asStrings);
  if (typeof value === 'object') return Object.values(value).flatMap(asStrings);
  return [];
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function titleFor(data: Record<string, unknown>, slug: string) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  return name || title || slug.replaceAll('_', ' ');
}

function summaryFor(data: Record<string, unknown>) {
  const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  return summary || description;
}

function languageForSlug(slug: string): WikiRetrievalLanguage {
  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh') ? 'zh' : 'en';
}

function normalizeText(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, ' ')
    .trim();
}

function targetsSensitiveInformation(query: string) {
  const normalized = normalizeText(query);
  return ENGLISH_OWNED_SECRET_PATTERN.test(normalized)
    || ENGLISH_SECRET_EXTRACTION_PATTERN.test(normalized)
    || ENGLISH_INSTRUCTION_EXTRACTION_PATTERN.test(normalized)
    || ENGLISH_PROTECTED_INSTRUCTION_REFERENCE_PATTERN.test(normalized)
    || ENGLISH_INITIALIZATION_REFERENCE_PATTERN.test(normalized)
    || ENGLISH_PRIOR_MESSAGE_EXTRACTION_PATTERN.test(normalized)
    || ENGLISH_PERSONAL_AGE_PATTERN.test(normalized)
    || ENGLISH_PERSONAL_SENSITIVE_PATTERN.test(normalized)
    || CHINESE_OWNED_SECRET_PATTERN.test(normalized)
    || (CHINESE_SECRET_OBJECT.test(normalized) && CHINESE_SECRET_EXTRACTION_PATTERN.test(normalized))
    || CHINESE_INSTRUCTION_EXTRACTION_PATTERN.test(normalized)
    || CHINESE_PROTECTED_INSTRUCTION_REFERENCE_PATTERN.test(normalized)
    || CHINESE_INITIALIZATION_REFERENCE_PATTERN.test(normalized)
    || CHINESE_PRIOR_MESSAGE_EXTRACTION_PATTERN.test(normalized)
    || CHINESE_PERSONAL_SENSITIVE_PATTERN.test(normalized);
}

function homepageIntent(query: string, language: WikiRetrievalLanguage): BoundedIntentKind | null {
  const normalized = normalizeText(query);
  if (language === 'en') {
    if (ENGLISH_PROFILE_INTENT_PATTERN.test(normalized)) return 'profile';
    if (ENGLISH_RECENT_WORK_INTENT_PATTERN.test(normalized)) return 'recent-work';
    if (ENGLISH_DOCTORAL_WORK_INTENT_PATTERN.test(normalized)) return 'doctoral-work';
    if (ENGLISH_PUBLIC_CONTACT_INTENT_PATTERN.test(normalized)) return 'public-contact';
    return null;
  }

  const compact = normalized.replace(/\s+/g, '');
  if (/^(?:介绍一下|说说)(?:你自己|乔鑫宝|鑫宝)$|^(?:你|乔鑫宝|鑫宝)是谁$/u.test(compact)) return 'profile';
  if (/^(?:看看)?(?:你|鑫宝|乔鑫宝|他)?(?:最近|现在)(?:又)?(?:在)?(?:折腾|搞|做|研究)(?:什么|啥)(?:工作|研究|项目|论文)?$/u.test(compact)) return 'recent-work';
  if (/^(?:你|鑫宝|乔鑫宝|他)?(?:在)?博士(?:期间|阶段)(?:主要)?(?:在)?(?:做|搞|研究)(?:什么|啥)(?:工作|研究|项目)?$/u.test(compact)) return 'doctoral-work';
  if (/^(?:(?:你|鑫宝|乔鑫宝|他)(?:的)?(?:(?:公开|工作|学术)?邮箱(?:地址)?|联系方式)(?:是什么|是多少|呢)?|(?:怎么|如何)(?:联系|联络)(?:你|鑫宝|乔鑫宝|他))$/u.test(compact)) return 'public-contact';
  return null;
}

function isExplicitGeneralConversation(query: string, language: WikiRetrievalLanguage) {
  const normalized = normalizeText(query);
  if (language === 'en') return ENGLISH_GENERAL_CONVERSATION_PATTERN.test(normalized);
  const compact = normalized.replace(/\s+/g, '');
  return /^(?:什么是系统提示词|环境变量(?:如何|怎么)使用|医疗诊断(?:如何|怎么)工作)$/u.test(compact);
}

function requestedChineseTopicPhrase(query: string) {
  const compact = normalizeText(query).replace(/\s+/g, '');
  const prefixed = compact.match(/^(?:请)?(?:展示|列出|介绍|解释|告诉我|说说|讲讲)(.+)$/u);
  const suffixed = compact.match(/^(.+?)(?:是什么|有哪些(?:论文|研究|项目)?|怎么做|如何做)$/u);
  const rawTopic = prefixed?.[1] || suffixed?.[1];
  if (!rawTopic) return null;
  const topic = rawTopic
    .replace(/(?:是什么|有哪些|有啥|怎么做|如何做)$/u, '')
    .replace(/(?:相关)?(?:方法|论文|研究|项目|算法)$/u, '');
  return topic.length >= 2 ? topic : null;
}

function isContextReference(query: string, language: WikiRetrievalLanguage) {
  const normalized = normalizeText(query);
  return language === 'en'
    ? ENGLISH_CONTEXT_REFERENCE_PATTERN.test(normalized)
    : CHINESE_CONTEXT_REFERENCE_PATTERN.test(normalized.replace(/\s+/g, ''));
}

function markdownToText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1 ')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => String(label || target).replaceAll('_', ' '))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\$\$[\s\S]*?\$\$/g, ' formula ')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/^\[\^[^\]]+\]:.*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_|~`\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function headingKey(value: string) {
  const normalized = normalizeText(markdownToText(value));
  return normalized
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'section';
}

function contentHash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeLinkedSlug(target: string) {
  const withoutAnchor = target.split('#')[0]?.trim().replace(/\.md$/i, '').replace(/\s+/g, '_') || '';
  if (!withoutAnchor) return '';
  try {
    return decodeURIComponent(withoutAnchor);
  } catch {
    return withoutAnchor;
  }
}

function outgoingSlugs(content: string) {
  const links = new Set<string>();
  for (const match of content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) {
    const slug = normalizeLinkedSlug(match[1] || '');
    if (slug) links.add(slug);
  }
  for (const match of content.matchAll(/\[[^\]]+\]\(\/?wiki\/([^)/?#]+)[^)]*\)/g)) {
    const slug = normalizeLinkedSlug(match[1] || '');
    if (slug) links.add(slug);
  }
  return [...links].sort();
}

function selectedMetadata(data: Record<string, unknown>) {
  return asStrings({
    type: data.type,
    occupation: data.occupation,
    affiliation: data.affiliation,
    education: data.education,
    authors: data.authors,
    venue: data.venue,
    location: data.location,
    year: data.year,
    status: data.status,
    publicationType: data.publication_type,
    links: data.links
  }).join(' ');
}

function readPages() {
  if (!fs.existsSync(WIKI_DIR)) return [];
  return fs.readdirSync(WIKI_DIR)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .flatMap((file): PageRecord[] => {
      const slug = file.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(WIKI_DIR, file), 'utf8');
      const parsed = matter(raw);
      const data = parsed.data as Record<string, unknown>;
      if (data.hidden === true) return [];
      return [{
        slug,
        title: titleFor(data, slug),
        summary: summaryFor(data),
        aliases: stringList(data.aliases),
        tags: stringList(data.tags),
        language: languageForSlug(slug),
        content: parsed.content.trim(),
        metadataText: selectedMetadata(data),
        outgoing: outgoingSlugs(parsed.content)
      }];
    });
}

function hiddenQueryPhrases() {
  if (cachedHiddenQueryPhrases) return cachedHiddenQueryPhrases;
  if (!fs.existsSync(WIKI_DIR)) return [];

  const phrases = new Set<string>();
  for (const file of fs.readdirSync(WIKI_DIR).filter((entry) => entry.endsWith('.md')).sort()) {
    const slug = file.replace(/\.md$/, '');
    const parsed = matter(fs.readFileSync(path.join(WIKI_DIR, file), 'utf8'));
    const data = parsed.data as Record<string, unknown>;
    if (data.hidden !== true) continue;
    for (const value of [titleFor(data, slug), slug.replaceAll('_', ' '), ...stringList(data.aliases)]) {
      const phrase = normalizeText(value);
      if (phrase.length >= 4) phrases.add(phrase);
    }
  }
  cachedHiddenQueryPhrases = [...phrases].sort();
  return cachedHiddenQueryPhrases;
}

function targetsHiddenPage(query: string) {
  const normalizedQuery = normalizeText(query);
  return hiddenQueryPhrases().some((phrase) => normalizedQuery.includes(phrase));
}

function splitSections(content: string, language: WikiRetrievalLanguage) {
  const overview = language === 'zh' ? '概述' : 'Overview';
  const sections: Array<{ section: string; headingId: string; content: string }> = [];
  let currentSection = overview;
  let currentHeadingId = 'overview';
  let lines: string[] = [];
  let inFence = false;
  const duplicateHeadings = new Map<string, number>();

  function flush() {
    const sectionContent = lines.join('\n').trim();
    if (sectionContent) {
      sections.push({ section: currentSection, headingId: currentHeadingId, content: sectionContent });
      duplicateHeadings.set(currentHeadingId, Math.max(duplicateHeadings.get(currentHeadingId) || 0, 1));
    }
    lines = [];
  }

  for (const line of content.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const heading = !inFence ? line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/) : null;
    if (!heading) {
      lines.push(line);
      continue;
    }
    flush();
    currentSection = markdownToText(heading[1] || '') || overview;
    const baseHeadingId = headingKey(currentSection);
    const duplicate = (duplicateHeadings.get(baseHeadingId) || 0) + 1;
    duplicateHeadings.set(baseHeadingId, duplicate);
    currentHeadingId = duplicate === 1 ? baseHeadingId : `${baseHeadingId}-${duplicate}`;
  }
  flush();
  return sections;
}

function splitLongContent(value: string) {
  const plain = markdownToText(value);
  if (plain.length <= MAX_CHUNK_CHARACTERS) return plain ? [plain] : [];

  const sentences = plain.split(/(?<=[。！？.!?])\s+|\s{2,}/u).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences.length > 1 ? sentences : plain.match(new RegExp(`.{1,${MAX_CHUNK_CHARACTERS}}`, 'gu')) || []) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length <= MAX_CHUNK_CHARACTERS) {
      current = next;
      continue;
    }
    if (current) chunks.push(current);
    current = sentence.slice(0, MAX_CHUNK_CHARACTERS);
    let remainder = sentence.slice(MAX_CHUNK_CHARACTERS);
    while (remainder.length > MAX_CHUNK_CHARACTERS) {
      chunks.push(remainder.slice(0, MAX_CHUNK_CHARACTERS));
      remainder = remainder.slice(MAX_CHUNK_CHARACTERS);
    }
    if (remainder) {
      chunks.push(current);
      current = remainder;
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

function wikiHref(slug: string) {
  const pathname = `/wiki/${encodeURIComponent(slug)}/`;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

function chunksForPage(page: PageRecord) {
  const sections = splitSections(page.content, page.language);
  if (!sections.some((section) => section.headingId === 'overview') && (page.summary || page.metadataText)) {
    sections.unshift({ section: page.language === 'zh' ? '概述' : 'Overview', headingId: 'overview', content: '' });
  }

  return sections.flatMap((section): WikiRetrievalChunk[] => {
    const overviewPrefix = section.headingId === 'overview'
      ? [page.summary, page.metadataText].filter(Boolean).join(' ')
      : '';
    const content = [overviewPrefix, section.content].filter(Boolean).join(' ');
    return splitLongContent(content).map((part, index) => {
      const partSuffix = index === 0 ? '' : `--part-${index + 1}`;
      const chunkId = `${page.slug}#${section.headingId}${partSuffix}`;
      return {
        chunkId,
        contentHash: contentHash(`${chunkId}\n${part}`),
        slug: page.slug,
        title: page.title,
        section: section.section,
        href: wikiHref(page.slug),
        language: page.language,
        summary: page.summary,
        aliases: page.aliases,
        tags: page.tags,
        content: part,
        outgoing: page.outgoing
      };
    });
  });
}

function buildGraph(pages: PageRecord[]) {
  const existing = new Set(pages.map((page) => page.slug));
  const graph = new Map<string, Set<string>>(pages.map((page) => [page.slug, new Set<string>()]));
  for (const page of pages) {
    for (const target of page.outgoing) {
      const localizedTarget = page.language === 'zh'
        ? target === 'Xinbao_Qiao' && existing.has('Qiao_Xinbao_zh')
          ? 'Qiao_Xinbao_zh'
          : !target.endsWith('_zh') && existing.has(`${target}_zh`) ? `${target}_zh` : target
        : target === 'Qiao_Xinbao_zh' && existing.has('Xinbao_Qiao')
          ? 'Xinbao_Qiao'
          : target.endsWith('_zh') && existing.has(target.slice(0, -3)) ? target.slice(0, -3) : target;
      if (!existing.has(localizedTarget)) continue;
      graph.get(page.slug)?.add(localizedTarget);
      graph.get(localizedTarget)?.add(page.slug);
    }
  }
  return Object.fromEntries([...graph.entries()].map(([slug, neighbors]) => [slug, [...neighbors].sort()]));
}

export function getWikiRetrievalIndex(): WikiRetrievalIndex {
  if (cachedIndex) return cachedIndex;
  const pages = readPages();
  const chunks = pages.flatMap(chunksForPage);
  const hiddenBoundaryFingerprint = contentHash(hiddenQueryPhrases().join('\n'));
  const indexFingerprint = contentHash([
    ...chunks.map((chunk) => `${chunk.chunkId}:${chunk.contentHash}`),
    `hidden-boundary:${hiddenBoundaryFingerprint}`
  ].join('\n'));
  cachedIndex = {
    algorithmVersion: WIKI_RETRIEVAL_INDEX_VERSION,
    indexVersion: `${WIKI_RETRIEVAL_INDEX_VERSION}:${indexFingerprint.slice(0, 12)}`,
    indexFingerprint,
    chunks,
    graph: buildGraph(pages)
  };
  return cachedIndex;
}

function tokenizeWikiText(value: string, limit = Number.POSITIVE_INFINITY) {
  const normalized = normalizeText(value);
  const terms = new Set<string>();
  for (const token of normalized.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) || []) {
    if (token.length > 1 && !ENGLISH_STOP_WORDS.has(token)) terms.add(token);
  }
  for (const run of normalized.match(/[\p{Script=Han}]+/gu) || []) {
    if (run.length <= 8 && !CHINESE_STOP_GRAMS.has(run)) terms.add(run);
    for (const width of [2, 3]) {
      for (let index = 0; index <= run.length - width; index += 1) {
        const gram = run.slice(index, index + width);
        if (!CHINESE_STOP_GRAMS.has(gram) && ![...gram].some((character) => CHINESE_STOP_CHARACTERS.has(character))) {
          terms.add(gram);
        }
      }
    }
  }
  return [...terms].slice(0, limit);
}

export function tokenizeWikiQuery(value: string) {
  return tokenizeWikiText(value, 32);
}

const IDENTITY_QUERY_TERMS = new Set(tokenizeWikiText('Xinbao Qiao Qiao Xinbao 乔鑫宝 鑫宝乔'));

function prepareChunks(index: WikiRetrievalIndex) {
  if (cachedPrepared?.fingerprint === index.indexFingerprint) return cachedPrepared.chunks;
  const chunks = index.chunks.map((chunk): PreparedChunk => {
    const title = normalizeText(chunk.title);
    const section = normalizeText(chunk.section);
    const aliases = normalizeText(chunk.aliases.join(' '));
    const tags = normalizeText(chunk.tags.join(' '));
    const summary = normalizeText(chunk.summary);
    const body = normalizeText(chunk.content);
    return {
      chunk,
      title,
      section,
      aliases,
      tags,
      summary,
      body,
      termSet: new Set(tokenizeWikiText([title, section, aliases, tags, summary, body].join(' ')))
    };
  });
  cachedPrepared = { fingerprint: index.indexFingerprint, chunks };
  return chunks;
}

function boundedChunkPriority(item: PreparedChunk, sectionPattern?: RegExp) {
  if (sectionPattern?.test(item.chunk.section)) return 0;
  if (item.chunk.chunkId.endsWith('#overview')) return 1;
  if (/^(?:overview|introduction|summary|abstract|概述|简介|定位)$/iu.test(item.chunk.section)) return 2;
  return 3;
}

function selectBoundedTargets(
  index: WikiRetrievalIndex,
  targets: BoundedTarget[],
  language: WikiRetrievalLanguage,
  limit: number,
  intentLabel: string
) {
  const prepared = prepareChunks(index);
  const selected: ScoredChunk[] = [];
  const seen = new Set<string>();
  for (const target of targets) {
    const candidate = prepared
      .filter((item) => item.chunk.language === language && item.chunk.slug === target.slug)
      .sort((left, right) =>
        boundedChunkPriority(left, target.sectionPattern) - boundedChunkPriority(right, target.sectionPattern)
        || (target.newestMatchingSection
          ? right.chunk.section.localeCompare(left.chunk.section)
          : left.chunk.chunkId.localeCompare(right.chunk.chunkId))
      )[0];
    if (!candidate || seen.has(candidate.chunk.chunkId)) continue;
    seen.add(candidate.chunk.chunkId);
    selected.push({ prepared: candidate, score: 32 - selected.length, matchedTerms: [intentLabel] });
    if (selected.length >= limit) break;
  }
  return selected;
}

function selectContextReferenceSources(
  index: WikiRetrievalIndex,
  contextSlug: string,
  language: WikiRetrievalLanguage,
  limit: number
) {
  return prepareChunks(index)
    .filter((item) => item.chunk.language === language && item.chunk.slug === contextSlug)
    .sort((left, right) =>
      boundedChunkPriority(left) - boundedChunkPriority(right)
      || left.chunk.chunkId.localeCompare(right.chunk.chunkId)
    )
    .slice(0, Math.min(2, limit))
    .map((prepared, indexPosition): ScoredChunk => ({
      prepared,
      score: 32 - indexPosition,
      matchedTerms: ['context-reference']
    }));
}

function phraseScore(query: string, chunk: PreparedChunk) {
  if (query.length < 2 || query.length > 100) return 0;
  if (chunk.title === query) return 30;
  if (chunk.title.includes(query)) return 18;
  if (chunk.aliases.includes(query)) return 15;
  if (chunk.section.includes(query)) return 11;
  if (chunk.tags.includes(query)) return 8;
  if (chunk.summary.includes(query)) return 7;
  if (chunk.body.includes(query)) return 4;
  return 0;
}

function fieldTermScore(field: string, term: string, weight: number) {
  const matches = /^[a-z0-9-]+$/.test(term)
    ? ` ${field} `.includes(` ${term} `)
    : field.includes(term);
  return matches ? weight : 0;
}

function scoreChunks(index: WikiRetrievalIndex, query: string, language: WikiRetrievalLanguage, contextSlug = '') {
  const prepared = prepareChunks(index).filter((item) => item.chunk.language === language);
  const terms = tokenizeWikiQuery(query);
  const normalizedQuery = normalizeText(query);
  const documentFrequency = new Map<string, number>();
  for (const term of terms) {
    documentFrequency.set(term, prepared.reduce((count, chunk) => count + Number(chunk.termSet.has(term)), 0));
  }

  const scored = prepared.map((item): ScoredChunk => {
    let score = phraseScore(normalizedQuery, item);
    const matchedTerms: string[] = [];
    for (const term of terms) {
      const frequency = documentFrequency.get(term) || 0;
      const inverseFrequency = Math.log((prepared.length + 1) / (frequency + 1)) + 1;
      const termScore =
        fieldTermScore(item.title, term, 8) +
        fieldTermScore(item.aliases, term, 6) +
        fieldTermScore(item.tags, term, 4.5) +
        fieldTermScore(item.section, term, 4) +
        fieldTermScore(item.summary, term, 2.5) +
        fieldTermScore(item.body, term, 1);
      if (termScore > 0) {
        matchedTerms.push(term);
        score += termScore * inverseFrequency;
      }
    }
    if (contextSlug && item.chunk.slug === contextSlug && score > 0) score += 2;
    return { prepared: item, score, matchedTerms };
  });

  const leadingSlugs = new Set(scored
    .filter((item) => item.score >= MIN_RETRIEVAL_SCORE)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.prepared.chunk.slug));
  const neighborSlugs = new Set([...leadingSlugs].flatMap((slug) => index.graph[slug] || []));

  for (const item of scored) {
    if (item.score > 0 && neighborSlugs.has(item.prepared.chunk.slug) && !leadingSlugs.has(item.prepared.chunk.slug)) {
      item.score += 1.25;
    }
  }
  return { scored, terms };
}

function selectSources(scored: ScoredChunk[], limit: number, fallbackSlug = '') {
  const selected: ScoredChunk[] = [];
  const perPage = new Map<string, number>();
  const ranked = scored
    .filter((item) => item.score >= MIN_RETRIEVAL_SCORE)
    .sort((left, right) => right.score - left.score || left.prepared.chunk.chunkId.localeCompare(right.prepared.chunk.chunkId));

  for (const item of ranked) {
    const seen = perPage.get(item.prepared.chunk.slug) || 0;
    if (seen >= 2) continue;
    selected.push(item);
    perPage.set(item.prepared.chunk.slug, seen + 1);
    if (selected.length >= limit) break;
  }

  if (selected.length === 0 && fallbackSlug) {
    const fallback = scored.find((item) => item.prepared.chunk.slug === fallbackSlug && item.prepared.chunk.chunkId.endsWith('#overview'))
      || scored.find((item) => item.prepared.chunk.slug === fallbackSlug);
    if (fallback) selected.push(fallback);
  }
  return selected;
}

function contextForSources(sources: ScoredChunk[]) {
  let context = '';
  const included: ScoredChunk[] = [];
  for (const [index, item] of sources.entries()) {
    const chunk = item.prepared.chunk;
    const block = [
      `[SOURCE ${index + 1}]`,
      `CHUNK_ID: ${chunk.chunkId}`,
      `PAGE: ${chunk.title}`,
      `SECTION: ${chunk.section}`,
      `URL: ${chunk.href}`,
      `CONTENT: ${chunk.content}`
    ].join('\n');
    const next = context ? `${context}\n\n${block}` : block;
    if (next.length > MAX_CONTEXT_CHARACTERS) break;
    context = next;
    included.push(item);
  }
  return {
    context: context || 'No relevant local wiki evidence was retrieved.',
    sources: included
  };
}

function emptyRetrievalResult(
  index: WikiRetrievalIndex,
  blockedReason: WikiRetrievalResult['blockedReason'] = null
): WikiRetrievalResult {
  return {
    indexVersion: index.indexVersion,
    indexFingerprint: index.indexFingerprint,
    totalChunks: index.chunks.length,
    sources: [],
    context: 'No relevant local wiki evidence was retrieved.',
    evidenceScore: 0,
    queryCoverage: 0,
    shouldAbstain: true,
    blockedReason
  };
}

function boundedRetrievalResult(index: WikiRetrievalIndex, selected: ScoredChunk[]): WikiRetrievalResult {
  const packed = contextForSources(selected);
  return {
    indexVersion: index.indexVersion,
    indexFingerprint: index.indexFingerprint,
    totalChunks: index.chunks.length,
    sources: packed.sources.map(({ prepared, score, matchedTerms }) => ({
      chunkId: prepared.chunk.chunkId,
      contentHash: prepared.chunk.contentHash,
      slug: prepared.chunk.slug,
      title: prepared.chunk.title,
      section: prepared.chunk.section,
      href: prepared.chunk.href,
      score: Number(score.toFixed(3)),
      matchedTerms: matchedTerms.slice(0, 8)
    })),
    context: packed.context,
    evidenceScore: 1,
    queryCoverage: 1,
    shouldAbstain: false,
    blockedReason: null
  };
}

export function retrieveWikiContext(query: string, options: RetrievalOptions): WikiRetrievalResult {
  const index = getWikiRetrievalIndex();
  if (targetsHiddenPage(query)) return emptyRetrievalResult(index, 'hidden-page');
  if (targetsSensitiveInformation(query)) return emptyRetrievalResult(index, 'sensitive-query');
  if (isExplicitGeneralConversation(query, options.language)) return emptyRetrievalResult(index);

  const limit = Math.max(1, Math.min(MAX_SOURCE_LIMIT, options.limit || DEFAULT_SOURCE_LIMIT));
  const intent = homepageIntent(query, options.language);
  if (intent) {
    const selected = selectBoundedTargets(
      index,
      HOME_INTENT_TARGETS[options.language][intent],
      options.language,
      limit,
      'home-intent:' + intent
    );
    if (selected.length > 0) return boundedRetrievalResult(index, selected);
  }

  if (isContextReference(query, options.language)) {
    const selected = selectContextReferenceSources(index, options.contextSlug || '', options.language, limit);
    return selected.length > 0 ? boundedRetrievalResult(index, selected) : emptyRetrievalResult(index);
  }
  const { scored, terms } = scoreChunks(index, query, options.language, options.contextSlug);
  const selected = selectSources(scored, limit, options.contextSlug);
  const matched = new Set(selected.flatMap((item) => item.matchedTerms));
  const substantiveTerms = terms.filter((term) => !IDENTITY_QUERY_TERMS.has(term));
  const matchedSubstantiveTerms = substantiveTerms.filter((term) => matched.has(term));
  const queryCoverage = terms.length > 0 ? matched.size / terms.length : 0;
  const topScore = selected[0]?.score || 0;
  const evidenceScore = Math.min(1, queryCoverage * 0.65 + Math.min(1, topScore / 24) * 0.35);
  const identityOnlyEvidence = substantiveTerms.length > 0 && matchedSubstantiveTerms.length === 0;
  const requestedChineseTopic = options.language === 'zh' ? requestedChineseTopicPhrase(query) : null;
  const requestedChineseTopicMatched = !requestedChineseTopic || selected.some((item) => [
    item.prepared.title,
    item.prepared.section,
    item.prepared.aliases,
    item.prepared.tags,
    item.prepared.summary,
    item.prepared.body,
  ].some((field) => field.replace(/\s+/g, '').includes(requestedChineseTopic)));
  const weakEvidence = identityOnlyEvidence
    || evidenceScore < 0.35
    || topScore < 8
    || (options.language === 'en' && queryCoverage < 0.6)
    || !requestedChineseTopicMatched;
  const shouldAbstain = selected.length === 0 || weakEvidence;
  const groundedSelection = shouldAbstain ? [] : selected;
  const packed = contextForSources(groundedSelection);

  return {
    indexVersion: index.indexVersion,
    indexFingerprint: index.indexFingerprint,
    totalChunks: index.chunks.length,
    sources: packed.sources.map(({ prepared, score, matchedTerms }) => ({
      chunkId: prepared.chunk.chunkId,
      contentHash: prepared.chunk.contentHash,
      slug: prepared.chunk.slug,
      title: prepared.chunk.title,
      section: prepared.chunk.section,
      href: prepared.chunk.href,
      score: Number(score.toFixed(3)),
      matchedTerms: matchedTerms.slice(0, 8)
    })),
    context: packed.context,
    evidenceScore: Number(evidenceScore.toFixed(3)),
    queryCoverage: Number(queryCoverage.toFixed(3)),
    shouldAbstain,
    blockedReason: null
  };
}

export function clearWikiRetrievalCache() {
  cachedIndex = null;
  cachedPrepared = null;
  cachedHiddenQueryPhrases = null;
}
