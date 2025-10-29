import { useState } from 'react';
import { Profile } from '@shared/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { UserPlus, PlusCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
interface UserCardProps {
  profile: Profile;
}
function EndorseSkillsDialog({ profile }: { profile: Profile }) {
  const endorseSkill = useAuthStore((s) => s.endorseSkill);
  const [open, setOpen] = useState(false);
  const handleEndorse = (skill: string) => {
    endorseSkill(profile.id, skill);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex flex-wrap gap-2 justify-center cursor-pointer">
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="secondary" className="bg-cyan/10 text-cyan hover:bg-cyan/20 transition-colors">
                {skill}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No skills listed.</p>
          )}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Endorse Skills for <span className="text-gold">{profile.name}</span></DialogTitle>
          <DialogDescription>
            Acknowledge their expertise by endorsing their skills.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.map((skill) => (
              <div key={skill} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span className="font-medium">{skill}</span>
                <Button size="sm" variant="ghost" className="text-cyan hover:bg-cyan/10 hover:text-cyan" onClick={() => handleEndorse(skill)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Endorse
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center">This user hasn't listed any skills to endorse.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function UserCard({ profile }: UserCardProps) {
  const currentUser = useAuthStore((s) => s.profile);
  const handleConnect = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to connect.');
      return;
    }
    if (currentUser.id === profile.id) {
      toast.info("You can't connect with yourself.");
      return;
    }
    try {
      await api('/api/connections', {
        method: 'POST',
        body: JSON.stringify({
          from_user_id: currentUser.id,
          to_user_id: profile.id,
        }),
      });
      toast.success(`Connection request sent to ${profile.name}.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send connection request.');
    }
  };
  return (
    <Card className="bg-background/60 border-cyan/20 backdrop-blur-sm transition-all hover:border-cyan/40 hover:shadow-lg hover:shadow-cyan/10 flex flex-col">
      <CardHeader className="items-center text-center">
        <Avatar className="h-20 w-20 mb-4 border-2 border-gold/50">
          <AvatarImage src={profile.image_url || undefined} alt={profile.name || 'User'} />
          <AvatarFallback className="bg-muted text-2xl">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-gold">{profile.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </CardHeader>
      <CardContent className="text-center flex-grow">
        <p className="text-sm text-foreground/90 mb-4 min-h-[40px]">{profile.bio || 'No bio available.'}</p>
        <EndorseSkillsDialog profile={profile} />
      </CardContent>
      <CardFooter className="flex justify-center mt-auto pt-4">
        {currentUser && currentUser.id !== profile.id && (
          <Button onClick={handleConnect} className="bg-cyan text-background hover:bg-cyan/90 font-bold w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            Connect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}