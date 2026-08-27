import React, { useEffect, useState } from 'react';
import { ShippingLabelSettings, ShippingLabelPaperSize, ShippingLabelSlipsPerSheet } from '../../types';
import { fetchShippingLabelSettings, saveShippingLabelSettings, DEFAULT_SHIPPING_LABEL_SETTINGS } from '../../utils/shippingLabelEngine';
import { ShippingLabelSlip } from '../../components/ShippingLabelSlip';
import { supabase } from '../../utils/supabaseClient';
import { 
  Printer, 
  Settings, 
  FileText, 
  Grid, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save, 
  Sliders, 
  Barcode, 
  QrCode, 
  Package, 
  Truck, 
  Check,
  Building2,
  Phone,
  FileCheck
} from 'lucide-react';

const PAPER_SIZES: { id: ShippingLabelPaperSize; name: string; dims: string; icon: string }[] = [
  { id: 'A4', name: '📜 A4 Standard Sheet', dims: '210 × 297 mm', icon: 'file' },
  { id: 'A5', name: '📜 A5 Half Sheet', dims: '148 × 210 mm', icon: 'file-text' },
  { id: 'Thermal_4x6', name: '🏷️ Thermal Sticker (4" × 6")', dims: '100 × 150 mm', icon: 'tag' },
  { id: 'Letter', name: '📄 US Letter Sheet', dims: '8.5 × 11 inches', icon: 'file-code' },
];

const SLIP_GRID_OPTIONS: { count: ShippingLabelSlipsPerSheet; name: string; desc: string; cssGrid: string }[] = [
  { count: 1, name: '1 Slip / Sheet', desc: 'Full page single high-impact shipping label', cssGrid: 'grid-cols-1 gap-4' },
  { count: 2, name: '2 Slips / Sheet', desc: 'Half page top and bottom layout', cssGrid: 'grid-cols-1 md:grid-cols-2 gap-4' },
  { count: 4, name: '4 Slips / Sheet (2×2)', desc: 'Standard 4-up quad label sheet layout', cssGrid: 'grid-cols-1 sm:grid-cols-2 gap-3' },
  { count: 6, name: '6 Slips / Sheet (2×3)', desc: 'Compact 6-up batch sticker layout', cssGrid: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2' },
];

export function ShippingLabelManager() {
  const [settings, setSettings] = useState<ShippingLabelSettings>(DEFAULT_SHIPPING_LABEL_SETTINGS);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'paper' | 'features' | 'hub' | 'batch'>('paper');

  useEffect(() => {
    const loadInit = async () => {
      setLoading(true);
      const fetchedSettings = await fetchShippingLabelSettings();
      setSettings(fetchedSettings);

      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setOrders(data);
        setSelectedOrderIds(data.slice(0, 4).map(o => o.id));
      } else {
        // Mock sample orders for testing
        const sampleOrders = [
          {
            id: 'ORD-9021',
            order_number: '#9021',
            customer_name: 'Aditi Sharma',
            shipping_address: {
              name: 'Aditi Sharma',
              address: 'Villa 14, Royal Palm Residency, Indiranagar',
              city: 'Bengaluru',
              state: 'Karnataka',
              zip: '560038',
              phone: '+91 98450 12345'
            },
            total_amount: 14500,
            payment_status: 'COD',
            items: [{ name: 'Royal Ganesha Wooden Sculpture (18")', quantity: 1 }],
            created_at: new Date().toISOString()
          },
          {
            id: 'ORD-9022',
            order_number: '#9022',
            customer_name: 'Rajesh Varma',
            shipping_address: {
              name: 'Rajesh Varma',
              address: 'Flat 402, Heritage Heights, Banjara Hills',
              city: 'Hyderabad',
              state: 'Telangana',
              zip: '500034',
              phone: '+91 98110 98765'
            },
            total_amount: 28900,
            payment_status: 'PAID',
            items: [{ name: 'Sanctified Temple Panel (24")', quantity: 1 }],
            created_at: new Date().toISOString()
          }
        ];
        setOrders(sampleOrders);
        setSelectedOrderIds(sampleOrders.map(o => o.id));
      }
      setLoading(false);
    };

    loadInit();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setNotice(null);
    const res = await saveShippingLabelSettings(settings);
    if (res.success) {
      setNotice({ type: 'success', message: 'Shipping Label configurations published successfully!' });
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to save configurations.' });
    }
    setSaving(false);
  };

  const handleSelectAllOrders = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o.id));
    }
  };

  const handleToggleOrderSelect = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedOrdersList = orders.filter(o => selectedOrderIds.includes(o.id));

  // Determine printable CSS grid class based on slips_per_sheet setting
  const getGridClass = (slips: ShippingLabelSlipsPerSheet) => {
    switch (slips) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 4: return 'grid-cols-1 sm:grid-cols-2';
      case 6: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      default: return 'grid-cols-2';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-3">
        <div className="w-10 h-10 border-4 border-[#fed65b] border-t-[#0f1513] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-gray-500">Loading Shipping Label Configurator & Print Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1b1c1c] max-w-[1400px] mx-auto pb-16">
      
      {/* Dynamic Print Stylesheet for window.print() */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-shipping-sheet, #printable-shipping-sheet * {
            visibility: visible;
          }
          #printable-shipping-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          @page {
            size: ${settings.paper_size === 'Thermal_4x6' ? '4in 6in' : settings.paper_size};
            margin: 4mm;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-[#e8e4dc] shadow-2xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#111615] tracking-tight">Shipping Label Generator & Customizer</h2>
            <span className="bg-[#fed65b] text-[#0f1513] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {settings.paper_size} • {settings.slips_per_sheet} Slips/Sheet
            </span>
          </div>
          <p className="text-xs text-[#747878] mt-1">
            Configure paper dimensions, multi-slip grid layouts, barcode/QR codes, COD stamps, and print batch shipping labels in 1 click.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f1513] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:bg-[#1f2926] cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#fed65b]" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#fed65b] text-[#0f1513] font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:bg-black hover:text-white cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Batch Labels ({selectedOrdersList.length})</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border print:hidden ${
          notice.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-gray-500 hover:text-gray-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONTROLLER PANELS BOARD */}
      <div className="bg-white rounded-[24px] border border-[#e8e4dc] overflow-hidden shadow-2xs print:hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#e8e4dc] bg-[#fcfaf7] px-6 gap-6 text-xs font-bold overflow-x-auto custom-scrollbar">
          {[
            { id: 'paper', label: '1. Paper Size & Slips Grid' },
            { id: 'features', label: '2. Label Feature Toggles' },
            { id: 'hub', label: '3. Dispatch Hub & Branding' },
            { id: 'batch', label: `4. Select Orders (${selectedOrderIds.length}/${orders.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 border-b-2 shrink-0 transition-all cursor-pointer ${
                activeTab === tab.id ? 'border-[#0f1513] text-[#0f1513]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 text-xs">
          
          {/* TAB 1: PAPER SIZE & SLIPS GRID */}
          {activeTab === 'paper' && (
            <div className="space-y-6">
              
              {/* Paper Size Selectors */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Select Print Paper Dimension</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {PAPER_SIZES.map(paper => (
                    <div
                      key={paper.id}
                      onClick={() => setSettings({ ...settings, paper_size: paper.id })}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        settings.paper_size === paper.id
                          ? 'border-[#0f1513] bg-[#0f1513] text-white shadow-md'
                          : 'border-[#e8e4dc] bg-white hover:border-[#0f1513]/40'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs">{paper.name}</span>
                        {settings.paper_size === paper.id && (
                          <CheckCircle2 className="w-4 h-4 text-[#fed65b]" />
                        )}
                      </div>
                      <span className={`text-[11px] font-mono block ${settings.paper_size === paper.id ? 'text-gray-300' : 'text-gray-500'}`}>
                        Dim: {paper.dims}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slips Per Sheet Selectors */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Multi-Slip Grid Layout (Slips Per Sheet)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SLIP_GRID_OPTIONS.map(gridOpt => (
                    <div
                      key={gridOpt.count}
                      onClick={() => setSettings({ ...settings, slips_per_sheet: gridOpt.count })}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                        settings.slips_per_sheet === gridOpt.count
                          ? 'border-[#0f1513] bg-[#0f1513] text-white shadow-md'
                          : 'border-[#e8e4dc] bg-white hover:border-[#0f1513]/40'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs">{gridOpt.name}</span>
                        {settings.slips_per_sheet === gridOpt.count && (
                          <CheckCircle2 className="w-4 h-4 text-[#fed65b]" />
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed ${settings.slips_per_sheet === gridOpt.count ? 'text-gray-300' : 'text-gray-500'}`}>
                        {gridOpt.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LABEL FEATURE TOGGLES */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Customizable Shipping Label Feature Toggles</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'show_barcode', label: '📱 Show Barcode (AWB Tracking)', desc: 'Render SVG Barcode for carrier scanning' },
                  { key: 'show_qr_code', label: '🔲 Show QR Code', desc: 'Scan & verify delivery details' },
                  { key: 'show_fragile_warning', label: '📦 Show Fragile Warning Stamp', desc: 'High-visibility insured transit badge' },
                  { key: 'show_cod_badge', label: '💵 Show Payment Type Badge', desc: 'COD Collection Amount / Prepaid Verification' },
                  { key: 'show_return_address', label: '🏪 Show Dispatch Hub Address', desc: 'Return address for undelivered parcels' },
                  { key: 'show_order_items', label: '🛒 Show Itemized Breakdown', desc: 'List items inside the parcel' },
                ].map(feature => (
                  <label
                    key={feature.key}
                    className="p-4 rounded-2xl border border-[#e8e4dc] bg-[#fbfaf8] hover:bg-white hover:border-[#0f1513] transition-all cursor-pointer flex items-start gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={!!(settings as any)[feature.key]}
                      onChange={e => setSettings({ ...settings, [feature.key]: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-[#0f1513] focus:ring-[#fed65b] cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-[#0f1513] block">{feature.label}</span>
                      <span className="text-[11px] text-gray-500 block mt-0.5">{feature.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DISPATCH HUB & BRANDING */}
          {activeTab === 'hub' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Dispatch Hub & Branding Settings</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Brand Logo Image URL</label>
                  <input
                    type="text"
                    value={settings.brand_logo_url}
                    onChange={e => setSettings({ ...settings, brand_logo_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dispatch Hub Store Name</label>
                  <input
                    type="text"
                    value={settings.dispatch_hub_name}
                    onChange={e => setSettings({ ...settings, dispatch_hub_name: e.target.value })}
                    placeholder="Irisjev Heritage Craft Studios"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dispatch Hub Return Address</label>
                  <textarea
                    rows={2}
                    value={settings.dispatch_hub_address}
                    onChange={e => setSettings({ ...settings, dispatch_hub_address: e.target.value })}
                    placeholder="Enter dispatch hub address..."
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Custom Fragile Declaration Note</label>
                  <textarea
                    rows={2}
                    value={settings.custom_declaration_note}
                    onChange={e => setSettings({ ...settings, custom_declaration_note: e.target.value })}
                    placeholder="FRAGILE - Sanctified Heritage Wooden Sculptures..."
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SELECT BATCH ORDERS */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2 border-gray-200">
                <h3 className="font-bold text-sm text-[#111615]">Select Orders for Batch Printing</h3>
                <button
                  type="button"
                  onClick={handleSelectAllOrders}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  {selectedOrderIds.length === orders.length ? 'Deselect All' : 'Select All Orders'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar p-1">
                {orders.map(order => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <div
                      key={order.id}
                      onClick={() => handleToggleOrderSelect(order.id)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#0f1513] bg-[#0f1513] text-white shadow-xs'
                          : 'border-[#e8e4dc] bg-white hover:border-[#0f1513]/40'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs block">{order.order_number || order.id}</span>
                        <span className={`text-[11px] block truncate max-w-[160px] ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                          {order.customer_name || 'Customer'} • ₹{(order.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#fed65b]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* PRINTABLE MULTI-SLIP SHEET CANVAS */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2 print:hidden">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#111615] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#ba7a1a]" />
            <span>Print Preview Sheet ({selectedOrdersList.length} Labels Selected)</span>
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            Grid: {settings.slips_per_sheet} per sheet • Paper: {settings.paper_size}
          </span>
        </div>

        {/* The Printable Container targeted by window.print() */}
        <div
          id="printable-shipping-sheet"
          className={`grid gap-4 bg-gray-50 p-4 rounded-[24px] border border-[#e8e4dc] shadow-inner ${getGridClass(settings.slips_per_sheet)}`}
        >
          {selectedOrdersList.length > 0 ? (
            selectedOrdersList.map(order => (
              <ShippingLabelSlip
                key={order.id}
                order={order}
                settings={settings}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500 text-xs font-medium">
              No orders selected. Please select orders in Tab 4 to generate shipping labels.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
