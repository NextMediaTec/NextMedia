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


import { BrowseByGenreMovies } from './Components/browse-by-genre-movies/browse-by-genre-movies';
import { BrowseByGenreSeries } from './Components//browse-by-genre-series/browse-by-genre-series';
import { CelebsBornToday } from './Components//celebs-born-today/celebs-born-today';
import { MostPopularCeleb } from './Components//most-popular-celeb/most-popular-celeb';
import { MostPopularMovies } from './Components//most-popular-movies/most-popular-movies';
import { MostPopularSeries } from './Components//most-popular-series/most-popular-series';
import { ReleaseCalenderMovies } from './Components//release-calender-movies/release-calender-movies';
import { ReleaseCalenderSeries } from './Components//release-calender-series/release-calender-series';
import { TopBoxOffice } from './Components//top-box-office/top-box-office';
import { Top250Movies } from './Components//top250-movies/top250-movies';
import { Top250Series } from './Components//top250-series/top250-series';
import { ShowGenreMovies } from './Components/show-genre-movies/show-genre-movies';

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
    {path: 'admin', component: Adminpage, canActivate: [AdminGuard]},



  { path: 'browse-by-genre-movies', component: BrowseByGenreMovies },
  { path: 'show-genre-movies/:genreId', component: ShowGenreMovies },
  { path: 'browse-by-genre-series', component: BrowseByGenreSeries },
  { path: 'celebs-born-today', component: CelebsBornToday },
  { path: 'most-popular-celeb', component: MostPopularCeleb },
  { path: 'most-popular-movies', component: MostPopularMovies },
  { path: 'most-popular-series', component: MostPopularSeries },
  { path: 'release-calender-movies', component: ReleaseCalenderMovies },
  { path: 'release-calender-series', component: ReleaseCalenderSeries },
  { path: 'top-box-office', component: TopBoxOffice },
  { path: 'top250-movies', component: Top250Movies },
  { path: 'top250-series', component: Top250Series },

  { path: 'show-movie/:mediaType/:id', component: ShowMovieComponent },
  { path: 'movie/:mediaType/:id', component: ShowMovieComponent },
];