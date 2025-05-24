<?php
/**
 * Sky City Ranking API v2
 * 使用数据库抽象层的新版本API
 */

require_once '../../config/database.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 初始化数据库
try {
    $dbConfig = require '../../config/database.php';
    $db = DatabaseFactory::create($dbConfig);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database initialization failed: ' . $e->getMessage()]);
    exit();
}

// 输入验证函数
function validateInput($data) {
    $errors = [];
    
    if (!isset($data['name']) || empty(trim($data['name']))) {
        $errors[] = 'Name is required';
    } elseif (strlen(trim($data['name'])) > 50) {
        $errors[] = 'Name too long (max 50 characters)';
    }
    
    if (!isset($data['score']) || !is_numeric($data['score']) || $data['score'] < 0) {
        $errors[] = 'Valid score is required';
    } elseif ($data['score'] > 999999999) {
        $errors[] = 'Score too high';
    }
    
    if (!isset($data['time']) || !is_numeric($data['time']) || $data['time'] < 0) {
        $errors[] = 'Valid time is required';
    } elseif ($data['time'] > 86400) {
        $errors[] = 'Time too long (max 24 hours)';
    }
    
    return $errors;
}

// 错误响应函数
function errorResponse($code, $message, $details = null) {
    http_response_code($code);
    $response = ['error' => $message];
    if ($details) {
        $response['details'] = $details;
    }
    echo json_encode($response);
    exit();
}

// 成功响应函数
function successResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// 处理GET请求
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        // 检查是否请求统计信息
        if (isset($_GET['action']) && $_GET['action'] === 'stats') {
            $stats = $db->getStats();
            successResponse($stats);
        }
        
        // 获取分页参数
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 50;
        
        // 获取排行榜数据
        $result = $db->getRankings($page, $limit);
        successResponse($result);
        
    } catch (Exception $e) {
        errorResponse(500, 'Failed to retrieve rankings', $e->getMessage());
    }
}

// 处理POST请求
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        // 解析输入
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, true);
        
        if ($input === null) {
            errorResponse(400, 'Invalid JSON input');
        }
        
        // 验证输入
        $errors = validateInput($input);
        if (!empty($errors)) {
            errorResponse(400, 'Validation failed', $errors);
        }
        
        // 准备数据
        $data = [
            'nickname' => htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8'),
            'score' => intval($input['score']),
            'time' => intval($input['time']),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        // 添加到数据库
        $result = $db->addRanking($data);
        
        if ($result) {
            successResponse([
                'success' => true,
                'rank' => $result['rank'],
                'nickname' => $result['nickname'],
                'score' => $result['score'],
                'time' => $result['time'],
                'id' => $result['id']
            ], 201);
        } else {
            errorResponse(500, 'Failed to save ranking');
        }
        
    } catch (Exception $e) {
        errorResponse(500, 'Failed to add ranking', $e->getMessage());
    }
}

// 处理DELETE请求（管理功能）
if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
    // 这里可以添加管理员删除记录的功能
    // 需要添加认证机制
    errorResponse(501, 'Delete operation not implemented');
}

// 处理不支持的方法
errorResponse(405, 'Method Not Allowed');

?>
