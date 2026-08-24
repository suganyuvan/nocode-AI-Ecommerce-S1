import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Pencil, Trash2, Plus, Search, Sparkles, Image as ImageIcon } from 'lucide-react';
import { ProductModal } from '../components/ProductModal';

export function ProductsManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) {
      setProducts(data);
    }
    if (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleEdit = (product: any) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-[#1b1c1c]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#111615] tracking-tight">Products & Heritage Catalog</h2>
          <p className="text-xs text-[#747878] mt-1 font-label-caps uppercase tracking-wider">
            Manage master carvings, timber stock, and pricing
          </p>
        </div>
        <button 
          onClick={handleAdd} 
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0f1513] text-white hover:bg-[#1f2926] rounded-xl text-xs font-bold font-label-caps uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer group"
        >
          <Plus className="w-4 h-4 text-[#fed65b] group-hover:rotate-90 transition-transform" />
          <span>Add Masterpiece</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#ffffff] p-3 rounded-2xl border border-[#ece8df] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999]" />
          <input 
            type="text"
            placeholder="Search sculpture title, timber, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#d4af37] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#0f1513] text-[#fed65b] shadow-xs'
                  : 'bg-[#fbfaf8] text-[#777] hover:text-[#111] hover:bg-[#f4f2ec]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#ece8df] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fbfaf8] border-b border-[#ece8df] text-xs font-semibold text-[#555] uppercase tracking-wider font-label-caps">
              <tr>
                <th className="p-4">Sculpture / Artwork</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price (INR)</th>
                <th className="p-4">Timber & Rating</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe9]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#747878]">
                    <ImageIcon className="w-8 h-8 mx-auto text-[#c4c7c7] mb-2" />
                    <p className="font-semibold text-sm">No sculptures match your search.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#fcfbfa] transition-colors">
                    <td className="p-4 flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f4f2ec] border border-[#ece8df] shrink-0">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                          onError={(e: any) => {
                            e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=120&q=80';
                          }}
                        />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#111615] block">{product.name}</span>
                        <span className="text-[11px] text-[#747878] font-mono">ID: {product.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-[#f4f2ec] text-[#735c00] border border-[#e4e0d8]">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-xs font-sans text-[#111615]">
                      ₹{(product.price_inr || product.priceINR || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-xs text-[#747878]">
                      <div className="flex items-center gap-1 text-[#735c00] font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{product.rating || '4.9'} ★</span>
                      </div>
                      <div className="text-[11px] text-[#888]">{product.reviews_count || 12} Collector Reviews</div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEdit(product)} 
                        className="p-2 text-[#747878] hover:text-[#111615] hover:bg-[#f2efe9] rounded-lg transition-colors cursor-pointer" 
                        title="Edit Masterpiece"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id, product.name)} 
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" 
                        title="Delete Masterpiece"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
