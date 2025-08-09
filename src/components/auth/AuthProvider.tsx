/**
 * AuthProvider Component
 * 
 * A wrapper component that provides the AuthContext to the entire application.
 * This component should be placed at the root of the application to ensure
 * all child components have access to authentication state and methods.
 */

'use client'

import { ReactNode } from 'react'
import { AuthProvider as AuthContextProvider } from '../../lib/context/AuthContext'

// Props for the AuthProvider component
export interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider Component
 * 
 * This component wraps the AuthContext provider and can be extended
 * with additional providers or initialization logic if needed.
 * 
 * Usage:
 * ```tsx
 * import { AuthProvider } from '@/components/auth/AuthProvider'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  )
}

// Export default for convenience
export default AuthProvider
