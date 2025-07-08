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

interface RecordFormData {
  student_id: string;
  picked_up_by: string;
  picked_up_at: string;
}

// 获取当月第一天和最后一天
const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0]
  };
};

const AdminLoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('請輸入密碼');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/admin/verify-password', { password });
      if (response.data.success) {
        onLogin();
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('密碼錯誤，請重試');
      } else {
        setError('驗證失敗，請稍後再試');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const formEvent = {
        preventDefault: () => {}
      } as React.FormEvent;
      handleSubmit(formEvent);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🔐 管理員登入</h1>
        <p>請輸入管理員密碼以訪問管理後台</p>
      </div>

      <div className="filters-section" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="filter-group">
            <label htmlFor="admin-password">🔑 管理員密碼</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="請輸入管理員密碼"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ 
              color: '#ff6b6b', 
              textAlign: 'center', 
              marginTop: '1rem',
              fontSize: '0.9rem' 
            }}>
              ⚠️ {error}
            </div>
          )}

          <div className="filter-actions" style={{ marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              className="btn-filter" 
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? '⏳ 驗證中...' : '🔓 登入'}
            </button>
          </div>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem', 
          fontSize: '0.9rem',
          color: 'var(--primary-dark)',
          opacity: 0.7
        }}>
          💡 提示：請聯繫系統管理員取得密碼
        </div>
      </div>
    </div>
  );
};

const AdminDashboardPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminRecord | null>(null);
  const [formData, setFormData] = useState<RecordFormData>({
    student_id: '',
    picked_up_by: '',
    picked_up_at: ''
  });
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [isAutoSearching, setIsAutoSearching] = useState(false);

  const monthRange = getCurrentMonthRange();
  const [filters, setFilters] = useState<FilterParams>({
    class_name: '',
    student_id: '',
    date_from: monthRange.start,
    date_to: monthRange.end,
  });

  // 检查登录状态
  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('adminAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
  };

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
      setSelectedRecords(new Set()); // 清空选择
    } catch {
      setError('載入記錄失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordsWithFilters = async (filterParams: FilterParams) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterParams.class_name) params.append('class_name', filterParams.class_name);
      if (filterParams.student_id) params.append('student_id', filterParams.student_id);
      if (filterParams.date_from) params.append('date_from', filterParams.date_from);
      if (filterParams.date_to) params.append('date_to', filterParams.date_to);

      const response = await axios.get(`/api/admin/records?${params.toString()}`);
      setRecords(response.data);
      setSelectedRecords(new Set()); // 清空选择
    } catch {
      setError('載入記錄失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchInitialData = async () => {
        try {
          const monthRange = getCurrentMonthRange();
          const params = new URLSearchParams();
          params.append('date_from', monthRange.start);
          params.append('date_to', monthRange.end);

          const [recordsResponse, classesResponse, studentsResponse] = await Promise.all([
            axios.get(`/api/admin/records?${params.toString()}`),
            axios.get('/api/admin/classes'),
            axios.get('/api/admin/students'),
          ]);
          
          setRecords(recordsResponse.data);
          setClasses(classesResponse.data);
          setStudents(studentsResponse.data);
        } catch {
          setError('載入初始資料失敗');
        } finally {
          setLoading(false);
        }
      };

      fetchInitialData();
    }
  }, [isAuthenticated]);

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

    // 清除之前的搜索计时器
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // 设置搜索状态
    setIsAutoSearching(true);

    // 设置新的搜索计时器，1秒后执行搜索
    const timeoutId = setTimeout(async () => {
      try {
        await fetchRecordsWithFilters(key === 'class_name' ? { ...filters, [key]: value, student_id: '' } : { ...filters, [key]: value });
      } finally {
        setIsAutoSearching(false);
      }
    }, 1000);

    setSearchTimeout(timeoutId);
  };

  // 根据选择的班级过滤学生列表
  const filteredStudents = filters.class_name 
    ? students.filter(student => student.class_name === filters.class_name)
    : students;

  // 清除计时器效果
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        setIsAutoSearching(false);
      }
    };
  }, [searchTimeout]);

  const handleClearFilters = async () => {
    // 清除搜索计时器
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    
    // 重置搜索状态
    setIsAutoSearching(false);

    const monthRange = getCurrentMonthRange();
    setFilters({
      class_name: '',
      student_id: '',
      date_from: monthRange.start,
      date_to: monthRange.end,
    });
    
    // 清除筛选后重新获取数据（使用默认月份范围）
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('date_from', monthRange.start);
      params.append('date_to', monthRange.end);
      
      const response = await axios.get(`/api/admin/records?${params.toString()}`);
      setRecords(response.data);
      setSelectedRecords(new Set());
    } catch {
      setError('載入記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  // 复选框选择处理
  const handleSelectRecord = (recordId: number) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map(record => record.id)));
    }
  };

  // 新增记录
  const handleAddRecord = async () => {
    if (!formData.student_id) {
      alert('請選擇學生');
      return;
    }
    
    try {
      // 如果提供了时间，转换为 ISO 格式
      const submitData = {
        ...formData,
        picked_up_at: formData.picked_up_at ? new Date(formData.picked_up_at).toISOString() : undefined
      };
      
      await axios.post('/api/admin/records', submitData);
      setShowAddModal(false);
      setFormData({ student_id: '', picked_up_by: '', picked_up_at: '' });
      fetchRecords();
      alert('✅ 記錄新增成功！');
    } catch {
      alert('❌ 記錄新增失敗，請重試');
    }
  };

  // 修改记录
  const handleEditRecord = async () => {
    if (!editingRecord) return;
    
    if (!formData.student_id) {
      alert('請選擇學生');
      return;
    }
    
    if (!formData.picked_up_at) {
      alert('請選擇接送時間');
      return;
    }
    
    try {
      // 转换时间为 ISO 格式
      const submitData = {
        ...formData,
        picked_up_at: new Date(formData.picked_up_at).toISOString()
      };
      
      await axios.put(`/api/admin/records/${editingRecord.id}`, submitData);
      setShowEditModal(false);
      setEditingRecord(null);
      setFormData({ student_id: '', picked_up_by: '', picked_up_at: '' });
      fetchRecords();
      alert('✅ 記錄修改成功！');
    } catch {
      alert('❌ 記錄修改失敗，請重試');
    }
  };

  // 删除记录
  const handleDeleteRecords = async () => {
    if (selectedRecords.size === 0) {
      alert('請選擇要刪除的記錄');
      return;
    }

    const confirmed = window.confirm(`⚠️ 確定要刪除選中的 ${selectedRecords.size} 筆記錄嗎？\n\n此操作無法復原！`);
    if (!confirmed) return;

    try {
      await axios.delete('/api/admin/records', {
        data: { ids: Array.from(selectedRecords) }
      });
      setSelectedRecords(new Set());
      fetchRecords();
      alert('✅ 記錄刪除成功！');
    } catch {
      alert('❌ 記錄刪除失敗，請重試');
    }
  };

  // 格式化时间为 datetime-local 输入格式
  const formatDateTimeLocal = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    
    // 解析时间字符串并转换为 YYYY-MM-DDTHH:MM 格式
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 打开编辑模态框
  const openEditModal = (record: AdminRecord) => {
    setEditingRecord(record);
    setFormData({
      student_id: record.student_id,
      picked_up_by: record.picked_up_by,
      picked_up_at: formatDateTimeLocal(record.picked_up_at)
    });
    setShowEditModal(true);
  };

  // 如果未登录，显示登录页面
  if (!isAuthenticated) {
    return <AdminLoginPage onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="status-loading">
          <div>⏳ 正在載入管理後台資料...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="status-error">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* 页面标题 */}
      <div className="admin-header">
        <h1>📊 管理後台</h1>
        <p>學生接送記錄管理系統</p>
        <button 
          onClick={handleLogout}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            padding: '0.4rem 0.8rem',
            background: 'var(--light-beige)',
            color: 'var(--primary-dark)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#d4b59e';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--light-beige)';
          }}
        >
          🚪 登出
        </button>
      </div>

      {/* 筛选区域 */}
      <div className="filters-section">
        <h3 className="filters-title">🔍 篩選條件 (選擇後1秒自動搜索)</h3>
        <div className="filters-container">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="class_name">🏫 班級</label>
              <select
                id="class_name"
                value={filters.class_name}
                onChange={(e) => handleFilterChange('class_name', e.target.value)}
              >
                <option value="">全部班級</option>
                {classes.map((cls) => (
                  <option key={cls.class_name} value={cls.class_name}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="student_id">👤 學生</label>
              <select
                id="student_id"
                value={filters.student_id}
                onChange={(e) => handleFilterChange('student_id', e.target.value)}
              >
                <option value="">全部學生</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.class_name})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="date_from">📅 開始日期</label>
              <input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="date_to">📅 結束日期</label>
              <input
                id="date_to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-actions">
            {isAutoSearching && (
              <span style={{ 
                color: 'var(--primary-green)', 
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontWeight: '500'
              }}>
                ⏳ 搜索中
              </span>
            )}
            <button className="btn-reset" onClick={handleClearFilters}>
              🔄 清除篩選
            </button>
          </div>
        </div>
      </div>

      {/* 接送记录表格 */}
      <div className="records-section">
        <div className="records-header">
          <h3 className="records-title">
            📋 接送記錄 
            <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--primary-green)' }}>
              ({records.length} 筆記錄)
            </span>
          </h3>
          <div className="records-actions">
            <button 
              className="btn-filter" 
              onClick={() => setShowAddModal(true)}
            >
              ➕ 新增記錄
            </button>
            <button 
              className="btn-reset" 
              onClick={handleDeleteRecords}
              disabled={selectedRecords.size === 0}
            >
              🗑️ 刪除選中 ({selectedRecords.size})
            </button>
          </div>
        </div>
        
        {records.length === 0 ? (
          <div className="status-empty">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <div>沒有找到符合條件的記錄</div>
          </div>
        ) : (
          <table className="records-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedRecords.size === records.length && records.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>🆔 學生ID</th>
                <th>👤 姓名</th>
                <th>🏫 班級</th>
                <th>🤝 接送者</th>
                <th>⏰ 接送時間</th>
                <th>⚙️ 操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRecords.has(record.id)}
                      onChange={() => handleSelectRecord(record.id)}
                    />
                  </td>
                  <td>{record.student_id}</td>
                  <td>{record.student_name}</td>
                  <td>{record.class_name}</td>
                  <td>{record.picked_up_by || '未記錄'}</td>
                  <td>{record.picked_up_at}</td>
                  <td>
                    <button 
                      onClick={() => openEditModal(record)}
                      className="action-btn edit"
                    >
                      ✏️ 修改
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 新增记录模态框 */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">➕ 新增接送記錄</h3>
            <div className="modal-form">
              <div className="filter-group">
                <label>👤 學生</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                >
                  <option value="">請選擇學生</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.class_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>🤝 接送者</label>
                <input
                  type="text"
                  value={formData.picked_up_by}
                  onChange={(e) => setFormData({...formData, picked_up_by: e.target.value})}
                  placeholder="請輸入接送者姓名"
                />
              </div>
              <div className="filter-group">
                <label>⏰ 接送時間</label>
                <input
                  type="datetime-local"
                  value={formData.picked_up_at}
                  onChange={(e) => setFormData({...formData, picked_up_at: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-filter" onClick={handleAddRecord}>
                ✅ 確認新增
              </button>
              <button className="btn-reset" onClick={() => setShowAddModal(false)}>
                ❌ 取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改记录模态框 */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">✏️ 修改接送記錄</h3>
            <div className="modal-form">
              <div className="filter-group">
                <label>👤 學生</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                >
                  <option value="">請選擇學生</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.class_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>🤝 接送者</label>
                <input
                  type="text"
                  value={formData.picked_up_by}
                  onChange={(e) => setFormData({...formData, picked_up_by: e.target.value})}
                  placeholder="請輸入接送者姓名"
                />
              </div>
              <div className="filter-group">
                <label>⏰ 接送時間</label>
                <input
                  type="datetime-local"
                  value={formData.picked_up_at}
                  onChange={(e) => setFormData({...formData, picked_up_at: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-filter" onClick={handleEditRecord}>
                ✅ 確認修改
              </button>
              <button className="btn-reset" onClick={() => setShowEditModal(false)}>
                ❌ 取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
