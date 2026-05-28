import { useState, useEffect } from 'react';
import { supabaseSync } from '../lib/supabase';
import { Save, Search, Link as LinkIcon, User, Laptop, Smartphone, Headphones, CheckCircle2 } from 'lucide-react';

interface AssignmentViewProps {
  role: 'admin' | 'user' | 'hr';
}

export default function AssignmentView({ role }: AssignmentViewProps) {
  const isReadOnly = role === 'user';
  const [employees, setEmployees] = useState<any[]>([]);
  const [unassignedAssets, setUnassignedAssets] = useState<{
    laptops: any[],
    mobiles: any[],
    accessories: any[]
  }>({ laptops: [], mobiles: [], accessories: [] });
  
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // Asset Selections
  const [selectedLaptop, setSelectedLaptop] = useState('');
  const [selectedMobile, setSelectedMobile] = useState('');
  const [selectedAccessory, setSelectedAccessory] = useState('');
  
  // Search Queries
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  
  // Active Tab
  const [activeAssetTab, setActiveAssetTab] = useState<'laptops' | 'mobiles' | 'accessories'>('laptops');

  // UI State
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (supabaseSync) {
      // Fetch Employees
      supabaseSync.from('employees').select('employee_id, name').then(({ data }: any) => {
        if (data) setEmployees(data);
      });
      // Fetch Unassigned Assets
      const fetchAssets = async () => {
        const [lapRes, mobRes, accRes] = await Promise.all([
          supabaseSync.from('laptops').select('id, brand, serial_no').is('assigned_to', null),
          supabaseSync.from('mobiles').select('id, brand, serial_no').is('assigned_to', null),
          supabaseSync.from('accessories').select('id, name, serial_no').is('assigned_to', null)
        ]);
        if (lapRes.error) console.error("Laptops fetch error:", lapRes.error);
        
        setUnassignedAssets({
          laptops: lapRes.data || [],
          mobiles: mobRes.data || [],
          accessories: accRes.data || []
        });
      };
      fetchAssets();
      
      // Store the fetch function globally or on the window so we can call it later
      (window as any).refetchAssets = fetchAssets;
    } else {
      setEmployees([{ employee_id: 'EMP-001', name: 'John Doe' }]);
      setUnassignedAssets({
        laptops: [{ id: 1, brand: 'Dell', serial_no: 'SN123' }],
        mobiles: [{ id: 1, brand: 'Samsung', serial_no: 'SM456' }],
        accessories: [{ id: 1, name: 'Mouse', serial_no: 'MS789' }]
      });
    }
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    const showMessage = (type: 'success' | 'error', text: string) => {
      setMessage({ type, text });
      setTimeout(() => setMessage(null), 5000);
    };

    if (!selectedEmployee) return showMessage('error', 'Select an employee first');
    if (!selectedLaptop && !selectedMobile && !selectedAccessory) return showMessage('error', 'Select at least one asset');

    if (supabaseSync) {
      const updates = [];
      if (selectedLaptop) {
        updates.push(supabaseSync.from('laptops').update({ assigned_to: selectedEmployee }).eq('id', selectedLaptop));
      }
      if (selectedMobile) {
        updates.push(supabaseSync.from('mobiles').update({ assigned_to: selectedEmployee }).eq('id', selectedMobile));
      }
      if (selectedAccessory) {
        updates.push(supabaseSync.from('accessories').update({ assigned_to: selectedEmployee }).eq('id', selectedAccessory));
      }

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        showMessage('error', 'Error assigning assets: ' + errors[0].error?.message);
        return;
      }
      
      showMessage('success', 'Assets Assigned Successfully');
      setSelectedEmployee('');
      setSelectedLaptop('');
      setSelectedMobile('');
      setSelectedAccessory('');
      setAssetSearchQuery('');
      
      if ((window as any).refetchAssets) {
        (window as any).refetchAssets();
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(empSearchQuery.toLowerCase()) || 
    emp.employee_id.toLowerCase().includes(empSearchQuery.toLowerCase())
  );

  const getFilteredAssets = () => {
    const list = unassignedAssets[activeAssetTab];
    return list.filter(a => {
      const q = assetSearchQuery.toLowerCase();
      if (!q) return true;
      return (a.brand && a.brand.toLowerCase().includes(q)) ||
             (a.name && a.name.toLowerCase().includes(q)) ||
             (a.serial_no && a.serial_no.toLowerCase().includes(q));
    });
  };

  const filteredActiveAssets = getFilteredAssets();
  const totalSelectedCount = (selectedLaptop ? 1 : 0) + (selectedMobile ? 1 : 0) + (selectedAccessory ? 1 : 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <LinkIcon className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Asset Allocation</h3>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Employee Selection */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col h-[500px]">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            1. Select Target Employee
          </h4>
          
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              disabled={isReadOnly}
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by ID or Name..."
              value={empSearchQuery}
              onChange={e => setEmpSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg flex-1 overflow-y-auto">
            {filteredEmployees.map(emp => (
              <div 
                key={emp.employee_id}
                onClick={() => !isReadOnly && setSelectedEmployee(emp.employee_id)}
                className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedEmployee === emp.employee_id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.employee_id}</p>
                  </div>
                  {selectedEmployee === emp.employee_id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">No employees found.</div>
            )}
          </div>
        </div>

        {/* Asset Selection */}
        <div className="flex flex-col h-[500px]">
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden shadow-sm">
            
            {/* Header / Tabs */}
            <div className="bg-gray-50 border-b border-gray-200 p-4 pb-0">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center justify-between">
                <span>2. Select Assets to Allocate</span>
                {totalSelectedCount > 0 && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full">
                    {totalSelectedCount} Selected
                  </span>
                )}
              </h4>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => { setActiveAssetTab('laptops'); setAssetSearchQuery(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                    activeAssetTab === 'laptops' ? 'bg-white text-indigo-700 border-indigo-600' : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Laptop className="w-4 h-4" /> Laptops
                  {selectedLaptop && <div className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></div>}
                </button>
                <button
                  onClick={() => { setActiveAssetTab('mobiles'); setAssetSearchQuery(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                    activeAssetTab === 'mobiles' ? 'bg-white text-indigo-700 border-indigo-600' : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Mobiles
                  {selectedMobile && <div className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></div>}
                </button>
                <button
                  onClick={() => { setActiveAssetTab('accessories'); setAssetSearchQuery(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                    activeAssetTab === 'accessories' ? 'bg-white text-indigo-700 border-indigo-600' : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Headphones className="w-4 h-4" /> Accessories
                  {selectedAccessory && <div className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></div>}
                </button>
              </div>
            </div>

            {/* Asset Search */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  disabled={isReadOnly}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors"
                  placeholder={`Search unassigned ${activeAssetTab}...`}
                  value={assetSearchQuery}
                  onChange={e => setAssetSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Asset List */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-2">
              <div className="space-y-2">
                {filteredActiveAssets.map(asset => {
                  let isSelected = false;
                  if (activeAssetTab === 'laptops') isSelected = selectedLaptop === asset.id;
                  if (activeAssetTab === 'mobiles') isSelected = selectedMobile === asset.id;
                  if (activeAssetTab === 'accessories') isSelected = selectedAccessory === asset.id;

                  return (
                    <div 
                      key={asset.id}
                      onClick={() => {
                        if (isReadOnly) return;
                        if (activeAssetTab === 'laptops') setSelectedLaptop(isSelected ? '' : asset.id);
                        if (activeAssetTab === 'mobiles') setSelectedMobile(isSelected ? '' : asset.id);
                        if (activeAssetTab === 'accessories') setSelectedAccessory(isSelected ? '' : asset.id);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-indigo-50 border-indigo-300 shadow-sm' 
                          : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {activeAssetTab === 'laptops' && <Laptop className="w-4 h-4" />}
                          {activeAssetTab === 'mobiles' && <Smartphone className="w-4 h-4" />}
                          {activeAssetTab === 'accessories' && <Headphones className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {asset.brand} {asset.name}
                          </p>
                          <p className={`text-xs font-mono truncate ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                            SN: {asset.serial_no}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />}
                      </div>
                    </div>
                  );
                })}
                {filteredActiveAssets.length === 0 && (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                    {activeAssetTab === 'laptops' && <Laptop className="w-8 h-8 mb-2 opacity-50" />}
                    {activeAssetTab === 'mobiles' && <Smartphone className="w-8 h-8 mb-2 opacity-50" />}
                    {activeAssetTab === 'accessories' && <Headphones className="w-8 h-8 mb-2 opacity-50" />}
                    <p className="text-sm">No unassigned {activeAssetTab} found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            {!isReadOnly && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <button
                  onClick={handleAssign}
                  disabled={!selectedEmployee || totalSelectedCount === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Allocate {totalSelectedCount > 0 ? totalSelectedCount : ''} Asset{totalSelectedCount > 1 ? 's' : ''}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
