/**
 * Created Kozlov AB
 *
 * Version 5.0.0.0
 */

// Get Elements
var html = null;
var body = null;

// Clear HTML elements
var library_data = {
    empty: {
        div: null
        , img: null
        , form: null
        , input: null
        , textarea: null
    }
    , xhr: null
};

/**
 * Get Height and Width of window
 *
 * @returns {object} - Window sizes in object
 */
function getWindowSizes() {
    return {
        height: window.innerHeight || html.clientHeight || body.clientHeight
        , width: window.innerWidth || html.clientWidth || body.clientWidth
    }
}

/**
 * Add cross browser event to DOM element
 *
 * @param {element/array} element - Element for adding event
 * @param {string/array}  name    - Event name
 * @param {function}      handler - Event handler
 */
function addEvent(element, name, handler) {
    if (isArray(element) ||
        isArray(name)) {

        if (isArray(element)) {
            element.map(function(element_item) {
                if (isArray(name)) {
                    name.map(function(name_item) {
                        addEvent(element_item, name_item, handler);
                    });
                } else {
                    addEvent(element_item, name, handler);
                }
            });
        } else {
            name.map(function(name_item) {
                addEvent(element, name_item, handler);
            });
        }
        return;
    }

    if (name == 'ready') {
        element = document;
        if (element.addEventListener) {
            element.addEventListener('DOMContentLoaded', handler, false);
        } else if (element.attachEvent) {
            element.attachEvent('onreadystatechange', function() {
                if (element.readyState === 'complete' ) {
                    handler();
                }
            });
        }
    } else {
        if ( ! isElement(element)) {
            return;
        }

        if (element.addEventListener) {
            if ( ! name.indexOf('on')) {
                name = name.replace('on', '');
            }
            element.addEventListener(name, handler, false);
        } else if (element.attachEvent) {
            if (name.indexOf('on')) {
                name = 'on' + name;
            }
            element.attachEvent(name, handler);
        }
    }
}

/**
 * Remove cross browser event to DOM element
 *
 * @param {element/array} element - Element for adding event
 * @param {string/array}  name    - Event name
 * @param {function}      handler - Event handler
 */
function removeEvent(element, name, handler) {
    if (isArray(element) ||
        isArray(name)) {

        if (isArray(element)) {
            element.map(function(element_item) {
                if (isArray(name)) {
                    name.map(function(name_item) {
                        removeEvent(element_item, name_item, handler);
                    });
                } else {
                    removeEvent(element_item, name, handler);
                }
            });
        } else {
            name.map(function(name_item) {
                removeEvent(element, name_item, handler);
            });
        }
        return;
    }

    if ( ! isElement(element)) {
        return;
    }

    if (element.addEventListener) {
        if ( ! name.indexOf('on')) {
            name = name.replace('on', '');
        }
        element.addEventListener(name, handler, false);
    } else if (element.attachEvent) {
        if (name.indexOf('on')) {
            name = 'on' + name;
        }
        element.attachEvent(name, handler);
    }
}

addEvent(document, 'ready', function() {
    html = document.documentElement;
    body = document.getElementsByTagName('body')[0];

    for (var index in library_data.empty) {
        library_data.empty[index] = document.createElement(index);
    }
});

/**
 * Cross browser prevent default
 *
 * @param event	- Event handler
 */
Event.prototype.prevent = function() {
    if (this.preventDefault) {
        this.preventDefault();
    } else if (this.getPreventDefault) {
        this.getPreventDefault();
    } else {
        this.defaultPrevented;
    }
    this.returnValue = false;
};

// Math extension functions
Math.easeInOutQuad = function(t, b, c, d) {
    t /= d / 2;
    if (t < 1) {
        return c / 2 * t * t + b;
    }
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
};
Math.easeInCubic = function(t, b, c, d) {
    var tc = (t /= d) * t * t;
    return b + c * (tc);
};
Math.inOutQuintic = function(t, b, c, d) {
    var ts = (t /= d) * t;
    var tc = ts * t;
    return b + c * (6 * tc * ts + -15 * ts * ts + 10 * tc);
};

/**
 * Scroll events
 *
 * Methods:
 *  keys - Array with keys for disabled
 *
 *  get - Get scroll position
 *      @param {object}         element - (optional) Scroll element
 *      @returns {integer}              - Scroll top position
 *
 *  set - Set scroll position
 *      @param {object}         element - (optional) Scroll element
 *      @param {string/integer} value   - Scroll top position {'top'/'bottom'/integer}
 *
 *  disable   - Disabled scroll events
 *      @param {object}         element - (optional) Scroll element
 *
 *  enable    - Enabled scroll events
 *      @param {object}         element - (optional) Scroll element
 *
 *  smooth - Smooth scroll to position
 *      @param {object}         element  - (optional) HTMLElement or null (null -> html or body)
 *      @param {integer}        to       - Scroll position
 *      @param {integer}        duration - (optional) Animation duration (ms) (200ms by default)
 *      @param {function}       callback - (optional) Callback function after scrolling
 */
var Scroll = {
    // left: 37, up: 38, right: 39, down: 40,
    // spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
    keys: [32, 33, 34, 35, 36, 37, 38, 39, 40]
    , _prevent: function(event) {
        (event || window.event).prevent();
    }
    , _preventKeys: function(event) {
        if (Scroll.keys.inArray(event.keyCode)) {
            Scroll._prevent(event);
            return false;
        }
    }
    , get: function(element) {
        if (isElement(element)) {
            return element.scrollTop;
        }

        if ( ! html ||
             ! body) {
            html = document.documentElement;
            body = document.getElementsByTagName('body')[0];
        }
        return html.scrollTop || body.scrollTop;
    }
    , set: function(element, value) {
        if (typeof value == 'string') {
            switch (value) {
                case 'top':
                    value = 0;
                    break;
                case 'bottom':
                    value = isElement(element) ? element.children[0].clientHeight : body.clientHeight;
                    break;
                default:
                    return;
            }
        }

        if (typeof value != 'number') {
            return;
        }

        if (isElement(element)) {
            element.scrollTop = value.toFixed(0);
        } else {
            html.scrollTop = value.toFixed(0);
            body.scrollTop = value.toFixed(0);
        }
    }
    , disable: function(element) {
        addEvent((isElement(element) ? element : window), 'scroll', this._prevent);
        addEvent((isElement(element) ? element : document), 'keydown', this._preventKeys);
    }
    , enable: function(element) {
        removeEvent((isElement(element) ? element : window), 'scroll', this._prevent);
        removeEvent((isElement(element) ? element : document), 'keydown', this._preventKeys);
    }
    , smooth: function(element, to, duration, callback) {
        if ( ! isInteger(to)) {
            return;
        }

        var self = this;

        duration = (typeof duration == 'undefined') ? 200 : duration;

        var start = this.get(element);
        var distance = to - start;
        var current_time = 0;
        var increment = 20;

        var animateScroll = function() {

            if (distance != (to - start)) {
                start = self.get(element);
                distance = to - start;
                current_time = 0;
            }

            current_time += increment;

            self.set(element, Math.inOutQuintic(current_time, start, distance, duration));

            if (current_time < duration) {
                (function() {
                    return window.requestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        function(callback) {
                            setTimeout(callback, 1000 / 60);
                        };
                })()(animateScroll);
            } else if (isFunction(callback)) {
                callback();
            }
        };

        animateScroll();
    }
};

/**
 * Cookie methods
 *
 * Methods:
 *  get - Get cookie 'value' by 'name'
 *      @param {string} name     - Cookie name
 *      @returns {string}        - Cookie value or ''
 *
 *  set - Set cookie 'value' by 'name'
 *      @param {string} name     - Cookie name
 *      @param {string} value    - Cookie value
 *      @param {object} settings - (optional) Cookie settings
 *          {
 *              @param {integer} expires - (optional) (365 days by default) Days cookie expires
 *              @param {string}  domain  - (optional) (current domain by default) Cookie scope domain
 *              @param {string}  path    - (optional) ('/' by default) Cookie scope path
 *  		}
 *
 *  delete - Delete cookie by 'name'
 *      @param {string} name     - Cookie name
 */
var Cookie = {
    get: function(name) {
        var arr_cookies = document.cookie.split(';');
        for (var cookie_index in arr_cookies) {
            var cookie_item = arr_cookies[cookie_index].trim().split('=');
            if (cookie_item[0] == name) {
                return cookie_item[1];
            }
        }
        return '';
    }
    , set: function(name, value, settings) {
        if ( ! name) {
            return;
        }

        if ( ! settings) {
            settings = {};
        }

        var data = {};

        var date = new Date();
        date.setTime(date.getTime() + ((settings.expires || 365) * 24 * 60 * 60 * 1000));

        data[name] = value;
        data.expires = date.toUTCString();
        data.domain = settings.domain || window.location.hostname;
        data.path = settings.path || '/';

        document.cookie = Object.keys(data)
            .map(function(key) {
                return key + '=' + data[key];
            }).join('; ');
    }
    , delete: function(name) {
        this.set(name, '', { expires: -1 });
    }
};

/**
 * Redirect to action with obj_data
 *
 * @param {object} params:
 * 		{string} action		- Action for form
 * 		{string} method		- (optional) Send method ('post'(by default)/'get')
 * 		{object} obj_data	- Object with params
 */
function redirectWithForm(params) {

	if ( ! params.action) {
		return;
	}

    var empty_form = document.createElement('form');
    var empty_input = document.createElement('input');

    empty_form.innerHTML = '';

    empty_form.method = params.method || 'post';
    empty_form.action = params.action;
    empty_form.enctype = 'application/x-www-form-urlencoded';

    for (var name in params.obj_data) {
        empty_input.type = 'hidden';
        empty_input.name = name;
        empty_input.value = params.obj_data[name];
        empty_form.appendChild(empty_input.cloneNode(true));
    }

    body.appendChild(empty_form);
    setTimeout(function() {
        empty_form.submit();
    }, 0);
}


/** Methods for class name manipulation */
/**
 * Get outer html element or set inner html
 *
 * @param {string}  html    - HTML for paste
 * @param {boolean} replace - (optional) Remove current element childrens
 * @returns {string} - Return outer HTML (for get) || undefined (for set)
 */
Element.prototype.html = function(html, replace) {
    var self = this;
    var empty_div = document.createElement(this.tagName.toLowerCase());

    if (html) {
        if (replace) {
            this.innerHTML = '';
        }

        empty_div.innerHTML = html;

        [].slice.call(empty_div.children)
            .forEach(function(item) {
                if (isElement(item)) {
                    self.appendChild(item.cloneNode(true));
                }
            });

        return;
    }

    if (this.outerHTML) {
        return this.outerHTML;
    }

    empty_div.appendChild(this.cloneNode(true));
    var result = empty_div.innerHTML;
    return result;
};

/**
 * Exist class name an element
 *
 * @param {string} class_name - Class name for existing checking
 * @returns {boolean} - Class exist
 */
Element.prototype.hasClass = function(class_name) {
    if (this.classList) {
        return this.classList.contains(class_name);
    }
    return (this.className.split(' ').indexOf(class_name) > -1);
};

/**
 * Add class name to element
 *
 * @param {string} class_name - Class name for adding
 * @returns {HTMLElement} - this
 */
Element.prototype.addClass = function(class_name) {
    if ( ! this.hasClass(class_name)) {
        if (this.classList) {
            this.classList.add(class_name);
        } else {
            var classes = this.className.split(' ');
            classes.push(class_name);
            this.className = classes
                .filter(function(item_class) {
                    return item_class;
                }).join(' ');
        }
    }

    return this;
};

/**
 * Remove class name from element
 *
 * @param {string} class_name - Class name for removing
 * @returns {HTMLElement} - this
 */
Element.prototype.removeClass = function(class_name) {
    if (this.hasClass(class_name)) {
        if (this.classList) {
            this.classList.remove(class_name);
        } else {
            var classes = this.className.split(' ');
            this.className = classes
                .filter(function(item_class) {
                    return item_class &&
                        item_class != class_name;
                }).join(' ');
        }
    }

    return this;
};

/**
 * Toggle class name an element
 *
 * @param {string} class_name - Class name for toggle
 * @returns {HTMLElement} - this
 */
Element.prototype.toggleClass = function(class_name) {
    if (this.classList) {
        this.classList.toggle(class_name);
        return this;
    }

    if (this.hasClass(class_name)) {
        this.removeClass(class_name);
    } else {
        this.addClass(class_name);
    }

    return this;
};

/**
 * Get offset (top, left) element
 *
 * @param   {element} parent - (optional) (html by default) Parent Element for this
 * @returns {object} - Offset for current element
 */
Element.prototype.offset = function(parent) {
    var isset_parent = isElement(parent || {});

    var offset = {
        top: 0
        , left: 0
    };

    var element = this;

    while (element) {
        if (isset_parent &&
            element === parent) {

            break;
        }
        offset.top += element.offsetTop;
        offset.left += element.offsetLeft;
        element = element.offsetParent;
    }

    return offset;
};

/**
 * Remove element from DOM
 */
Element.prototype.remove = function() {
    if (this.parentNode) {
        this.parentNode.removeChild(this);
    }
};

/**
 * Get element style value
 *
 * @param   {string} style - Style name
 * @returns {string} - Style value
 */
Element.prototype.getCSS = function(style) {
    var computedStyle = null;
    if (typeof this.currentStyle == 'undefined') {
        computedStyle = document.defaultView.getComputedStyle(this, null);
    } else {
        computedStyle = this.currentStyle;
    }
    return computedStyle[style];
};


/** Methods for strings */
/**
 * Encode HTML string
 *
 * @returns {string} - Encoded string
 */
String.prototype.encode = function() {
    return this.replace(/[&<>"']/g, function($0) {
        return '&' + {
                '&': 'amp'
                , '<':'lt'
                , '>':'gt'
                , '"':'quot'
                , "'":'#39'
            }[$0] + ';';
    });
};

/**
 * Decode HTML string
 *
 * @param {boolean} raw_url_encode - Encode string after PHP rawurlencode()
 * @returns {string} - Decoded string
 */
String.prototype.decode = function(raw_url_encode) {
    if (raw_url_encode) {
        return decodeURIComponent(this).replace(/\x22|%22/g, '"');
    }
    var empty_textarea = document.createElement('textarea');
    empty_textarea.innerHTML = this;
    return empty_textarea.value;
};

/**
 * Replace all substrings in string with symbols escaping
 *
 * @param {string}  reg_exp       - Regular expression pattern
 * @param {string}  new_substring - New substring
 * @param {boolean} escape	      - (optional) Escape string
 * @returns {string} - Replaced string
 */
String.prototype.replaceAll = function(reg_exp, new_substring, escape) {
    if (escape) {
        new_substring = new_substring.encode();
    }
    return this.replace(new RegExp(reg_exp, 'g'), function() { return new_substring; });
};

/**
 * Replace all placeholders in string with symbols escaping
 *
 * @param {string}  reg_exp       - Regular expression pattern
 * @param {string}  new_substring - New substring
 * @param {boolean} escape	      - (optional) Escape string
 * @returns {string} - Replaced string
 */
String.prototype.replacePHs = function(reg_exp, new_substring, escape) {
    return this.replaceAll(('%%' + reg_exp + '%%'), new_substring, escape);
};

/**
 * Make string to capitalize style
 *
 * @returns {string} - Capitalize string
 */
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

/**
 * Repeat string X count
 *
 * @param {integer} num - Count repeat
 * @returns {string} - Repeatable string
 */
String.prototype.repeat = function(num) {
    if ( ! isInteger(num)) {
        return this;
    }
    return new Array(num * 1 + 1).join(this);
};


/** Methods for array */
/**
 * Isset value on array
 *
 * @returns {boolean} - Comparse result
 */
Object.defineProperty(Array.prototype, 'inArray', {
    enumerable: false
    , value: function(item) {
        return (this.indexOf(item) > -1);
    }
});

/**
 * Get min value from array
 *
 * @returns {number} - Min value from array
 */
Object.defineProperty(Array.prototype, 'min', {
    enumerable: false
    , value: function() {
        return Math.min.apply(Math, this);
    }
});

/**
 * Get max value from array
 *
 * @returns {number} - Max value from array
 */
Object.defineProperty(Array.prototype, 'max', {
    enumerable: false
    , value: function() {
        return Math.max.apply(Math, this);
    }
});

/**
 * Get shuffle source array
 *
 * @returns {array} - Array after shuffling
 */
Object.defineProperty(Array.prototype, 'shuffle', {
    enumerable: false
    , value: function() {
        for (var j, x, i = this.length; i; j = Math.floor(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
        return this;
    }
});


/** Methods for object */
/**
 * Return object length
 *
 * @returns {integer} - Count fields and methods on object
 */
Object.defineProperty(Object.prototype, 'length', {
    enumerable: false
    , value: function() {
        var self = this;
        return Object.keys(this)
            .map(function(key) {
                return self[key];
            }).length;
    }
});

/**
 * Serialize object to string for GET request
 *
 * @returns {string} - Object as Get params string
 */
Object.defineProperty(Object.prototype, 'serialize', {
    enumerable: false
    , value: function() {
        var self = this;
        return Object.keys(this)
            .reduce(function(arr, key) {
                if (isArray(self[key])) {
                    self[key].map(function(value) {
                        arr.push(key + '[]=' + encodeURIComponent(value));
                    });
                } else {
                    arr.push(key + '=' + encodeURIComponent(self[key]));
                }
                return arr;
            }, [])
            .join('&');
    }
});


/** Object for select elements */
/**
 * Get element(s) by selector
 *
 * Methods:
 *  id - Get element by Id from document
 *      @param {string} id - Id element without hash (#)
 *      @returns {HTMLElement/undefined} - Select result
 *
 *  query - Get element by CSS selector from document
 *      @param {string} selector  - CSS selector
 *      @param {HTMLElement} root - (optional) Root for search (document by default)
 *      @returns {HTMLElement/undefined} - Select result
 *
 *  queryAll - Get elements by CSS selector from document
 *      @param {string} selector  - CSS selector
 *      @param {HTMLElement} root - (optional) Root for search (document by default)
 *      @returns {array} - Select result
 */
var Selector = {
    id: function(id) {
        return document.getElementById(id);
    }
    , query: function(selector, root) {
        return (isNode(root) ? root : document).querySelector(selector);
    }
    , queryAll: function(selectors, root) {
        return [].slice.call((isNode(root) ? root : document).querySelectorAll(selectors));
    }
};

/**
 * Get random integer between min and max
 *
 * @param {integer} min - Min range value
 * @param {integer} max - Max range value
 * @returns {integer} - Random integer between min and max
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


/** Type checkings */
/**
 * Checking for array type
 *
 * @param {object} obj - Object for checking
 * @returns {boolean} - Checking result
 */
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

/**
 * Checking for integer type
 *
 * @param {string/number} num - Number or string for checking
 * @returns {boolean} - Checking result
 */
function isInteger(num) {
    if (typeof num != 'string' &&
        typeof num != 'number') {
        return false;
    }
    num *= 1;
    return num === Number(num) && num % 1 === 0;
}

/**
 * Checking for float type
 *
 * @param {string/number} num - Number or string for checking
 * @returns {boolean} - Checking result
 */
function isFloat(num) {
    if (typeof num != 'string' &&
        typeof num != 'number') {
        return false;
    }
    num *= 1;
    return num === Number(num) && num % 1 !== 0;
}

/**
 * Checking for DOM element
 *
 * @param {object} obj - Object for checking
 * @returns {boolean} - Checking result
 */
function isElement(obj) {
    return obj == window ||
        (typeof HTMLElement == 'object' ?
        obj instanceof HTMLElement : //DOM2
            (obj &&
            obj !== null &&
            typeof obj == 'object' &&
            obj.nodeType === 1 &&
            typeof obj.nodeName == 'string')
        );
}

/**
 * Checking for DOM node
 *
 * @param {object} obj - Object for checking
 * @returns {boolean} - Checking result
 */
function isNode(obj) {
    return (typeof Node == 'object' ?
        obj instanceof Node :
            (obj &&
            obj !== null &&
            typeof obj == 'object' &&
            typeof obj.nodeType == 'number' &&
            typeof obj.nodeName == 'string')
    );
}

/**
 * Checking for function
 *
 * @param {object} obj - Object for checking
 * @returns {boolean} - Checking result
 */
function isFunction(obj) {
    return (obj &&
    typeof obj == 'function');
}

/**
 * Check isset variable
 *
 * @param {*} param - Param for checking
 * @returns {*} - If param isset, return this, else return empty string
 */
function isset(param) {
    return (
        param &&
        (typeof param != 'undefined') &&
        param !== '' &&
        param !== 0
    ) ? param : '';
}


/**
 * Tag script to body or remove him
 *
 * Methods:
 *  add - Added script tag to page
 *      @param {object} params	- (key src is required) Attributes tag script
 *      @returns {HTMLElement} - Return script element
 *
 *  set - Removed script tag from page
 *      @param {HTMLElement} script - Script element
 */
var Script = {
    add: function(params) {
        if ( ! isset(params) ||
             ! isset(params.src)) {
            return;
        }

        var empty_script = document.createElement('script');

        Object.keys(params)
			.forEach(function(key) {
				empty_script[key] = params[key];
			});

        body.appendChild(empty_script);
        return empty_script;
    }
    , remove: function(script) {
        if (isElement) {
            script.remove();
        }
    }
};


/**
 * AJAX function
 *
 * @param {object} params:
 * 		{string} url    - Request URL
 * 		{string} method	- (optional) ('POST' by default) Request type ('post'/'get')
 * 		{object} data	- (optional) Object with params (
 * 			for files {
 *          	name: 'Masha' - Sended to $_POST[]
 *              , files: {
 *              	custom_filename: element.files[0] - Sended to $_FILES[]
 *              }
 *          })
 *      {object} events - (optional) Callback events
 *          {
 *              wait: function() { ... }                        - (optional) Function while waiting response
 *              , success: function(response_text) { ... }      - (optional) Function on success
 *              , error: function(response_text, xhr) { ... }   - (optional) Function on error
 *              , progress: function(event) { ... }             - (optional) Function while uploading progress
 *          }
 */
function AJAX(params) {

	if ( ! params.url) {
		return;
	}

	params.method = params.method || 'POST';
    params.events = params.events || {};

    var xhr = null;

    try { // For: chrome, firefox, safari, opera, yandex, ...
        xhr = new XMLHttpRequest();
    } catch(e) {
        try { // For: IE6+
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        } catch(e1) { // if JS not supported or disabled
            console.log('Browser Not supported!');
            return;
        }
    }

    xhr.onreadystatechange = function() {

        // ready states:
        // 0: uninitialized
        // 1: loading
        // 2: loaded
        // 3: interactive
        // 4: complete

        if (xhr.readyState == 4) { // when result is ready

            library_data.xhr = null;

            var response_text = xhr.responseText;

            try {
                response_text = JSON.parse(response_text);
            } catch (e) { }

            if (xhr.status === 200) { // on success
                if (isFunction(params.events.success)) {
                    params.events.success(response_text, xhr);
                }
            } else { // on error
                if (isFunction(params.events.error)) {
                    console.log(xhr.status + ': ' + xhr.statusText);
                    params.events.error(response_text, xhr);
                }
            }
        } else { // waiting for result
            if (isFunction(params.events.wait)) {
                params.events.wait();
            }
        }
    };

    var data = null;
    params.data = params.data || {};

    if (params.data.files) {
        params.method = 'POST';

        data = new FormData();
        for (var index_param in params.data) {
            if (typeof params.data[index_param] == 'object') {
                for (var index_file in params.data[index_param]) {
                    var item = params.data[index_param][index_file];
                    if (typeof item == 'object') {
                        data.append(index_file, item, item.name);
                    } else {
                        data.append(index_file, item);
                    }
                }
            } else {
                data.append(index_param, params.data[index_param]);
            }
        }
        if (isFunction(params.events.progress)) {
            xhr.upload.onprogress = function(event) {
                // 'progress: ' + event.loaded + ' / ' + event.total;
                params.events.progress(event);
            }
        }
    } else {
        data = params.data.serialize();
    }

    params.method = params.method.toUpperCase();

    if (params.method == 'GET' &&
		data) {
        params.url += '?' + data;
    }

    xhr.open(params.method, params.url, true);

    if ( ! params.data.files) {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	xhr.withCredentials = true;
    xhr.send(data);

    library_data.xhr = xhr;
}

// function example_AJAX_data() {
//     var req_param = {
//         foo: 'masha'
//         , bar: 'petya'
//     };
//
//     AJAX({
//         url: 'http://ipinfo.io/127.0.0.1/json'
//         , method: 'POST'
//         , data: req_param
//         , events: {
//             wait: function() {
//                 console.log('wait');
//             }
//             , success: function(data) {
//                 console.log(data);
//             }
//             , error: function(text, xhr) {}
//             , progress: function() {}
//         }
//     });
// }
//
// function example_AJAX_file(element) {
//     var req_param = {
//         foo: 'masha'
//         , files: {
//             uploadlogo: element.files[0]
//         }
//     };
//
//     AJAX({
//         url: 'http://ipinfo.io/127.0.0.1/json'
//         , method: 'POST'
//         , data: req_param
//         , events: {
//             wait: function() {
//                 console.log('wait');
//             }
//             , success: function(data) {
//                 console.log(data);
//             }
//             , error: function(text, xhr) {}
//             , progress: function() {}
//         }
//     });
// }

/**
 * Object for URL hash
 *
 * Methods:
 *  get - Converting hash-string to object with params
 *      @returns {object}
 *
 *  set - Converting object with params to hash-string and set him
 *
 *  @param {object} delimiters - (optional) Object with params (
 *        {
 *            values: 'string'  - (optional) Delimiter for values
 *            , pairs: 'string' - (optional) Delimiter for pairs 'key' -> 'value'
 *        })
 *
 *  @param {object} params - Object with params (
 *        {
 *            key: value
 *            , key: value
 *        })
 */
var Hash = {
    delimiters: {
        values: '='
        , pairs: '&'
    }
    , empty_default: ''

    , get: function(delimiters, json_contains) {
        delimiters = delimiters || {};
        var obj_hash = {};

        var escape = json_contains ?
            /<|>/g :
            /<|>|\"|\'|\/|%3C|%3E|%22|%27/g;

        var arr_hash = window.location.hash.slice(1)
            .replace(escape, '')
            .split('pairs' in delimiters ? delimiters.pairs : this.delimiters.pairs);

        for (var index_hash in arr_hash) {
            var temp_hash = arr_hash[index_hash].split('values' in delimiters ? delimiters.values : this.delimiters.values);
            if (temp_hash[0]) {
                obj_hash[decodeURIComponent(temp_hash[0])] = decodeURIComponent(isset(temp_hash[1]));
            }
        }

        return obj_hash;
    }

    , set: function(params, delimiters) {
        delimiters = delimiters || {};
        var self = this;

        var hash = Object.keys(params)
            .map(function(key) {
                return [
                    encodeURIComponent(key)
                    , encodeURIComponent(isset(params[key]))
                ].join('values' in delimiters ? delimiters.values : self.delimiters.values);
            }).join('pairs' in delimiters ? delimiters.pairs : this.delimiters.pairs);

        window.location.hash = (hash ? ('#' + hash) : this.empty_default);
    }
};


/**
 * Custom Masonry plugin for tails
 *
 * Examples:
 * 	dom ready / window.onload 	 - MasonryTails.run('.wrappers', true);
 * 	window.onresize 			 - MasonryTails.refresh();
 * 	after changes children count - MasonryTails.refresh(true);
 */
var MasonryTails = {
    _remember_position: false
    , _elements_count_changed: false
    , _wrapper_selector: ''
    , _elements: []

    /**
     * Run handmade Masonry plugin
     *
     * @param {string}  wrapper_selector    - Parents element selector
     * @param {boolean} remember_position   - (optional) Remember children positions in parent columns
     */
    , run: function(wrapper_selector, remember_position) {

        var self = this;

        this._remember_position = remember_position || this._remember_position;
        this._wrapper_selector = wrapper_selector || this._wrapper_selector;

        if ( ! this._wrapper_selector &&
             ! this._elements_count_changed) {
            return;
        }

        this._elements = [];

        Selector.queryAll(this._wrapper_selector)
            .forEach(function(parent) {
                if ( ! parent.children.length) {
                    return;
                }

                var element_index = self._elements.length;

                parent.style.position = 'relative';

                self._elements.push({
                    parent: parent
                    , childs: []
                    , columns: []
                });

                [].slice.call(parent.children)
                    .forEach(function(child) {
                        child.style.position = 'absolute';
                        self._elements[element_index].childs.push(child);
                    });
            });

        if ( ! this._elements.length) {
            return;
        }

        this.refresh();
    }

    /**
     * Refresh tails position
     *
     * @param {boolean} elements_added   - (optional) Refresh array with children elements
     */
    , refresh: function(elements_added) {

        var self = this;

        if ( ! this._wrapper_selector ||
             ! this._elements.length) {
            return;
        }

        if (elements_added) {
            this._elements_count_changed = true;
            this.run();
            return;
        }

        this._elements
            .forEach(function(item) {
                var width_element = item.childs[0].clientWidth;
                var new_columns_count = Math.round(item.parent.clientWidth / width_element);

                if (self._remember_position &&
                    item.columns.length == new_columns_count &&
                    ! self._elements_count_changed) {

                    item.columns
                        .forEach(function(column, column_index) {
                            column.height = 0;
                            column.items
                                .forEach(function(child) {
                                    if ( ! isElement(child)) {
                                        return;
                                    }

                                    child.style.top = column.height + 'px';
                                    child.style.left = width_element * column_index + 'px';
                                    column.height += child.clientHeight;
                                });
                        });

                } else {

                    item.columns = [];

                    while (new_columns_count) {
                        item.columns.push({
                            height: 0
                            , items: []
                        });
                        new_columns_count--;
                    }

                    item.childs
                        .forEach(function(child) {
                            if ( ! isElement(child)) {
                                return;
                            }

                            var heights = item.columns.map(function(obj) { return obj.height; });
                            var index_min = heights.indexOf(heights.min());

                            if (self._remember_position) {
                                item.columns[index_min].items.push(child);
                            }

                            child.style.top = item.columns[index_min].height + 'px';
                            child.style.left = width_element * index_min + 'px';
                            item.columns[index_min].height += child.clientHeight;
                        });

                }

                item.parent.style.height = item.columns.map(function(obj) { return obj.height; }).max() + 'px';
            });

        self._elements_count_changed = false;
    }
};

/**
 * Return current operation system name
 */
function getOs() {

    // mobile version
    //var isMobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(navigator.userAgent);

    // system
    var os = '';

    var clientStrings = [
        {s:'Windows 3.11', r:/Win16/},
        {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
        {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
        {s:'Windows 98', r:/(Windows 98|Win98)/},
        {s:'Windows CE', r:/Windows CE/},
        {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
        {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
        {s:'Windows Server 2003', r:/Windows NT 5.2/},
        {s:'Windows Vista', r:/Windows NT 6.0/},
        {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
        {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
        {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
        {s:'Windows 10', r:/(Windows 10|Windows NT 10.0)/},
        {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
        {s:'Windows ME', r:/Windows ME/},
        {s:'Kindle', r:/Kindle|Silk|KFTT|KFOT|KFJWA|KFJWI|KFSOWI|KFTHWA|KFTHWI|KFAPWA|KFAPWI/},//more priority than android
        {s:'Android', r:/Android/},
        {s:'Open BSD', r:/OpenBSD/},
        {s:'Sun OS', r:/SunOS/},
        {s:'Linux', r:/(Linux|X11)/},
        {s:'iOS', r:/(iPhone|iPad|iPod)/},
        {s:'Mac OS X', r:/Mac OS X/},
        {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
        {s:'QNX', r:/QNX/},
        {s:'UNIX', r:/UNIX/},
        {s:'BeOS', r:/BeOS/},
        {s:'OS/2', r:/OS\/2/},
        {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
    ];

    for (var index in clientStrings) {
        if (clientStrings[index].r.test(navigator.userAgent)) {
            os = clientStrings[index].s;
            break;
        }
    }

    if (os.indexOf('Mac OS') > -1) {
        os = 'macosx';
    } else if (os.indexOf('Android') > -1) {
        os = 'android';
    } else if (os.indexOf('Kindle') > -1) {
        os = 'kindle';
    } else if (os == 'iOS'){
        if (navigator.userAgent.indexOf('iPad') > -1) {
            os = 'ipad';
        } else {
            os = 'iphone';
        }
    } else {
        os = 'windows';
    }
    return os;
}