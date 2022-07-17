let preprocessor = 'scss',
    fileswatch   = 'html,htm,txt,json,md,woff2'

import pkg from 'gulp';
const { gulp, src, dest, parallel, series, watch } = pkg;
import browserSync   from 'browser-sync';
import del   from 'del';
import autoprefixer from 'gulp-autoprefixer';
import fileinclude  from 'gulp-file-include';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import cleancss from 'gulp-clean-css';
import imagemin from 'gulp-imagemin';
import newer from 'gulp-newer';
import rename from 'gulp-rename';
import sourcemaps from 'gulp-sourcemaps';
import svgSprite from 'gulp-svg-sprite';
import uglify from 'gulp-uglify';
import gulpScss      from 'gulp-sass'
import dartScss      from 'sass'
import scssglob      from 'gulp-sass-glob'
const  scss          = gulpScss(dartScss)
import less          from 'gulp-less'
import lessglob      from 'gulp-less-glob'
import styl          from 'gulp-stylus'
import webpack          from 'webpack';
import webpackStream  from 'webpack-stream';

let isProd = false;

function server() {
    browserSync.init({
        server: { baseDir: 'dist/' },
        notify: false,
        online: true
    })
}

function html() {
    return src('src/*.html')
        .pipe(fileinclude())
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function styles() {
    return src(`src/assets/templates/styles/${preprocessor}/*.*`)
        .pipe(plumber({
            errorHandler : function(err) {
                notify.onError({
                    title:    "SCSS Error",
                    message:  "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        }))
        .pipe(sourcemaps.init())
        .pipe(eval(`${preprocessor}glob`)())
        .pipe(eval(preprocessor)({ 'include css': true }))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
        .pipe(cleancss( { level: { 2: { specialComments: 0 }}}))
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('dist/assets/templates/css'))
        .pipe(browserSync.stream());
}
function scripts() {
    return src('src/assets/templates/js/scripts.js')
        .pipe(webpackStream({
            mode: 'development',
            output: {
                filename: 'scripts.js',
            },
            module: {
                rules: [{
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }]
            },
        }))
        .on('error', function (err) {
            console.error('WEBPACK ERROR', err);
            this.emit('end');
        })

        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('.'))
        .pipe(dest('dist/assets/templates/js'))
        .pipe(browserSync.stream());
}
function images() {
    return src('src/assets/templates/images/**/*.{jpg,jpeg,png,svg,ico,gif}')
        .pipe(imagemin())
        .pipe(dest('dist/assets/templates/images'))
        .pipe(browserSync.stream());
}
function svgSprites() {
    return src('src/assets/templates/images/svg/**.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "sprite.svg"
                }
            }
        }))
        .pipe(dest('dist/assets/templates/images'))
        .pipe(browserSync.stream());
}
function fonts() {
    return src('src/assets/templates/fonts/**/*.{woff,woff2}')
        .pipe(dest('dist/assets/templates/fonts'))
        .pipe(browserSync.stream());
}
function resources() {
    return src('src/assets/templates/resources/**/*.*')
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}
function clean() {
    return del('dist/')
}
function startWatch() {
    watch('src/**/*.html', html)
    watch(`src/assets/templates/styles/${preprocessor}/**/*`, { usePolling: true }, styles)
    watch('src/assets/templates/js/**/*.js', scripts)
    watch('src/assets/templates/images/**/*.{jpg,jpeg,png,svg,ico,gif}', images)
    watch('src/assets/templates/images/svg/**.svg', svgSprites)
    watch('src/assets/templates/fonts/**/*.{woff,woff2}', fonts)
    watch('src/assets/templates/resources/**/*.*', resources)
}

function toProd  (done){
    isProd = true;
    done();
}


export default series(clean,html,styles,scripts,images,svgSprites,fonts,resources,parallel(startWatch,server))
export { html,styles,scripts,images,svgSprites,fonts,resources,startWatch }
