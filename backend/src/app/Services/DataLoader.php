<?php

namespace App\Services;

class DataLoader {

    private $srcPath;
    private $distPath;

    /**
     * @param string $srcPath
     * @param string $distPath
     */
    public function __construct($srcPath, $distPath) {
        $this->srcPath = $srcPath;
        $this->distPath = $distPath;
    }

    public function loadFile() {
        $json = [];

        if (file_exists($this->distPath)) {
            return;
        }

        $handle = fopen($this->srcPath, "r");
        if ($handle) {
            while (($line = fgets($handle)) !== false) {
                $clean_str = preg_replace('/[^\x20-\x7e]/', '', $line);
                $this->processLine($json, $clean_str);
            }
            fclose($handle);
        }

        // Write data as JSON file
        $jsonString = json_encode($json);
        $fp = fopen($this->distPath, 'w');
        fwrite($fp, $jsonString);
        fclose($fp);
    }

    private function processLine(&$json, $line) {
        preg_match('/(.*) \[(.*)\] "(.*)" (.*) (.*)/', $line, $matches);

        $host = $matches[1];
        $datetime = $matches[2];
        $request = $matches[3];
        $statusCode = $matches[4];
        $byteSize = $matches[5];

        [$day, $hour, $minute, $second] = explode(':', $datetime);

        $pieces = explode(' ', $request);
        $length = count($pieces);

        $method = in_array($pieces[0], ['GET', 'POST', 'HEAD']) ? $pieces[0] : null;

        // Assign default protocol if not included
        preg_match('/HTTP\/.*/', $pieces[$length-1], $protocolMatches);
        $protocol = $protocolMatches[0] ?? null;

        $url_start = $method ? 1 : 0;
        $url_end = $protocol ? $length - 1 : $length;

        $url = array_slice($pieces, $url_start, $url_end);

        if ($protocol) {
            [$protocolName, $protocolVer] = explode('/', $protocol);
        } else {
            $protocolName = null;
            $protocolVer = null;
        }

        $json[] = [
            'host' => $host,
            'datetime' => [
                'day' => $day,
                'hour' => $hour,
                'minute' => $minute,
                'second' => $second
            ],
            'request' => [
                'method' => $method,
                'url' => $url,
                'protocol' => $protocolName,
                'protocol_version' => $protocolVer
            ],
            'response_code' => $statusCode,
            'document_size' => $byteSize
        ];
    }
}
