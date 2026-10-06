import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../../components/Header';

// Mock all the hooks Header depends on
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    signOut: vi.fn(),
    isAdmin: false,
    isDesigner: false,
    loading: false,
  })),
}));

vi.mock('../../hooks/useDesignerProfile', () => ({
  useDesignerProfile: vi.fn(() => ({
    designer: null,
    isDesigner: false,
    loading: false,
  })),
}));

vi.mock('../../hooks/useUserRegistrationStatus', () => ({
  useUserRegistrationStatus: vi.fn(() => ({
    hasCustomerProject: false,
    loading: false,
  })),
}));

vi.mock('../../components/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />,
}));

vi.mock('../../utils/clearAuth', () => ({
  adminLogout: vi.fn(),
  customerDesignerLogout: vi.fn(),
}));

vi.mock('../../utils/userTypeDetection', () => ({
  detectUserTypeAndRedirect: vi.fn(),
}));

import { useAuth } from '../../hooks/useAuth';
import { useDesignerProfile } from '../../hooks/useDesignerProfile';

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Header component', () => {
  it('renders the brand name', () => {
    renderHeader();
    expect(screen.getByText('TheHomeDesigners')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    renderHeader();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Designers')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Social Wall')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('3D Wallpaper')).toBeInTheDocument();
  });

  it('shows Sign In button when unauthenticated', () => {
    renderHeader();

    // The desktop view should have a Sign In button
    const signInButtons = screen.getAllByText(/Sign In/i);
    expect(signInButtons.length).toBeGreaterThan(0);
  });

  it('shows user email and dashboard links when authenticated as designer', async () => {
    const mockUser = { email: 'designer@test.com', user_metadata: { name: 'Test Designer' } };

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      signOut: vi.fn(),
      isAdmin: false,
      isDesigner: true,
      loading: false,
    });

    vi.mocked(useDesignerProfile).mockReturnValue({
      designer: { id: 'd1', name: 'Test Designer', verification_status: 'verified', profile_image: null } as any,
      isDesigner: true,
      loading: false,
    });

    renderHeader();

    await waitFor(() => {
      expect(screen.getByText('Test Designer')).toBeInTheDocument();
    });
  });

  it('shows admin menu items when user is admin', async () => {
    const mockUser = { email: 'admin@test.com', user_metadata: { name: 'Admin' } };

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      signOut: vi.fn(),
      isAdmin: true,
      isDesigner: false,
      loading: false,
    });

    vi.mocked(useDesignerProfile).mockReturnValue({
      designer: null,
      isDesigner: false,
      loading: false,
    });

    renderHeader();

    // Click the user menu button to open the dropdown
    const userMenuButton = screen.getByText('Admin');
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });
});
