<?php
header('Content-Type: application/json');

$code = $_GET['code'] ?? 'test-code';

$supabaseUrl = 'https://tfnsulqqfzkmefdhgoyi.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbnN1bHFxZnprbWVmZGhnb3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTUwNDEsImV4cCI6MjEwNDQ5MTA0MX0.ZkD3CtUJC51SoXSkMEPFh0WW8NHzV-MACezOH4Zk0Nw';

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
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

echo json_encode([
    'code' => $code,
    'httpCode' => $httpCode,
    'curlError' => $curlErr,
    'response' => $response,
    'decoded' => json_decode($response, true),
]);
?>
