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
import { PopularMovies } from './popular-movies/popular-movies';

import { BrowseByGenreMovies } from './Components/browse-by-genre-movies/browse-by-genre-movies';
import { BrowseByGenreSeries } from './Components//browse-by-genre-series/browse-by-genre-series';
import { CelebsBornToday } from './Components//celebs-born-today/celebs-born-today';
import { MostPopularCeleb } from './Components//most-popular-celeb/most-popular-celeb';
import { PopularSeries } from './popular-series/popular-series';
import { MostPopularMovies } from './Components//most-popular-movies/most-popular-movies';
import { MostPopularSeries } from './Components//most-popular-series/most-popular-series';

import { ReleaseCalenderMovies } from './Components//release-calender-movies/release-calender-movies';
import { ReleaseCalenderSeries } from './Components//release-calender-series/release-calender-series';
import { TopBoxOffice } from './Components//top-box-office/top-box-office';
import { Top250Movies } from './Components//top250-movies/top250-movies';
import { Top250Series } from './Components//top250-series/top250-series';
import { ShowGenreMovies } from './Components/show-genre-movies/show-genre-movies';
import { ShowGenreSeries } from './Components/show-genre-series/show-genre-series';
import { ShowCeleb } from './Components/show-celeb/show-celeb';
import { ShowReleaseCalenderMonths } from './Components/show-release-calender-months/show-release-calender-months';
import { ShowReleaseCalenderMonthsSeries } from './Components/show-release-calender-months-series/show-release-calender-months-series';

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
    {path: 'most-popular-movies', component: PopularMovies, canActivate: [AuthGuard]},
    { path: 'most-popular-series', component: PopularSeries },
  { path: 'show-movie/:mediaType/:id', component: ShowMovieComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'profile', component: UserProfile, canActivate: [AuthGuard] },
  { path: 'profile/:uid', component: UserProfile, canActivate: [AuthGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'admin', component: Adminpage, canActivate: [AdminGuard] },

  { path: 'browse-by-genre-movies', component: BrowseByGenreMovies },
  { path: 'show-genre-movies/:genreId', component: ShowGenreMovies },
  { path: 'browse-by-genre-series', component: BrowseByGenreSeries },
  { path: 'show-genre-series/:genreId', component: ShowGenreSeries },
  { path: 'celebs-born-today', component: CelebsBornToday },
  { path: 'most-popular-celeb', component: MostPopularCeleb },
  { path: 'most-popular-movies', component: MostPopularMovies },
  { path: 'most-popular-series', component: MostPopularSeries },
  { path: 'show-release-calender-months', component: ShowReleaseCalenderMonths },
  { path: 'show-release-calender-months-series', component: ShowReleaseCalenderMonthsSeries },
  { path: 'release-calender-movies', component: ReleaseCalenderMovies },
  { path: 'release-calender-movies/:year/:month', component: ReleaseCalenderMovies },
  { path: 'release-calender-series', component: ReleaseCalenderSeries },
  { path: 'release-calender-series/:year/:month', component: ReleaseCalenderSeries },
  { path: 'top-box-office', component: TopBoxOffice },
  { path: 'top250-movies', component: Top250Movies },
  { path: 'top250-series', component: Top250Series },

  { path: 'show-celeb/:id', component: ShowCeleb },

  { path: 'show-movie/:mediaType/:id', component: ShowMovieComponent },
  { path: 'movie/:mediaType/:id', component: ShowMovieComponent }
];