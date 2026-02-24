import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "../services/auth.service";

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './register.component.html',
    // styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

    email = '';
    username = '';
    password = '';
    confirmPassword = '';
    errorMessage = '';
    loading = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ){}

    async register(event: Event) {
        event.preventDefault();
        this.errorMessage = '';

        if (!this.email || !this.username || !this.password || !this.confirmPassword) {
            this.errorMessage = 'All fields are required';
            return;
        }
        
        if (this.password !== this.confirmPassword) {
            this.errorMessage = 'Passwords do not match';
            return;
        }

        try {
            this.loading = true;

            await this.authService.register(
                this.email,
                this.password,
                this.username
            );
            this.router.navigate(['/home']);
        } catch (error: any) {
            this.errorMessage = error.message;
        }finally {
            this.loading = false;
        }
    }
    goToLogin() {
        this.router.navigate(['/login']);
    }
}