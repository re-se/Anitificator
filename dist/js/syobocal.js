var ChList, GroupList, app, config, csvToChList, fs, genGroupList, parseDate, parseString, path, request, requestAnimes, syobocal;

app = require('app');

fs = require('fs');

path = require('path');

parseString = require('xml2js').parseString;

request = require('request');

ChList = [];

GroupList = [];

config = null;

csvToChList = function(csv) {
  var channel, elems, i, j, k, l, label, len, len1, line, lines;
  lines = csv.split("\n");
  label = lines.shift();
  label = label.split(",");
  label[0] = "$$";
  for (j = 0, len = lines.length; j < len; j++) {
    line = lines[j];
    channel = {};
    elems = line.split(",");
    for (i = k = 0, len1 = label.length; k < len1; i = ++k) {
      l = label[i];
      channel[l] = elems[i];
    }
    ChList[channel.ChID] = channel;
  }
  return ChList;
};

genGroupList = function(chs) {
  var ch, j, len;
  for (j = 0, len = chs.length; j < len; j++) {
    ch = chs[j];
    if (ch != null) {
      if (GroupList[ch.ChGID] == null) {
        GroupList[ch.ChGID] = {
          ChID: [],
          ChGID: ch.ChGID,
          ChGroupName: ch.ChGroupName
        };
      }
      GroupList[ch.ChGID].ChID.push(ch.ChID);
    }
  }
  return GroupList;
};

parseDate = function(n, offset) {
  var d, date;
  if (offset == null) {
    offset = 0;
  }
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

requestAnimes = function(optstr, cb) {
  var option;
  if (cb == null) {
    cb = optstr;
    optstr = "";
  }
  console.log(optstr);
  option = {
    url: 'http://cal.syoboi.jp/cal_chk.php?' + optstr
  };
  return request.get(option, function(err, res, body) {
    return parseString(body, {
      trim: true
    }, function(error, result) {
      var items;
      items = result.syobocal.ProgItems[0].ProgItem;
      return cb(items);
    });
  });
};

syobocal = {
  getGroupList: function(cb) {
    if (GroupList.length > 0) {
      cb(GroupList);
      return;
    }
    if (ChList.length > 0) {
      return cb(genGroupList(chs));
    } else {
      return syobocal.getChList(function(chs) {
        return cb(genGroupList(chs));
      });
    }
  },
  setConfig: function(conf) {
    var cachePath;
    console.log("set config");
    console.log(typeof conf);
    cachePath = path.join(app.getPath('cache'), app.getName(), "config.json");
    config = conf;
    return fs.writeFile(cachePath, JSON.stringify(config));
  },
  getConfig: function(cb) {
    var cachePath;
    if (config != null) {
      return cb(config);
    } else {
      cachePath = path.join(app.getPath('cache'), app.getName(), "config.json");
      if (fs.existsSync(cachePath)) {
        console.log(cachePath);
        return fs.readFile(cachePath, function(err, data) {
          if (err) {
            throw err;
          }
          config = JSON.parse(data.toString());
          return cb(JSON.parse(data.toString()));
        });
      } else {
        config = require('./config.js');
        fs.writeFile(cachePath, JSON.stringify(config));
        return cb(config);
      }
    }
  },
  getChList: function(cb) {
    var cachePath, client;
    cachePath = path.join(app.getPath('cache'), app.getName(), "chdata.json");
    if (ChList.length > 0) {
      cb(ChList);
      return;
    }
    if (fs.existsSync(cachePath)) {
      console.log(cachePath);
      return fs.readFile(cachePath, function(err, data) {
        if (err) {
          throw err;
        }
        return cb(JSON.parse(data.toString()));
      });
    } else {
      client = require('cheerio-httpcli');
      return client.fetch('http://cal.syoboi.jp/mng?Action=ShowChList', {}, function(err, $, res) {
        var c, ch, column, csv, j, json, k, len, len1, ref, ref1;
        csv = "";
        ref = $(".output")[1].children;
        for (j = 0, len = ref.length; j < len; j++) {
          ch = ref[j];
          if (ch.type === "tag") {
            column = [];
            ref1 = ch.children;
            for (k = 0, len1 = ref1.length; k < len1; k++) {
              c = ref1[k];
              if (c.children[0] != null) {
                column.push(c.children[0].data);
              }
            }
            csv += column.join(",") + "\n";
          }
        }
        json = csvToChList(csv);
        fs.writeFile(cachePath, JSON.stringify(json));
        return cb(json);
      });
    }
  },
  getAnimes: function(cb) {
    var cachePath;
    cachePath = path.join(app.getPath('cache'), app.getName(), "anidata.json");
    if (fs.existsSync(cachePath)) {
      console.log("cashe");
      return fs.readFile(cachePath, function(err, data) {
        var date, date_m, json, last, option, to, to_m;
        if (err) {
          throw err;
        }
        json = JSON.parse(data.toString());
        last = json[json.length - 1];
        console.log(last.$.StTime);
        date = parseDate(last.$.StTime);
        if (+date < Date.now()) {
          date = new Date();
        }
        date_m = date.getTime();
        to = new Date();
        to.setDate(to.getDate() + 7);
        to_m = to.getTime();
        console.log("last: " + date);
        console.log("to: " + to);
        if (date_m < to_m) {
          option = [];
          return requestAnimes(function(items) {
            fs.writeFile(cachePath, JSON.stringify(items));
            return cb(items);
          });
        } else {
          return cb(json);
        }
      });
    } else {
      return requestAnimes("", function(items) {
        fs.writeFile(cachePath, JSON.stringify(items));
        return cb(items);
      });
    }
  }
};

module.exports = syobocal;
