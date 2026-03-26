const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_TOKEN) {
  console.error('TMDB_READ_ACCESS_TOKEN mangler i .env');
  process.exit(1);
}

async function tmdbFetch(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      accept: 'application/json'
    }
  });

  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}

async function mapWithConcurrency(items, limit, asyncMapper) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;

      if (index >= items.length) {
        break;
      }

      results[index] = await asyncMapper(items[index], index);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = [];

  for (let i = 0; i < workerCount; i += 1) {
    workers.push(worker());
  }

  await Promise.all(workers);

  return results;
}

function getPersonCreditDate(item) {
  const releaseDate = typeof item.release_date === 'string' ? item.release_date : '';
  const firstAirDate = typeof item.first_air_date === 'string' ? item.first_air_date : '';

  if (releaseDate.trim().length > 0) {
    return releaseDate;
  }

  return firstAirDate;
}

function normalizePersonCredit(item, creditType) {
  const mediaType = String(item.media_type || '').trim();

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return null;
  }

  return {
    credit_id: item.credit_id || '',
    id: item.id,
    media_type: mediaType,
    title: item.title || '',
    name: item.name || '',
    original_title: item.original_title || '',
    original_name: item.original_name || '',
    overview: item.overview || '',
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    release_date: item.release_date || '',
    first_air_date: item.first_air_date || '',
    popularity: typeof item.popularity === 'number' ? item.popularity : 0,
    vote_average: typeof item.vote_average === 'number' ? item.vote_average : 0,
    vote_count: typeof item.vote_count === 'number' ? item.vote_count : 0,
    character: item.character || '',
    job: item.job || '',
    department: item.department || '',
    credit_type: creditType
  };
}

function getDisplayCreditTitle(item) {
  const movieTitle = typeof item.title === 'string' ? item.title : '';
  const tvTitle = typeof item.name === 'string' ? item.name : '';
  const originalMovieTitle = typeof item.original_title === 'string' ? item.original_title : '';
  const originalTvTitle = typeof item.original_name === 'string' ? item.original_name : '';

  if (movieTitle.trim().length > 0) {
    return movieTitle;
  }

  if (tvTitle.trim().length > 0) {
    return tvTitle;
  }

  if (originalMovieTitle.trim().length > 0) {
    return originalMovieTitle;
  }

  return originalTvTitle;
}

app.get('/', (req, res) => {
  res.send('Backend kører');
});

app.get('/api/tmdb/health', (req, res) => {
  res.json({
    success: true,
    message: 'TMDb backend kører.'
  });
});

app.get('/api/tmdb/search/multi', async (req, res) => {
  try {
    const query = String(req.query.query || '').trim();
    const page = String(req.query.page || '1');
    const language = String(req.query.language || 'en-US');
    const includeAdult = String(req.query.include_adult || 'false');

    if (query.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "query" mangler.'
      });
    }

    const url = new URL(`${TMDB_BASE_URL}/search/multi`);
    url.searchParams.set('query', query);
    url.searchParams.set('page', page);
    url.searchParams.set('language', language);
    url.searchParams.set('include_adult', includeAdult);

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under multi search.',
        tmdb: result.data
      });
    }

    const filteredResults = Array.isArray(result.data.results)
      ? result.data.results.filter((item) => {
          const mediaType = String(item.media_type || '');
          return mediaType === 'movie' || mediaType === 'tv' || mediaType === 'person';
        })
      : [];

    return res.json({
      success: true,
      data: {
        page: result.data.page || 1,
        results: filteredResults,
        total_pages: result.data.total_pages || 0,
        total_results: filteredResults.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under multi search.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
app.get('/api/tmdb/discover/movie', async (req, res) => {
  try {
    const page = String(req.query.page || '1');
    const language = String(req.query.language || 'en-US');
    const sortBy = String(req.query.sort_by || 'original_title.asc');
    const withGenres = String(req.query.with_genres || '').trim();

    const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
    url.searchParams.set('page', page);
    url.searchParams.set('language', language);
    url.searchParams.set('sort_by', sortBy);

    if (withGenres.length > 0) {
      url.searchParams.set('with_genres', withGenres);
    }

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under discover movie.',
        tmdb: result.data
      });
    }

    const mappedResults = Array.isArray(result.data.results)
      ? result.data.results.map((item) => {
          return {
            ...item,
            media_type: 'movie'
          };
        })
      : [];

    return res.json({
      success: true,
      data: {
        page: result.data.page || 1,
        results: mappedResults,
        total_pages: result.data.total_pages || 0,
        total_results: result.data.total_results || mappedResults.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under discover movie.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/discover/tv', async (req, res) => {
  try {
    const page = String(req.query.page || '1');
    const language = String(req.query.language || 'en-US');
    const sortBy = String(req.query.sort_by || 'popularity.desc');
    const withGenres = String(req.query.with_genres || '').trim();

    const url = new URL(`${TMDB_BASE_URL}/discover/tv`);
    url.searchParams.set('page', page);
    url.searchParams.set('language', language);
    url.searchParams.set('sort_by', sortBy);

    if (withGenres.length > 0) {
      url.searchParams.set('with_genres', withGenres);
    }

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under discover tv.',
        tmdb: result.data
      });
    }

    const mappedResults = Array.isArray(result.data.results)
      ? result.data.results.map((item) => {
          return {
            ...item,
            media_type: 'tv'
          };
        })
      : [];

    return res.json({
      success: true,
      data: {
        page: result.data.page || 1,
        results: mappedResults,
        total_pages: result.data.total_pages || 0,
        total_results: result.data.total_results || mappedResults.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under discover tv.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/details/:mediaType/:id', async (req, res) => {
  try {
    const mediaType = String(req.params.mediaType || '').trim();
    const id = String(req.params.id || '').trim();
    const language = String(req.query.language || 'en-US');
    const includeImageLanguage = String(req.query.include_image_language || 'en,null');

    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return res.status(400).json({
        success: false,
        message: 'mediaType skal være "movie" eller "tv".'
      });
    }

    if (id.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Id mangler.'
      });
    }

    const url = new URL(`${TMDB_BASE_URL}/${mediaType}/${id}`);
    url.searchParams.set('language', language);
    url.searchParams.set('append_to_response', 'credits,videos,images,recommendations');
    url.searchParams.set('include_image_language', includeImageLanguage);

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under hentning af detaljer.',
        tmdb: result.data
      });
    }

    return res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under hentning af detaljer.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/person/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const language = String(req.query.language || 'en-US');
    const includeImageLanguage = String(req.query.include_image_language || 'en,null');

    if (id.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Id mangler.'
      });
    }

    const url = new URL(`${TMDB_BASE_URL}/person/${id}`);
    url.searchParams.set('language', language);
    url.searchParams.set(
      'append_to_response',
      'combined_credits,images,external_ids,movie_credits,tv_credits'
    );
    url.searchParams.set('include_image_language', includeImageLanguage);

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under hentning af persondetaljer.',
        tmdb: result.data
      });
    }

    const personData = result.data || {};
    const combinedCast = Array.isArray(personData.combined_credits?.cast)
      ? personData.combined_credits.cast
      : [];
    const combinedCrew = Array.isArray(personData.combined_credits?.crew)
      ? personData.combined_credits.crew
      : [];

    const normalizedCombinedCredits = [
      ...combinedCast.map((item) => normalizePersonCredit(item, 'cast')),
      ...combinedCrew.map((item) => normalizePersonCredit(item, 'crew'))
    ]
      .filter((item) => item !== null)
      .sort((a, b) => {
        const aDate = getPersonCreditDate(a);
        const bDate = getPersonCreditDate(b);

        if (aDate !== bDate) {
          return bDate.localeCompare(aDate);
        }

        return (b.popularity || 0) - (a.popularity || 0);
      });

    const movieCreditSourceCast = Array.isArray(personData.movie_credits?.cast)
      ? personData.movie_credits.cast
      : [];
    const movieCreditSourceCrew = Array.isArray(personData.movie_credits?.crew)
      ? personData.movie_credits.crew
      : [];

    const movieIds = Array.from(
      new Set(
        [...movieCreditSourceCast, ...movieCreditSourceCrew]
          .map((item) => Number(item.id))
          .filter((movieId) => Number.isFinite(movieId) && movieId > 0)
      )
    );

    let boxOfficeTotal = null;

    if (movieIds.length > 0) {
      const movieRevenues = await mapWithConcurrency(movieIds, 8, async (movieId) => {
        const movieUrl = new URL(`${TMDB_BASE_URL}/movie/${movieId}`);
        movieUrl.searchParams.set('language', language);

        const movieResult = await tmdbFetch(movieUrl);

        if (!movieResult.ok) {
          return 0;
        }

        const revenue = Number(movieResult.data?.revenue || 0);

        if (!Number.isFinite(revenue) || revenue <= 0) {
          return 0;
        }

        return revenue;
      });

      const totalRevenue = movieRevenues.reduce((sum, value) => {
        return sum + Number(value || 0);
      }, 0);

      if (totalRevenue > 0) {
        boxOfficeTotal = totalRevenue;
      }
    }

    const mostPopularMovieMap = new Map();

    normalizedCombinedCredits
      .filter((item) => item.media_type === 'movie')
      .sort((a, b) => {
        const popularityDiff = (b.popularity || 0) - (a.popularity || 0);

        if (popularityDiff !== 0) {
          return popularityDiff;
        }

        return getDisplayCreditTitle(a).localeCompare(getDisplayCreditTitle(b));
      })
      .forEach((item) => {
        const key = `${item.media_type}-${item.id}`;

        if (!mostPopularMovieMap.has(key)) {
          mostPopularMovieMap.set(key, item);
        }
      });

    const mostPopularMovies = Array.from(mostPopularMovieMap.values()).slice(0, 10);

    return res.json({
      success: true,
      data: {
        person: personData,
        combinedCredits: normalizedCombinedCredits,
        mostPopularMovies,
        boxOfficeTotal
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under hentning af persondetaljer.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/watch-providers/:mediaType/:id', async (req, res) => {
  try {
    const mediaType = String(req.params.mediaType || '').trim();
    const id = String(req.params.id || '').trim();
    const language = String(req.query.language || 'en-US');

    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return res.status(400).json({
        success: false,
        message: 'mediaType skal være "movie" eller "tv".'
      });
    }

    if (id.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Id mangler.'
      });
    }

    const url = new URL(`${TMDB_BASE_URL}/${mediaType}/${id}/watch/providers`);
    url.searchParams.set('language', language);

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under hentning af streamingtjenester.',
        tmdb: result.data
      });
    }

    return res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under hentning af streamingtjenester.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/certificates/:mediaType/:id', async (req, res) => {
  try {
    const mediaType = String(req.params.mediaType || '').trim();
    const id = String(req.params.id || '').trim();
    const language = String(req.query.language || 'en-US');

    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return res.status(400).json({
        success: false,
        message: 'mediaType skal være "movie" eller "tv".'
      });
    }

    if (id.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Id mangler.'
      });
    }

    let url = null;

    if (mediaType === 'movie') {
      url = new URL(`${TMDB_BASE_URL}/movie/${id}/release_dates`);
      url.searchParams.set('language', language);
    } else {
      url = new URL(`${TMDB_BASE_URL}/tv/${id}/content_ratings`);
      url.searchParams.set('language', language);
    }

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under hentning af certificates.',
        tmdb: result.data
      });
    }

    return res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under hentning af certificates.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/genre/movie/list', async (req, res) => {
  try {
    const language = String(req.query.language || 'en-US');

    const url = new URL(`${TMDB_BASE_URL}/genre/movie/list`);
    url.searchParams.set('language', language);

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under hentning af movie genres.',
        tmdb: result.data
      });
    }

    return res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under hentning af movie genres.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/genre/tv/list', async (req, res) => {
  try {
    const language = String(req.query.language || 'en-US');

    const url = new URL(`${TMDB_BASE_URL}/genre/tv/list`);
    url.searchParams.set('language', language);

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under hentning af tv genres.',
        tmdb: result.data
      });
    }

    return res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under hentning af tv genres.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/movie/top_rated', async (req, res) => {
  try {
    const page = String(req.query.page || '1');
    const language = String(req.query.language || 'en-US');

    const url = new URL(`${TMDB_BASE_URL}/movie/top_rated`);
    url.searchParams.set('page', page);
    url.searchParams.set('language', language);

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under hentning af top rated movies.',
        tmdb: result.data
      });
    }

    const mappedResults = Array.isArray(result.data.results)
      ? result.data.results.map((item) => ({
          ...item,
          media_type: 'movie'
        }))
      : [];

    return res.json({
      success: true,
      data: {
        page: result.data.page || 1,
        results: mappedResults,
        total_pages: result.data.total_pages || 0,
        total_results: result.data.total_results || mappedResults.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under hentning af top rated movies.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});


app.get('/api/tmdb/discover/movie', async (req, res) => {
  try {
    const page = String(req.query.page || '1');
    const language = String(req.query.language || 'en-US');
    const sortBy = String(req.query.sort_by || 'original_title.asc');
    const withGenres = String(req.query.with_genres || '').trim();
    const releaseDateLte = String(req.query['release_date.lte'] || '').trim();
    const releaseDateGte = String(req.query['release_date.gte'] || '').trim();
    const voteCountGte = String(req.query['vote_count.gte'] || '').trim();
    const region = String(req.query.region || '').trim();

    const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
    url.searchParams.set('page', page);
    url.searchParams.set('language', language);
    url.searchParams.set('sort_by', sortBy);

    if (withGenres.length > 0) {
      url.searchParams.set('with_genres', withGenres);
    }

    if (releaseDateLte.length > 0) {
      url.searchParams.set('release_date.lte', releaseDateLte);
    }

    if (releaseDateGte.length > 0) {
      url.searchParams.set('release_date.gte', releaseDateGte);
    }

    if (voteCountGte.length > 0) {
      url.searchParams.set('vote_count.gte', voteCountGte);
    }

    if (region.length > 0) {
      url.searchParams.set('region', region);
    }

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under discover movie.',
        tmdb: result.data
      });
    }

    const mappedResults = Array.isArray(result.data.results)
      ? result.data.results.map((item) => {
          return {
            ...item,
            media_type: 'movie'
          };
        })
      : [];

    return res.json({
      success: true,
      data: {
        page: result.data.page || 1,
        results: mappedResults,
        total_pages: result.data.total_pages || 0,
        total_results: result.data.total_results || mappedResults.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under discover movie.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/discover/tv', async (req, res) => {
  try {
    const page = String(req.query.page || '1');
    const language = String(req.query.language || 'en-US');
    const sortBy = String(req.query.sort_by || 'popularity.desc');
    const withGenres = String(req.query.with_genres || '').trim();
    const firstAirDateLte = String(req.query['first_air_date.lte'] || '').trim();
    const firstAirDateGte = String(req.query['first_air_date.gte'] || '').trim();
    const voteCountGte = String(req.query['vote_count.gte'] || '').trim();
    const region = String(req.query.region || '').trim();

    const url = new URL(`${TMDB_BASE_URL}/discover/tv`);
    url.searchParams.set('page', page);
    url.searchParams.set('language', language);
    url.searchParams.set('sort_by', sortBy);

    if (withGenres.length > 0) {
      url.searchParams.set('with_genres', withGenres);
    }

    if (firstAirDateLte.length > 0) {
      url.searchParams.set('first_air_date.lte', firstAirDateLte);
    }

    if (firstAirDateGte.length > 0) {
      url.searchParams.set('first_air_date.gte', firstAirDateGte);
    }

    if (voteCountGte.length > 0) {
      url.searchParams.set('vote_count.gte', voteCountGte);
    }

    if (region.length > 0) {
      url.searchParams.set('region', region);
    }

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under discover tv.',
        tmdb: result.data
      });
    }

    const mappedResults = Array.isArray(result.data.results)
      ? result.data.results.map((item) => {
          return {
            ...item,
            media_type: 'tv'
          };
        })
      : [];

    return res.json({
      success: true,
      data: {
        page: result.data.page || 1,
        results: mappedResults,
        total_pages: result.data.total_pages || 0,
        total_results: result.data.total_results || mappedResults.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under discover tv.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/tmdb/discover/:mediaType', async (req, res) => {
  try {
    const mediaType = String(req.params.mediaType || '').trim();
    const withGenres = String(req.query.with_genres || '').trim();
    const page = String(req.query.page || '1');
    const language = String(req.query.language || 'en-US');

    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return res.status(400).json({
        success: false,
        message: 'mediaType skal være "movie" eller "tv".'
      });
    }

    if (withGenres.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "with_genres" mangler.'
      });
    }

    const url = new URL(`${TMDB_BASE_URL}/discover/${mediaType}`);
    url.searchParams.set('with_genres', withGenres);
    url.searchParams.set('page', page);
    url.searchParams.set('language', language);
    url.searchParams.set('sort_by', 'popularity.desc');

    const result = await tmdbFetch(url);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: 'TMDb returnerede en fejl under discover.',
        tmdb: result.data
      });
    }

    const normalizedResults = Array.isArray(result.data.results)
      ? result.data.results.map((item) => ({
          ...item,
          media_type: mediaType
        }))
      : [];

    const filteredResults = normalizedResults.filter((item) => {
      const hasPoster = !!item.poster_path;
      const hasBackdrop = !!item.backdrop_path;
      return hasPoster && hasBackdrop;
    });

    return res.json({
      success: true,
      data: {
        page: result.data.page || 1,
        results: filteredResults,
        total_pages: result.data.total_pages || 0,
        total_results: result.data.total_results || filteredResults.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Serverfejl under discover.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server kører på http://localhost:${PORT}`);
});