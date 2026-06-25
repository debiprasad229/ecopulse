import { useEcoPulse } from '../context/EcoPulseContext';
import EcoPulseAI from '../components/EcoPulseAI';
import RecommendationsCard from '../components/RecommendationsCard';

export default function AICoach() {
  const {
    inputs,
    footprintBreakdown,
    netFootprint,
    xp,
    completedHabits,
    addNotification,
    chatHistory,
    setChatHistory,
    token,
    setShowWizard
  } = useEcoPulse();

  return (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Carbon AI Coach</h2>
        <p className="saas-page-subtitle">Chat with our AI model for personalized carbon reduction suggestions.</p>
      </div>

      <div className="bento-grid ai-coach-layout">
        <EcoPulseAI 
          id="ai-coach"
          inputs={inputs} 
          footprintBreakdown={footprintBreakdown} 
          netFootprint={netFootprint} 
          xp={xp} 
          completedHabits={completedHabits} 
          addNotification={addNotification}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          token={token}
        />
        <RecommendationsCard 
          recommendations={useEcoPulse().recommendations} 
          onOpenCalculator={() => setShowWizard(true)}
        />
      </div>
    </div>
  );
}
