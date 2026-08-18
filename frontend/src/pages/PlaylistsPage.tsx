import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
import { ListMusic, Plus, Trash2, ExternalLink, Clock } from 'lucide-react';

interface Playlist {
  playlist_id: number;
  name: string;
  duration: number;
  release_type: string | null;
  is_shared: boolean;
  cover_art_url: string | null;
  creator: { user_id: number; username: string };
  _count: { songs: number; collaborators: number };
}

export function PlaylistsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newReleaseType, setNewReleaseType] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const fetchPlaylists = () => {
    api.get('/playlists').then((r) => setPlaylists(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlaylists(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/playlists', {
        name: newName,
        cover_art_url: newCoverUrl || undefined,
        release_type: newReleaseType || undefined,
        is_shared: false,
      });
      toast({ title: 'Playlist created!', description: newName });
      setDialogOpen(false);
      setNewName(''); setNewCoverUrl(''); setNewReleaseType('');
      fetchPlaylists();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast({ title: 'Error', description: msg || 'Failed to create playlist', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/playlists/${id}`);
      toast({ title: 'Deleted', description: `"${name}" removed` });
      fetchPlaylists();
    } catch {
      toast({ title: 'Error', description: 'Could not delete playlist', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex justify-center h-64 items-center"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Playlists</h1>
          <p className="text-muted-foreground mt-1">{playlists.length} playlists</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button id="create-playlist-btn" className="gap-2">
              <Plus className="h-4 w-4" /> New Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} id="create-playlist-form" className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="pl-name">Name *</Label>
                <Input id="pl-name" placeholder="My awesome playlist" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pl-cover">Cover Art URL</Label>
                <Input id="pl-cover" placeholder="https://..." value={newCoverUrl} onChange={(e) => setNewCoverUrl(e.target.value)} />
              </div>
              {user?.is_artist && (
                <div className="space-y-2">
                  <Label htmlFor="pl-release-type">Release Type</Label>
                  <Select value={newReleaseType} onValueChange={setNewReleaseType}>
                    <SelectTrigger id="pl-release-type">
                      <SelectValue placeholder="None (regular playlist)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="EP">EP</SelectItem>
                      <SelectItem value="Album">Album</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {playlists.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <ListMusic className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-1">No playlists yet</h3>
            <p className="text-muted-foreground text-sm">Create your first playlist to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {playlists.map((pl) => (
            <Card key={pl.playlist_id} className="hover:border-primary/40 hover:shadow-md transition-all">
              <CardContent className="flex items-center gap-4 py-4">
                {/* Cover art or fallback */}
                <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                  {pl.cover_art_url ? (
                    <img src={pl.cover_art_url} alt={pl.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <ListMusic className="h-6 w-6 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{pl.name}</h3>
                    {pl.release_type && <Badge variant="secondary">{pl.release_type}</Badge>}
                    {pl.is_shared && <Badge variant="outline">Shared</Badge>}
                    {pl.creator.user_id !== user?.user_id && (
                      <Badge variant="outline" className="text-xs">Collaborator</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>{pl._count.songs} songs</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(pl.duration)}</span>
                    {pl._count.collaborators > 0 && (
                      <>
                        <span>·</span>
                        <span>{pl._count.collaborators} collaborators</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/playlists/${pl.playlist_id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <ExternalLink className="h-3 w-3" /> Open
                    </Button>
                  </Link>
                  {pl.creator.user_id === user?.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(pl.playlist_id, pl.name)}
                      title="Delete playlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
