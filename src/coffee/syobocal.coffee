{app} = require 'electron'
fs = require 'fs'
path = require 'path'
{parseString} = require 'xml2js'
request = require 'request'
ChList = []
GroupList = []
ChSize = -1
ChGSize = -1
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
    ChSize = +channel.ChID if ChSize < +channel.ChID
    ChGSize = +channel.ChGID if ChGSize < +channel.ChGID
  ChList[0] = null unless ChList[0]?
  ChList

genGroupList = (chs) ->
  GroupList = Array(ChGSize + 1).fill(null)
  for ch in chs
    if ch?
      unless GroupList[ch.ChGID]?
        GroupList[ch.ChGID] = {ChID: [], ChGID: ch.ChGID, ChGroupName: ch.ChGroupName}
      GroupList[ch.ChGID].ChID.push ch.ChID
  GroupList

parseDate = (n, offset = 0) ->
  d = []
  d.push parseInt n[0..3]  # 0:year
  d.push parseInt n[4..5]  # 1:month
  d.push parseInt n[6..7]  # 2:day
  d.push parseInt n[8..9]  # 3:hour
  d.push parseInt n[10..11]  # 4:minute

  date = new Date("#{d[0..2].join('-')} #{d[3]}:#{d[4]}")
  date.setTime(Date.parse(date) + offset * 1000) if offset isnt 0
  return date

requestAnimes = (optstr, cb) ->
  if !cb?
    cb = optstr
    optstr = ""
  console.log optstr
  option =
    url: 'http://cal.syoboi.jp/cal_chk.php?' + optstr
  request.get(
    option
    (err, res, body) ->
      parseString body, trim: true, (error, result) ->
        items = result.syobocal.ProgItems[0].ProgItem
        cb(items)
  )

syobocal =
  getGroupList: (cb) ->
    if GroupList.length > 0
      console.log GroupList.length, GroupList[4]
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
    cachePath = path.join app.getPath('userData'), "config.json"
    config = conf
    fs.writeFile cachePath, JSON.stringify config

  getConfig: (cb) ->
    if config?
      return cb config
    else
      cachePath = path.join app.getPath('userData'), "config.json"
      console.log(cachePath)
      fs.readFile cachePath, (err, data) ->
        if err
          config = require './config.js'
          fs.writeFile cachePath, JSON.stringify config
          cb(config)
        else
          config = JSON.parse data.toString()
          cb(JSON.parse data.toString())


  getChList: (cb) ->
    if ChList.length > 0
      cb ChList
      return

    cachePath = path.join app.getPath('userData'), "chdata.json"
    console.log(cachePath)
    fs.readFile cachePath, (err, data) ->
      if err
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
          ChList = csvToChList csv
          json = {ChList: ChList, ChSize: ChSize, ChGSize: ChGSize}
          fs.writeFile cachePath, JSON.stringify json
          cb(ChList)
        )
      else
        json = JSON.parse data.toString()
        ChSize = json.ChSize
        ChGSize = json.ChGSize
        ChList = json.ChList
        cb(ChList)

  getAnimes: (cb) ->
    cachePath = path.join app.getPath('userData'), "anidata.json"
    fs.readFile cachePath, (err, data) ->
      if err
        console.log err
        requestAnimes "", (items) ->
          fs.writeFile cachePath, JSON.stringify items
          cb(items)
      else
        json = JSON.parse data.toString()
        last = json[json.length - 1]
        console.log(last.$.StTime)
        date = parseDate last.$.StTime
        date = new Date() if +date < Date.now()
        date_m = date.getTime()
        to = new Date()
        to.setDate(to.getDate() + 7)
        to_m = to.getTime()
        console.log "last: #{date}"
        console.log "to: #{to}"
        if date_m < to_m
          option = []
          # option.push "start=#{date.getFullYear()}-#{date.getMonth() + 1}-#{date.getDate() - 1}"
          # days = (to_m - date_m) // (1000 * 60 * 60 * 24)
          # option.push "days=#{days + 1}"
          requestAnimes (items) ->
            # console.log items[0]
            # while((items[0].$.PID isnt last.$.PID) or (+items[0].$.StTime < +last.$.StTime))
            #   items.shift()
            # ret = json.concat items
            fs.writeFile cachePath, JSON.stringify items
            cb(items)
        else
          cb(json)



module.exports = syobocal
