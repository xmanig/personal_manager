import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows loading spinner when loading', () => {
    const { container } = render(<Button loading>Save</Button>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('disabled when loading', () => {
    render(<Button loading>Save</Button>);
    const buttons = screen.getAllByRole('button');
    const saveBtn = buttons.find(b => b.textContent?.includes('Save'));
    expect(saveBtn).toBeDisabled();
  });
});
