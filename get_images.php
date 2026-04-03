<?php
header('Content-Type: application/json');

$dir = 'img/';
$files = [];

if (is_dir($dir)) {
    if ($dh = opendir($dir)) {
        while (($file = readdir($dh)) !== false) {
            if ($file != "." && $file != ".." && !is_dir($dir . $file)) {
                // Return only images
                if (preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file)) {
                    $files[] = $file;
                }
            }
        }
        closedir($dh);
    }
}

echo json_encode(['status' => 'success', 'images' => $files]);
?>
