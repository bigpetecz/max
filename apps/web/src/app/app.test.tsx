import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';

const apiBaseUrl = 'http://localhost:3000/api';

describe('App auth flow', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('shows auth screen when refresh returns 401', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    render(<App />);

    expect(await screen.findByText('Welcome to Max')).toBeTruthy();

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiBaseUrl}/auth/refresh`,
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('shows chat after refresh success and returns to auth screen after sign out', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: { id: 'user-1', email: 'you@company.com' },
            accessToken: 'token-1',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    render(<App />);

    expect(await screen.findByText('Max Assistant')).toBeTruthy();
    expect(screen.getByText('Signed in as you@company.com')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByText('Welcome to Max')).toBeTruthy();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        `${apiBaseUrl}/auth/logout`,
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
    });
  });
});
