const registerSw = async () => {
    if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.register('/static/js/sw.js');
        initialiseState(reg)

    } else {
        //showNotAllowed("You can't send push notifications ☹️😢")
        console.log("You can't send push notifications")
    }
};

const initialiseState = (reg) => {
    if (!reg.showNotification) {
        showNotAllowed('Showing notifications isn\'t supported ☹️😢');
        return
    }
    if (Notification.permission === 'denied') {
        showNotAllowed('You prevented us from showing notifications ☹️🤔');
        return
    }
    if (!'PushManager' in window) {
        showNotAllowed("Push isn't allowed in your browser 🤔");
        return
    }
    subscribe(reg);
}

const showNotAllowed = (message) => {
    const button = document.querySelector('form>button');
    button.innerHTML = `${message}`;
    button.setAttribute('disabled', 'true');
};

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    const outputData = outputArray.map((output, index) => rawData.charCodeAt(index));

    return outputData;
}

const subscribe = async (reg) => {
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
        sendSubData(subscription);
        return;
    }

    const vapidMeta = document.querySelector('meta[name="vapid-key"]');
    const key = vapidMeta.content;
    const options = {
        userVisibleOnly: true,
        // if key exists, create applicationServerKey property
        ...(key && {applicationServerKey: urlB64ToUint8Array(key)})
    };

    const sub = await reg.pushManager.subscribe(options);
    sendSubData(sub)
};

const sendSubData = async (subscription) => {
    // console.log(subscription);
    const browser = navigator.userAgent.match(/(firefox|msie|chrome|safari|trident)/ig)[0].toLowerCase();
    // console.log(browser);
    const data = {
        status_type: 'subscribe',
        subscription: subscription.toJSON(),
        browser: browser,
        csrfmiddlewaretoken: getCookie('csrftoken'),
    };
    console.log(data)

    const res = await fetch('/webpush/save_information/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'content-type': 'application/json'
        },
        credentials: "include"
    }); 

    handleResponse(res);
};

const handleResponse = (res) => {
    console.log(res.status);
};

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

// using jQuery
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = $.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');

// registerSw();