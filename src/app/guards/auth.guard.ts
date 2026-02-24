import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(private router: Router) {}

    canActivate(): Promise<boolean> {
        const auth = getAuth();

        return new Promise(resolve => {
            const unsubscribe = onAuthStateChanged(auth, user => {
                unsubscribe();

                if (user) {
                    resolve(true);
                }else {
                    this.router.navigate(['/login']);
                    resolve(false);
                }
            });
        });
    }
}