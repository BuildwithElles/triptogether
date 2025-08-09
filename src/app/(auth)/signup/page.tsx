'use client'

import React from 'react'
import Link from 'next/link'
import { SignupForm } from '../../../components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <SignupForm />
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            href="/login" 
            className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
