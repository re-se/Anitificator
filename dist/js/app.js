window.onload = function() {
  var Animes, Audios, BaseSettings, ChannelSettings, Channels, Contents, Entries, Groups, React, ReactDOM, Settings, formatDate, hideElement, ipc, parseDate, remote, setTimer, showElement, syobocal, toggleElement;
  remote = require('remote');
  React = require('react');
  ReactDOM = require('react-dom');
  syobocal = remote.require('./dist/js/syobocal.js');
  setTimer = require('./dist/js/timer.js');
  ipc = require('electron').ipcRenderer;
  showElement = function(ele) {
    return ele.style.display = "block";
  };
  hideElement = function(ele) {
    return ele.style.display = "none";
  };
  toggleElement = function(ele) {
    var next;
    if (setting.style.display === "") {
      setting.style.display = "none";
    }
    next = setting.style.display === "none" ? "block" : "none";
    return setting.style.display = next;
  };
  ipc.on('menu-clicked', function(msg) {
    var setting;
    setting = document.getElementById('setting');
    return toggleElement(setting);
  });
  parseDate = function(n, offset) {
    var d, date;
    d = [];
    d.push(parseInt(n.slice(0, 4)));
    d.push(parseInt(n.slice(4, 6)));
    d.push(parseInt(n.slice(6, 8)));
    d.push(parseInt(n.slice(8, 10)));
    d.push(parseInt(n.slice(10, 12)));
    date = new Date((d.slice(0, 3).join('-')) + " " + d[3] + ":" + d[4]);
    if (offset !== 0) {
      date.setTime(Date.parse(date) + offset * 1000);
    }
    return date;
  };
  formatDate = function(date, format) {
    if (!(date instanceof Date)) {
      return date.toString;
    }
    if (format == null) {
      format = 'YYYY-MM-DD hh:mm';
    }
    format = format.replace(/YYYY/g, date.getFullYear());
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    return format;
  };
  Groups = React.createClass({
    expandList: function(e) {
      var ele, id;
      ele = e.target;
      id = "";
      while (id === "" && (ele.parentElement != null)) {
        id = ele.id;
        ele = ele.parentElement;
      }
      return this.props.onClick(-id);
    },
    render: function() {
      var groups, lists;
      lists = this.props.data.filter(function(d) {
        return d !== void 0;
      });
      groups = lists.map((function(_this) {
        return function(g, index) {
          var selected;
          if (+_this.props.current === +g.ChGID) {
            selected = "selected";
          }
          return React.createElement("li", {
            "className": selected,
            "id": -g.ChGID,
            "key": g.ChGroupName,
            "onClick": _this.expandList
          }, g.ChGroupName);
        };
      })(this));
      return React.createElement("div", null, React.createElement("ul", null, groups));
    }
  });
  Channels = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
      var cond, ref, ref1;
      cond = !(((ref = nextProps.channels) != null ? ref.length : void 0) > 0);
      cond |= !(((ref1 = nextProps.groups) != null ? ref1.length : void 0) > 0);
      cond |= !(nextProps.current >= 0);
      if (cond) {
        return false;
      }
      return true;
    },
    changeCheck: function(e) {
      var id;
      id = +e.target.parentElement.id;
      return this.props.onChange(id, e.target.checked);
    },
    getInitialState: function() {
      this.isExpanded = [];
      return {
        data: []
      };
    },
    render: function() {
      var channels, cond, groups, id, items, j, len, lists, ref, ref1, ref2;
      groups = [];
      channels = [];
      cond = !(((ref = this.props.channels) != null ? ref.length : void 0) > 0);
      cond |= !(((ref1 = this.props.groups) != null ? ref1.length : void 0) > 0);
      cond |= !(this.props.current >= 0);
      if (cond) {
        return React.createElement("div", null);
      }
      ref2 = this.props.groups[this.props.current].ChID;
      for (j = 0, len = ref2.length; j < len; j++) {
        id = ref2[j];
        channels.push(this.props.channels[id]);
      }
      lists = channels.filter(function(d) {
        return d !== null;
      }).sort(function(a, b) {
        return +a.$$ - +b.$$;
      });
      items = lists.map((function(_this) {
        return function(ch, index) {
          var ref3;
          return React.createElement("li", {
            "key": ch.ChName
          }, React.createElement("label", {
            "id": ch.ChID
          }, React.createElement("input", {
            "type": "checkbox",
            "checked": ((ref3 = _this.props.config.channels) != null ? ref3[ch.ChID] : void 0),
            "onChange": _this.changeCheck
          }), ch.ChName));
        };
      })(this));
      items.unshift([
        React.createElement("li", null, React.createElement("label", {
          "id": -this.props.current,
          "key": this.props.groups[this.props.current].ChGroupName
        }, React.createElement("input", {
          "type": "checkbox",
          "onChange": this.changeCheck
        }), " [Select All]"))
      ]);
      return React.createElement("ul", null, items);
    }
  });
  Animes = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
      if (!(nextProps.channels.length > 0)) {
        return false;
      }
      return true;
    },
    render: function() {
      var cname, date, end, item, items, j, len, now, ref, start, timing, trs;
      date = 0;
      items = [];
      trs = "";
      now = Date.now();
      timing = Infinity;
      ref = this.props.animes;
      for (j = 0, len = ref.length; j < len; j++) {
        item = ref[j];
        start = parseDate(item.$.StTime, +item.$.StOffset);
        end = parseDate(item.$.EdTime, +item.$.StOffset);
        if ((typeof date.getDate === "function" ? date.getDate() : void 0) !== start.getDate()) {
          if (trs.length > 0) {
            trs = React.createElement("div", null, trs);
            items.push([
              React.createElement("div", {
                "className": "date"
              }, formatDate(date, "MM/DD")), trs
            ]);
          }
          date = start;
          trs = [];
        }
        cname = now > start.getTime() ? "onair" : "";
        trs.push([
          React.createElement("div", {
            "className": "anime " + cname
          }, React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", {
            "key": item.$.PID
          }, React.createElement("td", {
            "rowSpan": 2,
            "className": "startTime"
          }, " ", formatDate(start, "hh:mm"), " "), React.createElement("td", {
            "className": "animeTitle"
          }, item.$.Title)), React.createElement("tr", {
            "className": "animeSubTitle"
          }, React.createElement("td", null, item.$.SubTitle)), React.createElement("tr", null, React.createElement("td", {
            "className": "animeChName"
          }, item.$.ChName), React.createElement("td", null, " ", formatDate(start) + " - " + formatDate(end) + " (offset: " + item.$.StOffset / 60 + " min)", " ")))))
        ]);
      }
      if (trs.length > 0) {
        items.push([
          React.createElement("div", {
            "className": "date"
          }, formatDate(date, "MM/DD")), trs
        ]);
      }
      return React.createElement("div", {
        "className": "animes-inner",
        "onWheel": this._onscroll
      }, items);
    },
    _onscroll: function(e) {}
  });
  Audios = React.createClass({
    render: function() {
      if (this.props.sound == null) {
        return React.createElement("div", null);
      }
      return React.createElement("audio", {
        "id": this.props.id,
        "src": "./dist/resource/audio/" + this.props.sound + ".wav"
      });
    }
  });
  BaseSettings = React.createClass({
    render: function() {
      var sounds;
      sounds = ["picon", "picon2"].map((function(_this) {
        return function(sound) {
          return React.createElement("option", {
            "key": sound,
            "value": sound
          }, sound);
        };
      })(this));
      return React.createElement("div", {
        "className": "setting-right"
      }, React.createElement("div", {
        "className": "bases"
      }, React.createElement("input", {
        "id": "setting_countdown",
        "defaultValue": this.props.countdown,
        "onChange": this.props.onChangeCountdown,
        "placeholder": "default: 300"
      }), "秒前に通知", React.createElement("div", null, React.createElement("span", null, "通知音:"), React.createElement("select", {
        "id": "setting_sound",
        "onChange": this.props.onChangeSound,
        "value": this.props.sound
      }, sounds), React.createElement("span", null, " "), React.createElement("span", {
        "onClick": (function() {
          var ref;
          return (ref = document.getElementById("test")) != null ? ref.play() : void 0;
        }),
        "className": "fa fa-volume-up"
      })), React.createElement(Audios, {
        "id": "test",
        "sound": this.props.sound
      })));
    }
  });
  ChannelSettings = React.createClass({
    render: function() {
      return React.createElement("div", {
        "className": "setting-right"
      }, React.createElement("div", {
        "className": "groups"
      }, React.createElement(Groups, {
        "data": this.props.group,
        "current": this.props.current,
        "onClick": this.props.Action.changeChGroup
      })), React.createElement("div", {
        "className": "channels"
      }, React.createElement(Channels, {
        "channels": this.props.channels,
        "groups": this.props.group,
        "current": this.props.current,
        "config": this.props.config,
        "onChange": this.props.Action.checkChannel
      })));
    }
  });
  Settings = React.createClass({
    changeSound: function(e) {
      return this.setState({
        sound: e.target.value
      });
    },
    changeCountdown: function(e) {
      return this.setState({
        countdown: e.target.value
      });
    },
    onSave: function() {
      var config;
      config = {};
      config.countdown = this.state.countdown;
      config.notification = this.state.sound;
      this.props.onSave(config);
      return hideElement(document.getElementById("setting"));
    },
    componentWillMount: function() {
      return this.setState({
        sound: this.props.config.notification,
        countdown: this.props.config.countdown
      });
    },
    render: function() {
      var inner;
      inner = (function() {
        switch (this.props.settingPos) {
          case 0:
            return React.createElement(BaseSettings, {
              "onChangeSound": this.changeSound,
              "onChangeCountdown": this.changeCountdown,
              "countdown": this.state.countdown,
              "sound": this.state.sound
            });
          case 1:
            return React.createElement(ChannelSettings, {
              "group": this.props.group,
              "current": this.props.current,
              "channels": this.props.channels,
              "config": this.props.config,
              "Action": this.props.Action
            });
        }
      }).call(this);
      return React.createElement("div", {
        "id": "setting",
        "className": "setting"
      }, React.createElement("div", {
        "className": "entries"
      }, React.createElement(Entries, {
        "save": this.onSave,
        "current": this.props.settingPos,
        "click": this.props.Action.changeSettingPos
      })), inner);
    }
  });
  Entries = React.createClass({
    render: function() {
      return React.createElement("ul", null, React.createElement("li", {
        "className": (this.props.current === 0 ? "selected" : void 0),
        "onClick": ((function(_this) {
          return function() {
            return _this.props.click(0);
          };
        })(this))
      }, "基本設定"), React.createElement("li", {
        "className": (this.props.current === 1 ? "selected" : void 0),
        "onClick": ((function(_this) {
          return function() {
            return _this.props.click(1);
          };
        })(this))
      }, "チャンネル選択"), React.createElement("li", {
        "onClick": this.props.save
      }, "設定を保存"));
    }
  });
  Contents = React.createClass({
    getInitialState: function() {
      this.currentTimers = [];
      this.notified = [];
      return {
        group: [],
        current: 0,
        settingPos: 0,
        channels: [],
        animes: [],
        config: require('./dist/js/config.js'),
        notified: [],
        currentTimer: [],
        finished: -1
      };
    },
    componentDidMount: function() {
      syobocal.getConfig((function(_this) {
        return function(res) {
          var c, ch, i, j, len, ref, selected, setting;
          if (res.channels.length === 0) {
            setting = document.getElementById('setting');
            showElement(setting);
            _this.changeSettingPos(1);
          }
          ch = {
            ChGID: 0,
            ChGroupName: "選択中"
          };
          selected = [];
          ref = res.channels;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            c = ref[i];
            if (c) {
              selected.push(i);
            }
          }
          ch.ChID = selected;
          return _this.setState({
            testSound: res.notification,
            group: [ch].concat(_this.state.group.slice(1))
          }, _this.saveSettings(res));
        };
      })(this));
      syobocal.getAnimes((function(_this) {
        return function(res) {
          var n, now;
          _this.allAnimes = res;
          now = Date.now();
          n = 0;
          return _this.setState({
            animes: _this.genAnimes(_this.state.config)
          });
        };
      })(this));
      return syobocal.getGroupList(((function(_this) {
        return function(res) {
          var GroupList;
          GroupList = res;
          return _this.setState({
            group: [_this.state.group[0]].concat(GroupList.slice(1))
          }, function() {
            return syobocal.getChList(function(res) {
              return _this.setState({
                channels: res,
                current: 0
              });
            });
          });
        };
      })(this)));
    },
    genAnimes: function(config) {
      var end, hasTimer, item, j, k, len, len1, n, now, ref, ref1, res, start, timer, timing;
      if (this.allAnimes == null) {
        return [];
      }
      ref = this.currentTimers;
      for (j = 0, len = ref.length; j < len; j++) {
        timer = ref[j];
        clearTimeout(timer.timeoutID);
      }
      this.currentTimers = [];
      now = Date.now();
      n = 0;
      while (true) {
        end = parseDate(this.allAnimes[n].$.EdTime, +this.allAnimes[n].$.StOffset);
        if (!(end.getTime() < now)) {
          break;
        }
        n++;
      }
      if (config == null) {
        return this.allAnimes.slice(n);
      }
      res = [];
      hasTimer = false;
      timing = null;
      ref1 = this.allAnimes.slice(n);
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        item = ref1[k];
        if (!config.channels[item.$.ChID]) {
          continue;
        }
        end = parseDate(item.$.EdTime, +item.$.StOffset);
        if (end.getTime() < now) {
          continue;
        }
        if (!hasTimer) {
          start = parseDate(item.$.StTime, +item.$.StOffset);
          if (start > now) {
            if (!this.notified.includes(+item.$.PID)) {
              if ((timing == null) || +timing === +start) {
                timer = {};
                console.log(item.$.Title);
                timer.id = +item.$.PID;
                timer.timeoutID = this.setTimerFor(item, start, config.countdown);
                this.currentTimers.push(timer);
                console.log("currentTimers: ");
                timing = +start;
              } else {
                hasTimer = true;
              }
            }
          }
        }
        res.push(item);
        if (res.length >= 30) {
          break;
        }
      }
      return res;
    },
    setTimerFor: function(item, start, offset_sec) {
      var callback;
      if (!(+offset_sec > 0)) {
        offset_sec = 300;
      }
      callback = (function(onFinish, item) {
        return function() {
          var ref;
          new Notification(item.$.Title, {
            body: item.$.SubTitle
          });
          if ((ref = document.getElementById("sound")) != null) {
            ref.play();
          }
          console.log(item.$.Title);
          return onFinish(+item.$.PID);
        };
      })(this.onFinishTimer, item);
      return setTimer(start, -offset_sec, callback);
    },
    onFinishTimer: function(PID) {
      this.notified.push(+PID);
      return this.setState({
        notified: this.state.notified.concat(+PID),
        currentTimer: this.state.currentTimer.filter(function(d) {
          return +d !== +PID;
        }),
        finished: +PID,
        animes: this.genAnimes(this.state.config)
      });
    },
    changeChGroup: function(ChGID) {
      return this.setState({
        current: ChGID
      });
    },
    checkChannel: function(ChID, checked) {
      var ch, chs, config, first, i, id, j, k, len, len1, ref, ref1, ref2, selected;
      chs = [];
      selected = [];
      ref = this.state.channels;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        ch = ref[i];
        if (ch != null) {
          chs[ch.ChID] = (ref1 = this.state.config.channels) != null ? ref1[ch.ChID] : void 0;
          if (chs[ch.ChID] != null) {
            if (chs[ch.ChID]) {
              selected.push(ch.ChID);
            }
          } else {
            chs[ch.ChID] = false;
          }
        } else {
          chs[i] = null;
        }
      }
      if (ChID < 0) {
        ref2 = this.state.group[-ChID].ChID;
        for (k = 0, len1 = ref2.length; k < len1; k++) {
          id = ref2[k];
          chs[id] = checked;
          if (checked) {
            selected.push(id);
          } else {
            selected = selected.filter(function(d) {
              return +d !== +id;
            });
          }
        }
      } else {
        chs[ChID] = checked;
        if (checked) {
          selected.push(ChID);
        } else {
          selected = selected.filter(function(d) {
            return +d !== +ChID;
          });
        }
      }
      config = {
        channels: chs
      };
      first = this.state.group[0];
      first.ChID = selected;
      syobocal.setConfig(config);
      return this.setState({
        group: [first].concat(this.state.group.slice(1)),
        config: config
      });
    },
    changeSettingPos: function(pos) {
      return this.setState({
        settingPos: pos
      });
    },
    saveSettings: function(config) {
      if (config.channels == null) {
        config.channels = this.state.config.channels;
      }
      if (config.countdown == null) {
        config.countdown = 300;
      }
      if (config.notification == null) {
        config.notification = "picon";
      }
      syobocal.setConfig(config);
      return this.setState({
        animes: this.genAnimes(config),
        config: config
      });
    },
    render: function() {
      var Action;
      Action = {};
      Action.checkChannel = this.checkChannel;
      Action.changeChGroup = this.changeChGroup;
      Action.changeSettingPos = this.changeSettingPos;
      return React.createElement("div", {
        "className": "inner clearfix"
      }, React.createElement(Settings, {
        "group": this.state.group,
        "channels": this.state.channels,
        "current": this.state.current,
        "settingPos": this.state.settingPos,
        "config": this.state.config,
        "onSave": this.saveSettings,
        "Action": Action
      }), React.createElement("div", {
        "className": "animes"
      }, React.createElement(Animes, {
        "groups": this.state.group,
        "current": this.state.current,
        "animes": this.state.animes,
        "channels": this.state.channels
      })), React.createElement(Audios, {
        "id": "sound",
        "sound": this.state.config.notification
      }));
    }
  });
  return ReactDOM.render(React.createElement(Contents, null), document.getElementById('contents'));
};
