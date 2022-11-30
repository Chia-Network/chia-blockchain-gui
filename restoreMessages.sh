#!/bin/bash

git status -s | grep -E 'M .+messages\.(po|js)' | cut -d ' ' -f 3 | xargs git restore