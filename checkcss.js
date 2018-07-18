const https = require('https')
const fs = require('fs')
const request = require("request");
const downloader = require('node-url-downloader')

// 读出页面引用的样式表文件
let cssPath = ["https://x.autoimg.cn/mall/2015/pc/images/favicon.ico",
"https://x.autoimg.cn/com/co.ashx?path=|mall|2015|pc|js|swiper|swiper-3.4.2.min-6af34.css,|mall|topic|2017|9|hbyy|pc|css|game-8a737.css,|mall|2015|pc|css|index-all-aeaa4.css",
"https://x.autoimg.cn/mall/topic/2017/9/mycarage/css/mycarage-9358c.css"]

const FLAG = 'co.ashx?path='
const DOMAIN = 'https://x.autoimg.cn'
var cssTaskList = []
// 获取CSS地址列表
for(var i = 0; i < cssPath.length; i++) {
    // 判断是否为合并的样式表
    if (cssPath[i].includes(FLAG)) {
        let arr = cssPath[i].split(/co.ashx\?path=/)
        let cssSearch = arr[1]
        let cssList = cssSearch.split(',')
        cssList.map(i => {
            cssTaskList.push(DOMAIN + i.replace(/\|/g,'/'))
        })
    } else {
        if (cssPath[i].includes('favicon.ico')) {
        } else {
            // 不合并
            cssTaskList.push(cssPath[i])
        }
    }
}

console.log(cssTaskList)
