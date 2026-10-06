import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../../components/Footer';

vi.mock('../../components/InstallPrompt', () => ({
  triggerInstallPrompt: vi.fn(),
}));

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
}

describe('Footer component', () => {
  it('renders the brand name', () => {
    renderFooter();
    expect(screen.getByText('TheHomeDesigners')).toBeInTheDocument();
  });

  it('renders all four sections', () => {
    renderFooter();

    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Contact Info')).toBeInTheDocument();
  });

  it('renders internal links to correct routes', () => {
    renderFooter();

    const designersLink = screen.getByText('Find Designers').closest('a');
    expect(designersLink).toHaveAttribute('href', '/designers');

    const projectsLink = screen.getByText('Project Portfolio').closest('a');
    expect(projectsLink).toHaveAttribute('href', '/projects');

    const galleryLink = screen.getByText('Social Wall').closest('a');
    expect(galleryLink).toHaveAttribute('href', '/gallery');
  });

  it('renders contact email', () => {
    renderFooter();
    expect(screen.getByText('supportcontact@thehomedesigners.in')).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    renderFooter();
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  });

  it('renders service list', () => {
    renderFooter();

    expect(screen.getByText('Residential Design')).toBeInTheDocument();
    expect(screen.getByText('Commercial Spaces')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Design')).toBeInTheDocument();
    expect(screen.getByText('3D Visualization')).toBeInTheDocument();
  });
});
