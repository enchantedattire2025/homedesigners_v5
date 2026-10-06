import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthModal from '../../components/AuthModal';

let mockSignUpResult: any = { data: { user: null, session: null }, error: null };
let mockSignInResult: any = { data: { user: null, session: null }, error: null };

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(() => Promise.resolve(mockSignUpResult)),
      signInWithPassword: vi.fn(() => Promise.resolve(mockSignInResult)),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSignUpResult = { data: { user: null, session: null }, error: null };
  mockSignInResult = { data: { user: null, session: null }, error: null };
});

function renderAuthModal(props: Partial<React.ComponentProps<typeof AuthModal>> = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    mode: 'login' as const,
    onModeChange: vi.fn(),
    onAuthSuccess: vi.fn(),
    ...props,
  };
  return render(<AuthModal {...defaultProps} />);
}

describe('AuthModal component', () => {
  it('renders the modal when open', () => {
    renderAuthModal();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderAuthModal({ isOpen: false });
    expect(screen.queryByRole('heading', { name: 'Sign In' })).not.toBeInTheDocument();
  });

  it('shows email and password fields in login mode', () => {
    renderAuthModal({ mode: 'login' });

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('shows name field in signup mode', () => {
    renderAuthModal({ mode: 'signup' });

    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
  });

  it('validates email format on submit', async () => {
    renderAuthModal({ mode: 'login' });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'Password1' } });

    const form = document.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password minimum length on submit', async () => {
    renderAuthModal({ mode: 'login' });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Ab1' } });

    const form = document.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password requires uppercase and number', async () => {
    renderAuthModal({ mode: 'login' });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });

    const form = document.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
    });
  });

  it('shows error message on login failure', async () => {
    mockSignInResult = {
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    };

    renderAuthModal({ mode: 'login' });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password1' } });

    const form = document.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('calls onModeChange to switch between login and signup', () => {
    const onModeChange = vi.fn();
    renderAuthModal({ mode: 'login', onModeChange });

    // Find a link/button that switches to signup mode
    const switchLinks = screen.getAllByText(/sign up|create account/i);
    if (switchLinks.length > 0) {
      fireEvent.click(switchLinks[0]);
      expect(onModeChange).toHaveBeenCalled();
    }
  });
});
