import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock BrowserRouter to use MemoryRouter so we can control the route.
let mockInitialEntries: string[] = ['/'];

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  const MemoryRouter = actual.MemoryRouter;
  const MockBrowserRouter = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries: mockInitialEntries }, children);

  return {
    ...actual,
    BrowserRouter: MockBrowserRouter as any,
  };
});

// Mock all hooks and components that App imports (paths relative to src/test/)
vi.mock('../hooks/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    signOut: vi.fn(),
    isAdmin: false,
    isDesigner: false,
    loading: false,
  })),
}));

vi.mock('../hooks/useDesignerProfile', () => ({
  useDesignerProfile: vi.fn(() => ({
    designer: null,
    isDesigner: false,
    loading: false,
  })),
}));

vi.mock('../hooks/useSubscription', () => ({
  useSubscription: vi.fn(() => ({
    subscription: { isExpired: false },
    loading: false,
  })),
}));

vi.mock('../hooks/useUserRegistrationStatus', () => ({
  useUserRegistrationStatus: vi.fn(() => ({
    hasCustomerProject: false,
    loading: false,
  })),
}));

vi.mock('../utils/userTypeDetection', () => ({
  detectUserTypeAndRedirect: vi.fn(),
}));

vi.mock('../utils/whatsappNotification', () => ({
  processUserNotifications: vi.fn(),
}));

vi.mock('../utils/clearAuth', () => ({
  forceLogoutAll: vi.fn(),
}));

vi.mock('../utils/debugDesigner', () => ({
  debugAuthState: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
  },
}));

// Mock all lazy-loaded pages as simple placeholders
vi.mock('../pages/Home', () => ({
  default: () => <div data-testid="home-page">Home</div>,
}));
vi.mock('../pages/Designers', () => ({
  default: () => <div data-testid="designers-page">Designers</div>,
}));
vi.mock('../pages/Projects', () => ({
  default: () => <div data-testid="projects-page">Projects</div>,
}));
vi.mock('../pages/Gallery', () => ({
  default: () => <div data-testid="gallery-page">Gallery</div>,
}));
vi.mock('../pages/Materials', () => ({
  default: () => <div data-testid="materials-page">Materials</div>,
}));
vi.mock('../pages/DesignerDetail', () => ({ default: () => <div>Designer Detail</div> }));
vi.mock('../pages/ProjectDetail', () => ({ default: () => <div>Project Detail</div> }));
vi.mock('../pages/DesignerRegistration', () => ({ default: () => <div>Designer Registration</div> }));
vi.mock('../pages/CustomerRegistration', () => ({ default: () => <div>Customer Registration</div> }));
vi.mock('../pages/MyProjects', () => ({ default: () => <div>My Projects</div> }));
vi.mock('../pages/EditProject', () => ({ default: () => <div>Edit Project</div> }));
vi.mock('../pages/CustomerProjects', () => ({ default: () => <div>Customer Projects</div> }));
vi.mock('../pages/ProjectDetailWithTracking', () => ({ default: () => <div>Project Detail With Tracking</div> }));
vi.mock('../pages/DesignerDashboard', () => ({ default: () => <div>Designer Dashboard</div> }));
vi.mock('../pages/DesignerMaterialPricing', () => ({ default: () => <div>Designer Material Pricing</div> }));
vi.mock('../pages/DesignerQuotes', () => ({ default: () => <div>Designer Quotes</div> }));
vi.mock('../pages/DesignerQuoteGenerator', () => ({ default: () => <div>Designer Quote Generator</div> }));
vi.mock('../pages/CustomerQuotes', () => ({ default: () => <div>Customer Quotes</div> }));
vi.mock('../pages/QuoteViewer', () => ({ default: () => <div>Quote Viewer</div> }));
vi.mock('../pages/DesignerSubscription', () => ({ default: () => <div>Designer Subscription</div> }));
vi.mock('../pages/AdminDashboard', () => ({ default: () => <div>Admin Dashboard</div> }));
vi.mock('../pages/AdminDealsManagement', () => ({ default: () => <div>Admin Deals</div> }));
vi.mock('../pages/AdminSubscriptionManagement', () => ({ default: () => <div>Admin Subscription Management</div> }));
vi.mock('../pages/AdminVideoManagement', () => ({ default: () => <div>Admin Video Management</div> }));
vi.mock('../pages/AdminWhatsAppSettings', () => ({ default: () => <div>Admin WhatsApp Settings</div> }));
vi.mock('../pages/AdminLogin', () => ({ default: () => <div>Admin Login</div> }));
vi.mock('../pages/DebugPage', () => ({ default: () => <div>Debug Page</div> }));
vi.mock('../pages/DebugDesignerProfile', () => ({ default: () => <div>Debug Designer Profile</div> }));
vi.mock('../pages/SharePhotoForm', () => ({ default: () => <div>Share Photo Form</div> }));
vi.mock('../pages/ClearSession', () => ({ default: () => <div>Clear Session</div> }));
vi.mock('../pages/EmailConfirmation', () => ({ default: () => <div>Email Confirmation</div> }));
vi.mock('../pages/WallpaperOrder', () => ({ default: () => <div>Wallpaper Order</div> }));
vi.mock('../pages/WallpaperGallery', () => ({ default: () => <div>Wallpaper Gallery</div> }));
vi.mock('../pages/AdminWallpaperOrders', () => ({ default: () => <div>Admin Wallpaper Orders</div> }));
vi.mock('../pages/Admin3DWallpapers', () => ({ default: () => <div>Admin 3D Wallpapers</div> }));
vi.mock('../pages/AdminAuthDebug', () => ({ default: () => <div>Admin Auth Debug</div> }));
vi.mock('../pages/My3DWallpaperOrders', () => ({ default: () => <div>My 3D Wallpaper Orders</div> }));
vi.mock('../pages/DesignerBilling', () => ({ default: () => <div>Designer Billing</div> }));
vi.mock('../pages/CustomerBillView', () => ({ default: () => <div>Customer Bill View</div> }));
vi.mock('../pages/BillDashboard', () => ({ default: () => <div>Bill Dashboard</div> }));
vi.mock('../pages/OfflineBillEditor', () => ({ default: () => <div>Offline Bill Editor</div> }));
vi.mock('../components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));
vi.mock('../components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));
vi.mock('../components/Chatbot', () => ({
  default: () => <div data-testid="chatbot">Chatbot</div>,
}));
vi.mock('../components/InstallPrompt', () => ({
  default: () => null,
  triggerInstallPrompt: vi.fn(),
}));
vi.mock('../components/ProtectedDesignerRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../components/SubscriptionExpiredModal', () => ({
  default: () => null,
}));

import App from '../App';

function renderAppAtRoute(route: string) {
  mockInitialEntries = [route];
  return render(<App />);
}

describe('App routing integration', () => {
  it('renders without crashing', () => {
    renderAppAtRoute('/');
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders Home page at root route', () => {
    renderAppAtRoute('/');
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders Designers page at /designers', async () => {
    renderAppAtRoute('/designers');
    await waitFor(() => {
      expect(screen.getByTestId('designers-page')).toBeInTheDocument();
    });
  });

  it('renders Projects page at /projects', async () => {
    renderAppAtRoute('/projects');
    await waitFor(() => {
      expect(screen.getByTestId('projects-page')).toBeInTheDocument();
    });
  });

  it('renders Gallery page at /gallery', async () => {
    renderAppAtRoute('/gallery');
    await waitFor(() => {
      expect(screen.getByTestId('gallery-page')).toBeInTheDocument();
    });
  });

  it('renders Materials page at /materials', async () => {
    renderAppAtRoute('/materials');
    await waitFor(() => {
      expect(screen.getByTestId('materials-page')).toBeInTheDocument();
    });
  });

  it('renders Chatbot on every route', () => {
    renderAppAtRoute('/');
    expect(screen.getByTestId('chatbot')).toBeInTheDocument();
  });
});
