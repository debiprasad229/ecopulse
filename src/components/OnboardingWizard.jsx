import { useState } from 'react';
import { Leaf, Navigation, Zap, ShoppingBag, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const STEPS = [
  { id: 'transport', title: 'Daily Commute', icon: Navigation },
  { id: 'flights', title: 'Air Travel', icon: Navigation },
  { id: 'energy', title: 'Home Energy', icon: Zap },
  { id: 'lifestyle', title: 'Diet & Shopping', icon: ShoppingBag }
];

export default function OnboardingWizard({ onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputs, setInputs] = useState({
    commuteDistance: 30, // km per week
    transportType: 'gasoline', // gasoline, hybrid, electric, transit, none
    flightHours: 5, // hours per year
    electricityKwh: 200, // kWh per month
    greenEnergyShare: 0, // 0 to 100 %
    heatingSource: 'gas', // gas, oil, heatpump, wood, none
    dietType: 'lowMeat', // vegan, vegetarian, lowMeat, heavyMeat
    shoppingHabit: 'average', // minimalist, average, consumerist
    recycles: true
  });

  const [errors, setErrors] = useState({});

  const currentStep = STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    let numericVal = parseFloat(value);
    
    // Clear errors when typing
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (isNaN(numericVal)) {
      numericVal = '';
    } else {
      // Security/Sanitization: Prevent negative values
      numericVal = Math.max(0, numericVal);
      
      // Upper bounds validation
      if (name === 'commuteDistance' && numericVal > 2000) numericVal = 2000;
      if (name === 'flightHours' && numericVal > 1000) numericVal = 1000;
      if (name === 'electricityKwh' && numericVal > 10000) numericVal = 10000;
      if (name === 'greenEnergyShare' && numericVal > 100) numericVal = 100;
    }

    setInputs(prev => ({ ...prev, [name]: numericVal }));
  };

  const setSelectValue = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const toggleCheckbox = (key) => {
    setInputs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const validateStep = () => {
    const stepErrors = {};
    if (currentStep.id === 'transport') {
      if (inputs.commuteDistance === '') stepErrors.commuteDistance = 'Please enter a weekly commute distance.';
    }
    if (currentStep.id === 'flights') {
      if (inputs.flightHours === '') stepErrors.flightHours = 'Please enter your annual flight hours.';
    }
    if (currentStep.id === 'energy') {
      if (inputs.electricityKwh === '') stepErrors.electricityKwh = 'Please enter your monthly electricity usage.';
      if (inputs.greenEnergyShare === '') stepErrors.greenEnergyShare = 'Please enter your green energy percentage.';
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Calculate results and pass back
      onComplete({
        ...inputs,
        commuteDistance: parseFloat(inputs.commuteDistance) || 0,
        flightHours: parseFloat(inputs.flightHours) || 0,
        electricityKwh: parseFloat(inputs.electricityKwh) || 0,
        greenEnergyShare: parseFloat(inputs.greenEnergyShare) || 0
      });
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <div className="modal-content">
        
        {/* Wizard Header */}
        <div className="modal-wizard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Leaf className="brand-logo" size={24} />
            <h2 id="wizard-title" style={{ fontSize: '1.25rem' }}>Calculate Your Baseline</h2>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Wizard Body */}
        <div className="wizard-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--card-border)' }}>
            <div className="card-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--accent-green)', width: '36px', height: '36px' }}>
              <StepIcon size={18} />
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {currentStep.title}
            </span>
          </div>

          {currentStep.id === 'transport' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
                How do you commute?
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Tell us about your weekly transport routines. Walking, cycling, or working from home counts as 0 km.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="commuteDistance">
                  Weekly Commute Distance (km)
                </label>
                <input
                  id="commuteDistance"
                  type="number"
                  name="commuteDistance"
                  className={`wizard-number-input ${errors.commuteDistance ? 'error' : ''}`}
                  min="0"
                  max="2000"
                  value={inputs.commuteDistance}
                  onChange={handleNumberChange}
                  aria-invalid={errors.commuteDistance ? "true" : "false"}
                />
                {errors.commuteDistance && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.commuteDistance}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" id="transport-type-label">Primary Mode of Transport</label>
                <div className="form-select-group" role="radiogroup" aria-labelledby="transport-type-label">
                  {[
                    { val: 'gasoline', label: 'Gasoline Car' },
                    { val: 'hybrid', label: 'Hybrid Car' },
                    { val: 'electric', label: 'Electric EV' },
                    { val: 'transit', label: 'Public Transit' },
                    { val: 'none', label: 'Walk / Cycle' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      role="radio"
                      aria-checked={inputs.transportType === opt.val}
                      className={`select-chip ${inputs.transportType === opt.val ? 'active' : ''}`}
                      onClick={() => setSelectValue('transportType', opt.val)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep.id === 'flights' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
                Do you fly?
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Airplane travel emits a massive amount of CO2. Estimate how many hours you spend in the air per year.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="flightHours">
                  Annual Flight Duration (hours)
                </label>
                <input
                  id="flightHours"
                  type="number"
                  name="flightHours"
                  className={`wizard-number-input ${errors.flightHours ? 'error' : ''}`}
                  min="0"
                  max="1000"
                  value={inputs.flightHours}
                  onChange={handleNumberChange}
                  aria-invalid={errors.flightHours ? "true" : "false"}
                />
                {errors.flightHours && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.flightHours}</p>
                )}
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Tip: A round trip short flight is about 4-6 hours. Intercontinental trips are typically 14-24 hours.
                </p>
              </div>
            </div>
          )}

          {currentStep.id === 'energy' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
                Home Energy Usage
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Your electricity grid source and heating choices constitute your primary domestic emissions.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="electricityKwh">
                  Monthly Electricity Usage (kWh)
                </label>
                <input
                  id="electricityKwh"
                  type="number"
                  name="electricityKwh"
                  className={`wizard-number-input ${errors.electricityKwh ? 'error' : ''}`}
                  min="0"
                  max="10000"
                  value={inputs.electricityKwh}
                  onChange={handleNumberChange}
                  aria-invalid={errors.electricityKwh ? "true" : "false"}
                />
                {errors.electricityKwh && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>{errors.electricityKwh}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="greenEnergyShare">
                  Green Renewable Share (%)
                </label>
                <input
                  id="greenEnergyShare"
                  type="range"
                  name="greenEnergyShare"
                  className="form-control-slider"
                  min="0"
                  max="100"
                  value={inputs.greenEnergyShare}
                  onChange={handleNumberChange}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--accent-green)' }}>
                  <span>Standard Grid Mix</span>
                  <span style={{ fontWeight: '700' }}>{inputs.greenEnergyShare}% Renewable</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" id="heating-source-label">Primary Heating Fuel</label>
                <div className="form-select-group" role="radiogroup" aria-labelledby="heating-source-label">
                  {[
                    { val: 'gas', label: 'Natural Gas' },
                    { val: 'oil', label: 'Fuel Oil' },
                    { val: 'heatpump', label: 'Heat Pump (Elec)' },
                    { val: 'wood', label: 'Wood / Biomass' },
                    { val: 'none', label: 'No Heating' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      role="radio"
                      aria-checked={inputs.heatingSource === opt.val}
                      className={`select-chip ${inputs.heatingSource === opt.val ? 'active' : ''}`}
                      onClick={() => setSelectValue('heatingSource', opt.val)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep.id === 'lifestyle' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
                Lifestyle & Diet Choices
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Food and consumer behavior play an important role in indirect emissions.
              </p>

              <div className="form-group">
                <label className="form-label" id="diet-type-label">Dietary Habit</label>
                <div className="form-select-group" role="radiogroup" aria-labelledby="diet-type-label">
                  {[
                    { val: 'heavyMeat', label: 'Meat-heavy (Daily beef/pork)' },
                    { val: 'lowMeat', label: 'Low Meat (Mostly poultry/veg)' },
                    { val: 'vegetarian', label: 'Vegetarian (No meat/fish)' },
                    { val: 'vegan', label: 'Vegan (Strict plant-based)' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      role="radio"
                      aria-checked={inputs.dietType === opt.val}
                      className={`select-chip ${inputs.dietType === opt.val ? 'active' : ''}`}
                      onClick={() => setSelectValue('dietType', opt.val)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" id="shopping-habit-label">Shopping Habit (Clothing, Electronics)</label>
                <div className="form-select-group" role="radiogroup" aria-labelledby="shopping-habit-label">
                  {[
                    { val: 'consumerist', label: 'Consumerist (New devices & outfits)' },
                    { val: 'average', label: 'Average (Occasional purchases)' },
                    { val: 'minimalist', label: 'Minimalist (Thrift/Repair)' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      role="radio"
                      aria-checked={inputs.shoppingHabit === opt.val}
                      className={`select-chip ${inputs.shoppingHabit === opt.val ? 'active' : ''}`}
                      onClick={() => setSelectValue('shoppingHabit', opt.val)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                <input
                  type="checkbox"
                  id="recycles"
                  className="habit-checkbox"
                  style={{ width: '18px', height: '18px', display: 'inline-block' }}
                  checked={inputs.recycles}
                  onChange={() => toggleCheckbox('recycles')}
                />
                <label htmlFor="recycles" className="form-label" style={{ margin: 0, cursor: 'pointer', display: 'inline' }}>
                  I actively sort and recycle plastic, glass, paper, and food waste
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="wizard-footer">
          <button 
            type="button"
            className={`btn btn-secondary ${currentStepIndex === 0 ? 'btn-disabled' : ''}`}
            onClick={handleBack}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft size={16} /> Back
          </button>
          
          <button 
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
          >
            {currentStepIndex === STEPS.length - 1 ? (
              <>Calculate <Check size={16} /></>
            ) : (
              <>Continue <ArrowRight size={16} /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
