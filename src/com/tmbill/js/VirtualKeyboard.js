const VirtualKeyboard = require('simple-keyboard');
const KeyboardLayouts = require('simple-keyboard-layouts').default;
const { KEYBOARD_LAYOUT_MAP } = require('../util/Constants');

const SimpleKeyboard = VirtualKeyboard.default;
let currentKeyboard;
let currentvirtualLayout;

const defaultTheme = 'hg-theme-default virtual-keyboard-theme';
const SAFE_ELEMENTS = ['text', 'number', 'password'];
let previousFocusedelement;

const numpadLayout = {
  numpad: [
    '{numpad1} {numpad2} {numpad3}',
    '{numpad4} {numpad5} {numpad6}',
    '{numpad7} {numpad8} {numpad9}',
    '{bksp} {numpad0} . {enter}',
  ],
};

function showKeyboard() {
  if (currentKeyboard) {
    const options = {
      theme: `${defaultTheme} show-keyboard`,
    };
    if (
      previousFocusedelement &&
      (previousFocusedelement.type === 'number' ||
        $(previousFocusedelement).hasClass('was-number-input') ||
        previousFocusedelement.className.includes('item-qty-editable-row') ||
        previousFocusedelement.className.includes('item-amount-editable-row') ||
        previousFocusedelement.className.includes(
          'passcode-access-input-class',
        ))
    ) {
      Object.assign(options, {
        layoutName: 'numpad',
        theme: `numpad-theme ${options.theme}`,
      });
    } else {
      Object.assign(options, {
        layoutName: 'default',
      });
    }
    let previousValue = '';
    if (SAFE_ELEMENTS.includes(previousFocusedelement.type)) {
      previousValue = $(previousFocusedelement).val();
    } else if (
      previousFocusedelement.nodeName == 'SPAN' &&
      (previousFocusedelement.className.includes('item-qty-editable-row') ||
        previousFocusedelement.className.includes('item-amount-editable-row'))
    ) {
      // previousValue = '';
      previousValue = $(previousFocusedelement).text();
    }
    currentKeyboard.setInput(previousValue);
    currentKeyboard.setOptions(options);

    setTimeout(() => {
      if (!$(`#simplekeyboardId`).is(':visible')) {
        currentKeyboard.setOptions(options);
      }
    }, 300);
  }
}

function hideKeyboard() {
  if (currentKeyboard) {
    // Revert any number inputs that were temporarily switched to text
    // $('input.was-number-input').each(function () {
    //   const val = $(this).val();
    //   // Clean up trailing dot before reverting to number type
    //   const cleanVal = val.endsWith('.') ? val.slice(0, -1) : val;
    //   console.log('cleanVal:', cleanVal);
    //   $(this).val(cleanVal);
    //   $(this).attr('type', 'number').removeClass('was-number-input');
    // });
    currentKeyboard.setOptions({
      theme: `${defaultTheme} hide-keyboard`,
    });
    currentKeyboard.clearInput();
  }
}

/**
 * Called upon key press on virtual keyboard
 * @param {input pressed} input
 */
function onChange(input) {
  if (previousFocusedelement) {
    if (SAFE_ELEMENTS.includes(previousFocusedelement.type)) {
      $(previousFocusedelement).val(input);
      $(previousFocusedelement).trigger('keyup');
      $(previousFocusedelement).trigger('change');
      $(previousFocusedelement).trigger('keydown');
    } else if (
      previousFocusedelement.nodeName == 'SPAN' &&
      (previousFocusedelement.className.includes('item-qty-editable-row') ||
        previousFocusedelement.className.includes('item-amount-editable-row'))
    ) {
      if (!$(previousFocusedelement).is(':focus')) {
        focusInputfield();
      }
      // $(previousFocusedelement).html(input);
      const parenttableId = $(previousFocusedelement).attr('parent_id');
      const parenttbleId = $(previousFocusedelement).attr('parentid');
      const itemsId = $(previousFocusedelement).attr('item_id');
      const itemId = $(previousFocusedelement).attr('itemId');
      if (parenttableId) {
        $(`#${parenttableId} tr .editable[item_id=${itemsId}]`).html(input);
        currentKeyboard.setInput(input);
      }
      if (parenttbleId) {
        $(`#${parenttbleId} tr .editablePrice[itemId=${itemId}]`).html(input);
        currentKeyboard.setInput(input);
      }
    }
  }
}

function focusInputfield() {
  try {
    if (previousFocusedelement) {
      const parenttableId = $(previousFocusedelement).attr('parent_id');
      const amountChangeParentId = $(previousFocusedelement).attr('parentid');
      const itemsId = $(previousFocusedelement).attr('item_id');
      const amountChangeitemId = $(previousFocusedelement).attr('itemId');
      if (parenttableId) {
        $(`#${parenttableId} tr .editable[item_id=${itemsId}]`).focus();
        document.execCommand('selectAll', false, null);
      }

      if (amountChangeParentId) {
        $(
          `#${amountChangeParentId} tr .editablePrice[item_id=${amountChangeitemId}]`,
        ).focus();
        document.execCommand('selectAll', false, null);
      }
      // document.execCommand('selectAll', false, null);
    }
  } catch (error) {
    console.log(error);
  }
}
// function onKeyPress(button) {
//   if (!previousFocusedelement) return;

//   // Only handle quantity editable field
//   if (
//     previousFocusedelement.nodeName === 'SPAN' &&
//     previousFocusedelement.className.includes('item-qty-editable-row')
//   ) {
//     let value = previousFocusedelement.textContent || '';

//     // numbers
//     if (/^\{numpad[0-9]\}$/.test(button)) {
//       const num = button.replace('{numpad', '').replace('}', '');
//       value += num;
//     }

//     // decimal
//     if (button === '.') {
//       if (!value.includes('.')) {
//         value += '.';
//       }
//     }

//     // backspace
//     if (button === '{bksp}') {
//       value = value.slice(0, -1);
//     }

//     previousFocusedelement.textContent = value;

//     previousFocusedelement.dispatchEvent(new Event('input', { bubbles: true }));

//     currentKeyboard.setInput(value);
//     return;
//   }

//   // existing enter logic
//   if (previousFocusedelement && button === '{enter}') {
//     const enterEvent = $.Event('keyup', { which: 13, keyCode: 13 });
//     $(previousFocusedelement).trigger(enterEvent);
//   }
// }

function onKeyPress(button) {
  if (
    ['{shiftleft}', '{shiftright}', '{capslock}', '{shift}', '{lock}'].includes(
      button,
    )
  ) {
    handleShift();
  }
  if (previousFocusedelement && ['{enter}'].includes(button)) {
    const enterEvent = $.Event('keyup', { which: 13, keyCode: 13 });
    $(previousFocusedelement).trigger(enterEvent);
  }
}

function handleShift() {
  if (currentKeyboard) {
    const currentLayout = currentKeyboard.options.layoutName;
    const shiftToggle = currentLayout === 'default' ? 'shift' : 'default';
    currentKeyboard.setOptions({
      layoutName: shiftToggle,
    });
  }
}

function destroyVirtualkeyboard() {
  if (currentKeyboard) {
    currentKeyboard.destroy();
    currentKeyboard = undefined;
  }
}

function initializevirtualKeyboard(showForceFully) {
  destroyVirtualkeyboard();
  currentvirtualLayout = new KeyboardLayouts().get(
    KEYBOARD_LAYOUT_MAP[$.i18n.language || 'en'],
  );
  if (currentvirtualLayout) {
    Object.assign(currentvirtualLayout.layout, {
      ...numpadLayout,
    });
  }
  currentKeyboard = new SimpleKeyboard({
    onChange: (input) => onChange(input),
    onKeyPress: (button) => onKeyPress(button),
    preventMouseDownDefault: true,
    ...currentvirtualLayout,
  });

  // span.item-qty-editable-row
  $(document).on(
    'focus',
    'input[type=text],input[type=number],input[type=password],span.item-qty-editable-row, span.item-amount-editable-row',
    function () {
      // if (this.type === 'number') {
      //   $(this).attr('type', 'text').addClass('was-number-input');
      // }
      previousFocusedelement = this;
      showKeyboard();
    },
  );

  document.addEventListener('click', (event) => {
    /**
     * Hide the keyboard when you're not clicking it or when clicking an input
     * If you have installed a "click outside" library, please use that instead.
     */
    if (
      currentKeyboard &&
      currentKeyboard.options.theme.includes('show-keyboard') &&
      !event.target.className.includes('input') &&
      !event.target.className.includes('simple-keyboard') &&
      !event.target.className.includes('hg-button') &&
      !event.target.className.includes('hg-row') &&
      !event.target.className.includes('item-qty-editable-row') &&
      !event.target.className.includes('item-amount-editable-row') &&
      !SAFE_ELEMENTS.includes(event.target.type)
    ) {
      hideKeyboard();
    }
  });

  $('#simplekeyboardId').draggable();
  $('#simplekeyboardId').resizable();
  if (!showForceFully) {
    hideKeyboard();
  }
  // hideKeyboard();
}

module.exports = {
  showKeyboard,
  initializevirtualKeyboard,
  destroyVirtualkeyboard,
  hideKeyboard,
};
