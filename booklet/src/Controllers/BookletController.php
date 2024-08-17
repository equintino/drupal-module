<?php

namespace Drupal\booklet\Controllers;

class BookletController {
    public function index() {
        $path =  __DIR__;
        return [
            '#title' =>  $path
        ];
    }
}
