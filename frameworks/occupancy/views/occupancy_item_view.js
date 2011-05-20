// ==========================================================================
// Project:   BBA.OccupancyItemView
// Copyright: ©2011 Blueberry.cz Apps s.r.o.
// ==========================================================================
/*globals BBA */

/** @class

  @extends SC.View
*/
BBA.OccupancyItemView = SC.View.extend(
/** @scope BBA.OccupancyItemView.prototype */ {

  classNames: 'occupancy-item-view'.w(),

  displayProperties: 'content content.status titleKey'.w(),

  content: null,

  titleKey: null,

  useOverlayAttributes: NO,

  // ..........................................................
  // CHILD VIEWS
  //

  childViews: "leftHandle rightHandle".w(),

  leftHandle: SC.View.design({
    classNames: 'occupancy-item-handle-view'.w(),
    layout: { top: 0, left: 0, bottom: 0, width: 5 },
    mouseDown: function(evt) {
      var pv = this.get('parentView');
      if (pv) return pv.mouseDownInHandle(evt, 'left');
    }
  }),

  rightHandle: SC.View.design({
    classNames: 'occupancy-item-handle-view'.w(),
    layout: { top: 0, right: 0, bottom: 0, width: 5 },
    mouseDown: function(evt) {
      var pv = this.get('parentView');
      if (pv) return pv.mouseDownInHandle(evt, 'right');
    }
  }),

  // ..........................................................
  // SUBCLASS METHODS
  //

  render: function(context) {
    sc_super();
    context = context.begin('div').addClass('outline');
    context.push(this._contentTitle());
    context.end();
  },

  // ..........................................................
  // PROPERTIES
  //

  /** @field
    Occupancy item should only be displayed when it is not
    canceled.

    @type Boolean
  */
  isVisible: function() {
    var content = this.get('content');
    if (!content) return YES;
    else return !content.get('isCanceled');
  }.property('content').cacheable(),

  isBusy: function() {
    var content = this.get('content');
    return content && !!(content.get('status') & SC.Record.BUSY);
  }.property('content'),

  // ..........................................................
  // EVENT METHODS
  //

  /**
    Mouse down handler for left and right handles.
  */
  mouseDownInHandle: function(evt, rightOrLeft) {
    var responder = this.getPath('pane.rootResponder');
    if (!responder) return NO;
    // we're not the source view of the mouseDown, so we need to capture events manually to receive them
    responder.dragDidStart(this) ;
    this._initProposedAttributes();
    this._lastX = evt.pageX;
    if (rightOrLeft == 'left') this._isLeftHandleEvent = YES;
    else this._isRightHandleEvent = YES;
    return YES;
  },

  /**
    Mouse dragging handler for right/left handles. Moves
    reservation beginning or end.
  */
  mouseDraggedInHandle: function(evt) {
    var gridView, pointInGrid, date, date;
    gridView = this.get('owner');
    pointInGrid = gridView.convertFrameFromView({ x: evt.pageX, y: evt.pageY });
    date = gridView._dateTimeForLeftOffset(pointInGrid.x);
    if (this._isRightHandleEvent) {
      period = gridView._alignPeriod(null, date);
      this._setProposedAttribute('endsAt', period.get('end'));
    } else {
      period = gridView._alignPeriod(date, null);
      this._setProposedAttribute('beginsAt', period.get('start'));
    }
    if (this._validateProposedAttributes()) {
      this._updateLayout();
    }
    return YES;
  },

  /**
    Mouse up handler for right/left handles.
  */
  mouseUpInHandle: function(evt) {
    this._lastX = null;
    this._isLeftHandleEvent = NO;
    this._isRightHandleEvent = NO;
    this._writeValidatedAttributes();
  },

  mouseDown: function(evt) {
    if (this.get('isBusy')) evt.stop();
    this._initProposedAttributes();
    this._pointInItem = this.convertFrameFromView({ x: evt.pageX, y: evt.pageY });;
    this._reservationBeginHour = this.getPath('content.beginsAt').get('hour');
    return YES;
  },

  mouseDragged: function(evt) {
    if (this.get('isBusy')) {
      evt.stop();
    } else if (this._isRightHandleEvent || this._isLeftHandleEvent) {
      this.mouseDraggedInHandle(evt);
    } else {
      var gridView, gridPoint, itemPoint, msOffset, content,
          beginsAt, length, reservable;

      gridView = this.get('owner');
      gridPoint = gridView.convertFrameFromView({ x: evt.pageX, y: evt.pageY });
      content = this.get('content');
      length = content.getPath('period.lengthInHours');
      beginsAt = gridView._dateTimeForLeftOffset(gridPoint.x - this._pointInItem.x);
      beginsAt = beginsAt.adjust({ hour: this._reservationBeginHour });
      reservable = gridView._reservableForTopOffset(gridPoint.y);

      if (reservable) this._setProposedAttribute('reservableId', reservable.get('id'));
      this._setProposedAttribute('beginsAt', beginsAt);
      this._setProposedAttribute('endsAt', beginsAt.advance({ hour: length }));

      if (this._validateProposedAttributes()) {
        this._updateLayout();
      }

      this._itemDragged = YES;
    }
    return YES;
  },

  mouseUp: function(evt) {
    if (this.get('isBusy')) {
      evt.stop();
    } else if (this._isRightHandleEvent || this._isLeftHandleEvent) {
      this.mouseUpInHandle(evt);
    } else if (this._itemDragged) {
      this._writeValidatedAttributes();
      this._itemDragged = NO;
      this._pointInItem = null;
      this._reservationBeginHour = null;
    } else {
      var occupancyView = this.getPath('owner.occupancyView'),
          action = occupancyView.get('reservationAction'),
          target = occupancyView.get('reservationTarget'),
          rootResponder = this.getPath('pane.rootResponder');
      if (action && rootResponder) {
        rootResponder.sendAction(action, target, this, this.get('pane'));
      }
    }
    return YES;
  },

  // ..........................................................
  // PRIVATE METHODS
  //

  /** @private
    Returns a title from content. Uses `titleKey` if is set,
    otherwise converts content itself to string.

    @returns {String} A title.
  */
  _contentTitle: function() {
    var content = this.get('content');
    if (content) {
      return content.toString();
    } else {
      return sc_super();
    }
  },

  /** @private */
  _initProposedAttributes: function() {
    this._proposedAttributes = SC.Object.create({
      content: this.get('content')
    });
  },

  /** @private */
  _setProposedAttribute: function(key, value) {
    this._proposedAttributes.set(key, value);
    this.get('owner').notifyPropertyChange('content');
  },

  /** @private */
  _validateProposedAttributes: function() {
    var del = this.getPath('owner.delegate');
    if (del && del.validateProposedChange) {
      return del.validateProposedChange(this.get('content'),
                                        this._proposedAttributes);
    }
  },

  /** @private */
  _updateLayout: function() {
    var content = this.get('content'),
        layout = this.get('owner')._layoutForContentItemWithOverlay(content, this);
    this.adjust(layout);
    this._validatedAttributes = SC.Object.create({
      content: this.get('content'),
      beginsAt: this._proposedAttributes.beginsAt,
      endsAt: this._proposedAttributes.endsAt,
      reservableId: this._proposedAttributes.reservableId
    });
  },

  /** @private */
  _writeValidatedAttributes: function() {
    var content = this.get('content'),
        del = this.getPath('owner.delegate'),
        validatedAttributes = this._validatedAttributes,
        writtenAnything = NO;
    if (!validatedAttributes) return;
    content.beginPropertyChanges();
    if (!SC.empty(validatedAttributes.beginsAt)) {
      content.set('beginsAt', validatedAttributes.beginsAt);
      writtenAnything = YES;
    }
    if (!SC.empty(validatedAttributes.endsAt)) {
      content.set('endsAt', validatedAttributes.endsAt);
      writtenAnything = YES;
    }
    if (!SC.empty(validatedAttributes.reservableId)) {
      content.set('reservableId', validatedAttributes.reservableId);
      writtenAnything = YES;
    }
    content.endPropertyChanges();
    if (writtenAnything && del && del.reservationChanged) {
      del.reservationChanged(content);
    }
    this._validatedAttributes = null;
  }

});