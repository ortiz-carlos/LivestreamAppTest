#!/bin/bash
cd backend
pip install -r requirements.txt
cd app
uvicorn app.main:app --reload --port 8000