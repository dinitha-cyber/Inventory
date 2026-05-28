import { useState } from 'react';
import { supabaseSync } from '../lib/supabase';
import { LogOut, User as UserIcon, LayoutDashboard, Laptop, Settings } from 'lucide-react';
import EmployeeForm from './EmployeeForm';
import AssetForms from './AssetForms';
import AssignmentView from './AssignmentView';
import EmployeeDirectory from './EmployeeDirectory';
import AssetDirectory from './AssetDirectory';
import { Users, Server } from 'lucide-react';

interface DashboardProps {
  session: any;
  role: 'admin' | 'user' | 'hr';
}

export default function Dashboard({ session, role }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'asset-directory' | 'employees' | 'assets' | 'assignments'>('directory');

  const handleSignOut = async () => {
    if (supabaseSync && supabaseSync.supabaseUrl !== 'https://placeholder.supabase.co') {
      await supabaseSync.auth.signOut();
    } else {
      localStorage.removeItem('mock_session_email');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">PLMTT.IT <span className="text-blue-600">Inventory</span></h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('directory')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'directory' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            Employee Directory
          </button>
          {role !== 'hr' && (
            <>
              <button
                onClick={() => setActiveTab('asset-directory')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'asset-directory' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Server className="w-5 h-5" />
                Asset Directory
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('employees')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'employees' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            Employee Registry
          </button>
          {role !== 'hr' && (
            <>
              <button
                onClick={() => setActiveTab('assets')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'assets' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Laptop className="w-5 h-5" />
                Asset Management
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'assignments' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Assignments
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session.user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{role} Role</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-4"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          
          <div className="text-xs text-gray-500 text-center border-t border-gray-100 pt-3">
            Design and Developed by :<br/>
            <a href="https://dinithaweb.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium mt-1 inline-block">Dinitha Serasinghe</a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:hidden">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">SysAdmin<span className="text-blue-600">Pro</span></h2>
          <button onClick={handleSignOut} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Area */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'directory' && 'Employee Directory'}
                {activeTab === 'asset-directory' && 'Asset Directory'}
                {activeTab === 'employees' && 'Employee Registration'}
                {activeTab === 'assets' && 'Asset Registration'}
                {activeTab === 'assignments' && 'Central Assignment View'}
              </h1>
              <p className="text-gray-500 mt-1">
                {role === 'user' && 'Viewing mode only. You do not have permission to make changes.'}
                {role === 'admin' && 'Manage system records and allocations.'}
                {role === 'hr' && 'Manage employee records only.'}
              </p>
            </div>

            {/* Role Warning for Users */}
            {role === 'user' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex gap-3">
                <Settings className="w-5 h-5 flex-shrink-0" />
                <p>Read-only mode active. Form submission, editing, and assignments are disabled for your role.</p>
              </div>
            )}

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
              {activeTab === 'directory' && <EmployeeDirectory role={role} />}
              {activeTab === 'asset-directory' && <AssetDirectory role={role} />}
              {activeTab === 'employees' && <EmployeeForm role={role} />}
              {activeTab === 'assets' && <AssetForms role={role} />}
              {activeTab === 'assignments' && <AssignmentView role={role} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
