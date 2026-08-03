const { apiCall } = require("../../services/APIService");
const { getHeadersformposforrender } = require("../../util/MiscServer.renderer");

async function sendOrderrbtupdate({  order_id, rbt,
    store_id, is_rider_wearing_mask }) {
    try {
        let options = {
            store_id, order_id, rbt, is_rider_wearing_mask
        }
        let uprequestResponse = await apiCall.post(Config.links.updateChannelRiderStatus, options, {
            headers: getHeadersformposforrender()
        });
        if (uprequestResponse) {
            window.notifyUser.showMessage('success', uprequestResponse.data.message || "Request is sent.");
        } else {
            window.notifyUser.showMessage('error', $.i18n.t('controller:onlineOrderController.somethingWentWrong'));
        }
        // Swal.close();
    } catch (error) {
        console.log(error);
        if (error && error.message) {
            window.notifyUser.showMessage('error', error.message);
        } else {
            window.notifyUser.showMessage('error', $.i18n.t('controller:onlineOrderController.somethingWentWrong'));
        }

    }
}


async function askforriderBodytemp({ order_id, store_id }) {
    const description = $.i18n.t('controller:onlineOrderController.Note');
    const result = await Swal.fire({
        title: $.i18n.t('controller:onlineOrderController.covid19SafetyRiderBodyTemperature'),
        html:
            `<div class= 'rbt-popup-container' >
            <h6>${description}</h6>
            <input type="text" placeholder="Rider body temperature" id="swal-input1" >
            <label class='masklabel'>Is rider wearing mask?</label>
            <label class="switch">
              <input id="swalridermaskswitchcheckId" type="checkbox" checked>
              <span class="slider round"></span>
            </label>
            </div>`,
        // width: '23em',
        reverseButtons: true,
        text: description,
        // inputValue: inputValue,
        showCancelButton: true,
        confirmButtonText: 'Add',
        preConfirm: () => {
            let value = document.getElementById('swal-input1').value;

            if (!value || isNaN(value) || Number(value) == 0) {
                Swal.showValidationMessage('Invalid temperature');
                return $.i18n.t('controller:onlineOrderController.invalidTemperature');
            }
            return { temperature: value, wearingMask: $('#swalridermaskswitchcheckId').is(':checked') };
        },
        customClass: {
            popup: 'tmbill-swal-pop-up',
            title: 'tmbill-swal-title-class',
            content: 'tmbill-swal-content-class tmbill-swal-number-content-class',
        }
    });

    if (result && result.isConfirmed && result.value.temperature && order_id) {
        Swal.fire({
            title: $.i18n.t('controller:onlineOrderController.updateOrder'),
            text: $.i18n.t('controller:onlineOrderController.updatingOrderStatus'),
            showConfirmButton: false,
            width: '23em',
            allowOutsideClick: false,
            allowEscapeKey: false,
            // showLoaderOnConfirm: true,
            didOpen: async () => {
                Swal.showLoading();
                await sendOrderrbtupdate({
                    rbt: Number(result.value.temperature),
                    temp: Number(result.value.temperature),
                    is_rider_wearing_mask: result.value.wearingMask,
                    order_id,
                    store_id
                });
            },
            customClass: {
                popup: 'tmbill-swal-pop-up',
                title: 'tmbill-swal-title-class',
                content: 'tmbill-swal-title-class',
            }
        });
    }
}

module.exports = {
    askforriderBodytemp
}