// =====================================================
// WORK AREA FACTORY - Route to appropriate work area
// =====================================================

// src/components/dashboard/WorkAreaFactory.tsx

import AdminWorkArea from './admin/AdminWorkArea';
import GroupWorkArea from './group/GroupWorkArea';
// import GroupAdminWorkArea from './group/GroupAdminWorkArea';
import MemberWorkArea from './member/MemberWorkArea';
import SysadminWorkArea from './sysadmin/SysadminWorkArea';
import { DashboardType } from './types';

export function getWorkAreaComponent(type: DashboardType) {
  switch (type) {
    case 'member':
      return MemberWorkArea;
    case 'admin':
      return AdminWorkArea;
    case 'groupAdmin':
      return GroupWorkArea;
    case 'sysadmin':
      return SysadminWorkArea;
    default:
      return MemberWorkArea;
  }
}