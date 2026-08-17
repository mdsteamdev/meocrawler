export type PlatformType = 'facebook' | 'tiktok' | 'threads';
export type SearchType = 'KEYWORD' | 'HASHTAG';

export interface CrawlRequest {
  jobId?: string;
  campaignId: string;
  platform: PlatformType;
  searchTerm: string;
  searchType: SearchType;
  maxPosts?: number;
  internalSources?: InternalSource[];
}

export interface InternalSource {
  platform: PlatformType;
  authorName?: string;
  authorUrl?: string;
  urlPattern?: string;
}

export interface RawSocialPost {
  postId?: string | null;
  postUrl: string;
  authorName?: string | null;
  authorUrl?: string | null;
  postText?: string | null;
  postedAt?: string | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  views?: number | null;
  mediaType?: string | null;
  isPublic?: boolean;
  rawData?: Record<string, any> | null;
}

export interface NormalizedSocialPost {
  postId: string;
  campaignId: string;
  platform: PlatformType;
  searchType: SearchType;
  searchTerm: string;
  postUrl: string;
  authorName: string | null;
  authorUrl: string | null;
  postText: string | null;
  postedAt: string | null;
  collectedAt: string;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  views: number | null;
  engagement: number | null;
  mediaType: string;
  isPublic: boolean;
  isInternal: boolean;
  status: string;
  rawData: string;
  crawlRunId: string;
}

export interface CrawlResult {
  success: boolean;
  runId: string;
  campaignId: string;
  platform: PlatformType;
  searchTerm: string;
  postsFound: number;
  newPostsCount: number;
  duplicatePostsCount: number;
  internalPostsCount: number;
  errorCount: number;
  posts: NormalizedSocialPost[];
  status: string;
  errorMessage?: string;
}
