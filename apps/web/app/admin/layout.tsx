import { ReactNode } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin" className="text-xl font-bold">
                Admin
              </Link>
              <nav className="ml-10 flex space-x-4">
                <Link href="/admin/evaluation-metrics" className="text-gray-600 hover:text-gray-900">
                  Evaluation Metrics
                </Link>
                <Link href="/admin/evaluation-parser" className="text-gray-600 hover:text-gray-900">
                  Evaluation Parser
                </Link>
                <Link href="/admin/knowledge" className="text-gray-600 hover:text-gray-900">
                  Knowledge
                </Link>
                <Link href="/admin/transformations" className="text-gray-600 hover:text-gray-900">
                  Transformations
                </Link>
                <Link href="/admin/compliance" className="text-gray-600 hover:text-gray-900">
                  Compliance
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <button className="rounded-full p-1 text-gray-600 hover:text-gray-900">
                <User className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
