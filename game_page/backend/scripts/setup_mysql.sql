-- Sky City MySQL Database Setup
-- 创建数据库和表结构

-- 创建数据库
CREATE DATABASE IF NOT EXISTS skycity 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE skycity;

-- 创建用户（可选）
-- CREATE USER 'skycity_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON skycity.* TO 'skycity_user'@'localhost';
-- FLUSH PRIVILEGES;

-- 创建排行榜表
CREATE TABLE IF NOT EXISTS rankings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    time INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(128),
    
    -- 索引
    INDEX idx_score_time (score DESC, time ASC),
    INDEX idx_created_at (created_at),
    INDEX idx_nickname (nickname),
    
    -- 约束
    CHECK (score >= 0),
    CHECK (time >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建游戏统计表
CREATE TABLE IF NOT EXISTS game_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stat_date DATE NOT NULL,
    total_games INT DEFAULT 0,
    total_players INT DEFAULT 0,
    average_score DECIMAL(10,2) DEFAULT 0,
    highest_score INT DEFAULT 0,
    average_time DECIMAL(10,2) DEFAULT 0,
    best_time INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建API日志表
CREATE TABLE IF NOT EXISTS api_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    request_data JSON,
    response_code INT,
    response_time DECIMAL(8,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_endpoint (endpoint),
    INDEX idx_created_at (created_at),
    INDEX idx_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建视图：排行榜视图
CREATE OR REPLACE VIEW ranking_view AS
SELECT 
    id,
    nickname,
    score,
    time,
    created_at,
    ROW_NUMBER() OVER (ORDER BY score DESC, time ASC) as rank,
    RANK() OVER (ORDER BY score DESC, time ASC) as tied_rank
FROM rankings
ORDER BY score DESC, time ASC;

-- 创建存储过程：获取用户排名
DELIMITER //
CREATE PROCEDURE GetUserRanking(IN user_id INT)
BEGIN
    SELECT 
        r.*,
        rv.rank,
        rv.tied_rank
    FROM rankings r
    JOIN ranking_view rv ON r.id = rv.id
    WHERE r.id = user_id;
END //
DELIMITER ;

-- 创建存储过程：获取排行榜
DELIMITER //
CREATE PROCEDURE GetRankings(IN page_num INT, IN page_size INT)
BEGIN
    DECLARE offset_val INT DEFAULT 0;
    SET offset_val = (page_num - 1) * page_size;
    
    SELECT 
        id,
        nickname,
        score,
        time,
        created_at,
        rank,
        tied_rank
    FROM ranking_view
    LIMIT page_size OFFSET offset_val;
    
    -- 返回总数
    SELECT COUNT(*) as total_count FROM rankings;
END //
DELIMITER ;

-- 创建存储过程：添加排名记录
DELIMITER //
CREATE PROCEDURE AddRanking(
    IN p_nickname VARCHAR(50),
    IN p_score INT,
    IN p_time INT,
    IN p_ip VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE new_id INT;
    DECLARE new_rank INT;
    
    -- 插入新记录
    INSERT INTO rankings (nickname, score, time, ip, user_agent)
    VALUES (p_nickname, p_score, p_time, p_ip, p_user_agent);
    
    SET new_id = LAST_INSERT_ID();
    
    -- 获取排名
    SELECT rank INTO new_rank
    FROM ranking_view
    WHERE id = new_id;
    
    -- 返回结果
    SELECT 
        id,
        nickname,
        score,
        time,
        created_at,
        new_rank as rank
    FROM rankings
    WHERE id = new_id;
END //
DELIMITER ;

-- 创建函数：计算游戏统计
DELIMITER //
CREATE FUNCTION CalculateAverageScore() RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE avg_score DECIMAL(10,2) DEFAULT 0;
    SELECT AVG(score) INTO avg_score FROM rankings;
    RETURN IFNULL(avg_score, 0);
END //
DELIMITER ;

-- 创建触发器：更新统计信息
DELIMITER //
CREATE TRIGGER update_stats_after_insert
AFTER INSERT ON rankings
FOR EACH ROW
BEGIN
    INSERT INTO game_stats (
        stat_date, 
        total_games, 
        total_players, 
        average_score, 
        highest_score, 
        average_time, 
        best_time
    )
    VALUES (
        CURDATE(),
        1,
        1,
        NEW.score,
        NEW.score,
        NEW.time,
        NEW.time
    )
    ON DUPLICATE KEY UPDATE
        total_games = total_games + 1,
        total_players = (SELECT COUNT(DISTINCT nickname) FROM rankings WHERE DATE(created_at) = CURDATE()),
        average_score = (SELECT AVG(score) FROM rankings WHERE DATE(created_at) = CURDATE()),
        highest_score = GREATEST(highest_score, NEW.score),
        average_time = (SELECT AVG(time) FROM rankings WHERE DATE(created_at) = CURDATE()),
        best_time = LEAST(best_time, NEW.time),
        updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- 插入示例数据
INSERT INTO rankings (nickname, score, time, ip) VALUES
('冠军玩家', 1500, 45, '127.0.0.1'),
('高手玩家', 1200, 30, '127.0.0.1'),
('新手玩家', 800, 20, '127.0.0.1'),
('专业玩家', 2000, 60, '127.0.0.1'),
('速度玩家', 1000, 15, '127.0.0.1');

-- 创建定期清理任务的事件（可选）
-- SET GLOBAL event_scheduler = ON;
-- 
-- DELIMITER //
-- CREATE EVENT IF NOT EXISTS cleanup_old_logs
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO
-- BEGIN
--     -- 删除30天前的API日志
--     DELETE FROM api_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
--     
--     -- 删除90天前的统计数据
--     DELETE FROM game_stats WHERE stat_date < DATE_SUB(CURDATE(), INTERVAL 90 DAY);
-- END //
-- DELIMITER ;

-- 显示创建的对象
SHOW TABLES;
SHOW PROCEDURE STATUS WHERE Db = 'skycity';
SHOW FUNCTION STATUS WHERE Db = 'skycity';

-- 测试查询
SELECT 'Database setup completed successfully!' as status;
SELECT * FROM ranking_view LIMIT 5;
