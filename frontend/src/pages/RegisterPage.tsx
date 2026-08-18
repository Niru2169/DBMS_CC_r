import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music2, Mic2 } from 'lucide-react';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isArtist, setIsArtist] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        username,
        password,
        is_artist: isArtist,
        artist_name: isArtist ? artistName || username : undefined,
        country: isArtist ? country : undefined,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Music2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold tracking-tight">MusicLib</span>
          </div>
        </div>

        <Card className="border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Create account</CardTitle>
            <CardDescription>Join the music library community</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} id="register-form" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-username">Username</Label>
                <Input
                  id="reg-username"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Artist toggle */}
              <div
                onClick={() => setIsArtist(!isArtist)}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  isArtist
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isArtist ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Mic2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Register as Artist</p>
                    <p className="text-xs text-muted-foreground">
                      Can create Singles, EPs, and Albums
                    </p>
                  </div>
                  <div className={`ml-auto h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    isArtist ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {isArtist && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Artist fields */}
              {isArtist && (
                <div className="space-y-3 pl-2 border-l-2 border-primary/30 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="artist-name">Artist / Band Name</Label>
                    <Input
                      id="artist-name"
                      placeholder="Your stage name"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist-country">Country</Label>
                    <Input
                      id="artist-country"
                      placeholder="e.g. US, UK, IN"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button id="register-submit" type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
