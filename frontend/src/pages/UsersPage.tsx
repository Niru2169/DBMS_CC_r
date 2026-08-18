import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toaster';
import { getInitials, formatDate } from '@/lib/utils';
import { Search, UserPlus, UserMinus, Users } from 'lucide-react';

interface UserItem {
  user_id: number;
  username: string;
  is_artist: boolean;
  created_at: string;
  artist?: { name: string; country: string | null } | null;
}

export function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = (q = '') => {
    setLoading(true);
    Promise.all([
      api.get('/users', { params: q ? { username: q } : {} }),
      api.get('/users/me/following'),
    ]).then(([usersRes, followRes]) => {
      setUsers(usersRes.data.filter((u: UserItem) => u.user_id !== user?.user_id));
      setFollowing(new Set(followRes.data.map((u: UserItem) => u.user_id)));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(query);
  };

  const toggleFollow = async (targetUser: UserItem) => {
    const isFollowing = following.has(targetUser.user_id);
    try {
      if (isFollowing) {
        await api.delete(`/users/${targetUser.user_id}/follow`);
        setFollowing((prev) => { const next = new Set(prev); next.delete(targetUser.user_id); return next; });
        toast({ title: `Unfollowed ${targetUser.username}` });
      } else {
        await api.post(`/users/${targetUser.user_id}/follow`);
        setFollowing((prev) => new Set(prev).add(targetUser.user_id));
        toast({ title: `Now following ${targetUser.username}` });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast({ title: 'Error', description: msg || 'Action failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Search and follow other users</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          id="user-search-input"
          placeholder="Search by username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" size="icon" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center h-40 items-center"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" /></div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => {
            const isFollowing = following.has(u.user_id);
            const displayName = u.artist?.name || u.username;
            return (
              <Card key={u.user_id} className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center gap-4 py-4">
                  <Avatar className="h-11 w-11 flex-shrink-0">
                    <AvatarFallback className={`text-sm font-bold ${isFollowing ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{displayName}</p>
                      {u.is_artist && <Badge variant="secondary" className="text-[10px]">Artist</Badge>}
                      {isFollowing && <Badge variant="outline" className="text-[10px]">Following</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{u.username}
                      {u.artist?.country && ` · ${u.artist.country}`}
                      {` · Joined ${formatDate(u.created_at)}`}
                    </p>
                  </div>
                  <Button
                    id={`follow-btn-${u.user_id}`}
                    variant={isFollowing ? 'outline' : 'default'}
                    size="sm"
                    className="gap-1.5 flex-shrink-0"
                    onClick={() => toggleFollow(u)}
                  >
                    {isFollowing ? (
                      <><UserMinus className="h-3.5 w-3.5" /> Unfollow</>
                    ) : (
                      <><UserPlus className="h-3.5 w-3.5" /> Follow</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
