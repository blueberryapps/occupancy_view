// ==========================================================================
// Project:   BBA.Period
// Copyright: ©2010 Blueberry.cz Apps s.r.o.
// ==========================================================================
/*globals BBA */

/** @class

  Represents a period of time.

  @version 0.1
*/
BBA.Period = SC.Object.extend(
/** @scope BBA.Period.prototype */ {

  /**
    Walk like a duck.

    @type Boolean
    @default YES
  */
  isPeriod: YES,

  /**
    A start of given period.

    @type SC.DateTime
    @default null
  */
  start: null,

  /**
    An end of given period.

    @type SC.DateTime
    @default null
  */
  end: null,

  // ..........................................................
  // COMPUTED PROPERTIES
  //

  lengthInDays: function() {
    var lengthInMilliseconds = this.get('lengthInMilliseconds');
    if (lengthInMilliseconds) return (lengthInMilliseconds) / (86400 * 1000);
  }.property('start', 'end').cacheable(),

  lengthInHours: function() {
    var lengthInMilliseconds = this.get('lengthInMilliseconds');
    if (lengthInMilliseconds) return (lengthInMilliseconds) / (3600 * 1000);
  }.property('start', 'end').cacheable(),

  lengthInMilliseconds: function() {
    if (this.get('start') && this.get('end')) {
      var start = this.getPath('start.milliseconds'),
          end   = this.getPath('end.milliseconds');

      return (end - start);
    }
  }.property('start', 'end').cacheable(),

  nightsCount: function() {
    if (this.get('start') && this.get('end')) {
      var start = this.get('start').adjust({ hour: 0 }).get('milliseconds'),
          end   = this.get('end').adjust({ hour: 0 }).get('milliseconds');

      return Math.round((end - start) / (86400 * 1000));
    }
  }.property('start', 'end').cacheable(),


  // ..........................................................
  // METHODS
  //

  dateInPeriod: function(date) {
    var start = this.get('start'),
        end = this.get('end');

    if (start && end) {
      return (SC.DateTime.compareDateWithoutTimeZone(start, date) < 1 &&
              SC.DateTime.compareDateWithoutTimeZone(end, date) > -1);
    } else if (start && !end) {
      return (SC.DateTime.compareDateWithoutTimeZone(start, date) < 1);
    } else if (!start && end) {
      return (SC.DateTime.compareDateWithoutTimeZone(end, date) > -1);
    }
  },

  /**
    Check if given date is in period. Returns `YES` if it is,
    otherwise returns `NO`.

    @param {SC.DateTime} date
    @returns {Boolean}
  */
  isDateInPeriod: function(date) {
    return this.dateInPeriod(date);
  },

  intersect: function(otherPeriod) {
    var s1 = this.get('start'),
        e1 = this.get('end'),
        s2 = otherPeriod.get('start'),
        e2 = otherPeriod.get('end');

    var min = SC.DateTime.compare(s1, s2) > 0 ? s1 : s2;
    var max = SC.DateTime.compare(e1, e2) < 0 ? e1 : e2;
    if (SC.DateTime.compare(max, min) < 0) return null;

    return BBA.Period.create({ start: min, end: max });
  },

  intersectDays: function(otherPeriod) {
    var s1 = this.get('start'),
        e1 = this.get('end'),
        s2 = otherPeriod.get('start'),
        e2 = otherPeriod.get('end');

    var min = SC.DateTime.compare(s1, s2) > 0 ? s1 : s2;
    var max = SC.DateTime.compare(e1, e2) < 0 ? e1 : e2;
    if (SC.DateTime.compare(max, min) < 0) return null;

    return BBBBA.Period.create({ start: min.adjust({ hour: 0 }), end: max.adjust({ hour: 0 }) });
  },

  toArray: function() {
    var start = this.get('start'),
        len   = this.get('lengthInDays'),
        ary = [];
    for (idx=0; idx<len; ++idx) {
      ary.pushObject(start.advance({ day: idx }));
    }
    return ary;
  },

  toString: function() {
    var format = "%d. %m. %Y %H:%M";
    var start = this.get('start');
    var end = this.get('end');

    if (start && end) {
      return start.toFormattedString(format) +
             " - " +
             end.toFormattedString(format);
    }
  }

}) ;

