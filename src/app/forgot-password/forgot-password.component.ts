import { Component, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "../services/auth.service";

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: 'forgot-password.component.html',
})

export class ForgotPasswordComponent {
    email = '';
    errorMessage = '';
    successMessage = '';
    loading = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}
    async resetPassword(event:Event) {
        event.preventDefault();
        this.errorMessage = '';
        this.successMessage = '';

        if (!this.email) {
            this.errorMessage = 'Email is required'
            return;
        }
        try {
            await this.authService.forgotPassword(this.email);
            this.successMessage = 'Password reset email has been sent';
            this.cdr.detectChanges();
        }catch (error: any) {
            this.errorMessage = error.message;
            this.cdr.detectChanges();
        }
        this.loading = false;
    }
    goToLogin() {
        this.router.navigate(['/login']);
    }
}