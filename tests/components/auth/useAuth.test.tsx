// tests/hooks/useAuth.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../../../hooks/useAuth';
import * as firebaseAuth from 'firebase/auth';

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  signInWithPopup: jest.fn(),
}));

describe('useAuth hook', () => {
  let mockAuthState: any;
  let mockOnAuthStateChanged: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock auth state listener
    mockOnAuthStateChanged = firebaseAuth.onAuthStateChanged as jest.Mock;
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      mockAuthState = callback;
      return jest.fn(); // Unsubscribe function
    });
  });

  test('should initialize with loading state and no user', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('should sign in with email and password', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    (firebaseAuth.signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth());

    let user;
    await act(async () => {
      user = await result.current.signIn('test@example.com', 'password');
    });

    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password'
    );
    expect(user).toEqual(mockUser);
    expect(result.current.user).toEqual(mockUser);
  });

  test('should handle sign in errors', async () => {
    const mockError = new Error('Invalid credentials');
    (firebaseAuth.signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useAuth());

    let user;
    await act(async () => {
      user = await result.current.signIn('test@example.com', 'wrong-password');
    });

    expect(user).toBe(null);
    expect(result.current.error).toBe(mockError.message);
  });
});