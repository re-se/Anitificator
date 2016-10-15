window.onload = () ->
  Electron = require 'electron'
  remote = Electron.remote
  React = require 'react'
  ReactDOM = require 'react-dom'
  syobocal = remote.require './dist/js/syobocal.js'
  setTimer = require './dist/js/timer.js'
  {Settings} = require './dist/js/setting.js'
  {Audios} = require './dist/js/audio.js'

  parseDate = (n, offset) ->
    d = []
    d.push parseInt n[0..3]  # 0:year
    d.push parseInt n[4..5]  # 1:month
    d.push parseInt n[6..7]  # 2:day
    d.push parseInt n[8..9]  # 3:hour
    d.push parseInt n[10..11]  # 4:minute

    date = new Date("#{d[0..2].join('-')} #{d[3]}:#{d[4]}")
    date.setTime(Date.parse(date) + offset * 1000) if offset isnt 0
    return date

  formatDate = (date, format) ->
    return date.toString if !(date instanceof Date)
    format = 'YYYY-MM-DD hh:mm' if !format?
    format = format.replace(/YYYY/g, date.getFullYear())
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2))
    format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2))
    format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2))
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2))
    format

  Animes = React.createClass
    shouldComponentUpdate: (nextProps, nextState) ->
      if !(nextProps.channels.length > 0)
        return false
      return true

    render: () ->
      # console.log "currentTimer: " + @props.currentTimer
      # console.log "notified: " + @props.notified
      # hasTimer = not @props.currentTimer.every (ele) =>
      #   @props.notified.includes +ele
      # console.log "hasTimer: " + hasTimer
      date = 0
      items = []
      trs = ""
      now = Date.now()
      # now = parseDate "20160109101000"
      timing = Infinity
      for item in @props.animes
        start = parseDate item.$.StTime, +item.$.StOffset
        end = parseDate item.$.EdTime, +item.$.StOffset
        if date.getDate?() isnt start.getDate()
          if trs.length > 0
            trs = (
              <div>
                {trs}
              </div>
            )
            items.push [
              <div className="date">{formatDate date, "MM/DD"}</div>
              trs
            ]
          date = start
          trs = []
        cname = if now > start.getTime() then "onair" else ""
        trs.push [
          <div className={"anime " + cname}><table><tbody>
            <tr key={item.$.PID}>
              <td rowSpan=2 className="startTime"> {formatDate start, "hh:mm"} </td>
              <td className="animeTitle">{item.$.Title}</td>
            </tr>
            <tr className="animeSubTitle">
              <td>{item.$.SubTitle}</td>
            </tr>
            <tr>
              <td className="animeChName">{item.$.ChName}</td>
              <td> {formatDate(start) + " - " + formatDate(end) + " (offset: " + item.$.StOffset/60 + " min)"} </td>
            </tr>
          </tbody></table></div>
        ]
      if trs.length > 0
        items.push [
          <div className="date">{formatDate date, "MM/DD"}</div>
          trs
        ]
      return (
        <div className="animes-inner" onWheel={@_onscroll}>
          {items}
        </div>
      )

    _onscroll: (e)->
      # for ele in document.getElementsByClassName("date")
      #   console.log ele.scrollTop

  Contents = React.createClass
    getInitialState: () ->
      @currentTimers = []
      @notified = []
      group: []
      current: 0
      settingPos: 0
      channels: []
      animes: []
      config: require './dist/js/config.js'
      notified: []
      currentTimer: []
      finished: -1
    componentDidMount: () ->
      syobocal.getConfig((res) =>
        if res.channels.length is 0
          setting = document.getElementById 'setting'
          showElement setting
          @changeSettingPos 1
        ch =
          ChGID: 0
          ChGroupName: "選択中"
        selected = []
        for c, i in res.channels
          selected.push i if c
        ch.ChID = selected
        @setState
          testSound: res.notification
          group: [ch].concat @state.group[1..]
          @saveSettings(res)
      )
      syobocal.getAnimes((res) =>
        @allAnimes = res
        now = Date.now()
        n = 0
        @setState animes: @genAnimes(@state.config)
      )
      syobocal.getGroupList ((res) =>
        GroupList = res
        @setState group: [@state.group[0]].concat(GroupList[1..]), ()=>
          syobocal.getChList (res) =>
            @setState
              channels: res
              current: 0
      )
    genAnimes: (config) ->
      return [] unless @allAnimes?
      for timer in @currentTimers
        clearTimeout(timer.timeoutID) # unless @notified.includes timer.id
      @currentTimers = []
      now = Date.now()
      n = 0
      loop
        end = parseDate @allAnimes[n].$.EdTime, +@allAnimes[n].$.StOffset
        break unless end.getTime() < now
        n++
      return @allAnimes[n..] unless config?
      res = []
      hasTimer = false
      timing = null
      for item in @allAnimes[n..]
        # unless +@state.current is 0
          # if not @state.group[@state.current]?.ChID.includes(item.$.ChID)
          #   continue

        if not config.channels[item.$.ChID]
          continue
        end = parseDate item.$.EdTime, +item.$.StOffset
        continue if end.getTime() < now
        if not hasTimer
          start = parseDate item.$.StTime, +item.$.StOffset
          if start > now
            if not @notified.includes(+item.$.PID)
              if not timing? or +timing is +start
                timer = {}
                console.log(item.$.Title)
                timer.id = +item.$.PID
                timer.timeoutID = @setTimerFor(item, start, config.countdown)
                @currentTimers.push timer
                console.log "currentTimers: "
                timing = +start
              else
                hasTimer = true
        res.push item
        break if res.length >= 30
      res

    setTimerFor: (item, start, offset_sec) ->
      offset_sec = 300 if !(+offset_sec > 0)
      callback = (
        (onFinish, item)->
          ()->
            new Notification(
              item.$.Title,
              body: item.$.SubTitle
            )
            document.getElementById("sound")?.play()
            console.log item.$.Title
            onFinish(+item.$.PID)
      )(@onFinishTimer, item)
      setTimer(start, -offset_sec, callback)

    onFinishTimer: (PID) ->
      @notified.push +PID
      @setState
        notified: @state.notified.concat(+PID)
        currentTimer: @state.currentTimer.filter((d)-> +d isnt +PID)
        finished: +PID
        animes: @genAnimes @state.config

    changeChGroup: (ChGID) ->
      @setState
        current: ChGID
        # () ->
        #   @setState animes: @genAnimes @state.config

    checkChannel: (ChID, checked) ->
      chs = []
      selected = []
      for ch, i in @state.channels
        if ch?
          chs[ch.ChID] = @state.config.channels?[ch.ChID]
          if chs[ch.ChID]?
            selected.push ch.ChID if chs[ch.ChID]
          else
            chs[ch.ChID] = false
        else
          chs[i] = null
      if ChID < 0
        for id in @state.group[-ChID].ChID
          chs[id] = checked
          if checked
            selected.push id
          else
            selected = selected.filter (d)->+d isnt +id
      else
        chs[ChID] = checked
        if checked
          selected.push ChID
        else
          selected = selected.filter (d)->+d isnt +ChID

      config = {channels: chs}
      first = @state.group[0]
      first.ChID = selected
      syobocal.setConfig config
      @setState
        group: [first].concat @state.group[1..]
        config: config

    changeSettingPos: (pos) ->
      @setState settingPos: pos

    saveSettings: (config) ->
      config.channels = @state.config.channels if !config.channels?
      config.countdown = 300 if !config.countdown?
      config.notification = "picon" if !config.notification?
      syobocal.setConfig config
      @setState
        animes: @genAnimes(config)
        config: config

    render: () ->
      Action = {}
      Action.checkChannel = @checkChannel
      Action.changeChGroup = @changeChGroup
      Action.changeSettingPos = @changeSettingPos
      return (
        <div className="inner clearfix">
          <Settings
            group={@state.group}
            channels={@state.channels}
            current={@state.current}
            settingPos={@state.settingPos}
            config={@state.config}
            onSave={@saveSettings}
            Action={Action}
          />
          <div className="animes">
            <Animes
              groups={@state.group}
              current={@state.current}
              animes={@state.animes}
              channels={@state.channels}
            />
          </div>
          <Audios id="sound" sound={@state.config.notification}/>
        </div>
      )

  ReactDOM.render(
    <Contents />
    document.getElementById 'contents'
  )
