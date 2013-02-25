BBA.OccupancyAvailabilityDetailedView = SC.View.extend({
  classNames: 'occcupancy-availability-detailed'.w(),

  occupancyView: SC.outlet('parentView.parentView.parentView'),

  /**
    Example view is used to create a header cell.
  */
  exampleView: SC.ListView.extend({
    classNames: 'occupancy-availability-list occupancy-reservables-list',
    isSelectable: NO
  }),
  
  ////////////////////////////
  // METHODS
  /////////////////////////

  periodDidChange: function() {
    var availabilityDetailedArray = this.getPath('occupancyView.availabilityDetailedArray'),
        availabilityDetailedLen = availabilityDetailedArray.get('length'),
        availabilityArray = this.getPath('occupancyView.availabilityArray'),
        childViews = this.get('childViews'),
        childViewsLen = childViews.get('length'),
        labelsNeedsUpdate = NO,
        idx, content, length = 0;

    if (childViewsLen > availabilityDetailedLen) {
      this.removeAllChildren();
      length = availabilityDetailedLen;
    } else if (childViewsLen < availabilityDetailedLen) {
      length = availabilityDetailedLen - childViewsLen;
      labelsNeedsUpdate = YES;
    } else {
      labelsNeedsUpdate = YES;
    }

    for (idx=0; idx<length; ++idx) {
      content = availabilityDetailedArray[idx];
      content.push(availabilityArray[idx]);
      
      this._createChildViewForContentIndex(idx, content);
    }

    if (labelsNeedsUpdate) this.updateChildViews();
  },

  layoutForContentIndex: function(contentIndex) {
    var width = this.getPath('occupancyView.columnWidth'),
        left = width * contentIndex;
    return {
      top: 0,
      //bottom: 0,
      left: left,
      width: width
    };
  },

  updateChildViews: function() {
    var availabilityDetailedArray = this.getPath('occupancyView.availabilityDetailedArray'),
        availabilityArray = this.getPath('occupancyView.availabilityArray'),
        childViews = this.get('childViews'),
        len = childViews.get('length'), idx, label, content, height;
    for (idx=0; idx<len; ++idx) {
      label = childViews[idx];
      if (label) {
        content = availabilityDetailedArray[idx];
        content.push(availabilityArray[idx]);

        label.set('content', content);
        label.adjust(this.layoutForContentIndex(idx));
        label.displayDidChange();
      }
    }
  },

  _createChildViewForContentIndex: function(contentIndex, value) {
    var exampleView, layout, classNames = ['foo'];
    exampleView = this.get('exampleView');

    layout = this.layoutForContentIndex(contentIndex);
    this.appendChild(exampleView.create({
      classNames: classNames,
      layout: layout,
      content: value
    }));
  }

});