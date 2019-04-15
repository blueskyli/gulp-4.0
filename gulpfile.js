const {src, dest, watch, series, parallel} = require('gulp')
const del = require('del');
//处理md5文件名
const revAll = require('gulp-rev-all');
const revReplace = require('gulp-rev-replace');
const cssver = require('gulp-make-css-url-version');
const sass=require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleancss = require('gulp-clean-css');
const babel=require('gulp-babel');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin')
const htmlmin = require('gulp-htmlmin');
const fileinclude = require('gulp-file-include');
const connect = require('gulp-connect');

//配置路径
const baseUrl = './app/';
const distUrl = './dist/';
const tplUrl = './tpl/';
const configUrl = {
    file: {
        css: baseUrl + 'css/**/*.css',
        scss: baseUrl + 'scss/**/*.scss',
        images: baseUrl + 'images/**/*',
        js: baseUrl + 'js/**/*.js',
        libs: baseUrl + 'js/libs/**/*.js',
        fonts: baseUrl + 'fonts/**/*',
        html: baseUrl + '**/*.html',
        tpl: tplUrl + '**/*.html',
        tpl_include: tplUrl + '_include/**/*.html'
    },
    folder: {
        css: baseUrl + 'css',
        html: baseUrl
    },
    dist: {
        css: distUrl + 'css',
        images: distUrl + 'images',
        js: distUrl + 'js',
        html: distUrl,
        rev: distUrl + 'rev'
    }
}
//删除dist
const clean = () => del([distUrl])
//删除生成的html文件，保留文件夹
const cleanHtml = () => del([configUrl.file.html])

const scss = () => src(configUrl.file.scss)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer(
        {
            // 兼容主流浏览器的最新两个版本
            browsers: ['last 2 versions'],
            // 是否美化属性值
            cascade: false
        }
    )]))
    .pipe(dest(configUrl.folder.css));

const baleCss = () => src(configUrl.file.css)
    .pipe(cssver())
    .pipe(cleancss({
        compatibility: 'ie7',//保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
        format: 'keep-breaks',//是否保留换行
        keepSpecialComments: '*'//保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
    }))
    .pipe(revAll.revision({"fileNameManifest":"rev-css-manifest.json"}))
    .pipe(dest(configUrl.dist.css))
    .pipe(revAll.manifestFile())
    .pipe(dest(configUrl.dist.rev));

const baleJs = () => src([configUrl.file.js,'!' + configUrl.file.libs])
    .pipe(babel({ presets: ['@babel/env'] })) // ES6转ES5
    .pipe(uglify({
        mangle:true,//类型：Boolean 默认：true 是否修改变量名  排除混淆关键字
        compress:true,//类型：Boolean 默认：true 是否完全压缩
    }))
    .pipe(revAll.revision({"fileNameManifest":"rev-js-manifest.json"}))
    .pipe(dest(configUrl.dist.js))
    .pipe(revAll.manifestFile())
    .pipe(dest(configUrl.dist.rev));

const baleImages = () => src(configUrl.file.images)
    .pipe(imagemin({
        progressive: true,//类型：Boolean 默认：false 多次优化svg直到完全优化
        svgoPlugins: [{removeViewBox: false}]//不要移除svg的viewbox属性
    }))
    .pipe(dest(configUrl.dist.images))

// const baleHtml = () => src([baseUrl + 'index.html',baseUrl + 'views/*.html'],{base: baseUrl})
const baleHtml = () => src(configUrl.file.html)
    .pipe(htmlmin({
        removeComments: true,//清除HTML注释
        collapseWhitespace: true//压缩HTML
    }))
    .pipe(revReplace({manifest:src(configUrl.dist.rev + '/*.json')}))
    .pipe(dest(configUrl.dist.html));

const baleCopy = () => src([configUrl.file.fonts,configUrl.file.libs],{base: baseUrl})
    .pipe(dest(distUrl))

const file = () => src([configUrl.file.tpl,'!' + configUrl.file.tpl_include])
    .pipe(fileinclude({
        prefix: '@@',//变量前缀 @@include
        basepath: './tpl/_include',//引用文件路径
        indent:true//保留文件的缩进
    }))
    .pipe(dest(configUrl.folder.html));

const reload = () => src(configUrl.file.html)
    .pipe(connect.reload());

const watchs = () => {
    watch(configUrl.file.tpl,series(cleanHtml,file));
    watch(configUrl.file.scss,scss);
    watch(baseUrl + "**/*.*", reload);

    connect.server({
        root: baseUrl,
        port: 8080,
        livereload: true,
    });
}

exports.file = file;
exports.clean = clean;

//启动项目
exports.default = watchs;
//打包项目
exports.build = series(clean,parallel(baleCss, baleJs, baleImages, baleCopy),baleHtml);