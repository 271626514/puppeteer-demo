const puppeteer = require('puppeteer');
const colors = require('colors');
const fs = require('fs');

console.log('123123123'.bgWhite.yellow)
async function test () {
    function demo1 () {
        setTimeout(() => {console.log('demo1')}, 1000)
    }

    function demo2 () {
        consloe.log('demo2')
    }

    await demo1()
    await demo2()
}

test()