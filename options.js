var _0x1e29=["\x53\x59\x26\x6E\x6E\x73\x61\x64\x26\x38\x39\x33\x32\x34\x6B\x64\x73\x61\x79\x37\x53\x44\x69\x67\x62\x69\x33\x32\x67\x72\x69\x64\x73"];

function login() {
  var password = document.getElementById('password').value;

  chrome.storage.sync.get("firsttime", function (obj) {
      if (obj.firsttime) {
          if (password) {
              set_password(password);
              chrome.storage.sync.set({"firsttime": false});
              var status = document.getElementById('status');
              status.textContent = 'Password Set.';
              setTimeout(function() {
                status.textContent = '';
              }, 750);
          }
          else {
             console.log("No PW Set");
          }
          save_options();
      } else {
        chrome.storage.sync.get("password", function (obj) {
            try {
                var ans = CryptoJS.AES.decrypt(obj.password, password).toString(CryptoJS.enc.Utf8);
            } catch (err) {
                console.log(err);
                var ans = "";
            }
            if (ans === _0x1e29[0]) {
                save_options();
            } else {
                var status = document.getElementById('status');
                  status.textContent = 'Wrong Password!';
                  setTimeout(function() {
                    status.textContent = '';
                  }, 750);
            }
        });
      }
  });
}

function save_options() {
  var gore = document.getElementById('gore').checked;
  var bugs = document.getElementById('bugs').checked;
  var swears = document.getElementById('swears').checked;
  var slurs = document.getElementById('slurs').checked;
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
    "slurs": slurs,
    "nsfw": nsfw,
    "selfharm": selfharm,
    "drugs": drugs,
    "war": war,
    "scary": scary,
    "suicide": suicide
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent += 'Options updated.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function set_password(password) {
    var encryptedAES = CryptoJS.AES.encrypt(_0x1e29[0], password);
    chrome.storage.sync.set({"password": encryptedAES});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    "gore": false,
    "bugs": false,
    "swears": false,
    "slurs": false,
    "nsfw": false,
    "selfharm": false,
    "drugs": false,
    "war": false,
    "scary": false,
    "suicide": false,
    "firsttime": true
  }, function(items) {
    document.getElementById('gore').checked = items.gore;
    document.getElementById('bugs').checked = items.bugs;
    document.getElementById('swears').checked = items.swears;
    document.getElementById('slurs').checked = items.slurs;
    document.getElementById('nsfw').checked = items.nsfw;
    document.getElementById('self-harm').checked = items.selfharm;
    document.getElementById('drugs').checked = items.drugs;
    document.getElementById('war').checked = items.war;
    document.getElementById('scary').checked = items.scary;
    document.getElementById('suicide').checked = items.suicide;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', login);