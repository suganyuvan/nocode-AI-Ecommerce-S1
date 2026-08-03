import React from 'react';

export const CareGuideView: React.FC = () => {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-12 animate-fadeIn font-body-md">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block">
          Timber Preservation
        </span>
        <h1 className="font-display-lg text-4xl font-bold text-[#1b1c1c] italic">
          Care & Maintenance Guide
        </h1>
        <p className="font-body-lg text-[#444748]">
          Proper care ensures your hand-carved teak, rosewood, and sandalwood sculptures retain their luster for centuries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xs border border-[#e4e2e2] space-y-3">
          <span className="material-symbols-outlined text-3xl text-[#735c00]">cleaning_services</span>
          <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c]">Daily & Weekly Dusting</h3>
          <p className="text-xs text-[#444748] leading-relaxed">
            Use a soft, dry micro-fiber cloth or a natural horsehair brush to dust deep carved grooves, crowns, and lattice windows. Never use synthetic harsh chemical spray cleaners or abrasive pads.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xs border border-[#e4e2e2] space-y-3">
          <span className="material-symbols-outlined text-3xl text-[#735c00]">oil_barrel</span>
          <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c]">Annual Beeswax Conditioning</h3>
          <p className="text-xs text-[#444748] leading-relaxed">
            Once a year, apply a tiny pea-sized amount of organic beeswax polish along the wood grain using a clean cotton cloth. Let sit for 30 minutes, then buff lightly to restore deep natural warmth.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xs border border-[#e4e2e2] space-y-3">
          <span className="material-symbols-outlined text-3xl text-[#735c00]">thermostat</span>
          <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c]">Humidity & Temperature</h3>
          <p className="text-xs text-[#444748] leading-relaxed">
            Avoid placing solid wood sculptures directly in front of air conditioning vents or direct blazing sunlight. Maintain indoor relative humidity between 40% to 65% to prevent natural wood expansion or hairline checking.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xs border border-[#e4e2e2] space-y-3">
          <span className="material-symbols-outlined text-3xl text-[#735c00]">shield</span>
          <h3 className="font-headline-md font-bold text-lg text-[#1b1c1c]">Brass Fixture Polishing</h3>
          <p className="text-xs text-[#444748] leading-relaxed">
            For temple doors and mandapams featuring brass bell studs or oil lamp brackets, gently clean brass fittings with a drop of lemon juice and microfiber cloth, avoiding contact with raw wood grain.
          </p>
        </div>
      </div>
    </div>
  );
};
