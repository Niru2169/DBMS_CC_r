import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDuration } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music2, Search, Clock, TrendingUp } from 'lucide-react';

interface Song {
  song_id: number;
  song_name: string;
  duration: number;
  publish_date: string;
  genres: string[];
  listen_count: number;
  is_published: boolean;
  artists: { artist: { name: string; user_id: number } }[];
}

export function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSongs = (q = '') => {
    setLoading(true);
    api.get('/songs', { params: q ? { q } : {} })
      .then((r) => setSongs(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSongs(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSongs(query);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Songs</h1>
        <p className="text-muted-foreground mt-1">Browse all songs in the library</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          id="song-search-input"
          placeholder="Search songs by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" size="icon" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" />
        </div>
      ) : songs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Music2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No songs found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 border-b border-border bg-muted/30">
            <span className="w-8">#</span>
            <span>Title</span>
            <span className="text-right w-20">Listens</span>
            <span className="text-right w-16 ml-4">Duration</span>
            <span className="w-4" />
          </div>
          {songs.map((song, idx) => (
            <div
              key={song.song_id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-center px-4 py-3 hover:bg-accent/40 transition-colors border-b border-border last:border-0"
            >
              <span className="w-8 text-sm text-muted-foreground">{idx + 1}</span>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{song.song_name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs text-muted-foreground truncate">
                    {song.artists[0]?.artist.name || 'Unknown'}
                  </p>
                  {(song.genres as string[]).slice(0, 2).map((g) => (
                    <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0">{g}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground w-20 justify-end">
                <TrendingUp className="h-3 w-3" />
                {song.listen_count.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground w-16 justify-end ml-4">
                <Clock className="h-3 w-3" />
                {formatDuration(song.duration)}
              </div>
              <div className="w-4" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
