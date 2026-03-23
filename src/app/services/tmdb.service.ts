import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TmdbMediaType = 'movie' | 'tv';

export interface TmdbSearchMultiResult {
  adult?: boolean;
  backdrop_path: string | null;
  first_air_date?: string;
  genre_ids?: number[];
  id: number;
  media_type: TmdbMediaType;
  name?: string;
  origin_country?: string[];
  original_language?: string;
  original_name?: string;
  original_title?: string;
  overview: string;
  popularity?: number;
  poster_path: string | null;
  profile_path?: string | null;
  release_date?: string;
  title?: string;
  vote_average?: number;
  vote_count?: number;
}

export interface TmdbSearchMultiResponse {
  page: number;
  results: TmdbSearchMultiResult[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TmdbProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TmdbSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TmdbCastMember {
  adult?: boolean;
  cast_id?: number;
  character?: string;
  credit_id: string;
  gender?: number;
  id: number;
  known_for_department?: string;
  name: string;
  order?: number;
  original_name?: string;
  popularity?: number;
  profile_path: string | null;
}

export interface TmdbCrewMember {
  adult?: boolean;
  credit_id: string;
  department?: string;
  gender?: number;
  id: number;
  job?: string;
  known_for_department?: string;
  name: string;
  original_name?: string;
  popularity?: number;
  profile_path: string | null;
}

export interface TmdbCredits {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbVideoItem {
  id: string;
  iso_3166_1?: string;
  iso_639_1?: string;
  key: string;
  name: string;
  official?: boolean;
  published_at?: string;
  site: string;
  size?: number;
  type: string;
}

export interface TmdbVideos {
  results: TmdbVideoItem[];
}

export interface TmdbImageItem {
  aspect_ratio?: number;
  file_path: string;
  height?: number;
  iso_639_1?: string | null;
  vote_average?: number;
  vote_count?: number;
  width?: number;
}

export interface TmdbImages {
  backdrops: TmdbImageItem[];
  logos: TmdbImageItem[];
  posters: TmdbImageItem[];
}

export interface TmdbRecommendationItem {
  backdrop_path: string | null;
  id: number;
  media_type?: string;
  name?: string;
  original_name?: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  title?: string;
  vote_average?: number;
}

export interface TmdbRecommendations {
  page: number;
  results: TmdbRecommendationItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovieOrTvDetails {
  adult?: boolean;
  backdrop_path: string | null;
  belongs_to_collection?: any;
  budget?: number;
  created_by?: any[];
  episode_run_time?: number[];
  first_air_date?: string;
  genres?: TmdbGenre[];
  homepage?: string;
  id: number;
  imdb_id?: string | null;
  in_production?: boolean;
  languages?: string[];
  last_air_date?: string;
  name?: string;
  networks?: any[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  origin_country?: string[];
  original_language?: string;
  original_name?: string;
  original_title?: string;
  overview: string;
  popularity?: number;
  poster_path: string | null;
  production_companies?: TmdbProductionCompany[];
  production_countries?: TmdbProductionCountry[];
  release_date?: string;
  revenue?: number;
  runtime?: number;
  seasons?: any[];
  spoken_languages?: TmdbSpokenLanguage[];
  status?: string;
  tagline?: string;
  title?: string;
  type?: string;
  vote_average?: number;
  vote_count?: number;
  credits?: TmdbCredits;
  videos?: TmdbVideos;
  images?: TmdbImages;
  recommendations?: TmdbRecommendations;
}

export interface BackendTmdbResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private backendBaseUrl: string = 'http://localhost:3000/api/tmdb';

  constructor(private http: HttpClient) {}

  public searchMulti(
    query: string,
    page: number = 1,
    language: string = 'en-US',
    includeAdult: boolean = false
  ): Observable<BackendTmdbResponse<TmdbSearchMultiResponse>> {
    let params = new HttpParams();
    params = params.set('query', query);
    params = params.set('page', String(page));
    params = params.set('language', language);
    params = params.set('include_adult', String(includeAdult));

    return this.http.get<BackendTmdbResponse<TmdbSearchMultiResponse>>(
      `${this.backendBaseUrl}/search/multi`,
      { params }
    );
  }

   public discoverByGenre(
    mediaType: TmdbMediaType,
    genreId: number,
    page: number = 1,
    language: string = 'en-US'
  ): Observable<BackendTmdbResponse<TmdbSearchMultiResponse>> {
    let params = new HttpParams();
    params = params.set('with_genres', String(genreId));
    params = params.set('page', String(page));
    params = params.set('language', language);

    return this.http.get<BackendTmdbResponse<TmdbSearchMultiResponse>>(
      `${this.backendBaseUrl}/discover/${mediaType}`,
      { params }
    );
  }

  public getDetails(
    mediaType: TmdbMediaType,
    id: number,
    language: string = 'en-US'
  ): Observable<BackendTmdbResponse<TmdbMovieOrTvDetails>> {
    let params = new HttpParams();
    params = params.set('language', language);
    params = params.set('include_image_language', 'en,null');

    return this.http.get<BackendTmdbResponse<TmdbMovieOrTvDetails>>(
      `${this.backendBaseUrl}/details/${mediaType}/${id}`,
      { params }
    );
  }

  public getPosterUrl(path: string | null, size: string = 'w500'): string {
    if (!path) {
      return '';
    }

    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  public getBackdropUrl(path: string | null, size: string = 'w1280'): string {
    if (!path) {
      return '';
    }

    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  public getProfileUrl(path: string | null, size: string = 'w185'): string {
    if (!path) {
      return '';
    }

    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  public getDisplayTitle(item: TmdbSearchMultiResult | TmdbMovieOrTvDetails): string {
    const movieTitle = item.title || item.original_title || '';
    const tvTitle = item.name || item.original_name || '';

    if (movieTitle.trim().length > 0) {
      return movieTitle;
    }

    return tvTitle;
  }

  public getDisplayDate(item: TmdbSearchMultiResult | TmdbMovieOrTvDetails): string {
    const movieDate = item.release_date || '';
    const tvDate = item.first_air_date || '';

    if (movieDate.trim().length > 0) {
      return movieDate;
    }

    return tvDate;
  }
}