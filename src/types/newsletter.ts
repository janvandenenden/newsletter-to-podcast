export interface NewsletterMeta {
  id: string;
  sender: string;
  subject: string;
  receivedAt: string;
  contentPreview: string;
  contentLength: number;
  used: boolean;
  episodeIds: string[];
}
