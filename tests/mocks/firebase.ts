// tests/mocks/firebase.ts
export const mockAuth = {
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    updateProfile: jest.fn(),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({
      setCustomParameters: jest.fn(),
    })),
    signInWithPopup: jest.fn(),
  };
  
  export const mockFirestore = {
    collection: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    serverTimestamp: jest.fn(),
  };
  
  export const mockDb = {};
  
  const firebase = {
    auth: jest.fn(() => mockAuth),
    firestore: jest.fn(() => mockFirestore),
    initializeApp: jest.fn(),
  };
  
  export default firebase;