// ==========================================================================
// Project:   BBA.OccupancyHeaderView
// Copyright: ©2011 Blueberry.cz Apps s.r.o.
// ==========================================================================
/*globals BBA */

/** @class

  @extends SC.View
*/
BBA.OccupancyHeaderView = SC.View.extend(
/** @scope BBA.OccupancyHeaderView.prototype */ {

  classNames: 'occupancy-header'.w(),

  /**
    A reference to the header encompassing OccupancyView.

    @type BBA.OccupancyView
  */
  occupancyView: SC.outlet('parentView.parentView'),

  /**
    Example view is used to create a header cell.
  */
  exampleView: SC.LabelView.extend({
    classNames: 'occupancy-header-label'.w(),
    formatter: function(a, b) {
      return a && a.toFormattedString('%d. %m. %y');
    },
    textAlign: SC.ALIGN_CENTER
  }),

  // ..........................................................
  // METHODS
  //

  /**
    Adds/removes child views based on current period.
  */
  periodDidChange: function() {
    var periodArray = this.getPath('occupancyView.periodArray'),
        periodLen = periodArray.get('length'),
        childViews = this.get('childViews'),
        childViewsLen = childViews.get('length'),
        labelsNeedsUpdate = NO,
        idx, length = 0;

    if (childViewsLen > periodLen) {
      this.removeAllChildren();
      length = periodLen;
    } else if (childViewsLen < periodLen) {
      length = periodLen - childViewsLen;
      labelsNeedsUpdate = YES;
    } else {
      labelsNeedsUpdate = YES;
    }

    for (idx=0; idx<length; ++idx) {
      this._createChildViewForContentIndex(idx, periodArray[idx]);
    }

    if (labelsNeedsUpdate) this.updateChildViews();
  },

  /**
    Returns layout hash for child with given content index.

    @param {Number} contentIndex
    @returns {Hash} Layout hash.
  */
  layoutForContentIndex: function(contentIndex) {
    var width = this.getPath('occupancyView.columnWidth'),
        left = width * contentIndex;
    return {
      top: 0,
      bottom: 0,
      left: left,
      width: width
    };
  },

  /**
    Updates layout of all child views.
  */
  updateChildViews: function() {
    var periodArray = this.getPath('occupancyView.periodArray'),
        childViews = this.get('childViews'),
        len = childViews.get('length'), idx, label;
    for (idx=0; idx<len; ++idx) {
      label = childViews[idx];
      if (label) {
        if (SC.DateTime.compareDateWithoutTimeZone(label.get('value'), SC.DateTime.create()) === 0) {
          label.get('classNames').pushObject('today');
        } else {
          label.get('classNames').removeObject('today');
        }
        label.set('value', periodArray[idx]);
        label.adjust(this.layoutForContentIndex(idx));
        label.displayDidChange();
      }
    }
  },

  // ..........................................................
  // PRIVATE METHODS
  //

  /** @private
    Creates and then appends a new child view with given
    content index and value.

    @param {Number} contentIndex
    @param {Number} value
  */
  _createChildViewForContentIndex: function(contentIndex, value) {
    var exampleView, layout, classNames = [];
    exampleView = this.get('exampleView');
    if (SC.DateTime.compareDateWithoutTimeZone(value, SC.DateTime.create()) === 0) {
      classNames = 'today'.w();
    }
    layout = this.layoutForContentIndex(contentIndex);
    this.appendChild(exampleView.create({
      classNames: classNames,
      layout: layout,
      value: value
    }));
  }

});
