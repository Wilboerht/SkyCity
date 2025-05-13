<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$dataFile = 'ranking_data.json';

// Handle OPTIONS preflight request (for CORS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Function to read ranking data from file
function getRankingData($filePath) {
    if (!file_exists($filePath)) {
        // Create the file with an empty array if it doesn't exist
        file_put_contents($filePath, json_encode([]));
        return [];
    }
    $jsonData = file_get_contents($filePath);
    if ($jsonData === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read ranking data file']);
        exit();
    }
    $data = json_decode($jsonData, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        // Handle potential empty file or invalid JSON
        if (trim($jsonData) === '') return []; // Return empty if file is empty
        http_response_code(500);
        echo json_encode(['error' => 'Invalid JSON in ranking data file', 'json_error' => json_last_error_msg()]);
        exit();
    }
    return is_array($data) ? $data : [];
}

// Function to save ranking data to file
function saveRankingData($filePath, $data) {
    // Sort data before saving: score descending, time descending
    usort($data, function ($a, $b) {
        if ($a['score'] != $b['score']) {
            return $b['score'] - $a['score'];
        }
        return $b['time'] - $a['time'];
    });

    // Assign ranks
    foreach ($data as $index => &$entry) {
        $entry['rank'] = $index + 1;
    }
    unset($entry); // Unset reference

    $jsonData = json_encode($data, JSON_PRETTY_PRINT);
    if ($jsonData === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to encode ranking data']);
        exit();
    }
    // Use LOCK_EX for atomic write
    if (file_put_contents($filePath, $jsonData, LOCK_EX) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write ranking data file']);
        exit();
    }
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $rankings = getRankingData($dataFile);
    // Data is already sorted and ranked when saved, but re-sort just in case
     usort($rankings, function ($a, $b) {
        if ($a['score'] != $b['score']) {
            return $b['score'] - $a['score'];
        }
        return $b['time'] - $a['time'];
    });
    foreach ($rankings as $index => &$entry) {
        $entry['rank'] = $index + 1;
    }
     unset($entry);

    echo json_encode($rankings);
    exit();
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, true);

    // Validate input
    if ($input === null || !isset($input['name']) || !isset($input['score']) || !isset($input['time']) || !is_numeric($input['score']) || !is_numeric($input['time'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input data']);
        exit();
    }

    $rankings = getRankingData($dataFile);

    // Prepare new entry
    $newEntry = [
        // Generate a simple ID (could be improved)
        'id' => count($rankings) > 0 ? max(array_column($rankings, 'id')) + 1 : 1,
        'nickname' => filter_var($input['name'], FILTER_SANITIZE_STRING),
        'score' => intval($input['score']),
        'time' => intval($input['time']),
        'rank' => 0 // Rank will be assigned by saveRankingData
    ];

    // Add new entry
    $rankings[] = $newEntry;

    // Save updated data (this also sorts and assigns ranks)
    saveRankingData($dataFile, $rankings);

    // Find the rank of the newly added entry
    $newRank = -1;
    $updatedRankings = getRankingData($dataFile); // Read again to get final ranks
    foreach ($updatedRankings as $entry) {
        if ($entry['id'] === $newEntry['id']) {
            $newRank = $entry['rank'];
            break;
        }
    }

    // Return success response according to spec
    http_response_code(200);
    echo json_encode([
        'rank' => $newRank,
        'nickname' => $newEntry['nickname']
    ]);
    exit();
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
exit();

?> 