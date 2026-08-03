import React, { useState } from 'react';
import { Product, Currency } from '../types';
import { formatPrice } from '../utils/currency';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  currency: Currency;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onDeleteProduct,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'catalogue' | 'add'>('catalogue');

  // Add form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Product['category']>('God Sculptures');
  const [priceINR, setPriceINR] = useState('45000');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState('18" H x 12" W x 8" D');
  const [material, setMaterial] = useState('Aged Teak Wood');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: `custom-prod-${Date.now()}`,
      name,
      category,
      priceINR: Number(priceINR),
      priceUSD: Math.round(Number(priceINR) / 83.33),
      image: image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeK7OKa4S77fALp3MU5L9NH0gUHmQRzi-AW2uYLfAXuAa5d4auqSgKarq3yGCCRHPRh2lTGGtxUpYVYBcstbF9c4Nz8wUfq8UmEnNWncE-TduzzQcuUe8rc-pz4enVZ6xzav7mXuTtxd5PILaLNETSmFJ0u-kZVfQ63qtPkKmMo42ciLE4DZydgHp3MYiQBBuzMNU5i-PygNcb3217pT3GOrWYmtFilyN9wYaEE48AAg5WMCOiIKzmeg',
      galleryImages: [image],
      description,
      dimensions,
      material,
      style: 'Artisanal Heritage',
      authenticity: 'Artisan Signed & Certified',
      timberOptions: [material, 'Rosewood', 'Teak'],
      rating: 5.0,
      reviewCount: 1,
      isNewArrival: true,
    };

    onAddProduct(newProduct);
    setActiveTab('catalogue');
    setName('');
    setImage('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b1c1c]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf9f8] w-full max-w-4xl rounded-sm shadow-2xl border border-[#c4c7c7] overflow-hidden max-h-[90vh] flex flex-col font-body-md">
        {/* Header */}
        <div className="bg-[#1c1b1b] text-white px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#fed65b]">admin_panel_settings</span>
            <div>
              <h3 className="font-headline-md text-xl font-bold">
                Catalogue & Orders Management Console
              </h3>
              <p className="text-xs text-[#e5e2e1]">Irisjev Wooden Crafts Admin Controls</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:opacity-70 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#e4e2e2] bg-[#f5f3f3] px-8 text-xs font-label-caps uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`py-3 px-6 cursor-pointer font-bold border-b-2 transition-colors ${
              activeTab === 'catalogue'
                ? 'border-[#1c1b1b] text-[#1c1b1b] bg-white'
                : 'border-transparent text-[#444748] hover:text-[#1c1b1b]'
            }`}
          >
            Live Catalogue ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`py-3 px-6 cursor-pointer font-bold border-b-2 transition-colors ${
              activeTab === 'add'
                ? 'border-[#1c1b1b] text-[#1c1b1b] bg-white'
                : 'border-transparent text-[#444748] hover:text-[#1c1b1b]'
            }`}
          >
            + Add New Sculpture
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'catalogue' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-label-caps text-[#444748] uppercase pb-2 border-b">
                <span>Catalogue Item</span>
                <span>Category</span>
                <span>Price</span>
                <span>Action</span>
              </div>
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-white border border-[#e4e2e2] rounded-xs text-xs"
                >
                  <div className="flex items-center gap-3 w-1/3">
                    <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-xs" />
                    <div>
                      <h5 className="font-bold text-[#1b1c1c] text-sm">{p.name}</h5>
                      <span className="text-[10px] text-[#747878]">{p.material}</span>
                    </div>
                  </div>
                  <span className="font-label-caps uppercase text-[#735c00] font-bold">
                    {p.category}
                  </span>
                  <span className="font-bold font-headline-md text-sm">
                    {formatPrice(p.priceINR, currency)}
                  </span>
                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    className="p-1.5 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded-xs cursor-pointer"
                    title="Delete item"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-body-md max-w-xl mx-auto">
              <h4 className="font-headline-md text-lg font-bold text-[#1b1c1c]">
                Add Handcrafted Piece to Collection
              </h4>

              <div>
                <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                  Sculpture Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dancing Nataraja Idol"
                  className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Product['category'])}
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                  >
                    <option value="God Sculptures">God Sculptures</option>
                    <option value="Wall Mounts">Wall Mounts</option>
                    <option value="Square Panels">Square Panels</option>
                    <option value="Grand Sculptures">Grand Sculptures</option>
                    <option value="Temple Doors">Temple Doors</option>
                    <option value="Custom Commissions">Custom Commissions</option>
                    <option value="Baskets & Bottles">Baskets & Bottles</option>
                    <option value="Mirrors & Decor">Mirrors & Decor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={priceINR}
                    onChange={(e) => setPriceINR(e.target.value)}
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                  Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Material / Timber
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                  Description & Story
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Hand-carved by master craftsmen..."
                  className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1c1b1b] text-white font-label-caps uppercase tracking-widest text-xs hover:opacity-90 cursor-pointer"
              >
                Publish Product to Storefront
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
