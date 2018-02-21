var WIN_RE = /\.(\S+) wins the game/g;
var WIN_CONDITION_RE = /\.(\S+) is (?:flatlined|decked)/g;
var TURNS_RE = /\.(?:\S+) started their turn (\d+) with \d+  and \d+ cards in (?:HQ|Grip)/g;
var CLICK_CARD_RE = /\.(\S+) spends  to draw a card/g;
var CLICK_CREDIT_RE = /\.(\S+) spends  to gain 1 /g;
var REBIRTH_RE = /\.(\S+) uses Rebirth to change identities/g;
var deckName = "";
var notes = "";
var getAgendas = function (selector) {
    var agendas = null;
    $(selector).each(function (i, el) {
        var text = $(el).text();
        if (text.indexOf('Agenda') > -1) agendas = parseInt(text);
    });
    // return agendas;
};
var getLogRecord = function (re, str) {
    var records = [];
    var match;
    while ((match = re.exec(str)) !== null) {
        records.push(match);
    }
    return records;
};
var filterLogRecord = function (records, value) {
    return $.grep(records, function (record) {
        return (record[1] === value);
    });
};
var getObj = function (v, k) {
    return 'game[' + k + ']=' + v;
};

function askName(callback, next) {
    var name = prompt("Deck Name");
    if (name != null) {
        deckName = name;
        callback(next);
    }
}

function askNotes(callback) {
    var input = prompt("Notes");
    if (notes != null) {
        notes = input;
    }
    callback();
}

function sendData() {
    var data = getData();
    var params = $.map(data, getObj).join('&');
    console.debug(data);
    request = $.ajax({
        url: window.statsAppUrl,
        type: "post",
        data: data
    });
}

function getData() {
    var runnerIdEl = $('.gameboard .stats:nth-child(1) div:contains(\'Memory\')');
    var playerTop = (runnerIdEl.length === 1) ? 'runner' : 'corp';
    var playerBottom = (playerTop === 'runner') ? 'corp' : 'runner';
    var opponent_identity = $('.gameboard .identity:first .cardname').text();
    var identity = $('.me .identity .cardname').text();
    var messages = $('.messages').text();
    var me = $($('.gameboard h4').get(1)).text();
    var opponent = $($('.gameboard h4').get(0)).text();
    var log = $('.messages').text();
    var winLog = getLogRecord(WIN_RE, log);
    var winConditionLog = getLogRecord(WIN_CONDITION_RE, log);
    var turnsLog = getLogRecord(TURNS_RE, log);
    var clickCardLog = getLogRecord(CLICK_CARD_RE, log);
    var clickCreditLog = getLogRecord(CLICK_CREDIT_RE, log);
    var rebirthLog = getLogRecord(REBIRTH_RE, log);
    var myRebirth = filterLogRecord(rebirthLog, me).length;
    var opponentRebirth = filterLogRecord(rebirthLog, opponent).length;
    var turns = turnsLog.length ? turnsLog[turnsLog.length - 1][1] : 0;
    var win_condition_id = winConditionLog.length ? 'Flatlined' : 'Agenda';
    var win = filterLogRecord(winLog, me).length > 0;
    var data = {
        side: playerBottom,
        hero: me,
        deck: deckName,
        notes: notes,
        date: new Date().toJSON().slice(0, 10).split("-").reverse().join("-"),
        location: 'jinteki',
        opponent: opponent,
        opponent_identity: opponentRebirth ? '' : opponent_identity,
        identity: myRebirth ? '' : identity,
        turns: turns,
        click_cards: filterLogRecord(clickCardLog, me).length,
        click_credits: filterLogRecord(clickCreditLog, me).length,
        win: win,
        win_condition: win_condition_id,
        online: true,
        casual: true
    };
    data[playerTop + '_agendas'] = getAgendas('.gameboard .stats:nth-child(1) div');
    data[playerBottom + '_agendas'] = getAgendas('.gameboard .stats:nth-child(2) div');
    return data;
}

var loggedGame = false;

chrome.storage.sync.get({
    appUrl: '',
    usernames: ''
}, function(items) {
    window.statsAppUrl = items.appUrl;
    window.usernames = items.usernames.split(",");
});

setInterval(function() {
    log = $('.messages');

    if (log) {
        log = log.text();

        if (log) {
            if (!loggedGame) {
                var winLog = getLogRecord(WIN_RE, log);
                if (winLog.length) {
                    var me = $($('.gameboard h4').get(1)).text();
                    var isMe = false;

                    for (let x = 0; x < window.usernames.length; x++) {
                        if (window.usernames[x] == me) {
                            isMe = true;
                        }
                    }

                    if (isMe) {
                        console.log("Logging new game");
                        loggedGame = true;
                        logGame();
                    } else {
                        console.log("Spectated game over");
                        loggedGame = true;
                    }
                }
            }
        } else {
            loggedGame = false;
        }
    }
}, 2000);

function logGame() {
    askName(askNotes, sendData);
}
