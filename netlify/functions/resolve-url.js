// Netlify Function to resolve Facebook short links
// This runs on server-side, so it bypasses CORS restrictions

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Get URL from query string
  const url = event.queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Missing url parameter',
        message: 'Please provide a URL to resolve'
      }),
    };
  }

  try {
    console.log('Resolving URL:', url);

    // Fetch the URL and follow redirects
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // Get the final URL after all redirects
    const finalUrl = response.url;

    console.log('Resolved to:', finalUrl);

    // Extract reel ID if it's a Facebook URL
    let reelUrl = finalUrl;
    if (finalUrl.includes('facebook.com/reel/')) {
      const match = finalUrl.match(/\/reel\/([A-Za-z0-9._-]+)/);
      if (match) {
        reelUrl = `https://www.facebook.com/reel/${match[1]}/`;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        originalUrl: url,
        finalUrl: reelUrl,
        success: true,
      }),
    };

  } catch (error) {
    console.error('Error resolving URL:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        success: false,
      }),
    };
  }
};

