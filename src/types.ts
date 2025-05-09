export interface VideoData {
  id: number;
  src: string;
  title?: string;           // Optional title
  productLink?: string;     // Optional product link
  description?: string;     // Optional description field
  likes?: number;
  shares?: number; 
  comment_count?: number;
  ticketLink?: string;
  group_slug?: string;
  group_avatar_url?: string;
  userLiked?: boolean; 
  timestamp: string;
}
