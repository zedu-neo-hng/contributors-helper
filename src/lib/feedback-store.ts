import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type Rating = 'up' | 'down';
export type FeedbackRecord = {
  responseId: string;
  rating: Rating;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

function getStorePath() {
  return process.env.FEEDBACK_DATA_FILE || path.join(process.cwd(), 'data', 'feedback.json');
}

export async function readFeedback(): Promise<FeedbackRecord[]> {
  try {
    const contents = await readFile(getStorePath(), 'utf8');
    const data: unknown = JSON.parse(contents);
    return Array.isArray(data) ? data as FeedbackRecord[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

let writeQueue: Promise<void> = Promise.resolve();

export function saveFeedback(record: Pick<FeedbackRecord, 'responseId' | 'rating' | 'comment'>) {
  const write = writeQueue.then(async () => {
    const filePath = getStorePath();
    const directory = path.dirname(filePath);
    await mkdir(directory, { recursive: true });
    const entries = await readFeedback();
    const now = new Date().toISOString();
    const existing = entries.find((entry) => entry.responseId === record.responseId);
    const updated: FeedbackRecord = {
      ...record,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = existing
      ? entries.map((entry) => entry.responseId === record.responseId ? updated : entry)
      : [...entries, updated];
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(next, null, 2), 'utf8');
    await rename(temporaryPath, filePath);
  });
  writeQueue = write.catch(() => undefined);
  return write;
}

export type DailyFeedback = { date: string; up: number; down: number };
export type FeedbackAnalytics = {
  positive: number;
  negative: number;
  total: number;
  approvalRate: number;
  lastResponseAt: string | null;
  trend: DailyFeedback[];
  recentFeedback: FeedbackRecord[];
  recentComments: FeedbackRecord[];
};

export function aggregateFeedback(records: FeedbackRecord[], now = new Date()): FeedbackAnalytics {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - 13);
  const trend: DailyFeedback[] = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), up: 0, down: 0 };
  });
  const trendByDate = new Map(trend.map((day) => [day.date, day]));
  let positive = 0;
  let negative = 0;

  for (const record of records) {
    if (record.rating === 'up') positive += 1;
    if (record.rating === 'down') negative += 1;
    const day = trendByDate.get(record.updatedAt.slice(0, 10));
    if (day) day[record.rating] += 1;
  }

  const total = positive + negative;
  const sortedFeedback = [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const recentFeedback = sortedFeedback.slice(0, 7);
  const recentComments = sortedFeedback
    .filter((record) => record.rating === 'down' && record.comment.trim())
    .slice(0, 8);
  const lastResponseAt = records.length
    ? records.reduce((latest, record) => record.updatedAt > latest ? record.updatedAt : latest, records[0].updatedAt)
    : null;

  return {
    positive,
    negative,
    total,
    approvalRate: total === 0 ? 0 : Math.round((positive / total) * 100),
    lastResponseAt,
    trend,
    recentFeedback,
    recentComments,
  };
}
