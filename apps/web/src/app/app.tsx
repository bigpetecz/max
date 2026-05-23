import { useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
};

type RefreshResponse = {
  user: User;
  accessToken: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.status === 401) {
          setUser(null);
          setAccessToken(null);
          return;
        }

        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh auth session');
        }

        const refreshData = (await refreshResponse.json()) as RefreshResponse;

        const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${refreshData.accessToken}`,
          },
        });

        if (!meResponse.ok) {
          throw new Error('Failed to load current user profile');
        }

        const meData = (await meResponse.json()) as { user: User };
        setAccessToken(refreshData.accessToken);
        setUser(meData.user);
      } catch {
        setError(
          'Cannot reach API. Make sure api is running on localhost:3000.',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadSession();
  }, []);

  const signIn = () => {
    window.location.assign(`${API_BASE_URL}/auth/google`);
  };

  const signOut = async () => {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    setUser(null);
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading session...</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <h1>Max</h1>
      <p>Google SSO bootstrap for platform login.</p>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {user ? (
        <div>
          <p>Signed in as {user.email}</p>
          <p>Access token status: {accessToken ? 'active' : 'missing'}</p>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      ) : (
        <button type="button" onClick={signIn}>
          Sign in with Google
        </button>
      )}
    </div>
  );
}

export default App;
