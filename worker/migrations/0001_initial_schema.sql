DROP TABLE IF EXISTS pickup_records;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
  id TEXT PRIMARY KEY,      -- 學生證/條碼編號 (e.g., "S001")
  name TEXT NOT NULL,       -- 學生姓名
  class_name TEXT,          -- 班級名稱 (e.g., "一年一班")
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pickup_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- 記錄流水號
  student_id TEXT NOT NULL,             -- 對應的學生 ID
  picked_up_by TEXT,                    -- 接送者 (可選)
  picked_up_at TEXT DEFAULT CURRENT_TIMESTAMP, -- 接送時間
  FOREIGN KEY (student_id) REFERENCES students(id)
);

