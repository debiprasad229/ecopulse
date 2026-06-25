import { useEcoPulse } from '../context/EcoPulseContext';
import ChartCard from '../components/ChartCard';
import OffsetSimulatorCard from '../components/OffsetSimulatorCard';
import CarbonForecastCard from '../components/CarbonForecastCard';

export default function Analytics() {
  const {
    footprintBreakdown,
    offsets,
    setOffsets,
    forecast,
    netFootprint,
    recommendations,
    history
  } = useEcoPulse();

  return (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Emission Analytics</h2>
        <p className="saas-page-subtitle">Deep dive into emission breakdown, forecast models, and trend analysis.</p>
      </div>

      <div className="bento-grid analytics-layout">
        <ChartCard id="analytics" categories={footprintBreakdown} />
        <OffsetSimulatorCard 
          id="offsets"
          offsets={offsets} 
          setOffsets={setOffsets} 
        />
        <CarbonForecastCard 
          forecast={forecast} 
          netFootprint={netFootprint} 
          recommendations={recommendations} 
        />

        <div className="bento-card col-12 historical-data-card">
          <h3 className="card-title">Historical Emission Telemetry</h3>
          {history.length === 0 ? (
            <p className="no-data" style={{ padding: '20px', color: 'var(--text-muted)' }}>No historical calculation logs recorded.</p>
          ) : (
            <div className="historical-table-wrapper">
              <table className="historical-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Baseline Footprint</th>
                    <th>Comparison</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => {
                    const isFirst = index === history.length - 1;
                    const diff = index < history.length - 1 ? entry.footprint - history[index + 1].footprint : 0;
                    let diffLabel = 'First Record';
                    let diffColor = 'var(--text-muted)';
                    if (!isFirst) {
                      if (diff < 0) {
                        diffLabel = `↓ ${Math.round(Math.abs(diff))} kg CO₂e`;
                        diffColor = 'var(--accent-green)';
                      } else if (diff > 0) {
                        diffLabel = `↑ ${Math.round(diff)} kg CO₂e`;
                        diffColor = 'var(--danger)';
                      } else {
                        diffLabel = 'Unchanged';
                      }
                    }

                    return (
                      <tr key={index}>
                        <td>{entry.timestamp}</td>
                        <td><strong>{Math.round(entry.footprint).toLocaleString()} kg CO₂e/yr</strong></td>
                        <td style={{ color: diffColor }}>{diffLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
