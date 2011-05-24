// ==========================================================================
// Project:   BBA.OccupancyGhostItem
// Copyright: ©2011 Blueberry.cz Apps s.r.o.
// ==========================================================================
/*globals BBA */

sc_require('utils/occupancy_item');

BBA.OccupancyGhostItem = BBA.OccupancyItem.extend({

  hasMultipleReservables: YES,

  align: function(owner) {
    owner = owner || this.get('owner');
    var alignedPeriod = owner._alignPeriod(this.get('startsAt'),
                                                       this.get('endsAt'));
    this.set('startsAt', alignedPeriod.get('start'));
    this.set('endsAt', alignedPeriod.get('end'));
    return alignedPeriod;
  },

  toString: function() {
    return "Nová rezervace".loc();
  }

});

