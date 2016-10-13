// Sass configuration
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


var _config = {
    distribRoot: 'dist',
    distribFont: '/fonts/',
    fontDestRoot: 'content/fonts',
    srcScss: ['content/stylesheet/src/*.scss'],
    libSrc: ["content/stylesheet/src/lib/**/"],
    minSrc: ['[x0]/*.css', '![x0]/*.min.css']
};

var _fontConfiguration ={
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
    };

var  _fontPictoConfig =     
{
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
};

var noPartials = function (file) {
    var path = require('path');
    var dirSeparator = path.sep.replace('\\', '\\\\');
    var relativePath = path.relative(process.cwd(), file.path);
    return !new RegExp('(^|' + dirSeparator + ')_').test(relativePath);
};

gulp.task('clear', function () {
    return gulp.src(_config.distribRoot, { read: false, force: true })
    .pipe(debug({ title: 'debug-clean' }))
    .pipe(clean());
});

var fontFunction = function (it) {       
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
};

//
gulp.task('picto',['font'], function(){
    fontFunction(_fontPictoConfig);
});
gulp.task('font', function(){
    fontFunction(_fontConfiguration);
});

gulp.task('sass',['clear','picto'], function () {
    return gulp.src(_config.srcScss)//, '/**/*.scss'
    .pipe(debug({ title: 'debug-transpileSassTask' }))
    .pipe(sass({includePaths:_config.libSrc}))
    .pipe(sourcemaps.init())
    .pipe(filter(noPartials))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(_config.distribRoot));
});

var getMinifySource = function(config){
    var result = [];
    config.minSrc.forEach(function(item){
        result.push(item.replace('[x0]', _config.distribRoot))
    });
    return result;
};

gulp.task('minify', ['clear','picto', 'sass'], function () {
    return gulp.src(getMinifySource(_config))
    .pipe(debug({ title: 'debug-minifyCssTask' }))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['sass'], function () {
    gulp.watch(_config.srcScss, ['minify']);
    // gulp.watch(getMinifySource(_config), ['minify']);
    // gulp.watch(['*'], ['picto']);
    // gulp.watch(['*'], ['font']);
});

gulp.task('html-inline', ['minify'], function(){
    return gulp.src('Views/*.html')
    .pipe(inlineSource())
    .pipe(gulp.dest(''))
});


// gulp.task('default-watch', [], function(){
//     gulp.watch(['*.scss', '/lib/**/*.scss'], ['build-default']);
// });

gulp.task('build-default', ['html-inline']);

// var styleguide = require('devbridge-styleguide');

// gulp.task('start-styleguide', function () {
//   styleguide.startServer();
// });