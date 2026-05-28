import { useState, useEffect } from 'react';
import { supabaseSync } from '../lib/supabase';
import { Save, Laptop, Smartphone, Headphones } from 'lucide-react';

interface AssetFormsProps {
  role: 'admin' | 'user' | 'hr';
}

export default function AssetForms({ role }: AssetFormsProps) {
  const [activeType, setActiveType] = useState<'laptops' | 'mobiles' | 'accessories'>('laptops');
  const isReadOnly = role === 'user';
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    serial_no: '',
    ram: '',
    ssd: '',
    imei_no: '',
    name: '', // For accessories
    has_warranty: false,
    warranty_period: '',
    remarks: '',
  });

  useEffect(() => {
    setFormData({ brand: '', model: '', serial_no: '', ram: '', ssd: '', imei_no: '', name: '', has_warranty: false, warranty_period: '', remarks: '' });
  }, [activeType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    let table = activeType;
    let payload: any = {
      serial_no: formData.serial_no,
      brand: formData.brand,
      has_warranty: formData.has_warranty,
      warranty_period: formData.has_warranty ? formData.warranty_period : null,
      remarks: formData.remarks,
    };

    if (activeType === 'laptops') {
      payload.model = formData.model;
      payload.ram = formData.ram;
      payload.ssd = formData.ssd;
    } else if (activeType === 'mobiles') {
      payload.model = formData.model;
      payload.imei_no = formData.imei_no;
    } else if (activeType === 'accessories') {
      payload.name = formData.name;
    }

    if (supabaseSync) {
      const { error } = await supabaseSync.from(table).insert([payload]);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `${activeType.slice(0, -1)} Registered Successfully` });
        setFormData({ brand: '', model: '', serial_no: '', ram: '', ssd: '', imei_no: '', name: '', has_warranty: false, warranty_period: '', remarks: '' });
      }
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
        <button
          onClick={() => setActiveType('laptops')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeType === 'laptops' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Laptop className="w-4 h-4" /> Laptops
        </button>
        <button
          onClick={() => setActiveType('mobiles')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeType === 'mobiles' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Smartphone className="w-4 h-4" /> Mobiles
        </button>
        <button
          onClick={() => setActiveType('accessories')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeType === 'accessories' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Headphones className="w-4 h-4" /> Accessories
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeType === 'accessories' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accessory Name</label>
            <input
              type="text"
              required
              disabled={isReadOnly}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Wireless Mouse"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Dell"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. XPS 13"
              />
            </div>
          </div>
        )}

        {activeType === 'accessories' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <input
              type="text"
              required
              disabled={isReadOnly}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
            <input
              type="text"
              required
              disabled={isReadOnly}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              value={formData.serial_no}
              onChange={e => setFormData({ ...formData, serial_no: e.target.value })}
            />
          </div>
          {activeType === 'mobiles' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IMEI Number</label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                value={formData.imei_no}
                onChange={e => setFormData({ ...formData, imei_no: e.target.value })}
              />
            </div>
          )}
        </div>

        {activeType === 'laptops' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RAM Capacity</label>
              <input
                type="text"
                disabled={isReadOnly}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                value={formData.ram}
                onChange={e => setFormData({ ...formData, ram: e.target.value })}
                placeholder="e.g. 16GB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Storage (SSD)</label>
              <input
                type="text"
                disabled={isReadOnly}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                value={formData.ssd}
                onChange={e => setFormData({ ...formData, ssd: e.target.value })}
                placeholder="e.g. 512GB"
              />
            </div>
          </div>
        )}

        {/* Warranty and Remarks */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4 space-y-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="has_warranty"
              disabled={isReadOnly}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={formData.has_warranty}
              onChange={e => setFormData({ ...formData, has_warranty: e.target.checked })}
            />
            <label htmlFor="has_warranty" className="text-sm font-medium text-gray-700">
              Device has active warranty
            </label>
          </div>
          
          {formData.has_warranty && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Period</label>
              <input
                type="text"
                disabled={isReadOnly}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                value={formData.warranty_period}
                onChange={e => setFormData({ ...formData, warranty_period: e.target.value })}
                placeholder="e.g. 1 Year, ends on 2026-05-18"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks / Notes</label>
            <textarea
              disabled={isReadOnly}
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors resize-none"
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Any physical damage? Specific configurations?"
            />
          </div>
        </div>

        {!isReadOnly && (
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Asset
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
