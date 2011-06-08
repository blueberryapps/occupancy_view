// ==========================================================================
// Project:   BBA.OccupancyView
// Copyright: ©2010 Blueberry.cz Apps s.r.o.
// ==========================================================================
/*globals BBA */

sc_require('views/occupancy_header_view');
sc_require('views/occupancy_grid_view');

BBA.OCCUPANCY_ROW_HEIGHT = 24;
BBA.OCCUPANCY_HEADER_HEIGHT = 18;

BBA.OccupancyView = SC.View.extend(SC.Border, {

  classNames: 'occupancy-view'.w(),

  displayProperties: 'reservations reservables'.w(),

  borderStyle: SC.BORDER_GRAY,

  /**
    Reservations array. For performance reasons it should corespond
    with given period.

    @type Array
    @default null
  */
  reservations: null,

  /**
    Selected reservations (using outlet).

    @type SC.SelectionSet
  */
  reservationsSelection: SC.outlet('gridView.selection'),

  /**
    A property key that will be used to display reservation title.

    @type String
    @default null
  */
  reservationTitleKey: null,

  /**
    The name of the action you want triggered when the reservation
    item is pressed.

    @type String
    @default null
  */
  reservationAction: null,

  /**
    The target object to invoke the action on when the reservation
    item is pressed.

    @type String
    @default null
  */
  reservationTarget: null,

  /**
    The name of the action you want to triggered when new reservation
    is created using dragging on the grid.

    @type String
    @default null
  */
  newReservationAction: null,

  /**
    The target object to invoke the action on when new reservation
    is created using dragging on the grid.

    @type String
    @default null
  */
  newReservationTarget: null,

  /**
    Reservables for grid view.

    @type Array
    @default null
  */
  reservables: null,

  /**
    A property key that will be used to display reservables title.

    @type String
    @default null
  */
  reservableTitleKey: null,

  /**
    A period that marks occupancy grid view beginning and end.
    Columns width will be calculated depending on number of days
    in period.

    @type BBA.Period
    @default null
  */
  period: null,

  _gridWidth: null,

  // ..........................................................
  // CHILD VIEWS
  //

  childViews: 'reservablesList rightView'.w(),

  reservablesList: SC.ContainerView.design({
    classNames: 'occupancy-reservables-container',
    layout: { top: BBA.OCCUPANCY_HEADER_HEIGHT, left: 0, bottom: 14, width: 90 },
    contentView: SC.ListView.design({
      classNames: 'occupancy-reservables-list',
      contentBinding: '.parentView.parentView.reservables',
      isSelectable: NO,
      rowHeight: BBA.OCCUPANCY_ROW_HEIGHT
    })
  }),

  rightView: SC.View.design({
    classNames: 'occupancy-right-container',
    layout: { top: 0, right: 0, bottom: 0, left: 90 },
    childViews: 'headerView scrollView'.w(),

    /**
      A header view.

      @type BBA.OccupancyHeaderView
    */
    headerView: BBA.OccupancyHeaderView.design({
      layout: { top: 0, right: 0, left: 0, height: BBA.OCCUPANCY_HEADER_HEIGHT },
      contentBinding: '.parentView.periodArray'
    }),

    /**
      A Scrollview that holds occupancy grid content.

      @type SC.ScrollView
    */
    scrollView: SC.ScrollView.design({
      layout: { top: BBA.OCCUPANCY_HEADER_HEIGHT + 1, right: 0, bottom: 0, left: 0 },
      borderStyle: SC.BORDER_NONE,
      contentView: BBA.OccupancyGridView.design({
      }),
      verticalScrollOffsetDidChange: function() {
        var reservablesList = this.getPath('parentView.parentView.reservablesList'),
            frame = reservablesList.get('frame'),
            offset = this.get('verticalScrollOffset');
        reservablesList.get('contentView').adjust('top', - offset);
      }.observes('verticalScrollOffset'),
      horizontalScrollOffsetDidChange: function() {
        var headerView = this.getPath('parentView.headerView'),
            frame = headerView.get('frame'),
            offset = this.get('horizontalScrollOffset');
        headerView.adjust('left', - offset);
      }.observes('horizontalScrollOffset')
    })
  }),

  /**
    A container view is used as a parent for CollectionView's
    childs.
  */
  gridView: SC.outlet('rightView.scrollView.contentView'),

  scrollView: SC.outlet('rightView.scrollView'),

  headerView: SC.outlet('rightView.headerView'),

  // ..........................................................
  // SUBCLASS METHODS
  //

  didCreateLayer: function() {
    this.scrollToDate(SC.DateTime.create());
  },

  viewDidResize: function() {
    sc_super();
    var frame = this.get('frame');
    this._gridWidth = frame.width*3;
    this.get('headerView').adjust('width', this._gridWidth);
    this.get('gridView').adjust('width', this._gridWidth);
    this.displayDidChange();
  },

  displayDidChange: function() {
    var headerView = this.get('headerView');
    if (headerView) headerView.periodDidChange();
  },

  // ..........................................................
  // METHODS
  //

  scrollToDate: function(date) {
    var period = this.get('period');
    if (period.isDateInPeriod(date)) {
      var periodTillDate, offset;
      periodTillDate = BBA.Period.create({
        start: period.get('start'),
        end: date
      });
      offset = this.get('columnWidth') * Math.floor(periodTillDate.get('lengthInDays'));
      this.get('scrollView').set('horizontalScrollOffset', offset);
      return YES;
    } else return NO;
  },

  // ..........................................................
  // PROPERTIES
  //

  /**
    Returns calculated width for grid columns.

    @field
    @type Number
  */
  columnWidth: function() {
    var frameWidth = this._gridWidth,
        period = this.get('period');
    if (period) {
      return Math.ceil(frameWidth / period.get('lengthInDays'));
    } else {
      return 0;
    }
  }.property('frame', 'period').cacheable(),

  /**
    Returns an array with datetimes for each date in period.

    @field
    @type Array
  */
  periodArray: function() {
    var period = this.get('period');
    if (period) return period.toArray();
    else return [];
  }.property('period').cacheable(),

  /**
    Items that will be display on grid view - reservations and
    reservable outages.

    @field
    @type Array
  */
  itemsForGridView: function() {
    var reservations = this.get('reservations'),
        reservableOutages = this.get('reservableOutages'),
        items = [];
    items.pushObjects(reservableOutages);
    if (reservations) items.pushObjects(reservations.toArray());
    return items;
  }.property('reservations', 'reservableOutages').cacheable(),

  /**
    Returns outages for all reservable items.

    @field
    @type Array
  */
  reservableOutages: function() {
    var reservables = this.get('reservables'),
        outages = [], reservableOutages;
    if (reservables) {
      reservables.forEach(function(reservable) {
        reservableOutages = reservable.get('outages');
        if (reservableOutages.get('length') > 0) outages.pushObjects(reservableOutages);
      });
    }
    return outages;
  }.property('reservables').cacheable(),

  // ..........................................................
  // PRIVATE METHODS
  //

  /** @private */
  _reservationsEnumDidChange: function() {
    this.notifyPropertyChange('itemsForGridView');
  },

  // ..........................................................
  // OBSERVERS
  //

  /** @private */
  _periodDidChange: function() {
    this.get('headerView').periodDidChange();
  }.observes('period'),

  /** @private */
  _reservablesDidChange: function(a) {
    this.get('gridView').updateGridHeight();
  }.observes('reservables'),

  /** @private */
  _reservationsDidChange: function() {
    var reservations = this.get('reservations');
    if (this._oldReservations) {
      this._oldReservations.removeObserver('[]', this, '_reservationsEnumDidChange');
    }
    reservations.addObserver('[]', this, '_reservationsEnumDidChange');
    this._oldReservations = reservations;
  }.observes('reservations')

});
