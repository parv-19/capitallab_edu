import {
  FULL_NOTES_REFUSAL_MESSAGE,
  NOT_FOUND_MESSAGE,
  runCFAChat,
  type ChatMessage,
  type RetrievedChunk,
  UNRELATED_REFUSAL_MESSAGE,
} from "../config/masterPrompt";
import { retrieve } from "./ragRetrieval";

const TOP_K = 6;
const RELEVANCE_THRESHOLD = 0.8;

const FULL_NOTES_PATTERNS = [
  /\bfull notes\b/i,
  /\bcomplete notes\b/i,
  /\bwhole (chapter|book|pdf|document|file|content|material)\b/i,
  /\bentire (chapter|book|pdf|document|file|content|material|text)\b/i,
  /\bfull (chapter|book|pdf|document|content|material|text)\b/i,
  /\braw chunks?\b/i,
  /\ball raw chunks?\b/i,
  /\bshow (me )?(all|full|complete) (content|context|notes|material)\b/i,
  /\bcopy (the )?(whole |entire |full )?(chapter|book|pdf|document|notes|material|content|text)\b/i,
  /\bpaste (the )?(whole |entire |full )?(chapter|book|pdf|document|notes|material|content|text)\b/i,
  /\bprint (the )?(whole |entire |full )?(chapter|book|pdf|document|notes|material|content|text)\b/i,
  /\b(copy|paste|print|show|export|dump)\b.*\b(pdf|document|book|chapter|material|content|text|chunks?)\b/i,
  /\b(copy|paste|print|show|export|dump)\b.*\buploaded (documents?|materials?|pdfs?|files?)\b/i,
];

const UNRELATED_PATTERNS = [
  /\b(weather|temperature|forecast)\b/i,
  /\bmovie|movies|actor|actors\b/i,
  /\brecipe|cooking|food\b/i,
  /\bfootball|cricket|nba|ipl|soccer\b/i,
];
const DEFINITION_PATTERNS = [
  /^\s*what is\b/i,
  /^\s*what are\b/i,
  /^\s*define\b/i,
  /^\s*explain\b/i,
  /^\s*describe\b/i,
  /^\s*how does\b/i,
  /^\s*how do\b/i,
  /^\s*why does\b/i,
  /^\s*why do\b/i,
  /^\s*difference between\b/i,
  /^\s*what is the difference between\b/i,
  /^\s*cfa means\b/i,
];
const SECTION_PREFERENCE: Record<string, number> = {
  key_concepts: 5,
  content: 4,
  example: 3,
  los_statement: 2,
  formula: 1,
  quiz_question: 0,
  answer_key: 0,
};

export interface ChatAnswerResult {
  answer: string;
  usedChunks: RetrievedChunk[];
  status: "answered" | "refused" | "not_found";
}

function isFullNotesRequest(message: string): boolean {
  return FULL_NOTES_PATTERNS.some((pattern) => pattern.test(message));
}

function isClearlyUnrelated(message: string): boolean {
  return UNRELATED_PATTERNS.some((pattern) => pattern.test(message));
}

function sanitizeAnswer(answer: string): string {
  const structuredStart = answer.indexOf("1. Concept Explanation:");
  const candidate = structuredStart >= 0 ? answer.slice(structuredStart) : answer;

  const cleaned = candidate
    .replace(/\[CHUNK[^\]]*\]/gi, "")
    .replace(/RETRIEVED CONTEXT/gi, "")
    .replace(/\bContext:\b[\s\S]*?(?=1\. Concept Explanation:|$)/gi, "")
    .replace(/\s+\n/g, "\n")
    .trim();

  if (cleaned.includes(NOT_FOUND_MESSAGE) && cleaned !== NOT_FOUND_MESSAGE) {
    return NOT_FOUND_MESSAGE;
  }

  return cleaned || NOT_FOUND_MESSAGE;
}

function formatSourceLabel(chunk: RetrievedChunk): string {
  const page = chunk.metadata.pageNumber ?? chunk.metadata.page ?? "?";
  const file = chunk.metadata.documentTitle ?? chunk.metadata.filename ?? "uploaded document";
  const reading = chunk.metadata.reading?.trim();
  const module = chunk.metadata.module?.trim();

  return [reading ? `Reading ${reading}` : null, module ? `Module ${module}` : null, `Page ${page}`, file]
    .filter(Boolean)
    .join(", ");
}

function extractTopic(message: string): string {
  const normalized = message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\baccording to the material\b/g, " ")
    .replace(/\bin the material\b/g, " ")
    .replace(/\bfrom the material\b/g, " ")
    .replace(/\b(in simple language|simply|simple language|briefly|shortly)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /^(?:define|explain|describe)\s+(.+)$/i,
    /^(?:what is|what are)\s+(.+)$/i,
    /^(?:how does|how do|why does|why do)\s+(.+)$/i,
    /^(?:difference between|what is the difference between)\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/\bin cfa\b/g, " ")
        .replace(/\bfor cfa\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return normalized;
}

function extractSubstantiveKeywords(topic: string): string[] {
  return topic
    .split(/\s+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 2)
    .filter(
      (word) =>
        ![
          "about",
          "course",
          "material",
          "cfa",
          "context",
          "means",
          "book",
          "author",
          "simple",
          "language",
          "what",
          "define",
          "explain",
          "describe",
          "difference",
          "between",
          "does",
          "how",
          "why",
          "according",
          "what",
          "give",
          "whole",
          "full",
          "entire",
          "copy",
          "paste",
          "here",
          "this",
          "that",
        ].includes(word),
    );
}

function extractComparisonItems(topic: string): [string, string] | null {
  const normalized = topic
    .replace(/^what is the difference between\s+/i, "")
    .replace(/^difference between\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const splitMatch = normalized.match(/(.+?)\s+(?:and|vs|versus)\s+(.+)/i);
  if (!splitMatch?.[1] || !splitMatch?.[2]) {
    return null;
  }

  return [splitMatch[1].trim(), splitMatch[2].trim()];
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordAppearsInHaystack(keyword: string, haystack: string): boolean {
  if (!keyword) return false;

  const forms = new Set([
    keyword,
    keyword.endsWith("s") ? keyword.slice(0, -1) : `${keyword}s`,
    keyword.endsWith("es") ? keyword.slice(0, -2) : `${keyword}es`,
    keyword.endsWith("y") ? `${keyword.slice(0, -1)}ies` : keyword,
    keyword.endsWith("ion") ? `${keyword}s` : keyword,
  ]);

  return [...forms].some((form) => form.length >= 3 && haystack.includes(form));
}

function contextDirectlySupportsQuestion(message: string, chunks: RetrievedChunk[]): boolean {
  const topic = extractTopic(message);
  if (!topic) return false;

  const haystack = normalizeForMatch(
    chunks
      .map((chunk) => `${chunk.content}\n${chunk.metadata.topic ?? ""}\n${chunk.metadata.los ?? ""}`)
      .join("\n"),
  );
  if (haystack.includes(normalizeForMatch(topic))) return true;

  const keywords = extractSubstantiveKeywords(topic);
  if (keywords.length === 0) return false;

  const matchedKeywords = keywords.filter((word) => keywordAppearsInHaystack(word, haystack));
  const minimumMatches = keywords.length === 1 ? 1 : Math.max(2, Math.ceil(keywords.length / 2));

  return matchedKeywords.length >= minimumMatches;
}

function dedupeChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<string>();

  return chunks.filter((chunk) => {
    const key = `${chunk.content}:${chunk.metadata.page}:${chunk.metadata.section}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isDefinitionStyleQuestion(message: string): boolean {
  return DEFINITION_PATTERNS.some((pattern) => pattern.test(message));
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/\bIn inance\b/gi, "In finance")
    .replace(/\binance\b/gi, "finance")
    .replace(/\blows\b/g, "flows")
    .replace(/\binlows\b/g, "inflows")
    .replace(/\boutlows\b/g, "outflows")
    .replace(/\bdiversiication\b/gi, "diversification")
    .replace(/\bspeciication\b/gi, "specification")
    .replace(/\bconicts\b/gi, "conflicts")
    .replace(/\bcoeficient\b/gi, "coefficient")
    .replace(/\bcovari ance\b/gi, "covariance")
    .replace(/\bcorrel ation\b/gi, "correlation")
    .replace(/\bdiversifi cation\b/gi, "diversification")
    .replace(/\bfi rm\b/gi, "firm")
    .replace(/\bchartered financial analyst\b/gi, "Chartered Financial Analyst")
    .replace(/\t/g, " ")
    .replace(/\s*σ\s*2\s*/g, " variance ")
    .replace(/\bR\s*t\b/g, "return in period t")
    .replace(/\bμ\b/g, "mean")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bVideo covering this content is available online\.?/gi, "")
    .replace(/\bLOS\s*\d+[a-z]?[:.]?/gi, "")
    .replace(/^Variance \(Standard Deviation\) of Returns for an Individual Security\s*/i, "")
    .replace(/^Standard deviation of returns from historical data:\s*/i, "")
    .replace(/^correlation\) of asset returns based on historical data\.\s*/i, "")
    .trim();
}

function sentenceSplit(text: string): string[] {
  return cleanExtractedText(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => cleanExtractedText(part))
    .filter((part) => part.length >= 25)
    .filter((part) => /[a-z]{3,}/i.test(part))
    .filter((part) => !/^(where|video covering|topic quiz|answer key)\b/i.test(part));
}

function isReadableSentence(sentence: string): boolean {
  if (sentence.length < 25) return false;
  if (!/[a-z]{3,}/i.test(sentence)) return false;
  if (/[=:]\s*$/.test(sentence)) return false;
  if (/^\d+(\.\d+)?\s*$/.test(sentence)) return false;
  if (/^\W+$/.test(sentence)) return false;
  return true;
}

function scoreChunkForTopic(chunk: RetrievedChunk, keywords: string[]): number {
  const content = chunk.content.toLowerCase();
  const topic = (chunk.metadata.topic ?? "").toLowerCase();
  const los = (chunk.metadata.los ?? "").toLowerCase();
  const overlap = keywords.filter(
    (keyword) => content.includes(keyword) || topic.includes(keyword) || los.includes(keyword),
  ).length;
  return overlap * 10 + (SECTION_PREFERENCE[chunk.metadata.section ?? "content"] ?? 0);
}

function scoreSentenceForKeywords(sentence: string, keywords: string[], exactPhrases: string[]): number {
  const normalizedSentence = sentence.toLowerCase();
  const keywordScore = keywords.filter((keyword) => normalizedSentence.includes(keyword)).length * 10;
  const exactPhraseScore = exactPhrases.some((phrase) => normalizedSentence.includes(phrase)) ? 25 : 0;
  const causalScore = /\b(because|therefore|thus|helps|reduces|increase|decrease|affect|relationship)\b/i.test(
    sentence,
  )
    ? 6
    : 0;

  return keywordScore + exactPhraseScore + causalScore;
}

function buildSourceBlock(chunks: RetrievedChunk[], maxSources: number = 3): string {
  const labels = chunks
    .map((chunk) => `- 📄 [${formatSourceLabel(chunk)}]`)
    .filter((label, index, allLabels) => allLabels.indexOf(label) === index)
    .slice(0, maxSources);

  return labels.join("\n");
}

function formatTutorAnswer(params: {
  directAnswer: string;
  explanation: string[];
  keyPoints: string[];
  optionalHint?: string | null;
  sources: RetrievedChunk[];
}): string {
  const explanationBlock = params.explanation.map((line, index) => `${index + 1}. ${line}`).join("\n");
  const keyPointsBlock =
    params.keyPoints.length > 0 ? params.keyPoints.map((point) => `- ${point}`).join("\n") : "- None";
  const hintBlock = params.optionalHint ? `4. Exam Hint\n${params.optionalHint}` : null;

  return [
    `1. Direct Answer\n${params.directAnswer}`,
    `2. Explanation\n${explanationBlock}`,
    `3. Key Points\n${keyPointsBlock}`,
    hintBlock,
    `5. Source\n${buildSourceBlock(params.sources)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function collectCandidateSentences(topic: string, keywords: string[], chunks: RetrievedChunk[]) {
  const exactPhrases = [topic.toLowerCase()].filter((phrase) => phrase.length >= 4);
  const rankedChunks = [...chunks]
    .filter((chunk) => (SECTION_PREFERENCE[chunk.metadata.section ?? "content"] ?? 0) > 0)
    .sort((a, b) => scoreChunkForTopic(b, keywords) - scoreChunkForTopic(a, keywords));

  return rankedChunks.flatMap((chunk) =>
    sentenceSplit(chunk.content).map((sentence) => ({
      sentence,
      score:
        scoreSentenceForKeywords(sentence, keywords, exactPhrases) +
        (SECTION_PREFERENCE[chunk.metadata.section ?? "content"] ?? 0),
      chunk,
    })),
  );
}

function generateDefinitionAnswer(message: string, chunks: RetrievedChunk[]): string | null {
  const topic = extractTopic(message);
  const keywords = extractSubstantiveKeywords(topic);
  if (keywords.length === 0) return null;

  const strongSentences = collectCandidateSentences(topic, keywords, chunks)
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .filter((entry) => isReadableSentence(entry.sentence))
    .filter((entry, index, all) => all.findIndex((candidate) => candidate.sentence === entry.sentence) === index);

  if (strongSentences.length === 0) return null;

  const directAnswer = strongSentences[0].sentence;
  const explanation = strongSentences.slice(0, 3).map((entry) => entry.sentence);
  const keyPoints = strongSentences
    .slice(1)
    .map((entry) => entry.sentence)
    .filter((sentence) => sentence !== directAnswer)
    .slice(0, 3);
  const hintEntry = strongSentences.find((entry) => entry.chunk.metadata.section === "key_concepts");

  return formatTutorAnswer({
    directAnswer,
    explanation,
    keyPoints,
    optionalHint: hintEntry?.sentence ?? null,
    sources: strongSentences.slice(0, 3).map((entry) => entry.chunk),
  });
}

function generateComparisonAnswer(message: string, chunks: RetrievedChunk[]): string | null {
  const topic = extractTopic(message);
  const items = extractComparisonItems(topic);
  if (!items) return null;

  const [leftItem, rightItem] = items;
  const leftKeywords = extractSubstantiveKeywords(leftItem);
  const rightKeywords = extractSubstantiveKeywords(rightItem);
  if (leftKeywords.length === 0 || rightKeywords.length === 0) return null;

  const leftCandidates = collectCandidateSentences(leftItem, leftKeywords, chunks)
    .filter((entry) => entry.score > 0 && isReadableSentence(entry.sentence))
    .sort((a, b) => b.score - a.score);
  const rightCandidates = collectCandidateSentences(rightItem, rightKeywords, chunks)
    .filter((entry) => entry.score > 0 && isReadableSentence(entry.sentence))
    .sort((a, b) => b.score - a.score);

  if (leftCandidates.length === 0 || rightCandidates.length === 0) return null;

  const leftSentence = leftCandidates[0].sentence;
  const rightSentence = rightCandidates[0].sentence;
  const differenceSentence =
    [...leftCandidates, ...rightCandidates].find(
      (entry) =>
        /\bwhereas|while|however|unlike|compared with|difference\b/i.test(entry.sentence) &&
        isReadableSentence(entry.sentence),
    )?.sentence ??
    `The main difference is that ${leftItem} and ${rightItem} are described separately in the uploaded material and should not be treated as the same concept.`;

  return formatTutorAnswer({
    directAnswer: `${leftSentence} ${rightSentence}`,
    explanation: [leftSentence, rightSentence, differenceSentence],
    keyPoints: [
      `${leftItem}: ${leftSentence}`,
      `${rightItem}: ${rightSentence}`,
      `Key difference: ${differenceSentence}`,
    ],
    optionalHint: null,
    sources: [leftCandidates[0].chunk, rightCandidates[0].chunk],
  });
}

function generateReasoningAnswer(message: string, chunks: RetrievedChunk[]): string | null {
  const topic = extractTopic(message);
  const keywords = extractSubstantiveKeywords(topic);
  if (keywords.length === 0) return null;

  const strongSentences = collectCandidateSentences(topic, keywords, chunks)
    .filter((entry) => entry.score > 0 && isReadableSentence(entry.sentence))
    .sort((a, b) => b.score - a.score)
    .filter((entry, index, all) => all.findIndex((candidate) => candidate.sentence === entry.sentence) === index);

  if (strongSentences.length === 0) return null;

  const directAnswer = strongSentences[0].sentence;
  const explanation = strongSentences.slice(0, 3).map((entry) => entry.sentence);
  const keyPoints = strongSentences.slice(0, 3).map((entry) => entry.sentence);

  return formatTutorAnswer({
    directAnswer,
    explanation,
    keyPoints,
    optionalHint: null,
    sources: strongSentences.slice(0, 3).map((entry) => entry.chunk),
  });
}

function generateExtractiveAnswer(message: string, chunks: RetrievedChunk[]): string | null {
  if (/^\s*(difference between|what is the difference between)\b/i.test(message)) {
    return generateComparisonAnswer(message, chunks);
  }

  if (/^\s*(how does|how do|why does|why do)\b/i.test(message)) {
    const reasoningAnswer = generateReasoningAnswer(message, chunks);
    if (reasoningAnswer) {
      return reasoningAnswer;
    }
  }

  return generateDefinitionAnswer(message, chunks);
}

export async function generateChatAnswer(params: {
  message: string;
  courseIds: string[];
  conversationHistory?: ChatMessage[];
}): Promise<ChatAnswerResult> {
  const { message, courseIds, conversationHistory = [] } = params;

  if (isFullNotesRequest(message)) {
    return {
      answer: FULL_NOTES_REFUSAL_MESSAGE,
      usedChunks: [],
      status: "refused",
    };
  }

  if (isClearlyUnrelated(message)) {
    return {
      answer: UNRELATED_REFUSAL_MESSAGE,
      usedChunks: [],
      status: "refused",
    };
  }

  const retrievedSets = await Promise.all(
    courseIds.map((courseId) => retrieve(message, courseId, TOP_K, RELEVANCE_THRESHOLD)),
  );

  const usedChunks = dedupeChunks(
    retrievedSets
      .flat()
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, TOP_K)
      .map((chunk) => ({
        content: chunk.content,
        score: chunk.score,
        metadata: {
          ...chunk.metadata,
          courseId: String(chunk.metadata.courseId),
        },
      })),
  );

  if (usedChunks.length === 0) {
    return {
      answer: NOT_FOUND_MESSAGE,
      usedChunks: [],
      status: "not_found",
    };
  }

  if (!contextDirectlySupportsQuestion(message, usedChunks)) {
    return {
      answer: NOT_FOUND_MESSAGE,
      usedChunks,
      status: "not_found",
    };
  }

  const extractiveAnswer = generateExtractiveAnswer(message, usedChunks);
  if (extractiveAnswer && isDefinitionStyleQuestion(message)) {
    return {
      answer: extractiveAnswer,
      usedChunks,
      status: "answered",
    };
  }

  if (extractiveAnswer && usedChunks.length > 0) {
    const topChunkOverlap = extractSubstantiveKeywords(extractTopic(message)).filter((keyword) =>
      usedChunks.some((chunk) =>
        normalizeForMatch(`${chunk.content} ${chunk.metadata.topic ?? ""} ${chunk.metadata.los ?? ""}`).includes(keyword),
      ),
    ).length;

    if (topChunkOverlap >= 2 || usedChunks.length >= 4) {
      return {
        answer: extractiveAnswer,
        usedChunks,
        status: "answered",
      };
    }
  }

  const answer = await runCFAChat(message, usedChunks, conversationHistory);

  return {
    answer: sanitizeAnswer(answer),
    usedChunks,
    status: "answered",
  };
}
