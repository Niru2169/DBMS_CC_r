import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { formatDuration } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ListMusic, Users, Music2, Mic2, ArrowRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface Playlist {
  playlist_id: number;
  name: string;
  duration: number;
  release_type: string | null;
  is_shared: boolean;
  _count: { songs: number };
}

interface FollowedUser {
  user_id: number;
  username: string;
  is_artist: boolean;
  artist?: { name: string } | null;
}

interface UserSummaryStats {
  playlistCount: number;
  followingCount: number;
  followersCount: number;
  totalListens: number;
  totalListeningMinutes: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stats, setStats] = useState<UserSummaryStats | null>(null);
  const [following, setFollowing] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/me/stats'),
      api.get('/playlists'),
      api.get('/users/me/following'),
    ]).then(([sRes, pRes, fRes]) => {
      setStats(sRes.data);
      setPlaylists(pRes.data.slice(0, 3));
      setFollowing(fRes.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.username} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your music library.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Playlists', value: stats?.playlistCount ?? 0, icon: ListMusic, color: 'text-primary' },
          { label: 'Following', value: stats?.followingCount ?? 0, icon: Users, color: 'text-accent' },
          { label: 'Total Listens', value: stats?.totalListens ?? 0, icon: Music2, color: 'text-primary' },
          { label: 'Total Listening Time', value: `${stats?.totalListeningMinutes ?? 0} mins`, icon: Mic2, color: 'text-accent' },
          { label: 'Account Type', value: user?.is_artist ? 'Artist' : 'Listener', icon: user?.is_artist ? Mic2 : Music2, color: 'text-primary' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`p-3 rounded-xl bg-muted ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Playlists</h2>
          <Link to="/playlists">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {playlists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ListMusic className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No playlists yet. <Link to="/playlists" className="text-primary hover:underline">Create one!</Link></p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {playlists.map((pl) => (
              <Link key={pl.playlist_id} to={`/playlists/${pl.playlist_id}`}>
                <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ListMusic className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{pl.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pl._count.songs} songs · {formatDuration(pl.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pl.release_type && <Badge variant="secondary">{pl.release_type}</Badge>}
                      {pl.is_shared && <Badge variant="outline">Shared</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Following */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">People You Follow</h2>
          <Link to="/users">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              Find more <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {following.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Not following anyone yet. <Link to="/users" className="text-primary hover:underline">Find users!</Link></p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-3">
            {following.map((u) => (
              <Card key={u.user_id} className="flex items-center gap-3 px-4 py-3 hover:border-primary/40 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {getInitials(u.artist?.name || u.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{u.artist?.name || u.username}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
                {u.is_artist && <Badge variant="secondary" className="text-[10px]">Artist</Badge>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
