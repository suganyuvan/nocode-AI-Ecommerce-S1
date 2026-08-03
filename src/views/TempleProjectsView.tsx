import React from 'react';
import { ActiveTab } from '../types';

interface TempleProjectsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const TempleProjectsView: React.FC<TempleProjectsViewProps> = ({
  
  setActiveTab,
}) => {
  const projects = [
    {
      title: 'Sri Lakshmi Narayana Temple Shrine',
      location: 'Dallas, Texas, USA',
      wood: 'Aged Burmese Teak Wood',
      completionYear: '2025',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCopiZFKKw0hGQPYG_mLJdJ5OB7pOHQxsc3Z1QMibWen6WwhVBTKcCX8q6DR76oTyFF2Ya7jXDFMdIHUWPvL0KHHsQ98AdTlT59EjnWnqwWqqYHrJDWISDmnviw_egcQEkqqmzjpjPgubHoVVY7mySXhS-McHYfNe0WiLyTw7jKsBOMWUdNItg8AjA76PraiU4VURKLncMTXH1mbmJ369jGX9-62e8B7aI0rbQE4dSxe-Zv2Uczn_gmeA',
      desc: '12-foot grand hand-carved mandapam featuring 16 Dravidian pillars, intricate lotus ceilings, and integrated LED accent lighting.'
    },
    {
      title: 'Royal Villa Ashtalakshmi Sanctuary',
      location: 'Bengaluru, India',
      wood: 'Indian Rosewood & Sandalwood Inlay',
      completionYear: '2026',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2XtT6-Jf7cOMrIJrgV88untrXYs-djj1NK10Z4tbGAt9KElbKfTNeSXxMfbpYv5Cj9roR0FYMH9fC5f0y32uJIZMr9EAUiEqIzm1h2sm4dadaCxGWlCy7y_ytIJ6ZuMvxodktvaO4ODIzSl1NnLywxGvjui0TY2Kj6tDzdlSN5HDMBqdZHLYOYgXJcCzY12qkSNw7-QjpTNERtHWUeM_MIUwWYCf-oG8SnZBazYozK1VoYB6NRPE_ZA',
      desc: 'Custom temple doors with 108 brass bell studs, double arched entrance framing, and hand-carved Lakshmi floral motifs.'
    },
    {
      title: 'Spiritual Wellness Sanctuary',
      location: 'Dubai, UAE',
      wood: 'Honey-Stained Teak Wood',
      completionYear: '2024',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBS1ELlckSMDlqJ1YXaEkUx7yAMpnOUG0wSOgFPuBit9lC4XD9DBl1Q8BG3LvLRbB9hzZuuRKJgW_2u05do-W3VljhE2jtNEk7rqW5mphJw6SybKHl3RLE5kyodeV56ff9bNGaMzMI4Ch_lkBuA20zWlbdM7TfsLP4fQ6Maf6SGNj58O2Ph2TMzHuHDf_XAH7dKIhcmdpEtBfjehjHf6LuIjEhlRkre8aZY7KL7KmcZ3Vh9ADlmq5HzIQ',
      desc: 'Monolithic wall mount panel depicting Lord Vishnu resting on Adishesha, crafted from single-tree aged timber.'
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-12 animate-fadeIn font-body-md">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block">
          Architectural Portfolio
        </span>
        <h1 className="font-display-lg text-3xl md:text-5xl font-bold text-[#1b1c1c] italic">
          Grand Temple Projects & Mandapams
        </h1>
        <p className="font-body-lg text-[#444748]">
          Irisjev Wooden Crafts has executed over 4,500 architectural temple shrines, mandapams, and carved entrance doors for private estates and spiritual centers across India, USA, UK, Singapore, and Dubai.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="space-y-12">
        {projects.map((proj, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-8 rounded-xs border border-[#e4e2e2] shadow-sm ${
              idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            <div className={`lg:col-span-6 ${idx % 2 === 1 ? 'lg:order-2' : ''}`}>
              <img
                src={proj.image}
                alt={proj.title}
                className="w-full h-[360px] object-cover rounded-xs border border-[#c4c7c7]/30"
              />
            </div>

            <div className={`lg:col-span-6 space-y-4 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
              <div className="flex justify-between items-center text-xs font-label-caps uppercase text-[#735c00] font-bold">
                <span>{proj.location}</span>
                <span>Completed {proj.completionYear}</span>
              </div>
              <h3 className="font-display-lg text-2xl font-bold text-[#1b1c1c]">
                {proj.title}
              </h3>
              <p className="text-sm text-[#444748] leading-relaxed">
                {proj.desc}
              </p>
              <div className="bg-[#f5f3f3] p-3 rounded-xs text-xs font-label-caps space-y-1">
                <p><strong>Timber Used:</strong> {proj.wood}</p>
                <p><strong>Artisan Team:</strong> 12 Master Carvers & Woodturners</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Consultation Banner */}
      <div className="bg-[#1c1b1b] text-white p-10 rounded-xs text-center space-y-4">
        <h3 className="font-display-lg text-3xl font-bold italic">
          Planning a Temple Mandapam for Your Home?
        </h3>
        <p className="text-sm font-body-lg text-[#e5e2e1] max-w-xl mx-auto">
          Our senior sthapati architects will prepare complimentary 3D CAD blueprints and wood samples based on your room dimensions.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <button
            onClick={() => setActiveTab('shop')}
            className="px-8 py-3.5 bg-transparent border border-white text-white font-label-caps text-xs uppercase tracking-widest hover:bg-white hover:text-black cursor-pointer"
          >
            Browse Ready Mandapams
          </button>
        </div>
      </div>
    </div>
  );
};
