<?php
/**
 * Sky City Ranking API - Improved Version
 * 改进的排行榜API，增加了更好的错误处理、数据验证和性能优化
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// 配置
$config = [
    'dataFile' => 'ranking_data.json',
    'backupFile' => 'ranking_data_backup.json',
    'maxRecords' => 1000,  // 最大记录数
    'maxNameLength' => 50, // 最大昵称长度
    'maxScore' => 999999999, // 最大分数
    'maxTime' => 86400,    // 最大时间（24小时）
    'enableBackup' => true,
    'enableLogging' => true,
    'logFile' => 'api.log'
];

// 日志函数
function logMessage($message, $level = 'INFO') {
    global $config;
    if (!$config['enableLogging']) return;
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    file_put_contents($config['logFile'], $logEntry, FILE_APPEND | LOCK_EX);
}

// Handle OPTIONS preflight request (for CORS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 数据验证函数
function validateRankingEntry($data) {
    global $config;
    
    if (!is_array($data)) {
        return ['valid' => false, 'error' => 'Data must be an array'];
    }
    
    // 检查必需字段
    $requiredFields = ['name', 'score', 'time'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            return ['valid' => false, 'error' => "Missing required field: $field"];
        }
    }
    
    // 验证昵称
    $name = trim($data['name']);
    if (empty($name)) {
        return ['valid' => false, 'error' => 'Name cannot be empty'];
    }
    if (strlen($name) > $config['maxNameLength']) {
        return ['valid' => false, 'error' => 'Name too long'];
    }
    
    // 验证分数
    if (!is_numeric($data['score']) || $data['score'] < 0) {
        return ['valid' => false, 'error' => 'Invalid score'];
    }
    if ($data['score'] > $config['maxScore']) {
        return ['valid' => false, 'error' => 'Score too high'];
    }
    
    // 验证时间
    if (!is_numeric($data['time']) || $data['time'] < 0) {
        return ['valid' => false, 'error' => 'Invalid time'];
    }
    if ($data['time'] > $config['maxTime']) {
        return ['valid' => false, 'error' => 'Time too long'];
    }
    
    return ['valid' => true];
}

// 创建备份
function createBackup($dataFile, $backupFile) {
    if (file_exists($dataFile)) {
        copy($dataFile, $backupFile);
        logMessage("Backup created: $backupFile");
    }
}

// 读取排行榜数据
function getRankingData($filePath) {
    global $config;
    
    if (!file_exists($filePath)) {
        // 创建空文件
        file_put_contents($filePath, json_encode([]));
        logMessage("Created new ranking data file: $filePath");
        return [];
    }
    
    $jsonData = file_get_contents($filePath);
    if ($jsonData === false) {
        logMessage("Failed to read file: $filePath", 'ERROR');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read ranking data file']);
        exit();
    }
    
    if (trim($jsonData) === '') {
        return [];
    }
    
    $data = json_decode($jsonData, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        logMessage("JSON decode error: " . json_last_error_msg(), 'ERROR');
        http_response_code(500);
        echo json_encode(['error' => 'Invalid JSON in ranking data file']);
        exit();
    }
    
    return is_array($data) ? $data : [];
}

// 保存排行榜数据
function saveRankingData($filePath, $data) {
    global $config;
    
    // 创建备份
    if ($config['enableBackup']) {
        createBackup($filePath, $config['backupFile']);
    }
    
    // 限制记录数量
    if (count($data) > $config['maxRecords']) {
        // 按分数排序后只保留前N条记录
        usort($data, function ($a, $b) {
            if ($a['score'] != $b['score']) {
                return $b['score'] - $a['score'];
            }
            return $a['time'] - $b['time']; // 时间越短越好
        });
        $data = array_slice($data, 0, $config['maxRecords']);
        logMessage("Trimmed data to {$config['maxRecords']} records");
    }
    
    // 排序：分数降序，时间升序（时间越短越好）
    usort($data, function ($a, $b) {
        if ($a['score'] != $b['score']) {
            return $b['score'] - $a['score'];
        }
        return $a['time'] - $b['time'];
    });
    
    // 分配排名
    foreach ($data as $index => &$entry) {
        $entry['rank'] = $index + 1;
        $entry['updated_at'] = date('Y-m-d H:i:s');
    }
    unset($entry);
    
    $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($jsonData === false) {
        logMessage("JSON encode error", 'ERROR');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to encode ranking data']);
        exit();
    }
    
    // 原子写入
    if (file_put_contents($filePath, $jsonData, LOCK_EX) === false) {
        logMessage("Failed to write file: $filePath", 'ERROR');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write ranking data file']);
        exit();
    }
    
    logMessage("Ranking data saved successfully");
}

// 获取统计信息
function getRankingStats($data) {
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

// 处理GET请求
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $rankings = getRankingData($config['dataFile']);
    
    // 检查是否请求统计信息
    if (isset($_GET['stats']) && $_GET['stats'] === 'true') {
        $stats = getRankingStats($rankings);
        echo json_encode($stats);
        exit();
    }
    
    // 支持分页
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 50;
    $offset = ($page - 1) * $limit;
    
    $total = count($rankings);
    $paginatedRankings = array_slice($rankings, $offset, $limit);
    
    $response = [
        'data' => $paginatedRankings,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ];
    
    echo json_encode($response);
    logMessage("GET request served: page $page, limit $limit");
    exit();
}

// 处理POST请求
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, true);
    
    // 验证输入
    $validation = validateRankingEntry($input);
    if (!$validation['valid']) {
        logMessage("Validation failed: " . $validation['error'], 'WARN');
        http_response_code(400);
        echo json_encode(['error' => $validation['error']]);
        exit();
    }
    
    $rankings = getRankingData($config['dataFile']);
    
    // 准备新记录
    $newEntry = [
        'id' => count($rankings) > 0 ? max(array_column($rankings, 'id')) + 1 : 1,
        'nickname' => htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8'),
        'score' => intval($input['score']),
        'time' => intval($input['time']),
        'created_at' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    // 添加新记录
    $rankings[] = $newEntry;
    
    // 保存数据
    saveRankingData($config['dataFile'], $rankings);
    
    // 获取新排名
    $updatedRankings = getRankingData($config['dataFile']);
    $newRank = -1;
    foreach ($updatedRankings as $entry) {
        if ($entry['id'] === $newEntry['id']) {
            $newRank = $entry['rank'];
            break;
        }
    }
    
    logMessage("New score added: {$newEntry['nickname']} - Score: {$newEntry['score']}, Rank: $newRank");
    
    // 返回响应
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'rank' => $newRank,
        'nickname' => $newEntry['nickname'],
        'score' => $newEntry['score'],
        'time' => $newEntry['time'],
        'total_players' => count($updatedRankings)
    ]);
    exit();
}

// 处理不支持的方法
logMessage("Unsupported method: " . $_SERVER['REQUEST_METHOD'], 'WARN');
http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
exit();

?>
