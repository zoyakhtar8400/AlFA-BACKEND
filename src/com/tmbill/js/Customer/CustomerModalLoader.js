window.ensureCustomerModalLoaded = function () {
  if ($('#customerFormModal').length) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    $('body').append(`
      <div class="modal fade" id="customerFormModal" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div id="customerFormBodyid"></div>
          </div>
        </div>
      </div>
    `);

    $('#customerFormBodyid').load('Customers/customers.html', () => {
      resolve();
    });
  });
};
