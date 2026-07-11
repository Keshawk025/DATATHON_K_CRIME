#!/bin/bash
fuser -k 8006/tcp || true
./venv/bin/python test_dashboard_analytics.py
