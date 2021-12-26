// 实现这个项目的构建任务
const {
  src,
  dest,
  parallel,
  series,
  watch
} = require("gulp")
const cwd = process.cwd()

//插件
const plugins = require("gulp-load-plugins")()
const del = require("del");
const bs = require("browser-sync").create()
const sass = require('gulp-sass')(require('sass'))

//配置
const config = {
  output: {
    dist: 'dist',
    dev: 'temp',
  },
  input: {
    base: 'src',
    script: "**/*.js",
    page: "*.html",
    style: "**/*.{scss, css}",
    image: '**/*.{png,jpg,gif,ico,svg,eot,ttf,woff}',
    public: 'public',
  },
  data: {
    menus: [
      {
        name: 'Home',
        icon: 'aperture',
        link: 'index.html'
      },
      {
        name: 'Features',
        link: 'features.html'
      },
      {
        name: 'About',
        link: 'about.html'
      },
      {
        name: 'Contact',
        link: '#',
        children: [
          {
            name: 'Twitter',
            link: 'https://twitter.com/w_zce'
          },
          {
            name: 'About',
            link: 'https://weibo.com/zceme'
          },
          {
            name: 'divider'
          },
          {
            name: 'About',
            link: 'https://github.com/zce'
          }
        ]
      }
    ],
    pkg: require('../package.json'),
    date: new Date()
  }
}

// 覆盖配置文件
try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (e) { }

const srcOptions = {
  base: config.input.base,
  cwd: config.input.base,
}

const outputDev = () => dest(config.output.dev)

const outputDist = () => dest(config.output.dist)

const clean = () => del(Object.values(config.output))

const script = () =>
  src(config.input.script, srcOptions)
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(outputDev())
    .pipe(bs.reload({ stream: true }))

const page = () =>
  src(config.input.page, srcOptions)
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))
    .pipe(outputDev())
    .pipe(bs.reload({ stream: true }))

const style = () =>
  src(config.input.style, srcOptions)
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(outputDev())
    .pipe(bs.reload({ stream: true }))

const imagemin = () =>
  src(config.input.image, srcOptions)
    .pipe(plugins.imagemin())
    .pipe(outputDist())

const distOther = () =>
  src(['**/*.*', '!**/*.{js,css,scss,html}', `!${config.input.image}`], srcOptions)
    .pipe(outputDist())

const extra = () => {
  return src('**/*.*', {
    base: config.input.public,
    cwd: config.input.public,
  })
    .pipe(outputDist())
}

const server = () => {
  const options = {
    cwd: config.input.base,
  }
  watch('**/*.*', options, bs.reload())
  watch(config.input.style, options, style)
  watch(config.input.script, options, script)
  watch(config.input.page, options, page)

  bs.init({
    open: false,
    server: {
      baseDir: [config.output.dev, config.input.public, config.input.base],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src(config.output.dev + '/' + config.input.page, {
    base: config.output.dev,
    cwd: config.output.dev,
  })
    .pipe(plugins.useref({ searchPath: [config.output.dev, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(outputDist())
}

const compile = parallel(style, script, page)

const dev = series(clean, compile, server)

const build = series(clean, parallel(series(compile, useref), imagemin, distOther, extra))

module.exports = {
  dev,
  build
}
