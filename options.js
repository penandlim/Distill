function save_options() {
  var gore = document.getElementById('gore').checked;
  var bugs = document.getElementById('bugs').checked;
  var swears = document.getElementById('swears').checked;
  var nsfw = document.getElementById('nsfw').checked;
  var selfharm = document.getElementById('self-harm').checked;
  var drugs = document.getElementById('drugs').checked;
  var war = document.getElementById('war').checked;
  var scary = document.getElementById('scary').checked;
  var suicide = document.getElementById('suicide').checked;
  chrome.storage.sync.set({
    "gore": gore,
    "bugs": bugs,
    "swears": swears,
    "nsfw": nsfw,
    "selfharm": selfharm,
    "drugs": drugs,
    "war": war,
    "scary": scary,
    "suicide": suicide
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
    "gore": false,
    "bugs": false,
    "swears": false,
    "nsfw": false,
    "selfharm": false,
    "drugs": false,
    "war": false,
    "scary": false,
    "suicide": false
  }, function(items) {
    document.getElementById('gore').checked = items.gore;
    document.getElementById('bugs').checked = items.bugs;
    document.getElementById('swears').checked = items.swears;
    document.getElementById('nsfw').checked = items.nsfw;
    document.getElementById('self-harm').checked = items.selfharm;
    document.getElementById('drugs').checked = items.drugs;
    document.getElementById('war').checked = items.war;
    document.getElementById('scary').checked = items.scary;
    document.getElementById('suicide').checked = items.suicide;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
