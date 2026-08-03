/* eslint-disable camelcase */
const {
  Chart,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} = require('chart.js');
const {
  checkDuePayExistRequest,
} = require('../../renderer/helper/Order.helper');
const { apiCall } = require('../../services/APIService');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { materialColor } = require('../../util/MiscUtil');
const { safeParse } = require('../../util/RendererUtils');
const { showLoader } = require('../CommonUtils');
window.customerhistoryscriptLoaded = true;

let currentPiechart;

let currentMobile;
let customerName;
let store_id;

/**
 *
 * @param {Pie Chart data} data
 */
async function drawPie(labels, backgroundColor, data) {
  if (currentPiechart) {
    currentPiechart.destroy();
  }
  // const ctx = document.getElementById('itemsPieChartid').getContext('2d');
  Chart.register(ArcElement, Tooltip, Legend, Title, PieController);
  // console.log('ctx::', ctx);
  const ctx = document.getElementById('preferredItemsChart').getContext('2d');
  try {
    currentPiechart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColor,
            borderColor: '#fff',
            borderWidth: 2,
            position: 'top',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: false, text: 'Preferred Items Distribution' },
          legend: { position: 'right' },
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
}
/**
 *
 * @param {Pie Chart data} data
 */
async function drawBarChart(OrdertypeDistribution) {
  const container = $('.distribution-stats');
  container.empty();

  // Get max count to calculate width percentage
  const maxCount = Math.max(
    ...OrdertypeDistribution.map((item) => parseInt(item.orderCount)),
  );

  OrdertypeDistribution.forEach((item) => {
    const percentage = ((parseInt(item.orderCount) / maxCount) * 100).toFixed(
      2,
    );

    const barHtml = `
            <div class="distribution-bar">
                <div class="bar-info">
                    <span class="bar-label">${item.orderTypetitle}</span>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${percentage}%">${item.orderCount}</div>
                    </div>
                </div>
            </div>
        `;
    container.append(barHtml);
  });
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
/**
 * Show's bill details
 * @param {Data to show} data
 */

// 👇 Add this helper function once
function truncateText(text, maxLength = 26) {
  if (!text) return '-';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
async function showDetails(orderData) {
  $('#js-legend-4').html('');
  if (orderData) {
    try {
      // let ordersTotal = 0;
      // if (orderData.orders != undefined && orderData.orders.length > 0) {
      // let lastvisit;
      // if (!lastvisit) {
      //   lastvisit = moment(
      //     orderData.orders[0].orderDateTime,
      //     'YYYY-MM-DD HH:mm:ss',
      //   ).fromNow();
      // }
      // orderData.orders.forEach((element) => {
      //   ordersTotal += Number(element.order_total);
      //   addOrders(element);
      // });
      //   if (lastvisit) {
      //     $('#lastvisitId').html(lastvisit);
      //   }
      // }
      // const { no_of_orders } = orderData;
      // $('#customerOrderstotalid').html(`${no_of_orders}`);
    if (orderData) {
  $('#customerTotalOrdersCountId').html(orderData.totalOrders);

  if (orderData.recentOrders) {
    const recentOrdersText = $.i18n.t('Customerform.RECENT_ORDERS_IN_LAST_30_DAYS', { count: orderData.recentOrders });
    $('#customerTotalOrdersTitleId').html(recentOrdersText);
  }

if (orderData.totalRevenue) {
  $('#customersTotalRevenueId').html(`${window.storeDetails.currency} ${orderData.totalRevenue}`);
}

if (orderData.recentRevenue) {
  $('#customersTotalRevenueTitleId').html(
    $.i18n.t('Customerform.RECENT_ORDERS_IN_LAST_30_DAYS', {
      count: `${window.storeDetails.currency} ${orderData.recentRevenue} `
    })
  );
}


        $('#customersLoyaltyPointsId').html(orderData.loyaltyPoints);

        $('#customerLastVistedDateId').html(orderData.recentOrders);
        $('#customerLastVistedDaysAgoId').html(orderData.recentOrders);

        if (orderData.favoriteItem && orderData.favoriteItem.length) {
          const favoriteitem = orderData.favoriteItem[0];
          $('#customerFavoriteItemId').html(truncateText(favoriteitem.itemName));
          $('#customerFavoriteItemTitleId').html(
            `Ordered ${favoriteitem.orderCount} times`,
          );
        }

        if (
          orderData.preferredPaymentMethod &&
          orderData.preferredPaymentMethod.length
        ) {
          const preferredOrderType = orderData.preferredPaymentMethod[0];
          $('#customerPreferredPaymentModeId').html(
            preferredOrderType.paymentMethod,
          );
          $('#customerPreferredPaymentModeTitleId').html(
            `Used in ${preferredOrderType.useCount} orders`,
          );
        }

        if (orderData.lastVisited) {
          let lastvisit;
          const formattedDate = window
            .moment(orderData.lastVisited)
            .format('DD MMM YYYY');
          if (!lastvisit) {
            lastvisit = window
              .moment(orderData.lastVisited, 'YYYY-MM-DD HH:mm:ss')
              .fromNow();
          }
          $('#customerLastVistedDateId').html(formattedDate);
          $('#customerLastVistedDaysAgoId').html(`${lastvisit}`);
        }
      }

      if (orderData.favoriteItem && orderData.favoriteItem.length > 0) {
        const labels = [];
        let favorite;
        const backgroundColor = [];
        const data = [];
        let maxQty = 0;

        orderData.favoriteItem.forEach((element) => {
  labels.push(truncateText(element.itemName));
  data.push(element.orderCount);
  backgroundColor.push(materialColor());


          if (Number(element.orderCount) > maxQty) {
            favorite = element.itemName;
            maxQty = Number(element.orderCount);
          }
        });

        // if (favorite) {
        //   $('#favouriteItemname').html(favorite);
        // } else {
        //   $('#favouriteItemname').html('---');
        // }

        drawPie(labels, backgroundColor, data);
      }

      if (orderData.preferredOrderType && orderData.preferredOrderType.length) {
        const labels = [];
        const backgroundColor = [];
        const data = [];

        orderData.preferredOrderType.forEach((element) => {
          labels.push(element.orderTypetitle);
          data.push(element.orderCount);
          backgroundColor.push(materialColor());
        });
        drawBarChart(orderData.preferredOrderType);
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
          window.Config.links.getReelocustomerLoyaltyDetails,
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

async function initCheckDuePayExist(data) {
  try {
    const response = await checkDuePayExistRequest(data);
    return response;
  } catch (error) {
    console.log(`Message="Error while getting wallet details" `, error);
  }
  return undefined;
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

function resetCustomerAnalytics() {
  $('#customerTotalOrdersCountId').html('-');
  $('#customerTotalOrdersTitleId').html(`-`);

  $('#customersTotalRevenueId').html(`-`);
  $('#customersTotalRevenueTitleId').html(`-`);

  $('#customersLoyaltyPointsId').html('-');

  $('#customerLastVistedDateId').html('-');
  $('#customerLastVistedDaysAgoId').html('-');

  $('#customerFavoriteItemId').html('-');
  $('#customerFavoriteItemTitleId').html(`-`);

  $('#customerPreferredPaymentModeId').html('-');
  $('#customerPreferredPaymentModeTitleId').html(`-`);

  $('#customerLastVistedDateId').html('-');
  $('#customerLastVistedDaysAgoId').html(`-`);

  $('#customerAnalyticsOrderDistributionBarChartId').empty();
  // $('#customerAnalyticsPreferredItemsChartId').empty();
}

async function customerAnalytics(params) {
  try {
    resetCustomerAnalytics();
    const { mobile, name, storeId } = params;
    if (!mobile) {
      // $('#fetchHistorybutton').prop('disabled', false);
      return;
    }

    // $('#customerAnalysistitle').html(`Customer: ( ${name}:${mobile} )`);
    // $('#customerordersTable').find('tr:not(:first)').remove();
    // $('#customerOrderstotalid').html('---');
    // $(`#customerOrdersrevenuetotalid`).html('');
    if (currentPiechart) {
      currentPiechart.destroy();
    }
    currentMobile = mobile;
    customerName = name;
    store_id = storeId;

    checkDues();

    showLoader({
      title: $.i18n.t('controller:orderController.Fetchingcustomeranalytics'),
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });
    try {
      const axiosResult = await apiCall.post(
        window.Config.links.customerAnalytics,
        {
          phone: String(mobile),
          store_id: [window.storeDetails.store_id],
        },
        {
          headers: getHeadersformposforrender(),
        },
      );
      window.Swal.close();
      const result = axiosResult.data;
      if (result.status) {
        if (result.status == 200) {
          showDetails(result);
        } else if (result.status === '303') {
          window.reloginfromremote();
        }
      }
    } catch (error) {
      window.Swal.close();
      console.log(error);
      if ([401].includes(error?.response?.status)) {
        window.reloginfromremote();
      }
    }
    $('#fetchHistorybutton').prop('disabled', false);
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  customerAnalytics,
};
