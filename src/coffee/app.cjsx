window.onload = ()->
  remote = require 'remote'
  React = require 'react'
  ReactDOM = require 'react-dom'
  syobocal = remote.require './dist/js/syobocal.js'
  setTimer = require './dist/js/timer.js'
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
        selected = "group-selected" if +@props.current is +g.ChGID
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
          <li>
            <label id={ch.ChID} key={ch.ChName}>
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
      console.log "currentTimer: " + @props.currentTimer
      console.log "notified: " + @props.notified
      hasTimer = not @props.currentTimer.every (ele) =>
        @props.notified.includes +ele
      console.log "hasTimer: " + hasTimer
      date = 0
      items = []
      trs = ""
      cnt = 0
      now = Date.now()
      # now = parseDate "20160109101000"
      timing = Infinity
      for item in @props.animes
        unless +@props.current is 0
          if not @props.groups[@props.current]?.ChID.includes(item.$.ChID)
            continue
        if not @props.config.channels[item.$.ChID]
          continue
        start = parseDate item.$.StTime, +item.$.StOffset
        end = parseDate item.$.EdTime, +item.$.StOffset
        if end.getTime() < now # すでに終わった番組は飛ばす
          continue
        hasTimer = true if start.getTime() - timing > 0
        if not hasTimer and start.getTime() > now
          if not @props.notified.includes(+item.$.PID) and
          not @props.currentTimer.includes(+item.$.PID)
            timing = start.getTime()
            console.log item.$.Title
            @props.Actions.onSetTimer(+item.$.PID)
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
            )(@props.Actions.onFinishTimer, item)
            setTimer(start, -300, callback)

        if date.getDate?() isnt start.getDate() or cnt > 30
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
        if cnt++ > 30
          break
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

      return (
        <div className="animes-inner" onWheel={@_onscroll}>
          {items}
        </div>
      )

    _onscroll: (e)->
      for ele in document.getElementsByClassName("date")
        console.log ele.scrollTop

  Audios = React.createClass
    render: () ->
      # return <div></div> if @props.finished < 0
      return (
        <audio id="sound" src="./dist/resource/audio/notification.mp3" />

      )

  Contents = React.createClass
    getInitialState: () ->
      group: []
      current: -1
      channels: []
      animes: []
      config: require './dist/js/config.js'
      notified: []
      currentTimer: []
      finished: -1
    componentDidMount: () ->
      syobocal.getConfig((res) =>
        ch =
          ChGID: 0
          ChGroupName: "選択中"
        selected = []
        for c, i in res.channels
          selected.push i if c
        ch.ChID = selected
        @setState group: [ch].concat @state.group[1..]
        @setState config: res
      )
      syobocal.getAnimes((res) =>
        @setState animes: res
      )
      syobocal.getGroupList ((res) =>
        GroupList = res
        @setState group: [@state.group[0]].concat(GroupList[1..]), ()=>
          syobocal.getChList (res) =>
            @setState channels: res, ()=>
              @setState current: 0
      )
    onSetTimer: (PID) ->
      @setState currentTimer: @state.currentTimer.concat PID

    onFinishTimer: (PID) ->
      @setState notified: @state.notified.concat(+PID), ()->
        @setState currentTimer: @state.currentTimer.filter((d)-> +d isnt +PID), ()->
          @setState finished: +PID, ()->
            @setState animes: @state.animes

    chengeChGroup: (ChGID) ->
      @setState current: ChGID

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
      @setState group: [first].concat @state.group[1..]
      @setState config: config

    render: () ->
      AnimesActions =
        onSetTimer: @onSetTimer
        onFinishTimer: @onFinishTimer
      return (
        <div className="inner clearfix">
          <div className="leftbar">
            <div className="groups">
              <Groups
                data={@state.group}
                current={@state.current}
                onClick={@chengeChGroup} />
            </div>
            <div className="channels">
              <Channels
                channels={@state.channels}
                groups={@state.group}
                current={@state.current}
                config={@state.config}
                onChange={@checkChannel}
              />
            </div>
          </div>
          <div className="animes">
            <Animes
              Actions={AnimesActions}
              notified={@state.notified}
              groups={@state.group}
              current={@state.current}
              currentTimer={@state.currentTimer}
              animes={@state.animes}
              channels={@state.channels}
              config={@state.config}
            />
          </div>
          <Audios finished={@state.finished}/>
        </div>
      )

  ReactDOM.render(
    <Contents />
    document.getElementById 'contents'
  )
