#!/bin/bash
cd "$(dirname "$0")/dist"
ln -sf api/src/main.js main.js 2>/dev/null || true
ln -sf api/src src 2>/dev/null || true
