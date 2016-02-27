(function ($) {

  var $window = $(window);

  Backdrop.behaviors.referencesDialog = {
    attach: function (context, settings) {
      // Add appropriate classes on all fields that should have it. This is
      // necessary since we don't actually know what markup we are dealing with.
      if (typeof settings.ReferencesDialog !== 'undefined') {
        $.each(settings.ReferencesDialog.fields, function (key, widget_settings) {
          $('.' + key + ' a.references-dialog-activate', context).click(function (e) {
            e.preventDefault();
            Backdrop.ReferencesDialog.open($(this).attr('href'), $(this).html());
            Backdrop.ReferencesDialog.entityIdReceived = function (entity_type, entity_id, label) {
              if (typeof widget_settings.format !== 'undefined') {
                var value = widget_settings.format
                  .replace('$label', label)
                  .replace('$entity_id', entity_id)
                  .replace('$entity_type', entity_type);
              }
              // If we have a callback path, let's invoke that.
              if (typeof widget_settings.callback_path !== 'undefined') {
                var entity_info = {
                  label: label,
                  entity_id: entity_id,
                  entity_type: entity_type
                };
                Backdrop.ReferencesDialog.invokeCallback(widget_settings.callback_path, entity_info, widget_settings.callback_settings);
              }
              // If we have a target, use that.
              else if (typeof widget_settings.target !== 'undefined') {
                var target = $('#' + widget_settings.target);
                target.val(value);
                target.change();
              }
              // If we have none of the above, we just insert the value in the item
              // that invoked this.
              else {
                var key_el = $('#' + key);
                key_el.val(value);
                key_el.change();
              }
            }
            return false;
          });
        });
      }
    }
  };

  /**
   * Our dialog object. Can be used to open a dialog to anywhere.
   */
  Backdrop.ReferencesDialog = {
    dialog_open: false,
    open_dialog: null
  }

  Backdrop.ReferencesDialog.invokeCallback = function (callback, entity_info, settings) {
    if (typeof settings == 'object') {
      entity_info.settings = settings;
    }
    $.post(callback, entity_info);
  }

  /**
   * If this property is set to be a function, it
   * will be called when an entity is recieved from an overlay.
   */
  Backdrop.ReferencesDialog.entityIdReceived = null;

  /**
   * Open a dialog window.
   * @param string href the link to point to.
   */
  Backdrop.ReferencesDialog.open = function (href, title) {
    if (!this.dialog_open) {
      // Add render references dialog, so that we know that we should be in a
      // dialog.
      href += (href.indexOf('?') > -1 ? '&' : '?') + 'render=references-dialog';
      // Get the current window size and do 75% of the width and 90% of the height.
      // @todo Add settings for this so that users can configure this by themselves.
      var window_width = $window.width() / 100*75;
      var window_height = $window.height() / 100*90;
      this.open_dialog = $('<iframe class="references-dialog-iframe" src="' + href + '"></iframe>').dialog({
        width: window_width,
        height: window_height,
        modal: true,
        resizable: false,
        position: ['center', 50],
        title: title,
        close: function (event, ui) {
          if (Backdrop.ReferencesDialog.dialog_open) {
            Backdrop.ReferencesDialog.dialog_open = false;
            Backdrop.ReferencesDialog.close();
          }
        }
      }).width(window_width-10).height(window_height);
      $window.bind('resize scroll', function () {
        // Move the dialog the main window moves.
        if (typeof Backdrop.ReferencesDialog == 'object' && Backdrop.ReferencesDialog.open_dialog != null) {
          Backdrop.ReferencesDialog.open_dialog.
            dialog('option', 'position', ['center', 10]);
          Backdrop.ReferencesDialog.setDimensions();
        }
      });
      this.dialog_open = true;
    }
  }

  /**
   * Set dimensions of the dialog dependning on the current winow size
   * and scroll position.
   */
  Backdrop.ReferencesDialog.setDimensions = function () {
    if (typeof Backdrop.ReferencesDialog == 'object') {
      var window_width = $window.width() / 100*75;
      var window_height = $window.height() / 100*90;
      this.open_dialog.
        dialog('option', 'width', window_width).
        dialog('option', 'height', window_height).
        width(window_width-10).height(window_height);
    }
  }

  /**
   * Close the dialog and provide an entity id and a title
   * that we can use in various ways.
   */
  Backdrop.ReferencesDialog.close = function (entity_type, entity_id, title) {
    if (this.dialog_open) {
      this.dialog_open = false;
      this.open_dialog.dialog('close');
      // Call our entityIdReceived function if we have one.
      // this is used as an event.
      if (typeof this.entityIdReceived == 'function') {
        this.entityIdReceived(entity_type, entity_id, title);
      }
    }
    this.open_dialog.dialog('destroy');
    this.open_dialog = null;
  }

}(jQuery));
