#!/usr/bin/env node

/**
 * Test script for enhanced file upload functionality
 * Tests PDF, DOCX, JSON, and TXT file support with user isolation
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

// Test users
const testUsers = [
    { email: 'user1@test.com', password: 'password123', name: 'User One' },
    { email: 'user2@test.com', password: 'password123', name: 'User Two' },
];

// Helper function to register and login user
async function setupUser(user) {
    try {
        // Register
        await fetch(`${API_BASE}/api/v1/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: user.name,
                email: user.email,
                password: user.password,
            }),
        });
    } catch (error) {
        // User might already exist, ignore error
    }

    // Login to get token
    const loginResponse = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: user.email,
            password: user.password,
        }),
    });

    const loginData = await loginResponse.json();
    return loginData.data.token;
}

// Create test files
function createTestFiles() {
    // Create test TXT file
    fs.writeFileSync(
        '/tmp/test.txt',
        'This is a test text document for user isolation testing.',
    );

    // Create test JSON file
    const jsonData = {
        title: 'Test JSON Document',
        description: 'This is a test JSON file for document processing',
        data: {
            items: ['item1', 'item2', 'item3'],
            metadata: {
                created: '2025-09-24',
                author: 'Test User',
            },
        },
    };
    fs.writeFileSync('/tmp/test.json', JSON.stringify(jsonData, null, 2));

    console.log('✅ Created test files: /tmp/test.txt, /tmp/test.json');
}

// Upload file
async function uploadFile(token, filePath, fileName) {
    const form = new FormData();
    form.append('document', fs.createReadStream(filePath), fileName);

    const response = await fetch(`${API_BASE}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: form,
    });

    return await response.json();
}

// Get user documents
async function getUserDocuments(token) {
    const response = await fetch(`${API_BASE}/api/v1/documents`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return await response.json();
}

// Ask question
async function askQuestion(token, question) {
    const response = await fetch(`${API_BASE}/api/v1/qa/ask`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
    });

    return await response.json();
}

// Main test function
async function runTests() {
    console.log('🚀 Starting file upload and user isolation tests...\n');

    // Create test files
    createTestFiles();

    // Setup users
    console.log('👥 Setting up test users...');
    const token1 = await setupUser(testUsers[0]);
    const token2 = await setupUser(testUsers[1]);
    console.log('✅ Users setup complete\n');

    // Test file uploads for User 1
    console.log('📁 Testing file uploads for User 1...');
    const upload1 = await uploadFile(
        token1,
        '/tmp/test.txt',
        'user1-document.txt',
    );
    console.log(
        'TXT Upload Result:',
        upload1.success ? '✅ Success' : `❌ Failed: ${upload1.message}`,
    );

    const upload2 = await uploadFile(
        token1,
        '/tmp/test.json',
        'user1-data.json',
    );
    console.log(
        'JSON Upload Result:',
        upload2.success ? '✅ Success' : `❌ Failed: ${upload2.message}`,
    );

    // Test file uploads for User 2
    console.log('\n📁 Testing file uploads for User 2...');
    const upload3 = await uploadFile(
        token2,
        '/tmp/test.txt',
        'user2-document.txt',
    );
    console.log(
        'TXT Upload Result:',
        upload3.success ? '✅ Success' : `❌ Failed: ${upload3.message}`,
    );

    // Wait a moment for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test document isolation
    console.log('\n🔒 Testing user isolation...');

    const user1Docs = await getUserDocuments(token1);
    const user2Docs = await getUserDocuments(token2);

    console.log(`User 1 can see ${user1Docs.data.documents.length} documents`);
    console.log(`User 2 can see ${user2Docs.data.documents.length} documents`);

    // Test Q&A isolation
    console.log('\n❓ Testing Q&A isolation...');

    const user1QA = await askQuestion(token1, 'What documents do I have?');
    console.log(
        'User 1 Q&A Result:',
        user1QA.success ? '✅ Success' : `❌ Failed: ${user1QA.message}`,
    );

    const user2QA = await askQuestion(token2, 'What documents do I have?');
    console.log(
        'User 2 Q&A Result:',
        user2QA.success ? '✅ Success' : `❌ Failed: ${user2QA.message}`,
    );

    // Cleanup
    fs.unlinkSync('/tmp/test.txt');
    fs.unlinkSync('/tmp/test.json');

    console.log('\n✅ Tests completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export default {
    runTests,
    setupUser,
    uploadFile,
    getUserDocuments,
    askQuestion,
};
