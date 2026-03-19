import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivate {

    constructor(private router: Router) {}

    canActivate(): Promise<boolean> {
        const auth = getAuth();
        const db = getDatabase();

        return new Promise(resolve => {
            const unsubscribe = onAuthStateChanged(auth, async user => {
                unsubscribe();

                if (!user) {
                    this.router.navigate(['/login']);
                    resolve(false);
                    return;
                }

                try {
                    const userRef = ref(db, `users/${user.uid}`);
                    const snapshot = await get(userRef);

                    if (!snapshot.exists()) {
                        this.router.navigate(['/dashboard']);
                        resolve(false);
                        return;
                    }
                    const userData = snapshot.val();
                    
                    if (userData?.role === 'admin') {
                        resolve(true);
                    } else {
                        this.router.navigate(['/dashboard']);
                        resolve(false);
                    }
                } catch (error) {
                    console.error('Admin guard error:', error);
                    this.router.navigate(['/dashboard']);
                    resolve(false);
                }
            });
        });
    }

}