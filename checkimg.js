/**
 * Created by qiankun on 2018/7/5.
 */
const https = require('https')
const fs = require('fs')
const moment = require('moment')

var arr = [
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/qrcode-3-445.png" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/201709/qrcode-7ed7b.png" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/20180101/0101-logo-af455.png" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/personindex-f38e8.png" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/handindex-d78fa.png" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/20171111/car-billboard-bg-2ecbe.png" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/car-festival/get-redpacket-pc-e2b60.gif" }, 
  { "src": "https://x.autoimg.cn/mall/2016/m/images/20171111/share-icon-weibo-8662e.png" }, 
  { "src": "https://x.autoimg.cn/mall/2016/m/images/20171111/share-icon-zone-68696.png" }, 
  { "src": "https://x.autoimg.cn/mall/topic/2017/5/draw/m/images/linken-pc.jpg" }, 
  { "src": "https://x.autoimg.cn/mall/topic/2017/5/draw/m/images/xuefolan-pc.jpg" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/20171111/erweima-a972e.png" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/201804/middle-adv-a-f824c.jpg" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/logo-footer-e8f46.png" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/qrcode-2-e1.png" }, 
  { "src": "https://x.autoimg.cn/mall/2015/pc/images/201709/qrde-7ed7b.png" }
]
const ERRFILE = `// 错误图片列表 ${moment().format('YYYY-MM-DD')}`
  fs.writeFile('./err.js', ERRFILE + '\r\n' , err => {
})

for(var i =0; i< arr.length; i++) {
  https.get(arr[i].src, res => {
    let code = res.statusCode
    if (code != 200) {
      let errnode = {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        path: res.req.path
      }
      console.warn(JSON.stringify(errnode))
      fs.appendFile('./err.js', JSON.stringify(errnode) + ', \r\n', err => {
        if (err) console.log('写文件错误')
        console.log('写入错误列表成功')
      })
    }
  })
}