import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserManagementPage } from './user-management.page';
import { AdminService } from '../services/admin.service';
import { of, throwError } from 'rxjs';

describe('UserManagementPage', () => {
  let component: UserManagementPage;
  let fixture: ComponentFixture<UserManagementPage>;
  let adminService: AdminService;

  const mockUsers = [
    {
      id: 1,
      email: 'user1@example.com',
      role: 'user',
      createdAt: '2025-12-20T10:00:00Z',
      blocked_at: null,
    },
    {
      id: 2,
      email: 'user2@example.com',
      role: 'user',
      createdAt: '2025-12-20T09:00:00Z',
      blocked_at: '2025-12-20T10:30:00Z',
    },
  ];

  beforeEach(async () => {
    const mockAdminService = {
      getAllUsers: jest.fn(),
      searchUsers: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UserManagementPage],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementPage);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load users on init', () => {
      jest.spyOn(adminService, 'getAllUsers').mockReturnValue(
        of({ data: mockUsers, total: 2, limit: 50, offset: 0 }),
      );

      component.ngOnInit();

      expect(component.users).toEqual(mockUsers);
      expect(component.loading).toBe(false);
    });

    it('should handle loading error', () => {
      jest.spyOn(adminService, 'getAllUsers').mockReturnValue(
        throwError(() => new Error('Failed to load users')),
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component.ngOnInit();

      expect(component.loading).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('loadUsers', () => {
    it('should fetch and set users', () => {
      jest.spyOn(adminService, 'getAllUsers').mockReturnValue(
        of({ data: mockUsers, total: 2, limit: 50, offset: 0 }),
      );

      component.loadUsers();

      expect(component.users).toEqual(mockUsers);
      expect(component.loading).toBe(false);
    });
  });

  describe('searchUsers', () => {
    it('should search users by email', () => {
      jest.spyOn(adminService, 'searchUsers').mockReturnValue(of([mockUsers[0]]));
      component.searchEmail = 'user1@example.com';

      component.searchUsers();

      expect(component.users).toEqual([mockUsers[0]]);
      expect(component.isSearching).toBe(false);
      expect(adminService.searchUsers).toHaveBeenCalledWith('user1@example.com');
    });

    it('should reload all users when search email is empty', () => {
      jest.spyOn(component, 'loadUsers');
      component.searchEmail = '';

      component.searchUsers();

      expect(component.loadUsers).toHaveBeenCalled();
    });

    it('should handle search error', () => {
      jest.spyOn(adminService, 'searchUsers').mockReturnValue(
        throwError(() => new Error('Search failed')),
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      component.searchEmail = 'test@example.com';

      component.searchUsers();

      expect(component.isSearching).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('blockUser', () => {
    it('should block user after confirmation', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(adminService, 'blockUser').mockReturnValue(
        of({ message: 'User blocked successfully', userId: 1 }),
      );
      jest.spyOn(component, 'loadUsers');

      component.blockUser(1);

      expect(adminService.blockUser).toHaveBeenCalledWith(1);
      expect(component.loadUsers).toHaveBeenCalled();
    });

    it('should not block user if confirmation cancelled', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      component.blockUser(1);

      expect(adminService.blockUser).not.toHaveBeenCalled();
    });

    it('should handle block error', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(adminService, 'blockUser').mockReturnValue(
        throwError(() => new Error('Block failed')),
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component.blockUser(1);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('unblockUser', () => {
    it('should unblock user after confirmation', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(adminService, 'unblockUser').mockReturnValue(
        of({ message: 'User unblocked successfully', userId: 2 }),
      );
      jest.spyOn(component, 'loadUsers');

      component.unblockUser(2);

      expect(adminService.unblockUser).toHaveBeenCalledWith(2);
      expect(component.loadUsers).toHaveBeenCalled();
    });

    it('should not unblock user if confirmation cancelled', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      component.unblockUser(2);

      expect(adminService.unblockUser).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user after confirmation', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(adminService, 'deleteUser').mockReturnValue(
        of({ message: 'User deleted successfully', userId: 1 }),
      );
      jest.spyOn(component, 'loadUsers');

      component.deleteUser(1);

      expect(adminService.deleteUser).toHaveBeenCalledWith(1);
      expect(component.loadUsers).toHaveBeenCalled();
    });

    it('should not delete user if confirmation cancelled', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      component.deleteUser(1);

      expect(adminService.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('isUserBlocked', () => {
    it('should return true for blocked users', () => {
      const blockedUser = { ...mockUsers[1] };

      const result = component.isUserBlocked(blockedUser);

      expect(result).toBe(true);
    });

    it('should return false for unblocked users', () => {
      const unblocked = { ...mockUsers[0] };

      const result = component.isUserBlocked(unblocked);

      expect(result).toBe(false);
    });
  });
});
