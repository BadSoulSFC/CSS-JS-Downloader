<?php

function save_css_files($url, $ignore_external) {
  // Getting the HTML content of the URL
  $html = file_get_contents($url);
  
  // Using regular expressions to extract all CSS files
  preg_match_all('/<link.*?href="(.*?\.css)".*?>/', $html, $matches);
  
  // Loop through each CSS file
  foreach ($matches[1] as $css_url) {
    // Check if the file's external
    $is_external = strpos($css_url, 'http') === 0;
    
    // If ignoring external files and it's an external file, skip it
    if ($ignore_external && $is_external) {
      continue;
    }
    
    // Get the CSS content
    $css = file_get_contents($css_url);
    
    // Save the CSS content to the appropriate directory
    if ($is_external) {
      file_put_contents('original_external/' . basename($css_url), $css);
    } else {
      file_put_contents('original/' . basename($css_url), $css);
      file_put_contents('original_patch/' . $css_url, $css);
    }
  }
  
  // Return of a JSON-encoded array of the CSS file URLs
  return json_encode($matches[1]);
}

// Usage
$url = 'https://example.com';
$ignore_external = false;
$css_file_order = save_css_files($url, $ignore_external);

echo $css_file_order;
?>
