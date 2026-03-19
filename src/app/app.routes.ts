import { Route } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { DashboardComponent } from './dashboard/dashboard';
import { UserProfile } from './user-profile/user-profile';
import { ShowMovieComponent } from './show-movie/show-movie';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { AdminGuard } from './guards/admin.guard';
import { Adminpage } from './adminpage/adminpage';



export const routes: Route[] = [

    { path: 'show-movie/:mediaType/:id', component: ShowMovieComponent },
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'register', component: RegisterComponent},
    {path: 'login', component: LoginComponent},
    {path: 'home', component: HomeComponent, canActivate: [AuthGuard]},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'profile', component: UserProfile, canActivate: [AuthGuard]},
    {path: 'profile/:uid', component: UserProfile, canActivate: [AuthGuard]},
    {path: 'forgot-password', component: ForgotPasswordComponent},
    {path: 'admin', component: Adminpage, canActivate: [AdminGuard]}

];