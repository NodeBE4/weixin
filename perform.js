let fs = require('fs')
const fetch = require('node-fetch')
const { Octokit } = require("@octokit/rest")

let data_url = 'https://wechatscope.jmsc.hku.hk/api/update_weixin_public_pretty?days='
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"

let settings = { method: "Get" }

require('dotenv').config()

let TOKEN = process.env.TOKEN
let REPOSITORY = process.env.REPOSITORY

let [owner, repo] = REPOSITORY.split('/')

let octokit = new Octokit({
  auth: TOKEN
})


async function backup(articles){
  const tempurl = `https://wechatscope.jmsc.hku.hk/api/html?fn=`

  let { data } = await octokit.issues.listForRepo({
    owner: owner,
    repo: repo,
    state: 'all'
  })

  let leftover = articles.filter(item => {
    let temp = data.filter(issue => {
      return issue.body.includes(item['archive'])
    })
    return temp.length == 0
  })

  for (i=0;i<leftover.length;i++){
    let response = await octokit.issues.create({
      owner,
      repo,
      title: 'archive_request',
      body: tempurl+leftover[i]['archive']
    })

    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}


async function perform() {
  let articles = []
  let oldarticles = []
  let newarticles = []
  let today = new Date()
  let thismonth = today.toISOString().substring(0,7)
  let filename = `./data/weixin_${thismonth}.json`
  let postname = `./_posts/${thismonth}-01-weixin_censored_articles.md`
  if (fs.existsSync(filename)) {
    let rawtext = fs.readFileSync(filename, {encoding:'utf8', flag:'r'})
    oldarticles = JSON.parse(rawtext)
  }

  await fetch(data_url, settings)
    .then(res => res.text())
    .then((text) => {
      let jsontext = text.replace(/<p>/g, '').replace(/<\/p>/g, '')
      newarticles = JSON.parse(jsontext)
    });

  articles = oldarticles.concat(newarticles)

  // remove duplicates
  articles = removeDuplicates(articles, 'url')

  let content = JSON.stringify(articles, undefined, 4)
  fs.writeFileSync(filename, content)

  let thismonthtext = thismonth.replace('-','年') + `月`

  let header = `---
layout: table
title: "${thismonthtext} 被删微信公众号文章"
date: ${thismonth}-01
author: "WeChatScope"
from: "https://wechatscope.jmsc.hku.hk/api/update_weixin_public_pretty?days="
tags: [ 微信公众号 ]
categories: [ 微信公众号 ]
data: "data/weixin_${thismonth}.json"
---
`
  md = header 
  if (!fs.existsSync(postname)) {
    fs.writeFileSync(postname, md)
    console.log(`add ${postname}`)
  }

  let banned = articles.filter(item => {
    return !item['censored_msg'].includes('deleted by the author')
  })

  let newbanned = banned.filter(item => {
    let temp = oldarticles.filter(ban => {
      return ban['url'] == item['url']
    })
    return temp.length == 0
  })

  backup(newbanned)

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

