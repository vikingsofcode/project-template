var path        = require('path'),
    gulp        = require('gulp'),
    gutil       = require('gulp-util'),
    browserify  = require('browserify'),
    sync        = require('browser-sync'),
    jade        = require('gulp-jade'),
    minify      = require('gulp-minify-css'),
    rename      = require('gulp-rename'),
    plumber     = require('gulp-plumber'),
    prefix      = require('gulp-autoprefixer'),
    stylus      = require('gulp-stylus'),
    source      = require('vinyl-source-stream'),
    watchify    = require('watchify'),
    uglify      = require('gulp-uglify'),
    supervisor  = require('gulp-supervisor'),
    streamify   = require('gulp-streamify'),
    del         = require('del');

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
  index: {
    source:       'index.js',
    watch:        'index.js',
    destination:  'build'
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

gulp.task('clean-index', function(cb) {
  del([paths.index.destination + '/index.js'], cb);
});

gulp.task('clean-server', function(cb) {
  del([paths.server.destination  + '*.js'], cb);
});

gulp.task('scripts', ['clean-scripts'], function() {
  var bundle = browserify({
    entries: [paths.scripts.source],
    extensions: ['.js']
  });

  var build = bundle.bundle({
    debug: !production
  }).on('error', handleError)
    .pipe(source(paths.scripts.filename));

  if (production) {
    build.pipe(streamify(uglify()));
  }

  return build.pipe(gulp.dest(paths.scripts.destination));

});

gulp.task('templates', ['clean-templates'], function() {
  return gulp.src(paths.templates.source)
             .on('error', handleError)
             .pipe(gulp.dest(paths.templates.destination));
});

gulp.task('partials', ['clean-partials'], function() {
  return gulp.src(paths.partials.source)
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

  return styles.pipe(gulp.dest(paths.styles.destination));
});

gulp.task('media', ['clean-media'], function() {
  return gulp.src(paths.media.source)
             .pipe(gulp.dest(paths.media.destination));
});

gulp.task('index', ['clean-index'], function() {
  return gulp.src(paths.index.source)
             .pipe(gulp.dest(paths.index.destination));
});

gulp.task('server', ['clean-server'], function() {
    return gulp.src(paths.server.source)
               .pipe(gulp.dest(paths.server.destination));
});

gulp.task('fontawesome', ['clean-styles'], function() {
  return gulp.src(paths.bower.source + 'fontawesome/css/*.min.css')
             .pipe(gulp.dest(paths.styles.destination));
});

gulp.task('fontawesome-fonts', ['fontawesome'], function() {
  return gulp.src(paths.bower.source + 'fontawesome/fonts/*.*')
             .pipe(gulp.dest(paths.bower.fontsdest));
});

gulp.task('supervision', ['build'], function() {
    supervisor('build/index.js', {
      extensions: ['js,html'],
      ignore: ['client/scripts', 'build/client/js/', 'server/']
    });
})

gulp.task('watch', ['supervision'], function() {

  gulp.watch(paths.styles.watch, ['styles', sync.reload]);
  gulp.watch(paths.templates.watch, ['templates', sync.reload]);
  gulp.watch(paths.partials.watch, ['partials', sync.reload]);
  gulp.watch(paths.media.watch, ['media', sync.reload]);
  gulp.watch(paths.index.watch, ['index', sync.reload]);
  gulp.watch(paths.server.watch, ['server']);

  var config = {
    files: [paths.scripts.source, paths.styles.source, paths.templates.source, paths.partials.source, paths.media.source,  paths.scripts.destination, paths.styles.destination, paths.templates.destination, paths.partials.destination, paths.media.destination, paths.index.source, paths.index.destination, './build/client/bundle.js'],
    port: 7678,
    proxy: 'localhost:6678',
    open: false,
    reloadDelay: 2000
  };

  sync(config, function(err, bs) {
    if(!err) {
      console.log("There stands an ash called Yggdrasil,\nA mighty tree showered in white hail.\nFrom there come the dews that fall in the valleys.\nIt stands evergreen above Urd’s Well.");
    }
  });

  var bundle = watchify({
    entries:    [paths.scripts.source],
    extensions: ['.js']
  });

  return bundle.on('update', function() {
    var build;
    build = bundle.bundle({ debug: !production })
                  .on('error', handleError)
                  .pipe(source(paths.scripts.filename));
    return build.pipe(gulp.dest(paths.scripts.destination))
                .pipe(sync.reload({ stream: true }));
  }).emit('update');


});

gulp.task('build', ['templates', 'partials', 'styles', 'media', 'scripts', 'index', 'server', 'fontawesome', 'fontawesome-fonts']);

gulp.task('start', ['build', 'supervision', 'watch']);

gulp.task('default', ['build']);