export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Boilerplate types, kept for compatibility
export type User = { id: string; name: string };
export type Chat = { id: string; title: string };
export type ChatMessage = { id: string; chatId: string; userId: string; text: string; ts: number };
// Application-specific types, decoupled from Supabase
export interface Profile {
  id: string;
  updated_at: string | null;
  name: string | null;
  email: string | null;
  bio: string | null;
  skills?: string[] | null;
  image_url?: string | null;
}
export interface Connection {
  id: string;
  created_at: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
}
export interface Endorsement {
  id: string;
  created_at: string;
  skill: string;
  endorsed_user_id: string;
  endorsed_by_user_id: string;
}
// Custom type for notifications, joining connection with sender's profile
export type Notification = Connection & {
  profiles: Pick<Profile, 'id' | 'name' | 'email' | 'image_url'>;
};
// Custom type for the network graph data
export type NetworkGraphData = {
  profiles: Profile[];
  connections: Connection[];
};