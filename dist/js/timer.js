var setTimer;

module.exports = setTimer = function(date, offset_sec, cb) {
  var delta, s;
  if (cb == null) {
    cb = offset_sec;
    offset_sec = 0;
  }
  delta = date.getTime() + offset_sec * 1000 - Date.now();
  if (delta > 60000) {
    delta = 60000;
  }
  console.log(delta);
  s = 0;
  if (delta <= 0) {
    cb();
    return;
  } else if (delta < 6000) {
    s = delta;
  } else {
    s = delta / 2;
  }
  return setTimeout(setTimer, s, date, offset_sec, cb);
};
