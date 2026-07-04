// Offline Expense Splitter
// This file keeps the logic simple so it is easy to understand and explain.

var friends = [];
var expenses = [];
var storageKey = "simpleExpenseSplitterData";

// Form and page elements
var friendForm = document.getElementById("friendForm");
var friendInput = document.getElementById("friendInput");
var friendList = document.getElementById("friendList");

var expenseForm = document.getElementById("expenseForm");
var expenseName = document.getElementById("expenseName");
var expenseAmount = document.getElementById("expenseAmount");
var paidBy = document.getElementById("paidBy");
var splitList = document.getElementById("splitList");
var message = document.getElementById("message");

var totalExpense = document.getElementById("totalExpense");
var balanceList = document.getElementById("balanceList");
var settlementList = document.getElementById("settlementList");
var historyList = document.getElementById("historyList");

var selectAllBtn = document.getElementById("selectAllBtn");
var resetBtn = document.getElementById("resetBtn");

function makeId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

function showMoney(amount) {
  return "Rs. " + Number(amount).toFixed(2);
}

function saveData() {
  var appData = {
    friends: friends,
    expenses: expenses
  };

  localStorage.setItem(storageKey, JSON.stringify(appData));
}

function loadData() {
  var savedData = localStorage.getItem(storageKey);

  if (savedData === null) {
    return;
  }

  var appData = JSON.parse(savedData);

  if (appData.friends) {
    friends = appData.friends;
  }

  if (appData.expenses) {
    expenses = appData.expenses;
  }
}

function getFriendName(friendId) {
  for (var i = 0; i < friends.length; i++) {
    if (friends[i].id === friendId) {
      return friends[i].name;
    }
  }

  return "Unknown";
}

function showMessage(text) {
  message.innerText = text;
}

function clearMessage() {
  message.innerText = "";
}

function showFriends() {
  var friendHtml = "";

  if (friends.length === 0) {
    friendList.innerHTML = '<div class="empty">No friends added yet.</div>';
    return;
  }

  for (var i = 0; i < friends.length; i++) {
    friendHtml += '<div class="friend-item">';
    friendHtml += '<strong class="friend-name">' + friends[i].name + '</strong>';
    friendHtml += '<button class="delete-btn" onclick="deleteFriend(\'' + friends[i].id + '\')">Delete</button>';
    friendHtml += '</div>';
  }

  friendList.innerHTML = friendHtml;
}

function showPaidByOptions() {
  var optionHtml = "";

  if (friends.length === 0) {
    paidBy.innerHTML = '<option value="">Add friends first</option>';
    return;
  }

  for (var i = 0; i < friends.length; i++) {
    optionHtml += '<option value="' + friends[i].id + '">' + friends[i].name + '</option>';
  }

  paidBy.innerHTML = optionHtml;
}

function showSplitOptions() {
  var checkboxHtml = "";

  if (friends.length === 0) {
    splitList.innerHTML = '<div class="empty">Friends add karne ke baad yaha list aayegi.</div>';
    return;
  }

  for (var i = 0; i < friends.length; i++) {
    checkboxHtml += '<label class="check-item">';
    checkboxHtml += '<input type="checkbox" class="splitCheck" value="' + friends[i].id + '" checked>';
    checkboxHtml += '<span>' + friends[i].name + '</span>';
    checkboxHtml += '</label>';
  }

  splitList.innerHTML = checkboxHtml;
}

function calculateBalances() {
  var balances = [];

  // First create a blank balance record for every friend.
  for (var i = 0; i < friends.length; i++) {
    balances.push({
      id: friends[i].id,
      name: friends[i].name,
      paid: 0,
      share: 0,
      balance: 0
    });
  }

  // Then add paid amount and share amount from every expense.
  for (var j = 0; j < expenses.length; j++) {
    var currentExpense = expenses[j];
    var splitCount = currentExpense.splitBetween.length;
    var oneFriendShare = currentExpense.amount / splitCount;

    for (var k = 0; k < balances.length; k++) {
      if (balances[k].id === currentExpense.paidBy) {
        balances[k].paid = balances[k].paid + currentExpense.amount;
      }

      for (var m = 0; m < currentExpense.splitBetween.length; m++) {
        if (balances[k].id === currentExpense.splitBetween[m]) {
          balances[k].share = balances[k].share + oneFriendShare;
        }
      }
    }
  }

  // Final balance = total paid - actual share.
  for (var n = 0; n < balances.length; n++) {
    balances[n].balance = balances[n].paid - balances[n].share;
  }

  return balances;
}

function showResult() {
  var total = 0;
  var balances = calculateBalances();
  var resultHtml = "";

  for (var i = 0; i < expenses.length; i++) {
    total = total + expenses[i].amount;
  }

  totalExpense.innerText = showMoney(total);

  if (friends.length === 0) {
    balanceList.innerHTML = '<div class="empty">Result yaha show hoga.</div>';
    return;
  }

  for (var j = 0; j < balances.length; j++) {
    var balanceText = "";
    var colorClass = "";

    if (balances[j].balance > 0) {
      balanceText = "Gets " + showMoney(balances[j].balance);
      colorClass = "positive";
    } else if (balances[j].balance < 0) {
      balanceText = "Pays " + showMoney(Math.abs(balances[j].balance));
      colorClass = "negative";
    } else {
      balanceText = "Settled";
      colorClass = "neutral";
    }

    resultHtml += '<div class="balance-item">';
    resultHtml += '<div class="balance-name">';
    resultHtml += '<strong>' + balances[j].name + '</strong><br>';
    resultHtml += '<small>Paid: ' + showMoney(balances[j].paid) + ' | Share: ' + showMoney(balances[j].share) + '</small>';
    resultHtml += '</div>';
    resultHtml += '<span class="' + colorClass + '">' + balanceText + '</span>';
    resultHtml += '</div>';
  }

  balanceList.innerHTML = resultHtml;
}

function showSettlement() {
  var balances = calculateBalances();
  var receivers = [];
  var payers = [];
  var settlementHtml = "";

  for (var i = 0; i < balances.length; i++) {
    if (balances[i].balance > 0) {
      receivers.push({
        name: balances[i].name,
        amount: balances[i].balance
      });
    }

    if (balances[i].balance < 0) {
      payers.push({
        name: balances[i].name,
        amount: Math.abs(balances[i].balance)
      });
    }
  }

  var payerIndex = 0;
  var receiverIndex = 0;

  while (payerIndex < payers.length && receiverIndex < receivers.length) {
    var payer = payers[payerIndex];
    var receiver = receivers[receiverIndex];
    var amountToPay = Math.min(payer.amount, receiver.amount);

    settlementHtml += '<div class="settlement-item">';
    settlementHtml += '<strong>' + payer.name + ' pays ' + receiver.name + '</strong>';
    settlementHtml += '<span class="negative">' + showMoney(amountToPay) + '</span>';
    settlementHtml += '</div>';

    payer.amount = payer.amount - amountToPay;
    receiver.amount = receiver.amount - amountToPay;

    if (payer.amount < 0.01) {
      payerIndex++;
    }

    if (receiver.amount < 0.01) {
      receiverIndex++;
    }
  }

  if (settlementHtml === "") {
    settlementList.innerHTML = '<div class="empty">No payment needed.</div>';
  } else {
    settlementList.innerHTML = settlementHtml;
  }
}

function showHistory() {
  var historyHtml = "";

  if (expenses.length === 0) {
    historyList.innerHTML = '<div class="empty">No expense added yet.</div>';
    return;
  }

  for (var i = expenses.length - 1; i >= 0; i--) {
    var currentExpense = expenses[i];
    var splitNames = "";

    for (var j = 0; j < currentExpense.splitBetween.length; j++) {
      splitNames += getFriendName(currentExpense.splitBetween[j]);

      if (j < currentExpense.splitBetween.length - 1) {
        splitNames += ", ";
      }
    }

    historyHtml += '<div class="history-item">';
    historyHtml += '<div class="history-text">';
    historyHtml += '<strong>' + currentExpense.name + ' - ' + showMoney(currentExpense.amount) + '</strong>';
    historyHtml += '<small>Paid by: ' + getFriendName(currentExpense.paidBy) + '</small>';
    historyHtml += '<small>Split between: ' + splitNames + '</small>';
    historyHtml += '</div>';
    historyHtml += '<button class="delete-btn" onclick="deleteExpense(\'' + currentExpense.id + '\')">Delete</button>';
    historyHtml += '</div>';
  }

  historyList.innerHTML = historyHtml;
}

function refreshPage() {
  showFriends();
  showPaidByOptions();
  showSplitOptions();
  showResult();
  showSettlement();
  showHistory();
}

function addFriend(name) {
  name = name.trim();

  if (name === "") {
    showMessage("Please enter friend name.");
    return;
  }

  for (var i = 0; i < friends.length; i++) {
    if (friends[i].name.toLowerCase() === name.toLowerCase()) {
      showMessage("This friend already exists.");
      return;
    }
  }

  friends.push({
    id: makeId(),
    name: name
  });

  friendInput.value = "";
  clearMessage();
  saveData();
  refreshPage();
}

function deleteFriend(friendId) {
  var confirmDelete = confirm("Friend delete karne se uske related expenses bhi delete honge. Continue?");

  if (confirmDelete === false) {
    return;
  }

  var updatedFriends = [];
  var updatedExpenses = [];

  for (var i = 0; i < friends.length; i++) {
    if (friends[i].id !== friendId) {
      updatedFriends.push(friends[i]);
    }
  }

  for (var j = 0; j < expenses.length; j++) {
    var currentExpense = expenses[j];
    var friendFoundInExpense = false;

    if (currentExpense.paidBy === friendId) {
      friendFoundInExpense = true;
    }

    for (var k = 0; k < currentExpense.splitBetween.length; k++) {
      if (currentExpense.splitBetween[k] === friendId) {
        friendFoundInExpense = true;
      }
    }

    if (friendFoundInExpense === false) {
      updatedExpenses.push(currentExpense);
    }
  }

  friends = updatedFriends;
  expenses = updatedExpenses;
  saveData();
  refreshPage();
}

function addExpense() {
  var name = expenseName.value.trim();
  var amount = Number(expenseAmount.value);
  var payerId = paidBy.value;
  var checkedBoxes = document.getElementsByClassName("splitCheck");
  var splitBetween = [];

  for (var i = 0; i < checkedBoxes.length; i++) {
    if (checkedBoxes[i].checked === true) {
      splitBetween.push(checkedBoxes[i].value);
    }
  }

  if (friends.length === 0) {
    showMessage("Please add friends first.");
    return;
  }

  if (name === "") {
    showMessage("Please enter expense name.");
    return;
  }

  if (amount <= 0) {
    showMessage("Please enter valid amount.");
    return;
  }

  if (payerId === "") {
    showMessage("Please select paid by.");
    return;
  }

  if (splitBetween.length === 0) {
    showMessage("Please select at least one friend for split.");
    return;
  }

  expenses.push({
    id: makeId(),
    name: name,
    amount: amount,
    paidBy: payerId,
    splitBetween: splitBetween
  });

  expenseName.value = "";
  expenseAmount.value = "";
  clearMessage();
  saveData();
  refreshPage();
}

function deleteExpense(expenseId) {
  var updatedExpenses = [];

  for (var i = 0; i < expenses.length; i++) {
    if (expenses[i].id !== expenseId) {
      updatedExpenses.push(expenses[i]);
    }
  }

  expenses = updatedExpenses;
  saveData();
  refreshPage();
}

function selectAllFriends() {
  var checkedBoxes = document.getElementsByClassName("splitCheck");

  for (var i = 0; i < checkedBoxes.length; i++) {
    checkedBoxes[i].checked = true;
  }
}

function resetApp() {
  var confirmReset = confirm("Are you sure? All data will be deleted.");

  if (confirmReset === false) {
    return;
  }

  friends = [];
  expenses = [];
  localStorage.removeItem(storageKey);
  clearMessage();
  refreshPage();
}

friendForm.addEventListener("submit", function(event) {
  event.preventDefault();
  addFriend(friendInput.value);
});

expenseForm.addEventListener("submit", function(event) {
  event.preventDefault();
  addExpense();
});

selectAllBtn.addEventListener("click", function() {
  selectAllFriends();
});

resetBtn.addEventListener("click", function() {
  resetApp();
});

loadData();
refreshPage();
