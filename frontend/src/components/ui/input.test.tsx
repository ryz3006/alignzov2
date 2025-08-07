import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('border-gray-300');
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('renders with error state', () => {
    render(<Input error="This field is required" placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('border-red-300');
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Input helperText="This is helpful information" placeholder="Enter text" />);
    
    expect(screen.getByText('This is helpful information')).toBeInTheDocument();
  });

  it('does not show helper text when error is present', () => {
    render(
      <Input 
        error="This field is required" 
        helperText="This is helpful information" 
        placeholder="Enter text" 
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('This is helpful information')).not.toBeInTheDocument();
  });

  it('handles input changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test value');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Enter text" />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders with all input attributes', () => {
    render(
      <Input
        type="email"
        name="email"
        id="email-input"
        value="test@example.com"
        required
        disabled
        data-testid="email-input"
        placeholder="Enter email"
      />
    );
    
    const input = screen.getByPlaceholderText('Enter email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('id', 'email-input');
    expect(input).toHaveAttribute('value', 'test@example.com');
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('data-testid', 'email-input');
  });

  it('generates unique id when not provided', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    
    const input = screen.getByLabelText('Email');
    const id = input.getAttribute('id');
    expect(id).toMatch(/^input-/);
  });

  it('uses provided id when available', () => {
    render(<Input id="custom-id" label="Email" placeholder="Enter email" />);
    
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'custom-id');
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(
      <Input 
        onFocus={handleFocus} 
        onBlur={handleBlur} 
        placeholder="Enter text" 
      />
    );
    
    const input = screen.getByPlaceholderText('Enter text');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalled();
  });
}); 