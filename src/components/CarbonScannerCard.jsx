import { useState, useRef } from 'react';
import { UploadCloud, FileText, Check, AlertCircle, Edit3, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { parseDocumentLocally, parseDocumentWithGemini } from '../utils/scannerEngine';
import { EMISSION_FACTORS } from '../utils/carbonCalculations';

export default function CarbonScannerCard({ id, inputs, onUpdateInputs, token }) {
  const [file, setFile] = useState(null); // { name, size, type, dataUrl }
  const [status, setStatus] = useState('idle'); // 'idle' | 'scanning' | 'success' | 'error'
  const [confidence, setConfidence] = useState(0);
  const [documentType, setDocumentType] = useState('shopping_receipt');
  const [extractedValue, setExtractedValue] = useState(0);
  const [unit, setUnit] = useState('USD');
  const [details, setDetails] = useState('');
  const [estimatedCarbon, setEstimatedCarbon] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Calculates carbon footprint based on type & value
  const calculateScannedCarbon = (type, value) => {
    const val = Math.max(0, parseFloat(value) || 0);
    if (type === 'electricity_bill') {
      return Math.round(val * EMISSION_FACTORS.electricity);
    } else if (type === 'fuel_receipt') {
      return Math.round(val * 2.31); // 2.31 kg CO2 per liter
    } else {
      return Math.round(val * 0.12); // $0.12 kg CO2 per dollar
    }
  };

  const handleValueChange = (e) => {
    const newVal = parseFloat(e.target.value) || 0;
    setExtractedValue(newVal);
    setEstimatedCarbon(calculateScannedCarbon(documentType, newVal));
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setDocumentType(newType);
    let newUnit = 'USD';
    let newDetails = 'Shopping Purchase';
    if (newType === 'electricity_bill') {
      newUnit = 'kWh';
      newDetails = 'Electricity Bill';
    } else if (newType === 'fuel_receipt') {
      newUnit = 'Liters';
      newDetails = 'Fuel Receipt';
    }
    setUnit(newUnit);
    setDetails(newDetails);
    setEstimatedCarbon(calculateScannedCarbon(newType, extractedValue));
  };

  const processFile = async (selectedFile) => {
    if (!selectedFile) return;

    // Check size limit (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage("File exceeds 5MB size limit.");
      setStatus('error');
      return;
    }

    setStatus('scanning');
    setErrorMessage('');
    setIsEditing(false);

    const reader = new FileReader();

    // Setup onload callback
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const fileInfo = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        dataUrl
      };
      setFile(fileInfo);

      try {
        const isImage = selectedFile.type.startsWith('image/');
        const geminiKey = true; // Now handled securely by backend

        let result;
        if (isImage && geminiKey) {
          // Use multimodal vision parser
          result = await parseDocumentWithGemini(dataUrl, selectedFile.type, token);
        } else {
          // Local fallback / text parser simulation
          // If it's a text-based file, read content. Otherwise mock scan from filename.
          let contentText = '';
          if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.json')) {
            contentText = await selectedFile.text();
          }
          
          // Simulated 1.5s delay to make it feel premium
          await new Promise(resolve => setTimeout(resolve, 1500));
          result = parseDocumentLocally(contentText, selectedFile.name);
        }

        // Apply results
        setDocumentType(result.documentType);
        setConfidence(result.confidence);
        setExtractedValue(result.parsedData.usageValue);
        setUnit(result.parsedData.unit);
        setDetails(result.parsedData.details);
        setEstimatedCarbon(result.calculatedCarbon);
        setStatus('success');
      } catch (err) {
        console.error(err);
        setErrorMessage(err.message || "Failed to scan document. Please try again.");
        setStatus('error');
      }
    };

    reader.onerror = () => {
      setErrorMessage("Failed to read the file.");
      setStatus('error');
    };

    if (selectedFile.type.startsWith('image/')) {
      reader.readAsDataURL(selectedFile);
    } else {
      // For PDFs or other files, read as dataURL for rendering, or fall back
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setConfidence(0);
    setErrorMessage('');
    setIsEditing(false);
  };

  const handleApplyToDashboard = () => {
    if (!inputs) return;

    let updatedInputs = { ...inputs };
    let summaryMessage;

    if (documentType === 'electricity_bill') {
      updatedInputs.electricityKwh = Math.round(extractedValue);
      summaryMessage = `Monthly electricity usage updated to ${Math.round(extractedValue)} kWh.`;
    } else if (documentType === 'fuel_receipt') {
      // Map gasoline volume to weekly commute distance
      // Average economy: 8 liters per 100 km.
      // So Liters / 0.08 = km. If it's a bi-weekly fill, weekly km = (Liters / 0.08) / 2
      // Let's assume one tank represents 2 weeks of driving
      const calculatedWeeklyKm = Math.round((extractedValue / 0.08) / 2);
      updatedInputs.commuteDistance = Math.max(1, calculatedWeeklyKm);
      updatedInputs.transportType = inputs.transportType === 'none' ? 'gasoline' : inputs.transportType;
      summaryMessage = `Weekly commute updated to ${calculatedWeeklyKm} km based on gasoline consumption.`;
    } else {
      // Shopping receipt
      // Minimalist: < 100 USD, Average: 100 - 300 USD, Consumerist: > 300 USD
      let habit = 'average';
      if (extractedValue < 100) habit = 'minimalist';
      else if (extractedValue > 300) habit = 'consumerist';
      
      updatedInputs.shoppingHabit = habit;
      summaryMessage = `Shopping habit profile adjusted to ${habit} based on receipt value.`;
    }

    onUpdateInputs(updatedInputs);
    alert(`Success! ${summaryMessage}`);
    handleReset();
  };

  return (
    <div id={id} className="bento-card col-6" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Card Header */}
      <div className="card-header" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div className="card-title-group">
          <div className="card-icon-wrapper" style={{ color: 'var(--accent-blue)', background: 'rgba(6, 182, 212, 0.08)' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="card-title">Smart Carbon Scanner</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Scan invoices to sync direct footprint usage metrics
            </span>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {status === 'idle' && (
        <div
          className={`scanner-dropzone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          style={{
            border: '2px dashed var(--card-border)',
            borderRadius: 'var(--border-radius-md)',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragOver ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.01)',
            borderColor: isDragOver ? 'var(--accent-blue)' : 'var(--card-border)',
            transition: 'var(--transition-smooth)'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,text/plain,application/json"
            style={{ display: 'none' }}
          />
          <UploadCloud size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h4 style={{ fontSize: '0.9rem', marginBottom: '6px' }}>Drag & Drop Receipt or Bill</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Supports JPG, PNG, TXT up to 5MB
          </p>
        </div>
      )}

      {/* Loading Scanning State */}
      {status === 'scanning' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', gap: '15px' }}>
          <div style={{ position: 'relative', width: '120px', height: '140px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '6px', overflow: 'hidden' }}>
            <div className="scanner-line" style={{
              position: 'absolute',
              width: '100%',
              height: '4px',
              background: 'linear-gradient(to right, transparent, var(--accent-blue), transparent)',
              boxShadow: '0 0 8px var(--accent-blue)',
              animation: 'scanEffect 2s infinite ease-in-out'
            }} />
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <FileText size={48} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={16} className="spin" style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Extracting invoice data...</span>
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* File summary and reset */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <FileText size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {file?.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
              title="Delete File"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Results Details */}
          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parsed Category</span>
                {isEditing ? (
                  <select
                    value={documentType}
                    onChange={handleTypeChange}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--accent-blue)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      display: 'block',
                      marginTop: '4px',
                      textTransform: 'capitalize'
                    }}
                  >
                    <option value="electricity_bill">Electricity Bill</option>
                    <option value="fuel_receipt">Fuel Receipt</option>
                    <option value="shopping_receipt">Shopping Receipt</option>
                  </select>
                ) : (
                  <h4 style={{ fontSize: '0.95rem', textTransform: 'capitalize', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 0 0' }}>
                    {documentType.replace('_', ' ')}
                  </h4>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: confidence >= 90 ? 'var(--accent-green)' : 'var(--accent-orange)', fontWeight: '700', fontSize: '0.9rem' }}>
                  {confidence}%
                </div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${confidence}%`,
                background: confidence >= 90 ? 'var(--accent-green)' : 'var(--accent-orange)',
                boxShadow: confidence >= 90 ? '0 0 6px var(--accent-green-glow)' : '0 0 6px var(--accent-orange-glow)'
              }} />
            </div>

            {/* Extracted Details & Footprint */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Extracted usage:</span>
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      value={extractedValue}
                      onChange={handleValueChange}
                      style={{
                        width: '80px',
                        padding: '4px 8px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--accent-blue)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        textAlign: 'right'
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unit}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {extractedValue} {unit}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Invoice Details:</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{details}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Carbon Impact:</span>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-green)' }}>
                  +{estimatedCarbon} kg CO₂e
                </span>
              </div>

            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(!isEditing)}
              style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Edit3 size={14} />
              {isEditing ? 'Finish Edit' : 'Edit values'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApplyToDashboard}
              style={{ flex: '1.5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Check size={14} />
              Sync to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
          <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '50%' }}>
            <AlertCircle size={32} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Scan Failed</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{errorMessage}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
