const gulp = require('gulp');
const babel = require('gulp-babel'); // 语法转换
const sass = require('gulp-sass');//编译scss文件为css
const postcss = require('gulp-postcss'); //设置浏览器版本自动处理浏览器前缀
const autoprefixer = require('autoprefixer');//postcss的插件  添加CSS私有前缀
const cleancss = require('gulp-clean-css');//css压缩
const cssver = require('gulp-make-css-url-version');//给css文件里引用url加版本号（根据引用文件的md5生产版本号
const imagemin = require('gulp-imagemin') //图片压缩
const uglify = require('gulp-uglify'); // js压缩
const concat = require('gulp-concat'); // 合并文件
const htmlmin = require('gulp-htmlmin'); //html压缩
const rev = require('gulp-rev');//对文件名加MD5后缀
const revCollector = require('gulp-rev-collector');//替换文件名加MD5后缀的路径
const clean = require('gulp-clean');// 清空文件夹
const del = require('del');
const connect = require('gulp-connect');//引入gulp-connect模块
const revAll = require('gulp-rev-all'); // https://zhuanlan.zhihu.com/p/25677151
const plugins = require('gulp-load-plugins')(); //这是一个用于自动加载插件的gulp插件
// const watch=require('gulp-watch');//监视
//const useref = require('gulp-useref')//对html页面中的js，css引用进行部分合并并替换路径，压缩等操作很简单
//const gulpif = require('gulp-if')//条件判断

//配置路径
const baseUrl = './src/';
const distUrl = './dist/';
const configUrl = {
    file: {
        css: baseUrl + 'css/*.css',
        scss: baseUrl + 'scss/*.scss',
        images: baseUrl + 'images/**/*',
        js: baseUrl + 'js/*.js',
        html: baseUrl + '*.html'
    },
    folder: {
        css: baseUrl + 'css',
    },
    dist: {
        css: distUrl + 'css',
        images: distUrl + 'images',
        js: distUrl + 'js',
        html: distUrl,
        rev: distUrl + 'rev'
    }
}

// 在不使用文件流的情况下，向task的函数里传入一个名叫done的回调函数，以结束task
gulp.task('test',done => {
    console.log('hello');
    done();
});

// 编译sass文件
gulp.task('sass', async () => {
    await gulp.src(configUrl.file.scss)
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer(
            {
                // 兼容主流浏览器的最新两个版本
                browsers: ['last 2 versions'],
                // 是否美化属性值
                cascade: false
            }
        )]))
        .pipe(gulp.dest(configUrl.folder.css))
});

//css合并压缩
gulp.task('css', async () => {
    await gulp.src(configUrl.file.css)
        .pipe(cssver()) //给css文件里引用文件加版本号（文件MD5）
        .pipe(rev())//给css文件增加md5后缀
        .pipe(cleancss({
            compatibility: 'ie7',//保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
            format: 'keep-breaks',//是否保留换行
            keepSpecialComments: '*'//保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
        }))
        .pipe(gulp.dest(configUrl.dist.css))
        .pipe(rev.manifest('rev-css-manifest.json'))//替换文件名准备工作
        .pipe(gulp.dest(configUrl.dist.rev));//替换文件名准备工作
});

//图片压缩
gulp.task('image', async ()=> {
    await gulp.src(configUrl.file.images)
        .pipe(imagemin({
            progressive: true,//类型：Boolean 默认：false 多次优化svg直到完全优化
            svgoPlugins: [{removeViewBox: false}]//不要移除svg的viewbox属性
        }))
        .pipe(gulp.dest(configUrl.dist.images))
});

//js压缩
gulp.task('js', async () => {
    await gulp.src(configUrl.file.js)
        // .pipe(concat("all.min.js"))//将所有js文件合并成all.min.js文件
        .pipe(babel({"presets": ["env"]})) //将ES6代码转译为可执行的JS代码
        .pipe(uglify({
            mangle:true,//类型：Boolean 默认：true 是否修改变量名  排除混淆关键字
            compress:true,//类型：Boolean 默认：true 是否完全压缩
        }))
        .pipe(rev())
        .pipe(gulp.dest(configUrl.dist.js))
        .pipe(rev.manifest('rev-js-manifest.json'))//替换文件名准备工作
        .pipe(gulp.dest(configUrl.dist.rev));//替换文件名准备工作;
})

//html压缩
gulp.task('html1', async () => {
    var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        // collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        // removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        // removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        // minifyJS: true,//压缩页面JS
        // minifyCSS: true//压缩页面CSS
    };
    await gulp.src(configUrl.file.html)
        .pipe(htmlmin(options))
        .pipe(gulp.dest(configUrl.dist.html));
})

//html压缩
gulp.task('html', async () => {
    await gulp.src(['./src/index.html','./src/views/*.html'],{base: './src'})
        .pipe(htmlmin({
            removeComments: true,//清除HTML注释
            collapseWhitespace: true,//压缩HTML
        }))
        .pipe(gulp.dest(configUrl.dist.html));
})

//替换增加md5后文件名
gulp.task('rev', async () => {
    await gulp.src([configUrl.dist.rev + '/*.json','./dist/**/*.html'],{base: './dist'})
        .pipe(revCollector({replaceReved:true}))
        .pipe(gulp.dest(configUrl.dist.html));
})

gulp.task('revAll', function () {
    return gulp
        .src(['dist/**'])
        .pipe(gulp.dest('dist/assets'))
        .pipe(revAll.revision())
        .pipe(gulp.dest('dist/assets'))
        .pipe(revAll.versionFile())
        .pipe(gulp.dest('dist/assets'))
        .pipe(revAll.manifestFile())
        .pipe(gulp.dest('dist/assets'));
});


//拷贝不需要打包的文件
gulp.task('copy', async () => {
    await gulp.src(['./src/fonts/*','./src/libs/*'],{base: './src'})
        .pipe(gulp.dest('./dist'));
})

// 清空dist文件夹
gulp.task('clean', async () =>{
    await del([ distUrl ]);
});


gulp.task('watchs',function(){
    gulp.watch(configUrl.file.scss,gulp.series('sass'));
});

gulp.task('connect', function () {
    connect.server({
        root: "app",
        port: 8081,
        livereload: true,
    });
});

gulp.task('dev',gulp.series(gulp.parallel('watchs','connect')))

/*
执行1：gulp build 之后
执行2：gulp rev 替换页面中的css js 路径
*/
gulp.task('build', gulp.series('clean',gulp.parallel('css', 'image','js', 'html','copy')));