import { useState, useEffect } from 'react';
import { supabaseSync } from '../lib/supabase';
import { Search, Laptop, Smartphone, Headphones, Tag, CheckCircle2, CircleDashed, Edit, Trash2, X, Save, AlertCircle, UserMinus } from 'lucide-react';

interface AssetDirectoryProps {
  role: 'admin' | 'user' | 'hr';
}

type AssetItem = {
  id: string;
  type: 'laptops' | 'mobiles' | 'accessories';
  brand: string;
  name?: string;
  model?: string;
  serial_no?: string;
  imei_no?: string;
  ram?: string;
  ssd?: string;
  has_warranty?: boolean;
  warranty_period?: string;
  remarks?: string;
  assigned_to: string | null;
  employees?: { name: string } | null;
  created_at: string;
};

export default function AssetDirectory({ role }: AssetDirectoryProps) {
  const isReadOnly = role === 'user';
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'laptops' | 'mobiles' | 'accessories'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Modal & Edit State
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const fetchAllAssets = async () => {
    setLoading(true);
    if (supabaseSync) {
      const [lapRes, mobRes, accRes] = await Promise.all([
        supabaseSync.from('laptops').select('*, employees(name)'),
        supabaseSync.from('mobiles').select('*, employees(name)'),
        supabaseSync.from('accessories').select('*, employees(name)')
      ]);

      const unified: AssetItem[] = [];
      
      if (lapRes.data) lapRes.data.forEach((item: any) => unified.push({ ...item, type: 'laptops' }));
      if (mobRes.data) mobRes.data.forEach((item: any) => unified.push({ ...item, type: 'mobiles' }));
      if (accRes.data) accRes.data.forEach((item: any) => unified.push({ ...item, type: 'accessories' }));

      unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAssets(unified);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllAssets();
  }, []);

  const handleDelete = async (asset: AssetItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Asset',
      message: `Are you sure you want to permanently delete this ${asset.type.slice(0, -1)}? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        if (supabaseSync) {
          const { error } = await supabaseSync.from(asset.type).delete().eq('id', asset.id);
          if (error) {
            setMessage({ type: 'error', text: error.message });
          } else {
            setSelectedAsset(null);
            fetchAllAssets();
          }
        }
      }
    });
  };

  const handleUnassign = async (asset: AssetItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Unassign Device',
      message: 'Are you sure you want to unassign this device?',
      onConfirm: async () => {
        setConfirmDialog(null);
        if (supabaseSync) {
          const { error } = await supabaseSync
            .from(asset.type)
            .update({ assigned_to: null })
            .eq('id', asset.id);

          if (error) {
            setMessage({ type: 'error', text: error.message });
          } else {
            setMessage({ type: 'success', text: 'Device successfully unassigned.' });
            setTimeout(() => setMessage(null), 3000);
            await fetchAllAssets();
            
            // Optimistically update selected asset view
            const updatedAsset = { ...asset, assigned_to: null, employees: null };
            setSelectedAsset(updatedAsset);
          }
        }
      }
    });
  };

  const startEdit = (asset: AssetItem) => {
    setEditFormData({
      brand: asset.brand || '',
      name: asset.name || '',
      model: asset.model || '',
      serial_no: asset.serial_no || '',
      imei_no: asset.imei_no || '',
      ram: asset.ram || '',
      ssd: asset.ssd || '',
      has_warranty: asset.has_warranty || false,
      warranty_period: asset.warranty_period || '',
      remarks: asset.remarks || ''
    });
    setEditMode(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !supabaseSync) return;

    let payload: any = {
      brand: editFormData.brand,
      serial_no: editFormData.serial_no,
      has_warranty: editFormData.has_warranty,
      warranty_period: editFormData.has_warranty ? editFormData.warranty_period : null,
      remarks: editFormData.remarks
    };

    if (selectedAsset.type === 'laptops') {
      payload.model = editFormData.model;
      payload.ram = editFormData.ram;
      payload.ssd = editFormData.ssd;
    } else if (selectedAsset.type === 'mobiles') {
      payload.model = editFormData.model;
      payload.imei_no = editFormData.imei_no;
    } else if (selectedAsset.type === 'accessories') {
      payload.name = editFormData.name;
    }

    const { error } = await supabaseSync
      .from(selectedAsset.type)
      .update(payload)
      .eq('id', selectedAsset.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 5000);
    } else {
      setEditMode(false);
      setMessage({ type: 'success', text: 'Asset updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
      await fetchAllAssets();
      const updatedAsset = assets.find(a => a.id === selectedAsset.id);
      if (updatedAsset) setSelectedAsset({ ...updatedAsset, ...payload });
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (categoryFilter !== 'all' && asset.type !== categoryFilter) return false;
    if (statusFilter === 'assigned' && !asset.assigned_to) return false;
    if (statusFilter === 'unassigned' && asset.assigned_to) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      // Safe string checks
      const matchBrand = (asset.brand || '').toLowerCase().includes(q);
      const matchModel = (asset.model || '').toLowerCase().includes(q);
      const matchName = (asset.name || '').toLowerCase().includes(q);
      const matchSerial = (asset.serial_no || '').toLowerCase().includes(q);
      const matchImei = (asset.imei_no || '').toLowerCase().includes(q);
      
      // Determine if employees exists and is an object with a name property
      let empName = '';
      if (asset.employees && typeof asset.employees === 'object' && !Array.isArray(asset.employees) && asset.employees.name) {
        empName = asset.employees.name;
      }
      const matchEmp = empName.toLowerCase().includes(q);

      if (!matchBrand && !matchModel && !matchName && !matchSerial && !matchImei && !matchEmp) {
        return false;
      }
    }
    return true;
  });

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
            placeholder="Search brand, model, serial, or assignee..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-48">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
            >
              <option value="all">All Categories</option>
              <option value="laptops">Laptops</option>
              <option value="mobiles">Mobiles</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
        </div>

        <div className="w-full md:w-48">
          <select
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Grid of Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6 overflow-y-auto">
          {filteredAssets.map(asset => {
             // Safe name extraction
             let safeEmpName = 'Unknown Employee';
             if (asset.employees && !Array.isArray(asset.employees) && asset.employees.name) {
               safeEmpName = asset.employees.name;
             }

             return (
               <div 
                 key={asset.id + asset.type} 
                 onClick={() => { setSelectedAsset(asset); setEditMode(false); setMessage(null); }}
                 className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
               >
                 {/* Asset Header */}
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                       asset.type === 'laptops' ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' :
                       asset.type === 'mobiles' ? 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white' :
                       'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
                     }`}>
                       {asset.type === 'laptops' && <Laptop className="w-5 h-5" />}
                       {asset.type === 'mobiles' && <Smartphone className="w-5 h-5" />}
                       {asset.type === 'accessories' && <Headphones className="w-5 h-5" />}
                     </div>
                     <div>
                       <h3 className="font-bold text-gray-900 leading-tight">
                         {asset.brand} {asset.model || asset.name}
                       </h3>
                       <p className="text-xs font-medium text-gray-500 capitalize">{(asset.type || '').slice(0, -1)}</p>
                     </div>
                   </div>
                   
                   {/* Status Badge */}
                   {asset.assigned_to ? (
                     <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium px-2 py-1 rounded-md">
                       <CheckCircle2 className="w-3.5 h-3.5" />
                       Assigned
                     </span>
                   ) : (
                     <span className="flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 text-xs font-medium px-2 py-1 rounded-md">
                       <CircleDashed className="w-3.5 h-3.5" />
                       Unassigned
                     </span>
                   )}
                 </div>

                 {/* Asset Details */}
                 <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-1 mb-4 border border-gray-100">
                   {asset.serial_no && (
                     <div className="flex justify-between">
                       <span className="text-gray-500">Serial No:</span>
                       <span className="font-mono text-xs">{asset.serial_no}</span>
                     </div>
                   )}
                   <div className="flex justify-between">
                     <span className="text-gray-500">Warranty:</span>
                     <span className={asset.has_warranty ? "text-green-600 font-medium" : "text-gray-400"}>
                       {asset.has_warranty ? 'Yes' : 'No'}
                     </span>
                   </div>
                 </div>

                 {/* Assignment Footer */}
                 <div className="border-t border-gray-100 pt-3">
                   {asset.assigned_to ? (
                     <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                         {(safeEmpName.charAt(0) || '?').toUpperCase()}
                       </div>
                       <span className="text-sm font-medium text-gray-800 truncate">
                         {safeEmpName}
                       </span>
                       <span className="text-xs text-gray-400 ml-auto">{asset.assigned_to}</span>
                     </div>
                   ) : (
                     <p className="text-sm text-gray-400 italic">Available in inventory</p>
                   )}
                 </div>
               </div>
             );
          })}
          
          {filteredAssets.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No assets found matching your search and filter criteria.
            </div>
          )}
        </div>
      )}

      {/* Asset Modal Popup */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedAsset(null)}></div>
          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    selectedAsset.type === 'laptops' ? 'bg-indigo-100 text-indigo-600' :
                    selectedAsset.type === 'mobiles' ? 'bg-green-100 text-green-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                  {selectedAsset.type === 'laptops' && <Laptop className="w-7 h-7" />}
                  {selectedAsset.type === 'mobiles' && <Smartphone className="w-7 h-7" />}
                  {selectedAsset.type === 'accessories' && <Headphones className="w-7 h-7" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {selectedAsset.brand} {selectedAsset.model || selectedAsset.name}
                  </h2>
                  <p className="text-sm text-gray-500 capitalize">{(selectedAsset.type || '').slice(0, -1)} Profile</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isReadOnly && !editMode && (
                  <>
                    <button onClick={() => startEdit(selectedAsset)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    {selectedAsset.assigned_to && (
                      <button onClick={() => handleUnassign(selectedAsset)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
                        <UserMinus className="w-4 h-4" /> Unassign
                      </button>
                    )}
                    <button onClick={() => handleDelete(selectedAsset)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-2"></div>
                  </>
                )}
                <button onClick={() => setSelectedAsset(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
              {message && (
                <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {message.text}
                </div>
              )}

              {editMode ? (
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Edit Hardware Details</h4>
                    
                    {selectedAsset.type === 'accessories' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Accessory Name</label>
                        <input type="text" required className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                          <input type="text" required className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" value={editFormData.brand} onChange={e => setEditFormData({ ...editFormData, brand: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                          <input type="text" required className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" value={editFormData.model} onChange={e => setEditFormData({ ...editFormData, model: e.target.value })} />
                        </div>
                      </div>
                    )}

                    {selectedAsset.type === 'accessories' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                        <input type="text" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" value={editFormData.brand} onChange={e => setEditFormData({ ...editFormData, brand: e.target.value })} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                        <input type="text" required className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" value={editFormData.serial_no} onChange={e => setEditFormData({ ...editFormData, serial_no: e.target.value })} />
                      </div>
                      {selectedAsset.type === 'mobiles' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">IMEI Number</label>
                          <input type="text" required className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" value={editFormData.imei_no} onChange={e => setEditFormData({ ...editFormData, imei_no: e.target.value })} />
                        </div>
                      )}
                    </div>

                    {selectedAsset.type === 'laptops' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">RAM Capacity</label>
                          <input type="text" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" value={editFormData.ram} onChange={e => setEditFormData({ ...editFormData, ram: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Storage (SSD)</label>
                          <input type="text" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" value={editFormData.ssd} onChange={e => setEditFormData({ ...editFormData, ssd: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Lifecycle & Notes</h4>
                    <div className="flex items-center gap-3 mb-2">
                      <input type="checkbox" id="edit_has_warranty" className="w-4 h-4 text-blue-600 border-gray-300 rounded" checked={editFormData.has_warranty} onChange={e => setEditFormData({ ...editFormData, has_warranty: e.target.checked })} />
                      <label htmlFor="edit_has_warranty" className="text-sm font-medium text-gray-700">Device has active warranty</label>
                    </div>
                    {editFormData.has_warranty && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Period</label>
                        <input type="text" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" value={editFormData.warranty_period} onChange={e => setEditFormData({ ...editFormData, warranty_period: e.target.value })} />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes</label>
                      <textarea rows={3} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 resize-none" value={editFormData.remarks} onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Status Banner */}
                  {selectedAsset.assigned_to ? (() => {
                    let safeSelectedEmpName = 'Unknown Employee';
                    if (selectedAsset.employees && !Array.isArray(selectedAsset.employees) && selectedAsset.employees.name) {
                      safeSelectedEmpName = selectedAsset.employees.name;
                    }
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserMinus className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Currently Assigned To</p>
                            <p className="text-base font-bold text-blue-900">{safeSelectedEmpName} <span className="font-normal text-blue-700">({selectedAsset.assigned_to})</span></p>
                          </div>
                        </div>
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">In Use</span>
                      </div>
                    );
                  })() : (
                    <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</p>
                          <p className="text-base font-bold text-gray-900">Available in Inventory</p>
                        </div>
                      </div>
                      <span className="bg-white border border-gray-300 text-gray-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Unassigned</span>
                    </div>
                  )}

                  {/* Specifications */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Hardware Specifications</h4>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="divide-y divide-gray-200">
                          {selectedAsset.serial_no && (
                            <tr className="bg-gray-50/50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Serial Number</td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-900">{selectedAsset.serial_no}</td>
                            </tr>
                          )}
                          {selectedAsset.imei_no && (
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-gray-500">IMEI Number</td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-900">{selectedAsset.imei_no}</td>
                            </tr>
                          )}
                          {selectedAsset.ram && (
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-gray-500">RAM Capacity</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{selectedAsset.ram}</td>
                            </tr>
                          )}
                          {selectedAsset.ssd && (
                            <tr className="bg-gray-50/50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-500">Storage</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{selectedAsset.ssd}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Lifecycle */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Lifecycle & Warranty</h4>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Active Warranty</td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {selectedAsset.has_warranty ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}
                            </td>
                          </tr>
                          {selectedAsset.has_warranty && selectedAsset.warranty_period && (
                            <tr className="bg-green-50/30">
                              <td className="px-4 py-3 text-sm font-medium text-green-700">Warranty Period</td>
                              <td className="px-4 py-3 text-sm text-green-900">{selectedAsset.warranty_period}</td>
                            </tr>
                          )}
                          {selectedAsset.remarks && (
                            <tr className="bg-amber-50/30">
                              <td className="px-4 py-3 text-sm font-medium text-amber-700 align-top">Remarks / Notes</td>
                              <td className="px-4 py-3 text-sm text-amber-900 whitespace-pre-wrap">{selectedAsset.remarks}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
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
