app = require 'app'
fs = require 'fs'
path = require 'path'
{parseString} = require 'xml2js'
request = require 'request'
ChList = []
GroupList = []
config = null
csvToChList = (csv) ->
  lines = csv.split("\n")
  label = lines.shift()
  label = label.split(",")
  label[0] = "$$"
  for line in lines
    channel = {}
    elems = line.split(",")
    for l, i in label
      channel[l] = elems[i]
    ChList[channel.ChID] = channel
  ChList

genGroupList = (chs) ->
  for ch in chs
    if ch?
      unless GroupList[ch.ChGID]?
        GroupList[ch.ChGID] = {ChID: [], ChGID: ch.ChGID, ChGroupName: ch.ChGroupName}
      GroupList[ch.ChGID].ChID.push ch.ChID
  GroupList


syobocal =
  getGroupList: (cb) ->
    if GroupList.length > 0
      cb GroupList
      return
    if ChList.length > 0
      cb(genGroupList chs)
    else
      syobocal.getChList (chs) ->
        cb(genGroupList chs)

  setConfig: (conf) ->
    console.log "set config"
    console.log typeof conf
    cachePath = path.join app.getPath('cache'), app.getName(), "config.json"
    config = conf
    fs.writeFile cachePath, JSON.stringify config

  getConfig: (cb) ->
    if config?
      return cb config
    else
      cachePath = path.join app.getPath('cache'), app.getName(), "config.json"
      if fs.existsSync(cachePath)
        console.log(cachePath)
        fs.readFile cachePath, (err, data) ->
          throw err if err
          config = JSON.parse data.toString()
          cb(JSON.parse data.toString())
      else
        config = require './config.js'
        fs.writeFile cachePath, JSON.stringify config
        cb(config)

  getChList: (cb) ->
    cachePath = path.join app.getPath('cache'), app.getName(), "chdata.json"
    if ChList.length > 0
      cb ChList
      return

    if fs.existsSync(cachePath)
      console.log(cachePath)
      fs.readFile cachePath, (err, data) ->
        throw err if err
        cb(JSON.parse data.toString())
    else
      client = require 'cheerio-httpcli'
      client.fetch('http://cal.syoboi.jp/mng?Action=ShowChList', {}, (err, $, res) ->
        # console.log($('title').text())
        # console.log($(".output")[1].children[0].children.innerHTML)
        csv = ""
        for ch in $(".output")[1].children
          if ch.type is "tag"
            column = []
            for c in ch.children
              column.push c.children[0].data if c.children[0]?
            csv += column.join(",") + "\n"
        json = csvToChList csv
        fs.writeFile cachePath, JSON.stringify json
        cb(json)
      )
  getAnimes: (cb) ->
    cachePath = path.join app.getPath('cache'), app.getName(), "anidata.json"

    if fs.existsSync(cachePath)
      console.log "cashe"
      fs.readFile cachePath, (err, data) ->
        throw err if err
        cb(JSON.parse data.toString())
    else
      option =
        url: 'http://cal.syoboi.jp/cal_chk.php'
      request.get(
        option
        (err, res, body) ->
          parseString body, trim: true, (error, result) ->
            items = result.syobocal.ProgItems[0].ProgItem
            fs.writeFile cachePath, JSON.stringify items
            cb(items)
    )


module.exports = syobocal
