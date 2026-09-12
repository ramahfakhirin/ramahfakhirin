<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$code = isset($_GET['code']) ? trim($_GET['code']) : null;

if (!$code) {
    http_response_code(400);
    echo json_encode(['error' => 'Code tidak ditemukan', 'debug' => $_GET]);
    exit;
}

try {
    error_log("Shortlink redirect: code=$code");
    $supabaseUrl = 'https://tfnsulqqfzkmefdhgoyi.supabase.co';
    $supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbnN1bHFxZnprbWVmZGhnb3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTUwNDEsImV4cCI6MjEwNDQ5MTA0MX0.ZkD3CtUJC51SoXSkMEPFh0WW8NHzV-MACezOH4Zk0Nw';

    if (!$supabaseUrl || !$supabaseKey) {
        throw new Exception('Konfigurasi Supabase tidak lengkap');
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/shortlinks?code=eq.$code&select=full_url,clicks");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json',
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $response = curl_exec($ch);
    $curlErr = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlErr) {
        http_response_code(500);
        echo json_encode(['error' => 'Curl error: ' . $curlErr]);
        exit;
    }

    if ($httpCode !== 200) {
        http_response_code(404);
        echo json_encode(['error' => 'Shortlink tidak ditemukan (HTTP ' . $httpCode . ')']);
        exit;
    }

    $data = json_decode($response, true);

    if (!is_array($data) || empty($data)) {
        http_response_code(404);
        echo json_encode(['error' => 'Shortlink tidak ditemukan']);
        exit;
    }

    $item = $data[0];
    $fullUrl = $item['full_url'] ?? null;
    $currentClicks = $item['clicks'] ?? 0;

    if (!$fullUrl) {
        http_response_code(500);
        echo json_encode(['error' => 'URL tidak valid']);
        exit;
    }

    $newClicks = $currentClicks + 1;

    $ch2 = curl_init();
    curl_setopt($ch2, CURLOPT_URL, "$supabaseUrl/rest/v1/shortlinks?code=eq.$code");
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json',
        'Prefer: return=minimal',
    ]);
    curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode(['clicks' => $newClicks]));
    curl_setopt($ch2, CURLOPT_TIMEOUT, 2);
    curl_setopt($ch2, CURLOPT_CONNECTTIMEOUT, 1);
    
    curl_exec($ch2);
    curl_close($ch2);

    header("Location: $fullUrl", true, 301);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    $errorMsg = $e->getMessage();
    error_log("Shortlink error: $errorMsg");
    echo json_encode(['error' => $errorMsg, 'trace' => $e->getTraceAsString()]);
    exit;
}
?>

