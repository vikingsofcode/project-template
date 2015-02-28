var path        = require('path'),
    gulp        = require('gulp'),
    gutil       = require('gulp-util'),
    browserify  = require('browserify'),
    sync        = require('browser-sync'),
    jade        = require('gulp-jade'),
    minify      = require('gulp-minify-css'),
    plumber     = require('gulp-plumber'),
    prefix      = require('gulp-autoprefixer'),
    stylus      = require('gulp-stylus'),
    source      = require('vinyl-source-stream'),
    watchify    = require('watchify'),
    uglify      = require('gulp-uglify'),
    streamify   = require('gulp-streamify'),
    del         = require('del'),
    nodemon     = require('gulp-nodemon');

var production = process.env.NODE_ENV === 'production';

var paths = {
  scripts: {
    source:       './client/scripts/main.js',
    destination:  'build/client/js/',
    filename:    'bundle.js'
  },
  templates: {
    source:       'client/views/*.jade',
    watch:        'client/views/*.jade',
    destination:  'build/client'
  },
  partials: {
    source:       'client/views/partials/*.jade',
    watch:        'client/views/partials/*.jade',
    destination:  'build/client/views/'
  },
  styles: {
    source:       'client/styles/**/styles.styl',
    watch:        'client/styles/**/*.styl',
    destination:  'build/client/css/'
  },
  media: {
    source:       'client/media/**/*.*',
    watch:        'client/media/**/*.*',
    destination:  'build/client/media/'
  },
  server: {
    source:       'server/**/*.js', 
    watch:        'server/**/*.js', 
    destination:  'build/server/'
  },
  bower: {
    source:       'bower_components/',
    fontsdest:    'build/client/fonts'
  }

}

var handleError = function(err) {
  gutil.log(err);
  gutil.beep();
  return this.emit('end');
}

gulp.task('clean-scripts', function(cb) {
  del([paths.scripts.destination], cb);
});

gulp.task('clean-templates', function(cb) {
  del([paths.templates.destination + '*.jade'], cb);
});

gulp.task('clean-partials', function(cb) {
  del([paths.partials.destination + '*.jade'], cb);
});

gulp.task('clean-styles', function(cb) {
  del([paths.styles.destination + 'styles.css'], cb);
});

gulp.task('clean-media', function(cb) {
  del([paths.media.destination + '**/*.*'], cb);
});

gulp.task('clean-server', function(cb) {
  del([paths.server.destination  + '*.js'], cb);
});

gulp.task('scripts', ['clean-scripts'], function() {
  var bundle = browserify({
    entries: [paths.scripts.source],
    extensions: ['.js']
  });

  var build = bundle.bundle()
                    .on('error', handleError)
                    .pipe(source(paths.scripts.filename));

  if (production) {
    build.pipe(streamify(uglify()));
  }

  return build.pipe(gulp.dest(paths.scripts.destination));

});

gulp.task('templates', ['clean-templates'], function() {
  return gulp.src(paths.templates.source)
             // .pipe(jade({pretty: true}))
             .on('error', handleError)
             .pipe(gulp.dest(paths.templates.destination));
});

gulp.task('partials', ['clean-partials'], function() {
  return gulp.src(paths.partials.source)
             // .pipe(jade({pretty: true}))
             .on('error', handleError)
             .pipe(gulp.dest(paths.partials.destination));
});

gulp.task('styles', ['clean-styles'], function() {
  var styles = gulp.src(paths.styles.source)
                   .pipe(stylus({ set: ['include css'] }))
                   .on('error', handleError)
                   .pipe(prefix('last 2 versions', 'Chrome 34', 'Firefox 28', 'iOS 7'));

  if (production) {
    styles = styles.pipe(CSSmin());
  }

  return styles.pipe(gulp.dest(paths.styles.destination)).pipe(sync.reload({stream: true}));
});

gulp.task('media', ['clean-media'], function() {
  return gulp.src(paths.media.source)
             .pipe(gulp.dest(paths.media.destination))
             .pipe(sync.reload({stream: true}));
});

gulp.task('fontawesome', ['clean-styles'], function() {
  return gulp.src(paths.bower.source + 'fontawesome/css/*.min.css')
             .pipe(gulp.dest(paths.styles.destination));
});

gulp.task('fontawesome-fonts', ['fontawesome'], function() {
  return gulp.src(paths.bower.source + 'fontawesome/fonts/*.*')
             .pipe(gulp.dest(paths.bower.fontsdest));
});

gulp.task('server', ['clean-server'], function() {
    return gulp.src(paths.server.source)
               .pipe(gulp.dest(paths.server.destination));
});

gulp.task('startup', function() {
    nodemon({
      script: 'build/server/index.js',
      ext: 'js jade',
      watch: ['build/server/index.js', 'build/client/**/*.jade'],
      ignore: ['client/**/*.js/', 'build/client/**/*.js']
    })
    .on('restart', function() {
      setTimeout(function() {
        sync.reload({ stream: false });
      }, 1750);
    });
});

gulp.task('watch', function() {

  gulp.watch(paths.styles.watch, ['styles']);
  gulp.watch(paths.scripts.source, ['scripts']).on('change', sync.reload);
  gulp.watch(paths.templates.watch, ['templates']);
  gulp.watch(paths.partials.watch, ['partials']);
  gulp.watch(paths.media.watch, ['media']);
  gulp.watch(paths.server.watch, ['server']);

  var config = {
    port: 7678,
    proxy: 'localhost:6678',
    open: false
  };

  var bundle = watchify(browserify({
    entries:    [paths.scripts.source],
    extensions: ['.js'],
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
  }));

  sync(config, function(err, bs) {
    if(err) {
      console.log(err);
    }
  });

  return bundle.on('update', function() {
    var build;
    build = bundle.bundle()
                  .on('error', handleError)
                  .pipe(source(paths.scripts.filename));
    return build.pipe(gulp.dest(paths.scripts.destination))
                .pipe(sync.reload({ stream: true }));
  }).emit('update');


});

gulp.task('build', ['templates', 'partials', 'styles', 'media', 'scripts', 'fontawesome', 'fontawesome-fonts', 'server']);

gulp.task('start', ['watch', 'startup']);

gulp.task('default', ['build']);