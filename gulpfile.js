var gulp = require('gulp');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var inlineFonts = require('gulp-inline-fonts');
var merge = require('gulp-merge');
var filter = require('gulp-filter');
var debug = require('gulp-debug');
var clean = require('gulp-clean');
var cssfont64 = require('gulp-cssfont64');  
var concat = require('gulp-concat');
var stream  = require('merge-stream');
var inlineSource = require('gulp-inline-source');
var handlebars = require('gulp-static-handlebars');
var handlebarsHelper = require('gulp-handlebars-all');
var htmlMinifier = require('gulp-html-minifier');
var image = require('gulp-image');

/*=====================================================================================Begin Configuration*/
var _config = {
    distribRoot: 'dist',
    distribFont: '/fonts/',
    fontDestRoot: 'content/fonts',
    handlebarsPageRoot: 'Views/handlebars/*.hbs',
    srcScss: ['content/stylesheet/src/**/*.scss'],
    libSrc: ["content/stylesheet/src/lib/**/"],
    minSrc: ['[x0]/*.css', '![x0]/*.min.css'],
    fontConfiguration : {
        name:'text-font',
        rootPath:'ext/helvetica-neue/',
        configurationList: [
            {
                name:'yolo',
                fileName:'HelveticaNeue-400.woff',
                options:{
                    name:'font',
                    style: 'normal',
                    weight: 'normal',
                    formats: ['woff'] // also supported: 'ttf', 'eot', 'otf', 'svg'
                }
            },
            {
                name:'yolo',
                fileName:'HelveticaNeue-700.woff',
                options:{
                    name:'font',
                    style: 'normal',
                    weight: 'bold',
                    formats: ['woff'] // also supported: 'ttf', 'eot', 'otf', 'svg'
                }
            }
        ]
    },
    fontPictoConfig :{
        name:'picto-font',
        rootPath:'bower_components/Font-Awesome/fonts/',
        configurationList: [
            {
                fileName:'*',
                options:{
                    name:'FontAwesome',
                    style: 'normal',
                    weight: 'normal',
                    formats: ['woff', 'woff2','eot','svg'] // also supported: 'ttf', 'eot', 'otf', 'svg'
                }
            }
        ]
    }
};

/*=====================================================================================End Configuration*/

/*=====================================================================================Begin helpers*/

var helpers = {
    getMinifySource : function(config){
        var result = [];
        config.minSrc.forEach(function(item){
            result.push(item.replace('[x0]', _config.distribRoot))
        });
        return result;
    },

    noPartials : function (file) {
        var path = require('path');
        var dirSeparator = path.sep.replace('\\', '\\\\');
        var relativePath = path.relative(process.cwd(), file.path);
        return !new RegExp('(^|' + dirSeparator + ')_').test(relativePath);
    },

    fontFunction : function (it) {       
        var strm = stream();
        var libName =it.name;   

        it.configurationList.forEach(function(conf){            
            console.log(conf);
            strm.add(gulp.src(it.rootPath + conf.fileName)
                .pipe(debug({ title:'debug - '+ it.name }))
                .pipe(inlineFonts(conf.options)));
        });
        
        strm.pipe(concat(libName + '.css')).pipe(gulp.dest(_config.fontDestRoot));

    return strm.isEmpty();
    }
};



/*=====================================================================================End helpers*/

/*=====================================================================================Begin tasks*/
gulp.task('clear', function () {
    return gulp.src(_config.distribRoot, { read: false, force: true })
    .pipe(debug({ title: 'debug-clean' }))
    .pipe(clean());
});

gulp.task('image', function () {
  gulp.src('ext/images/*')
    .pipe(image({
      pngquant: true,
      optipng: false,
      zopflipng: true,
      jpegRecompress: false,
      jpegoptim: true,
      mozjpeg: true,
      gifsicle: true,
      svgo: true,
      concurrent: 10
    }))
    .pipe(gulp.dest('content/images'));
});

gulp.task('picto',['font'], function(){
    helpers.fontFunction(_config.fontPictoConfig);
});
gulp.task('font', function(){
    helpers.fontFunction(_config.fontConfiguration);
});

gulp.task('sass',['clear'], function () {
    return gulp.src(_config.srcScss)//, '/**/*.scss'
    .pipe(debug({ title: 'debug-transpileSassTask' }))
    .pipe(sass({includePaths:_config.libSrc}))
    .pipe(sourcemaps.init())
    .pipe(filter(helpers.noPartials))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(_config.distribRoot));
});

gulp.task('minify', ['sass'], function () {
    return gulp.src(helpers.getMinifySource(_config))
    .pipe(debug({ title: 'debug-minifyCssTask' }))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'));
});

gulp.task('handlebars',['minify'], function(){
    return gulp.src(_config.handlebarsPageRoot)
    .pipe(handlebarsHelper('html', {
        partials:['Views/handlebars/partials/*.hbs']
    }))
    .pipe(rename(function (path) {
        path.extname = ".html"
    }))
    .pipe(htmlMinifier({collapseWhitespace: true,removeComments:true}))
    .pipe(gulp.dest('Views/compiled'));
});

gulp.task('html-inline', ['handlebars'], function(){
    var options = {
        compress: true
    };

    return gulp.src('Views/compiled/*.html')
    .pipe(inlineSource(options))
    .pipe(gulp.dest(''))
});
/*=====================================================================================End tasks*/

/*=====================================================================================Begin Main Tasks*/

gulp.task('build-default', ['image','picto','html-inline']);

/*=====================================================================================Begin Main Tasks*/
gulp.task('default', ['sass'], function () {
    var watchSource = [
        _config.srcScss,
        'Views/**/*.hbs'
    ];
    gulp.watch(watchSource, ['html-inline']);
});
