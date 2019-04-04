
const db = firebase.database();
var allPersons = [];
var displayPersons = [];
var sortField = null;
var isDescSort = false;
var filter = '';
var currentPage = 0;
var displayPagesCount = 0;
const rowsOnPage = 5;
const maxDisplayPages = 10;

const personFields = ['firstName','lastName','city','age'];

let personRef = db.ref('person');
var createInputFirstName = $('#firstNameCreateInput');
var createInputLastName = $('#lastNameCreateInput');
var createInputAge = $('#ageCreateInput');
var createInputCity = $('#cityCreateInput');

var updateInputFirstName = $('#firstNameUpdateInput');
var updateInputLastName = $('#lastNameUpdateInput');
var updateInputAge = $('#ageUpdateInput');
var updateInputCity = $('#cityUpdateInput');
var updateInputKey = $('#keyUpdateInput');

personRef.on('child_added', function(data) {
    let newPerson = data.val();
    newPerson.key = data.key;
    allPersons.push(newPerson);
    refresh();
});

personRef.on('child_changed', function(data) {
    let newPerson = data.val();
    newPerson.key = data.key;
    let foundIndex = allPersons.findIndex(function (item, index, array) {
        return item.key === data.key;
    });
    if(foundIndex !== -1)
    {
        allPersons[foundIndex] = newPerson;
    }
    refresh();
});

personRef.on('child_removed', function(data) {
    allPersons = allPersons.filter(function(item, index, arr){
        return item.key !== data.key;
    });
    refresh();
});
function init() {
    filterBy();
    sortByField();
    renderWidget();
}
function onClickCreatePerson()
{
    let firstName = createInputFirstName.val();
    let lastName = createInputLastName.val();
    let age = createInputAge.val();
    let city = createInputCity.val();
    if(firstName === '' || lastName === '' || age === '' || city === '')
        return;
    createPerson(firstName,lastName,parseInt(age),city);

    $('#closeAddRowModal').click();

    createInputFirstName.val('');
    createInputLastName.val('');
    createInputAge.val('');
    createInputCity.val('');

}
function createPerson(firstName, lastName, age, city) {
    let newUser = {
        firstName : firstName,
        lastName: lastName,
        age : age,
        city: city
    };
    db.ref('person').push(newUser);
}
function onClickUpdatePerson(index) {
    $('#updateButton').click();
    updateInputFirstName.val(displayPersons[index].firstName);
    updateInputLastName.val(displayPersons[index].lastName);
    updateInputAge.val(displayPersons[index].age);
    updateInputCity.val(displayPersons[index].city);
    updateInputKey.val(displayPersons[index].key);
}

function onClickUpdateSavePerson() {
    let firstName = updateInputFirstName.val();
    let lastName = updateInputLastName.val();
    let age = updateInputAge.val();
    let city = updateInputCity.val();
    let key = updateInputKey.val();

    if(firstName === '' || lastName === '' || age === '' || city === '')
        return;
    updatePerson(key,firstName,lastName,parseInt(age),city);

    $('#closeUpdateRowModal').click();

    updateInputFirstName.val('');
    updateInputLastName.val('');
    updateInputAge.val('');
    updateInputCity.val('');
}
function updatePerson(key,firstName, lastName, age, city)
{
    let newUser = {
        firstName : firstName,
        lastName: lastName,
        age : age,
        city: city
    };

    db.ref('person/'+key).set(newUser);
}

function onClickDeletePerson() {
    let selected = [];

    $("input:checkbox[name=type]:checked").each(function() {
        selected.push($(this).val());
    });
    selected.forEach(function (value) {
        deletePerson(value);
    })
    $('#closeDeleteRowsModalModal').click();
}
function deletePerson(key)
{
    db.ref('person/'+key).remove();
}

function renderWidget()
{
    let container = $('#datatable');
    container.html('');
    let searchDiv = $('<div class="form-group row" style="margin: 20px 0px 10px 10px">')
    searchDiv.append('<label for="searchInput" class="col-sm-1 col-form-label">Search</label>');
    searchDiv.append(
        $('<div class="col-sm-4">').append(
            $('<input id="searchInput" class="form-control" onchange="onClickFilter()">').val(filter)
        )
    );
    container.append(searchDiv);
    let tableHtml = $('<table class="table table-striped">');
    let header = $('<tr>');
    header.append($('<th>').html('<i class="fas fa-trash"></i>'));
    header.append($('<th>').html('<i class="fas fa-edit"></i>'));
    header.append($('<th>').text('№'));
    for(let i =0;i<personFields.length;i++)
    {
        let a = $('<a href="#">').click(onClickSortByField).text(personFields[i]);
        if(personFields[i] === sortField)
        {
            a = $('<b>').append(a).append(isDescSort?' <i class="fas fa-long-arrow-alt-down"></i>':' <i class="fas fa-long-arrow-alt-up"></i>');
        }else{
            a = $('<span>').append(a).append(' <i class="fas fa-arrows-alt-v" style="color: rgba(133,133,133,0.31)"></i>');
        }
        header.append($('<th>').append(a))
    }
    tableHtml.append(header);
    let firstDisplayI = (currentPage) * rowsOnPage;
    let lastDisplayI = ((currentPage) * rowsOnPage + rowsOnPage < displayPersons.length)? (currentPage) * rowsOnPage + rowsOnPage: displayPersons.length;
    for(let i =  firstDisplayI;i<lastDisplayI;i++)
    {
        let rowHtml = $('<tr>');
        rowHtml.append($('<td>').html('<input type="checkbox" name="type" value="'+displayPersons[i].key+'" />'));
        rowHtml.append($('<td>').append($('<a href="#" class="fas fa-pen">').click(function (){onClickUpdatePerson(i)})));
        rowHtml.append($('<td>').text(i));
        for(let j =0;j<personFields.length;j++)
        {
            rowHtml.append(
                $('<td>').text(displayPersons[i][personFields[j]])
            );
        }
        rowHtml.append( $('<td id="key' + i + '" hidden>').text(displayPersons[i].key));
        tableHtml.append(rowHtml);
    }

    container.append(tableHtml);
    let pagination = $('<div class="col-md-12" style="margin: 10px">');
    let allPagesCount = Math.ceil((displayPersons.length ) / rowsOnPage);
    displayPagesCount = (allPagesCount > maxDisplayPages)? maxDisplayPages : allPagesCount;
    let firstDisplayPage = 0;
    let lastDisplayPage = displayPagesCount;
    if(allPagesCount > maxDisplayPages)
    {
        if(currentPage - Math.trunc(maxDisplayPages/2) < 0)
        {
            firstDisplayPage = 0;
            lastDisplayPage = maxDisplayPages;
        }
        else if(currentPage + Math.trunc(maxDisplayPages/2) > allPagesCount)
        {
            firstDisplayPage = allPagesCount - 10;
            lastDisplayPage = allPagesCount;
        }else{
            firstDisplayPage = currentPage - Math.trunc(maxDisplayPages/2);
            lastDisplayPage = currentPage + Math.trunc(maxDisplayPages/2);
        }
    }
    for(let i = firstDisplayPage;i<lastDisplayPage;i++)
    {
        let enable = 'enable';
        if(i === currentPage)
            enable = 'disabled';
        let button = $('<button ' + enable +' class="btn btn-sm btn-info" style="margin: 2px 10px 10px 0px; width: 40px; height: 40px;">').text(i+1);
        button.click(switchPage);
        pagination.append(button);
    }
    container.append(pagination);
    let controlPanel = $('<div style="margin: 10px 20px 10px 20px">');
    controlPanel.append($('<button  type="button" class="btn btn-primary" data-toggle="modal" data-target="#addRowModal" style=" color: white">').text('Create'));
    controlPanel.append($('<button class="btn btn-danger" data-toggle="modal" data-target="#deleteRowsModal" style=" margin-left: 10px ;">').text('Delete Selected'));
    controlPanel.append($('<button class="btn btn-info" style=" margin-left: 10px ;">').text('Refresh').click(refresh));
    controlPanel.append($('<button hidden id="updateButton" data-toggle="modal" data-target="#updateRowModal">').text('Update'));
    container.append(controlPanel);

}
function refresh() {
    filterBy();
    sortByField();
    renderWidget();
}
function switchPage()
{
    currentPage = parseInt(this.innerText) - 1;
    renderWidget();
}
function onClickSortByField()
{
    let oldSortField = sortField;
    sortField = this.innerText;
    if(oldSortField === sortField) {
        isDescSort = !isDescSort;
    }else{
        isDescSort = false;
    }
    sortByField();
    renderWidget();
}
function sortByField()
{
    if(sortField !== null)
    {
        if(typeof allPersons[0][sortField] === "number")
        {
            if(isDescSort)
            {
                displayPersons = displayPersons.sort(function (a,b) {
                    return a[sortField] - b[sortField];
                });
            }else{
                displayPersons = displayPersons.sort(function (a,b) {
                    return b[sortField] - a[sortField];
                });
            }

        }else{
            if(isDescSort)
            {
                displayPersons = displayPersons.sort(function (a,b) {
                    return -a[sortField].localeCompare(b[sortField])
                });
            }else{
                displayPersons = displayPersons.sort(function (a,b) {

                    return a[sortField].localeCompare(b[sortField])
                });
            }

        }

    }
}
function onClickFilter()
{
    filter = $('#searchInput').val();
    console.log(filter);
    filterBy();
    renderWidget();
}
function filterBy()
{
    if(filter !== '')
    {
        displayPersons = allPersons.filter(function (value) {
            return value.city.indexOf(filter) !== -1
                || value.firstName.indexOf(filter) !== -1
                || value.lastName.indexOf(filter) !== -1
                || (value.age+'').indexOf(filter) !== -1
        });
    }else
        displayPersons = allPersons.slice(0);
}
