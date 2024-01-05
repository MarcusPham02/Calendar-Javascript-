const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const fs = require('fs');

const app = express();
const port = 3001;

// Passport Configuration
passport.use(new GoogleStrategy({
  clientID: '769184318680-m9mnki58rnr535ie3ck51lp7j9564slk.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:3001/google/api',
},
(accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Express Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require('express-session')({
  secret: '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',
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  fs.readFile('index.html', 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read index.html');
      res.status(500).send('Internal Server Error');
    } else {
      res.send(data);
    }
  });
});

app.get('/google', passport.authenticate('google', { scope: ['profile', 'email', 'openid', 'https://www.googleapis.com/auth/calendar'] }));

app.get('/google/api',
  passport.authenticate('google', { scope: ['profile', 'email', 'openid', 'https://www.googleapis.com/auth/calendar'] }),
  (req, res) => {
    // Check if the event ID is provided in the query parameters
    const eventId = '34ltuuiv2e9jlcpn4mrv6efdeg';

    // Fetch the Google Calendar API
    const accessToken = req.user.accessToken;
    const calendarId = "MarcusPham02@gmail.com";
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch data from Google Calendar API');
      }
      return response.json();
    })
    .then(data => {
      console.log("Event data:", data);

      const creatorEmail = data.creator && data.creator.email;
      const summary = data.summary;
      const startDateTime = data.start && data.start.dateTime;
      const endDateTime = data.end && data.end.dateTime;

      if (creatorEmail && summary && startDateTime && endDateTime) {
        console.log("Summary:", summary);
        console.log("Start DateTime:", startDateTime);
        console.log("End DateTime:", endDateTime);
        console.log("Creator Email:", creatorEmail);

        res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
              <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
              <title>Document</title>
          </head>
          <body>
              <a href="http://localhost:3001/google/calendar" class="btn btn-primary">Next</a>
          </body>
          </html>
        `);
      } else {
        console.log("Required data not found in the API response.");
        res.status(500).send('Error: Required data not found.');
      }
    })
    .catch(error => {
      console.error("Error fetching data from Google Calendar API:", error);
      res.status(500).send('Error fetching data from Google Calendar API');
    });
});

// Endpoint for /google/calendar
app.get('/google/calendar', (req, res) => {
  fs.readFile('public/third.html', 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read third.html');
      res.status(500).send('Internal Server Error');
    } else {
      res.send(data);
    }
  });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});





