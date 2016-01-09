window.onload = function() {
  var Animes, Audios, Channels, Contents, Groups, React, ReactDOM, formatDate, parseDate, remote, setTimer, syobocal;
  remote = require('remote');
  React = require('react');
  ReactDOM = require('react-dom');
  syobocal = remote.require('./dist/js/syobocal.js');
  setTimer = require('./dist/js/timer.js');
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
            selected = "group-selected";
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
          return React.createElement("li", null, React.createElement("label", {
            "id": ch.ChID,
            "key": ch.ChName
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
    render: function() {
      var callback, cname, cnt, date, end, hasTimer, item, items, j, len, now, ref, start, timing, trs;
      console.log("currentTimer: " + this.props.currentTimer);
      console.log("notified: " + this.props.notified);
      hasTimer = !this.props.currentTimer.every((function(_this) {
        return function(ele) {
          return _this.props.notified.includes(+ele);
        };
      })(this));
      console.log("hasTimer: " + hasTimer);
      date = 0;
      items = [];
      trs = "";
      cnt = 0;
      now = Date.now();
      timing = Infinity;
      ref = this.props.animes;
      for (j = 0, len = ref.length; j < len; j++) {
        item = ref[j];
        if (!(this.props.channels.length > 0)) {
          break;
        }
        if (!this.props.config.channels[item.$.ChID]) {
          continue;
        }
        start = parseDate(item.$.StTime, +item.$.StOffset);
        end = parseDate(item.$.EdTime, +item.$.StOffset);
        if (end.getTime() < now) {
          continue;
        }
        if (start.getTime() - timing > 0) {
          hasTimer = true;
        }
        if (!hasTimer && start.getTime() > now) {
          if (!this.props.notified.includes(+item.$.PID) && !this.props.currentTimer.includes(+item.$.PID)) {
            timing = start.getTime();
            console.log(item.$.Title);
            this.props.Actions.onSetTimer(+item.$.PID);
            callback = (function(onFinish, item) {
              return function() {
                document.getElementById("sound").play();
                new Notification(item.$.Title, {
                  body: item.$.SubTitle
                });
                console.log(item.$.Title);
                return onFinish(+item.$.PID);
              };
            })(this.props.Actions.onFinishTimer, item);
            setTimer(start, -300, callback);
          }
        }
        if ((typeof date.getDate === "function" ? date.getDate() : void 0) !== start.getDate() || cnt > 30) {
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
        if (cnt++ > 30) {
          break;
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
      return React.createElement("div", {
        "className": "animes-inner"
      }, items);
    }
  });
  Audios = React.createClass({
    render: function() {
      return React.createElement("audio", {
        "id": "sound",
        "src": "./dist/resource/audio/notification.mp3"
      });
    }
  });
  Contents = React.createClass({
    getInitialState: function() {
      return {
        group: [],
        current: 0,
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
          var c, ch, i, j, len, ref, selected;
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
          _this.setState({
            group: [ch].concat(_this.state.group.slice(1))
          });
          return _this.setState({
            config: res
          });
        };
      })(this));
      syobocal.getAnimes((function(_this) {
        return function(res) {
          return _this.setState({
            animes: res
          });
        };
      })(this));
      return syobocal.getGroupList(((function(_this) {
        return function(res) {
          var GroupList;
          GroupList = res;
          _this.setState({
            group: [_this.state.group[0]].concat(GroupList.slice(1))
          });
          return syobocal.getChList(function(res) {
            return _this.setState({
              channels: res
            });
          });
        };
      })(this)));
    },
    onSetTimer: function(PID) {
      return this.setState({
        currentTimer: this.state.currentTimer.concat(PID)
      });
    },
    onFinishTimer: function(PID) {
      return this.setState({
        notified: this.state.notified.concat(+PID)
      }, function() {
        return this.setState({
          currentTimer: this.state.currentTimer.filter(function(d) {
            return +d !== +PID;
          })
        }, function() {
          return this.setState({
            finished: +PID
          }, function() {
            return this.setState({
              animes: this.state.animes
            });
          });
        });
      });
    },
    chengeChGroup: function(ChGID) {
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
      this.setState({
        group: [first].concat(this.state.group.slice(1))
      });
      return this.setState({
        config: config
      });
    },
    render: function() {
      var AnimesActions;
      AnimesActions = {
        onSetTimer: this.onSetTimer,
        onFinishTimer: this.onFinishTimer
      };
      return React.createElement("div", {
        "className": "inner clearfix"
      }, React.createElement("div", {
        "className": "leftbar"
      }, React.createElement("div", {
        "className": "groups"
      }, React.createElement(Groups, {
        "data": this.state.group,
        "current": this.state.current,
        "onClick": this.chengeChGroup
      })), React.createElement("div", {
        "className": "channels"
      }, React.createElement(Channels, {
        "channels": this.state.channels,
        "groups": this.state.group,
        "current": this.state.current,
        "config": this.state.config,
        "onChange": this.checkChannel
      }))), React.createElement("div", {
        "className": "animes"
      }, React.createElement(Animes, {
        "Actions": AnimesActions,
        "notified": this.state.notified,
        "currentTimer": this.state.currentTimer,
        "animes": this.state.animes,
        "channels": this.state.channels,
        "config": this.state.config
      })), React.createElement(Audios, {
        "finished": this.state.finished
      }));
    }
  });
  return ReactDOM.render(React.createElement(Contents, null), document.getElementById('contents'));
};
