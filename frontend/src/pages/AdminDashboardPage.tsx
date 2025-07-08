import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AdminRecord {
  id: number;
  student_id: string;
  student_name: string;
  class_name: string;
  picked_up_by: string;
  picked_up_at: string;
}

interface FilterParams {
  class_name: string;
  student_id: string;
  date_from: string;
  date_to: string;
}

interface ClassOption {
  class_name: string;
}

interface StudentOption {
  id: string;
  name: string;
  class_name: string;
}

const AdminDashboardPage: React.FC = () => {
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    class_name: '',
    student_id: '',
    date_from: '',
    date_to: '',
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.class_name) params.append('class_name', filters.class_name);
      if (filters.student_id) params.append('student_id', filters.student_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await axios.get(`/api/admin/records?${params.toString()}`);
      setRecords(response.data);
    } catch {
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [recordsResponse, classesResponse, studentsResponse] = await Promise.all([
          axios.get('/api/admin/records'),
          axios.get('/api/admin/classes'),
          axios.get('/api/admin/students'),
        ]);
        
        setRecords(recordsResponse.data);
        setClasses(classesResponse.data);
        setStudents(studentsResponse.data);
      } catch {
        setError('Failed to fetch initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleFilterChange = (key: keyof FilterParams, value: string) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value,
      };
      
      // 如果改变了班级，清除学生选择
      if (key === 'class_name') {
        newFilters.student_id = '';
      }
      
      return newFilters;
    });
  };

  // 根据选择的班级过滤学生列表
  const filteredStudents = filters.class_name 
    ? students.filter(student => student.class_name === filters.class_name)
    : students;

  const handleSearch = () => {
    fetchRecords();
  };

  const handleClearFilters = async () => {
    setFilters({
      class_name: '',
      student_id: '',
      date_from: '',
      date_to: '',
    });
    
    // 清除筛选后重新获取数据
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/records');
      setRecords(response.data);
    } catch {
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>管理後台 - 接送記錄</h1>

      {/* 筛选区域 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>篩選條件</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label htmlFor="class_name">班級：</label>
            <select
              id="class_name"
              value={filters.class_name}
              onChange={(e) => handleFilterChange('class_name', e.target.value)}
              style={{ padding: '5px', marginLeft: '5px' }}
            >
              <option value="">全部班級</option>
              {classes.map((cls) => (
                <option key={cls.class_name} value={cls.class_name}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="student_id">學生：</label>
            <select
              id="student_id"
              value={filters.student_id}
              onChange={(e) => handleFilterChange('student_id', e.target.value)}
              style={{ padding: '5px', marginLeft: '5px' }}
            >
              <option value="">全部學生</option>
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.class_name})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="date_from">開始日期：</label>
            <input
              id="date_from"
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              style={{ padding: '5px', marginLeft: '5px' }}
            />
          </div>
          
          <div>
            <label htmlFor="date_to">結束日期：</label>
            <input
              id="date_to"
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              style={{ padding: '5px', marginLeft: '5px' }}
            />
          </div>
          
          <button onClick={handleSearch} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            搜索
          </button>
          
          <button onClick={handleClearFilters} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            清除篩選
          </button>
        </div>
      </div>

      {/* 接送记录表格 */}
      <div>
        <h2>接送記錄 ({records.length} 筆)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', color: 'white' }}>學生ID</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', color: 'white' }}>姓名</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', color: 'white' }}>班級</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', color: 'white' }}>接送者</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', color: 'white' }}>接送時間</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  沒有找到符合條件的記錄
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.student_id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.student_name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.class_name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.picked_up_by || '未記錄'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.picked_up_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
