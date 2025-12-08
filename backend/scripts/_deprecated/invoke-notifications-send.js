#!/usr/bin/env node
// Boot a Nest application context (no HTTP server) and invoke NotificationsService.sendMatchNotice
const { NestFactory } = require('@nestjs/core');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function run() {
// Deprecated helper: invoking NotificationsService from a script is disabled.
console.log('invoke-notifications-send.js is deprecated and intentionally disabled.');
