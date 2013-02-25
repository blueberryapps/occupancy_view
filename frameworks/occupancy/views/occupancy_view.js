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

  minimumHorizontalScrollAction: null,

  minimumHorizontalScrollTarget: null,

  maximumHorizontalScrollAction: null,

  maximumHorizontalScrollTarget: null,

  /**
    Reservables for grid view.

    @type Array
    @default null
  */
  reservables: null,
  reservableDescriptionKey: null,
  reservableCategories: null,

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

  childViews: 'reservablesList descriptionList rightView'.w(),
  
  accommodationCategoryList: SC.ContainerView.extend({
    layout: { top: BBA.OCCUPANCY_HEADER_HEIGHT + 1, left: 0, width: 180, height: BBA.OCCUPANCY_ROW_HEIGHT * 6 },
    
    contentView: SC.ListView.design({
      classNames: 'occupancy-reservables-list occupancy-reservable-categories-list'.w(),
      contentBinding: '.parentView.parentView.reservableCategoryTitles',
      isSelectable: NO,
      rowHeight: BBA.OCCUPANCY_ROW_HEIGHT
    })

  }),
  
  availableContainerView: SC.View.extend({
    classNames: 'occupancy-availability-container',
    childViews: 'availableDetailedView'.w(),
    layout: { left: 0, top: BBA.OCCUPANCY_HEADER_HEIGHT + 1, height: BBA.OCCUPANCY_ROW_HEIGHT * 6 },
    
    availableDetailedView: BBA.OccupancyAvailabilityDetailedView.design({
      layout: { left: 0, top: 0 },
      contentBinding: '.parentView.parentView.availabilityDetailedArray'
    }),
  }),

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
  
  descriptionList: SC.ContainerView.design({
    classNames: 'occupancy-reservables-container',
    layout: { top: BBA.OCCUPANCY_HEADER_HEIGHT, left: 90, bottom: 14, width: 90 },
    contentView: SC.ListView.design({
      classNames: 'occupancy-reservables-list',
      contentBinding: '.parentView.parentView.reservablesDescriptions',
      isSelectable: NO,
      rowHeight: BBA.OCCUPANCY_ROW_HEIGHT
    })
  }),

  rightView: SC.View.design({
    classNames: 'occupancy-right-container',
    layout: { top: 0, right: 0, bottom: 0, left: 180 },
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
            descriptionList = this.getPath('parentView.parentView.descriptionList'),
            occupancyView = this.getPath('parentView.parentView');
        var frame = reservablesList.get('frame');
        var offset = this.get('verticalScrollOffset');
        reservablesList.get('contentView').adjust('top', - offset);
        descriptionList.get('contentView').adjust('top', - offset);
      }.observes('verticalScrollOffset'),
      invokeLaterIf: function(cond, func, receiver, time) {
        if (cond.call(receiver)) {
          this.invokeLater(function() {
            if (cond.call(receiver)) func.call(receiver);
          }, time);
        }
      },
      horizontalScrollOffsetDidChange: function() {
        var occupancyView = this.getPath('parentView.parentView');
        var headerView = this.getPath('parentView.headerView');
        var availableContainerView = occupancyView._availableContainerView
        var offset = this.get('horizontalScrollOffset');
        headerView.adjust('left', - offset);
        if (availableContainerView) availableContainerView.adjust('left', - offset);
        occupancyView.notifyPropertyChange('scrollOffset');
        var isMinimum = function() {
          var offset = this.get('horizontalScrollOffset');
          var minimumOffset = this.get('minimumHorizontalScrollOffset');
          return minimumOffset === offset;
        };
        this.invokeLaterIf(isMinimum, function() {
          occupancyView.fireAction('minimumScrollOffsetAction', 'minimumScrollOffsetTarget', this);
        }, this, 800);
        var isMaximum = function() {
          var offset = this.get('horizontalScrollOffset');
          var maximumOffset = this.get('maximumHorizontalScrollOffset');
          return maximumOffset === offset;
        };
        this.invokeLaterIf(isMaximum, function() {
          occupancyView.fireAction('maximumScrollOffsetAction', 'maximumScrollOffsetTarget', this);
        }, this, 800);
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
    
  //availableContainerView: SC.outlet('rightView.availableContainerView'),
  
  //availableDetailedView: SC.outlet('rightView.availableContainerView.availableDetailedView'),
  
  // ..........................................................
  // SUBCLASS METHODS
  //

  didCreateLayer: function() {
    this.scrollToDate(SC.DateTime.create());
  },

  viewDidResize: function() {
    sc_super();
    var frame = this.get('frame');
    var availableContainerView = this._availableContainerView
    this._gridWidth = frame.width * 2;
    this.get('headerView').adjust('width', this._gridWidth);
    if (availableContainerView) availableContainerView.adjust('width', this._gridWidth);
    this.get('gridView').adjust('width', this._gridWidth);
    this.displayDidChange();
  },

  displayDidChange: function() {
    var headerView = this.get('headerView');
    if (headerView) headerView.periodDidChange();
    
    var availableContainerView = this._availableContainerView
    if (availableContainerView) {
      var availableDetailedView = availableContainerView.get('availableDetailedView');
      if (availableDetailedView) availableDetailedView.periodDidChange();
    }
  },

  // ..........................................................
  // METHODS
  //
  
  scrollToStart: function() {
    var period = this.get('period');
    var periodTillDate, offset;
    periodTillDate = BBA.Period.create({
      start: period.get('start'),
      end: period.get('start').advance({day: +3})
    });
    offset = this.get('columnWidth') * Math.floor(periodTillDate.get('lengthInDays'));
    this.get('scrollView').set('horizontalScrollOffset', offset);
  },

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

  fireAction: function(actionProperty, targetProperty, sender) {
    var action = this.get(actionProperty);
    var target = this.get(targetProperty);
    var rootResponder = this.getPath('pane.rootResponder');
    if (action && rootResponder) {
      rootResponder.sendAction(action, target, sender || this, this.get('pane'));
    }
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
  
  availabilityArray: function() {
    console.log('Recalculating accommondation availability..');
    
    var reservables = this.get('reservables'),
        reservations = this.get('reservations'),
        period = this.get('period'),
        results = [];
    
    if (period && reservables) {
      var reservablesLen = reservables.get('length'),
          dates = period.toArray(),
          datesLen = dates.get('length'), idx, jdx;
      
      for (idx=0; idx<datesLen; ++idx) {
        var date = dates[idx],
            available = 0;
            
        period = this._periodForDate(date)
        
        var availableInPeriod = His.Accommodation.availableInPeriod(period, reservations)
        available = availableInPeriod.get('length');
        
        results.push(available);
      }
    }
    
    return results;
  }.property('period', 'reservations').cacheable(),
  
  availabilityDetailedArray: function() {
    var reservations = this.get('reservations'),
        reservables = this.get('reservables'),
        reservableTypes = this.get('reservableCategories'),
        period = this.get('period'),
        results = [], idx, jdx;
      
    if (period && reservables && reservableTypes) {
      var dates = period.toArray(),
          datesLen = dates.get('length'),
          reservableTypesLen = reservableTypes.get('length');
      
      for (idx=0; idx<datesLen; ++idx) {
        var date = dates[idx],
            resultsForDate = [];
        
        period = this._periodForDate(date)
        var availableInPeriod = His.Accommodation.availableInPeriod(period, reservations)
        
        for (jdx=0; jdx<reservableTypesLen; ++jdx) {
          var type = reservableTypes.objectAt(jdx)
          
          var count = availableInPeriod.filter(function(a) {
            return a.get('type') === type
          }).get('length')
          
          resultsForDate.push(count)
        };
                
        results.push(resultsForDate)
      }
    }
          
    return results;
  }.property('period', 'reservations').cacheable(),
  
  reservableCategoryTitles: function(){
    var reservableCategories = this.get('reservableCategories');
        
    if (reservableCategories) {
      var reservableCategoriesLen = reservableCategories.get('length'), idx, results = [];

      for (idx=0; idx<reservableCategoriesLen; ++idx) {
        var category = reservableCategories.objectAt(idx);
        results.push(category.toString());
      }
      
      results.push('Celkem: ');
      return results;
    }
  }.property('reservableCategories').cacheable(),

  _periodForDate: function(date) {
    return His.Period.create({
      start: date,
      end: SC.copy(date).advance({ day: 1 })
    })
  },
  
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
      var len = reservables.get('length'), idx, reservable;
      for (idx=0; idx<len; idx++) {
        reservableOutages = reservables.objectAt(idx).get('outages');
        if (reservableOutages.get('length') > 0) outages.pushObjects(reservableOutages);
      }
    }
    return outages;
  }.property('reservables').cacheable(),
  
  
  reservablesDescriptions: function() {
    var reservables = this.get('reservables'),
        descriptionKey = this.get('reservableDescriptionKey');
        
    if (reservables) {
      var descriptions = reservables.map(function(reservable) {
        return reservable.get(descriptionKey) || ''
      })
    }
    
    return descriptions
  }.property('reservables', 'reservableDescriptionKey').cacheable(),

  scrollOffset: function(key, value) {
    if (value === undefined) {
      return this.getPath('scrollView.horizontalScrollOffset');
    } else {
      this.setPath('scrollView.horizontalScrollOffset', value);
    }
  }.property('scrollView'),
  
  toggleAvailabilityPane: function() {
    var accommodationCategoryList = this._accommodationCategoryList;
        availableContainerView = this._availableContainerView;
        
    if (accommodationCategoryList && availableContainerView) {
      accommodationCategoryList.destroy();
      availableContainerView.destroy();
      this._accommodationCategoryList = null;
      this._availableContainerView = null;
      
    } else {
      this._accommodationCategoryList = this.get('accommodationCategoryList').create();
      this._availableContainerView = this.get('availableContainerView').create();
      
      this.appendChild(this._accommodationCategoryList);
      this.get('rightView').appendChild(this._availableContainerView);
      
      this._availableContainerView.get('availableDetailedView').periodDidChange();
    }
  },

  // ..........................................................
  // PRIVATE METHODS
  //

  /** @private */
  _reservablesEnumDidChange: function() {
    this.notifyPropertyChange('reservables');
  },

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
    //this.get('availableDetailedView').periodDidChange();
  }.observes('period'),

  /** @private */
  _reservablesDidChange: function(a) {
    var reservables = this.get('reservables');
    if (this._oldReservables) {
      this._oldReservables.removeObserver('[]', this, '_reservablesEnumDidChange');
    }
    reservables.addObserver('[]', this, '_reservablesEnumDidChange');
    this._oldReservables = reservables;
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
