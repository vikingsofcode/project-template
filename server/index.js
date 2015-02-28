var Hapi = require('hapi'),
    Glue = require('glue'),
    path = require('path');

var composeOptions = {
  relativeTo: __dirname
};

var manifest = {
  server: {
    debug: {
      request: ['error']
    },
    connections: {
      routes: {
        security: true
      }
    }
  },
  connections: [
    {
      host: 'localhost',
      port: 6678,
      labels: ['web']
    }
  ],
  plugins: {
    'lout': {},
    'visionary': {
      engines: { jade: 'jade' },
      path: path.join(__dirname, '../client/')
    },
    'hapi-mongo-models': {
      mongodb: {
        url: 'mongodb://localhost:27017/project-template'
      },
      autoIndex: true
    },
    './plugins/web/index': {}
  }
};

Glue.compose(manifest, composeOptions, function (err, server) {
  if(err) {
    throw err;
  }

  server.start(function () {
    console.log('Server started');
  });
});