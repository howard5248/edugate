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

  return (
    <div>
      <h1>掃描或輸入學生ID</h1>
      <input
        type="text"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        placeholder="請輸入學生ID (例如 S001)"
      />
      <button onClick={handleScan}>查詢</button>
    </div>
  );
};

export default HomePage;
