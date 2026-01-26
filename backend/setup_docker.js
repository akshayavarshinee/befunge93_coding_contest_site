#!/usr/bin/env node

/**
 * Setup script for Docker-based execution system
 * Builds the Docker image and verifies the setup
 */

import DockerExecutor from './dockerExecutor.js';
import { spawn } from 'child_process';

async function checkDockerInstalled() {
    return new Promise((resolve) => {
        const docker = spawn('docker', ['--version']);
        docker.on('close', (code) => {
            resolve(code === 0);
        });
    });
}

async function setup() {
    console.log('🚀 Setting up Docker-based Befunge execution system...\n');

    // 1. Check if Docker is installed
    console.log('1. Checking Docker installation...');
    const dockerInstalled = await checkDockerInstalled();
    
    if (!dockerInstalled) {
        console.error('❌ Docker is not installed or not in PATH');
        console.error('   Please install Docker Desktop: https://www.docker.com/products/docker-desktop');
        process.exit(1);
    }
    console.log('   ✓ Docker is installed\n');

    // 2. Build Docker image
    console.log('2. Building Docker image (this may take a few minutes)...');
    try {
        await DockerExecutor.buildImage('befunge-runner:latest');
        console.log('   ✓ Docker image built successfully\n');
    } catch (err) {
        console.error('❌ Failed to build Docker image:', err.message);
        process.exit(1);
    }

    // 3. Test execution
    console.log('3. Testing isolated execution...');
    const executor = new DockerExecutor({
        imageName: 'befunge-runner:latest',
        timeoutMs: 5000
    });

    const testCode = '52*,@'; // Befunge code that outputs "10"
    try {
        const result = await executor.execute(testCode, '');
        if (result.stdout.trim() === '10') {
            console.log('   ✓ Test execution successful\n');
        } else {
            console.error(`❌ Test failed: expected "10", got "${result.stdout.trim()}"`);
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Test execution failed:', err.message);
        process.exit(1);
    }

    console.log('✅ Setup complete! You can now start the worker with:');
    console.log('   node worker_docker.js\n');
}

setup().catch((err) => {
    console.error('Setup failed:', err);
    process.exit(1);
});
