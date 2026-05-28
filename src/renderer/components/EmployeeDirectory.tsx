import { useState, useEffect } from 'react';
import { supabaseSync } from '../lib/supabase';
import { Search, Building, User, Laptop, Smartphone, Headphones, X, Edit, Trash2, Save, UserMinus, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface EmployeeDirectoryProps {
  role: 'admin' | 'user' | 'hr';
}

export default function EmployeeDirectory({ role }: EmployeeDirectoryProps) {
  const isReadOnly = role === 'user';
  const [employees, setEmployees] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, isDanger?: boolean, onConfirm: () => void} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    if (supabaseSync) {
      // Fetch companies, branches, departments for Edit dropdowns
      const { data: compData } = await supabaseSync.from('companies').select('*');
      if (compData) setCompanies(compData);
      
      const { data: branchData } = await supabaseSync.from('branches').select('*');
      if (branchData) setBranches(branchData);
      
      const { data: deptData } = await supabaseSync.from('departments').select('*');
      if (deptData) setDepartments(deptData);

      // Fetch employees with their relational data
      const { data: empData, error } = await supabaseSync
        .from('employees')
        .select(`
          *,
          companies(name),
          branches(name),
          departments(name),
          laptops(id, brand, model, serial_no, ram, ssd),
          mobiles(id, brand, model, serial_no, imei_no),
          accessories(id, name, brand, serial_no)
        `);
      
      if (error) {
        console.error("Error fetching directory:", error.message);
      } else if (empData) {
        setEmployees(empData);
        
        if (selectedEmployee) {
          const refreshedEmp = empData.find((e: any) => e.employee_id === selectedEmployee.employee_id);
          if (refreshedEmp) setSelectedEmployee(refreshedEmp);
          if (refreshedEmp) setSelectedEmployee(refreshedEmp);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (employeeId: string) => {
    const hasAssets = 
      (selectedEmployee?.laptops?.length > 0) || 
      (selectedEmployee?.mobiles?.length > 0) || 
      (selectedEmployee?.accessories?.length > 0);
      
    if (hasAssets) {
      setMessage({ type: 'error', text: 'Action Blocked: Please unassign all hardware devices before deleting this employee.' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Employee',
      message: 'Are you sure you want to permanently delete this employee? This action cannot be undone.',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        if (supabaseSync) {
          const { error } = await supabaseSync.from('employees').delete().eq('employee_id', employeeId);
          if (error) {
            setMessage({ type: 'error', text: error.message });
          } else {
            setSelectedEmployee(null);
            fetchData();
          }
        }
      }
    });
  };

  const handleUnassignDevice = async (table: 'laptops' | 'mobiles' | 'accessories', deviceId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Unassign Device',
      message: 'Are you sure you want to unassign this individual device?',
      onConfirm: async () => {
        setConfirmDialog(null);
        if (supabaseSync) {
          const { error } = await supabaseSync.from(table).update({ assigned_to: null }).eq('id', deviceId);
          if (error) {
            setMessage({ type: 'error', text: error.message });
          } else {
            setMessage({ type: 'success', text: 'Device successfully unassigned.' });
            setTimeout(() => setMessage(null), 3000);
            fetchData(); // This will auto-refresh the selectedEmployee view
          }
        }
      }
    });
  };

  const handleUnassignAll = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Unassign All Devices',
      message: 'WARNING: Are you sure you want to unassign ALL devices from this employee?',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        if (supabaseSync && selectedEmployee) {
          const promises: Promise<any>[] = [];
          
          // Queue up all unassign operations
          if (selectedEmployee.laptops) {
            selectedEmployee.laptops.forEach((lap: any) => {
              promises.push(supabaseSync.from('laptops').update({ assigned_to: null }).eq('id', lap.id));
            });
          }
          if (selectedEmployee.mobiles) {
            selectedEmployee.mobiles.forEach((mob: any) => {
              promises.push(supabaseSync.from('mobiles').update({ assigned_to: null }).eq('id', mob.id));
            });
          }
          if (selectedEmployee.accessories) {
            selectedEmployee.accessories.forEach((acc: any) => {
              promises.push(supabaseSync.from('accessories').update({ assigned_to: null }).eq('id', acc.id));
            });
          }

          try {
            await Promise.all(promises);
            setMessage({ type: 'success', text: 'All devices successfully unassigned.' });
            setTimeout(() => setMessage(null), 3000);
            fetchData(); // This will auto-refresh the selectedEmployee view
          } catch (error: any) {
            setMessage({ type: 'error', text: 'An error occurred during unassignment.' });
          }
        }
      }
    });
  };

  const startEdit = () => {
    setEditFormData({
      name: selectedEmployee.name,
      contact_no: selectedEmployee.contact_no,
      company_id: selectedEmployee.company_id?.toString() || '',
      branch_id: selectedEmployee.branch_id?.toString() || '',
      department_id: selectedEmployee.department_id?.toString() || '',
    });
    setEditMode(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseSync) {
      const { error } = await supabaseSync
        .from('employees')
        .update({
          name: editFormData.name,
          contact_no: editFormData.contact_no,
          company_id: editFormData.company_id ? parseInt(editFormData.company_id) : null,
          branch_id: editFormData.branch_id ? parseInt(editFormData.branch_id) : null,
          department_id: editFormData.department_id ? parseInt(editFormData.department_id) : null,
        })
        .eq('employee_id', selectedEmployee.employee_id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setEditMode(false);
        setMessage({ type: 'success', text: 'Employee updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
        fetchData();
      }
    }
  };

  // Safe cascaded dropdown lists for edit mode
  const editBranches = branches.filter(b => b.company_id?.toString() === editFormData?.company_id);
  const showEditDepartments = editFormData?.company_id && 
    companies.find(c => c.id.toString() === editFormData.company_id)?.name === 'Muthukaruppan Chettiar' &&
    editBranches.find(b => b.id.toString() === editFormData.branch_id)?.name === 'Headoffice';
  const editDepartments = showEditDepartments ? departments.filter(d => d.branch_id?.toString() === editFormData?.branch_id) : [];

  const handleExportExcel = () => {
    // 1. Define Headers
    const headers = [
      "Employee ID", "Name", "Contact", "Company", "Branch", "Department",
      "Laptop Brand", "Laptop Model", "Laptop SN", "Laptop RAM", "Laptop SSD",
      "Mobile Brand", "Mobile Model", "Mobile SN", "Mobile IMEI",
      "Accessory Name", "Accessory Brand", "Accessory SN"
    ];

    // 2. Map Data
    const rows = filteredEmployees.map(emp => {
      const company = emp.companies?.name || 'Null';
      const branch = emp.branches?.name || 'Null';
      const dept = emp.departments?.name || 'Null';
      
      const lBrand = emp.laptops?.map((l:any) => l.brand || 'Null').join(' | ') || 'Null';
      const lModel = emp.laptops?.map((l:any) => l.model || 'Null').join(' | ') || 'Null';
      const lSn = emp.laptops?.map((l:any) => l.serial_no || 'Null').join(' | ') || 'Null';
      const lRam = emp.laptops?.map((l:any) => l.ram || 'Null').join(' | ') || 'Null';
      const lSsd = emp.laptops?.map((l:any) => l.ssd || 'Null').join(' | ') || 'Null';

      const mBrand = emp.mobiles?.map((m:any) => m.brand || 'Null').join(' | ') || 'Null';
      const mModel = emp.mobiles?.map((m:any) => m.model || 'Null').join(' | ') || 'Null';
      const mSn = emp.mobiles?.map((m:any) => m.serial_no || 'Null').join(' | ') || 'Null';
      const mImei = emp.mobiles?.map((m:any) => m.imei_no || 'Null').join(' | ') || 'Null';

      const aName = emp.accessories?.map((a:any) => a.name || 'Null').join(' | ') || 'Null';
      const aBrand = emp.accessories?.map((a:any) => a.brand || 'Null').join(' | ') || 'Null';
      const aSn = emp.accessories?.map((a:any) => a.serial_no || 'Null').join(' | ') || 'Null';

      return [
        emp.employee_id || 'Null',
        emp.name || 'Null',
        emp.contact_no || 'Null',
        company,
        branch,
        dept,
        lBrand, lModel, lSn, lRam, lSsd,
        mBrand, mModel, mSn, mImei,
        aName, aBrand, aSn
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inventory_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmployees = employees.filter(emp => {
    // 1. Company Filter
    if (selectedCompany && emp.company_id?.toString() !== selectedCompany) {
      return false;
    }

    // 2. Search Query (Safe)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (emp.name || '').toLowerCase().includes(q);
      const matchId = (emp.employee_id || '').toLowerCase().includes(q);
      
      const matchLaptop = emp.laptops?.some((l: any) => 
        (l.brand || '').toLowerCase().includes(q) || (l.model || '').toLowerCase().includes(q) || (l.serial_no || '').toLowerCase().includes(q)
      );
      const matchMobile = emp.mobiles?.some((m: any) => 
        (m.brand || '').toLowerCase().includes(q) || (m.model || '').toLowerCase().includes(q) || (m.serial_no || '').toLowerCase().includes(q)
      );
      const matchAcc = emp.accessories?.some((a: any) => 
        (a.name || '').toLowerCase().includes(q) || (a.brand || '').toLowerCase().includes(q) || (a.serial_no || '').toLowerCase().includes(q)
      );

      if (!matchName && !matchId && !matchLaptop && !matchMobile && !matchAcc) {
        return false;
      }
    }

    return true;
  });

  const hasAnyAssets = selectedEmployee && (
    (selectedEmployee.laptops?.length > 0) || 
    (selectedEmployee.mobiles?.length > 0) || 
    (selectedEmployee.accessories?.length > 0)
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm"
            placeholder="Search by name, ID, or device (e.g., MSI, Dell)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center justify-center gap-2"
          title="Export displayed data to Excel"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="md:hidden lg:inline">Export Excel</span>
        </button>
      </div>

      {/* Grid of Cards */}
      {loading && employees.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6 overflow-y-auto">
          {filteredEmployees.map(emp => (
            <div 
              key={emp.employee_id} 
              onClick={() => { setSelectedEmployee(emp); setEditMode(false); setMessage(null); }}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 truncate">{emp.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{emp.employee_id}</p>
              
              <div className="text-xs font-medium text-gray-600 bg-gray-100 inline-block px-2 py-1 rounded">
                {emp.companies?.name || 'Unknown Company'}
              </div>
              
              <div className="mt-4 flex gap-2 text-gray-400">
                {emp.laptops?.length > 0 && <span title="Laptop Assigned"><Laptop className="w-4 h-4 text-indigo-500" /></span>}
                {emp.mobiles?.length > 0 && <span title="Mobile Assigned"><Smartphone className="w-4 h-4 text-green-500" /></span>}
                {emp.accessories?.length > 0 && <span title="Accessory Assigned"><Headphones className="w-4 h-4 text-amber-500" /></span>}
              </div>
            </div>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No employees found matching your criteria.
            </div>
          )}
        </div>
      )}

      {/* Modal Popup */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
            onClick={() => setSelectedEmployee(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</h2>
                  <p className="text-sm text-gray-500">{selectedEmployee.employee_id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isReadOnly && !editMode && (
                  <>
                    <button onClick={startEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => handleDelete(selectedEmployee.employee_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-2"></div>
                  </>
                )}
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
              {message && (
                <div className={`p-4 rounded-lg mb-6 text-sm flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {message.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                  {message.text}
                </div>
              )}

              {editMode ? (
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Edit Employee Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                          value={editFormData.name}
                          onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                          value={editFormData.contact_no}
                          onChange={e => setEditFormData({ ...editFormData, contact_no: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <select
                          required
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                          value={editFormData.company_id}
                          onChange={e => setEditFormData({ ...editFormData, company_id: e.target.value, branch_id: '', department_id: '' })}
                        >
                          <option value="">Select Company</option>
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                        <select
                          required
                          disabled={!editFormData.company_id}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          value={editFormData.branch_id}
                          onChange={e => setEditFormData({ ...editFormData, branch_id: e.target.value, department_id: '' })}
                        >
                          <option value="">Select Branch</option>
                          {editBranches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className={showEditDepartments ? 'block' : 'opacity-50 pointer-events-none'}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                          disabled={!showEditDepartments}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          value={editFormData.department_id}
                          onChange={e => setEditFormData({ ...editFormData, department_id: e.target.value })}
                        >
                          <option value="">Select Department</option>
                          {editDepartments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Employment Details</h4>
                      <ul className="space-y-3">
                        <li className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-500 text-sm">Company</span>
                          <span className="font-medium text-gray-900 text-sm">{selectedEmployee.companies?.name || '-'}</span>
                        </li>
                        <li className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-500 text-sm">Branch</span>
                          <span className="font-medium text-gray-900 text-sm">{selectedEmployee.branches?.name || '-'}</span>
                        </li>
                        <li className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-500 text-sm">Department</span>
                          <span className="font-medium text-gray-900 text-sm">{selectedEmployee.departments?.name || '-'}</span>
                        </li>
                        <li className="flex justify-between pb-2">
                          <span className="text-gray-500 text-sm">Contact</span>
                          <span className="font-medium text-gray-900 text-sm">{selectedEmployee.contact_no || '-'}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Allocated Assets</h4>
                    {!isReadOnly && role !== 'hr' && hasAnyAssets && (
                      <button 
                        onClick={handleUnassignAll}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <UserMinus className="w-3.5 h-3.5" /> Unassign All Devices
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Laptops */}
                    {selectedEmployee.laptops?.map((lap: any, idx: number) => (
                      <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex justify-between items-center group">
                        <div className="flex gap-4">
                          <Laptop className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                          <div>
                            <h5 className="font-bold text-indigo-900">{lap.brand} {lap.model}</h5>
                            <p className="text-xs text-indigo-700 font-mono mt-1">SN: {lap.serial_no}</p>
                            <div className="flex gap-3 mt-2 text-xs font-medium text-indigo-800">
                              {lap.ram && <span className="bg-white/50 px-2 py-0.5 rounded">RAM: {lap.ram}</span>}
                              {lap.ssd && <span className="bg-white/50 px-2 py-0.5 rounded">SSD: {lap.ssd}</span>}
                            </div>
                          </div>
                        </div>
                        {!isReadOnly && role !== 'hr' && (
                          <button onClick={() => handleUnassignDevice('laptops', lap.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white" title="Unassign Laptop">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Mobiles */}
                    {selectedEmployee.mobiles?.map((mob: any, idx: number) => (
                      <div key={idx} className="bg-green-50 border border-green-100 rounded-lg p-4 flex justify-between items-center group">
                        <div className="flex gap-4">
                          <Smartphone className="w-6 h-6 text-green-500 flex-shrink-0" />
                          <div>
                            <h5 className="font-bold text-green-900">{mob.brand} {mob.model}</h5>
                            <p className="text-xs text-green-700 font-mono mt-1">SN: {mob.serial_no} | IMEI: {mob.imei_no}</p>
                          </div>
                        </div>
                        {!isReadOnly && role !== 'hr' && (
                          <button onClick={() => handleUnassignDevice('mobiles', mob.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-lg border border-green-200 text-green-600 hover:bg-green-600 hover:text-white" title="Unassign Mobile">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Accessories */}
                    {selectedEmployee.accessories?.map((acc: any, idx: number) => (
                      <div key={idx} className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex justify-between items-center group">
                        <div className="flex gap-4">
                          <Headphones className="w-6 h-6 text-amber-500 flex-shrink-0" />
                          <div>
                            <h5 className="font-bold text-amber-900">{acc.name}</h5>
                            <p className="text-xs text-amber-700 mt-1">Brand: {acc.brand} {acc.serial_no ? `| SN: ${acc.serial_no}` : ''}</p>
                          </div>
                        </div>
                        {!isReadOnly && role !== 'hr' && (
                          <button onClick={() => handleUnassignDevice('accessories', acc.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-600 hover:text-white" title="Unassign Accessory">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* No assets */}
                    {!hasAnyAssets && (
                      <div className="text-center py-6 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm">No assets currently assigned to this employee.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Popup */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setConfirmDialog(null)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col relative z-10 animate-in fade-in zoom-in duration-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm shadow-sm ${confirmDialog.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
