var ChList, GroupList, app, config, csvToChList, fs, genGroupList, parseString, path, request, syobocal;

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
  var ch, j, len, results;
  results = [];
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
      results.push(GroupList[ch.ChGID].ChID.push(ch.ChID));
    } else {
      results.push(void 0);
    }
  }
  return results;
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
    console.log(config);
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
          console.log(cb);
          config = JSON.parse(data.toString());
          return cb(JSON.parse(data.toString()));
        });
      } else {
        console.log("configggg");
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
        console.log($('title').text());
        console.log($(".output")[1].children[0].children.innerHTML);
        csv = "";
        ref = $(".output")[1].children;
        for (j = 0, len = ref.length; j < len; j++) {
          ch = ref[j];
          if (ch.type === "tag") {
            column = [];
            ref1 = ch.children;
            for (k = 0, len1 = ref1.length; k < len1; k++) {
              c = ref1[k];
              console.log(c.children[0]);
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
    var cachePath, option;
    cachePath = path.join(app.getPath('cache'), app.getName(), "anidata.json");
    if (fs.existsSync(cachePath)) {
      console.log("cashe");
      return fs.readFile(cachePath, function(err, data) {
        if (err) {
          throw err;
        }
        return cb(JSON.parse(data.toString()));
      });
    } else {
      option = {
        url: 'http://cal.syoboi.jp/cal_chk.php'
      };
      return request.get(option, function(err, res, body) {
        return parseString(body, {
          trim: true
        }, function(error, result) {
          var items;
          items = result.syobocal.ProgItems[0].ProgItem;
          fs.writeFile(cachePath, JSON.stringify(items));
          return cb(items);
        });
      });
    }
  }
};

module.exports = syobocal;
