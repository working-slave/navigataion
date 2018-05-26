(function(ns) {
  'user strict';

  var NavigationManager = function(scope) {
    this._scope = scope;
    this._identifier = this._scope['identifier'];
    this._viewName = this._scope['viewName'];
    // this._selectCallback = this._scope['_selectCallback'].bind(this._scope);
    this._defaultUpAction = this._scope['_defaultUpAction'].bind(this._scope);
    this._defaultDownAction = this._scope['_defaultDownAction'].bind(this._scope);
    this._defaultLeftAction = this._scope['_defaultLeftAction'].bind(this._scope);
    this._defaultRightAction = this._scope['_defaultRightAction'].bind(this._scope);
    this._defaultEnterAction = this._scope['_defaultEnterAction'].bind(this._scope);

    
    this._selectCallbackCollection = this._scope['_selectCallbacks'];
    this._unselectCallbackCollection = this._scope['_unselectCallbacks'];

    _initializeSelectCallback.call(this);
    _initializeUnselectCallback.call(this);



    this._$navigationView = $('#' + this._identifier);
    this._$selectedGroup = null;

    function _initializeUnselectCallback() {
      var scope = this._scope;
      _.each(this._unselectCallbackCollection, function(action, selector) {
        $(selector).on('unselect', function() {
          action.call(scope);
        })
      })
    }

    function _initializeSelectCallback() {
      var scope = this._scope;
      _.each(this._selectCallbackCollection, function(action, selector) {
        $(selector).on('select', function(event, keyPress) {
          action.call(scope, keyPress);
        })
      })
    }
    
  }

  NavigationManager.prototype = {
    selectGroup: function(group, wrapper, itemIndex, keyPress) {
      var maxTry = 20;
      var $groupToBeUnselect = this._$selectedGroup;

      var $newSelectedGroup = null;
      if (!group) {
        $newSelectedGroup = $(this._$navigationView.find('.' + 'group')[0]);
      } else if (group === 'current') {
        $newSelectedGroup = this._$selectedGroup;
      } else if (group === 'next') {
        $newSelectedGroup  = this._$selectedGroup;
        do {
          $newSelectedGroup = $newSelectedGroup.next();
          maxTry -= 1;
          if (maxTry <= 0) {$.fn.debugLog('Maximum Tried Reached: ', maxTry)}
        } while (!$newSelectedGroup.hasClass('group') && maxTry > 0);
      } else if (group === 'prev') {
        $newSelectedGroup  = this._$selectedGroup;
        do {
          $newSelectedGroup = $newSelectedGroup.prev();
          maxTry -= 1;
          if (maxTry <= 0) {$.fn.debugLog('Maximum Tried Reached: ', maxTry)}
        } while (!$newSelectedGroup.hasClass('group') && maxTry > 0);
      } else {
        $newSelectedGroup = this._$navigationView.find('.' + group + '.group');
      }
      if ($newSelectedGroup.length === 0) {
        $.fn.debugLog('[] No selected group');
        return false;
      } else if ($newSelectedGroup.length > 1) {
        $.fn.debugLog('[] selected group name duplicated');
        return false
      }

      if (this._$selectedGroup) {
        this._$selectedGroup.removeClass('selected');
      }

      this._$selectedGroup = this._scope['_$selectedGroup'] = $newSelectedGroup;
      
      this._$groupToBeUnselect = $groupToBeUnselect || [];
      this._$selectedGroup.addClass('selected');

      this._selectWrapper(wrapper);
      this._$selectableItems = this._$selectedWrapper.find('.selectable');

      if (this._$selectedWrapper.data('translate-type')) {
        this._translatable = true;
        this._translateType = this._$selectedWrapper.data('translate-type');
      }
      
      
      this._selectableItemUBound = this._$selectableItems.length - 1;
      this._selectableItemLBound = 0;
      if (isNaN(itemIndex)) {
        switch (itemIndex) {
          case 'last':
            this._selectedItemIndex = this._$selectableItems.length -1;
            break;
          default:
            this._selectedItemIndex = 0;
            break;
        }
      } else {
      this._selectedItemIndex = itemIndex;
      }
      this._selectItem(this._selectedItemIndex, keyPress);
    },

    _selectWrapper: function (wrapper) {
      var maxTry = 20;
      this._translatable = false; // reset translatable every time you focus a wrapper
      var $wrapperToBeUnselect = this._$selectedWrapper;
  
      var $newWrapper = null;
      if (!wrapper) { // default get the first wrapper
        $newWrapper = $(this._$selectedGroup.find('.wrapper')[0]);
      } else if (wrapper === 'current') {
        $newWrapper = this._$selectedWrapper;
      } else if (wrapper === 'next') {
        $newWrapper  = this._$selectedWrapper;
        do {
          maxTry -= 1;
          if (maxTry <= 0) {console.log('Maximum Tried Reached: ', maxTry)}
          $newWrapper = $newWrapper.next();
        } while (!$newWrapper.hasClass('wrapper') && maxTry > 0);
      } else if (wrapper === 'prev') {
        $newWrapper  = this._$selectedWrapper;
        do {
          maxTry -= 1;
          if (maxTry <= 0) {console.log('Maximum Tried Reached: ', maxTry)}
          $newWrapper = $newWrapper.prev();
        } while (!$newWrapper.hasClass('wrapper')  && maxTry > 0);
      } else {
        $newWrapper = this._$selectedGroup.find('.' + wrapper);
      }

      if ($newWrapper.length === 0) {
        $.fn.debugLog('[] No selected wrapper');
        return false;
      } else if ($newWrapper.length > 1) {
        $.fn.debugLog('[] Selected wrapper name duplicated');
        return false
      }

      if (this._$selectedWrapper) {
        this._$selectedWrapper.removeClass('selected');
      }

      this._$selectedWrapper = this._scope['_$selectedWrapper'] = $newWrapper;
      this._$wrapperToBeUnselect = $wrapperToBeUnselect || [];
      this._$selectedWrapper.addClass('selected');
      return true;
    },

    _selectItem: function (index, keyPress) {
      var translateSuccess = true;
      var $newItem = null;

      var selector = "[data-index='" + index + "']";

      var hasSelectedItem = this._$selectedWrapper.find('.selected').length !== 0 ? true : false;
      console.log('Translatable: ', this._translatable);
      if(this._translatable && hasSelectedItem) {
        var translateId = this._$selectedWrapper.data('translate-id');
        var translator = this._translatorCollection[translateId]['translator'];
        translateSuccess = this[translator].translate({
          content: this._$navigationView.find('[data-translator="' + translator + '"]'),
          direction: keyPress || null,
          itemClass: 'selected'
        })
      }

      

      if (translateSuccess) {
        if (this._$selectedItem) {
          console.log('Selected item: ', this._$selectedItem);
          this._triggerUnselectCallback();
          this._$selectedItem.removeClass('selected');
        }

        $newItem = this._$selectedWrapper.find(selector);

        if ($newItem.length === 0) {
          $.fn.debugLog('[] No selected wrapper');
        } else if ($newItem.length > 1) {
          $.fn.debugLog('[] Selected wrapper name duplicated');
        }
        this._$selectedItem = this._scope['_$selectedItem'] = $newItem;
        if (this._$selectedItem.hasClass('skip')) {
          if (index === this._selectableItemUBound) {
            this._selectedItemIndex += 1;
          } else if (index === this._selectableItemUBound) {
            this._selectedItemIndex -= 1;
          } else {
            if (keyPress === 'UP' || keyPress === 'LEFT') {
              this._selectedItemIndex -= 1;
            }
            if (keyPress === 'DOWN' || keyPress === 'RIGHT') {
              this._selectedItemIndex += 1;
            }
            this._selectItem(this._selectedItemIndex, keyPress);
          }
        }
        this._$selectedItem.addClass('selected');
        this._$groupToBeUnselect = this._$selectedGroup;
        this._$wrapperToBeUnselect = this._$selectedWrapper;
        // selectCallBack()
        this._triggerSelectCallback(keyPress);
      }

      return true;
    },

    clearSelected: function() {
      if (this._$selectedItem) {
        this._$selectedGroup.removeClass('selected');
        this._$selectedWrapper.removeClass('selected');
        this._$selectedItem.removeClass('selected');
        this._$selectedGroup = this._$selectedWrapper = this._$selectedItem = null;
        this._scope['_$selectedGroup'] = this._scope['_$selectedWrapper'] = this._scope['_$selectedItem'] = null;
      }
    },

    upButtonClick: function() {
      if (!this._$selectedGroup) {
        return this._defaultUpAction();
      }
      var navigation = {'UP': this._getNavigationDetails() ? this._getNavigationDetails().up : null};
      this._takeAction(navigation);
    },

    downButtonClick: function() {
      if (!this._$selectedGroup) {
        return this._defaultDownAction();
      }
      var navigationData = {'DOWN': this._getNavigationDetails() ? this._getNavigationDetails().down : null};
      this._takeAction(navigationData);
    },

    leftButtonClick: function() {
      if (!this._$selectedGroup) {
        return this._defaultLeftAction();
      }
      var navigationData = {'LEFT': this._getNavigationDetails() ? this._getNavigationDetails().left : null};
      this._takeAction(navigationData);
    },

    rightButtonClick: function() {
      if (!this._$selectedGroup) {
        return this._defaultRightAction();
      }
      var navigationData = {'RIGHT': this._getNavigationDetails() ? this._getNavigationDetails().right : null};
      this._takeAction(navigationData);
    },

    enterButtonClick: function() {
      if (!this._$selectedGroup) {
        return this._defaultEnterAction();
      }

      this._handleInputFocus();

      var navigationData = {'ENTER': this._getNavigationDetails() ? this._getNavigationDetails().enter : null};
      this._takeAction(navigationData);
    },

    _getNavigationDetails: function() {
      if (this._$selectedItem.data('navigation')) {
        return typeof this._$selectedItem.data('navigation') === 'object' ?
                      this._$selectedItem.data('navigation'):
                      JSON.parse(this._$selectedItem.data('navigation'));
      }
    },

    _handleInputFocus: function() {
      if (this._$selectedItem.find('input').length === 1) {
        var input = this._$selectedItem.find('input');
        if (input.attr('type') !== 'checkbox' && input.attr('type') !== 'radio' && !input.prop('disabled')) {
          input.blur();
          input.focus();
          this._$navigationView.addClass('shift');
        }
      }
    },

    _triggerSelectCallback: function(keyPress) {
      // this._$selectedGroup.trigger('select');
      // this._$selectedWrapper.trigger('select');
      this._$selectedItem.trigger('select', keyPress);
    },

    _triggerUnselectCallback: function() {
      if (this._$selectedGroup[0] !== this._$groupToBeUnselect[0] && this._$groupToBeUnselect[0]) {
        this._$groupToBeUnselect.trigger('unselect');
      }

      if (this._$selectedWrapper[0] !== this._$wrapperToBeUnselect[0] && this._$wrapperToBeUnselect[0]) {
      } 
    },

    _takeAction: function(navigationData) {
      var keyPress = _.keys(navigationData)[0];
      var navigation = _.values(navigationData)[0];
      if (navigation && navigation.view) {
        var view = navigation.view;
        ns.viewManager.gotoView(view, {from: this._viewName});
        return
      } else if (navigation && navigation.action) {
        var action = navigation.action;
        var param = navigation.param || [];
        if (action === '_preventNavigation') {
          return
        }
        this._scope[action].apply(this._scope, param);
        return
      } else if (navigation) {
        var group = navigation.group || null;
        var wrapper = navigation.wrapper || null;
        var itemIndex = navigation.itemIndex || 0;
        this.selectGroup(group, wrapper, itemIndex, keyPress);
        return
      }

      if (keyPress !== "ENTER") {
        this._getSelectedItemIndex(keyPress);
        this._selectItem(this._selectedItemIndex, keyPress);
      }
    },

    _getSelectedItemIndex: function (direction) {
      if (this._translateType) {
        switch (this._translateType) {
          case 'row-irregular':
          case 'column-irregular':
            this._getNonCircularTypeIndex(direction);
            break;
          case 'circular': 
            this._getCircularTypeIndex(direction);
            break;
          default:
            break;
        }
      } else {
        this._getNonCircularTypeIndex(direction);
      }
    },

    _getNonCircularTypeIndex: function(direction) {
      switch(direction) {
        case 'LEFT':
        case 'UP':
          this._selectedItemIndex = this._selectedItemIndex === this._selectableItemLBound ?  this._selectableItemLBound : this._selectedItemIndex - 1;
          break;
        case 'RIGHT':
        case 'DOWN':
          this._selectedItemIndex = this._selectedItemIndex === this._selectableItemUBound ?  this._selectableItemUBound : this._selectedItemIndex + 1;
          break;
        default:
        $.fn.debugLog('[Channel] Unexpected Error in _getSelectableItemIndex');
      }
    },

    _getCircularTypeIndex: function(direction) {
      switch(direction) {
        case 'LEFT':
        case 'UP':
          this._selectedItemIndex -= 1;
          this._selectedItemIndex = this._selectedItemIndex === this._selectableItemLBound - 1 ?  this._selectableItemUBound : this._selectedItemIndex;
          break;
        case 'RIGHT':
        case 'DOWN':
        this._selectedItemIndex += 1;
          this._selectedItemIndex = this._selectedItemIndex === this._selectableItemUBound + 1 ?  this._selectableItemLBound : this._selectedItemIndex;
          break;
        default:
        $.fn.debugLog('[Channel] Unexpected Error in _getSelecctableItemIndex');
      }
    },

    initGeneralTranslator: function() {
      this._translatorCollection = {};
      var translatables= this._$navigationView.find('[data-translate-id]');
      var that = this;
      _.each(translatables, function(ele, index) {
        var translator = null;
        if ($(ele).find('[data-translator]').length === 1) {
          translator = $(ele).find('[data-translator]').data('translator');
        } else if ($(ele).siblings('[data-translator]').length === 1) {
          translator = $(ele).siblings('[data-translator]').data('translator');
        }
        that[translator] = new Translator({
          type: $(ele).data('translate-type')
        })

        that._translatorCollection[$(ele).data('translate-id')] = {
          translator: translator,
          type: $(ele).data('translate-type')
        }
      })
      console.log('TranslateCollection: ', that._translatorCollection);
    }
  }
  ns.NavigationManager = NavigationManager;
})(window.hermesNamespace)