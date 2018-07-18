const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const config = require('./config');
const moment = require('moment');
const colors = require('colors');

const taskAlias = '测试单页面'
const taskName = 'test_demo'
const taskUrl = 'https://subject.autohome.com.cn/mall/2017/8/testqiankun/'
const taskSize = 1

;(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Chromium.app/Contents/MacOS/Chromium',
        timeout: 15000
    })
    // 创建log保存文件夹，创建log错误列表文件
    const ERRIMGFILE = `// img标签引用图片错误列表 —— ${taskName} —— ${moment().format('YYYY-MM-DD HH:mm:SS::SSSS')}`
    const ERRCSSIMGFILE = `// css引用图片错误列表 —— ${taskName} —— ${moment().format('YYYY-MM-DD HH:mm:SS::SSSS')}`
    const LOGFILE = `// 任务列表=====> ${taskName}/${taskAlias} ===> ${moment().format('YYYY-MM-DD HH:mm:SS::SSSS')}` 
    console.log('静态资源检查开始'.bgWhite.yellow + '\r\n')
    console.log(`共有 ${taskSize} 条任务，当前执行第 ${taskSize} 条任务`.bgWhite.yellow + '\r\n');

    fs.mkdir(`./log/${taskAlias}`, err => {
        if (err) throw err
        fs.writeFile(`./log/${taskAlias}/LOGFILE.js`, LOGFILE + '\r\n', err => {
            if (err) throw err
            console.log(`[info]<${taskAlias}>log文件创建完毕`.blue)
        })
        fs.writeFile(`./log/${taskAlias}/ERRIMGFILE.js`, ERRIMGFILE + '\r\n', err => {
            if (err) throw err
            console.log(`[info]<${taskAlias}>img标签引用图片错误列表文件创建完毕`.blue)
        })
        fs.writeFile(`./log/${taskAlias}/ERRCSSIMGFILE.js`, ERRCSSIMGFILE + '\r\n', err => {
            if (err) throw err
            console.log(`[info]<${taskAlias}>css引用图片错误列表文件创建完毕`.blue)
        })
    })

    const page = await browser.newPage()
    await page.goto(taskUrl)

    /*  HTML引用img错误排查开始 */
    let imgList = await page.evaluate(()=>{
        let list = [...document.querySelectorAll('img')]
        return list.map(i=> {
            return i.src
        })
    })
    
    await checkImgFromHtml(imgList)
    await writeLog(JSON.stringify({'name':'页面引用img标签资源', 'size':imgList.length , 'datetime': moment().format('YYYY-MM-DD HH:mm:SS::SSSS'), "list": imgList}))
    
    function checkImgFromHtml(imgList) {
        for(var i =0; i< imgList.length; i++) {
            if (imgList[i].includes(config.cdnPath)) {
                https.get(imgList[i], res => {
                    let code = res.statusCode
                    if (code != 200) {
                        let errnode = {
                            statusCode: res.statusCode,
                            statusMessage: res.statusMessage,
                            path: res.req.path
                        }
                        console.warn('[warn]img标签图片错误：\r\n'.red + JSON.stringify(errnode).red)
                        fs.appendFile(`./log/${taskAlias}/ERRIMGFILE.js`, JSON.stringify(errnode) + ', \r\n', err => {
                            if (err) console.log('[warn]写文件错误'.red)
                        })
                    }
                })
            }
        }
    }
    /*  img错误排查结束 */
    
    /*  css文件内部图片排查开始 */
    // 获取CSS地址列表
    let cssList = await page.evaluate(()=>{
        let list = [...document.querySelectorAll('link')]
        return list.map(i => {
            return i.href
        })
    })

    let cssTaskList = await checkCssList(cssList)

    // 循环获取页面引用的CSS文件
    function checkCssList (cssList) {
        let cssTaskList = []
        for(var i = 0; i < cssList.length; i++) {
            if (cssList[i].includes(config.cssFilter)) {
                let arr = cssList[i].split(/co.ashx\?path=/)
                let cssSearch = arr[1]
                let _arr = cssSearch.split(',')
                for (var j = 0; j < _arr.length; j++) {
                    cssTaskList.push(config.cssPath + _arr[j].replace(/\|/g,'/'))
                }
            } else {
                if (cssList[i].includes('favicon.ico')) {} else {
                    cssTaskList.push(cssList[i])
                }
            }
        }
        return cssTaskList
    }

    // 匹配样式文件中引用的图片
    let imgListFromCss = await filterCssImg(cssTaskList)
    let cssImgList = await filterImgFromCss(cssTaskList)

    async function filterImgFromCss () {
        var arr = []
        for(var i = 0; i < cssTaskList.length; i++) {
            await page.goto(cssTaskList[i])
            let cssText = await page.evaluate(()=>{
                let list = document.querySelector('pre')
                return list.innerHTML
            })
            let _arr = cssText.match(config.imgReg)
            arr.push({
                'name': cssTaskList[i],
                'list': _arr
            })
        }
        return arr
    }
    await writeLog(JSON.stringify({'name': '页面引用的css文件', 'datetime': moment().format('YYYY-MM-DD HH:mm:SS::SSSS'), 'size': cssTaskList.length, 'list': cssTaskList}))

    async function filterCssImg (cssTaskList) {
        var arr = []
        for(var i = 0; i < cssTaskList.length; i++) {
            await page.goto(cssTaskList[i])
            let cssText = await page.evaluate(()=>{
                let list = document.querySelector('pre')
                return list.innerHTML
            })
            let _arr = cssText.match(config.imgReg)
            arr.push(..._arr)
        }
        return arr
    } 

    await checkImg(imgListFromCss)
    await writeLog(JSON.stringify({'name': 'css文件中引用的图片', 'datetime': moment().format('YYYY-MM-DD HH:mm:SS::SSSS'), 'size': imgListFromCss.length, 'list': imgListFromCss}))
    await writeLog(JSON.stringify({'name': 'css图片对应文件', 'datetime': moment().format('YYYY-MM-DD HH:mm:SS::SSSS'), list: cssImgList}))

    // 逐条发送请求排查错误图片
    function checkImg(imgListFromCss) {
        for(var i = 0; i<imgListFromCss.length; i++) {
            https.get(`https:${imgListFromCss[i]}`, res => {
                let code = res.statusCode
                if (code != 200) {
                    let errnode = {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        path: res.req.path,
                    }
                    console.warn('[warn]CSS图片错误：\r\n'.red + JSON.stringify(errnode).red)
                    fs.appendFile(`./log/${taskAlias}/ERRCSSIMGFILE.js`, JSON.stringify(errnode) + ', \r\n', err => {
                        if (err) console.log('[warn]写文件错误'.red)
                    })
                }
            })
        }
    }
    /*  css文件内部图片排查结束 */

    function writeLog (data) {
        fs.appendFile(`./log/${taskAlias}/LOGFILE.js`, data + '\r\n', err => {
            if (err) console.log('[warn]写入log文件错误'.red)
        })
    }

    await browser.close()

})()