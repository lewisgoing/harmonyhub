"use client";

import { useAuthContext } from './AuthProvider';

// Now acts as an authentication wrapper, not a blocker
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Just pass children through - no authentication blocking
  return <>{children}</>;
}