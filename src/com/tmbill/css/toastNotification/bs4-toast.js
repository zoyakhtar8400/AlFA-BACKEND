/* eslint-disable  */
class bs4Toast {
  static error(title = '', content = '', options = {}) {
    if (options.hasOwnProperty('headerClasses')) {
      options.headerClasses.push('bg-danger');
      options.headerClasses.push('text-white');
    } else {
      options['headerClasses'] = ['bg-danger', 'text-white'];
    }
    this.show(title, content, options);
  }
  static warning(title = '', content = '', options = {}) {
    if (options.hasOwnProperty('headerClasses')) {
      options.headerClasses.push('bg-warning');
      options.headerClasses.push('text-white');
    } else {
      options['headerClasses'] = ['bg-warning', 'text-white'];
    }
    this.show(title, content, options);
  }
  static primary(title = '', content = '', options = {}) {
    if (options.hasOwnProperty('headerClasses')) {
      options.headerClasses.push('bg-primary');
      options.headerClasses.push('text-white');
    } else {
      options['headerClasses'] = ['bg-primary', 'text-white'];
    }
    this.show(title, content, options);
  }
  static show(
    title = '',
    content = '',
    paymentInfo,
    options = {},
    notificationData = {},
  ) {
    // Check active toast counts
    if (bs4Toast.activetoastList.length >= 5) {
      const toasttoRemove = bs4Toast.activetoastList.shift();
      if (toasttoRemove) {
        $(toasttoRemove).toast('hide');
      }
    }

    function addNotificationToDB(notificationData) {
      stopHowler(notificationData);
    }

    let id = 'bs4Toast' + this.active;
    // let delayNumber = 20000;
    let delayNumber = 200000;
    if (options.hasOwnProperty('delay')) {
      delayNumber = options.delay;
    }
    let wrapper = document.createElement('div');
    wrapper.id = id.toString();
    wrapper.classList.add('bs4ToastWrapper');
    wrapper.classList.add('toast');
    let areal_live = document.createAttribute('aria-live');
    let role = document.createAttribute('role');
    let atomic = document.createAttribute('aria-atomic');
    let statedelay = document.createAttribute('data-delay');
    role.value = 'alert';
    areal_live.value = 'assertive';
    atomic.value = 'true';
    statedelay.value = delayNumber.toString();
    wrapper.setAttributeNode(areal_live);
    wrapper.setAttributeNode(role);
    wrapper.setAttributeNode(atomic);
    wrapper.setAttributeNode(statedelay);

    let paymentClassName = '';
    if (paymentInfo) {
      paymentClassName = 'paymentClass' + paymentInfo?.billNo;
      wrapper.classList.add(paymentClassName);
    }

    if (options.table_id) {
      let tableClassName = 'tableClass' + options?.table_id;
      wrapper.classList.add(tableClassName);
    }

    if (options.remote_kot_id) {
      let tableClassName = 'remoteKotClass' + options?.remote_kot_id;
      wrapper.classList.add(tableClassName);
    }

    let headerWrapper = document.createElement('div');
    headerWrapper.classList.add('toast-header');
    if (options.hasOwnProperty('headerClasses')) {
      jQuery.each(options.headerClasses, (e, v) => {
        headerWrapper.classList.add(v);
      });
    }
    let headerText = document.createElement('strong');
    headerText.classList.add('mr-auto');
    headerText.innerHTML = title;

    let closeButton = document.createElement('button');
    closeButton.classList.add('ml-2');
    closeButton.classList.add('mb-1');
    closeButton.classList.add('close');
    closeButton.classList.add('closePaymentNotificationModal');
    if (notificationData) {
      closeButton.onclick = addNotificationToDB;
    } else {
      closeButton.onclick = stopHowler;
    }

    if (!Object.keys(paymentInfo).length) {
      closeButton.classList.add('closeorderNotificationModal');
    }

    let dismissAttr = document.createAttribute('data-dismiss');
    let arialLab = document.createAttribute('aria-label');
    dismissAttr.value = 'toast';
    arialLab.value = 'Close';
    closeButton.setAttributeNode(dismissAttr);
    closeButton.setAttributeNode(arialLab);
    closeButton.innerHTML = '<span aria-hidden="true">&times;</span>';
    wrapper.style.marginTop = this.nextPadding.toString() + 'px';

    let bodyWrapper = document.createElement('div');
    bodyWrapper.classList.add('toast-body');
    if (options.hasOwnProperty('bodyClasses')) {
      jQuery.each(options.bodyClasses, (e, v) => {
        bodyWrapper.classList.add(v);
      });
    }
    bodyWrapper.innerHTML = content;
    if (options.hasOwnProperty('icon')) {
      if (options.icon.hasOwnProperty('type') == false) {
        console.error('bs4Toast : Icon type is missing in Object.');
      } else {
        if (options.icon.type == 'image') {
          let Imgwrapper = document.createElement('img');
          let src = document.createAttribute('src');
          Imgwrapper.classList.add('rounded');
          Imgwrapper.classList.add('mr-2');
          Imgwrapper.classList.add('bs4Toasticonimage');
          src.value = options.icon.src;
          Imgwrapper.setAttributeNode(src);
          headerWrapper.appendChild(Imgwrapper);
          //this.nextPadding += 40;
        } else if (options.icon.type == 'fontawesome') {
          let iwrapper = document.createElement('i');
          iwrapper.classList.add('bs4Toasticon');
          iwrapper.classList.add('fa');
          iwrapper.classList.add(options.icon.class);
          headerWrapper.appendChild(iwrapper);
          //this.nextPadding += 40;
        } else {
          console.error(
            'bs4Toast : Icon type is should be image or fontawesome. Please go through the Docs.',
          );
        }
      }
    }
    headerWrapper.appendChild(headerText);
    headerWrapper.appendChild(closeButton);
    wrapper.appendChild(headerWrapper);

    //show payment info
    if (Object.keys(paymentInfo).length) {
      let paymentWrapper = document.createElement('div');
      // row0.classList.add("row");
      paymentWrapper.classList.add('paymentNotificationwrapper');

      let row0 = document.createElement('div');
      row0.classList.add('row');

      let row0col1 = document.createElement('div');
      row0col1.classList.add('col-7');
      row0col1.innerHTML = `Table - ${paymentInfo.table}`;

      let row0col2 = document.createElement('div');
      row0col2.classList.add('col-5');
      row0col2.innerHTML = `Amount - ${paymentInfo.amount}`;

      row0.appendChild(row0col1);
      row0.appendChild(row0col2);

      let row1 = document.createElement('div');
      row1.classList.add('row');

      let row1col1 = document.createElement('div');
      row1col1.classList.add('col-7');
      row1col1.innerHTML = `Bill No - ${paymentInfo.billNo}`;

      row1.appendChild(row1col1);

      paymentWrapper.appendChild(row0);
      paymentWrapper.appendChild(row1);
      wrapper.appendChild(paymentWrapper);
    }
    // else{
    //     console.log('else payment mode')
    //     let element = document.getElementsByClassName("btn viweNotification settleButton");
    //     // element.remove();
    //     console.log("element::",element)
    //     element.style.display = 'none';
    // }

    let hr = document.createElement('hr');
    if (options.hasOwnProperty('buttons')) {
      let p = document.createElement('span');
      p.style.display = 'block';
      p.style.marginTop = '10px';
      p.classList.add('toast-actions');

      jQuery.each(options.buttons, (e, v) => {
        let button = document.createElement('button');
        button.innerHTML = v.text;
        v.class.split(' ').forEach((e) => {
          button.classList.add(e);
        });

        // let callCallback = v.callback.bind(this)
        button.onclick = () => v.callback(id);

        p.appendChild(button);
      });
      bodyWrapper.appendChild(p);
    }
    wrapper.appendChild(bodyWrapper);
    this.nextPadding += 100;
    document.body.prepend(wrapper);
    $('#' + id).toast('show');
    $('#' + id).on('hidden.bs.toast', () => {
      $('#' + id).remove();
      $('*.bs4ToastWrapper').each((e, y) => {
        let sel = $('#' + y.id);
        let marhing = parseInt(sel.css('margin-top').slice(0, -2).trim());
        let neMargin = marhing - 100;
        sel.css('margin-top', neMargin + 'px');
      });
      this.nextPadding -= 100;
    });
    this.active++;
    bs4Toast.activetoastList.push('#' + id);

    return false;
  }
}
bs4Toast.nextPadding = 10;
bs4Toast.active = 0;
bs4Toast.activetoastList = [];
//# sourceMappingURL=bs4-toast.js.map
