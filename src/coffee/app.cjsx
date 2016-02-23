window.onload = ()->
  remote = require 'remote'
  React = require 'react'
  ReactDOM = require 'react-dom'
  syobocal = remote.require './dist/js/syobocal.js'
  setTimer = require './dist/js/timer.js'
  ipc = require('electron').ipcRenderer
  showElement = (ele) ->
    ele.style.display = "block"
  hideElement = (ele) ->
    ele.style.display = "none"
  toggleElement = (ele) ->
    setting.style.display = "none" if setting.style.display is ""
    next = if setting.style.display is "none" then "block" else "none"
    setting.style.display = next
  ipc.on 'menu-clicked', (msg) ->
    setting = document.getElementById 'setting'
    toggleElement setting

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

  Groups = React.createClass
    expandList: (e) ->
      ele = e.target
      id = ""
      while id is "" and ele.parentElement?
        id = ele.id
        ele = ele.parentElement
      @props.onClick(-id)


    render: () ->
      lists = @props.data.filter((d) -> return d != undefined)
      groups = lists.map (g, index) =>
        selected = "selected" if +@props.current is +g.ChGID
        return (
          # <td id={-ch.ChGID} rowSpan={@props.row}>
          #   <input type="checkbox" onChange={@changeGroupCheck}/>
          # </td>
          <li className={selected} id={-g.ChGID} key={g.ChGroupName} onClick={@expandList}>
            {g.ChGroupName}
          </li>
        )
      return (
        <div>
          <ul>
            {groups}
          </ul>
        </div>
      )

  Channels = React.createClass
    shouldComponentUpdate: (nextProps, nextState) ->
      cond = !(nextProps.channels?.length > 0)
      cond |= !(nextProps.groups?.length > 0)
      cond |= !(nextProps.current >= 0)
      if cond
        return false
      return true

    changeCheck: (e) ->
      id = +e.target.parentElement.id
      @props.onChange id, e.target.checked

    getInitialState: () ->
      @isExpanded = []
      data: []

    render: () ->
      groups = []
      channels = []
      cond = !(@props.channels?.length > 0)
      cond |= !(@props.groups?.length > 0)
      cond |= !(@props.current >= 0)
      return <div></div> if cond
      for id in @props.groups[@props.current].ChID
        channels.push @props.channels[id]
      lists = channels
      .filter((d) -> return d != null)
      .sort((a, b) -> +a.$$ - +b.$$)

      items = lists.map (ch, index) =>
        # style = {display: "none"} if not @props.groups[@props.current].ChID.includes(ch.ChID)
        return (
          <li key={ch.ChName}>
            <label id={ch.ChID}>
              <input type="checkbox" checked={@props.config.channels?[ch.ChID]} onChange={@changeCheck}/>
              {ch.ChName}
            </label>
          </li>
        )

      items.unshift [
        <li>
          <label id={-@props.current} key={@props.groups[@props.current].ChGroupName}>
              <input type="checkbox" onChange={@changeCheck}/> [Select All]
          </label>
        </li>
      ]
      return (
        <ul>
          {items}
        </ul>
      )

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

  Audios = React.createClass
    render: () ->
      return <div></div> if !@props.sound?
      return (
        <audio id={@props.id} src="./dist/resource/audio/#{@props.sound}.wav" />

      )
  BaseSettings = React.createClass
    render: () ->
      sounds = ["picon", "picon2"].map (sound) =>
        return <option key={sound} value={sound}>{sound}</option>
      return (
        <div className="setting-right">
          <div className="bases">
            <input id="setting_countdown" defaultValue={@props.countdown} onChange={@props.onChangeCountdown} placeholder="default: 300"/>
            秒前に通知
            <div>
              <span>通知音:</span>
              <select id="setting_sound" onChange={@props.onChangeSound} value={@props.sound}>
                {sounds}
              </select>
              <span>&nbsp;</span>
              <span onClick={()->document.getElementById("test").play()} className="fa fa-volume-up"></span>
            </div>
            <Audios id="test" sound={@props.sound}/>
          </div>
        </div>
      )
  ChannelSettings = React.createClass
    render: () ->
      return (
        <div className="setting-right">
          <div className="groups">
            <Groups
              data={@props.group}
              current={@props.current}
              onClick={@props.Action.changeChGroup} />
          </div>
          <div className="channels">
            <Channels
              channels={@props.channels}
              groups={@props.group}
              current={@props.current}
              config={@props.config}
              onChange={@props.Action.checkChannel}
            />
          </div>
        </div>
      )
  Settings = React.createClass
    changeSound: (e) ->
      @setState sound: e.target.value
    changeCountdown: (e) ->
      @setState countdown: e.target.value
    onSave: () ->
      config = {}
      config.countdown = @state.countdown
      config.notification = @state.sound
      @props.onSave(config)
      hideElement document.getElementById("setting")
    componentWillMount: () ->
      @setState
        sound: @props.config.notification
        countdown: @props.config.countdown
    render: () ->
      inner = switch @props.settingPos
        when 0
          <BaseSettings
            onChangeSound={@changeSound}
            onChangeCountdown={@changeCountdown}
            countdown={@state.countdown}
            sound={@state.sound}
          />
        when 1
          <ChannelSettings
            group={@props.group}
            current={@props.current}
            channels={@props.channels}
            config={@props.config}
            Action={@props.Action}
          />

      return (
        <div id="setting" className="setting">
          <div className="entries">
            <Entries
              save={@onSave}
              current={@props.settingPos}
              click={@props.Action.changeSettingPos}
            />
          </div>
          {inner}
        </div>
      )
  Entries = React.createClass
    render: () ->
      return (
        <ul>
          <li className={if @props.current is 0 then "selected"} onClick={() => @props.click(0)}>基本設定</li>
          <li className={if @props.current is 1 then "selected"} onClick={() => @props.click(1)}>チャンネル選択</li>
          <li onClick={@props.save}>設定を保存</li>
        </ul>
      )
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
            document.getElementById("sound").play()
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
