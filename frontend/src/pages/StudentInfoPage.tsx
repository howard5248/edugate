import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface Student {
  id: string;
  name: string;
  class_name: string;
}

const StudentInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get(`/api/students/${id}`);
        setStudent(response.data);
      } catch (err) {
        setError('Failed to fetch student data');
      }
      setLoading(false);
    };

    fetchStudent();
  }, [id]);

  const handleConfirm = async () => {
    try {
      await axios.post('/api/records', { student_id: id });
      alert('接送成功！');
    } catch (err) {
      alert('接送失敗');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>學生資訊</h1>
      {student ? (
        <div>
          <p><strong>學號：</strong> {student.id}</p>
          <p><strong>姓名：</strong> {student.name}</p>
          <p><strong>班級：</strong> {student.class_name}</p>
          <button onClick={handleConfirm}>確認接送</button>
        </div>
      ) : (
        <p>找不到學生資料</p>
      )}
    </div>
  );
};

export default StudentInfoPage;
