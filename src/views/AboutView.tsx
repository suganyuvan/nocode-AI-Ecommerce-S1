import React from 'react';
import { ActiveTab } from '../types';

interface AboutViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenBespoke?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ setActiveTab, onOpenBespoke }) => {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-16 animate-fadeIn font-body-md">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block">
          Est. 1995 • Irisjev Wooden Crafts
        </span>
        <h1 className="font-display-lg text-4xl md:text-5xl font-bold text-[#1b1c1c] italic">
          Preserving Ancient Artistry for Generations
        </h1>
        <p className="font-body-lg text-[#444748] leading-relaxed">
          Founded four decades ago in the historic woodcarving hub of Karnataka, Irisjev Wooden Crafts is dedicated to keeping centuries-old Indian temple carving traditions alive.
        </p>
      </div>

      {/* Story Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block">
            Our Lineage
          </span>
          <h2 className="font-display-lg text-3xl font-bold text-[#1b1c1c] italic">
            8th Generation Master Craftsmen
          </h2>
          <p className="text-sm text-[#444748] leading-relaxed">
            Our guild is led by traditional *Viswakarma* sculptors whose lineage traces back to the royal carvers of the Vijayanagara and Hoysala dynasties. Passing secrets of timber selection, chisel sharpening, and divine proportion down through father-to-son apprenticeships.
          </p>
          <p className="text-sm text-[#444748] leading-relaxed">
            We reject mass plastic moulding and rapid CNC carving in favor of soul-infused hand chiseling that gives every deity idol its unique spiritual presence.
          </p>
        </div>

        <div className="relative">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeK7OKa4S77fALp3MU5L9NH0gUHmQRzi-AW2uYLfAXuAa5d4auqSgKarq3yGCCRHPRh2lTGGtxUpYVYBcstbF9c4Nz8wUfq8UmEnNWncE-TduzzQcuUe8rc-pz4enVZ6xzav7mXuTtxd5PILaLNETSmFJ0u-kZVfQ63qtPkKmMo42ciLE4DZydgHp3MYiQBBuzMNU5i-PygNcb3217pT3GOrWYmtFilyN9wYaEE48AAg5WMCOiIKzmeg"
            alt="Master Carver at Work"
            className="w-full h-[380px] object-cover rounded-xs border border-[#c4c7c7] shadow-lg"
          />
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-[#f5f3f3] p-8 rounded-xs border border-[#e4e2e2]">
        <div className="space-y-2">
          <span className="material-symbols-outlined text-3xl text-[#735c00]">forest</span>
          <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c]">100% Certified Timber</h3>
          <p className="text-xs text-[#444748]">
            We only use timber legally harvested from government-controlled teak plantations and verified reclaimed beam auctions.
          </p>
        </div>
        <div className="space-y-2">
          <span className="material-symbols-outlined text-3xl text-[#735c00]">military_tech</span>
          <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c]">Authenticity Guarantee</h3>
          <p className="text-xs text-[#444748]">
            Each sculpture comes with a physical brass plaque certificate signed by the master sculptor with serial registration.
          </p>
        </div>
        <div className="space-y-2">
          <span className="material-symbols-outlined text-3xl text-[#735c00]">flight_takeoff</span>
          <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c]">Global Transit Crating</h3>
          <p className="text-xs text-[#444748]">
            Exporting to over 40 countries with custom wooden crating and complete customs documentation assistance.
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center space-y-4 pt-6">
        <h3 className="font-display-lg text-2xl font-bold text-[#1b1c1c]">
          Experience Ancient Craftsmanship First-Hand
        </h3>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab('shop')}
            className="px-8 py-3.5 bg-[#1c1b1b] text-white text-xs font-label-caps uppercase tracking-widest cursor-pointer hover:opacity-90"
          >
            Explore Ready Sculptures
          </button>
        </div>
      </div>
    </div>
  );
};
