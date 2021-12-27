# cong-pages

> 使用gulp开发的静态网站工作流

样式支持sass编译、html使用ejs模版、js带babel转义

默认配置

```javascript
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
```



## 工作命令

```javascript
cong-pages dev
cong-pages build
cong-pages clean
```



### cong-pages dev 

执行的任务

```javascript
const compile = parallel(style, script, page)

const dev = series(clean, compile, server)
```



首先执行clean任务，清理开发输出文件

```javascript
const del = require("del");
const clean = () => del(Object.values(config.output)) 
```

同时执行style，page，script任务对开发目录下的文件进行编译，并打包到temp目录

```javascript
const script = () =>
  src(config.input.script, srcOptions)
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] })) //babel转译es6代码
    .pipe(outputDev())
    .pipe(bs.reload({ stream: true }))

const page = () =>
  src(config.input.page, srcOptions)
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) //使用模版传入数据
    .pipe(outputDev())
    .pipe(bs.reload({ stream: true }))

const style = () =>
  src(config.input.style, srcOptions)
    .pipe(sass({ outputStyle: 'expanded' })) // sass编译
    .pipe(outputDev())
    .pipe(bs.reload({ stream: true }))
```

最后执行server任务，使用gulp的watch方法监听开发目录下的文件变化，重新编译代码，并且触发服务器更新，最后初始化启动服务器，传入文件路径

```javascript
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
```

### cong-pages build

执行任务如下

```javascript
const build = series(clean, parallel(series(compile, useref), imagemin, distOther, extra))
```

clean 、style、page、script和dev相同

useref任务把temp内代码打包压缩合并放入dist中

```javascript
const useref = () => {
  return src(config.output.dev + '/' + config.input.page, {
    base: config.output.dev,
    cwd: config.output.dev,
  })
    .pipe(plugins.useref({ searchPath: [config.output.dev, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify())) //压缩js文件
    .pipe(plugins.if(/\.css$/, plugins.cleanCss())) //压缩样式文件
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({ //压缩html
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(outputDist())
}
```

distOther任务把开发目录下剩下的文件复制到dist

```javascript
const distOther = () =>
  src(['**/*.*', '!**/*.{js,css,scss,html}', `!${config.input.image}`], srcOptions)
    .pipe(outputDist())
```

extra任务把public目录下的文件复制到dist

```javascript
const extra = () =>
  src('**/*.*', {
    base: config.input.public,
    cwd: config.input.public,
  })
    .pipe(outputDist())
```

最后把gulp配置文件放入lib/index.js作为项目入口，在bin/cong-pages.js页面配置执行gulp-cli

```javascript
process.argv.push('--cwd')
process.argv.push(process.cwd()) //指定执行文件跟路径
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..')) //指定gulp配置文件为当前文件入口

require('gulp-cli')() //调用gulp-cli执行配置文件进行构建
```

### 发布到npm

最后npm publish发布npm包，然后在本地即可直接使用npm包进行开发

[npm包地址](https://www.npmjs.com/package/cong-pages)

```javascript
npm i cong-pages -D
```

使用yeoman，可得到完整的开发模版

[generator-cong](https://www.npmjs.com/package/generator-cong)

```
npm i yo -g
npm i generator-cong -g
yo cong
```

