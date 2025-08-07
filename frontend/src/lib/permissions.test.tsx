'use client';

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePermissions } from './permissions';
import { useAuth } from './auth-context';

// Mock the useAuth hook
jest.mock('./auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock the apiCall function
const mockApiCall = jest.fn();

describe('usePermissions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should return loading state initially', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      apiCall: mockApiCall,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch permissions successfully', async () => {
    const mockPermissions = ['users.read', 'users.update', 'roles.create'];
    mockApiCall.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ permissions: mockPermissions }),
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      apiCall: mockApiCall,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPermission('users', 'read')).toBe(true);
    expect(result.current.hasPermission('users', 'update')).toBe(true);
    expect(result.current.hasPermission('roles', 'create')).toBe(true);
    expect(result.current.hasPermission('users', 'delete')).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    mockApiCall.mockResolvedValue({
      ok: false,
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      apiCall: mockApiCall,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPermission('users', 'read')).toBe(false);
    expect(result.current.getPermissions()).toEqual([]);
  });

  it('should return false for all permissions when no user', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      apiCall: mockApiCall,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    expect(result.current.hasPermission('users', 'read')).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should work with hasAnyPermission', async () => {
    const mockPermissions = ['users.read', 'users.update'];
    mockApiCall.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ permissions: mockPermissions }),
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      apiCall: mockApiCall,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const hasAny = result.current.hasAnyPermission([
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'delete' },
    ]);

    expect(hasAny).toBe(true);
  });

  it('should work with hasAllPermissions', async () => {
    const mockPermissions = ['users.read', 'users.update'];
    mockApiCall.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ permissions: mockPermissions }),
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      apiCall: mockApiCall,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const hasAll = result.current.hasAllPermissions([
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
    ]);

    expect(hasAll).toBe(true);

    const hasAllFalse = result.current.hasAllPermissions([
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'delete' },
    ]);

    expect(hasAllFalse).toBe(false);
  });

  it('should return structured permissions', async () => {
    const mockPermissions = ['users.read', 'users.update'];
    mockApiCall.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ permissions: mockPermissions }),
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      apiCall: mockApiCall,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const permissions = result.current.getPermissions();
    expect(permissions).toHaveLength(2);
    expect(permissions[0]).toEqual({
      id: 'users.read',
      name: 'users.read',
      displayName: 'users.read',
      resource: 'users',
      action: 'read',
    });
  });

  it('should cache permissions for 5 minutes', async () => {
    const mockPermissions = ['users.read'];
    mockApiCall.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ permissions: mockPermissions }),
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      apiCall: mockApiCall,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only call API once due to caching
    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });
}); 