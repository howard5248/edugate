import { Hono } from 'hono';

// Define the environment bindings
export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
}

// 获取当前本地时间字符串 (直接使用本地时间)
function getLocalTimeString(): string {
  const now = new Date();
  // 直接使用本地时间，格式化为 YYYY-MM-DD HH:MM:SS
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 格式化时间显示 (直接格式化，不做时区转换)
function formatLocalTime(dateString: string): string {
  if (!dateString) return '';
  
  // 解析数据库中的时间字符串
  const date = new Date(dateString);
  
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

const app = new Hono<{ Bindings: Env }>();

// API endpoint to get a student by ID
app.get('/api/students/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const stmt = c.env.DB.prepare('SELECT * FROM students WHERE id = ?');
    const result = await stmt.bind(id).first();

    if (result) {
      // 格式化时间显示
      const formattedResult = {
        ...result,
        created_at: formatLocalTime(result.created_at as string)
      };
      return c.json(formattedResult);
    } else {
      return c.json({ error: 'Student not found' }, 404);
    }
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to create a new pickup record
app.post('/api/records', async (c) => {
  const { student_id, picked_up_by } = await c.req.json();

  if (!student_id) {
    return c.json({ error: 'Missing student_id' }, 400);
  }

  try {
    const localTime = getLocalTimeString();
    const stmt = c.env.DB.prepare(
      'INSERT INTO pickup_records (student_id, picked_up_by, picked_up_at) VALUES (?, ?, ?)'
    );
    await stmt.bind(student_id, picked_up_by || null, localTime).run();
    return c.json({ success: true, picked_up_at: formatLocalTime(localTime) }, 201);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to get all pickup records (with optional filtering)
app.get('/api/records', async (c) => {
  const { student_id, date } = c.req.query();

  try {
    let query = 'SELECT * FROM pickup_records';
    const params = [];

    if (student_id) {
      query += ' WHERE student_id = ?';
      params.push(student_id);
    }

    if (date) {
      query += `${student_id ? ' AND' : ' WHERE'} date(picked_up_at) = ?`;
      params.push(date);
    }

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();
    
    // 格式化时间显示
    const formattedResults = results.map(record => ({
      ...record,
      picked_up_at: formatLocalTime(record.picked_up_at as string)
    }));
    
    return c.json(formattedResults);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to verify admin password
app.post('/api/admin/verify-password', async (c) => {
  try {
    const { password } = await c.req.json();
    
    if (!password) {
      return c.json({ error: 'Missing password' }, 400);
    }
    
    const isValid = password === c.env.ADMIN_PASSWORD;
    
    if (isValid) {
      return c.json({ success: true });
    } else {
      return c.json({ error: 'Invalid password' }, 401);
    }
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to get class list for admin filters
app.get('/api/admin/classes', async (c) => {
  try {
    const stmt = c.env.DB.prepare('SELECT DISTINCT class_name FROM students WHERE class_name IS NOT NULL ORDER BY class_name');
    const { results } = await stmt.all();
    return c.json(results);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to get student list for admin filters
app.get('/api/admin/students', async (c) => {
  try {
    const stmt = c.env.DB.prepare('SELECT id, name, class_name FROM students ORDER BY class_name, name');
    const { results } = await stmt.all();
    return c.json(results);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to get pickup records with student info for admin dashboard
app.get('/api/admin/records', async (c) => {
  const { class_name, student_id, date_from, date_to } = c.req.query();

  try {
    let query = `
      SELECT 
        pr.id,
        pr.student_id,
        pr.picked_up_by,
        pr.picked_up_at,
        s.name as student_name,
        s.class_name
      FROM pickup_records pr
      JOIN students s ON pr.student_id = s.id
    `;
    
    const params = [];
    const conditions = [];

    if (class_name) {
      conditions.push('s.class_name = ?');
      params.push(class_name);
    }

    if (student_id) {
      conditions.push('pr.student_id = ?');
      params.push(student_id);
    }

    if (date_from) {
      conditions.push('date(pr.picked_up_at) >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('date(pr.picked_up_at) <= ?');
      params.push(date_to);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY pr.picked_up_at DESC';

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();
    
    // 格式化时间显示
    const formattedResults = results.map(record => ({
      ...record,
      picked_up_at: formatLocalTime(record.picked_up_at as string)
    }));
    
    return c.json(formattedResults);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to get pickup stats
app.get('/api/stats', async (c) => {
  try {
    const stmt = c.env.DB.prepare(
      'SELECT date(picked_up_at) as date, COUNT(*) as count FROM pickup_records GROUP BY date(picked_up_at)'
    );
    const { results } = await stmt.all();
    
    // 格式化统计结果的日期
    const formattedResults = results.map(stat => ({
      ...stat,
      date: stat.date // 这里是日期，不需要时间部分
    }));
    
    return c.json(formattedResults);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to add a new pickup record (admin only)
app.post('/api/admin/records', async (c) => {
  try {
    const { student_id, picked_up_by, picked_up_at } = await c.req.json();

    if (!student_id) {
      return c.json({ error: 'Missing student_id' }, 400);
    }

    // 验证学生是否存在
    const studentCheck = c.env.DB.prepare('SELECT id FROM students WHERE id = ?');
    const student = await studentCheck.bind(student_id).first();
    
    if (!student) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // 如果没有提供时间，使用当前时间
    const pickupTime = picked_up_at || getLocalTimeString();

    const stmt = c.env.DB.prepare(
      'INSERT INTO pickup_records (student_id, picked_up_by, picked_up_at) VALUES (?, ?, ?)'
    );
    const result = await stmt.bind(student_id, picked_up_by || null, pickupTime).run();
    
    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      picked_up_at: formatLocalTime(pickupTime) 
    }, 201);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to update a pickup record (admin only)
app.put('/api/admin/records/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const { student_id, picked_up_by, picked_up_at } = await c.req.json();

    if (!student_id) {
      return c.json({ error: 'Missing student_id' }, 400);
    }

    // 验证记录是否存在
    const recordCheck = c.env.DB.prepare('SELECT id FROM pickup_records WHERE id = ?');
    const record = await recordCheck.bind(id).first();
    
    if (!record) {
      return c.json({ error: 'Record not found' }, 404);
    }

    // 验证学生是否存在
    const studentCheck = c.env.DB.prepare('SELECT id FROM students WHERE id = ?');
    const student = await studentCheck.bind(student_id).first();
    
    if (!student) {
      return c.json({ error: 'Student not found' }, 404);
    }

    const stmt = c.env.DB.prepare(
      'UPDATE pickup_records SET student_id = ?, picked_up_by = ?, picked_up_at = ? WHERE id = ?'
    );
    await stmt.bind(student_id, picked_up_by || null, picked_up_at, id).run();
    
    return c.json({ 
      success: true,
      picked_up_at: formatLocalTime(picked_up_at) 
    });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// API endpoint to delete pickup records (admin only)
app.delete('/api/admin/records', async (c) => {
  try {
    const { ids } = await c.req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Missing or invalid ids' }, 400);
    }

    // 构建 SQL 语句
    const placeholders = ids.map(() => '?').join(',');
    const stmt = c.env.DB.prepare(`DELETE FROM pickup_records WHERE id IN (${placeholders})`);
    const result = await stmt.bind(...ids).run();
    
    return c.json({ 
      success: true, 
      deleted_count: result.meta.changes 
    });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

export default app;