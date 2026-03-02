import './App.css';
import React, { useState } from 'react';

export function Disclaimer({ onAccept }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="q-container" style={{ maxWidth: '700px' }}>

      <h1 className="q-title">Consentiment Informat</h1>
      
      <div className="q-item-row" style={{ borderBottom: 'none', textAlign: 'left' }}>
        {/* Headers and general information */}
        <h2 style={{ fontSize: '1.2rem', color: '#646cff', marginBottom: '10px' }}>
          Qüestionari estudi IGT-IA
        </h2>
        <p className="q-question-text" style={{ fontWeight: 'bold' }}>
          Benvolgut participant,
        </p>
        <p className="q-question-text" style={{ lineHeight: '1.6', opacity: 0.9 }}>
          Primer de tot, moltes gràcies per dedicar-nos una mica del seu temps i ajudar-nos a avançar en el coneixement científic. L'estudi IGT-IA és una iniciativa del Laboratori de Toxicologia i Salut Mediambiental (LTSM), en col·laboració amb el grup de Tecnologies Intel·ligents Avançades per a la Gestió del Coneixement (iTAKA) del Centre de Tecnologia TECNATOX de la Universitat Rovira i Virgili (URV) de Tarragona. L’objectiu de l’estudi és desenvolupar metodologies d'avaluació de la qualitat experimental de les dades recollides en enquestes online. Un context molt influenciat per diverses fonts de distracció ambiental que posen en perill la fiabilitat de les dades. La seva participació ens permetrà crear eines més robustes que ajudin al treball de recerca dels investigadors i investigadores del territori. Per col·laborar, li demanem que contesti algunes preguntes i participi en un breu i senzill joc. En acceptar continuar amb el qüestionari, vostè confirma que: 
        </p>

        {/* PDF Link Button */}
        <div style={{ margin: '20px 0', padding: '15px', backgroundColor: 'rgba(100, 108, 255, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
          <a 
            href="/info.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#646cff', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>📄</span> Llegir el Full d'informació al participant (PDF)
          </a>
        </div>

        {/* Prerequisites */}
        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <p className="q-question-text" style={{ fontSize: '0.9rem', marginBottom: '15px', color: '#bbb' }}>
            En marcar la casella i continuar, confirmes que:
          </p>
          
          <ul style={{ paddingLeft: '20px', color: 'white', fontSize: '0.85rem', lineHeight: '1.5' }}>
            <li style={{ marginBottom: '8px' }}>Ets major de 18 anys i resideixes a Espanya.</li>
            <li style={{ marginBottom: '8px' }}>Acceptes participar voluntàriament i entens que pots retirar-te en qualsevol moment.</li>
            <li style={{ marginBottom: '8px' }}>Has llegit i comprens el "Full d'informació al participant".</li>
            <li style={{ marginBottom: '8px' }}>Entens que tota la informació serà tractada confidencialment i de forma anònima.</li>
            <li style={{ marginBottom: '8px' }}>Acceptes l'emmagatzematge segur de les dades per a finalitats científiques.</li>
          </ul>

          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '15px', fontStyle: 'italic' }}>
            Per a qualsevol dubte, pots contactar amb l'equip de recerca a: <strong>luis.heredia@urv.cat</strong>
          </p>
        </div>

        {/* Images for tecnatox and urv */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '20px',
          width: '100%'
        }}>
          <img 
            src="/images/tecnatox.png"
            alt="tecnatox" 
            style={{ 
              height: '80px',
              width: 'auto',
              maxWidth: '45%'
            }} 
          />
          <img 
            src="/images/urv.png"
            alt="urv_logo" 
            style={{ 
              height: '80px',
              width: 'auto',
              maxWidth: '45%'
            }} 
          />
        </div>

        {/* Checkbox to agree with the terms */}
        <div style={{ marginTop: '25px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}>
          <input 
            type="checkbox" 
            id="consent" 
            checked={checked} 
            onChange={(e) => setChecked(e.target.checked)}
            style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#646cff' }}
          />
          <label htmlFor="consent" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
            Accepto participar voluntàriament en aquest estudi.
          </label>
        </div>
      </div>

      {/* Button to start the questionnaire */}
      <button 
        className="q-button" 
        disabled={!checked} 
        onClick={onAccept}
        style={{ 
          marginTop: '10px',
          backgroundColor: checked ? '#646cff' : '#333',
          cursor: checked ? 'pointer' : 'not-allowed'
        }}
      >
        Començar Qüestionari
      </button>
    </div>
  );
}
