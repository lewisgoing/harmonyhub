import { User } from 'firebase/auth';

const mockUser: User = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: 'test-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'google.com',
};

const mockGoogleProvider = {
  addScope: jest.fn(),
  setCustomParameters: jest.fn(),
};

const mockAuth = {
  currentUser: mockUser,
  signInWithPopup: jest.fn().mockResolvedValue({ user: mockUser }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn(),
};

const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({
    exists: true,
    data: () => ({
      // Add mock data as needed
    }),
  }),
  set: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
};

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({}),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue(mockAuth),
  GoogleAuthProvider: jest.fn().mockImplementation(() => mockGoogleProvider),
  signInWithPopup: mockAuth.signInWithPopup,
  signOut: mockAuth.signOut,
  onAuthStateChanged: mockAuth.onAuthStateChanged,
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue(mockFirestore),
  collection: mockFirestore.collection,
  doc: mockFirestore.doc,
  getDoc: mockFirestore.get,
  setDoc: mockFirestore.set,
  updateDoc: mockFirestore.update,
  deleteDoc: mockFirestore.delete,
}));

export { mockUser, mockAuth, mockFirestore, mockGoogleProvider }; 