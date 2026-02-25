import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {

  username='Guest';

  continueWatching = [
    { title: 'Interstellar', info:'1h 12m left'},
    { title: 'Breaking Bad', info:'Season 2 Episode 5'},
    { title: 'Dune', info:'12m left'},

  ];

  recommended =  [
    {title: 'The Batman', info: 'Action 2022'},
    {title: 'Dark', info: 'Sci-Fi Series'},
    {title: 'Inception', info: 'Thriller 2010'},
    {title: 'Friends', info: 'Comedy Series'},

  ]
}
