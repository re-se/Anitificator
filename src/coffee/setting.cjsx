React = require 'react'
{Audios} = require './audio.js'
Component = React.Component

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

class Channels extends Component
  constructor: (props, context, updater) ->
    super(props, context, updater)
    @isExpanded = []

  shouldComponentUpdate: (nextProps, nextState) ->
    cond = !(nextProps.channels?.length > 0)
    cond |= !(nextProps.groups?.length > 0)
    cond |= !(nextProps.current >= 0)
    if cond
      return false
    return true

  changeCheck: (e) =>
    id = +e.target.parentElement.id
    @props.onChange id, e.target.checked

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
    .filter((d) -> return !(d is null or d is undefined))
    # .sort((a, b) -> +a.$$ - +b.$$)

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

class Groups extends Component
  expandList: (e) =>
    ele = e.target
    id = ""
    while id is "" and ele.parentElement?
      id = ele.id
      ele = ele.parentElement
    @props.onClick(-id)

  render: () ->
    lists = @props.data.filter((d) -> return !(d is null or d is undefined))
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

class BaseSettings extends Component
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
            <span onClick={()->document.getElementById("test")?.play()} className="fa fa-volume-up"></span>
          </div>
          <Audios id="test" sound={@props.sound}/>
        </div>
      </div>
    )
class ChannelSettings extends Component
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
class @Settings extends Component
  changeSound: (e) =>
    @setState sound: e.target.value
  changeCountdown: (e) =>
    @setState countdown: e.target.value
  onSave: () =>
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
class Entries extends Component
  render: () ->
    return (
      <ul>
        <li className={if @props.current is 0 then "selected"} onClick={() => @props.click(0)}>基本設定</li>
        <li className={if @props.current is 1 then "selected"} onClick={() => @props.click(1)}>チャンネル選択</li>
        <li onClick={@props.save}>設定を保存</li>
      </ul>
    )
