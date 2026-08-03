/* eslint-disable camelcase */
const { Chart } = require('chart.js/auto');
const { default: axios } = require('axios');
const { Config } = require('../config/config');
const { materialColor } = require('../util/MiscUtil');
const { ORDER_IPC } = require('../util/IPC_Messages');
const { iinitializei18nforCustomerhistory } = require('./i18nController');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { apiCall } = require('../services/APIService');
const { checkDuePayExistRequest } = require('../renderer/helper/Order.helper');
const {
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  DELIVERY_TAB_ID,
  QUICK_TAB_ID,
} = require('../util/Constants');
const { safeParse } = require('../util/RendererUtils');

window.customerhistoryscriptLoaded = true;

let currentPiechart;

let currentMobile;
let customerName;
let store_id;
/**
 * Initialize the window
 */
function Initialize() {
  $('#customerHistorymodal').modal('show');

  $('#fetchHistorybutton').on('click', function () {
    $(this).prop('disabled', true);
    fetchCustomerhistory_local(currentMobile, customerName, store_id);
  });

  $('#customerHistorymodal').on('hidden.bs.modal', () => {
    if (currentPiechart) {
      currentPiechart.destroy();
    }
    $('#customerOrderstotalid').html('---');
    $(`#customerOrdersrevenuetotalid`).html('');
    $('#favouriteItemname').html('---');
    $('#customerAnalysistitle').html('Customer Naasme:opa');
    $('#lastvisitId').html('---');
    currentMobile = undefined;
    customerName = undefined;
    store_id = undefined;
  });

  iinitializei18nforCustomerhistory();
}

/**
 *
 * @param {Customer Mobile number} mobile
 * @param {Customer Mobile number} name
 * @param {Store id which the customer belongs to} store_id
 */
async function fetchCustomerhistory_local(mobile, name, storeId) {
  if (!mobile || !name || !storeId) {
    $('#fetchHistorybutton').prop('disabled', false);
    return;
  }

  $('#customerAnalysistitle').html(`Customer: ( ${name}:${mobile} )`);
  $('#customerordersTable').find('tr:not(:first)').remove();
  $('#customerOrderstotalid').html('---');
  $(`#customerOrdersrevenuetotalid`).html('');
  if (currentPiechart) {
    currentPiechart.destroy();
  }
  currentMobile = mobile;
  customerName = name;
  store_id = storeId;

  checkDues();

  try {
    const axiosResult = await apiCall.post(
      Config.links.customerHistory,
      {
        cust_mobile: currentMobile,
        store_id,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    const result = axiosResult.data;
    if (result.status) {
      if (result.status == 200 && result.data) {
        showDetails(result.data);
      } else if (result.status === '303') {
        reloginfromremote();
      }
    }
  } catch (error) {
    console.log(error);
    if ([401].includes(error?.response?.status)) {
      reloginfromremote();
    }
  }
  $('#fetchHistorybutton').prop('disabled', false);
}

async function initCheckDuePayExist(data) {
  try {
    const response = await checkDuePayExistRequest(data);
    return response;
  } catch (error) {
    console.log(`Message="Error while getting wallet details" `, error);
  }
}

async function checkDues() {
  if (currentMobile) {
    initCheckDuePayExist({ phone: currentMobile }).then((result) => {
      if (result && result.duePay && result.duePay.length) {
        $(`#customerHistoryduepaymentamountid`).html(
          `${window.currency} ${Number(result.duePay[0].due_payment).toFixed(window.ROUNDOFF_UPTO)}`,
        );
      } else {
        $(`#customerHistoryduepaymentamountid`).html('---');
      }
    });
  } else {
    $(`#customerHistoryduepaymentamountid`).html('---');
  }
}

/**
 * Show's bill details
 * @param {Data to show} data
 */
async function showDetails(orderData) {
  $('#js-legend-4').html('');
  if (orderData) {
    try {
      let ordersTotal = 0;
      if (orderData.orders != undefined && orderData.orders.length > 0) {
        let lastvisit;
        if (!lastvisit) {
          // lastvisit = moment(orderData.orders[0].orderDateTime).fromNow();
          lastvisit = moment(
            orderData.orders[0].orderDateTime,
            'YYYY-MM-DD HH:mm:ss',
          ).fromNow();
        }
        orderData.orders.forEach((element) => {
          ordersTotal += Number(element.order_total);
          addOrders(element);
        });
        if (lastvisit) {
          $('#lastvisitId').html(lastvisit);
        }
      }
      const { no_of_orders } = orderData;
      $('#customerOrderstotalid').html(`${no_of_orders}`);
      // $('#customerOrdersrevenuetotalid').html(`(${window.currency} ${ordersTotal})`);

      if (orderData.item_analysis && orderData.item_analysis.length > 0) {
        const labels = [];
        let favorite;
        const backgroundColor = [];
        const data = [];
        let maxQty = 0;

        orderData.item_analysis.forEach((element) => {
          labels.push(element.title);
          data.push(element.total_qty);
          backgroundColor.push(materialColor());

          if (Number(element.total_qty) > maxQty) {
            favorite = element.title;
            maxQty = Number(element.total_qty);
          }
        });

        if (favorite) {
          $('#favouriteItemname').html(favorite);
        } else {
          $('#favouriteItemname').html('---');
        }

        drawPie(labels, backgroundColor, data);
      }

      if (no_of_orders == 0) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:customerHistoryController.noOrdersFound'),
        );
      }

      // customerhistoryLoyaltypointslabelid
      const extra_info = safeParse(window.storeDetails.extra_info);
      const isReelo =
        extra_info && extra_info.isReeloIntegrate
          ? extra_info.isReeloIntegrate
          : 0;
      let loyalty_points = 0;
      if (isReelo) {
        const result = await apiCall.post(
          Config.links.getReelocustomerLoyaltyDetails,
          {
            store_id: window.storeDetails.store_id,
            customer_mobile: currentMobile,
          },
          {
            headers: getHeadersformposforrender(),
          },
        );
        if (result.data.status == '200') {
          if (result) {
            const response = result.data;
            loyalty_points =
              response &&
              response.reeloResponse &&
              response.reeloResponse.response &&
              response.reeloResponse.response.loyalty_points;
          }
        }
      } else {
        loyalty_points = orderData.loyalty_points;
      }
      if (orderData.loyalty_points) {
        $(`#customerhistoryLoyaltypointslabelid`).html(loyalty_points);
      } else {
        $(`#customerhistoryLoyaltypointslabelid`).html('---');
      }
    } catch (error) {}
  }
}

window.fetchCustomerhistory = async function (mobile, name, store_id) {
  await fetchCustomerhistory_local(mobile, name, store_id);
};

/**
 * Add's data to the table view
 * @param {Order Data} data
 */
async function addOrders(data) {
  if (data) {
    const orderidCol = $('<td>', { html: data.order_id });
    // let dateCol = $('<td>', { html: data.order_date_time });
    let dateCol;
    if (Config.USE_NEW_API_BACKEND) {
      dateCol = $('<td>', {
        html: moment(data.orderDateTime, 'YYYY-MM-DD HH:mm:ss').format(
          'DD MMMM YYYY hh:mm a',
        ),
      });
    } else {
      dateCol = $('<td>', {
        html: moment(data.order_date_time, 'YYYY-MM-DD HH:mm:ss').format(
          'DD MMMM YYYY hh:mm a',
        ),
      });
    }
    // moment(billDetails.order_date_timenew)
    const totalCol = $('<td>', { html: data.order_total });
    const icon = $('<i>', { class: 'fas fa-eye', title: 'View details' }).on(
      'click',
      () => {
        showCustomerbilldetails(data);
      },
    );

    const repeateOrderIcon = $('<i>', {
      class: 'fa-solid fa-repeat',
      title: 'Repeat Order',
    }).on('click', () => {
      // repeateOrder(data);
    });

    const viewDetailscol = $('<td>').append(icon);
    $('<tr>')
      .append(orderidCol)
      .append(dateCol)
      .append(totalCol)
      .append(viewDetailscol)
      .appendTo('#customerordersTable');
  }
}

function showCustomerbilldetails(billDetails) {
  if (billDetails) {
    billDetails.billedItems = billDetails.order_items;
    billDetails.fromRemote = true;
    if (!window.billdetailsscriptLoaded) {
      $('#billdetailspreviewBodyid').load('Billdetails.html', () => {
        renderBilldetail_fromremote([billDetails], false, true);
      });
    } else {
      renderBilldetail_fromremote([billDetails], false, true);
    }
  }
}

/**
 *
 * @param {Pie Chart data} data
 */
async function drawPie(labels, backgroundColor, data) {
  if (currentPiechart) {
    currentPiechart.destroy();
  }
  const ctx = document.getElementById('pieChartid').getContext('2d');
  try {
    currentPiechart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            backgroundColor,
            data,
          },
        ],
      },
      options: {
        rotation: 270,
        circumference: 180,
        plugins: {
          htmlLegend: {
            // ID of the container to put the legend in
            containerID: 'js-legend-4',
          },
          legend: {
            display: false,
          },
        },
      },
      plugins: [htmlLegendPlugin],
    });
  } catch (error) {
    console.log(error);
  }
}

const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector('ul');

  if (!listContainer) {
    listContainer = document.createElement('ul');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'row';
    listContainer.style.margin = 0;
    listContainer.style.padding = 0;

    legendContainer.appendChild(listContainer);
  }

  return listContainer;
};

const htmlLegendPlugin = {
  id: 'htmlLegend',
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID);
    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }
    // Reuse the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart);
    items.forEach((item) => {
      const li = document.createElement('li');
      li.style.alignItems = 'center';
      li.style.cursor = 'pointer';
      li.style.display = 'flex';
      li.style.flexDirection = 'row';
      li.style.marginLeft = '10px';

      li.onclick = () => {
        const { type } = chart.config;
        if (type === 'pie' || type === 'doughnut') {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index);
        } else {
          chart.setDatasetVisibility(
            item.datasetIndex,
            !chart.isDatasetVisible(item.datasetIndex),
          );
        }
        chart.update();
      };

      // Color box
      const boxSpan = document.createElement('span');
      boxSpan.style.background = item.fillStyle;
      boxSpan.style.borderColor = item.strokeStyle;
      boxSpan.style.borderWidth = `${item.lineWidth}px`;
      boxSpan.style.display = 'inline-block';
      boxSpan.style.height = '20px';
      boxSpan.style.marginRight = '10px';
      boxSpan.style.width = '20px';

      // Text
      const textContainer = document.createElement('p');
      textContainer.style.color = item.fontColor;
      textContainer.style.margin = 0;
      textContainer.style.padding = 0;
      textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

      const text = document.createTextNode(item.text);
      textContainer.appendChild(text);

      li.appendChild(boxSpan);
      li.appendChild(textContainer);
      ul.appendChild(li);
    });
  },
};

Initialize();
