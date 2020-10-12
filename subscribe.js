let fs = require('fs')
const fetch = require('node-fetch')
const { Octokit } = require("@octokit/rest")
let JSSoup = require('jssoup').default;

let data_url = 'http://www.myzaker.com/channel/23090'
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

  let { data } = await octokit.issues.listForRepo({
    owner: owner,
    repo: repo
  })

  let leftover = articles.filter(item => {
    let temp = data.filter(issue => {
      return issue.body.includes(item['url'])
    })
    return temp.length == 0
  })

  for (i=0;i<leftover.length;i++){
    let response = await octokit.issues.create({
      owner,
      repo,
      title: 'archive_request',
      body: leftover[i]['url']
    })

    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

async function backupNo(articles){

  for (i=0;i<articles.length;i++){
    if ('issue' in articles[i]){
      continue
    }else {
      let response = await octokit.issues.create({
        owner,
        repo,
        title: 'archive_request',
        body: articles[i]['url']
      })
      articles[i]['issue'] = response.data.number
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  return articles
}

async function subscribe() {
  let articles = []
  let oldarticles = []
  let newarticles = []
  let author
  let today = new Date()
  let thismonth = today.toISOString().substring(0,7)
  let filename = `./data/weixin_subscriptions.json`
  let postname = `./_posts/${thismonth}-01-weixin_subscriptions.md`
  if (fs.existsSync(filename)) {
    let rawtext = fs.readFileSync(filename, {encoding:'utf8', flag:'r'})
    oldarticles = JSON.parse(rawtext)
  }

  await fetch(data_url, settings)
    .then(res => res.text())
    .then((body) => {
      // let jsontext = text.replace(/<p>/g, '').replace(/<\/p>/g, '')
      // newarticles = JSON.parse(jsontext)
      var soup = new JSSoup(body)
      let allas = soup.findAll('a')
      let as = allas.filter(item => {
        return item.attrs.href.includes('myzaker.com/article')
      })
      author = soup.find('title').text.split('-')[0]
      newarticles = as.map(item => {
        return {"title": item.attrs.title, "nickname": author, "url": 'http:'+item.attrs.href, "created_at": today.toISOString().substring(0,10)}
      })
      console.log(newarticles)
    });

  articles = oldarticles.concat(newarticles)

  // remove duplicates
  articles = removeDuplicates(articles, 'url')

  articles = await backupNo(articles)

  let content = JSON.stringify(articles, undefined, 4)
  fs.writeFileSync(filename, content)

  let thismonthtext = thismonth.replace('-','年') + `月`

  let header = `---
layout: subs
title: "${thismonthtext} 订阅微信公众号文章"
date: ${thismonth}-02
author: "${author}"
from: "${data_url}"
tags: [ 微信公众号 ]
categories: [ 微信公众号 ]
data: "data/weixin_subscriptions.json"
---
`
  md = header 
  if (!fs.existsSync(postname)) {
    fs.writeFileSync(postname, md)
    console.log(`add ${postname}`)
  }

  // let newitems = articles.filter(item => {
  //   let temp = oldarticles.filter(ban => {
  //     return ban['url'] == item['url']
  //   })
  //   return temp.length == 0
  // })

  // backup(newitems)

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

subscribe()

