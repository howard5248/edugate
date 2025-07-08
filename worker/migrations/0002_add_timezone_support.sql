-- 添加台湾时间支持
-- 由于 SQLite 不直接支持时区，我们在应用层处理时间转换

-- 更新现有记录的时间为台湾时间格式
UPDATE students SET created_at = datetime(created_at, '+8 hours') WHERE created_at IS NOT NULL;
UPDATE pickup_records SET picked_up_at = datetime(picked_up_at, '+8 hours') WHERE picked_up_at IS NOT NULL; 