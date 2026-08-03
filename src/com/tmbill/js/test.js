const database = require('./src/com/tmbill/model/items');

window.onload = function() {

  // Populate the table
  populateTable();

  // Add the add button click event
  document.getElementById('add').addEventListener('click', () => {

    // Retrieve the input fields
    var item_name = document.getElementById('item_name');
    var item_price = document.getElementById('item_price');

    // Save the person in the database
    database.addItem(item_name.value, item_price.value);

    // Reset the input fields
    item_name.value = '';
    item_price.value = '';

    // Repopulate the table
    populateTable();
  });
}


// Populates the items table
async function populateTable() {

  // Retrieve the items
  database.getItems(function(items) {

    // Generate the table body
    var tableBody = '';
    for (i = 0; i < items.length; i++) {
      tableBody += '<tr>';
      tableBody += '  <td>' + items[i].item_name + '</td>';
      tableBody += '  <td>' + items[i].item_price + '</td>';
      tableBody += '  <td><input type="button" value="Delete" id="delete_item" onclick="deleteItem(\'' + items[i]._id + '\')"></td>'
      tableBody += '</tr>';
    }

    // Fill the table content
    document.getElementById('tablebody').innerHTML = tableBody;
  });
}

// Deletes a
function deleteItem(id) {
  database.deleteItem(id);

  // Repopulate the table
  populateTable();
}