<?php
/**
 * Sky City Database Configuration
 * 数据库配置文件 - 支持多种数据库类型
 */

// 数据库配置
$dbConfig = [
    // 当前使用的数据库类型: 'file', 'sqlite', 'mysql'
    'type' => 'file',
    
    // 文件数据库配置
    'file' => [
        'data_dir' => __DIR__ . '/../data/',
        'ranking_file' => 'ranking_data.json',
        'backup_file' => 'ranking_data_backup.json',
        'log_file' => 'api.log',
        'max_records' => 1000,
        'enable_backup' => true,
        'enable_logging' => true
    ],
    
    // SQLite配置
    'sqlite' => [
        'database' => __DIR__ . '/../data/skycity.db',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    ],
    
    // MySQL配置
    'mysql' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'skycity',
        'username' => 'skycity_user',
        'password' => 'your_password_here',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    ]
];

// 数据库抽象类
abstract class Database {
    protected $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    abstract public function getRankings($page = 1, $limit = 50);
    abstract public function addRanking($data);
    abstract public function getStats();
    abstract public function cleanup();
}

// 文件数据库实现
class FileDatabase extends Database {
    private $dataFile;
    private $backupFile;
    private $logFile;
    
    public function __construct($config) {
        parent::__construct($config);
        
        $dataDir = $this->config['data_dir'];
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }
        
        $this->dataFile = $dataDir . $this->config['ranking_file'];
        $this->backupFile = $dataDir . $this->config['backup_file'];
        $this->logFile = $dataDir . $this->config['log_file'];
    }
    
    private function log($message, $level = 'INFO') {
        if (!$this->config['enable_logging']) return;
        
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    private function readData() {
        if (!file_exists($this->dataFile)) {
            file_put_contents($this->dataFile, json_encode([]));
            return [];
        }
        
        $jsonData = file_get_contents($this->dataFile);
        if ($jsonData === false) {
            throw new Exception('Failed to read data file');
        }
        
        if (trim($jsonData) === '') {
            return [];
        }
        
        $data = json_decode($jsonData, true);
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON in data file: ' . json_last_error_msg());
        }
        
        return is_array($data) ? $data : [];
    }
    
    private function writeData($data) {
        if ($this->config['enable_backup'] && file_exists($this->dataFile)) {
            copy($this->dataFile, $this->backupFile);
        }
        
        // 排序和排名
        usort($data, function ($a, $b) {
            if ($a['score'] != $b['score']) {
                return $b['score'] - $a['score'];
            }
            return $a['time'] - $b['time'];
        });
        
        foreach ($data as $index => &$entry) {
            $entry['rank'] = $index + 1;
        }
        unset($entry);
        
        $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if (file_put_contents($this->dataFile, $jsonData, LOCK_EX) === false) {
            throw new Exception('Failed to write data file');
        }
        
        $this->log('Data saved successfully');
    }
    
    public function getRankings($page = 1, $limit = 50) {
        $data = $this->readData();
        $total = count($data);
        $offset = ($page - 1) * $limit;
        
        return [
            'data' => array_slice($data, $offset, $limit),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ];
    }
    
    public function addRanking($data) {
        $rankings = $this->readData();
        
        $newEntry = [
            'id' => count($rankings) > 0 ? max(array_column($rankings, 'id')) + 1 : 1,
            'nickname' => $data['nickname'],
            'score' => $data['score'],
            'time' => $data['time'],
            'created_at' => date('Y-m-d H:i:s'),
            'ip' => $data['ip'] ?? 'unknown'
        ];
        
        $rankings[] = $newEntry;
        
        // 限制记录数量
        if (count($rankings) > $this->config['max_records']) {
            usort($rankings, function ($a, $b) {
                if ($a['score'] != $b['score']) {
                    return $b['score'] - $a['score'];
                }
                return $a['time'] - $b['time'];
            });
            $rankings = array_slice($rankings, 0, $this->config['max_records']);
        }
        
        $this->writeData($rankings);
        
        // 返回新排名
        $updatedRankings = $this->readData();
        foreach ($updatedRankings as $entry) {
            if ($entry['id'] === $newEntry['id']) {
                return $entry;
            }
        }
        
        return null;
    }
    
    public function getStats() {
        $data = $this->readData();
        
        if (empty($data)) {
            return [
                'total_players' => 0,
                'highest_score' => 0,
                'lowest_score' => 0,
                'average_score' => 0,
                'best_time' => 0,
                'average_time' => 0
            ];
        }
        
        $scores = array_column($data, 'score');
        $times = array_column($data, 'time');
        
        return [
            'total_players' => count($data),
            'highest_score' => max($scores),
            'lowest_score' => min($scores),
            'average_score' => round(array_sum($scores) / count($scores), 2),
            'best_time' => min($times),
            'average_time' => round(array_sum($times) / count($times), 2)
        ];
    }
    
    public function cleanup() {
        // 清理旧日志文件
        if (file_exists($this->logFile) && filesize($this->logFile) > 10 * 1024 * 1024) { // 10MB
            $lines = file($this->logFile);
            $recentLines = array_slice($lines, -1000); // 保留最近1000行
            file_put_contents($this->logFile, implode('', $recentLines));
            $this->log('Log file cleaned up');
        }
    }
}

// SQLite数据库实现
class SQLiteDatabase extends Database {
    private $pdo;
    
    public function __construct($config) {
        parent::__construct($config);
        $this->connect();
        $this->createTables();
    }
    
    private function connect() {
        $dsn = 'sqlite:' . $this->config['database'];
        $this->pdo = new PDO($dsn, null, null, $this->config['options']);
    }
    
    private function createTables() {
        $sql = "
            CREATE TABLE IF NOT EXISTS rankings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nickname TEXT NOT NULL,
                score INTEGER NOT NULL,
                time INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_score_time ON rankings(score DESC, time ASC);
        ";
        
        $this->pdo->exec($sql);
    }
    
    public function getRankings($page = 1, $limit = 50) {
        $offset = ($page - 1) * $limit;
        
        // 获取排名数据
        $sql = "
            SELECT 
                id, nickname, score, time, created_at,
                ROW_NUMBER() OVER (ORDER BY score DESC, time ASC) as rank
            FROM rankings 
            ORDER BY score DESC, time ASC 
            LIMIT :limit OFFSET :offset
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll();
        
        // 获取总数
        $countStmt = $this->pdo->query("SELECT COUNT(*) FROM rankings");
        $total = $countStmt->fetchColumn();
        
        return [
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ];
    }
    
    public function addRanking($data) {
        $sql = "INSERT INTO rankings (nickname, score, time, ip) VALUES (?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['nickname'],
            $data['score'],
            $data['time'],
            $data['ip'] ?? null
        ]);
        
        $id = $this->pdo->lastInsertId();
        
        // 获取排名
        $rankSql = "
            SELECT 
                id, nickname, score, time, created_at,
                (SELECT COUNT(*) FROM rankings r2 
                 WHERE r2.score > r1.score 
                    OR (r2.score = r1.score AND r2.time < r1.time)
                    OR (r2.score = r1.score AND r2.time = r1.time AND r2.id < r1.id)
                ) + 1 as rank
            FROM rankings r1 
            WHERE id = ?
        ";
        
        $rankStmt = $this->pdo->prepare($rankSql);
        $rankStmt->execute([$id]);
        
        return $rankStmt->fetch();
    }
    
    public function getStats() {
        $sql = "
            SELECT 
                COUNT(*) as total_players,
                MAX(score) as highest_score,
                MIN(score) as lowest_score,
                AVG(score) as average_score,
                MIN(time) as best_time,
                AVG(time) as average_time
            FROM rankings
        ";
        
        $stmt = $this->pdo->query($sql);
        return $stmt->fetch();
    }
    
    public function cleanup() {
        // 清理超过限制的记录
        $maxRecords = 10000;
        $sql = "
            DELETE FROM rankings 
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM rankings 
                    ORDER BY score DESC, time ASC 
                    LIMIT $maxRecords
                ) tmp
            )
        ";
        $this->pdo->exec($sql);
    }
}

// 数据库工厂
class DatabaseFactory {
    public static function create($config) {
        switch ($config['type']) {
            case 'file':
                return new FileDatabase($config['file']);
            case 'sqlite':
                return new SQLiteDatabase($config['sqlite']);
            case 'mysql':
                // MySQL实现可以类似SQLite实现
                throw new Exception('MySQL implementation not yet available');
            default:
                throw new Exception('Unsupported database type: ' . $config['type']);
        }
    }
}

// 导出配置
return $dbConfig;

?>
