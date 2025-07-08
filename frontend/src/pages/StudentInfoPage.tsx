import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Student {
  id: string;
  name: string;
  class_name: string;
}

const StudentInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get(`/api/students/${id}`);
        setStudent(response.data);
      } catch {
        setError('找不到學生資料，請檢查學生證號碼是否正確');
      }
      setLoading(false);
    };

    fetchStudent();
  }, [id]);

  const handleConfirm = async () => {
    if (!student) return;
    
    setIsConfirming(true);
    try {
      await axios.post('/api/records', { student_id: id });
      alert('✅ 接送記錄已成功建立！');
      navigate('/');
    } catch {
      alert('❌ 接送記錄建立失敗，請重試');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="student-info">
        <div className="status-loading">
          <div>⏳ 正在載入學生資料...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-info">
        <div className="student-card">
          <div className="status-error">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <div>{error}</div>
            <button 
              className="btn-secondary mt-3"
              onClick={handleBack}
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-info">
      <div className="student-card">
        <h1>📋 學生資訊確認</h1>
        
        {student && (
          <>
            <div className="student-details">
              <div className="detail-item">
                <div className="detail-label">🆔 學號：</div>
                <div className="detail-value">{student.id}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">👤 姓名：</div>
                <div className="detail-value">{student.name}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">🏫 班級：</div>
                <div className="detail-value">{student.class_name}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">⏰ 接送時間：</div>
                <div className="detail-value">{new Date().toLocaleString('zh-TW')}</div>
              </div>
            </div>
            
            <div className="flex gap-2" style={{ justifyContent: 'space-between' }}>
              <button 
                className="btn-secondary"
                onClick={handleBack}
                style={{ flex: 1 }}
              >
                ← 返回
              </button>
              <button 
                className="confirm-button"
                onClick={handleConfirm}
                disabled={isConfirming}
                style={{ flex: 2 }}
              >
                {isConfirming ? '⏳ 處理中...' : '✅ 確認接送'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentInfoPage;
