import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser, UserRole } from '../services/admin.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-adminpage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adminpage.html',
  styleUrl: './adminpage.scss',
})
export class Adminpage implements OnInit {

  users: AdminUser[] = [];
  admins: AdminUser[] = [];
  moderators: AdminUser[] = [];
  regularUsers: AdminUser[] = [];

  searchQuery: string = ''
  isLoading: boolean = true;
  errorMessage: string = '';
  succesMessage: string = '';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchUsers();
  }
  async fetchUsers(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.succesMessage = '';

    try {

      this.users = await this.adminService.getAllUsers();

      let filteredUsers = [...this.users];

      if(this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim();

        filteredUsers = filteredUsers.filter(user =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }

      this.admins = filteredUsers.filter(user => user.role === 'admin');
      this.moderators = filteredUsers.filter(user => user.role === 'moderator');
      this.regularUsers = filteredUsers.filter(user => user.role === 'user');
    }catch (error) {
      console.error('Failed to fetch users: ', error);
      this.errorMessage = 'Could not load users.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
    async onRoleChange(user: AdminUser, event: Event): Promise<void> {
      const selectElement = event.target as HTMLSelectElement;
      const newRole = selectElement.value as UserRole;

      if (user.role === newRole) {
        return;
      }

      try {
        await this.adminService.updateUserRole(user.uid, newRole);
        this.succesMessage = `Role updated for ${user.username}.`;
        await this.fetchUsers();
        this.cdr.detectChanges();
      }catch (error) {
        console.error('Failed to update role: ', error);
        this.errorMessage = 'Could not update user role.';
      }
    }
    async deleteUser(user: AdminUser): Promise<void> {
      const confirmed = confirm(`Are you sure you want to delete ${user.username}?`);

      if (!confirmed) {
        return;
      }
      try {
        await this.adminService.deleteUser(user.uid);
        this.succesMessage = `${user.username} was deleted from the database.`;
        await this.fetchUsers();
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Failed to delete user: ', error);
        this.errorMessage = 'Could not delete user';
      }
    }

    onSearchInput(): void {
      this.fetchUsers();
    }

    formatCreatedAt(value: number | string | undefined): string {
      if (!value) {
        return 'Unknown';
      }
      
      if (typeof value === 'number') {
        return new Date(value).toLocaleString();
      }
      return new Date(value).toLocaleString();
    }

}
