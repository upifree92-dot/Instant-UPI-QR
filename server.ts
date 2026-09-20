import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const DELETED_FILE = path.join(DATA_DIR, 'deleted_users.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const DEFAULT_SERVER_CONFIG = {
  storeName: 'Sharma General Store',
  upiId: 'sharmastore@okhdfcbank',
  extraPercentage: 2,
  isExtraEnabled: true,
  currency: 'INR',
  note: 'Bill Payment',
  soundboxVoice: true,
  language: 'en',
  presets: [50, 100, 200, 500, 1000, 2000],
  updatedAt: new Date().toISOString(),
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_SERVER_CONFIG,
          ...parsed,
          presets:
            Array.isArray(parsed.presets) && parsed.presets.length > 0
              ? parsed.presets
              : DEFAULT_SERVER_CONFIG.presets,
        };
      }
    }
  } catch (err) {
    console.error('Failed to read config file:', err);
  }
  saveConfig(DEFAULT_SERVER_CONFIG);
  return DEFAULT_SERVER_CONFIG;
}

function saveConfig(cfg: any) {
  try {
    const merged = {
      ...DEFAULT_SERVER_CONFIG,
      ...cfg,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (err) {
    console.error('Failed to write config file:', err);
    return cfg;
  }
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data directory:', e);
  }
}

// Initial default seed users
const INITIAL_USERS = [
  {
    id: 'admin_kgfilewala',
    name: 'Super Admin',
    email: 'kgfilewala@gmail.com',
    password: 'bbbb@9090',
    role: 'admin',
    status: 'active',
    validityPlan: 'lifetime',
    validUntil: new Date(Date.now() + 86400000 * 3650).toISOString(),
    validFrom: new Date(Date.now() - 86400000 * 30).toISOString(),
    registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isNotificationRead: true,
  },
  {
    id: 'user_demo9090',
    name: 'Demo User',
    email: 'demo9090',
    password: 'demo9090',
    phone: '9090909090',
    businessName: 'Demo Store',
    role: 'customer',
    status: 'active',
    validityPlan: 'lifetime',
    validUntil: new Date(Date.now() + 86400000 * 3650).toISOString(),
    validFrom: new Date(Date.now() - 86400000 * 30).toISOString(),
    registeredAt: new Date().toISOString(),
    isNotificationRead: true,
  },
  {
    id: 'user_cust_anita',
    name: 'Anita Verma',
    email: 'anita@gmail.com',
    password: 'anita',
    phone: '9823456789',
    businessName: 'Verma Collection',
    role: 'customer',
    status: 'active',
    validityPlan: '3_months',
    validUntil: new Date(Date.now() + 86400000 * 90).toISOString(),
    validFrom: new Date().toISOString(),
    registeredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isNotificationRead: true,
  },
  {
    id: 'user_upifree92',
    name: 'Upi',
    email: 'upifree92@gmail.com',
    password: 'demo',
    phone: '8598912555',
    businessName: 'Upi Digital Store',
    role: 'customer',
    status: 'active',
    validityPlan: '1_month',
    validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    validFrom: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    isNotificationRead: true,
  },
];

function loadDeletedIds(): string[] {
  try {
    if (fs.existsSync(DELETED_FILE)) {
      const content = fs.readFileSync(DELETED_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch (err) {
    console.error('Failed to read deleted users file:', err);
  }
  return [];
}

function saveDeletedIds(ids: string[]) {
  try {
    fs.writeFileSync(DELETED_FILE, JSON.stringify(ids, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write deleted users file:', err);
  }
}

function loadUsers(): any[] {
  const deleted = loadDeletedIds();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out deleted
        let cleaned = parsed.filter(
          (u: any) =>
            !deleted.includes(u.id) &&
            !deleted.includes(u.email?.toLowerCase())
        );

        // Ensure Super Admin is always present
        const adminIdx = cleaned.findIndex(
          (u: any) => u.email?.toLowerCase() === 'kgfilewala@gmail.com'
        );
        if (adminIdx === -1) {
          cleaned.unshift(INITIAL_USERS[0]);
        } else {
          cleaned[adminIdx].role = 'admin';
          cleaned[adminIdx].password = 'bbbb@9090';
        }

        return cleaned;
      }
    }
  } catch (err) {
    console.error('Failed to read users file:', err);
  }

  // Fallback initial seeds minus deleted
  const filtered = INITIAL_USERS.filter(
    (u) => !deleted.includes(u.id) && !deleted.includes(u.email.toLowerCase())
  );
  saveUsers(filtered);
  return filtered;
}

function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write users file:', err);
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // SSE client pool for super automatic real-time push
  const sseClients: Set<express.Response> = new Set();

  function broadcastSse(event: string, payload: any) {
    const data = JSON.stringify(payload);
    for (const client of Array.from(sseClients)) {
      try {
        client.write(`event: ${event}\ndata: ${data}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  // Keep SSE alive with periodic heartbeat
  setInterval(() => {
    for (const client of Array.from(sseClients)) {
      try {
        client.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  }, 15000);

  // ==========================================
  // API ROUTES
  // ==========================================

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Real-time Event Stream (Server-Sent Events) - Instant sync for any connected PC
  app.get('/api/users/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const currentConfig = loadConfig();
    const currentUsers = loadUsers();
    res.write(
      `event: connected\ndata: ${JSON.stringify({
        time: Date.now(),
        totalUsers: currentUsers.length,
        config: currentConfig,
        users: currentUsers,
      })}\n\n`
    );
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Get current global/admin merchant configuration and presets
  app.get('/api/config', (req, res) => {
    const config = loadConfig();
    res.json({ success: true, config });
  });

  // Update global/admin merchant configuration and presets (Instantly syncs to all PCs via SSE)
  app.post('/api/config', (req, res) => {
    try {
      const current = loadConfig();
      const updated = saveConfig({ ...current, ...req.body });
      console.log(`[API] Merchant config & presets updated: ${updated.storeName} (${updated.upiId})`);
      broadcastSse('config_updated', { config: updated });
      res.json({ success: true, config: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Save customer's custom profile & store settings (so they persist across any PC)
  app.post('/api/users/custom-config', (req, res) => {
    try {
      const { emailOrId, config: userConfig } = req.body;
      if (!emailOrId || !userConfig) {
        return res.status(400).json({ success: false, error: 'Missing emailOrId or config' });
      }
      const clean = (emailOrId || '').trim().toLowerCase();
      const users = loadUsers();
      const idx = users.findIndex(
        (u) => u.id === emailOrId || u.email?.toLowerCase() === clean
      );
      if (idx !== -1) {
        if (userConfig.storeName) users[idx].businessName = userConfig.storeName;
        if (userConfig.upiId) users[idx].upiId = userConfig.upiId;
        if (userConfig.extraPercentage !== undefined) {
          users[idx].extraPercentage = userConfig.extraPercentage;
        }
        if (userConfig.isExtraEnabled !== undefined) {
          users[idx].isExtraEnabled = userConfig.isExtraEnabled;
        }
        saveUsers(users);
        console.log(`[API] Saved custom merchant config for user ${clean}`);
        broadcastSse('user_updated', { user: users[idx] });
        return res.json({ success: true, user: users[idx] });
      }
      return res.status(404).json({ success: false, error: 'User not found' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get all registered users (used by Admin Panel and Client Sync)
  app.get('/api/users', (req, res) => {
    const users = loadUsers();
    res.json({ success: true, users });
  });

  // Register a new customer
  app.post('/api/users/register', (req, res) => {
    try {
      const { name, email, password, phone, businessName, role, status, validityPlan } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim() || cleanEmail.split('@')[0] || 'User';

      if (!cleanEmail) {
        return res.status(400).json({ success: false, error: 'Email / Username is required' });
      }
      if (!password || password.length < 3) {
        return res.status(400).json({ success: false, error: 'Password must be at least 3 characters' });
      }

      // Unblacklist if previously deleted
      const deleted = loadDeletedIds().filter((d) => d.toLowerCase() !== cleanEmail);
      saveDeletedIds(deleted);

      const users = loadUsers();
      const existing = users.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: `User "${cleanEmail}" is already registered. Please login instead.`,
        });
      }

      const assignedPlan = validityPlan || '1_month';
      const daysMap: Record<string, number> = {
        '1_month': 30,
        '3_months': 90,
        '6_months': 180,
        '1_year': 365,
        'lifetime': 3650,
      };
      const days = daysMap[assignedPlan] || 30;
      const now = new Date();
      const validUntil = new Date(now.getTime() + days * 86400000).toISOString();

      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        email: cleanEmail,
        password: password,
        phone: (phone || '').trim(),
        businessName: (businessName || '').trim(),
        role: role || 'customer',
        status: status || 'pending',
        validityPlan: assignedPlan,
        validFrom: now.toISOString(),
        validUntil,
        registeredAt: now.toISOString(),
        isNotificationRead: false,
      };

      users.unshift(newUser);
      saveUsers(users);

      console.log(`[API] New customer registered: ${cleanEmail} (Status: ${newUser.status})`);
      // Super automatic instant push to all connected clients & admin panels
      broadcastSse('user_registered', { user: newUser, users });
      return res.json({ success: true, user: newUser });
    } catch (err: any) {
      console.error('[API] Register error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Registration failed' });
    }
  });

  // Update user status (approve/activate or reject or mark pending)
  app.post('/api/users/update-status', (req, res) => {
    try {
      const { userId, status, validityPlan, validFrom, validUntil } = req.body;
      const users = loadUsers();
      const idx = users.findIndex(
        (u) => u.id === userId || u.email?.toLowerCase() === (userId || '').toLowerCase()
      );

      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      users[idx].status = status;
      if (validityPlan) users[idx].validityPlan = validityPlan;

      if (status === 'active') {
        const plan = validityPlan || users[idx].validityPlan || '1_month';
        users[idx].validityPlan = plan;
        users[idx].validFrom = validFrom || new Date().toISOString();
        const days =
          plan === '1_month'
            ? 30
            : plan === '3_months'
            ? 90
            : plan === '6_months'
            ? 180
            : plan === '1_year'
            ? 365
            : 3650;
        users[idx].validUntil =
          validUntil || new Date(Date.now() + days * 86400000).toISOString();
        users[idx].isNotificationRead = true;
      } else {
        if (validFrom) users[idx].validFrom = validFrom;
        if (validUntil) users[idx].validUntil = validUntil;
      }

      saveUsers(users);
      console.log(`[API] User ${users[idx].email} status updated to ${status}`);
      // Super automatic instant push to all connected clients & admin panels
      broadcastSse('user_updated', { user: users[idx], users });
      return res.json({ success: true, user: users[idx] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Batch activate all pending users or specified userIds
  app.post('/api/users/batch-activate', (req, res) => {
    try {
      const { plan = '1_month', userIds } = req.body;
      const users = loadUsers();
      let count = 0;

      const days =
        plan === '1_month'
          ? 30
          : plan === '3_months'
          ? 90
          : plan === '6_months'
          ? 180
          : plan === '1_year'
          ? 365
          : 3650;

      for (const u of users) {
        if (
          u.role !== 'admin' &&
          u.email?.toLowerCase() !== 'kgfilewala@gmail.com' &&
          (u.status === 'pending' || (Array.isArray(userIds) && userIds.includes(u.id)))
        ) {
          u.status = 'active';
          u.validityPlan = plan;
          u.validFrom = new Date().toISOString();
          u.validUntil = new Date(Date.now() + days * 86400000).toISOString();
          u.isNotificationRead = true;
          count++;
        }
      }

      if (count > 0) {
        saveUsers(users);
        console.log(`[API] Batch activated ${count} pending customers with plan ${plan}`);
        broadcastSse('users_synced', { users });
      }

      return res.json({ success: true, count, users });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update user password
  app.post('/api/users/password', (req, res) => {
    try {
      const { userIdOrEmail, newPassword } = req.body;
      if (!newPassword || newPassword.length < 3) {
        return res.status(400).json({ success: false, error: 'Password must be at least 3 characters' });
      }

      const clean = (userIdOrEmail || '').trim().toLowerCase();
      const users = loadUsers();
      const idx = users.findIndex(
        (u) => u.id === userIdOrEmail || u.email?.toLowerCase() === clean
      );

      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      users[idx].password = newPassword.trim();
      saveUsers(users);
      // Super automatic push
      broadcastSse('user_updated', { user: users[idx], users });
      return res.json({ success: true, user: users[idx] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete customer permanently
  app.delete('/api/users/:id', (req, res) => {
    try {
      const { id } = req.params;
      const users = loadUsers();
      const target = users.find(
        (u) => u.id === id || u.email?.toLowerCase() === id.toLowerCase()
      );

      if (!target) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (target.role === 'admin' || target.email?.toLowerCase() === 'kgfilewala@gmail.com') {
        return res.status(400).json({ success: false, error: 'Cannot delete Super Admin account' });
      }

      // Add to deleted blacklist
      const deleted = loadDeletedIds();
      if (!deleted.includes(target.id)) deleted.push(target.id);
      if (target.email && !deleted.includes(target.email.toLowerCase())) {
        deleted.push(target.email.toLowerCase());
      }
      saveDeletedIds(deleted);

      const filtered = users.filter(
        (u) => u.id !== target.id && u.email?.toLowerCase() !== target.email?.toLowerCase()
      );
      saveUsers(filtered);

      console.log(`[API] User ${target.email} deleted permanently`);
      // Super automatic push
      broadcastSse('user_deleted', { id: target.id, email: target.email, users: filtered });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Two-way sync: Merge client users with server users
  app.post('/api/users/sync', (req, res) => {
    try {
      const { clientUsers } = req.body;
      const serverUsers = loadUsers();
      const deleted = loadDeletedIds();

      if (Array.isArray(clientUsers)) {
        let changed = false;
        for (const cu of clientUsers) {
          if (!cu.email || deleted.includes(cu.id) || deleted.includes(cu.email.toLowerCase())) {
            continue;
          }
          const cleanEmail = cu.email.toLowerCase();
          const existingIdx = serverUsers.findIndex((su) => su.email?.toLowerCase() === cleanEmail);
          if (existingIdx === -1) {
            // New user registered on client, add to server!
            serverUsers.push(cu);
            changed = true;
          } else {
            // If client has active/rejected status update, update server
            if (cu.status && cu.status !== serverUsers[existingIdx].status) {
              serverUsers[existingIdx].status = cu.status;
              if (cu.validityPlan) serverUsers[existingIdx].validityPlan = cu.validityPlan;
              if (cu.validUntil) serverUsers[existingIdx].validUntil = cu.validUntil;
              if (cu.validFrom) serverUsers[existingIdx].validFrom = cu.validFrom;
              changed = true;
            }
            if (cu.isNotificationRead && !serverUsers[existingIdx].isNotificationRead) {
              serverUsers[existingIdx].isNotificationRead = true;
              changed = true;
            }
          }
        }
        if (changed) {
          saveUsers(serverUsers);
          broadcastSse('users_synced', { users: serverUsers });
        }
      }

      return res.json({ success: true, users: serverUsers });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
