let fs = require('fs')
let querystring = require('querystring')
let urlMod = require('url')
const crypto = require('crypto')
const https = require('https')
const fetch = require('node-fetch')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
let { loadRefSites, loadWikipedia, generateArticle, googlePhoto } = require('./lib')
let URL = urlMod.URL

let data_url = 'https://wechatscope.jmsc.hku.hk/api/update_weixin_public_pretty?days='
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"

let settings = { method: "Get" }

async function perform() {
  let articles = []
  let newarticles = []
  let today = new Date()
  let thismonth = today.toISOString().substring(0,7)
  let filename = `./weixin_${thismonth}.json`
  let postname = `./_posts/${thismonth}-01-weixin_censored_articles.md`
  if (fs.existsSync(filename)) {
    let rawtext = fs.readFileSync(filename, {encoding:'utf8', flag:'r'})
    articles = JSON.parse(rawtext)
  }

  await fetch(data_url, settings)
    .then(res => res.text())
    .then((text) => {
      let jsontext = text.replace(/<p>/g, '').replace(/<\/p>/g, '')
      newarticles = JSON.parse(jsontext)
    });

  articles = articles.concat(newarticles)

  // remove duplicates
  articles = removeDuplicates(articles, 'url')

  let content = JSON.stringify(articles, undefined, 4)
  fs.writeFileSync(filename, content)

  let header = `---
layout: table
title: "${thismonth} 被删微信公众号文章"
date: ${thismonth}-01
author: "WeChatScope"
from: "https://wechatscope.jmsc.hku.hk/api/update_weixin_public_pretty?days="
tags: [ 微信公众号 ]
categories: [ 微信公众号 ]
data: "weixin_${thismonth}.json"
---
`
  md = header 
  if (!fs.existsSync(postname)) {
    fs.writeFileSync(postname, md)
    console.log(`add ${postname}`)
  }

}

function removeDuplicates(originalArray, prop) {
     var newArray = [];
     var lookupObject  = {};

     for(var i in originalArray) {
        lookupObject[originalArray[i][prop]] = originalArray[i];
     }

     for(i in lookupObject) {
         newArray.push(lookupObject[i]);
     }
      return newArray;
 }

perform()

