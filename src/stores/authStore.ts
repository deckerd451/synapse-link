import { create } from 'zustand';
import { Profile, Notification, Connection, NetworkGraphData } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
const USER_ID_STORAGE_KEY = 'synapse-user-id';
interface AuthState {
  profile: Profile | null;
  loading: boolean;
  notifications: Notification[];
  setProfile: (profile: Profile | null) => void;
  signIn: (email: string) => Promise<void>;
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  handleConnectionRequest: (connection: Connection, newStatus: 'accepted' | 'declined') => Promise<void>;
  endorseSkill: (endorsedUserId: string, skill: string) => Promise<void>;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,
  notifications: [],
  setProfile: (profile) => set({ profile }),
  signIn: async (email) => {
    try {
      set({ loading: true });
      const profile = await api<Profile>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      localStorage.setItem(USER_ID_STORAGE_KEY, profile.id);
      set({ profile });
      get().fetchNotifications();
    } catch (error: any) {
      toast.error(error.message || 'Login failed.');
    } finally {
      set({ loading: false });
    }
  },
  checkUser: async () => {
    try {
      set({ loading: true });
      const userId = localStorage.getItem(USER_ID_STORAGE_KEY);
      if (userId) {
        const profile = await api<Profile>(`/api/auth/me/${userId}`);
        set({ profile });
        get().fetchNotifications();
      }
    } catch (error) {
      console.error('Error in checkUser, clearing session:', error);
      localStorage.removeItem(USER_ID_STORAGE_KEY);
      set({ profile: null });
    } finally {
      set({ loading: false });
    }
  },
  signOut: async () => {
    localStorage.removeItem(USER_ID_STORAGE_KEY);
    set({ profile: null, notifications: [] });
    toast.info('You have been signed out.');
  },
  fetchNotifications: async () => {
    const profile = get().profile;
    if (!profile) return;
    try {
      const { connections, profiles } = await api<NetworkGraphData>('/api/network-graph');
      const profilesById = new Map(profiles.map((p) => [p.id, p]));
      const incomingRequests = connections
        .filter((c) => c.to_user_id === profile.id && c.status === 'pending')
        .map((c) => {
          const fromProfile = profilesById.get(c.from_user_id);
          return {
            ...c,
            profiles: {
              id: fromProfile?.id || '',
              name: fromProfile?.name || 'Unknown',
              email: fromProfile?.email || '',
              image_url: fromProfile?.image_url || ''
            }
          } as Notification;
        });
      set({ notifications: incomingRequests });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },
  handleConnectionRequest: async (connection, newStatus) => {
    try {
      const connectionId = `${connection.from_user_id}:${connection.to_user_id}`;
      await api(`/api/connections/${connectionId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      get().fetchNotifications();
    } catch (error: any) {
      console.error(`Error handling connection request:`, error);
      toast.error(error.message || 'Failed to update connection.');
    }
  },
  endorseSkill: async (endorsedUserId, skill) => {
    const currentUser = get().profile;
    if (!currentUser) {
      toast.error('You must be logged in to endorse a skill.');
      return;
    }
    try {
      await api('/api/endorsements', {
        method: 'POST',
        body: JSON.stringify({
          endorsed_user_id: endorsedUserId,
          endorsed_by_user_id: currentUser.id,
          skill: skill
        })
      });
      toast.success(`You endorsed ${skill}!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to endorse skill.');
    }
  }
}));
useAuthStore.getState().checkUser();