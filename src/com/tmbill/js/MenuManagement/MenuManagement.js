const { initAccesslevelsformenuManagement } = require('../AccesslevelManager');
const { initalizei18nformenuManagement } = require('../i18nController');
require('../Account');

window.menuManagamentScriptloaded = true;
window.isInsideMenuManagement = true;

/**
 * Robustly set IP in Menu Management by:
 * 1) using window.globalIPAddress if present
 * 2) copying #ipaddressField HTML if already rendered
 * 3) asking master logic to render via window.setIPAddress_fromremote()
 * 4) observing #ipaddressField for changes and copying as soon as a valid IP appears
 * 5) fallback polling/timeouts so we don't miss delayed data
 */
function setIPAddressForMenuManagement_usingMasterLogic() {
  const menuFieldSelector = '#ipaddressFieldMenuManagement';
  const masterSelector = '#ipaddressField';
  const $menuField = $(menuFieldSelector);

  if ($menuField.length === 0) {
    // nothing to do
    return;
  }

  // helper to render simple text ip
  function renderFromGlobal(ip) {
    $menuField.html(`<i class="fas fa-server"></i> IP: ${ip}`);
  }

  // 1) if global IP already available, use it immediately
  if (
    window.globalIPAddress &&
    String(window.globalIPAddress).trim() &&
    !/--/.test(String(window.globalIPAddress))
  ) {
    renderFromGlobal(window.globalIPAddress);
    return;
  }

  // 2) if master element exists and has a non-placeholder value, copy it
  const $master = $(masterSelector);
  if ($master.length) {
    const masterText = $master.text().trim();
    if (masterText && !/--/.test(masterText)) {
      $menuField.html($master.html());
      return;
    }
  }

  // 3) If there is a function to make master set the IP, call it (safe to call even if it does nothing)
  if (typeof window.setIPAddress_fromremote === 'function') {
    try {
      window.setIPAddress_fromremote();
    } catch (e) {
      console.warn('setIPAddress_fromremote threw', e);
    }
  }

  // 4) Observe master element for changes (best-effort)
  let observer = null;
  function startObservingMaster() {
    const masterNode = document.querySelector(masterSelector);
    if (!masterNode) return;
    observer = new MutationObserver(() => {
      const masterHtml = $(masterSelector).html();
      const masterText = $(masterSelector).text().trim();
      if (masterHtml && masterText && !/--/.test(masterText)) {
        $menuField.html(masterHtml);
        if (observer) observer.disconnect();
      }
    });
    observer.observe(masterNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  startObservingMaster();

  // 5) A few fallback delayed attempts (in case master renders slightly later)
  [150, 500, 1200, 2500].forEach((delay) => {
    setTimeout(() => {
      const masterHtml = $(masterSelector).html();
      const masterText = $(masterSelector).text().trim();
      if (masterHtml && masterText && !/--/.test(masterText)) {
        $menuField.html(masterHtml);
        if (observer) observer.disconnect();
      }
    }, delay);
  });

  // 6) Poll for globalIPAddress for up to ~5 seconds (covers other async flows)
  let polls = 0;
  const pollInterval = setInterval(() => {
    polls++;
    if (
      window.globalIPAddress &&
      String(window.globalIPAddress).trim() &&
      !/--/.test(String(window.globalIPAddress))
    ) {
      renderFromGlobal(window.globalIPAddress);
      if (observer) observer.disconnect();
      clearInterval(pollInterval);
      return;
    }

    // also check master again in poll
    const masterHtml = $(masterSelector).html();
    const masterText = $(masterSelector).text().trim();
    if (masterHtml && masterText && !/--/.test(masterText)) {
      $menuField.html(masterHtml);
      if (observer) observer.disconnect();
      clearInterval(pollInterval);
      return;
    }

    if (polls > 6) {
      clearInterval(pollInterval);
    }
  }, 800);
}

async function openCRMTab() {
  if (!window.customermgmtscriptLoaded) {
    $('#crmwindowWrapperid').load('crm/crm.html');
  }

  $('#menuManagementwindowWrapperid').hide();
  $('#crmwindowWrapperid').show();
}
async function openExpenseManagementTab() {
  // Hide other windows first (so user doesn't see flash)
  $('#menuManagementwindowWrapperid').hide();
  $('#itemsManagementwindowWrapperid').hide();
  $('#walletManagementwindowWrapperid').hide();
  $('#crmwindowWrapperid').hide();
  $('#userManagementwindowWrapperid').hide();

  // hide master-specific UI parts (if you want them gone)

  // If already loaded and content present, just show it
  const $wrapper = $('#expenseManagementwindowWrapperid');
  if (window.expenseScriptLoaded && $wrapper.html().trim().length > 5) {
    $wrapper.show();
    return;
  }

  // Try to load and add robust logging and error handling
  await new Promise((resolve) => {
    $wrapper.load('Account/expense.html', function (responseText, status, xhr) {
      if (status === 'error') {
        console.error(
          'Failed to load Account/expense.html:',
          xhr && xhr.status,
          xhr && xhr.statusText,
        );
        // show debug message in UI so it's visible
        $wrapper.html(
          `<div style="padding:20px;color:#b00">Failed to load Expense view. Check console / network (Account/expense.html).</div>`,
        );
        $wrapper.show();
        resolve(false);
        return;
      }

      // Loaded - small sanity check
      const contentLen = $wrapper.html().trim().length;
      console.log(
        `Loaded Account/expense.html — wrapper length: ${contentLen}`,
      );
      if (contentLen <= 5) {
        console.warn('Expense wrapper loaded but content looks empty.');
        $wrapper.prepend(
          '<div style="padding:8px;color:#b50">Warning: expense.html loaded but content appears empty.</div>',
        );
      }

      window.expenseScriptLoaded = true;

      $wrapper.show();
      resolve(true);
    });
  });
}
async function openFcmTestTab() {
  $('#menuManagementwindowWrapperid').hide();
  $('#itemsManagementwindowWrapperid').hide();
  $('#walletManagementwindowWrapperid').hide();
  $('#crmwindowWrapperid').hide();
  $('#userManagementwindowWrapperid').hide();
  $('#expenseManagementwindowWrapperid').hide();

  const $wrapper = $('#fcmTestwindowWrapperid');

  if (!window.fcmTestScriptLoaded) {
    await new Promise((resolve) => {
      $wrapper.load('Account/fcmtest.html', function (responseText, status) {
        if (status === 'error') {
          console.error('Failed to load FCM view');
          resolve(false);
          return;
        }
        window.fcmTestScriptLoaded = true;
        resolve(true);
      });
    });
  }
  $wrapper.show();
  if (typeof window.resetTest === 'function') {
    window.resetTest();
  }
}
async function openWallteManagementTab() {
  if (!window.walletmgmtScriptloaded) {
    $('#walletManagementwindowWrapperid').load('crm/wallet.html');
  }

  $('#menuManagementwindowWrapperid').hide();
  $('#walletManagementwindowWrapperid').show();
}

async function openUserManagementTab() {
  if (!window.captainmgmtScriptloaded) {
    $('#userManagementwindowWrapperid').load('crm/Usermanagement.html');
  }

  $('#menuManagementwindowWrapperid').hide();
  $('#userManagementwindowWrapperid').show();
}

async function openItemsManagementTab() {
  // load items management window
  if (!window.itemManagementWindowLoaded) {
    $('#itemsManagementwindowWrapperid').load(
      'MenuManagement/ItemsManagement.html',
    );
  }

  $('#menuManagementwindowWrapperid').hide();
  $('#itemsManagementwindowWrapperid').show();
  $('#searchByname_item_in_item_management').val('');

  setTimeout(() => {
    window.getMenuDataFromRemote();
  }, 100);
}

function Initialize() {
  setIPAddressForMenuManagement_usingMasterLogic();

  $('#itemsManagementbuttonid').on('click', function () {
    openItemsManagementTab(this);
  });
  $('#expenseManagementButtonid').on('click', function () {
    openExpenseManagementTab(this);
  });

  $('#crmButtonid').on('click', function () {
    openCRMTab(this);
  });

  $('#walletButtonid').on('click', function () {
    openWallteManagementTab(this);
  });

  $('#UserManagement').on('click', function () {
    openUserManagementTab(this);
  });
  $('#generateFcmBtn').on('click', function () {
    openFcmTestTab();
  });
  initAccesslevelsformenuManagement();
  if ($.i18n) {
    initalizei18nformenuManagement();
  } else {
    setTimeout(initalizei18nformenuManagement, 400);
  }

  if (!window.__IS_MASTER_POS__) {
    $('.menuManagement-1, .menuConfigurationHeading').hide();
    $('#closeDayCardid').hide();
  }
}

Initialize();
