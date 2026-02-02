
export interface PoemLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  poet: string;
  preview: string;
  fullPoem?: string;
  audioUrl?: string;
  muralUrl?: string;
  muralType?: 'image' | 'video';
  poetImageUrl?: string;
  isPurchased: boolean;
  price: number;
  isUserSubmitted?: boolean;
  publishDate?: string;
  views?: number;
  drive_file_id?: string;
  thumbnail_url?: string;
  user_id?: string;
}

export interface UserProfile {
  id: string;
  balance: number;
  role: AppRole;
  name?: string;
  bio?: string;
}

export type AppRole = 'admin' | 'reader' | 'poet' | null;
export type AppTheme = 'vivid' | 'photocopy';
