'use client';

import React from 'react';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar Navigation */}
          <div className="hidden md:flex md:w-64 md:flex-col">
            <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">TripTogether</h1>
              </div>
              <div className="mt-5 flex-1 flex flex-col">
                <DashboardNav />
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="fixed inset-x-0 top-0 z-40 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between h-16 px-4">
                <h1 className="text-lg font-bold text-gray-900">TripTogether</h1>
                {/* Mobile menu will be added later */}
              </div>
            </div>
            <div className="pt-16">
              <DashboardNav isMobile />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <main className="flex-1 relative overflow-y-auto focus:outline-none">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
