/* eslint-disable no-console */
require('../../hooks/i18n');
const QRCodenew = require('qrcode');
window.Swal = require('sweetalert2');
const remote = require('@electron/remote');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');
const Mousetrap = require('mousetrap');
const { ipcRenderer } = require('electron');
const { isEmpty } = require('lodash');

const {
  generateMaterialGradient,
  getColorsforactiveslide,
} = require('./Utils');
const { CD_EVENTS } = require('../../main/CustomerDisplay/Events');
const { CD_MEDIA_FIT } = require('./constant');

// eslint-disable-next-line no-unused-vars
let apptitleBar;

let swiperInstance;
let customerDisplaysettings;
let ROUNDOFF_UPTO = 2;
let selectedLanguage = 'en';

let CURRENT_ORDER_STATE = {};

function getItemelementtorender(element) {
  let itemTitle = element.title;
  if (element && element.extra_details && element.extra_details.baseTitle) {
    itemTitle = element.extra_details.baseTitle;
  }

  if (selectedLanguage !== 'en' && element && element.alternative_title) {
    itemTitle = element.alternative_title;
  }
  const itemWrapper = $('<div>', {
    text: itemTitle,
  });

  const item = $('<li>', {
    class: 'itemName',
  }).append(itemWrapper);

  if (element.addons && element.addons.length) {
    const addonsWrapper = $('<div>', {
      class: 'itemsaddonsWrapper',
    });
    element.addons.forEach((a) => {
      let optionTitle = a.title || a.option_name;
      if (selectedLanguage !== 'en' && a.alternative_title) {
        optionTitle = a.alternative_title;
      }
      const addon = $('<div>', {
        text: `${a.qty || a.option_qty} x ${optionTitle}`,
        class: 'addon',
      });
      $(addonsWrapper).append(addon);
    });
    $(item).append(addonsWrapper);
  }
  const qty = $('<li>', {
    text: element.quantity,
    class: 'itemQty',
  });
  const amt = $('<li>', {
    text: Number(element.amount).toFixed(ROUNDOFF_UPTO),
    class: 'itemAmount',
  });

  const wrapper = $('<ul>', {
    class: 'orderitemsList',
  })
    .append(item)
    .append(qty)
    .append(amt);
  return wrapper;
}

async function renderQRCode(value) {
  if (!value) {
    $('#customerdisplayqrCanvasid,#qrcodeContainerid').hide();
    return;
  }
  try {
    $('#customerdisplayqrCanvasid,#qrcodeContainerid').show();
    const dataimageUrl = await QRCodenew.toDataURL(value);
    $(`#customerdisplayqrCanvasid`).attr('src', dataimageUrl);
  } catch (error) {
    console.log(error);
    $('#customerdisplayqrCanvasid,#qrcodeContainerid').hide();
  }
}

function clearFields() {
  $('#orderitemsWrapperid').empty();
  $('#cdorderPromptid').show();
  $('#ordertotalLabelid').empty();
  $('#ordernoLabelid').empty();
  $('#customerdisplayqrCanvasid,#qrcodeContainerid').hide();
}

function toggleBillview(show) {
  if (show) {
    $('.rightContainer').show();
    $('.leftContainer').css({
      width: '65%',
    });
    if (
      customerDisplaysettings.mediaFitwithbillview &&
      Object.values(CD_MEDIA_FIT).includes(
        customerDisplaysettings.mediaFitwithbillview,
      )
    ) {
      $('.sliderImage,.sliderVideo').css({
        objectFit: customerDisplaysettings.mediaFitwithbillview,
      });
    }
  } else {
    // Hide the right container
    $('.rightContainer').hide();
    $('.leftContainer').css({
      width: '100%',
    });
    if (
      customerDisplaysettings.mediaFitwithoutbillview &&
      Object.values(CD_MEDIA_FIT).includes(
        customerDisplaysettings.mediaFitwithoutbillview,
      )
    ) {
      $('.sliderImage,.sliderVideo').css({
        objectFit: customerDisplaysettings.mediaFitwithoutbillview,
      });
    }
  }
}

function renderorderState() {
  let hideEmptymsg = false;

  clearFields();
  if (
    CURRENT_ORDER_STATE &&
    !isEmpty(CURRENT_ORDER_STATE) &&
    CURRENT_ORDER_STATE.items &&
    CURRENT_ORDER_STATE.items.length > 0
  ) {
    toggleBillview(true);
    hideEmptymsg = true;
    CURRENT_ORDER_STATE.items.forEach((element) => {
      const wrapper = getItemelementtorender(element);
      $('#orderitemsWrapperid').append(wrapper);
    });
    const title = $('<div>', {
      text: `${$.i18n.t('customerDisplay.totalAmount')} :`,
      class: 'ordertotalLabeltitle',
    });

    const orderTotal = $('<div>', {
      text: `${window.storeDetails.currency} ${CURRENT_ORDER_STATE.total}`,
      class: 'ordertotalLabelamt',
    });

    $('#ordertotalLabelid').append(title).append(orderTotal);
    $('#ordernoLabelid').text('');
    if (CURRENT_ORDER_STATE.billNumber) {
      $('#ordernoLabelid').text(
        `${$.i18n.t('customerDisplay.billNumber')} : ${CURRENT_ORDER_STATE.billNumber}`,
      );
    }

    if (CURRENT_ORDER_STATE?.qrCode) {
      $('#orderitemsWrapperid').css({
        maxHeight: 'calc(100% - 210px)',
        height: 'calc(100% - 210px)',
      });
    } else {
      $('#orderitemsWrapperid').css({
        maxHeight: 'calc(100% - 70px)',
        height: 'calc(100% - 70px)',
      });
    }
    renderQRCode(CURRENT_ORDER_STATE?.qrCode);
  } else {
    toggleBillview(false);
  }

  if (hideEmptymsg) {
    $('#cdorderPromptid').hide();
  } else {
    $('#cdorderPromptid').show();
  }
}

async function addKeylisteners() {
  Mousetrap.reset();
  const mousetrap = new Mousetrap();
  mousetrap.bind('up up down down left right left right b a enter', () => {
    console.log('Opening devtools');
    remote.getCurrentWebContents().openDevTools();
  });
}

/**
 * Create a custome title bar for a window
 */
function createtitleBar() {
  //   document.getElementById('tmbillversionLabel').innerHTML = `${$.i18n.t(
  //     'controller:login.releasedOn',
  //   )} ${Config.releaseDate} | ${remote.app.getVersion()}`;
  try {
    const menu = new remote.Menu();
    menu.append(new remote.MenuItem({}));
    apptitleBar = new Titlebar({
      backgroundColor: TitlebarColor.fromHex('#fff'),
      icon: '../../assets/logo.ico',
      // menu: menu
    });
    // }
  } catch (error) {
    console.error(error);
  }
}

function renderLogoandtitle() {
  $('#outletLogoelementid').hide();
  if (window.storeDetails) {
    $('#outletTitleelementid').text(window.storeDetails.store_name);

    if (window.storeDetails.logo) {
      $('#outletLogoelementid')
        .attr(
          'src',
          `https://cdn.tmbill.com/backoffice/store-logo/${window.storeDetails.logo}`,
        )
        .show();
    }
  }
}

function updateOrderprompt(message) {
  try {
    $('#cdorderPromptid').text(message);
    $('#cdorderPromptid').show();
  } catch (error) {
    console.error(error);
  }
}

function renderSliders() {
  if (swiperInstance) {
    swiperInstance.removeAllSlides();
  }
  if (window.storeDetails && customerDisplaysettings) {
    const slideElements = [];
    const mediaElements = customerDisplaysettings.media || [];
    if (mediaElements && Array.isArray(mediaElements) && mediaElements.length) {
      mediaElements.forEach((element) => {
        if (element.type === 'image') {
          const img = $('<img class="sliderImage">');
          img.attr('src', element.src);
          const wrapper = $('<div class="swiper-slide">').append(img);
          slideElements.push(wrapper[0]);
        } else if (element.type === 'video') {
          const video = $(
            '<video muted playsinline class="sliderVideo swiper-video">',
          );
          video.attr('src', element.src);
          const wrapper = $('<div class="swiper-slide">').append(video);
          slideElements.push(wrapper[0]);
        }
      });
      if (swiperInstance && slideElements.length > 0) {
        const slidestoAppend = slideElements;
        if (slideElements.length < 4) {
          slidestoAppend.push(...slideElements, ...slideElements);
        }
        swiperInstance.appendSlide(slidestoAppend);
      }
    }

    // Check the order prompt
    if (customerDisplaysettings.orderPrompt) {
      updateOrderprompt(customerDisplaysettings.orderPrompt);
    }

    // check if customer auto pkay delay is provided
    if (customerDisplaysettings.slideshowdelayinSeconds && swiperInstance) {
      swiperInstance.params.autoplay.delay =
        Number(customerDisplaysettings.slideshowdelayinSeconds) * 1000;
    }
  }
}

async function getStoredetails() {
  try {
    const result = await ipcRenderer.invoke(CD_EVENTS.GET_STORE_DETAILS);
    if (result && result.storeDetails) {
      window.storeDetails = result.storeDetails;
      customerDisplaysettings = result.settings;
    }
    if (result && result.roundOffSetting) {
      ROUNDOFF_UPTO = Number(result.roundOffSetting);
    }
    if (result && result.selectedLanguage) {
      selectedLanguage = result.selectedLanguage;
    }
    renderLogoandtitle();
    renderSliders();
    renderorderState();
  } catch (error) {
    console.error(error);
  }
}
// Function to play video and manage Swiper autoplay
function handleVideoPlayback() {
  if (!swiperInstance) {
    return;
  }
  const activeSlide = document.querySelector('.swiper-slide-active');
  const video = activeSlide?.querySelector('video');
  // Check if the active slide has a video
  if (video) {
    video.currentTime = 0;
    swiperInstance.autoplay.pause(); // Stop autoplay when video is detected
    // Wait until video is fully ready and plays
    video.addEventListener('canplay', () => {
      video.play().catch((error) => {
        console.error('Video play error:', error);
      });
    });

    // When the video ends, resume autoplay and slide to the next slide
    video.onended = () => {
      swiperInstance.slideNext(); // Move to the next slide after video ends
      swiperInstance.autoplay.resume(); // Resume Swiper autoplay
    };
  } else {
    swiperInstance.autoplay.resume(); // Resume autoplay for image slides
  }
}

function initialiseSwiper() {
  try {
    swiperInstance = new window.Swiper('.swiperContainer', {
      loop: true,
      slidesPerView: 1,
      direction: 'horizontal',
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
    });

    swiperInstance.on('slideChangeTransitionStart', () => {
      getColorsforactiveslide();
    });

    // Handle video play/pause based on active slide
    swiperInstance.on('slideChangeTransitionEnd', () => {
      const videos = document.querySelectorAll('.swiper-video');
      videos.forEach((video) => {
        video.pause();
        // eslint-disable-next-line no-param-reassign
        video.currentTime = 0;
      });

      handleVideoPlayback(); // Handle the video in the active slide
    });
    handleVideoPlayback();
  } catch (error) {
    console.error(error);
  }
}

function Initialize() {
  $('#customerdisplayqrCanvasid,#qrcodeContainerid').hide();

  if ($.i18n) {
    $('.has-i18n').localize();
  } else {
    setTimeout(() => {
      $('.has-i18n').localize();
    }, 400);
  }
  addKeylisteners();
  setTimeout(() => {
    $('#customerDisplaywrapperid').css({
      background: generateMaterialGradient(),
    });
    getStoredetails();
    initialiseSwiper();
  }, 300);
}

ipcRenderer.on(CD_EVENTS.UPDATE_STATE, async (event, content) => {
  // console.log(content);
  CURRENT_ORDER_STATE = content || {};
  renderorderState();
});

ipcRenderer.on(CD_EVENTS.REFRESH, async () => {
  getStoredetails();
});

document.addEventListener('DOMContentLoaded', () => {
  Initialize();
  createtitleBar();

  setTimeout(() => {
    renderorderState();
  }, 10000);
});
