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
          return mediaType === 'movie' || mediaType === 'tv';
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



app.listen(PORT, () => {
  console.log(`Server kører på http://localhost:${PORT}`);
});