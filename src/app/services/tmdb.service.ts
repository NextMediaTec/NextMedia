import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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

export interface TmdbMovieGenresResponse {
  genres: TmdbGenre[];
}

export interface TmdbDiscoverMovieOptions {
  page?: number;
  withGenres?: string;
  language?: string;
  sortBy?: string;
  releaseDateLte?: string;
  releaseDateGte?: string;
  voteCountGte?: number;
  region?: string;
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
  profile_path?: string | null;
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

export interface TmdbWatchProviderItem {
  display_priority?: number;
  logo_path: string | null;
  provider_id: number;
  provider_name: string;
}

export interface TmdbWatchProviderRegionResult {
  link?: string;
  flatrate?: TmdbWatchProviderItem[];
  rent?: TmdbWatchProviderItem[];
  buy?: TmdbWatchProviderItem[];
  ads?: TmdbWatchProviderItem[];
  free?: TmdbWatchProviderItem[];
}

export interface TmdbWatchProvidersResponse {
  id?: number;
  results?: Record<string, TmdbWatchProviderRegionResult>;
}

export interface TmdbMovieReleaseDateEntry {
  certification: string;
  descriptors?: string[];
  iso_639_1?: string;
  note?: string;
  release_date?: string;
  type?: number;
}

export interface TmdbMovieReleaseDateResult {
  iso_3166_1: string;
  release_dates: TmdbMovieReleaseDateEntry[];
}

export interface TmdbMovieReleaseDatesResponse {
  id?: number;
  results?: TmdbMovieReleaseDateResult[];
}

export interface TmdbTvContentRatingItem {
  descriptors?: string[];
  iso_3166_1: string;
  rating: string;
}

export interface TmdbTvContentRatingsResponse {
  id?: number;
  results?: TmdbTvContentRatingItem[];
}

export interface TmdbCertificationDisplayItem {
  countryCode: string;
  rating: string;
}

export interface TmdbDiscoverMovieResult {
  adult?: boolean;
  backdrop_path: string | null;
  genre_ids?: number[];
  id: number;
  original_language?: string;
  original_title?: string;
  overview: string;
  popularity?: number;
  poster_path: string | null;
  release_date?: string;
  title?: string;
  video?: boolean;
  vote_average?: number;
  vote_count?: number;
}

export interface TmdbDiscoverMovieResponse {
  page: number;
  results: TmdbDiscoverMovieResult[];
  total_pages: number;
  total_results: number;
}

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private backendBaseUrl: string = 'http://localhost:3000/api/tmdb';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

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

  public getWatchProviders(
    mediaType: TmdbMediaType,
    id: number,
    language: string = 'en-US'
  ): Observable<BackendTmdbResponse<TmdbWatchProvidersResponse>> {
    let params = new HttpParams();
    params = params.set('language', language);

    return this.http.get<BackendTmdbResponse<TmdbWatchProvidersResponse>>(
      `${this.backendBaseUrl}/watch-providers/${mediaType}/${id}`,
      { params }
    );
  }

  public getCertificates(
    mediaType: TmdbMediaType,
    id: number,
    language: string = 'en-US'
  ): Observable<BackendTmdbResponse<TmdbMovieReleaseDatesResponse | TmdbTvContentRatingsResponse>> {
    let params = new HttpParams();
    params = params.set('language', language);

    return this.http.get<BackendTmdbResponse<TmdbMovieReleaseDatesResponse | TmdbTvContentRatingsResponse>>(
      `${this.backendBaseUrl}/certificates/${mediaType}/${id}`,
      { params }
    );
  }

  public getMovieGenres(
    language: string = 'en-US'
  ): Observable<BackendTmdbResponse<TmdbMovieGenresResponse>> {
    let params = new HttpParams();
    params = params.set('language', language);

    return this.http.get<BackendTmdbResponse<TmdbMovieGenresResponse>>(
      `${this.backendBaseUrl}/genre/movie/list`,
      { params }
    );
  }

  public discoverMovies(
    page: number = 1,
    withGenres: string = '',
    language: string = 'en-US',
    sortBy: string = 'original_title.asc'
  ): Observable<BackendTmdbResponse<TmdbSearchMultiResponse>> {
    let params = new HttpParams();
    params = params.set('page', String(page));
    params = params.set('language', language);
    params = params.set('sort_by', sortBy);

    if (withGenres.trim().length > 0) {
      params = params.set('with_genres', withGenres);
    }

    return this.http.get<BackendTmdbResponse<TmdbSearchMultiResponse>>(
      `${this.backendBaseUrl}/discover/movie`,
      { params }
    );
  }

  public discoverMoviesAdvanced(
    options: TmdbDiscoverMovieOptions
  ): Observable<BackendTmdbResponse<TmdbSearchMultiResponse>> {
    let params = new HttpParams();

    params = params.set('page', String(options.page ?? 1));
    params = params.set('language', options.language ?? 'en-US');
    params = params.set('sort_by', options.sortBy ?? 'popularity.desc');

    if (String(options.withGenres || '').trim().length > 0) {
      params = params.set('with_genres', String(options.withGenres).trim());
    }

    if (String(options.releaseDateLte || '').trim().length > 0) {
      params = params.set('release_date.lte', String(options.releaseDateLte).trim());
    }

    if (String(options.releaseDateGte || '').trim().length > 0) {
      params = params.set('release_date.gte', String(options.releaseDateGte).trim());
    }

    if (typeof options.voteCountGte === 'number' && !Number.isNaN(options.voteCountGte)) {
      params = params.set('vote_count.gte', String(options.voteCountGte));
    }

    if (String(options.region || '').trim().length > 0) {
      params = params.set('region', String(options.region).trim());
    }

    return this.http.get<BackendTmdbResponse<TmdbSearchMultiResponse>>(
      `${this.backendBaseUrl}/discover/movie`,
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

  public getImageUrl(path: string | null, size: string = 'w780'): string {
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

  public getYoutubeEmbedUrl(key: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${key}`);
  }

  public extractWatchProviderRegions(
    rawData: TmdbWatchProvidersResponse | null | undefined
  ): {
    countryCode: string;
    countryName: string;
    data: TmdbWatchProviderRegionResult;
  }[] {
    const results = rawData?.results;

    if (!results || typeof results !== 'object') {
      return [];
    }

    const out: {
      countryCode: string;
      countryName: string;
      data: TmdbWatchProviderRegionResult;
    }[] = [];

    for (const countryCode of Object.keys(results)) {
      const region = results[countryCode];

      if (!region) {
        continue;
      }

      const providerCount =
        (Array.isArray(region.flatrate) ? region.flatrate.length : 0) +
        (Array.isArray(region.free) ? region.free.length : 0) +
        (Array.isArray(region.ads) ? region.ads.length : 0) +
        (Array.isArray(region.rent) ? region.rent.length : 0) +
        (Array.isArray(region.buy) ? region.buy.length : 0);

      if (providerCount === 0) {
        continue;
      }

      out.push({
        countryCode,
        countryName: this.getCountryName(countryCode),
        data: region
      });
    }

    const preferredOrder: string[] = ['DK', 'US', 'GB', 'SE', 'NO', 'DE', 'FR'];

    out.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.countryCode);
      const bIndex = preferredOrder.indexOf(b.countryCode);

      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;

      if (safeA !== safeB) {
        return safeA - safeB;
      }

      return a.countryCode.localeCompare(b.countryCode);
    });

    return out;
  }

  public extractCertificationDisplayItems(
    mediaType: TmdbMediaType,
    rawData: TmdbMovieReleaseDatesResponse | TmdbTvContentRatingsResponse
  ): TmdbCertificationDisplayItem[] {
    if (mediaType === 'movie') {
      const movieData = rawData as TmdbMovieReleaseDatesResponse;

      if (!movieData || !Array.isArray(movieData.results)) {
        return [];
      }

      const out: TmdbCertificationDisplayItem[] = [];

      for (const item of movieData.results) {
        if (!item || !Array.isArray(item.release_dates)) {
          continue;
        }

        const firstWithCertification = item.release_dates.find((entry) => {
          return typeof entry.certification === 'string' && entry.certification.trim().length > 0;
        });

        if (!firstWithCertification) {
          continue;
        }

        out.push({
          countryCode: item.iso_3166_1,
          rating: firstWithCertification.certification
        });
      }

      const preferredOrder: string[] = ['DK', 'US', 'GB', 'SE', 'NO', 'DE', 'FR'];

      out.sort((a, b) => {
        const aIndex = preferredOrder.indexOf(a.countryCode);
        const bIndex = preferredOrder.indexOf(b.countryCode);

        const safeA = aIndex === -1 ? 999 : aIndex;
        const safeB = bIndex === -1 ? 999 : bIndex;

        if (safeA !== safeB) {
          return safeA - safeB;
        }

        return a.countryCode.localeCompare(b.countryCode);
      });

      return out.slice(0, 12);
    }

    const tvData = rawData as TmdbTvContentRatingsResponse;

    if (!tvData || !Array.isArray(tvData.results)) {
      return [];
    }

    const out = tvData.results
      .filter((item) => typeof item.rating === 'string' && item.rating.trim().length > 0)
      .map((item) => {
        return {
          countryCode: item.iso_3166_1,
          rating: item.rating
        };
      });

    const preferredOrder: string[] = ['DK', 'US', 'GB', 'SE', 'NO', 'DE', 'FR'];

    out.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.countryCode);
      const bIndex = preferredOrder.indexOf(b.countryCode);

      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;

      if (safeA !== safeB) {
        return safeA - safeB;
      }

      return a.countryCode.localeCompare(b.countryCode);
    });

    return out.slice(0, 12);
  }

  private getCountryName(countryCode: string): string {
    const map: Record<string, string> = {
      DK: 'Danmark',
      US: 'USA',
      GB: 'Storbritannien',
      SE: 'Sverige',
      NO: 'Norge',
      DE: 'Tyskland',
      FR: 'Frankrig'
    };

    return map[countryCode] || countryCode;
  }
}