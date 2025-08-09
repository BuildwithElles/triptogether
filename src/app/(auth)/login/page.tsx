'use client'

import React from 'react'
import Link from 'next/link'
import { LoginForm } from '../../../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <LoginForm />
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link 
            href="/signup" 
            className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
}
