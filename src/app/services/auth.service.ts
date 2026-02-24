import { Injectable } from "@angular/core";
import { FirebaseService } from "./firebase.service";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import {ref, set} from 'firebase/database';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    currentUser: User | null = null;

    constructor(private firebase: FirebaseService){}

    async register(email: string, password: string){
        const cred = await createUserWithEmailAndPassword(this.firebase.auth, email, password);

        await set(ref(this.firebase.db, 'users/' + cred.user.uid), {
            email,
            createdAt: Date.now(),
            isPrivate: false
        });

        return cred.user;
    }
    async login(email: string, password: string) {
        const cred = await signInWithEmailAndPassword(this.firebase.auth, email, password);
        return cred.user;
    }
    logout() {
        return signOut(this.firebase.auth);
    }
}
