const {
  UPDATE_SHORTCUTS,
  UPDATE_SHORTCUTS_REPLY,
  GET_SHORTCUTS_REPLY,
} = require('../util/IPC_Messages');

window.shortcutsScriptloaded = true;
window.SHORTCUTSCHANGED = false;

let pressedKeys = new Set();

function Initialize() {
  $('#shortcutsettingsDivid input[type=text]').prop(
    'placeholder',
    'Press new keys..',
  );
  $('#shortcutsettingsDivid input[type=text]').on('blur', function () {
    let value = $(this).attr('current-value');
    if (value) {
      $(this).val(value);
    } else {
      $(this).val('');
    }
    pressedKeys.clear();
  });

  $('#shortcutsettingsDivid input[type=text]').on('focus', function () {
    $(this).attr('current-value', $(this).val());
    $(this).val('');

    pressedKeys.clear();
  });

  $('#shortcutsettingsDivid input[type=text]').keyup(function (e) {
    let defaultvalue = $(this).attr('default');
    let shortcutId = $(this).attr('shortcut-id');
    let elements = Array.from(pressedKeys);
    if (elements.length > 0) {
      if (pressedKeys.has('Control')) {
        let index = elements.indexOf('Control');
        elements[index] = 'ctrl';
      }
      let newValue = elements.join('+').toLowerCase();

      if (newValue) {
        $(this).val(newValue);
      }

      if (newValue !== defaultvalue) {
        let data = {
          id: shortcutId,
          value: newValue,
        };
        $(this).attr('default', newValue);
        $(this).attr('current-value', newValue);
        updateShortcuts(data);
        window.SHORTCUTSCHANGED = true;
      }
    } else {
      $(this).val(defaultvalue);
    }
    $(this).blur();
  });

  $('#shortcutsettingsDivid input[type=text]').keydown(function (e) {
    e.preventDefault();
    if (!pressedKeys.has(e.key)) {
      pressedKeys.add(e.key);
    }
  });
}

/**
 *
 * @param {shortcut id} id
 * @param {Shortcut} value
 */
function updateShortcuts(data) {
  ipcRenderer.send(UPDATE_SHORTCUTS, JSON.stringify(data));
}

async function initShortcuts(shortcuts) {
  if (shortcuts != undefined && shortcuts.length > 0) {
    shortcuts
      .filter((element) => element.name !== 'Open Fast settle')
      .forEach((element) => {
        if (element.id === 4) {
          element.value =
            process.platform === 'darwin' ? 'command+g' : 'ctrl+g';
        }

        let div = $('<div>', {
          class: 'd-flex align-items-center bordered-div',
        });

        let shortcuttitle = element.name;

        if ($.i18n) {
          shortcuttitle = String(shortcuttitle)
            .replace(/\s|_|-|\/|\(|\)+/g, '')
            .toLowerCase();

          shortcuttitle = $.i18n.t(`settingScreen.Shortcuts.${shortcuttitle}`);
        }

        let shortcutLabel = $('<label>', {
          class: 'shortcutsName',
          html: shortcuttitle + ' :',
        });

        let shortcutLabelInput = $('<input>', {
          type: 'text',
          'shortcut-id': element.id,
          default: element.value,
          value: element.value,
        });

        div.append(shortcutLabel);
        div.append(shortcutLabelInput);

        $('#shortcutsContainerid').append(div);
      });
  }

  Initialize();
}

ipcRenderer.on(GET_SHORTCUTS_REPLY, (event, content) => {
  if (content) {
    try {
      let data = JSON.parse(content);
      if (data != undefined && data.shortcuts != undefined)
        initShortcuts(data.shortcuts);
    } catch (error) {
      console.log(error);
    }
  }
});
