React = require 'react'
Component = React.Component
class @Audios extends Component
  render: () ->
    return <div></div> if !@props.sound?
    return (
      <audio id={@props.id} src="./dist/resource/audio/#{@props.sound}.wav" />
    )
