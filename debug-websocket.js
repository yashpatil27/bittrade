#!/usr/bin/env node

// Debug script to test WebSocket functionality
const io = require('socket.io-client');

console.log('🔍 Testing WebSocket connection...');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
  
  // Test authentication with a sample token
  console.log('🔐 Testing authentication...');
  
  // You'll need to replace this with a real JWT token from your admin account
  const sampleToken = 'your_jwt_token_here';
  socket.emit('authenticate', sampleToken);
});

socket.on('authentication_success', (data) => {
  console.log('✅ Authentication successful:', data);
});

socket.on('authentication_error', (error) => {
  console.log('❌ Authentication failed:', error);
});

socket.on('user_balance_update', (data) => {
  console.log('💰 Received balance update:', data);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error);
});

// Keep the script running for 30 seconds
setTimeout(() => {
  console.log('🔄 Closing connection...');
  socket.disconnect();
  process.exit(0);
}, 30000);
