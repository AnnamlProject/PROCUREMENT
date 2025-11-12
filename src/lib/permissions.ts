export const PERMISSIONS = {
  PR_CREATE: 'pr.create',
  PR_READ: 'pr.read',
  PR_UPDATE: 'pr.update',
  PR_SUBMIT: 'pr.submit',
  PR_APPROVE: 'pr.approve',
  RFQ_CREATE: 'rfq.create',
  RFQ_READ: 'rfq.read',
  RFQ_APPROVE: 'rfq.approve',
  PO_CREATE: 'po.create',
  PO_READ: 'po.read',
  PO_RELEASE: 'po.release',
  GRN_CREATE: 'grn.create',
  GRN_POST: 'grn.post',
  SES_CREATE: 'ses.create',
  SES_ACCEPT: 'ses.accept',
  INVOICE_CREATE: 'invoice.create',
  INVOICE_APPROVE: 'invoice.approve',
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_EXECUTE: 'payment.execute',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface UserProfile {
  id: string;
  name: string;
  roles: string[];
  permissions: Permission[];
}

export const USER_PROFILES: Record<string, UserProfile> = {
  requester: {
    id: 'user-1',
    name: 'Staff Requester',
    roles: ['Requester'],
    permissions: [PERMISSIONS.PR_CREATE, PERMISSIONS.PR_READ],
  },
  approver: {
    id: 'user-2',
    name: 'Manager Approval',
    roles: ['Approver'],
    permissions: [PERMISSIONS.PR_READ, PERMISSIONS.PR_APPROVE, PERMISSIONS.PO_READ, PERMISSIONS.INVOICE_APPROVE],
  },
  admin: {
    id: 'user-admin',
    name: 'Admin Pengadaan',
    roles: ['Admin'],
    permissions: Object.values(PERMISSIONS),
  }
};


interface CheckPermissionsParams {
    can?: string;
    any?: string[];
    all?: string[];
}

/**
 * Checks if a user's permissions satisfy the given requirements.
 * @param userPermissions - The array of permissions the user has.
 * @param {CheckPermissionsParams} params - The permission requirements.
 * @returns {boolean} - True if the user has the required permissions, false otherwise.
 */
export const checkPermissions = (userPermissions: string[], { can, any, all }: CheckPermissionsParams): boolean => {
    if (can) {
      return userPermissions.includes(can);
    }
  
    if (any) {
      return any.some(perm => userPermissions.includes(perm));
    }
  
    if (all) {
      return all.every(perm => userPermissions.includes(perm));
    }
  
    // If no permission requirement is specified, default to allowing access.
    // In a real app, you might want to default to false for security.
    return true; 
};
