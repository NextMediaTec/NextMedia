import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-engine',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-engine.html',
  styleUrl: './search-engine.scss'
})
export class SearchEngine {
  public searchText: string = '';
}