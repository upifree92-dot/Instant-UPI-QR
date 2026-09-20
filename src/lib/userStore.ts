import { MerchantConfig, RegisteredUser, UserRole, ValidityPlan } from '../types';

const USERS_STORAGE_KEY = 'upi_registered_users_v4';

export const VALIDITY_PLANS: {
  id: ValidityPlan;
  label: string;
  shortLabel: string;
  days: number;
  months: number;
  price?: number;
  description: string;
}[] = [
  { id: '1_month', label: '1 Month', shortLabel: '1M', days: 30, months: 1, price: 500, description: '₹500 / 30 Days' },
  { id: '3_months', label: '3 Months', shortLabel: '3M', days: 90, months: 3, price: 1299, description: '₹1,299 / 90 Days' },
  { id: '6_months', label: '6 Months', shortLabel: '6M', days: 180, months: 6, price: 2199, description: '₹2,199 / 180 Days' },
  { id: '1_year', label: '1 Year', shortLabel: '1Y', days: 365, months: 12, price: 2999, description: '₹2,999 / 365 Days' },
  { id: 'lifetime', label: 'Lifetime / Master', shortLabel: 'All', days: 36500, months: 1200, description: 'Permanent Access' },
];

export function calculateValidityExpiry(
  plan: ValidityPlan,
  fromDate?: Date
): { validFrom: string; validUntil: string } {
  const start = fromDate || new Date();
  const validFrom = start.toISOString();

  const end = new Date(start.getTime());
  if (plan === '1_month') {
    end.setMonth(end.getMonth() + 1);
  } else if (plan === '3_months') {
    end.setMonth(end.getMonth() + 3);
  } else if (plan === '6_months') {
    end.setMonth(end.getMonth() + 6);
  } else if (plan === '1_year') {
    end.setFullYear(end.getFullYear() + 1);
  } else if (plan === 'lifetime') {
    end.setFullYear(end.getFullYear() + 50);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  return {
    validFrom,
    validUntil: end.toISOString(),
  };
}

export function getUserValidityInfo(user: RegisteredUser): {
  isExpired: boolean;
  isLifetime: boolean;
  daysRemaining: number;
  formattedExpiry: string;
  planLabel: string;
} {
  if (
    user.role === 'admin' ||
    user.email.toLowerCase() === 'kgfilewala@gmail.com' ||
    user.validityPlan === 'lifetime'
  ) {
    return {
      isExpired: false,
      isLifetime: true,
      daysRemaining: 9999,
      formattedExpiry: 'Permanent Access',
      planLabel: 'Lifetime',
    };
  }

  const plan = VALIDITY_PLANS.find((p) => p.id === user.validityPlan) || {
    label: user.validityPlan ? user.validityPlan.replace('_', ' ') : '1 Month',
  };

  if (!user.validUntil) {
    return {
      isExpired: user.status === 'active',
      isLifetime: false,
      daysRemaining: 0,
      formattedExpiry: 'No Expiry Set',
      planLabel: plan.label,
    };
  }

  const expiryTime = new Date(user.validUntil).getTime();
  const now = Date.now();
  const diffMs = expiryTime - now;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = diffMs <= 0;

  const formattedExpiry = new Date(user.validUntil).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return {
    isExpired,
    isLifetime: false,
    daysRemaining: isExpired ? 0 : daysRemaining,
    formattedExpiry,
    planLabel: plan.label,
  };
}

// Pre-calculate sample expiry for defaults
const oneYearOut = new Date();
oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);

const oneMonthOut = new Date();
oneMonthOut.setMonth(oneMonthOut.getMonth() + 1);

const DEFAULT_USERS: RegisteredUser[] = [
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
    status: 'pending',
    validityPlan: '1_month',
    validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    validFrom: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    isNotificationRead: false,
  },
];

export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out any legacy demo merchant accounts and old demo11 admin
        let cleaned = parsed.filter(
          (u) =>
            u.id !== 'user_merchant_demo' &&
            u.id !== 'admin_demo11' &&
            u.id !== 'user_admin_demo' &&
            u.email !== 'demo@gmail.com' &&
            u.email.toLowerCase() !== 'demo11'
        );
        // Ensure new admin user exists and has current password
        const adminIdx = cleaned.findIndex(
          (u) => u.email.toLowerCase() === 'kgfilewala@gmail.com'
        );
        if (adminIdx === -1) {
          cleaned.unshift(DEFAULT_USERS[0]);
        } else {
          cleaned[adminIdx] = {
            ...cleaned[adminIdx],
            role: 'admin',
            status: 'active',
            password: 'bbbb@9090',
          };
        }

        // Ensure demo9090 user exists with password demo9090
        const demoIdx = cleaned.findIndex(
          (u) =>
            u.email.toLowerCase() === 'demo9090' ||
            u.id === 'user_demo9090'
        );
        if (demoIdx === -1) {
          const demoUser = DEFAULT_USERS.find((u) => u.email === 'demo9090');
          if (demoUser) cleaned.push(demoUser);
        } else {
          cleaned[demoIdx] = {
            ...cleaned[demoIdx],
            email: 'demo9090',
            password: 'demo9090',
            status: 'active',
            validityPlan: 'lifetime',
          };
        }

        // Ensure upifree92@gmail.com user exists in the list for admin activation
        const upiUserIdx = cleaned.findIndex((u) => u.email.toLowerCase() === 'upifree92@gmail.com');
        if (upiUserIdx === -1) {
          const upiDefault = DEFAULT_USERS.find((u) => u.email === 'upifree92@gmail.com');
          if (upiDefault) cleaned.push(upiDefault);
        }

        // Clean "free" from user names if present
        cleaned = cleaned.map((u) => {
          if (u.name && /\bfree\b/i.test(u.name)) {
            const newName = u.name.replace(/\bfree\b/gi, '').replace(/\s+/g, ' ').trim() || 'Upi';
            return { ...u, name: newName };
          }
          return u;
        });

        return cleaned;
      }
    }
  } catch (err) {
    console.error('Failed to load registered users:', err);
  }
  // Initialize default users if not found
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  } catch {
    // ignore
  }
  return DEFAULT_USERS;
}

export function saveRegisteredUsers(users: RegisteredUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users:', err);
  }
}

export function updateUserAccountName(
  userIdOrEmail: string,
  newBusinessName: string,
  newCustomerName?: string
): { success: boolean; user?: RegisteredUser } {
  const users = getRegisteredUsers();
  const clean = userIdOrEmail.trim().toLowerCase();
  const idx = users.findIndex(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.id === userIdOrEmail ||
      (u.phone && u.phone.toLowerCase() === clean)
  );
  if (idx === -1) {
    return { success: false };
  }
  if (newBusinessName.trim()) {
    users[idx].businessName = newBusinessName.trim();
  }
  if (newCustomerName && newCustomerName.trim()) {
    users[idx].name = newCustomerName.trim();
  }
  saveRegisteredUsers(users);
  return { success: true, user: users[idx] };
}

export function getUserByEmail(emailOrId: string): RegisteredUser | undefined {
  const users = getRegisteredUsers();
  const clean = emailOrId.trim().toLowerCase();
  return users.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.id === emailOrId ||
      (u.phone && u.phone.toLowerCase() === clean)
  );
}

export function getUserConfigKey(userEmailOrId: string): string {
  return `upi_user_config_${userEmailOrId.trim().toLowerCase()}`;
}

export function saveUserCustomConfig(
  userEmailOrId: string,
  newConfig: Partial<MerchantConfig>
): void {
  if (!userEmailOrId) return;
  const clean = userEmailOrId.trim().toLowerCase();

  // 1. Per-user distinct localStorage persistence
  try {
    const key = getUserConfigKey(clean);
    const existingRaw = localStorage.getItem(key);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const merged = { ...existing, ...newConfig };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save user custom config to localStorage', e);
  }

  // 2. Also permanently update RegisteredUser store for this user ID
  const users = getRegisteredUsers();
  const idx = users.findIndex(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.id === userEmailOrId ||
      (u.phone && u.phone.toLowerCase() === clean)
  );
  if (idx !== -1) {
    if (newConfig.storeName !== undefined && newConfig.storeName.trim()) {
      users[idx].businessName = newConfig.storeName.trim();
    }
    if (newConfig.upiId !== undefined && newConfig.upiId.trim()) {
      users[idx].upiId = newConfig.upiId.trim();
    }
    if (newConfig.extraPercentage !== undefined) {
      users[idx].extraPercentage = Number(newConfig.extraPercentage);
    }
    if (newConfig.isExtraEnabled !== undefined) {
      users[idx].isExtraEnabled = Boolean(newConfig.isExtraEnabled);
    }
    saveRegisteredUsers(users);
  }
}

export function getUserSavedConfig(userEmailOrId: string): Partial<MerchantConfig> | null {
  if (!userEmailOrId) return null;
  const clean = userEmailOrId.trim().toLowerCase();

  let perUserLocal: Partial<MerchantConfig> | null = null;
  try {
    const key = getUserConfigKey(clean);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        perUserLocal = parsed;
      }
    }
  } catch {
    // ignore
  }

  // Also read from RegisteredUser record
  const user = getUserByEmail(clean);
  const userObjConfig: Partial<MerchantConfig> = {};
  if (user) {
    if (user.businessName) userObjConfig.storeName = user.businessName;
    if (user.upiId) userObjConfig.upiId = user.upiId;
    if (user.extraPercentage !== undefined) userObjConfig.extraPercentage = user.extraPercentage;
    if (user.isExtraEnabled !== undefined) userObjConfig.isExtraEnabled = user.isExtraEnabled;
  }

  const merged = { ...userObjConfig, ...(perUserLocal || {}) };
  if (Object.keys(merged).length > 0) {
    return merged;
  }
  return null;
}

export function registerCustomer(params: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessName?: string;
  role?: UserRole;
  status?: 'active' | 'pending';
  validityPlan?: ValidityPlan;
}): { success: boolean; error?: string; user?: RegisteredUser } {
  const users = getRegisteredUsers();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim();

  if (!cleanName) {
    return { success: false, error: 'Customer Name is required' };
  }
  if (!cleanEmail) {
    return { success: false, error: 'Email / Username is required' };
  }
  if (!params.password || params.password.length < 3) {
    return { success: false, error: 'Password must be at least 3 characters' };
  }

  // Check duplicate
  const exists = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return {
      success: false,
      error: `User "${cleanEmail}" is already registered. Please log in instead.`,
    };
  }

  const assignedPlan: ValidityPlan = params.validityPlan || '1_month';
  const { validFrom, validUntil } = calculateValidityExpiry(assignedPlan);

  const newUser: RegisteredUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    email: cleanEmail,
    password: params.password,
    phone: params.phone?.trim() || '',
    businessName: params.businessName?.trim() || '',
    role: params.role || 'customer',
    // Default to pending so admin can approve and activate the customer account
    status: params.status || 'pending',
    validityPlan: assignedPlan,
    validFrom,
    validUntil,
    registeredAt: new Date().toISOString(),
    isNotificationRead: false,
  };

  const updated = [newUser, ...users];
  saveRegisteredUsers(updated);

  return { success: true, user: newUser };
}

export function updateUserPassword(
  userIdOrEmail: string,
  newPassword: string
): { success: boolean; user?: RegisteredUser; error?: string } {
  if (!newPassword || newPassword.trim().length < 3) {
    return { success: false, error: 'Password must be at least 3 characters long' };
  }
  const cleanPass = newPassword.trim();
  const users = getRegisteredUsers();
  const clean = userIdOrEmail.trim().toLowerCase();
  const idx = users.findIndex(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.id === userIdOrEmail ||
      (u.phone && u.phone.toLowerCase() === clean)
  );

  if (idx === -1) {
    return { success: false, error: 'User not found' };
  }

  users[idx].password = cleanPass;
  saveRegisteredUsers(users);

  // If saved credentials in localStorage match this user, update them
  try {
    const raw = localStorage.getItem('upi_saved_login_credentials_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed.username &&
        (parsed.username.toLowerCase() === users[idx].email.toLowerCase() ||
          parsed.username.toLowerCase() === clean)
      ) {
        localStorage.setItem(
          'upi_saved_login_credentials_v1',
          JSON.stringify({ ...parsed, password: cleanPass })
        );
      }
    }
  } catch {}

  return { success: true, user: users[idx] };
}

export function authenticateUser(
  identifier: string,
  pass: string
): {
  success: boolean;
  user?: RegisteredUser;
  error?: string;
  isAdmin?: boolean;
} {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  // Query registered users first to honor any changed passwords
  const users = getRegisteredUsers();
  const matched = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (cleanId === 'demo9090' && u.email.toLowerCase() === 'demo9090') ||
      (cleanId === 'demo9090@gmail.com' && u.email.toLowerCase() === 'demo9090') ||
      u.email.toLowerCase() === `${cleanId}@gmail.com` ||
      (cleanId.endsWith('@gmail.com') && u.email.toLowerCase() === cleanId.replace('@gmail.com', '')) ||
      (u.phone && u.phone.toLowerCase() === cleanId)
  );

  // If found in store
  if (matched) {
    if (matched.password !== cleanPass) {
      return {
        success: false,
        error: 'Incorrect password. Please try again or ask Admin to reset it.',
      };
    }

    if (matched.status === 'pending') {
      return {
        success: false,
        error: `Account Activation Pending: Aapka Gmail / Account (${matched.email}) abhi Admin validation ke liye pending hai. Admin dwara Admin Panel se Activate hone ke baad login karein.`,
      };
    }

    if (matched.status === 'rejected') {
      return {
        success: false,
        error: 'Your account has been rejected or disabled by the Administrator.',
      };
    }

    // Expiry check for active users
    if (matched.status === 'active') {
      const validity = getUserValidityInfo(matched);
      if (validity.isExpired) {
        return {
          success: false,
          error: `Your account validity (${validity.planLabel}) expired on ${validity.formattedExpiry}. Please contact the Administrator to renew for 1 Month, 3 Months, 6 Months, or 1 Year.`,
        };
      }
    }

    return {
      success: true,
      user: matched,
      isAdmin:
        matched.role === 'admin' ||
        matched.email.toLowerCase() === 'kgfilewala@gmail.com',
    };
  }

  // Fallback 1: Direct super-admin check if not found in list
  if (cleanId === 'kgfilewala@gmail.com' && cleanPass === 'bbbb@9090') {
    return {
      success: true,
      isAdmin: true,
      user: {
        id: 'admin_kgfilewala',
        name: 'Super Admin',
        email: 'kgfilewala@gmail.com',
        password: 'bbbb@9090',
        role: 'admin',
        status: 'active',
        validityPlan: 'lifetime',
        validUntil: new Date(Date.now() + 86400000 * 3650).toISOString(),
        validFrom: new Date(Date.now() - 86400000 * 30).toISOString(),
        registeredAt: new Date().toISOString(),
        isNotificationRead: true,
      },
    };
  }

  // Fallback 2: Direct demo9090 customer check if not found
  if ((cleanId === 'demo9090' || cleanId === 'demo9090@gmail.com') && cleanPass === 'demo9090') {
    return {
      success: true,
      isAdmin: false,
      user: {
        id: 'user_demo9090',
        name: 'Demo User',
        email: 'demo9090',
        password: 'demo9090',
        phone: '9090909090',
        businessName: 'Demo Store',
        role: 'customer' as const,
        status: 'active' as const,
        validityPlan: 'lifetime' as const,
        validUntil: new Date(Date.now() + 86400000 * 3650).toISOString(),
        validFrom: new Date(Date.now() - 86400000 * 30).toISOString(),
        registeredAt: new Date().toISOString(),
        isNotificationRead: true,
      },
    };
  }

  return {
    success: false,
    error: 'Account not found. Please check credentials or Register a new account.',
  };
}

export function updateUserValidity(
  userId: string,
  plan: ValidityPlan,
  extendFromExisting: boolean = false
): { success: boolean; user?: RegisteredUser; error?: string } {
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { success: false, error: 'User not found' };

  const existing = users[index];
  let baseDate: Date | undefined = undefined;

  // If extending from an existing non-expired date
  if (extendFromExisting && existing.validUntil) {
    const existingDate = new Date(existing.validUntil);
    if (existingDate.getTime() > Date.now()) {
      baseDate = existingDate;
    }
  }

  const { validFrom, validUntil } = calculateValidityExpiry(plan, baseDate);

  users[index] = {
    ...existing,
    status: 'active', // Validating / renewing automatically marks user as active
    validityPlan: plan,
    validFrom: existing.validFrom || validFrom,
    validUntil,
  };

  saveRegisteredUsers(users);
  return { success: true, user: users[index] };
}

export function updateUserStatus(
  userId: string,
  newStatus: 'active' | 'pending' | 'rejected',
  defaultPlan: ValidityPlan = '1_month'
): boolean {
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  const existing = users[index];

  // If activating and user has no validUntil or is expired, assign validity
  if (newStatus === 'active') {
    const validity = getUserValidityInfo(existing);
    if (validity.isExpired || !existing.validUntil) {
      const plan = existing.validityPlan || defaultPlan;
      const { validFrom, validUntil } = calculateValidityExpiry(plan);
      users[index] = {
        ...existing,
        status: newStatus,
        validityPlan: plan,
        validFrom: existing.validFrom || validFrom,
        validUntil,
      };
      saveRegisteredUsers(users);
      return true;
    }
  }

  users[index] = {
    ...existing,
    status: newStatus,
  };
  saveRegisteredUsers(users);
  return true;
}

export function deleteRegisteredUser(userId: string): boolean {
  const users = getRegisteredUsers();
  const filtered = users.filter((u) => u.id !== userId);
  saveRegisteredUsers(filtered);
  return true;
}

export function markAllNotificationsRead(): void {
  const users = getRegisteredUsers();
  const updated = users.map((u) => ({ ...u, isNotificationRead: true }));
  saveRegisteredUsers(updated);
}

export function getUnreadRegistrationCount(): number {
  const users = getRegisteredUsers();
  return users.filter(
    (u) =>
      !u.isNotificationRead &&
      u.email.toLowerCase() !== 'kgfilewala@gmail.com' &&
      u.email.toLowerCase() !== 'demo11' &&
      u.role !== 'admin'
  ).length;
}
