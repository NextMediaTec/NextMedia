import { Injectable } from "@angular/core";
import { get, ref, remove, update} from 'firebase/database';
import { FirebaseService } from "./firebase.service";

export type UserRole = 'user' | 'moderator' | 'admin';

export interface AdminUser {
    uid: string;
    username: string;
    email: string;
    avatarId?: string;
    createdAt?: number | string;
    isPrivate?: boolean;
    role: UserRole;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    constructor(private firebase: FirebaseService) {}

    async getAllUsers(): Promise<AdminUser[]> {
        const usersRef = ref(this.firebase.db, 'users');
        const snapshot = await get(usersRef);

        if (!snapshot.exists()) {
            return[];
        }
        const data = snapshot.val();

        return Object.keys(data).map((uid) => ({
            uid,
            username: data[uid]?.username ?? 'Ukendt',
            email: data[uid]?.email ?? '',
            avatarId: data[uid]?.avatarId ?? 'avatar-01',
            createdAt: data[uid]?.createdAt ?? null,
            isPrivate: data[uid]?.isPrivate ?? false,
            role: data[uid]?.role ?? 'user'
        }));
    }
    async updateUserRole(uid: string, role: UserRole): Promise<void> {
        const userRef = ref(this.firebase.db, `users/${uid}`);
        await update(userRef, { role });
    }
    async deleteUser(uid: string): Promise<void> {
        const userRef = ref(this.firebase.db, `users/${uid}`);
        await remove(userRef);
    }
}