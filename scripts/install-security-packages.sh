#!/bin/bash
# Script to install security-related packages

echo "Installing security-related packages..."

# Rate limiting
npm install express-rate-limit

# Security headers and protection
npm install helmet

# Input validation
npm install joi

# Sanitization to prevent XSS
npm install xss

echo "Packages installed successfully!"
