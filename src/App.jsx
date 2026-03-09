import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Questionnaire from './Questionnaire';
import { deckSchedules } from './data/schedules';
import { Disclaimer } from './Disclaimer';


const calculateAdvancedMetrics = (trials) => {
  const rts = trials.map(t => t.total_time_ms);
  
  // Variables Atencionals
  const meanRT = rts.reduce((a, b) => a + b, 0) / rts.length;
  const stdRT = Math.sqrt(rts.map(x => Math.pow(x - meanRT, 2)).reduce((a, b) => a + b) / rts.length);

  // Outer Fences (Límit superior = Q3 + 3 * IQR)
  const sortedRts = [...rts].sort((a, b) => a - b);
  const q1 = sortedRts[Math.floor(rts.length * 0.25)];
  const q3 = sortedRts[Math.floor(rts.length * 0.75)];
  const iqr = q3 - q1;
  const upperLimit = q3 + (3 * iqr);

  const excessivelyShort = rts.filter(rt => rt < 150).length;
  const excessivelyLong = rts.filter(rt => rt > upperLimit).length;

  // Patrons de Decisió
  const isAdvantageous = (deck) => (deck === 'C' || deck === 'D');
  let reversions = 0;
  let switches = 0;

  trials.forEach((t, i) => {
    if (i === 0) return;
    const prev = trials[i - 1];
    // Reversions: d'avantatjosa a desavantatjosa
    if (i >= 40 && isAdvantageous(prev.deck) && !isAdvantageous(t.deck)) {
      reversions++;
    }
    // Taxa de canvi
    if (t.deck !== prev.deck) switches++;
  });

  // Ajust Post-Feedback (Blocs de 20)
  const blocks = [0, 20, 40, 60, 80].map(start => {
    const blockTrials = trials.slice(start, start + 20);
    let winShift = 0;
    let wins = 0;
    let loseShift = 0;
    let highLossShift = 0;

    blockTrials.forEach((t, i) => {
      if (i === 0) return;
      const prev = blockTrials[i - 1];
      const switched = t.deck !== prev.deck;
      if (t.netResult >= 0) wins++;
      if (prev.netResult >= 0 && switched) winShift++;
      if (prev.netResult < 0 && switched) loseShift++;
      if (isAdvantageous(prev.deck) && prev.penalty <= -250 && switched) highLossShift++;
    });

    return { wins, winShift, loseShift, highLossShift };
  });

  // Net Score
  const advantageousCount = trials.filter(t => isAdvantageous(t.deck)).length;
  const disadvantageousCount = 100 - advantageousCount;
  const netScore = advantageousCount - disadvantageousCount;

  return {
    attentional: { meanRT, stdRT, excessivelyShort, excessivelyLong, upperLimit },
    decision: { reversions, totalSwitches: switches, switchingRate: switches / 99 },
    postFeedback: blocks,
    scoring: { advantageousCount, netScore }
  };
};

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
  const [canStartGame, setCanStartGame] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [currentNotificationText, setCurrentNotificationText] = useState("");
  const [notificationIndex, setNotificationIndex] = useState(0);
  const firstInteractionRef = useRef(null);
  const trialStartTimeRef = useRef(Date.now());

  // List of the messages that can be seen in the mobile-style notification
  const SYSTEM_MESSAGES = [
    "Notificació del sistema",
    "Nova activitat al vostre compte",
    "Sincronització completada",
    "Comprovant connexió"
  ];

  useEffect(() => {
    if (stage === 'igt') {
      // Restart the timer
      trialStartTimeRef.current = Date.now();
      firstInteractionRef.current = null;

      const handleGlobalInteraction = () => {
        if (!firstInteractionRef.current) { 
          firstInteractionRef.current = Date.now();
        }
      };

      window.addEventListener('mousemove', handleGlobalInteraction);
      window.addEventListener('touchstart', handleGlobalInteraction);

      return () => {
        window.removeEventListener('mousemove', handleGlobalInteraction);
        window.removeEventListener('touchstart', handleGlobalInteraction);
      };
    }
  }, [trial, stage]);

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

  const generateDistractionSchedule = () => {
    // Show 16 distractions from the trial 20 to the 80
    const MAX_TRIAL = 80;
    const MIN_TRIAL = 20;
    const RANGE = MAX_TRIAL - MIN_TRIAL + 1;
    const NUM_DISTRACTORS = 16;
    let placedCount = 0;
    const schedule = {};
    const distractorPool = [
      ...Array(4).fill('visual_message'), // 4 Visual messages
      ...Array(4).fill('visual_popup'),   // 4 Visual popups
      ...Array(8).fill('audio')            // 8 audios
    ].sort(() => Math.random() - 0.5);

    // Distribute the distractions within the trials following these rules
    // 1. Only one distractor per trial
    // 2. Maximum streak of 2 trials with distractors
    while (placedCount < NUM_DISTRACTORS) {
      // Choose a random trial in the range
      const trial = Math.floor(Math.random() * RANGE) + MIN_TRIAL;
      
      if (!schedule[trial]) {
        const hasPrev = schedule[trial - 1];
        const hasPrevPrev = schedule[trial - 2];
        const hasNext = schedule[trial + 1];
        const hasNextNext = schedule[trial + 2];

        // Check for the streak of distractions
        const wouldCreateLongStreak = (hasPrev && hasPrevPrev) || (hasPrev && hasNext) || (hasNext && hasNextNext);
        
        if (!wouldCreateLongStreak) {
          schedule[trial] = distractorPool[placedCount];
          placedCount++;
        }
      }
    }
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
    // Start the instructions window and a 10 seconds countdown for the user to read the rules
    setStage('instructions');
    setSecondsLeft(10);
    setCanStartGame(false);
  };

  // Once the user has read all the instructions start the IGT
  const handleStartGame = () => {
    setStage('igt');
  };

  const playTurn = (deckId) => {
    if (sessionData.trials.length >= 100 || showPopupDistraction) return;

    const now = Date.now();

    const firstMove = firstInteractionRef.current || now;
  
    const rt_total = now - trialStartTimeRef.current;
    const rt_first_move = firstMove - trialStartTimeRef.current;

    const currentTrialNumber = sessionData.trials.length + 1;
    const distractionType = distractionSchedule[currentTrialNumber] || 'none';
    
    // Mapeig de tipus de distractor (1-3)
    const distractorMap = { 'none': 0, 'visual_message': 1, 'visual_popup': 2, 'audio': 3 };

    // Lògica de premis (guany/pèrdua si o no)
    const currentIndex = sessionData.counters[deckId];
    const schedule = deckSchedules[deckId];
    const penalty = schedule.penalties[currentIndex % schedule.penalties.length];
    const net = penalty < 0 ? penalty : schedule.reward;
    setLastResult({
      amount: net,
      type: net >= 0 ? 'win' : 'loss'
    });

    // Check for an existing distractor
    let dTime = null;
    if (distractionType !== 'none') {
      dTime = new Date().toISOString();
    }

    const newTrial = {
      subjectId: sessionId,                      // uuid
      group: experimentVersion === 'distracted' ? 2 : 1, // Grup (1 control, 2 distracted)
      trialNumber: currentTrialNumber,           // (0-100)
      hasDistraction: distractionType !== 'none' ? "Si" : "No",
      distractionTypeNumeric: distractorMap[distractionType], // (1-3)
      
      // Temps de Reacció
      total_time_ms: rt_total, 
      first_interaction_ms: rt_first_move,
      
      // Timestamps
      timestamp_start: new Date(trialStartTimeRef.current).toISOString(),

      numClicks: offTaskClicks + 1,              // Number of clicks
      deck: deckId,
      gain: net > 0 ? "Si" : "No",
      loss: net < 0 ? "Si" : "No",
      netResult: net
    };

    // Distractors
    if (sessionData.condition === 'distracted') {
      if (distractionType === 'visual_message') {
        const currentMsg = SYSTEM_MESSAGES[notificationIndex % SYSTEM_MESSAGES.length];
        setCurrentNotificationText(currentMsg);
        setShowNotification(true);
        setNotificationIndex(prev => prev + 1);
      } else if (distractionType === 'visual_popup') {
        setshowPopupDistraction(true);
      } else if (distractionType === 'audio') {
        const soundFile = Math.random() < 0.5 ? 'noti1.wav' : 'noti2.wav';
        const audio = new Audio(`/sounds/${soundFile}`);
        audio.volume = 0.6;
        audio.play().catch(e => console.error(e));
        newTrial.audio_file = soundFile;
      }
    }

    // Update states
    setBalance(prev => prev + net);
    setSessionData(prev => ({
      ...prev,
      trials: [...prev.trials, newTrial],
      counters: { ...prev.counters, [deckId]: prev.counters[deckId] + 1 }
    }));
    setTrial(prev => prev + 1);
    setOffTaskClicks(0);
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
              content: { participant_info: sessionData.participantInfo, trials: sessionData.trials, variables: calculateAdvancedMetrics(sessionData.trials) }
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

  // Timer to manage the instructions countdown
  useEffect(() => {
    let timer;
    if (stage === 'instructions' && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setCanStartGame(true);
    }
    return () => clearInterval(timer);
  }, [stage, secondsLeft]);

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

  if (stage === 'instructions') {
    return (
      <div className="wrapper">
        <div className="q-container" style={{ maxWidth: '600px', textAlign: 'left' }}>
          <h1 className="q-title" style={{ textAlign: 'center' }}>Instruccions de la tasca</h1>
          
          <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '1px solid #333', lineHeight: '1.6' }}>
            <p className="q-question-text" style={{ marginBottom: '15px' }}>
              A continuació, apareixeran a la pantalla 4 baralles de cartes. Pots triar una carta del munt que vulguis fent clic sobre elles.
            </p>
            <p className="q-question-text" style={{ marginBottom: '15px' }}>
              Cada vegada que seleccionis una carta, apareixerà la quantitat de diners guanyats o perduts. Ets lliure de canviar de munt sempre que ho desitgis.
            </p>
            <p className="q-question-text" style={{ marginBottom: '15px', fontWeight: 'bold', color: '#646cff' }}>
              L'objectiu del joc és guanyar la màxima quantitat de diners possible.
            </p>
            <p className="q-question-text">
              Pot ser que et trobis perdent diners en totes les baralles, però algunes et faran perdre més que d'altres. Podràs guanyar més si et mantens allunyat de les pitjors.
            </p>
          </div>

          <button 
            className="q-button" 
            onClick={handleStartGame}
            disabled={!canStartGame}
            style={{ 
              marginTop: '30px', 
              width: '100%',
              backgroundColor: canStartGame ? '#646cff' : '#333',
              cursor: canStartGame ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
          >
            {canStartGame ? 'Començar el joc' : `Llegeix les instruccions (${secondsLeft}s)`}
          </button>
        </div>
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
            <button 
              key={id} 
              onClick={() => playTurn(id)} 
              className="deck-card"
              style={{ 
                backgroundImage: `url('/deck_images/${id}.png')` 
              }}
              aria-label={`Seleccionar Baralla ${id}`}
            />
          ))}
        </div>
      </main>

      {/* Phone notification distraction */}
      {showNotification && (
        <div className='notification' onClick={() => setShowNotification(false)}>
          <div style={{ fontSize: '24px' }}>💬</div>
          <div style={{ textAlign: 'left' }}>
            <strong style={{ display: 'block' }}>Sistema</strong>
            <span style={{ fontSize: '0.9rem' }}>{currentNotificationText}</span>
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
            <p>Prem acceptar per continuar amb la tasca.</p>
            <button className='deck' onClick={() => setshowPopupDistraction(false)}>
              Acceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;