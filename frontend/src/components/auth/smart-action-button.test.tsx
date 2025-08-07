'use client';

import { render, screen, fireEvent } from '@testing-library/react';
import { SmartActionButton } from './smart-action-button';
import { usePermissions } from '@/lib/permissions';

// Mock the usePermissions hook
jest.mock('@/lib/permissions', () => ({
  usePermissions: jest.fn(),
}));

describe('SmartActionButton', () => {
  const mockOnEdit = jest.fn();
  const mockOnView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show edit button when user has update permission', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      hasPermission: (resource: string, action: string) => {
        if (resource === 'users' && action === 'update') return true;
        if (resource === 'users' && action === 'read') return true;
        return false;
      },
      isLoading: false,
    });

    render(
      <SmartActionButton
        resource="users"
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    const editButton = screen.getByRole('button');
    expect(editButton).toBeInTheDocument();
    
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalled();
    expect(mockOnView).not.toHaveBeenCalled();
  });

  it('should show view button when user has read permission but no update permission', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      hasPermission: (resource: string, action: string) => {
        if (resource === 'users' && action === 'read') return true;
        return false;
      },
      isLoading: false,
    });

    render(
      <SmartActionButton
        resource="users"
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    const viewButton = screen.getByRole('button');
    expect(viewButton).toBeInTheDocument();
    
    fireEvent.click(viewButton);
    expect(mockOnView).toHaveBeenCalled();
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('should show loading spinner when permissions are loading', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      hasPermission: () => false,
      isLoading: true,
    });

    render(
      <SmartActionButton
        resource="users"
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    const loadingButton = screen.getByRole('button');
    expect(loadingButton).toBeDisabled();
  });

  it('should not render anything when user has no permissions', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      hasPermission: () => false,
      isLoading: false,
    });

    const { container } = render(
      <SmartActionButton
        resource="users"
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    expect(container.firstChild).toBeNull();
  });
}); 