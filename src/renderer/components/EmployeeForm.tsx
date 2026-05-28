import { useState, useEffect } from 'react';
import { supabaseSync } from '../lib/supabase';
import { Save, UserPlus } from 'lucide-react';

interface EmployeeFormProps {
  role: 'admin' | 'user' | 'hr';
}

export default function EmployeeForm({ role }: EmployeeFormProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    contact_no: '',
    company_id: '',
    branch_id: '',
    department_id: '',
  });

  const isReadOnly = role === 'user';
  const showDepartments = formData.company_id && 
    companies.find(c => c.id.toString() === formData.company_id)?.name === 'Muthukaruppan Chettiar' &&
    branches.find(b => b.id.toString() === formData.branch_id)?.name === 'Headoffice';

  useEffect(() => {
    if (supabaseSync) {
      supabaseSync.from('companies').select('*').then(({ data }: any) => {
        if (data) setCompanies(data);
      });
    } else {
      // Mock Data Fallback for dev without creds
      setCompanies([
        { id: 1, name: 'Muthukaruppan Chettiar' },
        { id: 2, name: 'Sunshine' }
      ]);
    }
  }, []);

  useEffect(() => {
    if (formData.company_id) {
      if (supabaseSync) {
        supabaseSync.from('branches')
          .select('*')
          .eq('company_id', formData.company_id)
          .then(({ data }: any) => {
            if (data) setBranches(data);
          });
      } else {
        // Mock fallback
        if (formData.company_id === '1') {
          setBranches([{ id: 1, name: 'Headoffice' }, { id: 2, name: 'Negombo' }]);
        } else {
          setBranches([{ id: 3, name: 'Kirulapona' }, { id: 4, name: 'Kollupitiya' }]);
        }
      }
    } else {
      setBranches([]);
    }
    setFormData(prev => ({ ...prev, branch_id: '', department_id: '' }));
  }, [formData.company_id]);

  useEffect(() => {
    if (formData.branch_id && showDepartments) {
      if (supabaseSync) {
        supabaseSync.from('departments')
          .select('*')
          .eq('branch_id', formData.branch_id)
          .then(({ data }: any) => {
            if (data) setDepartments(data);
          });
      } else {
        setDepartments([{ id: 1, name: 'IT' }, { id: 2, name: 'HR' }]);
      }
    } else {
      setDepartments([]);
    }
    setFormData(prev => ({ ...prev, department_id: '' }));
  }, [formData.branch_id, showDepartments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    if (supabaseSync) {
      const { error } = await supabaseSync.from('employees').insert([
        {
          employee_id: formData.employee_id,
          name: formData.name,
          contact_no: formData.contact_no,
          company_id: parseInt(formData.company_id),
          branch_id: parseInt(formData.branch_id),
          department_id: formData.department_id ? parseInt(formData.department_id) : null
        }
      ]);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Employee Registered Successfully' });
        setFormData({ employee_id: '', name: '', contact_no: '', company_id: '', branch_id: '', department_id: '' });
      }
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="bg-blue-100 p-2 rounded-lg">
          <UserPlus className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">New Employee Profile</h3>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
            <input
              type="text"
              required
              disabled={isReadOnly}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              value={formData.employee_id}
              onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
              placeholder="EMP-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              disabled={isReadOnly}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
          <input
            type="text"
            disabled={isReadOnly}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
            value={formData.contact_no}
            onChange={e => setFormData({ ...formData, contact_no: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <select
              required
              disabled={isReadOnly}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              value={formData.company_id}
              onChange={e => setFormData({ ...formData, company_id: e.target.value })}
            >
              <option value="">Select Company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              required
              disabled={isReadOnly || !formData.company_id}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              value={formData.branch_id}
              onChange={e => setFormData({ ...formData, branch_id: e.target.value })}
            >
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div className={showDepartments ? 'block' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              disabled={isReadOnly || !showDepartments}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              value={formData.department_id}
              onChange={e => setFormData({ ...formData, department_id: e.target.value })}
            >
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!isReadOnly && (
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Employee
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
