import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Profile } from '@shared/types';
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters.').optional(),
  skills: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;
export function ProfileTab() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [loading, setLoading] = useState(false);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      bio: '',
      skills: '',
    },
  });
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        bio: profile.bio || '',
        skills: profile.skills?.join(', ') || '',
      });
    }
  }, [profile, form]);
  const onSubmit = async (data: ProfileFormValues) => {
    if (!profile) return;
    setLoading(true);
    try {
      const updates: Profile = {
        ...profile,
        name: data.name,
        bio: data.bio,
        skills: data.skills?.split(',').map(s => s.trim()).filter(Boolean) || [],
        updated_at: new Date().toISOString(),
      };
      const updatedProfile = await api<Profile>('/api/profiles', {
        method: 'POST',
        body: JSON.stringify(updates),
      });
      setProfile(updatedProfile);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };
  // Note: Image upload is not implemented in this DO version for simplicity.
  // A real implementation would require a service like Cloudflare Images.
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24 border-2 border-gold/50">
          <AvatarImage src={profile?.image_url || undefined} alt={profile?.name || 'User'} />
          <AvatarFallback className="bg-muted text-3xl">{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{profile?.name || 'Your Profile'}</h2>
          <p className="text-muted-foreground">{profile?.email}</p>
          <Button size="sm" className="mt-2" disabled>
            <Upload className="mr-2 h-4 w-4" />
            Upload Photo (Disabled)
          </Button>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tell us about yourself..." className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skills</FormLabel>
                <FormControl>
                  <Input placeholder="React, TypeScript, Node.js" {...field} />
                </FormControl>
                <p className="text-sm text-muted-foreground">Enter skills separated by commas.</p>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="bg-gold text-background hover:bg-gold/90 font-bold">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </div>
  );
}