// Simple offline expense splitter
// Data browser ke localStorage me save hota hai.

var friends = [];
var expenses = [];
var storageKey = "simpleExpenseSplitterData";

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
  var data = {
    friends: friends,
    expenses: expenses
  };

  localStorage.setItem(storageKey, JSON.stringify(data));
}

function loadData() {
  var savedData = localStorage.getItem(storageKey);

  if (savedData === null) {
    return;
  }

  var data = JSON.parse(savedData);

  if (data.friends) {
    friends = data.friends;
  }

  if (data.expenses) {
    expenses = data.expenses;
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

function renderFriends() {
  var html = "";

  if (friends.length === 0) {
    friendList.innerHTML = '<div class="empty">No friends added yet.</div>';
    return;
  }

  for (var i = 0; i < friends.length; i++) {
    html += '<div class="friend-item">';
    html += '<strong class="friend-name">' + friends[i].name + '</strong>';
    html += '<button class="delete-btn" onclick="deleteFriend(\'' + friends[i].id + '\')">Delete</button>';
    html += '</div>';
  }

  friendList.innerHTML = html;
}

function renderPaidByOptions() {
  var html = "";

  if (friends.length === 0) {
    paidBy.innerHTML = '<option value="">Add friends first</option>';
    return;
  }

  for (var i = 0; i < friends.length; i++) {
    html += '<option value="' + friends[i].id + '">' + friends[i].name + '</option>';
  }

  paidBy.innerHTML = html;
}

function renderSplitCheckboxes() {
  var html = "";

  if (friends.length === 0) {
    splitList.innerHTML = '<div class="empty">Friends add karne ke baad yaha list aayegi.</div>';
    return;
  }

  for (var i = 0; i < friends.length; i++) {
    html += '<label class="check-item">';
    html += '<input type="checkbox" class="splitCheck" value="' + friends[i].id + '" checked>';
    html += '<span>' + friends[i].name + '</span>';
    html += '</label>';
  }

  splitList.innerHTML = html;
}

function calculateBalances() {
  var balances = [];

  for (var i = 0; i < friends.length; i++) {
    balances.push({
      id: friends[i].id,
      name: friends[i].name,
      paid: 0,
      share: 0,
      balance: 0
    });
  }

  for (var j = 0; j < expenses.length; j++) {
    var expense = expenses[j];
    var splitCount = expense.splitBetween.length;
    var onePersonShare = expense.amount / splitCount;

    for (var k = 0; k < balances.length; k++) {
      if (balances[k].id === expense.paidBy) {
        balances[k].paid = balances[k].paid + expense.amount;
      }

      for (var m = 0; m < expense.splitBetween.length; m++) {
        if (balances[k].id === expense.splitBetween[m]) {
          balances[k].share = balances[k].share + onePersonShare;
        }
      }
    }
  }

  for (var n = 0; n < balances.length; n++) {
    balances[n].balance = balances[n].paid - balances[n].share;
  }

  return balances;
}

function renderResult() {
  var total = 0;
  var balances = calculateBalances();
  var html = "";

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
    var className = "";

    if (balances[j].balance > 0) {
      balanceText = "Gets " + showMoney(balances[j].balance);
      className = "positive";
    } else if (balances[j].balance < 0) {
      balanceText = "Pays " + showMoney(Math.abs(balances[j].balance));
      className = "negative";
    } else {
      balanceText = "Settled";
      className = "neutral";
    }

    html += '<div class="balance-item">';
    html += '<div class="balance-name">';
    html += '<strong>' + balances[j].name + '</strong><br>';
    html += '<small>Paid: ' + showMoney(balances[j].paid) + ' | Share: ' + showMoney(balances[j].share) + '</small>';
    html += '</div>';
    html += '<span class="' + className + '">' + balanceText + '</span>';
    html += '</div>';
  }

  balanceList.innerHTML = html;
}

function renderSettlement() {
  var balances = calculateBalances();
  var receiveList = [];
  var payList = [];
  var html = "";

  for (var i = 0; i < balances.length; i++) {
    if (balances[i].balance > 0) {
      receiveList.push({
        name: balances[i].name,
        amount: balances[i].balance
      });
    }

    if (balances[i].balance < 0) {
      payList.push({
        name: balances[i].name,
        amount: Math.abs(balances[i].balance)
      });
    }
  }

  var payIndex = 0;
  var receiveIndex = 0;

  while (payIndex < payList.length && receiveIndex < receiveList.length) {
    var payer = payList[payIndex];
    var receiver = receiveList[receiveIndex];
    var payAmount = Math.min(payer.amount, receiver.amount);

    html += '<div class="settlement-item">';
    html += '<strong>' + payer.name + ' pays ' + receiver.name + '</strong>';
    html += '<span class="negative">' + showMoney(payAmount) + '</span>';
    html += '</div>';

    payer.amount = payer.amount - payAmount;
    receiver.amount = receiver.amount - payAmount;

    if (payer.amount < 0.01) {
      payIndex++;
    }

    if (receiver.amount < 0.01) {
      receiveIndex++;
    }
  }

  if (html === "") {
    settlementList.innerHTML = '<div class="empty">No payment needed.</div>';
  } else {
    settlementList.innerHTML = html;
  }
}

function renderHistory() {
  var html = "";

  if (expenses.length === 0) {
    historyList.innerHTML = '<div class="empty">No expense added yet.</div>';
    return;
  }

  for (var i = expenses.length - 1; i >= 0; i--) {
    var expense = expenses[i];
    var splitNames = "";

    for (var j = 0; j < expense.splitBetween.length; j++) {
      splitNames += getFriendName(expense.splitBetween[j]);

      if (j < expense.splitBetween.length - 1) {
        splitNames += ", ";
      }
    }

    html += '<div class="history-item">';
    html += '<div class="history-text">';
    html += '<strong>' + expense.name + ' - ' + showMoney(expense.amount) + '</strong>';
    html += '<small>Paid by: ' + getFriendName(expense.paidBy) + '</small>';
    html += '<small>Split between: ' + splitNames + '</small>';
    html += '</div>';
    html += '<button class="delete-btn" onclick="deleteExpense(\'' + expense.id + '\')">Delete</button>';
    html += '</div>';
  }

  historyList.innerHTML = html;
}

function renderAll() {
  renderFriends();
  renderPaidByOptions();
  renderSplitCheckboxes();
  renderResult();
  renderSettlement();
  renderHistory();
}

function addFriend(name) {
  name = name.trim();

  if (name === "") {
    message.innerText = "Please enter friend name.";
    return;
  }

  for (var i = 0; i < friends.length; i++) {
    if (friends[i].name.toLowerCase() === name.toLowerCase()) {
      message.innerText = "This friend already exists.";
      return;
    }
  }

  friends.push({
    id: makeId(),
    name: name
  });

  friendInput.value = "";
  message.innerText = "";
  saveData();
  renderAll();
}

function deleteFriend(friendId) {
  var confirmDelete = confirm("Friend delete karne se uske related expenses bhi delete honge. Continue?");

  if (confirmDelete === false) {
    return;
  }

  var newFriends = [];
  var newExpenses = [];

  for (var i = 0; i < friends.length; i++) {
    if (friends[i].id !== friendId) {
      newFriends.push(friends[i]);
    }
  }

  for (var j = 0; j < expenses.length; j++) {
    var expense = expenses[j];
    var friendUsed = false;

    if (expense.paidBy === friendId) {
      friendUsed = true;
    }

    for (var k = 0; k < expense.splitBetween.length; k++) {
      if (expense.splitBetween[k] === friendId) {
        friendUsed = true;
      }
    }

    if (friendUsed === false) {
      newExpenses.push(expense);
    }
  }

  friends = newFriends;
  expenses = newExpenses;
  saveData();
  renderAll();
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
    message.innerText = "Please add friends first.";
    return;
  }

  if (name === "") {
    message.innerText = "Please enter expense name.";
    return;
  }

  if (amount <= 0) {
    message.innerText = "Please enter valid amount.";
    return;
  }

  if (payerId === "") {
    message.innerText = "Please select paid by.";
    return;
  }

  if (splitBetween.length === 0) {
    message.innerText = "Please select at least one friend for split.";
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
  message.innerText = "";
  saveData();
  renderAll();
}

function deleteExpense(expenseId) {
  var newExpenses = [];

  for (var i = 0; i < expenses.length; i++) {
    if (expenses[i].id !== expenseId) {
      newExpenses.push(expenses[i]);
    }
  }

  expenses = newExpenses;
  saveData();
  renderAll();
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
  renderAll();
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
renderAll();
