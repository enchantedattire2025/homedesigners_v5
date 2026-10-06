import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Projects from '../../pages/Projects';

const mockProjects = [
  {
    id: 'proj-1', project_name: 'Modern Luxury Apartment', location: 'Mumbai',
    budget_range: '₹15-20 Lakhs', property_type: '3 BHK Apartment', project_area: '1200 sq ft',
    requirements: 'Contemporary design with modern amenities', assignment_status: 'completed',
    created_at: '2024-01-15T00:00:00Z', updated_at: '2024-04-20T00:00:00Z',
    assigned_designer: { id: 'd1', name: 'Priya Sharma', specialization: 'Modern', rating: 4.9, experience: 8 },
    project_images: [],
  },
  {
    id: 'proj-2', project_name: 'Traditional Family Home', location: 'Delhi',
    budget_range: '₹25-30 Lakhs', property_type: 'Villa', project_area: '2500 sq ft',
    requirements: 'Traditional Indian design', assignment_status: 'completed',
    created_at: '2024-02-01T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
    assigned_designer: { id: 'd2', name: 'Rajesh Kumar', specialization: 'Traditional', rating: 4.8, experience: 12 },
    project_images: [],
  },
];

let mockResolvedData: any = mockProjects;
let mockError: any = null;

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        in: vi.fn(() => chain),
        then: vi.fn((onFulfilled: (val: unknown) => unknown) =>
          Promise.resolve({ data: mockResolvedData, error: mockError }).then(onFulfilled)
        ),
      };
      return chain;
    }),
  },
}));

function renderProjects() {
  return render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResolvedData = mockProjects;
  mockError = null;
});

describe('Projects page', () => {
  it('renders without crashing', () => {
    renderProjects();
    // Projects page doesn't have an explicit loading spinner text, but it should render
    // either loading or content
    expect(document.body).toBeTruthy();
  });

  it('renders completed project cards from database', async () => {
    renderProjects();

    await waitFor(() => {
      expect(screen.getByText('Modern Luxury Apartment')).toBeInTheDocument();
    });

    expect(screen.getByText('Traditional Family Home')).toBeInTheDocument();
  });

  it('displays project location', async () => {
    renderProjects();

    await waitFor(() => {
      expect(screen.getByText('Mumbai')).toBeInTheDocument();
    });
  });

  it('displays designer name on project cards', async () => {
    renderProjects();

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });
  });

  it('falls back to demo data on database error', async () => {
    mockError = { message: 'Permission denied' };
    mockResolvedData = null;

    renderProjects();

    // When DB fails, Projects page falls back to demo data
    await waitFor(() => {
      // Demo data has specific project names
      const demoProject = screen.queryByText('Modern Luxury Apartment');
      // Either demo data shows or the real data shows (both have this name)
      expect(demoProject).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
