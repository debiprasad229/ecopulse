import { Globe } from 'lucide-react';
import { calculateOffsets } from '../utils/carbonCalculations';

export default function OffsetSimulatorCard({ id, offsets = { treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 }, setOffsets }) {
  
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    const numericVal = parseInt(value) || 0;
    setOffsets(prev => ({
      ...prev,
      [name]: numericVal
    }));
  };

  const totalOffset = calculateOffsets(offsets);

  // Carbon equivalents:
  // Average car emits 4600 kg CO2/year.
  // Smartphone charging emits 0.008 kg CO2.
  const equivalentCars = (totalOffset / 4600).toFixed(2);
  const equivalentBulbs = Math.round(totalOffset / 50); // ~50kg per LED bulb over its lifetime or similar

  return (
    <div id={id} className="bento-card col-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="card-header" style={{ marginBottom: '15px' }}>
          <div className="card-title-group">
            <div className="card-icon-wrapper" style={{ color: 'var(--accent-blue)', background: 'rgba(6, 182, 212, 0.03)' }}>
              <Globe size={20} />
            </div>
            <h3 className="card-title">Carbon Offset Simulator</h3>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Neutralize your unavoidable emissions by funding verified green projects. Watch how this heals your EcoSphere!
        </p>

        {/* Slider 1: Planting Trees */}
        <div className="offset-slider-group">
          <div className="offset-slider-label-group">
            <span>🌲 Plant Native Trees</span>
            <span className="offset-slider-val">{offsets.treesPlanted} Trees</span>
          </div>
          <input
            type="range"
            name="treesPlanted"
            className="form-control-slider"
            style={{ accentColor: 'var(--accent-blue)' }}
            min="0"
            max="100"
            value={offsets.treesPlanted}
            onChange={handleSliderChange}
            aria-label="Plant Native Trees slider"
          />
          <div className="offset-slider-impact">
            Offsets {offsets.treesPlanted * 22} kg CO₂/yr (22 kg per tree)
          </div>
        </div>

        {/* Slider 2: Renewable Funding */}
        <div className="offset-slider-group">
          <div className="offset-slider-label-group">
            <span>☀️ Clean Energy Projects</span>
            <span className="offset-slider-val">${offsets.cleanEnergyFund} USD</span>
          </div>
          <input
            type="range"
            name="cleanEnergyFund"
            className="form-control-slider"
            style={{ accentColor: 'var(--accent-blue)' }}
            min="0"
            max="250"
            step="5"
            value={offsets.cleanEnergyFund}
            onChange={handleSliderChange}
            aria-label="Clean Energy Projects funding slider"
          />
          <div className="offset-slider-impact">
            Offsets {offsets.cleanEnergyFund * 5} kg CO₂/yr ($1 = 5 kg offset)
          </div>
        </div>

        {/* Slider 3: Plastic Removed */}
        <div className="offset-slider-group">
          <div className="offset-slider-label-group">
            <span>🌊 Ocean Plastic Cleanup</span>
            <span className="offset-slider-val">{offsets.plasticRemoved} kg</span>
          </div>
          <input
            type="range"
            name="plasticRemoved"
            className="form-control-slider"
            style={{ accentColor: 'var(--accent-blue)' }}
            min="0"
            max="200"
            step="5"
            value={offsets.plasticRemoved}
            onChange={handleSliderChange}
            aria-label="Ocean Plastic Cleanup slider"
          />
          <div className="offset-slider-impact">
            Offsets {offsets.plasticRemoved * 2} kg CO₂/yr (2 kg per kg plastic)
          </div>
        </div>
      </div>

      <div 
        style={{ 
          borderTop: '1px solid var(--card-border)', 
          paddingTop: '15px', 
          marginTop: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Total Offsets:
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-blue)', fontFamily: 'var(--font-heading)' }}>
            -{totalOffset.toLocaleString()} kg CO₂e/yr
          </span>
        </div>

        {totalOffset > 0 && (
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
            Equivalent to removing <strong>{equivalentCars}</strong> gasoline cars off the road or turning off <strong>{equivalentBulbs}</strong> LED light bulbs for a full year.
          </p>
        )}
      </div>
    </div>
  );
}
