function searchTable(kotData) {
  $('#searchTableModal').modal('show');

  const suggestions = [];
  Object.entries(kotData).forEach(([key, value]) => {
    if (!document.querySelector(`#table_${key}`)) {
      return;
    }
    Object.entries(value).forEach(([field, fieldValue]) => {
      suggestions.push({
        key,
        field,
        value: String(fieldValue),
        label:
          field === 'Order_Number'
            ? `${field.replace('_', ' ')} : ${fieldValue} | ${value.Table_Name}`
            : `${field.replace('_', ' ')} : ${fieldValue}`,
      });
    });
  });

  const input = document.getElementById('kotSearch');
  const box = document.getElementById('suggestions');

  setTimeout(() => {
    $('#kotSearch').trigger('focus');
  }, 500);

  input.addEventListener('input', () => {
    const text = input.value.toLowerCase();
    box.innerHTML = '';

    if (!text) return;

    suggestions
      .filter((s) => s.value.toLowerCase().includes(text))
      .forEach((s) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'list-group-item list-group-item-action';
        item.textContent = s.label;

        item.onclick = () => {
          $('#searchTableModal').modal('hide');
          console.log('Selected KEY:', s.key); // 👉 34444
          $('.selected-table-border').removeClass('selected-table-border');

          $(`#table_${s.key}`).click();
        };

        box.appendChild(item);
      });
  });
}

module.exports = {
  searchTable,
};
