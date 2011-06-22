SC.DateTime.mixin({

  /*
    Compares SC.DateTime without timezone check.
  */
  compareDateWithoutTimeZone: function(a, b) {
    var ma = a.adjust({hour: 0}).get('milliseconds');
    var mb = b.adjust({hour: 0}).get('milliseconds');
    return ma < mb ? -1 : ma === mb ? 0 : 1;
  }

});


