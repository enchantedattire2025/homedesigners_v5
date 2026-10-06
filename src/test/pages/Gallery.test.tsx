import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Gallery from '../../pages/Gallery';

const mockDesigners = [
  { id: 'd1', name: 'Priya Sharma', location: 'Mumbai', profile_image: 'https://example.com/priya.jpg', instagram_url: 'https://instagram.com/priya', rating: 4.9, specialization: 'Modern Design' },
  { id: 'd2', name: 'Rajesh Kumar', location: 'Delhi', profile_image: null, instagram_url: 'https://instagram.com/rajesh', rating: 4.8, specialization: 'Traditional Indian' },
  { id: 'd3', name: 'Anita Desai', location: 'Bangalore', profile_image: 'https://example.com/anita.jpg', instagram_url: 'https://instagram.com/anita', rating: 4.7, specialization: 'Minimalist' },
];

let mockResolvedData: any = mockDesigners;
let mockError: any = null;

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const chain: any = {
        select: vi.fn(() => chain),
        not: vi.fn(() => chain),
        neq: vi.fn(() => chain),
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

import { supabase as mockSupabase } from '../../lib/supabase';

function renderGallery() {
  return render(
    <MemoryRouter>
      <Gallery />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResolvedData = mockDesigners;
  mockError = null;
});

describe('Gallery page', () => {
  it('renders loading state initially', () => {
    renderGallery();
    expect(screen.getByText('Curating the gallery wall...')).toBeInTheDocument();
  });

  it('renders designer bubbles after loading', async () => {
    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText('Anita Desai')).toBeInTheDocument();
  });

  it('shows count of designers on display', async () => {
    renderGallery();

    await waitFor(() => {
      expect(screen.getByText(/3 designers on display/)).toBeInTheDocument();
    });
  });

  it('filters designers by search query (name)', async () => {
    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by name, city, or specialty...');
    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.queryByText('Rajesh Kumar')).not.toBeInTheDocument();
    expect(screen.queryByText('Anita Desai')).not.toBeInTheDocument();
  });

  it('filters designers by search query (city)', async () => {
    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by name, city, or specialty...');
    fireEvent.change(searchInput, { target: { value: 'Delhi' } });

    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
  });

  it('filters designers by search query (specialization)', async () => {
    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by name, city, or specialty...');
    fireEvent.change(searchInput, { target: { value: 'Minimalist' } });

    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
    expect(screen.getByText('Anita Desai')).toBeInTheDocument();
  });

  it('renders Instagram links with correct URLs', async () => {
    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const priyaLink = screen.getByRole('link', { name: /Priya Sharma/i });
    expect(priyaLink).toHaveAttribute('href', 'https://instagram.com/priya');
    expect(priyaLink).toHaveAttribute('target', '_blank');
  });

  it('shows empty state when no designers have Instagram', async () => {
    mockResolvedData = [];

    renderGallery();

    await waitFor(() => {
      expect(screen.getByText(/No designers have linked their Instagram yet/)).toBeInTheDocument();
    });
  });

  it('shows "no match" empty state when search yields no results', async () => {
    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by name, city, or specialty...');
    fireEvent.change(searchInput, { target: { value: 'zzzzz' } });

    expect(screen.getByText(/No designers match your search/)).toBeInTheDocument();
  });

  it('shows error state with retry button on fetch error', async () => {
    mockError = { message: 'Network error' };
    mockResolvedData = null;

    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('retries fetch when Try Again is clicked', async () => {
    mockError = { message: 'Network error' };
    mockResolvedData = null;

    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Fix the mock to return data on retry
    mockError = null;
    mockResolvedData = mockDesigners;

    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });
  });
});
