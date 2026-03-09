import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock react-pdf
vi.mock('react-pdf', () => ({
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  },
  Document: ({ children }) => <div>{children}</div>,
  Page: () => <div>Page</div>,
}));

describe('App', () => {
  it('should render the main page with popular courses', async () => {
    render(<App />);
    
    // Check for the main heading on the Index page
    // We use findByText because the component might be lazy-loaded
    const heading = await screen.findByText(/Formations/i, { selector: 'h2' });
    expect(heading).toBeInTheDocument();

    const populars = await screen.findByText(/Populaires/i, { selector: 'span' });
    expect(populars).toBeInTheDocument();
  });
});