// DevPulse - Production Backend
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// CORS Configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://devpulse-ochre.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  console.log('⚠️  Generated encryption key. Add to .env:');
  console.log(`ENCRYPTION_KEY=${ENCRYPTION_KEY}\n`);
} else if (ENCRYPTION_KEY.length !== 64) {
  console.error('❌ ENCRYPTION_KEY must be 64 hex chars!');
  process.exit(1);
}

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.error('\n❌ Missing GitHub OAuth credentials!\n');
  process.exit(1);
}

const tokenStore = new Map();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function getAccessToken(sessionId) {
  const session = tokenStore.get(sessionId);
  if (!session) throw new Error('Invalid or expired session');
  if (session.expiresAt < Date.now()) {
    tokenStore.delete(sessionId);
    throw new Error('Session expired');
  }
  return decrypt(session.accessToken);
}

// GitHub OAuth
app.post('/api/auth/github', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'OAuth code required' });
    }
    
    console.log('📝 OAuth code received');
    
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('❌ GitHub auth failed:', tokenData.error_description);
      return res.status(400).json({ 
        success: false, 
        error: tokenData.error_description || 'GitHub auth failed' 
      });
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevPulse-App'
      }
    });

    if (!userResponse.ok) {
      console.error('❌ Failed to fetch user');
      return res.status(401).json({ 
        success: false, 
        error: 'Failed to fetch user from GitHub' 
      });
    }

    const userData = await userResponse.json();
    const sessionId = generateSessionId();
    
    tokenStore.set(sessionId, {
      accessToken: encrypt(tokenData.access_token),
      userId: userData.id,
      login: userData.login,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    });

    console.log(`✓ ${userData.login} authenticated`);

    res.json({
      success: true,
      sessionId,
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        avatar: userData.avatar_url,
        email: userData.email
      }
    });
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && tokenStore.has(sessionId)) {
    const session = tokenStore.get(sessionId);
    console.log(`✓ ${session.login} logged out`);
    tokenStore.delete(sessionId);
  }
  res.json({ success: true });
});

app.post('/api/repo/check-access', async (req, res) => {
  try {
    const { owner, repo, sessionId, username } = req.body;
    const accessToken = getAccessToken(sessionId);

    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevPulse-App'
      }
    });

    if (repoResponse.status === 404) {
      return res.json({ hasAccess: false, isAdmin: false });
    }

    const repoData = await repoResponse.json();
    const permResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators/${username}/permission`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevPulse-App'
      }
    });

    const permData = await permResponse.json();
    const isAdmin = ['admin', 'maintain', 'write'].includes(permData.permission);

    res.json({
      hasAccess: true,
      isAdmin,
      permission: permData.permission,
      repository: {
        name: repoData.name,
        fullName: repoData.full_name,
        private: repoData.private,
        description: repoData.description
      }
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/storage/save', async (req, res) => {
  try {
    const { sessionId, repoFullName, data, dataType } = req.body;
    const accessToken = getAccessToken(sessionId);
    const session = tokenStore.get(sessionId);

    const encryptedData = encrypt(JSON.stringify(data));
    const gistFilename = `devpulse_${repoFullName.replace('/', '_')}_${dataType}.json`;
    
    const gistsResponse = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevPulse-App'
      }
    });

    const gists = await gistsResponse.json();
    const existingGist = gists.find(g => g.files[gistFilename]);

    const gistData = {
      description: `DevPulse: ${repoFullName} (${dataType})`,
      public: false,
      files: {
        [gistFilename]: {
          content: JSON.stringify({
            encrypted: true,
            repository: repoFullName,
            dataType,
            updatedAt: new Date().toISOString(),
            updatedBy: session.login,
            data: encryptedData
          }, null, 2)
        }
      }
    };

    let result;
    if (existingGist) {
      const updateResponse = await fetch(`https://api.github.com/gists/${existingGist.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'DevPulse-App'
        },
        body: JSON.stringify(gistData)
      });
      result = await updateResponse.json();
    } else {
      const createResponse = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'DevPulse-App'
        },
        body: JSON.stringify(gistData)
      });
      result = await createResponse.json();
    }

    res.json({ success: true, gistId: result.id, url: result.html_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/storage/load', async (req, res) => {
  try {
    const { sessionId, repoFullName, dataType } = req.body;
    const accessToken = getAccessToken(sessionId);
    const gistFilename = `devpulse_${repoFullName.replace('/', '_')}_${dataType}.json`;

    const gistsResponse = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevPulse-App'
      }
    });

    const gists = await gistsResponse.json();
    const targetGist = gists.find(g => g.files[gistFilename]);

    if (!targetGist) {
      return res.json({ success: true, data: null });
    }

    const gistResponse = await fetch(`https://api.github.com/gists/${targetGist.id}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevPulse-App'
      }
    });

    const gistData = await gistResponse.json();
    const fileContent = JSON.parse(gistData.files[gistFilename].content);
    const decryptedData = JSON.parse(decrypt(fileContent.data));

    res.json({
      success: true,
      data: decryptedData,
      metadata: {
        updatedAt: fileContent.updatedAt,
        updatedBy: fileContent.updatedBy,
        gistUrl: gistData.html_url
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function fetchGitHub(url, sessionId) {
  const accessToken = getAccessToken(sessionId);
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DevPulse-App'
    }
  });
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
  return response.json();
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { repoUrl, objectives, apiKey, sessionId, tasks } = req.body;

    if (!sessionId) return res.status(401).json({ error: 'Auth required' });
    if (!apiKey) return res.status(400).json({ error: 'Groq API key required' });

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid GitHub URL' });

    const [, owner, repoName] = match;
    const cleanRepo = repoName.replace(/\.git$/, '');
    const session = tokenStore.get(sessionId);

    const [repoData, contributors, commits, languages] = await Promise.all([
      fetchGitHub(`https://api.github.com/repos/${owner}/${cleanRepo}`, sessionId),
      fetchGitHub(`https://api.github.com/repos/${owner}/${cleanRepo}/contributors?per_page=15`, sessionId),
      fetchGitHub(`https://api.github.com/repos/${owner}/${cleanRepo}/commits?per_page=100`, sessionId),
      fetchGitHub(`https://api.github.com/repos/${owner}/${cleanRepo}/languages`, sessionId)
    ]);

    let taskContext = '';
    if (tasks && tasks.length > 0) {
      taskContext = `\n\nASSIGNED TASKS:\n${tasks.map((t, i) => `Task ${i + 1}: ${t.title}\nAssigned: ${t.assignedTo.join(', ')}\n`).join('\n')}`;
    }

    const prompt = `Analyze this repository:\n\nRepo: ${repoData.name}\nContributors: ${contributors.map(c => c.login).join(', ')}\n${taskContext}\n\nReturn JSON with: contributors (name, overallScore, impact, strengths, areasForImprovement, taskPerformance), codeHealth, alignment, recommendations, teamDynamics`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!groqRes.ok) throw new Error('Groq API error');
    
    const groqData = await groqRes.json();
    const text = groqData.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiAnalysis = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      repository: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        language: repoData.language,
        private: repoData.private,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        watchers: repoData.watchers_count,
        url: repoData.html_url,
        languages
      },
      contributors: contributors.map(c => ({
        login: c.login,
        contributions: c.contributions,
        avatar: c.avatar_url,
        url: c.html_url
      })),
      commits: commits.map(c => ({
        message: c.commit.message,
        author: c.commit.author.name,
        authorLogin: c.author?.login || c.commit.author.name,
        date: c.commit.author.date,
        sha: c.sha,
        url: c.html_url
      })),
      analysis: aiAnalysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        analyzedBy: session.login,
        objectives: objectives || null,
        aiModel: 'Llama 3.3 70B',
        tasksAnalyzed: tasks?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'DevPulse',
    sessions: tokenStore.size
  });
});

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, data] of tokenStore.entries()) {
    if (data.expiresAt < now) {
      tokenStore.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} sessions`);
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`\n🚀 DevPulse v2.0`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔐 OAuth: ${GITHUB_CLIENT_ID ? '✓' : '❌'}`);
  console.log(`🔑 Encryption: ${ENCRYPTION_KEY ? '✓' : '❌'}`);
  console.log(`\n✅ Ready!\n`);
});

module.exports = app;