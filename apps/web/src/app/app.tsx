import { useEffect, useRef, useState } from 'react';
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
} from '@assistant-ui/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

function AuthScreen({
  onSignIn,
  error,
}: {
  onSignIn: () => void;
  error: string | null;
}) {
  return (
    <main className="auth-shell">
      <Card className="auth-card">
        <CardHeader>
          <CardTitle>Welcome to Max</CardTitle>
          <CardDescription>
            Sign in with Google to unlock your chat workspace and automations.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <label className="field-label" htmlFor="email-preview">
            Work email preview
          </label>
          <Input
            id="email-preview"
            value="you@company.com"
            readOnly
            aria-readonly
          />

          {error ? <p className="error-text">{error}</p> : null}
        </CardContent>

        <CardFooter>
          <Button type="button" onClick={onSignIn} className="auth-cta">
            Continue with Google
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

function ChatInterface({
  user,
  accessToken,
  onSignOut,
}: {
  user: User;
  accessToken: string;
  onSignOut: () => Promise<void>;
}) {
  const runtime = useLocalRuntime({
    run: async function* ({ messages, abortSignal }) {
      const chatMessages = messages
        .filter(
          (message) =>
            message.role === 'system' ||
            message.role === 'user' ||
            message.role === 'assistant',
        )
        .map((message) => {
          const content = message.content
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join(' ')
            .trim();

          return {
            role: message.role,
            content,
          };
        })
        .filter((message) => message.content.length > 0);

      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messages: chatMessages }),
        signal: abortSignal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to stream chat response from API');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        streamedText += decoder.decode(value, { stream: true });

        yield {
          content: [
            {
              type: 'text',
              text: streamedText,
            },
          ],
        };
      }
    },
  });

  return (
    <main className="chat-shell">
      <header className="chat-header">
        <div>
          <h1 className="chat-title">Max Assistant</h1>
          <p className="chat-subtitle">Signed in as {user.email}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void onSignOut()}
        >
          Sign out
        </Button>
      </header>

      <AssistantRuntimeProvider runtime={runtime}>
        <section className="chat-panel">
          <ThreadPrimitive.Root className="thread-root">
            <ThreadPrimitive.Viewport className="thread-viewport">
              <ThreadPrimitive.If empty>
                <div className="thread-empty">
                  Start the conversation. Ask for a workflow, draft, or
                  checklist.
                </div>
              </ThreadPrimitive.If>

              <ThreadPrimitive.Messages>
                {({ message }) => (
                  <MessagePrimitive.Root
                    className={
                      message.role === 'user'
                        ? 'chat-message chat-message-user'
                        : 'chat-message chat-message-assistant'
                    }
                  >
                    <MessagePrimitive.Parts />
                  </MessagePrimitive.Root>
                )}
              </ThreadPrimitive.Messages>
            </ThreadPrimitive.Viewport>

            <ThreadPrimitive.ViewportFooter className="composer-wrap">
              <ComposerPrimitive.Root className="composer-form">
                <ComposerPrimitive.Input
                  className="composer-input"
                  placeholder="Send a message to Max..."
                />
                <ComposerPrimitive.Send className="composer-send">
                  Send
                </ComposerPrimitive.Send>
              </ComposerPrimitive.Root>
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Root>
        </section>
      </AssistantRuntimeProvider>
    </main>
  );
}

export function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didLoadSession = useRef(false);

  useEffect(() => {
    if (didLoadSession.current) {
      return;
    }

    didLoadSession.current = true;

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
        setAccessToken(refreshData.accessToken);
        setUser(refreshData.user);
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
    return <main className="loading-shell">Loading session...</main>;
  }

  if (!user || !accessToken) {
    return <AuthScreen onSignIn={signIn} error={error} />;
  }

  return (
    <ChatInterface user={user} accessToken={accessToken} onSignOut={signOut} />
  );
}

export default App;
