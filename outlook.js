const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const crypto = require('crypto');

const app = express();
const port = 3002;

const generateCodeVerifier = () => {
    return crypto.randomBytes(32).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const deriveCodeChallenge = (codeVerifier) => {
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return codeChallenge;
};

const codeVerifier = generateCodeVerifier();
const codeChallenge = deriveCodeChallenge(codeVerifier);

passport.use(new OIDCStrategy({
    identityMetadata: 'https://login.microsoftonline.com/38d96b2a-feed-4004-8457-2c47bc1fa217/v2.0/.well-known/openid-configuration', // replace {tenant_id} with your Azure AD tenant ID
    clientID: '58157f34-b7ec-4a9a-9643-dca3659f3ba1', // 
    responseType: 'code id_token',
    responseMode: 'query',
    redirectUrl: 'http://localhost:3002/authentication',
    allowHttpForRedirectUrl: true,
    clientSecret: '0a0fcb62-2e85-4723-86f0-8dfad8bbbdbd', // replace with your Azure AD app client secret
    scope: ['openid', 'profile', 'email'],
    usePKCE: true,
    pkceCodeVerifier: codeVerifier,
    pkceCodeChallenge: codeChallenge,
},
(iss, sub, profile, accessToken, refreshToken, done) => {
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken; // fix the variable name here
    return done(null, profile);
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require('express-session')({
    secret: '0a0fcb62-2e85-4723-86f0-8dfad8bbbdbd',
    resave: true,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

app.get('/login', passport.authenticate('azuread-openidconnect'));

app.get('/authentication', passport.authenticate('azuread-openidconnect', { scope: ['profile', 'email', 'openid'] }));

app.get('/callback',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
    (req, res) => {
        const accessToken = req.user.accessToken;
        const id = 'MarcusPham02@gmail.com'; 

        const url = `https://graph.microsoft.com/v1.0/${id}/events`;

        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('failed to fetch data');
            }
            return response.json();
        })
        .then(data => {
            // Handle the fetched data, or redirect/render a response
            console.log(data);
            res.send('Testing');
        })
        .catch(error => {
            // Handle errors, e.g., log the error and render an error page
            console.error(error);
            res.status(500).send('Internal Server Error');
        });
    });

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(port, () => {
    console.log('Server is up at', port);
});







