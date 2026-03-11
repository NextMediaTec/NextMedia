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
    data: data
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

app.listen(PORT, () => {
  console.log(`Server kører på http://localhost:${PORT}`);
});