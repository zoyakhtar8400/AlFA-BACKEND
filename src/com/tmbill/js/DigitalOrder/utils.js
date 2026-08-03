const { apiCall } = require('../../services/APIService');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');

/* eslint-disable camelcase */
async function contactSupport(order_id) {
  window.Swal.fire({
    title: 'Contact Support',
    html: `
      <input 
        id="support-order-id"
        class="swal2-input"
        placeholder="Order ID"
        value=${order_id}
      />
      <textarea
        id="support-description"
        class="swal2-textarea"
        placeholder="Describe the issue"
        rows="4"
      ></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !window.Swal.isLoading(),
    focusConfirm: false,

    preConfirm: async () => {
      const orderId = document.getElementById('support-order-id').value.trim();
      const description = document
        .getElementById('support-description')
        .value.trim();

      if (!orderId) {
        window.Swal.showValidationMessage('Order ID is required');
        return false;
      }

      if (!description) {
        window.Swal.showValidationMessage('Description is required');
        return false;
      }

      try {
        const response = await apiCall.post(
          window.Config.links.swiggyContactSupport,
          {
            store_id: window.storeDetails.store_id,
            order_id,
            description,
          },
          {
            headers: getHeadersformposforrender(),
          },
        );
      } catch (err) {
        window.Swal.showValidationMessage(
          err?.responseJSON?.message || 'Failed to contact support',
        );
        return false;
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      window.Swal.fire({
        icon: 'success',
        title: 'Submitted',
        text: 'Support request submitted successfully',
      });
    }
  });
}

function formatDateTime(value) {
  const d = new Date(value);

  const pad = (n) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:00`;
}

function showMaskedPhonePopup({ maskedPhone, pin }) {
  Swal.fire({
    icon: 'success',
    title: 'Customer Phone Masked',

    html: `
      <div class="masked-phone-container">
        <p class="label">Masked Phone Number:</p>
        <p class="value">${maskedPhone}</p>

        <p class="label mt-2">PIN:</p>
        <p class="value">${pin}</p>
      </div>
    `,

    confirmButtonText: 'OK',

    allowOutsideClick: false,
    allowEscapeKey: false,

    customClass: {
      popup: 'masked-phone-popup',
      confirmButton: 'masked-phone-ok-btn',
    },
  });
}

async function maskCustomerPhone(params) {
  try {
    const response = await apiCall.post(
      window.Config.links.swiggyContactMasking,
      {
        store_id: window.storeDetails.store_id,
        order_id: params.order_id,
        platform_id: params.platform_id,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (response && response.data && response.data.status === 200) {
      const maskdata = response.data.data.data;

      //       {
      //     "number": "08048247200",
      //     "pin": "262353"
      // }
      showMaskedPhonePopup({ maskedPhone: maskdata.number, pin: maskdata.pin });
    }
    console.log('response::', response);
  } catch (error) {
    console.error(error);
  }
}

async function editSwiggyOrder(params) {
  try {
    const response = await apiCall.post(
      window.Config.links.swiggyEditOrder,
      {
        rejected_item_ids: params.items,
        next_available_time: params.outOfStockAt,
        store_id: window.storeDetails.store_id,
        order_id: params.order_id,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (response && response.data && response.data.status === 200) {
      window.notifyUser.showMessage('success', response.data.message);
    }
  } catch (error) {
    console.error(error);
  }
}

async function showOutOfStockItemsPopup({ items, order_id }) {
  const html = `
    

    <div style="max-height:220px; overflow-y:auto;">
      ${items
        .map(
          (item) => `
          <label style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <input 
              type="checkbox" 
              class="outofstock-item swal2-checkbox" 
              data-short_code="${item.short_code}"
              value="${item.item_id}"
              id="item_${item.item_id}"
            />
            <label for="item_${item.item_id}">${item.title}</label>
          </label>
        `,
        )
        .join('')}
    </div>
 <div style="text-align:left; font-weight:600; margin-top:30px;">
    Next Available Time
  </div>
    <div style="margin-bottom:12px;">
      <input 
        type="datetime-local"
        id="outofstock-datetime"
        class="swal2-input"
        style="height:43px"
      />
    </div>
  `;

  const result = await Swal.fire({
    title: 'Select out-of-stock items',
    html,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Cancel Order',
    cancelButtonText: 'Close',
    customClass: {
      cancelButton: 'swiggy-reject-online-order-btn-cancel',
    },
    preConfirm: () => {
      const checkedItems = Array.from(
        document.querySelectorAll('.outofstock-item:checked'),
      ).map((el) => `${el.value}::${$(el).data('short_code')}`);

      if (!checkedItems.length) {
        Swal.showValidationMessage('Please select at least one item');
        return false;
      }

      const dateTimeInput = document.getElementById(
        'outofstock-datetime',
      ).value;

      if (!dateTimeInput) {
        Swal.showValidationMessage('Please select date & time');
        return false;
      }

      // Convert to "YYYY-MM-DD HH:mm:ss"
      const formattedDateTime = dateTimeInput
        .replace('T', ':00 ')
        .replace(':', ' ');

      return {
        items: checkedItems,
        outOfStockAt: formatDateTime(dateTimeInput),
      };
    },
    didOpen: () => {
      const select = window.Swal.getInput();
      const actions = window.Swal.getActions();

      const supportBtn = document.createElement('button');
      supportBtn.innerText = 'Edit order';
      supportBtn.className = 'swal2-styled swal2-deny swiggy-edit-order-button';

      supportBtn.onclick = () => {
        window.Swal.close();
        const checkedItems = Array.from(
          document.querySelectorAll('.outofstock-item:checked'),
        ).map((el) => `${el.value}::${$(el).data('short_code')}`);

        const dateTimeInput = document.getElementById(
          'outofstock-datetime',
        ).value;

        const payload = {
          items: checkedItems,
          outOfStockAt: dateTimeInput ? formatDateTime(dateTimeInput) : null,
          order_id,
        };

        window.Swal.close();

        console.log('Support button payload:', payload);

        editSwiggyOrder(payload);
      };

      actions.prepend(supportBtn);
    },
  });

  return result;
}

async function getPlatformCatalogueitems() {
  const platformCatalogueitems = [];
  const platformCatalogueCategories = [];

  if (window.platformMappingDetails && window.platformMappingDetails.length) {
    window.platformMappingDetails.forEach(async (platform) => {
      const axiosResponse = await apiCall.post(
        window.Config.links.getPlatformCatalogue,
        {
          store_id: window.storeDetails.store_id,
          platform_store_id: platform.platform_store_id,
          platform: platform.platform,
        },
        {
          headers: getHeadersformposforrender(),
        },
      );

      const response = axiosResponse.data;
      if (response && response?.result?.items) {
        platformCatalogueitems.push(...response.result.items);
      }
      if (response && response?.result?.category) {
        platformCatalogueCategories.push(...response.result.category);
      }
      if (response && response.result) {
        window.platformCatalogueitems = platformCatalogueitems;
        window.platformCatalogueCategories = platformCatalogueCategories;
      }
    });
  }
}

module.exports = {
  contactSupport,
  showOutOfStockItemsPopup,
  maskCustomerPhone,
  getPlatformCatalogueitems,
};
