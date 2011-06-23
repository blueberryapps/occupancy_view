// ==========================================================================
// Project:   BBA.OccupancyItem
// Copyright: ©2011 Blueberry.cz Apps s.r.o.
// ==========================================================================
/*globals BBA */

BBA.OccupancyItem = SC.Object.extend({

  /**
    Beginning of reservation.

    @type SC.DateTime
    @default null
  */
  startsAt: null,

  /**
    End of reservation.

    @type SC.DateTime
    @default null
  */
  endsAt: null,

  /**
    Reservable item ID.

    @type String
    @default null
  */
  reservableId: null,

  /**
    Reservation item.

    @type SC.Object
    @default null
  */
  reservation: null,

  // ..........................................................
  // COMPUTED PROPERTIES
  //

  /** @field
    Period for given item.

    @type BBA.Period
  */
  period: function() {
    var start = this.get('beginsAt'),
        end = this.get('endsAt'),
        owner = this.get('owner');

    // If period ends on the same day that begins, adjust it
    if (start && end && SC.DateTime.compareDateWithoutTimeZone(start, end) >= 0) {
      end = start.advance({ day: 1 });
    }

    if (owner) {
      return owner._alignPeriod(start, end);
    } else {
      return BBA.Period.create({
        start: start,
        end: end
      });
    }
  }.property('beginsAt', 'endsAt').cacheable(),

  toString: function() {
    var reservation = this.get('reservation'),
        title = reservation;
    if (reservation) {
      if (SC.typeOf(reservation) !== SC.T_STRING) title = reservation.toString();
      return title;
    } else return sc_super();
  }

});
