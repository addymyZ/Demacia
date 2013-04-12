# Files
- **DemaciaTV/**
  - **public/**
     - **images/**
         - ajax_loader.gif
             - Image used as a placeholder while an ajax call is being made.
         - favicon.ico
             - The favicon we use for the web app.
     - **javascripts/**
         - jquery.hotkeys.min.js
             - jQuery plugin for using hotkeys.
         - jquery.livestream[.min].js
             - jQuery plugin for embedding TwitchTV streams (and it's minified counterpart), were heavily modified to strip out functionality we didn't want. A full changelog was outlined at the top of the code in comments.
         - socket.io.min.js
             - Client-side library for socket.io
         - twitch-main.js
             - Our main client-side code.
         - twitch-sdk.js
             - Twitch JS SDK. We only had this file included for reference, we pull it from an external source (Amazon AWS) when included on the client.
     - **libs/**
         - **jquery-ui-1.10.1.custom/**
             - Contains the entire jQuery UI library, with custom colours as generated by the jQuery UI website.
     - **stylesheets/**
         - style.[styl/css]
             - Stylesheet used on the main app page.
         - user.[styl/css]
             - Stylesheet used on the user page.
  - **views/**
     - db-manager.jade
         - Structure for the /db-manager page, which displays the data stored in the accountprovider collection.
     - index.jade
         - Structure for the main app page.
     - layout.jade
         - Base layout structure used by most pages.
     - post.jade
         - Structure used for the /post page, which was used for testing database functionality.
     - twitch-headers.jade
         - Multiple javascript include definitions for the client code.
     - twitch-login-button.jade
         - Block that displays the login button and username (if connected).
  - **routes/**
     - index.js
         - Main app page's route. Renders the app with jade.
  - run.bat
     - Script to start the app in Windows. Only runs node, mongoDB is assumed to already be running as a service.
  - accountprovider.mongodb.js
     - MongoDB wrapper to allow for easy interation with the database from our main server code.
  - app.js
     - Main server code. Also includes socket.io event code.
  - exampleDBEntry.txt
     - Example mockup of what a JSON object in our database should usually look like.