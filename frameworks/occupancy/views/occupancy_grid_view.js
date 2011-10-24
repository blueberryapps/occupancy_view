// ==========================================================================
// Project:   BBA.OccupancyGridView
// Copyright: ©2011 Bluebeerry.cz Apps s.r.o.
// ==========================================================================
/*globals BBA */

sc_require('views/occupancy_item_view');

/** @class

  @extends SC.View
*/
BBA.OccupancyGridView = SC.CollectionView.extend(
/** @scope BBA.OccupancyGridView.prototype */ {

  classNames: 'occupancy-grid-view'.w(),

  /**
    A reference to the header encompassing OccupancyView.

    @type BBA.OccupancyView
  */
  occupancyView: SC.outlet('parentView.parentView.parentView.parentView'),

  contentBinding: '.occupancyView.itemsForGridView',

  reservablesBinding: '.occupancyView.reservables',

  delegate: SC.outlet('occupancyView.delegate'),

  exampleView: BBA.OccupancyItemView,

  rowHeight: 24,

  ghostItem: null,

  ghostItemView: null,

  // ..........................................................
  // METHODS
  //

  /**
    Called from parent view (OccupancyView) whenever grid's
    height needs to be updated.
  */
  updateGridHeight: function() {
    var reservablesLength = this.getPath('reservables.length'),
        rowHeight = this.get('rowHeight');
    this.adjust('height', rowHeight * reservablesLength);
  },

  // ..........................................................
  // SUBCLASS METHODS
  //

  /**
    Recalculate layout for each child when grid view is resized
  */
  viewDidResize: function() {
    sc_super();
    var childViews = this.get('childViews'),
        idx, len = childViews.get('length');
    for (idx=0; idx<len; ++idx) {
      childViews[idx].adjust(this.layoutForContentIndex(idx));
    }
  },

  /**
    Returns a layout for child view with given index.
  */
  layoutForContentIndex: function(contentIndex) {
    var item = this.get('content').objectAt(contentIndex);
    if (item) return this._layoutForContentItem(item);
    return null;
  },

  /**
    Subclassed render method. Calls the super and then renders
    grid lines.
  */
  render: function(context) {
    sc_super();
    this._renderGridLines(context);
  },

  // ..........................................................
  // EVENT METHODS
  //

  mouseDown: function(evt) {
    sc_super();
    this._lastPoint = this.convertFrameFromView({ x: evt.pageX, y: evt.pageY }, null);
    var reservable = this._reservableForTopOffset(this._lastPoint.y),
        dateTime = this._dateTimeForLeftOffset(this._lastPoint.x);
    this._ghostItem = BBA.OccupancyGhostItem.create({
      owner: this,
      reservableId: reservable && reservable.get('id'),
      beginsAt: dateTime,
      endsAt: dateTime
    });
    this._ghostItem.align();
    return YES;
  },

  mouseDragged: function(evt) {
    var point = this.convertFrameFromView({ x: evt.pageX, y: evt.pageY }, null),
        endsAt = this._dateTimeForLeftOffset(point.x),
        ghostItem = this._ghostItem,
        reservables, idx;

    if (!this.get('ghostItem')) {
      this.set('ghostItem', ghostItem);
    }
    ghostItem.align();

    var del = this.getPath('delegate');
    if (del && del.validateProposedChange) {
      var proposed = SC.copy(ghostItem);
      var alignedEndsAt = this._alignPeriod(null, endsAt).get('end');
      proposed.set('endsAt', alignedEndsAt);
      if (del.validateProposedChange(null, proposed)) {
        proposed.destroy();
        ghostItem.set('endsAt', alignedEndsAt);
      } else {
        proposed.destroy();
        return;
      }
    }

    ghostItem.set('endsAt', endsAt);
    this.notifyPropertyChange('ghostItem');
  },

  mouseUp: function(evt) {
    sc_super();
    if (this.ghostItemView) {
      var occupancyView = this.get('occupancyView');
      var del = this.get('delegate');
      if (del && del.newReservationProposed) {
        del.newReservationProposed(this.get('ghostItem'), this.ghostItemView);
      }
      this.ghostItemView.destroy();
      this.ghostItemView = null;
    }

    this._lastPoint = null;
    this._ghostItem = null;
    this.set('ghostItem', null);
    return YES;
  },

  // ..........................................................
  // OBSERVERS
  //

  ghostItemDidChange: function() {
    var ghostItem = this.get('ghostItem'),
        ghostItemView = this.get('ghostItemView');

    if (ghostItem && !ghostItemView) {
      this.ghostItemView = this.get('exampleView').create({
        classNames: 'ghost',
        layout: this._layoutForContentItem(ghostItem),
        content: ghostItem
      });
      this.appendChild(this.ghostItemView);
    } else if (ghostItem && ghostItemView) {
      var width = this._widthForItem(ghostItem),
          height = this.get('rowHeight');
      if (ghostItem.hasMultipleReservables === YES) {
        height *= ghostItem.getPath('reservables.length');
      }
      ghostItemView.adjust('width', width);
      ghostItemView.adjust('height', height);
    }
  }.observes('ghostItem'),

  // ..........................................................
  // PRIVATE METHODS
  //

  /** @private
    Renders grid's horizontal and vertical lines.
  */
  _renderGridLines: function(context) {
    var reservablesLen = this.getPath('reservables.length') - 1,
        periodLen = this.getPath('occupancyView.period.lengthInDays')
        rowHeight = this.get('rowHeight'),
        columnWidth = this.getPath('occupancyView.columnWidth');
    for (idx=0; idx<reservablesLen; ++idx) {
      context.begin('div').addClass('horizontal-separator').addStyle({
        top: rowHeight * (idx + 1) - 1
      }).end();
    }
    for (idx=0; idx<periodLen; ++idx) {
      context.begin('div').addClass('vertical-separator').addStyle({
        left: columnWidth * (idx + 1)
      }).end();
    }
  },

  /** @private
    Returns layout hash for given item.

    @param {SC.Object} item
    @returns {Object} A layout hash.
  */
  _layoutForContentItem: function(item) {
    return {
      top: this._topOffsetForItem(item),
      left: this._leftOffsetForItem(item),
      width: this._widthForItem(item),
      height: this.get('rowHeight') - 1
    };
  },

  /** @private
    Returns layout hash for given item while keeping
    account of overlay attributes.

    @param {BBA.OccupancyItem} item
    @param {SC.View} itemView
    @returns {Object} A layout hash.
  */
  _layoutForContentItemWithOverlay: function(item, itemView) {
    var reservableId, beginsAt, endsAt, period;
    if (itemView._proposedAttributes.reservableId) {
      reservableId = itemView._proposedAttributes.reservableId;
    } else {
      reservableId = item.get('reservableId');
    }

    if (itemView._proposedAttributes.beginsAt) {
      beginsAt = itemView._proposedAttributes.beginsAt;
    } else {
      beginsAt = item.get('beginsAt');
    }

    if (itemView._proposedAttributes.endsAt) {
      endsAt = itemView._proposedAttributes.endsAt;
    } else {
      endsAt = item.get('endsAt');
    }

    period = BBA.Period.create({
      start: beginsAt, end: endsAt
    });

    return {
      top: this._topOffsetForReservableId(reservableId),
      left: this._leftOffsetForDateTime(beginsAt),
      width: this._widthForPeriod(period),
      height: this.get('rowHeight')
    };
  },

  /** @private
    Returns a top offset for given grid item.

    @param {BBA.OccupancyItem} item
    @returns {Number} A top offset.
  */
  _topOffsetForItem: function(item) {
    var reservableId = item.get('reservableId');
    return this._topOffsetForReservableId(reservableId);
  },

  /** @private
    Returns a top offset for given reservable.

    @param {String} reservableId
    @returns {Number} A top offset.
  */
  _topOffsetForReservableId: function(reservableId) {
    var reservables = this.getPath('occupancyView.reservables').getEach('id'),
        index;
    if (reservables) {
     index = reservables.indexOf(reservableId);
     return index * this.get('rowHeight');
    }
  },

  /** @private
    Returns a left offset for given grid item.

    @param {BBA.OccupancyItem} item
    @returns {Number} A left offset.
  */
  _leftOffsetForItem: function(item) {
    return this._leftOffsetForDateTime(item.getPath('period.start'));
  },

  /** @private
    Returns a width for given grid item.

    @param {BBA.OccupancyItem} item
    @returns {Number} A width.
  */
  _widthForItem: function(item) {
    var period = item.get('period');
    return this._widthForPeriod(period);
  },

  /** @private
    Returns a width for given period.

    @param {BBA.Period} period
    @returns {Number} A width.
  */
  _widthForPeriod: function(period) {
    var length = period.get('lengthInDays'),
        columnWidth = this.getPath('occupancyView.columnWidth');
    return length * columnWidth;
  },
  /** @private
    Return a left offset from grid beginning in pixels for given
    datetime.

    @param {SC.DateTime} datetime
    @returns {Number} A left offset.
  */
  _leftOffsetForDateTime: function(datetime) {
    var ms, columnWidth, start, days, offset;
    ms = datetime.getPath('milliseconds'); // SC.DateTime
    columnWidth = this.getPath('occupancyView.columnWidth');
    start = this.getPath('occupancyView.period.start.milliseconds');
    days = ((ms - start) / 1000.0 / 86400.0);
    offset = (days * (columnWidth - 1)) ;
    return offset;
  },

  /** @private
    Returns a datetime for given x-position inside grid.

    @param {Number} offset
    @returns {SC.DateTime}
  */
  _dateTimeForLeftOffset: function(offset) {
    var start = this.getPath('occupancyView.period.start'),
        ms = this._millisecondsForDistance(offset);
    return start.advance({ millisecond: ms });
  },

  /** @private
    Returns the number of milliseconds that given distance
    represents on grid view (x-wise).

    @param {Number} distance
    @returns {Number} A number of milliseconds
  */
  _millisecondsForDistance: function(distance) {
    var columnWidth = this.getPath('occupancyView.columnWidth');
    return distance / columnWidth * 86400 * 1000;
  },

  /** @private
    Returns an reservable for given y-position inside grid.

    @param {Number} offset
    @returns {BBA.Accommodation}
  */
  _reservableForTopOffset: function(offset) {
    var rowHeight = this.get('rowHeight'),
        index = Math.ceil((offset - rowHeight) / this.get('rowHeight'));
    return this.get('reservables').objectAt(index);
  },

  /** @private */
  _alignPeriod: function(start, end) {
    var period, del;
    period = BBA.Period.create({
      start: start, end: end
    });
    del = this.getPath('delegate');
    if (del && del.alignReservationPeriod) {
      return del.alignReservationPeriod(period);
    } else {
      return period;
    }
  }

});
