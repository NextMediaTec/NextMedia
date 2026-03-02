import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { User, onAuthStateChanged } from 'firebase/auth';

import { FirebaseService } from '../services/firebase.service';
import { UserProfileService } from '../services/user-profile.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfile implements OnInit {
  user: User | null = null;

  currentUsername: string = 'Not set';
  currentEmail: string = 'Not set';
  currentRole: string = 'Not set';
  currentCreatedAt: string = 'Not set';

  newUsername: string = '';

  newPassword: string = '';
  confirmPassword: string = '';

  isChangePassword: boolean = false;
  isChangeUsername: boolean = false;
  isChangeProfilePic: boolean = false;

  defaultAvatarId: string = 'avatar-01';
  currentAvatarId: string = 'avatar-01';

  avatarOptions: { id: string; src: string }[] = [
    { id: 'avatar-01', src: '/assets/avatars/cat.png' },
    { id: 'avatar-02', src: 'assets/avatars/dog.png' },
    { id: 'avatar-03', src: 'assets/avatars/fox.png' },
    { id: 'avatar-04', src: 'assets/avatars/lion.png' },
    { id: 'avatar-05', src: 'assets/avatars/tiger.png' },
    { id: 'avatar-06', src: 'assets/avatars/elefant.png' },
    { id: 'avatar-07', src: 'assets/avatars/monkey.png' },
    { id: 'avatar-08', src: 'assets/avatars/panda.png' },
    { id: 'avatar-09', src: 'assets/avatars/pinguin.png' },
    { id: 'avatar-10', src: 'assets/avatars/rabbit.png' }
  ];

  constructor(
    private firebaseService: FirebaseService,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit(): void {
    this.optionChangeUsername();

    onAuthStateChanged(this.firebaseService.auth, async (user: User | null) => {
      if (!user) return;

      this.user = user;

      try {
        const profile = await this.userProfileService.getMyProfile();

        this.currentUsername = profile?.username || 'Not set';
        this.currentEmail = profile?.email || 'Not set';
        this.currentRole = profile?.role || 'Not set';
        this.currentCreatedAt = profile?.createdAt || 'Not set';

        const ensuredAvatarId = await this.userProfileService.ensureMyAvatarIdExists(this.defaultAvatarId);

        if (this.isAvatarIdValid(ensuredAvatarId)) {
          this.currentAvatarId = ensuredAvatarId;
        } else {
          this.currentAvatarId = this.defaultAvatarId;
          await this.userProfileService.setMyAvatarId(this.defaultAvatarId);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }

      this.optionChangeUsername();
    });
  }

  optionChangePassword(): void {
    this.isChangePassword = true;
    this.isChangeUsername = false;
    this.isChangeProfilePic = false;
  }

  optionChangeUsername(): void {
    this.isChangeUsername = true;
    this.isChangePassword = false;
    this.isChangeProfilePic = false;
  }

  optionChangeProfilePic(): void {
    this.isChangeProfilePic = true;
    this.isChangePassword = false;
    this.isChangeUsername = false;
  }

  updatePassword(event: any): void {
    this.newPassword = event.target.value;
  }

  updateConfirmPassword(event: any): void {
    this.confirmPassword = event.target.value;
  }

  async submitNewPassword(): Promise<void> {
    if (this.newPassword !== this.confirmPassword) {
      console.log('Passwords do not match');
      return;
    }

    try {
      await this.userProfileService.changeMyPassword(this.newPassword);
      alert('Password updated successfully');
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (error) {
      console.error('Error updating password:', error);
    }
  }

  updateUsername(event: any): void {
    this.newUsername = event.target.value;
  }

  async submitNewUsername(): Promise<void> {
    try {
      await this.userProfileService.changeMyUsername(this.newUsername);
      alert('Username updated successfully!');
      this.currentUsername = this.newUsername;
      this.newUsername = '';
    } catch (error: any) {
      if (error?.message) {
        alert(error.message);
      } else {
        console.error('Error updating username:', error);
      }
    }
  }

  async selectAvatar(avatarId: string): Promise<void> {
    const valid = this.isAvatarIdValid(avatarId);
    if (!valid) return;

    this.currentAvatarId = avatarId;

    try {
      await this.userProfileService.setMyAvatarId(avatarId);
    } catch (err) {
      console.error('Error updating avatarId:', err);
    }
  }

  getAvatarSrcById(avatarId: string): string {
    const found = this.avatarOptions.find(a => a.id === avatarId);
    if (found) return found.src;

    const fallback = this.avatarOptions.find(a => a.id === this.defaultAvatarId);
    if (fallback) return fallback.src;

    return 'assets/avatars/avatar-01.png';
  }

  private isAvatarIdValid(avatarId: string): boolean {
    return this.avatarOptions.some(a => a.id === avatarId);
  }
}