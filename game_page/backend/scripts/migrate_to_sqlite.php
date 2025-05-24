<?php
/**
 * Sky City Database Migration Script
 * 将JSON文件数据迁移到SQLite数据库
 */

require_once '../config/database.php';

echo "Sky City Database Migration Tool\n";
echo "================================\n\n";

// 配置
$jsonFile = '../api/v1/ranking_data.json';
$sqliteFile = '../data/skycity.db';

// 创建数据目录
$dataDir = dirname($sqliteFile);
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
    echo "Created data directory: $dataDir\n";
}

try {
    // 连接SQLite数据库
    $pdo = new PDO('sqlite:' . $sqliteFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to SQLite database: $sqliteFile\n";
    
    // 创建表结构
    $createTableSQL = "
        CREATE TABLE IF NOT EXISTS rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL,
            score INTEGER NOT NULL,
            time INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip TEXT,
            migrated_from_json BOOLEAN DEFAULT 1
        );
        
        CREATE INDEX IF NOT EXISTS idx_score_time ON rankings(score DESC, time ASC);
        CREATE INDEX IF NOT EXISTS idx_created_at ON rankings(created_at);
    ";
    
    $pdo->exec($createTableSQL);
    echo "Database tables created successfully\n";
    
    // 读取JSON数据
    if (!file_exists($jsonFile)) {
        echo "JSON file not found: $jsonFile\n";
        echo "Creating empty database...\n";
        exit(0);
    }
    
    $jsonData = file_get_contents($jsonFile);
    $data = json_decode($jsonData, true);
    
    if ($data === null) {
        echo "Error: Invalid JSON data\n";
        exit(1);
    }
    
    echo "Found " . count($data) . " records in JSON file\n";
    
    // 检查是否已有数据
    $countStmt = $pdo->query("SELECT COUNT(*) FROM rankings");
    $existingCount = $countStmt->fetchColumn();
    
    if ($existingCount > 0) {
        echo "Warning: Database already contains $existingCount records\n";
        echo "Do you want to continue? This will add new records. (y/N): ";
        $handle = fopen("php://stdin", "r");
        $line = fgets($handle);
        if (trim($line) !== 'y' && trim($line) !== 'Y') {
            echo "Migration cancelled\n";
            exit(0);
        }
        fclose($handle);
    }
    
    // 准备插入语句
    $insertSQL = "
        INSERT INTO rankings (nickname, score, time, created_at, migrated_from_json) 
        VALUES (?, ?, ?, ?, 1)
    ";
    $stmt = $pdo->prepare($insertSQL);
    
    // 开始事务
    $pdo->beginTransaction();
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($data as $record) {
        try {
            // 验证数据
            if (!isset($record['nickname']) || !isset($record['score']) || !isset($record['time'])) {
                echo "Skipping invalid record: " . json_encode($record) . "\n";
                $errorCount++;
                continue;
            }
            
            // 设置创建时间
            $createdAt = isset($record['created_at']) ? $record['created_at'] : date('Y-m-d H:i:s');
            
            // 插入记录
            $stmt->execute([
                $record['nickname'],
                intval($record['score']),
                intval($record['time']),
                $createdAt
            ]);
            
            $successCount++;
            
        } catch (Exception $e) {
            echo "Error inserting record: " . $e->getMessage() . "\n";
            $errorCount++;
        }
    }
    
    // 提交事务
    $pdo->commit();
    
    echo "\nMigration completed:\n";
    echo "- Successfully migrated: $successCount records\n";
    echo "- Errors: $errorCount records\n";
    
    // 验证迁移结果
    $finalCountStmt = $pdo->query("SELECT COUNT(*) FROM rankings");
    $finalCount = $finalCountStmt->fetchColumn();
    echo "- Total records in database: $finalCount\n";
    
    // 显示前几条记录
    echo "\nTop 5 records after migration:\n";
    $topRecordsStmt = $pdo->query("
        SELECT 
            nickname, score, time, created_at,
            ROW_NUMBER() OVER (ORDER BY score DESC, time ASC) as rank
        FROM rankings 
        ORDER BY score DESC, time ASC 
        LIMIT 5
    ");
    
    $topRecords = $topRecordsStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($topRecords as $record) {
        echo sprintf(
            "%d. %s - Score: %d, Time: %ds (%s)\n",
            $record['rank'],
            $record['nickname'],
            $record['score'],
            $record['time'],
            $record['created_at']
        );
    }
    
    // 创建备份
    $backupFile = $jsonFile . '.backup.' . date('Y-m-d-H-i-s');
    copy($jsonFile, $backupFile);
    echo "\nJSON file backed up to: $backupFile\n";
    
    echo "\nMigration completed successfully!\n";
    echo "You can now update your database configuration to use SQLite.\n";
    
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

?>
