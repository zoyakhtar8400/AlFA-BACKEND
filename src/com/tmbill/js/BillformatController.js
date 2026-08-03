const { updateSettings } = require('../renderer/helper/Settings.helper');
const { KOT_FORMAT_ELEMENTS } = require('../util/BillformatUtils');
const { PRINTERS_IPC } = require('../util/IPC_Messages');
const {
  KOT_FORMAT_SETTINGS,
  BILL_FORMAT_SETTING,
  KOT_PRINT_VIEW,
} = require('../util/SettingIDs');
const { initializei18nforKotformatswindowui } = require('./i18nController');
window.billformattingscriptLoaded = true;
let currentkotElementstyles = undefined;

function initialize() {
  //Get KOT Div data
  _.forIn(KOT_FORMAT_ELEMENTS, function (value, key) {
    $('<option>')
      .val(value.id)
      .text(value.name)
      .attr('key', key)
      .data(value)
      .appendTo('#kotformatelementsList');
  });

  $('#updateelementStyleid').on('click', updateElementstyle);
  $('#viewstylesbutton')
    // .hide()
    .on('click', showCurrentstyles);

  if (window.settingsConfig[KOT_FORMAT_SETTINGS - 1] != undefined) {
    currentkotElementstyles =
      window.settingsConfig[KOT_FORMAT_SETTINGS - 1].value;
    if (currentkotElementstyles) {
      try {
        currentkotElementstyles = JSON.parse(currentkotElementstyles);
      } catch (error) {}
    }
  }

  $('#disablekotstylesbutton').on('click', () => {
    if (currentkotElementstyles && currentkotElementstyles.status) {
      currentkotElementstyles.status = 0;
      sendUpdaterequest(
        KOT_FORMAT_SETTINGS,
        JSON.stringify(currentkotElementstyles),
      );
    } else {
      sendUpdaterequest(KOT_FORMAT_SETTINGS, '');
    }
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:billFormatController.stylesDisabled'),
    );
  });

  $('#resetkotstylesbutton').on('click', () => {
    currentkotElementstyles = undefined;
    sendUpdaterequest(KOT_FORMAT_SETTINGS, '');
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:billFormatController.stylesResetted'),
    );
  });
  $('#openformatPreviewbutton').on('click', testkotPrint);
  $('#kot-selection-preview-id img[kot-format]').on(
    'click',
    updateSelectedkotformat,
  );

  $('#kotformatelementsList').on('change', function () {
    $('#kotformatelementpaperSizeid').prop('selectedIndex', 0);
    $('#kotformatelementSizeid').val('');
    $('select#kotformatelementFontstyleid').prop('selectedIndex', 0);
  });
  $('#kotformatelementpaperSizeid').on('change', setStylesforselected);

  if ($.i18n) {
    initializei18nforKotformatswindowui();
  } else {
    setTimeout(initializei18nforKotformatswindowui, 400);
  }
}

async function updateSelectedkotformat() {
  $(`#kot-selection-preview-id img[kot-format]`).removeClass('selectedFormat');
  $(this).addClass('selectedFormat');
  let currentFormat = $(this).attr('kot-format');
  sendUpdaterequest(KOT_PRINT_VIEW, currentFormat);
  try {
    window.currentkotPrintview = Number(currentFormat);
  } catch (error) {
    window.currentkotPrintview = 1;
  }
}

async function testkotPrint() {
  let previewDetails = {
    kot_number: 9999,
    note: 'This is a test note.',
    order_id: window.generateId(),
    tableName: 'Test Table',
    username: window.storeDetails.user_id,
    showStorenamonkot: window.storeDetails.store_name,
    items: [
      {
        title: 'Test item 1',
        quantity: 1,
        oldTitle: 'Test item 1',
        addons: [{ title: 'Test item addon 1' }],
      },
      {
        title: 'Test item 2',
        quantity: 2,
        oldTitle: 'Test item 2',
        addons: [
          { title: 'Test item addon 2' },
          { title: 'Test item addon 3' },
        ],
      },
      {
        title: 'Test item 3',
        quantity: 3,
        oldTitle: 'Test item 3',
        addons: [
          { title: 'Test item addon 4' },
          { title: 'Test item addon 5' },
          { title: 'Test item addon 6' },
        ],
      },
    ],
  };
  let pageConfig = await setPageconfigifany_fromremote('dineintabId');
  if (pageConfig && pageConfig.margins) {
    previewDetails.pageConfig = pageConfig;
    pageconfigProvided = true;
  } else {
    pageconfigProvided = false;
  }

  if (previewDetails) {
    if (window.kotpreviewscriptLoaded == true) {
      $('#kotpreviewBodyid').data('data', previewDetails);
      await showkotPreview();
    } else {
      $('#kotpreviewBodyid').data('data', previewDetails);
    }

    printData = {
      content: $('#kotpreviewBodyid').html(),
      deviceName: '',
      silent: true,
      type: 1,
      forKOTPrint: true,
      styles: JSON.stringify(currentkotElementstyles),
    };
    betteripcRenderer.callMain(PRINTERS_IPC.PRINT_WINDOW_AYNC, printData);
  }
}

function setStylesforselected() {
  let selection = $('#kotformatelementsList option:selected:not([disabled])');
  if (selection.length == 0) {
    $('#kotformatelementpaperSizeid').prop('selectedIndex', 0);
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:billFormatController.selectElement'),
    );
    return;
  }
  let currentSize = this.value;
  if (currentkotElementstyles) {
    let elementKey = _.findKey(currentkotElementstyles, {
      id: $(selection).attr('value'),
    });
    if (elementKey) {
      let styles = currentkotElementstyles[elementKey][currentSize];
      if (styles) {
        // console.log(styles);
        let fontSize = styles['font-size'];
        if (fontSize) {
          try {
            fontSize = parseFloat(fontSize);
            $('#kotformatelementSizeid').val(fontSize);
          } catch (error) {}
        }
        let fontStyle = styles['font-style'];
        if (fontStyle) {
          $(`#kotformatelementFontstyleid option[value=${fontStyle}]`).prop(
            'selected',
            true,
          );
        }
      }
    }
  }
}

function updateElementstyle() {
  let selection = $('#kotformatelementsList option:selected:not([disabled])');
  if (selection.length == 0)
    return window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:billFormatController.selectElement'),
    );

  let paperSize = $(
    '#kotformatelementpaperSizeid option:selected:not([disabled])',
  );
  if (paperSize.length == 0)
    return window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:billFormatController.selectSize'),
    );

  let currentElementid = $(selection).attr('value');
  let currentElementinfo = $(selection).data();
  // console.log(currentElementinfo);

  let key = $(selection).attr('key');

  let css = {};
  let size = $('#kotformatelementSizeid').val();
  if (size) {
    if (size.length > 5) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:billFormatNotifications.SizelengthshouldbelessthanFivedigit',
        ),
      );
      return;
    }

    if (isNaN(size)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:allreportsnotifications.Pleaseentervalidsizenumber',
        ),
      );
      return;
    }
  }
  if (size) {
    try {
      size = Number(size);
      css['font-size'] = `${size}px`;
    } catch (error) {}
  }
  let fontStyleelement = $(
    '#kotformatelementFontstyleid option:selected:not([disabled])',
  );
  if (fontStyleelement.length > 0) {
    let fontStyle = $(fontStyleelement).attr('value');
    css['font-style'] = fontStyle;
    if (currentElementinfo.addfontWeight) {
      let fontWeight = $(fontStyleelement).attr('font-weight');
      css['font-weight'] = fontWeight;
      // if (fontStyle == 'bold') {
      //     css['font-style'] = 'normal';
      // }
    }
  }

  paperSize = $(paperSize).attr('value');
  let elementStyle = {};
  elementStyle[key] = {
    id: currentElementid,
    [paperSize]: css,
  };
  if (currentkotElementstyles) {
    let elementKey = _.findKey(currentkotElementstyles, {
      id: currentElementid,
    });
    if (elementKey) {
      currentkotElementstyles[elementKey];
      currentkotElementstyles[elementKey][paperSize] =
        elementStyle[key][paperSize];
    } else {
      currentkotElementstyles = _.assign(currentkotElementstyles, elementStyle);
    }
  } else {
    currentkotElementstyles = elementStyle;
  }

  // console.log(currentkotElementstyles);

  if (currentkotElementstyles) {
    currentkotElementstyles.status = 1;
    let value = JSON.stringify(currentkotElementstyles);
    sendUpdaterequest(KOT_FORMAT_SETTINGS, value);
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:billFormatController.styleUpdated'),
    );

    $('#kotformatelementSizeid').val('');
    $('select#kotformatelementsList').prop('selectedIndex', 0);
    $('select#kotformatelementFontstyleid').prop('selectedIndex', 0);
    $('select#kotformatelementpaperSizeid').prop('selectedIndex', 0);
  }
}

function sendUpdaterequest(id, value) {
  let data = { id, value };
  updateSettings(data);
  if (window.settingsConfig && window.settingsConfig.length > 0) {
    if (
      window.settingsConfig[id - 1] != undefined &&
      window.settingsConfig[id - 1].id == id
    ) {
      window.settingsConfig[id - 1].value = value;
    }
  }
  window.notifyUser.showMessage(
    'success',
    $.i18n.t('controller:billFormatController.Updated'),
  );
}

async function showCurrentstyles() {
  if (currentkotElementstyles) {
    let tempStyles = JSON.parse(JSON.stringify(currentkotElementstyles));

    if (tempStyles.status != undefined) delete tempStyles.status;
    let tempFormatwrapper = $('<div>', {
      class: 'temp-format-preview-wrapper',
    });
    let titlesRow = $('<div>', {
      class: 'row temp-format-title-wrapper bordered-div',
    });
    let elementTitle = $('<div>', {
      class: 'col-sm-4 temp-format-title-wrapper',
      html: 'Element',
    });
    let elementStyle1 = $('<div>', {
      class: 'col-sm-4 temp-format-title-wrapper',
      html: '80mm Styles',
    });
    let elementStyle2 = $('<div>', {
      class: 'col-sm-4 temp-format-title-wrapper',
      html: '58mm Styles',
    });
    titlesRow.append(elementTitle);
    titlesRow.append(elementStyle1);
    titlesRow.append(elementStyle2);
    tempFormatwrapper.append(titlesRow);
    _.forIn(tempStyles, function (value, key) {
      let container = $('<div>', {
        class: 'row temp-format-container bordered-div',
      });
      let title = $('<div>', {
        class: 'col-sm-4 temp-format-container-item',
        html: KOT_FORMAT_ELEMENTS[key].name,
      });
      let styles80 = $('<div>', {
        class: 'col-sm-4 temp-format-container-item',
        html: '&nbsp',
      });
      if (value.css_80mm) {
        let styles80data = $('<code>');
        styles80.append('<br/>');
        if (value.css_80mm['font-size']) {
          styles80data.append(`Size:${value.css_80mm['font-size']}`);
        }
        if (value.css_80mm['font-style']) {
          styles80data.append('<br/>');
          styles80data.append(`Style:${value.css_80mm['font-style']}`);
        }
        styles80.html(styles80data);
      }

      let styles58 = $('<div>', {
        class: 'col-sm-4 temp-format-container-item',
        html: '&nbsp',
      });
      if (value.css_58mm) {
        styles58.append('<br/>');
        let styles58data = $('<code>');
        if (value.css_58mm['font-size']) {
          styles58data.append(`Size:${value.css_58mm['font-size']}`);
        }
        if (value.css_58mm['font-style']) {
          styles58data.append('<br/>');
          styles58data.append(`Style:${value.css_58mm['font-style']}`);
        }
        styles58.html(styles58data);
      }
      container.append(title);
      container.append(styles80);
      container.append(styles58);

      tempFormatwrapper.append(container);
    });

    await Swal.fire({
      title: 'Styles',
      html: tempFormatwrapper[0],
      customClass: {
        popup: 'tmbill-swal-pop-up',
        title: 'tmbill-swal-title-class',
        content: 'tmbill-swal-title-class',
      },
    });
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:billFormatController.noStylesAppliedYet'),
    );
  }
}
initialize();
