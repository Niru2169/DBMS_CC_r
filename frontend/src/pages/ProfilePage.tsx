import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Users, ListMusic, Calendar, Mic2 } from 'lucide-react';

interface FollowedUser {
  user_id: number;
  username: string;
  is_artist: boolean;
  artist?: { name: string; country: string | null } | null;
}

interface UserStats {
  user_id: number;
  username: string;
  is_artist: boolean;
  created_at: string;
  last_login: string | null;
  artist?: {
    name: string;
    country: string | null;
    is_band: boolean;
    production_house?: { name: string; type: string } | null;
  } | null;
}

export function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [following, setFollowing] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get(`/auth/me`),
      api.get('/users/me/following'),
    ]).then(([meRes, followRes]) => {
      setStats(meRes.data);
      setFollowing(followRes.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading || !stats) {
    return <div className="flex justify-center h-64 items-center"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {getInitials(stats.artist?.name || stats.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{stats.artist?.name || stats.username}</h2>
                {stats.is_artist && (
                  <Badge variant="secondary" className="gap-1">
                    <Mic2 className="h-3 w-3" /> Artist
                  </Badge>
                )}
                {stats.artist?.is_band && <Badge variant="outline">Band</Badge>}
              </div>
              <p className="text-muted-foreground">@{stats.username}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {formatDate(stats.created_at)}
                </span>
                {stats.last_login && (
                  <span>Last seen {formatDate(stats.last_login)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Artist details */}
          {stats.artist && (
            <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 gap-4 text-sm">
              {stats.artist.country && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Country</p>
                  <p className="font-medium">{stats.artist.country}</p>
                </div>
              )}
              {stats.artist.production_house && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Label</p>
                  <p className="font-medium">{stats.artist.production_house.name}</p>
                  <p className="text-xs text-muted-foreground">{stats.artist.production_house.type}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Following */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" /> Following ({following.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {following.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Not following anyone yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {following.map((u) => (
                <div key={u.user_id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {getInitials(u.artist?.name || u.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{u.artist?.name || u.username}</p>
                    <p className="text-xs text-muted-foreground">
                      @{u.username}{u.artist?.country && ` · ${u.artist.country}`}
                    </p>
                  </div>
                  {u.is_artist && <Badge variant="secondary" className="text-[10px]">Artist</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListMusic className="h-5 w-5" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Link to="/playlists" className="text-sm text-primary hover:underline font-medium">→ Manage Playlists</Link>
          <Link to="/users" className="text-sm text-primary hover:underline font-medium">→ Find Users to Follow</Link>
          <Link to="/artists" className="text-sm text-primary hover:underline font-medium">→ Browse Artists</Link>
        </CardContent>
      </Card>
    </div>
  );
}
