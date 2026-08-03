const shell = require('electron').shell;
let currentTimer = undefined;

let customLinksList = [];

function initializeCustomelinksController() {
  let customlinksWrapper = $('<div>', {
    class: 'customlinks-wrapper',
    id: 'customlinks-wrapperid',
  });
  let customlinksTitle = $('<label>', {
    html: $.i18n.t('controller:orderController.Customlinks'),
    class: 'customlinks-title',
  });
  let customlinksList = $('<ul>', {
    class: 'customlinks-list',
    id: 'customlinks-list-id',
  });
  customlinksWrapper.append(customlinksTitle);
  customlinksWrapper.append(customlinksList);

  //Close the popup if it leaves the popover
  $(document).on('mouseleave', '#customlinks-wrapperid', function () {
    $('#customLinksIconId').popover('hide');
  });

  //This will be triggered when the mouse is entered
  //on the list of filter and clears the settimeout
  //when will be triggered after 5 seconds when
  //the popover is open.By cancelling it we don't have
  //to worry about accidental popover closes.
  $(document).on('mouseenter', '#customlinks-wrapperid', function () {
    clearTimeout(currentTimer);
  });

  //Add a settimeout of 5 seconds to close
  //the popover if user doesnot interact with
  //the filter list
  $('#customLinksIconId').on('click', function () {
    currentTimer = setTimeout(() => {
      $('#customLinksIconId').popover('hide');
    }, 5000);
  });
  let options = {
    content: customlinksWrapper[0],
    html: true,
    id: 'demo',
  };
  $('#customLinksIconId').popover(options);
  $('#customLinksIconId').on('inserted.bs.popover', function () {
    addPopoverstyle($(this).attr('aria-describedby'));
  });
}

function addPopoverstyle(popperId) {
  if (popperId) {
    $(`#${popperId}`).addClass('customlinks-popover');
  }
  showcustomlinksIfexists();
  $('#customlinks-list-id li input[type=button]').on('click', (event) => {
    event.preventDefault();
    let url = $(event.target).attr('url');
    shell.openExternal(url);
  });
}

function showcustomlinksIfexists() {
  $('#customlinks-list-id').empty();
  for (const customlink of customLinksList) {
    if (customlink.url && customlink.title) {
      let customlinkItem = $('<li>', {
        class: 'row',
      });

      let title = $('<input>', {
        value: customlink.title,
        class: 'customlinks-item-title customUrl',
        type: 'button',
        url: customlink.url,
        title: customlink.title,
      });

      customlinkItem.append(title);
      $('#customlinks-list-id').append(customlinkItem);
    }
  }
}

async function customLinks(params) {
  customLinksList = params;
}

module.exports = {
  customLinks,
};
initializeCustomelinksController();
