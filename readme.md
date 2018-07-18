# 通过puppeteer-demo爬取网站的静态资源，分析静态资源。

### 优势

- **可配置**
    通过配置排查的页面的`URL`地址，根据顺序逐个排查，把错误的静态资源详情持久化。

- **使用灵活**
    本地可以独立配置使用，无需服务端支持。

### 不足

- **被动型**
    人为启动脚本进行排查，也可以添加定时任务，按时间段进行排查。不能主动监听页面缺失文件，不能第一时间找到错误静态资源。


### 概念&流程

目前项目中的图片资源主要是两种使用方式：
- `html`的`img`标签
- `css`文件的`background-image`

针对两种使用方式，采取不同的策略：

- `img`标签使用

以单一页面为单位，爬取HTML并通过`puppeteer`的`page.evaluate()`方法匹配出页面上所有的`<img>`标签中的`src`属性写成数组。通过`node`的`https`模块循环对抓取的数组内`src`进行访问，如果有404，即代表着该静态资源缺失，并把该资源的详情写入错误图片的log日志中`log/*/ERRIMGFILE.js`。

- `css`文件使用

同样以单一页面为单位，爬取HTML抓取页面的`<link>`标签的`rel`属性写成数组。(需要注意的是，一般来说页面上的`css`引用都是通过`<link>`标签的，但是反之则未必，比如页面的一些`icon`也是使用`link`标签引入的，因此我们需要对抓取的`link`标签进行筛选)。根据目前项目的特点，`css`文件有经过服务器压缩合并请求的版本，因此需要对这类的样式文件进行拆分使之成为可以外部可以访问的单一`css`文件。这里我以[汽车之家车商城主会场](https://mall.autohoe.com.cn)引用的服务器合并后的`css`为例分析:

> //x.autoimg.cn/com/co.ashx?path=|mall|2015|pc|js|swiper|swiper-3.4.2.min-6af34.css,|mall|topic|2017|9|hbyy|pc|css|game-8a737.css,|mall|2015|pc|css|index-all-d010e.css

分析得出，我们需要的单一的`css`文件应该是如下这种形式的集合
`
//x.autoimg.cn/mall/2015/pc/js/swiper/swiper-3.4.2.min-6af34.css
//x.autoimg.cn/mall/2015/pc/css/index-all-d010e.css
//x.autoimg.cn/mall/topic/2017/9/hbyy/pc/css/game-8a737.css
`

那么根据目标，我们先将合并的`css`后半部分中的`co.ashx?path=`进行分解，得到3个`css`文件的字符串，该字符串通过`,`拼接，并且在内部是用`|`分割的路径，因此经过一些拆分和替换，再拼上前面的`domain`就得到了一组可用来访问的`css`路径集合。

当然，页面上除了这样经过服务器处理的`css`外，还有一些单独引用的，我们也一并把这些路径添加到上面处理过后的`css`路径集合中。

现在全部的`css`路径我们拿到了，开始逐个文件的排查里面用到的图片。通过`puppeteer`提供的方法`page.goto('css文件地址')`打开一个新的页面，分析页面上的结构，抓取到该`css`的全部内容，通过正则匹配`/\/\/.+?\.(jpg|png|gif)/g`出里面所有的图片。

通过`node`的`https`模块循环对数组内`src`进行访问，如果有404，即代表着该静态资源缺失，并把该资源的详情写入错误图片的log日志中`log/*/ERRCSSIMGFILE.js`。

### 目录&文件的作用

- `log/*/*.js`存放脚本生成的`log`文件。

文件名|介绍|
-----|-----|
**LOGFILE.js**|存放脚本执行的操作。包含有：页面共计引用的`img`标签，页面引用的`css`文件，全部`css`文件中引用的图片，以及每个`css`文件引用的图片路径。
**ERRIMGFILE.js** | 存放错误的`html<img>`标签引入资源。包含的字段有：错误资源条数；错误资源详情的列表。
**ERRCSSIMGFILE.js** | 存放错误的`css`文件引用的图片资源。包含的字段有：错误资源条数；错误资源详情的列表。

- `config.json`添加的排查任务页面。

字段|介绍|
----|----|
**taskAlias**|任务别名：可输入中文，作为快速查看`log`日志的索引。
**taskName**|任务名称：不可输入中文。
**taskUrl**|任务地址：脚本执行的路径，爬虫开始由该地址爬行抓取内容。

- `config.js`脚本的配置文件。

字段|介绍|
----|----|
**cdnPath**|静态资源存放的域名。
**cssPath**|`css`文件存放的域名，带有协议。
**cssFilter**|合并的`css`参数，主要用于匹配合并后的css
**imgReg**| 匹配图片资源规则。

> 针对CDN迁移，需要同步修改`cdnPath`,`cssPath`等字段。

### 模拟的测试文件

[基于tms搭建的测试地址](https://subject.autohome.com.cn/mall/2017/8/testqiankun/)

一个`html`页面,html中引用多张图片，需要有不少于2个的错误`img`资源，引用多份`css`文件，需要有一个合并的`css`文件。并且每个合并的文件需要有多个错误`img`资源。

### TODOS

- 通过配置文件对增加的页面地址统一排查。
- 对新的CDN路径分析，移植到新的CDN环境上。
- 增加一些更加友好的使用体验。

### 参考资料

> [puppeteer中文文档](https://github.com/zhaoqize/puppeteer-api-zh_CN)
> 
