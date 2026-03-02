import React, { useState } from 'react';
import { translations } from './data/translations';
import { getTestConfig } from './data/load_env';
import './Questionnaire.css';

export default function Questionnaire({ onComplete }) {
  const [lang, setLang] = useState('es');
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    gamingExperience: '',
    schooling: '',
    diagnosis: '',
    otherDisorders: '',
    meds: '',
    bis_results: {}
  });
  const t = translations[lang];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleScoreChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      bis_results: { ...prev.bis_results, [id]: parseInt(value) }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Check if all fields have been filled
    if (Object.values(formData).some(value => value.trim === '')) {
      alert("Please answer all questions before proceeding.");
      return;
    }
    onComplete(formData); // Send the user data to the IGT
  };

  return (
    <div className='q-container'>
      {/* Language Switcher */}
      <div className="q-lang-header">
        <div className="q-lang-toggle">
          <span style={{ opacity: lang === 'es' ? 1 : 0.5 }}>ES</span>
          <input 
            type="range" 
            min="0" max="1" step="1" 
            className="q-slider"
            value={lang === 'es' ? 0 : 1} 
            onChange={(e) => setLang(e.target.value === "0" ? 'es' : 'ca')}
          />
          <span style={{ opacity: lang === 'ca' ? 1 : 0.5 }}>CA</span>
        </div>
      </div>


      <h1 className='q-title'>{t.title}</h1>
      
      <form onSubmit={handleSubmit} className='q-form'>
        {/* Basic Info */}
        <div className='q-group'>
          <label>{t.age}</label>
          <input type="number" name="age" onChange={handleChange} className='q-input' />
        </div>

        <div className='q-group'>
          <label>{t.gender}</label>
          <select name="gender" onChange={handleChange} className='q-input' required>
            <option value="">...</option>
            {t.genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className='q-group'>
          <label>{t.schooling}</label>
          <input 
            type="number" 
            name="schooling" 
            onChange={handleChange} 
            className='q-input'
            required 
            placeholder="e.g. 12"
          />
        </div>

        {/* Clinical Questions (Yes/No) */}
        {t.clinicalItems.map((item) => (
          <div key={item.id} className='q-item-row'>
            <p className='q-question-text'>{t[item.text]}</p>
            
            <div className='q-radio-group'>
              {t.yesNoQuestions.map((label, i) => (
                <label key={label} className='q-radio-label'>
                  <input 
                    type="radio" 
                    name={item.id} 
                    value={i === 0 ? "yes" : "no"}
                    required 
                    checked={formData[item.id] === (i === 0 ? "yes" : "no")}
                    onChange={handleChange}
                    style={{ marginBottom: '5px' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* BIS-11 Scale */}
        {/* <h2 className='q-section-title'>{t.bisTitle}</h2>
        {t.bisItems.map((item) => (
          <div key={item.id} className='q-item-row'>
            <p className='q-question-text'>{item.text}</p>
            <div className='q-radio-group'>
              {t.labels.map((label, i) => (
                <label key={i} className='q-radio-label-small'>
                  <input type="radio" name={item.id} required onChange={() => handleScoreChange(item.id, [0, 1, 3, 4][i], 'bis')} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))} */}

        {/* ADHD-RS Scale */}
        {/* <h2 className='q-section-title' style={{marginTop: '40px'}}>{t.adhdTitle}</h2>
        {t.adhdItems.map((item) => (
          <div key={item.id} className='q-item-row'>
            <p className='q-question-text'>{item.text}</p>
            <div className='q-radio-group'>
              {t.adhdLabels.map((label, i) => (
                <label key={i} className='q-radio-label-small'>
                  <input type="radio" name={item.id} required onChange={() => handleScoreChange(item.id, i, 'adhd')} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))} */}

        <button type="submit" className='q-button'>{t.submit}</button>
      </form>
    </div>
  );
}