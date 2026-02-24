import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "../services/auth.service";

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './login.component.html',
    // styleUrls: ['./login.component.scss']
})
export class LoginComponent {

    email = '';
    password = '';
    errorMessage = '';

    constructor(
        private authService: AuthService,
        private router: Router
    ){}

    async login(event: Event) {
        event.preventDefault();
        this.errorMessage = '';

        if (!this.email || !this.password) {
            this.errorMessage = 'All fields are required';
            return;
        }
        try {
            await this.authService.login(this.email, this.password);
            this.router.navigate(['/home']);
        } catch (error: any) {
            this.errorMessage = error.message;
        }
    }

    goToRegister() {
        this.router.navigate(['/register']);
    }
}