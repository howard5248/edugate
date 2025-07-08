import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const navigate = useNavigate();

  const handleScan = () => {
    if (studentId.trim() !== '') {
      navigate(`/student/${studentId}`);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleScan();
    }
  };

  return (
    <div className="homepage">
      <div className="homepage-card">
        <h1 className="homepage-title">
          蘭州幼兒園接送系統
        </h1>
        <p className="text-center mb-3" style={{ color: 'var(--primary-dark)', fontSize: '1.1rem' }}>
          請輸入或掃描學生證號碼
        </p>
        
        <div className="input-group">
          <label htmlFor="studentId">學生證號碼</label>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="請輸入學生ID (例如: S001)"
            autoFocus
          />
        </div>
        
        <button 
          className="search-button"
          onClick={handleScan}
          disabled={!studentId.trim()}
        >
          🔍 查詢學生
        </button>
        
        <div className="mt-3 text-center">
          <p style={{ color: 'var(--primary-dark)', fontSize: '0.9rem' }}>
            系統支援條碼掃描與手動輸入
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
