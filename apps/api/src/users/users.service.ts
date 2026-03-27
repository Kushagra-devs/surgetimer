import { Injectable } from '@nestjs/common';
import { addAudit, demoStore } from '../common/demo-store';
import type { AppUser, AppUserRole } from '@horse-timer/types';

@Injectable()
export class UsersService {
  list() {
    return demoStore.users;
  }

  create(body: Partial<AppUser>) {
    const user: AppUser = {
      id: `user-${Date.now()}`,
      name: body.name ?? 'New User',
      email: body.email ?? `user-${Date.now()}@surgetimer.local`,
      role: (body.role as AppUserRole) ?? 'VIEWER',
      status: body.status ?? 'INVITED',
    };
    demoStore.users.unshift(user);
    addAudit('USER_CREATED', 'USER', user.id);
    return user;
  }

  update(id: string, body: Partial<AppUser>) {
    const user = demoStore.users.find((item) => item.id === id);
    if (!user) {
      return null;
    }
    Object.assign(user, body);
    addAudit('USER_UPDATED', 'USER', id);
    return user;
  }
}

