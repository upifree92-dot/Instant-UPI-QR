import { RegisteredUser, UserRole, ValidityPlan } from '../types';

const USERS_STORAGE_KEY = 'upi_registered_users_v4';

export const VALIDITY_PLANS: {
  id: ValidityPlan;
  label: string;
  shortLabel: string;
  days: number;
  months: number;
  description: string;
}[] = [
  { id: '1_month', label: '1 Month', shortLabel: '1M', days: 30, months: 1, description: '30 Days Access' },
  { id: '3_months', label: '3 Months', shortLabel: '3M', days: 90, months: 3, description: '90 Days Access' },
  { id: '6_months', label: '6 Months', shortLabel: '6M', days: 180, months: 6, description: '180 Days Access' },
  { id: '1_year', label: '1 Year', shortLabel: '1Y', days: 365, months: 12, description: '365 Days Access' },
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
    user.email.toLowerCase() === 'demo11' ||
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
    id: 'user_admin_demo',
    name: 'Super Admin',
    email: 'demo11',
    password: 'demo11',
    role: 'admin',
    status: 'active',
    validityPlan: 'lifetime',
    validUntil: new Date(Date.now() + 86400000 * 3650).toISOString(),
    validFrom: new Date(Date.now() - 86400000 * 30).toISOString(),
    registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isNotificationRead: true,
  },
  {
    id: 'user_merchant_demo',
    name: 'Ramesh Sharma (Demo Merchant)',
    email: 'demo@gmail.com',
    password: 'demo',
    phone: '9876543210',
    businessName: 'Sharma General Store',
    role: 'merchant',
    status: 'active',
    validityPlan: '1_year',
    validUntil: oneYearOut.toISOString(),
    validFrom: new Date(Date.now() - 86400000).toISOString(),
    registeredAt: new Date(Date.now() - 86400000).toISOString(),
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
    status: 'pending',
    validityPlan: '1_month',
    validUntil: oneMonthOut.toISOString(),
    validFrom: new Date().toISOString(),
    registeredAt: new Date(Date.now() - 1800000).toISOString(),
    isNotificationRead: false,
  },
];

export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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
    // Default to active so user can immediately use or be validated in admin
    status: params.status || 'active',
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

  // 1. Direct super-admin check
  if (cleanId === 'demo11' && cleanPass === 'demo11') {
    return {
      success: true,
      isAdmin: true,
      user: {
        id: 'admin_demo11',
        name: 'Super Admin',
        email: 'demo11',
        password: 'demo11',
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

  // 2. Query registered users
  const users = getRegisteredUsers();
  const matched = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.phone && u.phone.toLowerCase() === cleanId)
  );

  if (!matched) {
    return {
      success: false,
      error: 'Account not found. Please check credentials or Register a new account.',
    };
  }

  if (matched.password !== cleanPass) {
    return {
      success: false,
      error: 'Incorrect password. Please try again.',
    };
  }

  if (matched.status === 'pending') {
    return {
      success: false,
      error: 'Your account is pending Admin Validation. Please ask the Administrator to approve your account in the Admin Panel.',
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
    isAdmin: matched.role === 'admin' || matched.email.toLowerCase() === 'demo11',
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
  return users.filter((u) => !u.isNotificationRead && u.email !== 'demo11').length;
}
