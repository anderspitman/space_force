const { timeNowSeconds } = require('../common/utils');
const { basicStats } = require('../common/math');

class TimingStats {
  constructor({ numSamples }) {
    this._numSamples = numSamples;
    this.reset();
  }

  add() {
    if (!this._full) {
      const now = timeNowSeconds();
      const elapsed = now - this._timeLast;
      this._timeLast = now;

      this._samples.push(elapsed);
      if (this._samples.length === this._numSamples) {
        this._full = true;
      }
    }
  }

  addAutoPrint() {
    this.add();
    if (this.isFull()) {
      console.log(this.getStats());
      this.reset();
    }
  }

  isFull() {
    return this._full;
  }

  getStats() {
    return basicStats(this._samples);
  }

  reset() {
    this._samples = [];
    this._full = false;
    this._timeLast = timeNowSeconds();
  }
}

module.exports = {
  TimingStats,
};
