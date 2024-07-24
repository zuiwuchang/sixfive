#!/bin/bash
set -e

cd "$(dirname "$BASH_SOURCE")"

if [[ ! -f js/calculator.js ]];then
    echo tsc
    tsc 
fi

tar -zcvf sixfive.tar.gz \
    LICENSE \
    index.html calculator.html \
    jquery.js js/