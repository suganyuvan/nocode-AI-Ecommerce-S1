import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Product } from '../../types';

type ImageItem = {
  id: string;
  type: 'url' | 'upload';
  url?: string;
  file?: File;
};

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: any | null; // using any since database maps price_inr
  onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Product['category']>('God Sculptures');
  const [priceINR, setPriceINR] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [newImageInputType, setNewImageInputType] = useState<'url' | 'upload'>('url');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState('18" H x 12" W x 8" D');
  const [material, setMaterial] = useState('Aged Teak Wood');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setCategory(productToEdit.category || 'God Sculptures');
      setPriceINR(productToEdit.price_inr?.toString() || productToEdit.priceINR?.toString() || '');
      const existingGallery = productToEdit.gallery_images || productToEdit.galleryImages || (productToEdit.image ? [productToEdit.image] : []);
      setImages(existingGallery.map((url: string) => ({
        id: Math.random().toString(36).substring(7),
        type: 'url',
        url
      })));
      setDescription(productToEdit.description || '');
      setDimensions(productToEdit.dimensions || '');
      setMaterial(productToEdit.material || '');
    } else {
      // Reset form for Add
      setName('');
      setCategory('God Sculptures');
      setPriceINR('');
      setImages([]);
      setNewImageInputType('url');
      setNewImageUrl('');
      setNewImageFile(null);
      setDescription('');
      setDimensions('18" H x 12" W x 8" D');
      setMaterial('Aged Teak Wood');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddImage = () => {
    if (newImageInputType === 'url' && newImageUrl) {
      setImages([...images, { id: Math.random().toString(), type: 'url', url: newImageUrl }]);
      setNewImageUrl('');
    } else if (newImageInputType === 'upload' && newImageFile) {
      setImages([...images, { id: Math.random().toString(), type: 'upload', file: newImageFile }]);
      setNewImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      alert('Please enter a URL or select a file to add.');
    }
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImages(images.filter(img => img.id !== idToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0 && !newImageUrl && !newImageFile) {
      alert('Please add at least one image.');
      return;
    }

    setLoading(true);

    const finalGalleryUrls: string[] = [];

    // Also process any pending image in the inputs if they haven't clicked "Add"
    const allImagesToProcess = [...images];
    if (newImageInputType === 'url' && newImageUrl) {
      allImagesToProcess.push({ id: 'pending', type: 'url', url: newImageUrl });
    } else if (newImageInputType === 'upload' && newImageFile) {
      allImagesToProcess.push({ id: 'pending', type: 'upload', file: newImageFile });
    }

    for (const img of allImagesToProcess) {
      if (img.type === 'url' && img.url) {
        finalGalleryUrls.push(img.url);
      } else if (img.type === 'upload' && img.file) {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product_images')
          .upload(filePath, img.file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('Failed to upload one of the images. Please try again.');
          setLoading(false);
          return;
        }

        const { data } = supabase.storage.from('product_images').getPublicUrl(filePath);
        finalGalleryUrls.push(data.publicUrl);
      }
    }

    if (finalGalleryUrls.length === 0) {
      finalGalleryUrls.push('https://lh3.googleusercontent.com/aida-public/AB6AXuBeK7OKa4S77fALp3MU5L9NH0gUHmQRzi-AW2uYLfAXuAa5d4auqSgKarq3yGCCRHPRh2lTGGtxUpYVYBcstbF9c4Nz8wUfq8UmEnNWncE-TduzzQcuUe8rc-pz4enVZ6xzav7mXuTtxd5PILaLNETSmFJ0u-kZVfQ63qtPkKmMo42ciLE4DZydgHp3MYiQBBuzMNU5i-PygNcb3217pT3GOrWYmtFilyN9wYaEE48AAg5WMCOiIKzmeg');
    }

    const primaryImage = finalGalleryUrls[0];

    const productPayload: any = {
      name,
      category,
      price_inr: Number(priceINR),
      price_usd: Math.round(Number(priceINR) / 83.33),
      image: primaryImage,
      gallery_images: finalGalleryUrls,
      description,
      dimensions,
      material,
      style: 'Artisanal Heritage',
      authenticity: 'Artisan Signed & Certified',
      timber_options: [material, 'Rosewood', 'Teak'],
      rating: 5.0,
      review_count: 1,
      is_new_arrival: true,
    };

    if (productToEdit) {
      // Update
      const { error } = await supabase.from('products').update(productPayload).eq('id', productToEdit.id);
      if (error) console.error(error);
    } else {
      // Insert
      productPayload.id = `prod-${Date.now()}`;
      const { error } = await supabase.from('products').insert([productPayload]);
      if (error) console.error(error);
    }

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1b1c1c]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf9f8] w-full max-w-2xl rounded-sm shadow-2xl border border-[#c4c7c7] overflow-hidden max-h-[90vh] flex flex-col font-body-md">
        
        {/* Header */}
        <div className="bg-[#1c1b1b] text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-headline-md text-lg font-bold">
            {productToEdit ? 'Edit Sculpture' : 'Add New Sculpture'}
          </h3>
          <button onClick={onClose} className="text-white hover:opacity-70 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs max-w-xl mx-auto">
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
              <label className="block text-xs font-label-caps uppercase text-[#444748] mb-2 font-bold">
                Product Gallery *
              </label>

              {/* Added Images Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-square border border-[#c4c7c7] rounded-sm bg-white overflow-hidden shadow-sm">
                      {img.type === 'url' ? (
                        <img src={img.url} alt="Gallery" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <img src={URL.createObjectURL(img.file!)} alt="Gallery" className="w-full h-full object-cover" />
                      )}
                      <button type="button" onClick={() => handleRemoveImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 shadow-sm" title="Remove image">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Image Form */}
              <div className="bg-[#f5f3f3] p-3 border border-[#c4c7c7] rounded-xs space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-label-caps uppercase text-[#444748] font-bold">
                    Add New Image Source
                  </label>
                  <div className="flex items-center space-x-2 text-xs">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" checked={newImageInputType === 'url'} onChange={() => setNewImageInputType('url')} className="w-3 h-3 text-[#1b1c1c]" />
                      <span>Image URL</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" checked={newImageInputType === 'upload'} onChange={() => setNewImageInputType('upload')} className="w-3 h-3 text-[#1b1c1c]" />
                      <span>Upload Image</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    {newImageInputType === 'url' ? (
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                      />
                    ) : (
                      <div className="w-full p-1.5 border border-[#c4c7c7] border-dashed rounded-xs bg-white flex items-center justify-center">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg, image/png, image/webp, image/avif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 230 * 1024) {
                                alert('Image size exceeds 230kb limit. Please upload a smaller file.');
                                e.target.value = '';
                                return;
                              }
                              setNewImageFile(file);
                            }
                          }}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#1b1c1c] file:text-white hover:file:bg-gray-800"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-6 py-2.5 bg-white border border-[#1c1b1b] text-[#1c1b1b] rounded-xs text-xs font-label-caps uppercase tracking-widest hover:bg-gray-50 whitespace-nowrap cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
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
                Description
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
              disabled={loading}
              className="w-full py-3 bg-[#1c1b1b] text-white font-label-caps uppercase tracking-widest text-xs hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : (productToEdit ? 'Save Changes' : 'Publish Product')}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
