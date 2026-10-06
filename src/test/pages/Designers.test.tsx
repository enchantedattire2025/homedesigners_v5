import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Designers from '../../pages/Designers';

const mockDesigners = [
  {
    id: 'd1', name: 'Priya Sharma', specialization: 'Modern Design', location: 'Mumbai, Maharashtra',
    experience: 8, rating: 4.9, total_reviews: 127, total_projects: 45,
    is_verified: true, is_active: true, profile_image: 'https://example.com/priya.jpg',
    business_type: 'google_location', bio: 'Expert in modern interiors',
    starting_price: '₹50,000', google_location_url: 'https://maps.google.com/priya',
  },
  {
    id: 'd2', name: 'Rajesh Kumar', specialization: 'Traditional Indian', location: 'Delhi',
    experience: 12, rating: 4.8, total_reviews: 98, total_projects: 60,
    is_verified: false, is_active: true, profile_image: null,
    business_type: 'virtual', bio: 'Traditional design specialist',
    starting_price: '₹40,000',
  },
  {
    id: 'd3', name: 'Anita Desai', specialization: 'Minimalist Design', location: 'Bangalore',
    experience: 3, rating: 4.7, total_reviews: 85, total_projects: 22,
    is_verified: true, is_active: true, profile_image: 'https://example.com/anita.jpg',
    bio: 'Less is more', starting_price: '₹30,000',
  },
];

let mockResolvedData: any = mockDesigners;
let mockError: any = null;

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        then: vi.fn((onFulfilled: (val: unknown) => unknown) =>
          Promise.resolve({ data: mockResolvedData, error: mockError }).then(onFulfilled)
        ),
      };
      return chain;
    }),
  },
}));

function renderDesigners() {
  return render(
    <MemoryRouter>
      <Designers />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResolvedData = mockDesigners;
  mockError = null;
});

describe('Designers page', () => {
  it('renders loading state initially', () => {
    renderDesigners();
    expect(screen.getByText('Loading designers...')).toBeInTheDocument();
  });

  it('renders designer cards after loading', async () => {
    renderDesigners();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText('Anita Desai')).toBeInTheDocument();
  });

  it('shows the designer count text', async () => {
    renderDesigners();

    await waitFor(() => {
      expect(screen.getByText(/Showing 3 of 3 designers/)).toBeInTheDocument();
    });
  });

  it('shows verified badge for verified designers', async () => {
    renderDesigners();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Verified').length).toBeGreaterThan(0);
  });

  it('filters designers by search term (name)', async () => {
    renderDesigners();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Designer name or style...');
    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.queryByText('Rajesh Kumar')).not.toBeInTheDocument();
  });

  it('filters designers by search term (specialization)', async () => {
    renderDesigners();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Designer name or style...');
    fireEvent.change(searchInput, { target: { value: 'Traditional' } });

    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
  });

  it('shows empty state when no designers exist', async () => {
    mockResolvedData = [];

    renderDesigners();

    await waitFor(() => {
      expect(screen.getByText('No designers found in the database.')).toBeInTheDocument();
    });
  });

  it('shows error state with retry button on fetch error', async () => {
    mockError = { message: 'Database connection failed' };
    mockResolvedData = null;

    renderDesigners();

    await waitFor(() => {
      expect(screen.getByText('Error loading designers')).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
