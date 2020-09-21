let fs = require('fs')
let querystring = require('querystring')
let urlMod = require('url')
const crypto = require('crypto')
const https = require('https')
const fetch = require('node-fetch')
let URL = urlMod.URL

const  googleIt = require('google-it')
 
googleIt({'query': 'covfefe irony'}).then(results => {
  // access to results object here
  console.log(results)
}).catch(e => {
  // any possible errors that might have occurred (like no Internet connection)
  console.log(e)
})
 
// with request options
const options = {
  'proxy': 'socks4://98.190.102.62:4145',
  'Origin': 'http://localhost/'
};
googleIt({options, 'query': 'covfefe irony'}).then(results => {
  // access to results object here
  console.log(results)
}).catch(e => {
  // any possible errors that might have occurred (like no Internet connection)
  console.log(e)
})

function githubAPI( request, data ) {
  request.hostname = "api.github.com";
  request.headers = request.headers || {};
  request.headers[ "Accept" ] = "application/vnd.github.v3+json";
  request.headers[ "User-Agent" ] = `${process.env.TRAVIS_REPO_SLUG}`;
  request.headers[ "Authorization" ] = `token ${process.env.RELEASES_API_KEY}`;

  return new Promise( ( resolve, reject ) => {
    let req = HTTPS.request( request, response => {
      let buffer = [];
      let done = response.statusCode >= 200 && response.statusCode < 300 ? resolve : reject;
      response.on( "data", d => buffer.push( d ) );
      response.on( "end", () => done( JSON.parse( buffer.join( "" ) ) ) );
    });
    req.on( "error", reject );
    if ( data ) {
      req.write( data );
    }
    req.end();
  });
}