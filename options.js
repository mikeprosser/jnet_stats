// Saves options to chrome.storage
function save_options() {
  var appUrl = document.getElementById('app-url').value;
  var usernames = document.getElementById('usernames').value;
  chrome.storage.sync.set({
    appUrl: appUrl,
    usernames: usernames
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    appUrl: '',
    usernames: ''
  }, function(items) {
    document.getElementById('app-url').value = items.appUrl;
    document.getElementById('usernames').value = items.usernames;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);