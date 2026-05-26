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

type TaskStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Approved'
  | 'Queued'
  | 'Running'
  | 'Succeeded'
  | 'Failed';

type DraftTask = {
  id: string;
  taskType: string;
  status: TaskStatus;
  payload: {
    title: string;
    price: number;
    description: string;
    imagePaths?: string[];
  };
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  Draft: 'badge badge-draft',
  PendingApproval: 'badge badge-pending',
  Approved: 'badge badge-approved',
  Queued: 'badge badge-queued',
  Running: 'badge badge-running',
  Succeeded: 'badge badge-succeeded',
  Failed: 'badge badge-failed',
};

type TaskListItem = {
  id: string;
  taskType: string;
  status: TaskStatus;
  payload: { title?: string; price?: number };
  createdAt: string;
};

function TaskListPage({
  accessToken,
  onBack,
}: {
  accessToken: string;
  onBack: () => void;
}) {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tasks`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const data = (await res.json()) as TaskListItem[];
        setTasks(data);
      } catch {
        setError('Could not load tasks.');
      }
    };

    void fetchTasks();
    const interval = setInterval(() => void fetchTasks(), 5000);
    return () => clearInterval(interval);
  }, [accessToken]);

  return (
    <main className="task-list-shell">
      <header className="chat-header">
        <h1 className="chat-title">Tasks</h1>
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back to Chat
        </Button>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      {tasks.length === 0 && !error ? (
        <p className="task-list-empty">No tasks yet. Start a chat to create one.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-list-item">
              <div className="task-list-item-header">
                <span className="task-list-item-title">
                  {task.payload.title ?? task.taskType}
                </span>
                <span className={STATUS_BADGE_CLASS[task.status]}>
                  {task.status}
                </span>
              </div>
              <div className="task-list-item-meta">
                {task.taskType}
                {task.payload.price !== undefined
                  ? ` • ${task.payload.price} CZK`
                  : ''}
                {' • '}
                {new Date(task.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

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
  onViewTasks,
}: {
  user: User;
  accessToken: string;
  onSignOut: () => Promise<void>;
  onViewTasks: () => void;
}) {
  const [draftTask, setDraftTask] = useState<DraftTask | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [taskActionPending, setTaskActionPending] = useState<
    'approve' | 'reject' | null
  >(null);
  const lastDraftPromptRef = useRef<string | null>(null);

  const createDraftFromChat = async (content: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as {
      task?: DraftTask;
    };

    if (data.task) {
      setDraftTask(data.task);
      setTaskActionError(null);
    }
  };

  const approveDraftTask = async () => {
    if (!draftTask) {
      return;
    }

    setTaskActionPending('approve');
    setTaskActionError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks/${draftTask.id}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to approve task.');
      }

      const data = (await response.json()) as { status: TaskStatus };
      setDraftTask((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          status: data.status,
        };
      });
    } catch {
      setTaskActionError('Could not approve this task. Please try again.');
    } finally {
      setTaskActionPending(null);
    }
  };

  const rejectDraftTask = async () => {
    if (!draftTask) {
      return;
    }

    setTaskActionPending('reject');
    setTaskActionError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks/${draftTask.id}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to reject task.');
      }

      setDraftTask(null);
    } catch {
      setTaskActionError('Could not reject this task. Please try again.');
    } finally {
      setTaskActionPending(null);
    }
  };

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

      const latestUserPrompt = [...chatMessages]
        .reverse()
        .find((message) => message.role === 'user')?.content;

      if (
        latestUserPrompt &&
        /sbazar/i.test(latestUserPrompt) &&
        lastDraftPromptRef.current !== latestUserPrompt
      ) {
        lastDraftPromptRef.current = latestUserPrompt;
        void createDraftFromChat(latestUserPrompt);
      }

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
        <div className="chat-header-actions">
          <Button type="button" variant="outline" onClick={onViewTasks}>
            Tasks
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void onSignOut()}
          >
            Sign out
          </Button>
        </div>
      </header>

      {draftTask ? (
        <section className="task-draft-panel" aria-live="polite">
          <p className="task-draft-kicker">Task Draft Ready For Review</p>
          <h2 className="task-draft-title">{draftTask.payload.title}</h2>
          <p className="task-draft-meta">
            Type: {draftTask.taskType} • Price: {draftTask.payload.price} CZK
          </p>
          <p className="task-draft-description">
            {draftTask.payload.description}
          </p>
          <p className="task-draft-status">Status: {draftTask.status}</p>

          {taskActionError ? (
            <p className="error-text task-draft-error">{taskActionError}</p>
          ) : null}

          <div className="task-draft-actions">
            <Button
              type="button"
              onClick={() => void approveDraftTask()}
              disabled={
                taskActionPending !== null ||
                draftTask.status !== 'PendingApproval'
              }
            >
              {taskActionPending === 'approve' ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void rejectDraftTask()}
              disabled={taskActionPending !== null}
            >
              {taskActionPending === 'reject' ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </section>
      ) : null}

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
  const [view, setView] = useState<'chat' | 'tasks'>('chat');
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
    setView('chat');
  };

  if (loading) {
    return <main className="loading-shell">Loading session...</main>;
  }

  if (!user || !accessToken) {
    return <AuthScreen onSignIn={signIn} error={error} />;
  }

  if (view === 'tasks') {
    return (
      <TaskListPage
        accessToken={accessToken}
        onBack={() => setView('chat')}
      />
    );
  }

  return (
    <ChatInterface
      user={user}
      accessToken={accessToken}
      onSignOut={signOut}
      onViewTasks={() => setView('tasks')}
    />
  );
}

export default App;
