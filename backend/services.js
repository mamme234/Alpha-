// backend/services.js - Complete updated file with optional email
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';
import { Project, Deployment } from './models.js';
import { getRedis } from './db.js';
import config from './config.js';

const execAsync = promisify(exec);

// ==================== Storage Service ====================
export const storageService = {
  s3Client: null,
  initialized: false,
  
  init() {
    if (config.s3 && config.s3.accessKey && config.s3.secretKey && config.s3.region) {
      try {
        import('@aws-sdk/client-s3').then(module => {
          const { S3Client } = module;
          this.s3Client = new S3Client({
            region: config.s3.region,
            credentials: {
              accessKeyId: config.s3.accessKey,
              secretAccessKey: config.s3.secretKey,
            },
          });
          this.initialized = true;
          console.log('✅ S3 Storage initialized');
        }).catch(err => {
          console.warn('⚠️ S3 not available:', err.message);
        });
      } catch (error) {
        console.warn('⚠️ S3 configuration error:', error.message);
      }
    } else {
      console.log('📁 Using local file storage (S3 not configured)');
    }
  },
  
  async uploadFile(file, path, metadata = {}) {
    if (!this.initialized || !this.s3Client) {
      return this.uploadLocal(file, path);
    }
    
    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const key = `${path}/${file.originalname}`;
      await this.s3Client.send(new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: metadata,
      }));
      return key;
    } catch (error) {
      console.error('S3 upload failed:', error);
      return this.uploadLocal(file, path);
    }
  },
  
  async uploadLocal(file, path) {
    const uploadDir = path.join(process.cwd(), 'uploads', path);
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, file.originalname);
    await fs.writeFile(filePath, file.buffer);
    return filePath;
  },
  
  async getFileUrl(key, expiresIn = 3600) {
    if (!this.initialized || !this.s3Client) {
      return `/uploads/${key}`;
    }
    
    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      const command = new GetObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      return `/uploads/${key}`;
    }
  },
};

// ==================== Email Service (Optional) ====================
export const emailService = {
  transporter: null,
  initialized: false,
  
  init() {
    const hasEmailConfig = config.email && 
                          config.email.user && 
                          config.email.pass && 
                          config.email.user !== '' && 
                          config.email.pass !== '';
    
    if (hasEmailConfig) {
      try {
        this.transporter = nodemailer.createTransport({
          service: config.email.service || 'gmail',
          auth: {
            user: config.email.user,
            pass: config.email.pass,
          },
        });
        this.initialized = true;
        console.log('✅ Email service initialized');
      } catch (error) {
        console.warn('⚠️ Email service initialization failed:', error.message);
        this.initialized = false;
      }
    } else {
      console.log('📧 Email service not configured - skipping');
      this.initialized = false;
    }
  },
  
  async sendEmail({ to, subject, html, text }) {
    if (!this.initialized || !this.transporter) {
      console.log(`📧 Email would be sent to ${to}: ${subject}`);
      return { success: true, message: 'Email service not configured, email skipped' };
    }
    
    try {
      await this.transporter.sendMail({
        from: `"${config.appName || 'Platform'}" <${config.email.user}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`✅ Email sent to: ${to}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error: error.message };
    }
  },
  
  async sendVerificationEmail(email, token) {
    const url = `${config.frontendUrl}/verify-email?token=${token}`;
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h1>Welcome to ${config.appName || 'Platform'}!</h1>
        <p>Please click the link below to verify your email:</p>
        <a href="${url}">${url}</a>
      `,
      text: `Please verify your email: ${url}`,
    });
  },
  
  async sendWelcomeEmail(email, username) {
    return this.sendEmail({
      to: email,
      subject: `Welcome to ${config.appName || 'Platform'}!`,
      html: `
        <h1>Welcome ${username}!</h1>
        <p>Thank you for joining ${config.appName || 'Platform'}.</p>
        <p>You can now start building and discovering amazing applications.</p>
      `,
      text: `Welcome ${username}! Thank you for joining.`,
    });
  },
  
  async sendPasswordResetEmail(email, token) {
    const url = `${config.frontendUrl}/reset-password?token=${token}`;
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${url}">${url}</a>
        <p>If you didn't request this, ignore this email.</p>
      `,
      text: `Reset your password: ${url}`,
    });
  },
};

// ==================== Deployment Service ====================
export const deploymentService = {
  async deploy(projectId, options = {}) {
    const { branch = 'main', environment = 'production', commit } = options;
    
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');
    
    const deployment = new Deployment({
      project: projectId,
      branch,
      environment,
      commit,
      status: 'pending',
    });
    await deployment.save();
    
    this._runDeployment(project, deployment).catch(error => {
      console.error('Deployment failed:', error);
      deployment.status = 'failed';
      deployment.runtimeLogs = error.message;
      deployment.save();
    });
    
    return deployment;
  },
  
  async _runDeployment(project, deployment) {
    try {
      deployment.status = 'building';
      await deployment.save();
      
      const repoPath = path.join('/tmp', `repo-${uuidv4()}`);
      await this._cloneRepository(project, repoPath, deployment.branch);
      
      const buildResult = await this._buildProject(project, repoPath);
      deployment.buildLogs = buildResult.logs;
      
      deployment.status = 'deploying';
      await deployment.save();
      
      const deployResult = await this._deployToHosting(
        project, 
        buildResult.outputPath,
        deployment
      );
      
      deployment.status = 'success';
      deployment.url = deployResult.url;
      deployment.stats = {
        buildTime: buildResult.time,
        deployTime: deployResult.time,
        size: deployResult.size,
      };
      await deployment.save();
      
      project.lastDeployed = new Date();
      project.status = 'active';
      await project.save();
      
      await fs.rm(repoPath, { recursive: true, force: true });
      
      return deployment;
    } catch (error) {
      deployment.status = 'failed';
      deployment.runtimeLogs = error.message;
      await deployment.save();
      throw error;
    }
  },
  
  async _cloneRepository(project, repoPath, branch) {
    const repoUrl = project.repository?.url;
    if (!repoUrl) {
      throw new Error('No repository URL found');
    }
    await execAsync(`git clone --depth 1 --branch ${branch} ${repoUrl} ${repoPath}`);
  },
  
  async _buildProject(project, repoPath) {
    const startTime = Date.now();
    let logs = '';
    let outputPath = repoPath;
    
    const framework = project.framework?.toLowerCase() || '';
    
    try {
      if (['react', 'next', 'vue', 'angular'].includes(framework)) {
        logs += await this._buildFrontend(repoPath, framework);
        outputPath = path.join(repoPath, 'dist');
      } else if (['node', 'express', 'nest'].includes(framework)) {
        logs += await this._buildNode(repoPath);
        outputPath = repoPath;
      } else {
        logs += await this._buildStatic(repoPath);
      }
    } catch (error) {
      logs += `\n❌ Build error: ${error.message}`;
      throw error;
    }
    
    return {
      logs,
      outputPath,
      time: Date.now() - startTime,
    };
  },
  
  async _buildFrontend(repoPath, framework) {
    let commands = ['npm install', 'npm run build'];
    let logs = '';
    for (const cmd of commands) {
      logs += `\n> ${cmd}\n`;
      try {
        const { stdout, stderr } = await execAsync(cmd, { cwd: repoPath });
        logs += stdout || stderr;
      } catch (error) {
        logs += `\n❌ Command failed: ${error.message}`;
        throw error;
      }
    }
    return logs;
  },
  
  async _buildNode(repoPath) {
    let logs = '';
    try {
      logs += '\n> npm install\n';
      const { stdout, stderr } = await execAsync('npm install', { cwd: repoPath });
      logs += stdout || stderr;
    } catch (error) {
      throw new Error(`Node build failed: ${error.message}`);
    }
    return logs;
  },
  
  async _buildStatic(repoPath) {
    return '✓ Static site (no build required)';
  },
  
  async _deployToHosting(project, outputPath, deployment) {
    const domain = this._generateDomain(project, deployment);
    const url = `https://${domain}`;
    return {
      url,
      time: 1000,
      size: 1024,
    };
  },
  
  _generateDomain(project, deployment) {
    const subdomain = `${project.name}-${deployment._id.toString().slice(-6)}`;
    return `${subdomain}.${config.deployment?.baseDomain || 'app.dev'}`;
  },
  
  async _walkDirectory(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this._walkDirectory(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  },
  
  async _getDirectorySize(dir) {
    let size = 0;
    const files = await this._walkDirectory(dir);
    for (const file of files) {
      const stats = await fs.stat(file);
      size += stats.size;
    }
    return size;
  },
  
  async rollback(deploymentId) {
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) throw new Error('Deployment not found');
    return deployment;
  },
};

// ==================== Git Service ====================
export const gitService = {
  async createRepository(name, isPrivate = true) {
    console.log(`📁 Creating repository: ${name}`);
    return { name, isPrivate };
  },
  
  async commitFile(repoPath, filePath, message) {
    await execAsync(`cd ${repoPath} && git add ${filePath} && git commit -m "${message}"`);
  },
  
  async push(repoPath, branch = 'main') {
    await execAsync(`cd ${repoPath} && git push origin ${branch}`);
  },
  
  async getBranches(repoPath) {
    const { stdout } = await execAsync(`cd ${repoPath} && git branch -a`);
    return stdout.split('\n').filter(b => b.trim()).map(b => b.replace('*', '').trim());
  },
  
  async getCommits(repoPath, limit = 50) {
    const { stdout } = await execAsync(`cd ${repoPath} && git log -n ${limit} --pretty=format:"%H|%an|%ae|%ad|%s"`);
    return stdout.split('\n').map(line => {
      const [hash, author, email, date, message] = line.split('|');
      return { hash, author, email, date, message };
    });
  },
};

// ==================== Analytics Service ====================
export const analyticsService = {
  async trackEvent({ userId, appId, projectId, type, metadata = {} }) {
    console.log(`📊 Tracking: ${type} for ${userId || appId || projectId}`);
    return { success: true };
  },
  
  async getAppAnalytics(appId, timeRange = '7d') {
    return {
      downloads: 0,
      views: 0,
      uniqueUsers: 0,
      countries: {},
      devices: {},
      browsers: {},
      daily: {},
    };
  },
};

// ==================== Database Service ====================
export const databaseService = {
  async createDatabase(name, type = 'mongodb') {
    console.log(`🗄️ Creating ${type} database: ${name}`);
    return { name, type };
  },
  
  async getDatabaseStats(dbId) {
    return { size: '10MB', connections: 0 };
  },
};

// Initialize services
storageService.init();
emailService.init();

export default {
  deploymentService,
  storageService,
  emailService,
  gitService,
  analyticsService,
  databaseService,
};
