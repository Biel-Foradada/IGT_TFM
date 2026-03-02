import React, { useState, useEffect } from 'react';
import './App.css';
import Questionnaire from './Questionnaire';
import { deckSchedules } from './data/schedules';
import { Disclaimer } from './Disclaimer';


function App() {

  // Main variables of the app
  const [stage, setStage] = useState('disclaimer'); 
  const [balance, setBalance] = useState(2000);
  const [trial, setTrial] = useState(0);
  const [offTaskClicks, setOffTaskClicks] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [lastResult, setLastResult] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showPopupDistraction, setshowPopupDistraction] = useState(false);
  const [distractionSchedule, setDistractionSchedule] = useState({});

  // Object to record all of the data of the trials
  const [sessionData, setSessionData] = useState({
    startTime: null,
    participantInfo: {},
    trials: [],
    counters: { A: 0, B: 0, C: 0, D: 0 }
  });

  // Check if the IGT must be ran with or without disctractions
  const [experimentVersion] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const version = params.get('v');
    
    // Check for the version
    if (version === '2') return 'distracted';
    return 'none';
  });

  // Generate the schedule of distractions randomly within the range [21,100]
  const generateDistractionSchedule = () => {
    const trials = Array.from({ length: 80 }, (_, i) => i + 21);
    const shuffled = trials.sort(() => 0.5 - Math.random());
    
    const selected = shuffled.slice(0, 24);
    const schedule = {};

    selected.forEach((trial, index) => {
      if (index < 6) schedule[trial] = 'visual_message'; // 6 Visual messages
      else if (index < 12) schedule[trial] = 'visual_popup'; // 6 Visual popups
      else schedule[trial] = 'audio'; // 12 audios
    });

    return schedule;
  };
    
  // Move to the questionnaire after the disclaimer has been read
  const handleAcceptDisclaimer = () => {
    setStage('survey');
  };

  // Handle Questionnaire Completion
  const handleSurveyComplete = (userInfo) => {
    setDistractionSchedule(generateDistractionSchedule());
    setSessionData(prev => ({
      ...prev,
      participantInfo: userInfo,
      condition: experimentVersion,
      startTime: new Date().toISOString(),
    }));
    setStage('igt');
  };

  // Handle Deck Clicks
  const playTurn = (deckId) => {
    if (sessionData.trials.length >= 100) return;
    if (showPopupDistraction) return;

    // Compute the reward for the turn
    const currentIndex = sessionData.counters[deckId];
    const schedule = deckSchedules[deckId];
    const penalty = schedule.penalties[currentIndex % schedule.penalties.length];
    const net = penalty < 0 ? penalty : schedule.reward;

    // Check if the current trial has had a distraction
    const currentTrialNumber = sessionData.trials.length + 1;
    const distractionType = distractionSchedule[currentTrialNumber] || 'none';

    // Set the last result message
    setLastResult({
      amount: net,
      type: net >= 0 ? 'win' : 'loss'
    });

    // Create the trial record
    const newTrial = {
      trialNumber: currentTrialNumber,
      deck: deckId,
      result: net,
      timestamp: new Date().toISOString(),
      currentBalance: balance + net,
      reward: schedule.reward,
      penalty: penalty,
      offTaskClicks: offTaskClicks,
      distraction_type: distractionType,
    };

    // Update all of the info about the IGT
    setBalance(prev => prev + net);
    setSessionData(prev => ({
      ...prev,
      trials: [...prev.trials, newTrial],
      counters: {
        ...prev.counters,
        [deckId]: prev.counters[deckId] + 1
      }
    }));
    setTrial(prev => prev + 1);
    setOffTaskClicks(0);


    // Create the disctractions
    if (sessionData.condition === 'distracted') {
      if (distractionType === 'visual_message') {
        setShowNotification(true); // Message distractions
      } else if (distractionType === 'visual_popup') {
        setshowPopupDistraction(true); // Popup distractions
      } else if (distractionType === 'audio') {
        const soundFile = Math.random() < 0.5 ? 'noti1.wav' : 'noti2.wav';
        const audio = new Audio(`/sounds/${soundFile}`); // Audio distractions
        audio.volume = 0.6;
        audio.play().catch(e => console.error(e));
        newTrial.audio_file = soundFile; 
      }
    }
  };

  // Save the results locally once the IGT is finished (100 trials)
  useEffect(() => {
    if (trial === 100) {
      const uploadData = async () => {
        try {
          const response = await fetch("http://localhost:3000/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              filename: `IGT_${sessionId}.json`,
              content: { participant_info: sessionData.participantInfo, trials: sessionData.trials }
            })
          });
          if (response.ok) setStage('finished');
        } catch (e) {
          console.error("Save failed", e);
        }
      };
      uploadData();
    }
  }, [sessionData.trials]);

  // Timer for the phone notification, if 3 seconds pass, the notification automatically disappears
  useEffect(() => {
    let timer;
    if (showNotification) {
      timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showNotification]);

  // Show the disclamer
  if (stage === 'disclaimer') {
    return (
      <div className="wrapper">
        <Disclaimer onAccept={handleAcceptDisclaimer} />
      </div>
    );
  }

  // Show the starting survey to get the initial data from the user
  if (stage === 'survey') return <Questionnaire onComplete={handleSurveyComplete} />;
  
  // Ending screen to thank the user for completing the IGT
  if (stage === 'finished') {
    return (
      <div className='wrapper'>
        <h1>Tasca completada</h1>
        <p>Moltes gràcies per participar.</p>
      </div>
    );
  }

  // Main page of the IGT
  return (
    <div className='wrapper' onClick={() => setOffTaskClicks(prev => prev + 1)}>
      {/* HEADER */}
      <header className='header'>
        <h1 className='title'>Iowa Gambling Task</h1>
        <div className='stats-box'>
          <h2 style={{ margin: 0, fontSize: 'clamp(0.9rem, 3vh, 1.3rem)' }}>
            Saldo: ${balance}
          </h2>
          <progress value={trial} max="100" style={{ width: '100%', height: '8px' }}></progress>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
            Assaig: {trial} / 100
          </p>
        </div>
      </header>

      {/* RESULT MESSAGE */}
      <div className='feedback-area'>
        {lastResult && (
          <span style={{ color: lastResult.type === 'win' ? '#4CAF50' : '#FF5252' }}>
            Última recompensa: {lastResult.type === 'win' ? `+ $${lastResult.amount}` : `- $${Math.abs(lastResult.amount)}`}
          </span>
        )}
      </div>

      {/* Area with all the decks */}
      <main className='deck-area'>
        <div className='deck-grid'>
          {['A', 'B', 'C', 'D'].map(id => (
            <button key={id} onClick={() => playTurn(id)} className='deck'>
              Baralla {id}
            </button>
          ))}
        </div>
      </main>

      {/* Phone notification distraction */}
      {showNotification && (
        <div className='notification' onClick={() => setShowNotification(false)}>
          <div style={{ fontSize: '24px' }}>💬</div>
          <div style={{ textAlign: 'left' }}>
            <strong style={{ display: 'block' }}>Missatge</strong>
            <span style={{ fontSize: '0.9rem' }}>Hey, encara estàs fent la tasca? Vine a dinar!</span>
          </div>
        </div>
      )}

      {/* Pop-up distraction */}
      {showPopupDistraction && (
        <div className='math-overlay'>
          <div style={{
            backgroundColor: '#333', padding: '20px', borderRadius: '15px', width: '85%', boxSizing: 'border-box',
            textAlign: 'center', border: '2px solid #646cff', maxWidth: '320px', color: 'white'
          }}>
            <h3>Atenció</h3>
            <p>Això es una distracció.</p>
            <button className='deck' onClick={() => setshowPopupDistraction(false)}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;