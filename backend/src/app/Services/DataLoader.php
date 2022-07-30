<?php

namespace App\Services;


function hex_dump($data, $newline='<br>')
{
    static $from = '';
    static $to = '';

    static $width = 16; # number of bytes per line

    static $pad = '.'; # padding for non-visible characters

    if ($from==='')
    {
        for ($i=0; $i<=0xFF; $i++)
        {
            $from .= chr($i);
            $to .= ($i >= 0x20 && $i <= 0x7E) ? chr($i) : $pad;
        }
    }

    $hex = str_split(bin2hex($data), $width*2);
    $chars = str_split(strtr($data, $from, $to), $width);

    $offset = 0;
    foreach ($hex as $i => $line)
    {
        echo sprintf('%6X',$offset).' : '.implode(' ', str_split($line,2)) . ' [' . $chars[$i] . ']' . $newline;
        $offset += $width;
    }
}


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

        // TODO: ASK ABOUT BEHAVIOR FOR INVALID REQUESTS!!!!

        // TODO: Ask about desired behavior for missing method
        $method = in_array($pieces[0], ['GET', 'POST', 'HEAD']) ? $pieces[0] : 'GET';

        // Assign default protocol if not included
        // TODO: Ask desired behavior. Maybe do a Protocol simple regex
        $protocol = 'HTTP/1.0';

        // TODO: Ask about desired behavior
        $url = $pieces[$length-1] == 'HTTP/1.0'
            ? implode(' ', array_slice($pieces, 1, $length - 1))
            : implode(' ', array_slice($pieces, 1));

        [$protocolName, $protocolVer] = explode('/', $protocol);

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
